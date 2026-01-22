import Foundation

// MARK: - Supabase Client
// Direct Supabase REST API calls with JWT token authentication
// This bypasses Next.js APIs and works reliably with iOS auth

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
            urlString += "?\(query)"
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
        guard var filesReq = makeRequest(path: "files", query: "owner_id=eq.\(userId)&is_destroyed=eq.false&select=id,settings") else {
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
            guard var permReq = makeRequest(path: "permissions", query: "file_id=in.(\(fileIds.joined(separator: ",")))&select=id") else {
                throw SupabaseError.notAuthenticated
            }
            permReq.setValue("head", forHTTPHeaderField: "Prefer")
            permReq.setValue("exact", forHTTPHeaderField: "Prefer")
            
            let (permData, permResponse) = try await URLSession.shared.data(for: permReq)
            if let httpResp = permResponse as? HTTPURLResponse,
               let countStr = httpResp.value(forHTTPHeaderField: "content-range"),
               let count = countStr.components(separatedBy: "/").last.flatMap({ Int($0) }) {
                stats.activeShares = count
            } else if let perms = try? JSONSerialization.jsonObject(with: permData) as? [[String: Any]] {
                stats.activeShares = perms.count
            }
            
            // Get blocked count
            guard var blockedReq = makeRequest(path: "access_logs", query: "file_id=in.(\(fileIds.joined(separator: ","))&action=eq.blocked&select=id") else {
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
        
        return files.compactMap { file -> FileItem? in
            guard let id = file["id"] as? String,
                  let name = file["original_name"] as? String else { return nil }
            
            let settings = file["settings"] as? [String: Any]
            let views = settings?["total_views"] as? Int ?? 0
            let createdStr = file["created_at"] as? String ?? ""
            let date = dateFormatter.date(from: createdStr) ?? Date()
            
            return FileItem(
                id: id,
                originalName: name,
                mimeType: file["mime_type"] as? String,
                createdAt: date,
                isDestroyed: file["is_destroyed"] as? Bool ?? false,
                totalViews: views
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
        let createdAt: Date
    }
    
    func getPendingRequests() async throws -> [AccessRequestItem] {
        guard let userId = userId else { throw SupabaseError.notAuthenticated }
        
        // First get my file IDs
        let fileIds = try await getFileIds()
        if fileIds.isEmpty { return [] }
        
        guard let req = makeRequest(path: "access_requests", query: "file_id=in.(\(fileIds.joined(separator: ",")))&status=eq.pending&order=created_at.desc&select=id,file_id,viewer_email,viewer_name,created_at,files(original_name)") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (data, _) = try await URLSession.shared.data(for: req)
        
        guard let requests = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        
        let dateFormatter = ISO8601DateFormatter()
        
        return requests.compactMap { req -> AccessRequestItem? in
            guard let id = req["id"] as? String,
                  let fileId = req["file_id"] as? String,
                  let email = req["viewer_email"] as? String else { return nil }
            
            let files = req["files"] as? [String: Any]
            let createdStr = req["created_at"] as? String ?? ""
            
            return AccessRequestItem(
                id: id,
                fileId: fileId,
                fileName: files?["original_name"] as? String,
                viewerEmail: email,
                viewerName: req["viewer_name"] as? String,
                createdAt: dateFormatter.date(from: createdStr) ?? Date()
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
            default: return "doc.fill"
            }
        }
        
        var iconColor: String {
            switch action {
            case "view": return "cyan"
            case "blocked", "screenshot_attempt": return "red"
            case "access_approved": return "green"
            case "access_denied": return "orange"
            default: return "gray"
            }
        }
    }
    
    func getRecentActivity(limit: Int = 20) async throws -> [ActivityItem] {
        let fileIds = try await getFileIds()
        if fileIds.isEmpty { return [] }
        
        guard let req = makeRequest(path: "access_logs", query: "file_id=in.(\(fileIds.joined(separator: ",")))&order=timestamp.desc&limit=\(limit)&select=id,action,timestamp,location") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (data, _) = try await URLSession.shared.data(for: req)
        
        guard let logs = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        
        let dateFormatter = ISO8601DateFormatter()
        
        return logs.compactMap { log -> ActivityItem? in
            guard let id = log["id"] as? String,
                  let action = log["action"] as? String else { return nil }
            
            let loc = log["location"] as? [String: Any]
            let timestampStr = log["timestamp"] as? String ?? ""
            
            return ActivityItem(
                id: id,
                action: action,
                timestamp: dateFormatter.date(from: timestampStr) ?? Date(),
                viewerEmail: loc?["viewer_email"] as? String,
                city: loc?["city"] as? String,
                country: loc?["country"] as? String
            )
        }
    }
}
