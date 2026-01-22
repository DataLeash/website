import Foundation

// MARK: - Supabase Client
// Direct Supabase REST API calls with JWT token authentication

class SupabaseClient {
    static let shared = SupabaseClient()
    private init() {}
    
    // MARK: - Error Types
    
    enum SupabaseError: LocalizedError {
        case notAuthenticated
        case invalidResponse
        case serverError(String)
        case decodingError(String)
        
        var errorDescription: String? {
            switch self {
            case .notAuthenticated: return "Please sign in"
            case .invalidResponse: return "Invalid response from server"
            case .serverError(let msg): return msg
            case .decodingError(let msg): return "Data error: \(msg)"
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private var userId: String? { AuthService.shared.currentUser?.id }
    private var token: String? { AuthService.shared.accessToken }
    
    private func makeRequest(path: String, query: String = "") -> URLRequest? {
        guard let token = token else { return nil }
        
        var urlString = "\(Config.supabaseURL)/rest/v1/\(path)"
        if !query.isEmpty {
            // URL encode the query properly
            let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
            urlString += "?\(encodedQuery)"
        }
        
        guard let url = URL(string: urlString) else { return nil }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return request
    }
    
    // MARK: - Stats
    
    struct DashboardStats {
        var totalFiles: Int = 0
        var totalViews: Int = 0
        var activeShares: Int = 0
        var threatsBlocked: Int = 0
    }
    
    func getStats() async throws -> DashboardStats {
        guard let userId = userId else { throw SupabaseError.notAuthenticated }
        
        var stats = DashboardStats()
        
        // Get files count and view counts
        guard let filesReq = makeRequest(path: "files", query: "owner_id=eq.\(userId)&is_destroyed=eq.false&select=id,settings") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (filesData, _) = try await URLSession.shared.data(for: filesReq)
        if let files = try? JSONSerialization.jsonObject(with: filesData) as? [[String: Any]] {
            stats.totalFiles = files.count
            
            // Sum up views from settings.total_views
            for file in files {
                if let settings = file["settings"] as? [String: Any],
                   let views = settings["total_views"] as? Int {
                    stats.totalViews += views
                }
            }
        }
        
        // Get active permissions count
        let fileIds = try await getFileIds()
        if !fileIds.isEmpty {
            let idsJoined = fileIds.joined(separator: ",")
            
            guard let permReq = makeRequest(path: "permissions", query: "file_id=in.(\(idsJoined))&select=id") else {
                throw SupabaseError.notAuthenticated
            }
            
            let (permData, _) = try await URLSession.shared.data(for: permReq)
            if let perms = try? JSONSerialization.jsonObject(with: permData) as? [[String: Any]] {
                stats.activeShares = perms.count
            }
            
            // Get blocked count
            guard let blockedReq = makeRequest(path: "access_logs", query: "file_id=in.(\(idsJoined))&action=eq.blocked&select=id") else {
                throw SupabaseError.notAuthenticated
            }
            
            let (blockedData, _) = try await URLSession.shared.data(for: blockedReq)
            if let blocked = try? JSONSerialization.jsonObject(with: blockedData) as? [[String: Any]] {
                stats.threatsBlocked = blocked.count
            }
        }
        
        return stats
    }
    
    private func getFileIds() async throws -> [String] {
        guard let userId = userId else { return [] }
        
        guard let req = makeRequest(path: "files", query: "owner_id=eq.\(userId)&is_destroyed=eq.false&select=id") else {
            return []
        }
        
        let (data, _) = try await URLSession.shared.data(for: req)
        if let files = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            return files.compactMap { $0["id"] as? String }
        }
        return []
    }
    
    // MARK: - Files
    
    struct FileItem: Identifiable {
        let id: String
        let originalName: String
        let mimeType: String?
        let createdAt: Date
        let isDestroyed: Bool
        let totalViews: Int
        let shareableLink: String
        
        var iconName: String {
            guard let type = mimeType else { return "doc.fill" }
            if type.contains("image") { return "photo.fill" }
            if type.contains("pdf") { return "doc.richtext.fill" }
            if type.contains("video") { return "video.fill" }
            return "doc.fill"
        }
    }
    
    func getMyFiles() async throws -> [FileItem] {
        guard let userId = userId else { throw SupabaseError.notAuthenticated }
        
        guard let req = makeRequest(path: "files", query: "owner_id=eq.\(userId)&is_destroyed=eq.false&order=created_at.desc&select=id,original_name,mime_type,created_at,is_destroyed,settings") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (data, _) = try await URLSession.shared.data(for: req)
        
        guard let files = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        return files.compactMap { file -> FileItem? in
            guard let id = file["id"] as? String,
                  let name = file["original_name"] as? String else { return nil }
            
            let settings = file["settings"] as? [String: Any]
            let views = settings?["total_views"] as? Int ?? 0
            let createdStr = file["created_at"] as? String ?? ""
            
            // Try with fractional seconds first, then without
            var date = dateFormatter.date(from: createdStr)
            if date == nil {
                let simpleFormatter = ISO8601DateFormatter()
                date = simpleFormatter.date(from: createdStr)
            }
            
            return FileItem(
                id: id,
                originalName: name,
                mimeType: file["mime_type"] as? String,
                createdAt: date ?? Date(),
                isDestroyed: file["is_destroyed"] as? Bool ?? false,
                totalViews: views,
                shareableLink: "\(Config.apiBaseURL)/view/\(id)"
            )
        }
    }
    
    func killFile(fileId: String) async throws {
        guard var req = makeRequest(path: "files", query: "id=eq.\(fileId)") else {
            throw SupabaseError.notAuthenticated
        }
        req.httpMethod = "PATCH"
        req.httpBody = try JSONSerialization.data(withJSONObject: [
            "is_destroyed": true,
            "destroyed_at": ISO8601DateFormatter().string(from: Date())
        ])
        
        let (_, response) = try await URLSession.shared.data(for: req)
        guard let httpResp = response as? HTTPURLResponse, (200...299).contains(httpResp.statusCode) else {
            throw SupabaseError.serverError("Failed to kill file")
        }
    }
    
    // MARK: - Access Requests
    
    struct AccessRequestItem: Identifiable {
        let id: String
        let fileId: String
        let fileName: String?
        let viewerEmail: String
        let viewerName: String?
        let status: String
        let createdAt: Date
        let ipAddress: String?
        let deviceInfo: String?
    }
    
    func getPendingRequests() async throws -> [AccessRequestItem] {
        // First get my file IDs
        let fileIds = try await getFileIds()
        if fileIds.isEmpty { return [] }
        
        let idsJoined = fileIds.joined(separator: ",")
        
        // Fetch access requests - note: we fetch status=pending only
        guard let req = makeRequest(path: "access_requests", query: "file_id=in.(\(idsJoined))&status=eq.pending&order=created_at.desc&select=*") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (data, response) = try await URLSession.shared.data(for: req)
        
        // Debug: print response
        if let httpResp = response as? HTTPURLResponse {
            print("Access requests status: \(httpResp.statusCode)")
        }
        
        guard let requests = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            print("Failed to parse access requests")
            return []
        }
        
        print("Found \(requests.count) pending requests")
        
        // Get file names separately
        var fileNames: [String: String] = [:]
        if !fileIds.isEmpty {
            if let filesReq = makeRequest(path: "files", query: "id=in.(\(idsJoined))&select=id,original_name") {
                let (filesData, _) = try await URLSession.shared.data(for: filesReq)
                if let files = try? JSONSerialization.jsonObject(with: filesData) as? [[String: Any]] {
                    for file in files {
                        if let id = file["id"] as? String, let name = file["original_name"] as? String {
                            fileNames[id] = name
                        }
                    }
                }
            }
        }
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        return requests.compactMap { req -> AccessRequestItem? in
            guard let id = req["id"] as? String,
                  let fileId = req["file_id"] as? String,
                  let email = req["viewer_email"] as? String else { return nil }
            
            let createdStr = req["created_at"] as? String ?? ""
            var date = dateFormatter.date(from: createdStr)
            if date == nil {
                let simpleFormatter = ISO8601DateFormatter()
                date = simpleFormatter.date(from: createdStr)
            }
            
            return AccessRequestItem(
                id: id,
                fileId: fileId,
                fileName: fileNames[fileId],
                viewerEmail: email,
                viewerName: req["viewer_name"] as? String,
                status: req["status"] as? String ?? "pending",
                createdAt: date ?? Date(),
                ipAddress: req["ip_address"] as? String,
                deviceInfo: req["device_info"] as? String
            )
        }
    }
    
    func getAllRequests() async throws -> [AccessRequestItem] {
        // First get my file IDs
        let fileIds = try await getFileIds()
        if fileIds.isEmpty { return [] }
        
        let idsJoined = fileIds.joined(separator: ",")
        
        // Fetch ALL access requests (not just pending)
        guard let req = makeRequest(path: "access_requests", query: "file_id=in.(\(idsJoined))&order=created_at.desc&select=*") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (data, _) = try await URLSession.shared.data(for: req)
        
        guard let requests = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        
        // Get file names
        var fileNames: [String: String] = [:]
        if let filesReq = makeRequest(path: "files", query: "id=in.(\(idsJoined))&select=id,original_name") {
            let (filesData, _) = try await URLSession.shared.data(for: filesReq)
            if let files = try? JSONSerialization.jsonObject(with: filesData) as? [[String: Any]] {
                for file in files {
                    if let id = file["id"] as? String, let name = file["original_name"] as? String {
                        fileNames[id] = name
                    }
                }
            }
        }
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        return requests.compactMap { req -> AccessRequestItem? in
            guard let id = req["id"] as? String,
                  let fileId = req["file_id"] as? String,
                  let email = req["viewer_email"] as? String else { return nil }
            
            let createdStr = req["created_at"] as? String ?? ""
            var date = dateFormatter.date(from: createdStr)
            if date == nil {
                let simpleFormatter = ISO8601DateFormatter()
                date = simpleFormatter.date(from: createdStr)
            }
            
            return AccessRequestItem(
                id: id,
                fileId: fileId,
                fileName: fileNames[fileId],
                viewerEmail: email,
                viewerName: req["viewer_name"] as? String,
                status: req["status"] as? String ?? "pending",
                createdAt: date ?? Date(),
                ipAddress: req["ip_address"] as? String,
                deviceInfo: req["device_info"] as? String
            )
        }
    }
    
    func respondToRequest(requestId: String, approve: Bool) async throws {
        guard var req = makeRequest(path: "access_requests", query: "id=eq.\(requestId)") else {
            throw SupabaseError.notAuthenticated
        }
        req.httpMethod = "PATCH"
        req.httpBody = try JSONSerialization.data(withJSONObject: [
            "status": approve ? "approved" : "denied",
            "updated_at": ISO8601DateFormatter().string(from: Date())
        ])
        
        let (_, response) = try await URLSession.shared.data(for: req)
        guard let httpResp = response as? HTTPURLResponse, (200...299).contains(httpResp.statusCode) else {
            throw SupabaseError.serverError("Failed to respond to request")
        }
    }
    
    // MARK: - Activity
    
    struct ActivityItem: Identifiable {
        let id: String
        let action: String
        let fileName: String?
        let timestamp: Date
        let viewerEmail: String?
        let city: String?
        let country: String?
        
        var iconName: String {
            switch action {
            case "view": return "eye.fill"
            case "blocked": return "shield.slash.fill"
            case "access_approved": return "checkmark.circle.fill"
            case "access_denied": return "xmark.circle.fill"
            case "screenshot_attempt": return "camera.metering.unknown"
            case "download": return "arrow.down.circle.fill"
            default: return "doc.fill"
            }
        }
        
        var iconColor: String {
            switch action {
            case "view": return "cyan"
            case "blocked", "screenshot_attempt": return "red"
            case "access_approved": return "green"
            case "access_denied": return "orange"
            case "download": return "blue"
            default: return "gray"
            }
        }
        
        var displayAction: String {
            switch action {
            case "view": return "Viewed file"
            case "blocked": return "Access blocked"
            case "access_approved": return "Access approved"
            case "access_denied": return "Access denied"
            case "screenshot_attempt": return "Screenshot attempt"
            case "download": return "Downloaded file"
            default: return action.replacingOccurrences(of: "_", with: " ").capitalized
            }
        }
    }
    
    func getRecentActivity(limit: Int = 20) async throws -> [ActivityItem] {
        let fileIds = try await getFileIds()
        if fileIds.isEmpty { return [] }
        
        let idsJoined = fileIds.joined(separator: ",")
        
        guard let req = makeRequest(path: "access_logs", query: "file_id=in.(\(idsJoined))&order=timestamp.desc&limit=\(limit)&select=id,action,timestamp,location,file_id") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (data, _) = try await URLSession.shared.data(for: req)
        
        guard let logs = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        
        // Get file names
        var fileNames: [String: String] = [:]
        if let filesReq = makeRequest(path: "files", query: "id=in.(\(idsJoined))&select=id,original_name") {
            let (filesData, _) = try await URLSession.shared.data(for: filesReq)
            if let files = try? JSONSerialization.jsonObject(with: filesData) as? [[String: Any]] {
                for file in files {
                    if let id = file["id"] as? String, let name = file["original_name"] as? String {
                        fileNames[id] = name
                    }
                }
            }
        }
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        return logs.compactMap { log -> ActivityItem? in
            guard let id = log["id"] as? String,
                  let action = log["action"] as? String else { return nil }
            
            let loc = log["location"] as? [String: Any]
            let timestampStr = log["timestamp"] as? String ?? ""
            let fileId = log["file_id"] as? String
            
            var date = dateFormatter.date(from: timestampStr)
            if date == nil {
                let simpleFormatter = ISO8601DateFormatter()
                date = simpleFormatter.date(from: timestampStr)
            }
            
            return ActivityItem(
                id: id,
                action: action,
                fileName: fileId.flatMap { fileNames[$0] },
                timestamp: date ?? Date(),
                viewerEmail: loc?["viewer_email"] as? String,
                city: loc?["city"] as? String,
                country: loc?["country"] as? String
            )
        }
    }
}
