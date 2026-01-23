import Foundation
import SwiftUI

// MARK: - Shared Models

// BlacklistEntry Model
struct BlacklistEntry: Identifiable, Codable {
    let id: String
    let blocked_email: String
    let blocked_name: String?
    let reason: String?
    let blocked_at: String
    let match_count: Int
    let last_match_at: String?
    let ip_info: IpInfo?
    let fingerprint: DeviceFingerprint?
    
    struct IpInfo: Codable {
        let city: String?
        let country: String?
    }
    
    struct DeviceFingerprint: Codable {
        let browser: String?
        let os: String?
    }
}

// FileAnalytics Model
struct FileAnalytics: Identifiable {
    let id: String
    let fileName: String
    let totalViews: Int
    let uniqueViewers: Int
    let avgDuration: Int
    let threatEvents: Int
    let lastViewed: Date?
}

// OverallAnalytics Model
struct OverallAnalytics {
    var totalViews: Int = 0
    var uniqueViewers: Int = 0
    var avgDuration: Int = 0
    var threatEvents: Int = 0
}

// SecurityEvent Model
struct SecurityEvent: Identifiable {
    let id: String
    let type: SecurityEventType
    let message: String
    let timestamp: Date
    let details: String?
    
    enum SecurityEventType {
        case blocked
        case denied
        case threat
        case warning
        case success
        
        var icon: String {
            switch self {
            case .blocked: return "hand.raised.slash.fill"
            case .denied: return "xmark.circle.fill"
            case .threat: return "exclamationmark.triangle.fill"
            case .warning: return "exclamationmark.circle.fill"
            case .success: return "checkmark.circle.fill"
            }
        }
        
        var color: Color {
            switch self {
            case .blocked, .denied, .threat: return .red
            case .warning: return .orange
            case .success: return .green
            }
        }
    }
}

// MapLocation Model for WorldMapView
struct MapLocation: Identifiable {
    let id: String
    let lat: Double
    let lon: Double
    let city: String
    let country: String
    let countryCode: String
    let isActive: Bool
    let isBlocked: Bool
    let viewerCount: Int
    let lastAccess: Date
    let viewerEmail: String?
    let viewerName: String?
    let deviceType: String?
    let browser: String?
    let files: [String]
    
    var coordinate: (lat: Double, lon: Double) {
        (lat, lon)
    }
    
    var statusColor: Color {
        if isBlocked { return .red }
        if isActive { return .green }
        return .cyan
    }
}

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
    
    // MARK: - Blacklist
    
    func getBlacklist() async throws -> [BlacklistEntry] {
        guard let userId = userId else { throw SupabaseError.notAuthenticated }
        
        guard let req = makeRequest(path: "blacklist", query: "owner_id=eq.\(userId)&order=blocked_at.desc") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (data, response) = try await URLSession.shared.data(for: req)
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode >= 400 {
            // Table might not exist
            let errorStr = String(data: data, encoding: .utf8) ?? "Unknown error"
            if errorStr.contains("does not exist") {
                return []
            }
            throw SupabaseError.serverError(errorStr)
        }
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        do {
            return try decoder.decode([BlacklistEntry].self, from: data)
        } catch {
            return []
        }
    }
    
    func addToBlacklist(email: String, reason: String) async throws {
        guard let userId = userId, let token = token else { throw SupabaseError.notAuthenticated }
        
        let urlString = "\(Config.supabaseURL)/rest/v1/blacklist"
        guard let url = URL(string: urlString) else { throw SupabaseError.invalidResponse }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "owner_id": userId,
            "blocked_email": email,
            "reason": reason,
            "blocked_at": ISO8601DateFormatter().string(from: Date()),
            "match_count": 0
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode >= 400 {
            throw SupabaseError.serverError("Failed to add to blacklist")
        }
    }
    
    func removeFromBlacklist(id: String) async throws {
        guard let token = token else { throw SupabaseError.notAuthenticated }
        
        let urlString = "\(Config.supabaseURL)/rest/v1/blacklist?id=eq.\(id)"
        guard let url = URL(string: urlString) else { throw SupabaseError.invalidResponse }
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode >= 400 {
            throw SupabaseError.serverError("Failed to remove from blacklist")
        }
    }
    
    // MARK: - Leakers
    
    struct LeakerItem: Identifiable, Codable {
        let id: String
        let originalRecipientEmail: String
        let originalRecipientName: String?
        let fileId: String
        let fileName: String?
        let unauthorizedIp: String?
        let unauthorizedLocation: String?
        let detectionType: String
        let similarityScore: Double
        var status: String
        let detectedAt: String
        
        enum CodingKeys: String, CodingKey {
            case id
            case originalRecipientEmail = "original_recipient_email"
            case originalRecipientName = "original_recipient_name"
            case fileId = "file_id"
            case fileName = "file_name"
            case unauthorizedIp = "unauthorized_ip"
            case unauthorizedLocation = "unauthorized_location"
            case detectionType = "detection_type"
            case similarityScore = "similarity_score"
            case status
            case detectedAt = "detected_at"
        }
    }
    
    struct LeakerCounts {
        var unreviewed: Int = 0
        var confirmed: Int = 0
        var blacklisted: Int = 0
    }
    
    func getLeakers() async throws -> (leakers: [LeakerItem], counts: LeakerCounts) {
        guard let userId = userId else { throw SupabaseError.notAuthenticated }
        
        guard let req = makeRequest(path: "suspected_leakers", query: "owner_id=eq.\(userId)&order=detected_at.desc") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (data, response) = try await URLSession.shared.data(for: req)
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode >= 400 {
            return ([], LeakerCounts())
        }
        
        let decoder = JSONDecoder()
        
        do {
            let leakers = try decoder.decode([LeakerItem].self, from: data)
            var counts = LeakerCounts()
            
            for leaker in leakers {
                switch leaker.status {
                case "unreviewed": counts.unreviewed += 1
                case "confirmed_leak": counts.confirmed += 1
                case "blacklisted": counts.blacklisted += 1
                default: break
                }
            }
            
            return (leakers, counts)
        } catch {
            return ([], LeakerCounts())
        }
    }
    
    func updateLeakerStatus(leakerId: String, status: String) async throws {
        guard let token = token else { throw SupabaseError.notAuthenticated }
        
        let urlString = "\(Config.supabaseURL)/rest/v1/suspected_leakers?id=eq.\(leakerId)"
        guard let url = URL(string: urlString) else { throw SupabaseError.invalidResponse }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = ["status": status]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode >= 400 {
            throw SupabaseError.serverError("Failed to update leaker status")
        }
    }
    
    // MARK: - Analytics
    
    func getFileAnalytics() async throws -> (files: [FileAnalytics], overall: OverallAnalytics) {
        guard let userId = userId else { throw SupabaseError.notAuthenticated }
        
        var fileAnalytics: [FileAnalytics] = []
        var overall = OverallAnalytics()
        
        // Get files with settings for views
        guard let filesReq = makeRequest(path: "files", query: "owner_id=eq.\(userId)&is_destroyed=eq.false&select=id,original_name,settings,created_at") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (filesData, _) = try await URLSession.shared.data(for: filesReq)
        guard let files = try? JSONSerialization.jsonObject(with: filesData) as? [[String: Any]] else {
            return ([], overall)
        }
        
        let fileIds = files.compactMap { $0["id"] as? String }
        if fileIds.isEmpty { return ([], overall) }
        
        let idsJoined = fileIds.joined(separator: ",")
        
        // Get access logs for analytics
        guard let logsReq = makeRequest(path: "access_logs", query: "file_id=in.(\(idsJoined))&select=file_id,action,duration") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (logsData, _) = try await URLSession.shared.data(for: logsReq)
        let logs = (try? JSONSerialization.jsonObject(with: logsData) as? [[String: Any]]) ?? []
        
        // Aggregate logs by file
        var logsByFile: [String: (views: Int, durations: [Int], threats: Int)] = [:]
        var uniqueViewersSet: Set<String> = []
        
        for log in logs {
            guard let fileId = log["file_id"] as? String,
                  let action = log["action"] as? String else { continue }
            
            if logsByFile[fileId] == nil {
                logsByFile[fileId] = (views: 0, durations: [], threats: 0)
            }
            
            if action == "view" {
                logsByFile[fileId]?.views += 1
                if let duration = log["duration"] as? Int {
                    logsByFile[fileId]?.durations.append(duration)
                }
                overall.totalViews += 1
            } else if action == "blocked" || action == "screenshot_attempt" {
                logsByFile[fileId]?.threats += 1
                overall.threatEvents += 1
            }
        }
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        for file in files {
            guard let id = file["id"] as? String,
                  let name = file["original_name"] as? String else { continue }
            
            let settings = file["settings"] as? [String: Any]
            let totalViews = settings?["total_views"] as? Int ?? logsByFile[id]?.views ?? 0
            let uniqueViewers = settings?["unique_viewers"] as? Int ?? 0
            let avgDuration = (logsByFile[id]?.durations.isEmpty == false) 
                ? logsByFile[id]!.durations.reduce(0, +) / logsByFile[id]!.durations.count 
                : 0
            
            var lastViewed: Date? = nil
            if let lastViewedStr = settings?["last_viewed"] as? String {
                lastViewed = dateFormatter.date(from: lastViewedStr)
            }
            
            fileAnalytics.append(FileAnalytics(
                id: id,
                fileName: name,
                totalViews: totalViews,
                uniqueViewers: uniqueViewers,
                avgDuration: avgDuration,
                threatEvents: logsByFile[id]?.threats ?? 0,
                lastViewed: lastViewed
            ))
            
            overall.uniqueViewers += uniqueViewers
        }
        
        // Calculate overall average duration
        let allDurations = logsByFile.values.flatMap { $0.durations }
        overall.avgDuration = allDurations.isEmpty ? 0 : allDurations.reduce(0, +) / allDurations.count
        
        return (fileAnalytics, overall)
    }
    
    // MARK: - Security
    
    func getSecurityData() async throws -> (score: Int, events: [SecurityEvent]) {
        guard let userId = userId else { throw SupabaseError.notAuthenticated }
        
        var score = 100
        var events: [SecurityEvent] = []
        
        let fileIds = try await getFileIds()
        if fileIds.isEmpty { return (score, events) }
        
        let idsJoined = fileIds.joined(separator: ",")
        
        // Get security-related logs
        guard let logsReq = makeRequest(path: "access_logs", query: "file_id=in.(\(idsJoined))&action=in.(blocked,screenshot_attempt,access_denied)&order=timestamp.desc&limit=20") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (logsData, _) = try await URLSession.shared.data(for: logsReq)
        guard let logs = try? JSONSerialization.jsonObject(with: logsData) as? [[String: Any]] else {
            return (score, events)
        }
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        for log in logs {
            guard let id = log["id"] as? String,
                  let action = log["action"] as? String,
                  let timestampStr = log["timestamp"] as? String else { continue }
            
            let timestamp = dateFormatter.date(from: timestampStr) ?? Date()
            let location = log["location"] as? [String: Any]
            
            let eventType: SecurityEvent.SecurityEventType
            let message: String
            
            switch action {
            case "blocked":
                eventType = .blocked
                message = "Access blocked from suspicious device"
                score = max(score - 5, 0)
            case "screenshot_attempt":
                eventType = .threat
                message = "Screenshot attempt detected"
                score = max(score - 10, 0)
            case "access_denied":
                eventType = .denied
                message = "Access request denied"
                score = max(score - 2, 0)
            default:
                eventType = .warning
                message = action.replacingOccurrences(of: "_", with: " ").capitalized
            }
            
            var details: String? = nil
            if let city = location?["city"] as? String, let country = location?["country"] as? String {
                details = "Location: \(city), \(country)"
            }
            
            events.append(SecurityEvent(
                id: id,
                type: eventType,
                message: message,
                timestamp: timestamp,
                details: details
            ))
        }
        
        // Ensure minimum score of 40 if there are any files
        score = max(score, 40)
        
        return (score, events)
    }
    
    // MARK: - Map Locations
    
    func getAccessLocations() async throws -> (locations: [MapLocation], stats: MapStats) {
        guard let userId = userId else { throw SupabaseError.notAuthenticated }
        
        let fileIds = try await getFileIds()
        if fileIds.isEmpty { return ([], MapStats()) }
        
        let idsJoined = fileIds.joined(separator: ",")
        
        // Get access logs with location data
        guard let logsReq = makeRequest(path: "access_logs", query: "file_id=in.(\(idsJoined))&select=id,file_id,viewer_email,viewer_name,action,location,ip_info,device_fingerprint,timestamp&order=timestamp.desc&limit=200") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (logsData, _) = try await URLSession.shared.data(for: logsReq)
        guard let logs = try? JSONSerialization.jsonObject(with: logsData) as? [[String: Any]] else {
            return ([], MapStats())
        }
        
        // Get file names for reference
        guard let filesReq = makeRequest(path: "files", query: "id=in.(\(idsJoined))&select=id,original_name") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (filesData, _) = try await URLSession.shared.data(for: filesReq)
        let files = (try? JSONSerialization.jsonObject(with: filesData) as? [[String: Any]]) ?? []
        var fileNames: [String: String] = [:]
        for file in files {
            if let id = file["id"] as? String, let name = file["original_name"] as? String {
                fileNames[id] = name
            }
        }
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        // Aggregate by location
        var locationMap: [String: (logs: [[String: Any]], count: Int, lastAccess: Date, isActive: Bool, isBlocked: Bool)] = [:]
        var countries: Set<String> = []
        var activeCount = 0
        var blockedCount = 0
        
        let fiveMinutesAgo = Date().addingTimeInterval(-300)
        
        for log in logs {
            guard let location = log["location"] as? [String: Any],
                  let lat = location["lat"] as? Double ?? location["latitude"] as? Double,
                  let lon = location["lon"] as? Double ?? location["longitude"] as? Double,
                  let city = location["city"] as? String else { continue }
            
            let country = location["country"] as? String ?? "Unknown"
            let countryCode = location["country_code"] as? String ?? ""
            let key = "\(lat),\(lon)"
            
            countries.insert(country)
            
            let timestamp = (log["timestamp"] as? String).flatMap { dateFormatter.date(from: $0) } ?? Date()
            let action = log["action"] as? String ?? ""
            let isActive = timestamp > fiveMinutesAgo && action == "view"
            let isBlocked = action == "blocked" || action == "access_denied"
            
            if isActive { activeCount += 1 }
            if isBlocked { blockedCount += 1 }
            
            if var existing = locationMap[key] {
                existing.logs.append(log)
                existing.count += 1
                if timestamp > existing.lastAccess { existing.lastAccess = timestamp }
                if isActive { existing.isActive = true }
                if isBlocked { existing.isBlocked = true }
                locationMap[key] = existing
            } else {
                locationMap[key] = (logs: [log], count: 1, lastAccess: timestamp, isActive: isActive, isBlocked: isBlocked)
            }
        }
        
        // Build MapLocation array
        var locations: [MapLocation] = []
        
        for (key, data) in locationMap {
            let coords = key.split(separator: ",")
            guard coords.count == 2,
                  let lat = Double(coords[0]),
                  let lon = Double(coords[1]),
                  let firstLog = data.logs.first,
                  let location = firstLog["location"] as? [String: Any] else { continue }
            
            let city = location["city"] as? String ?? "Unknown"
            let country = location["country"] as? String ?? "Unknown"
            let countryCode = location["country_code"] as? String ?? ""
            
            let viewerEmail = firstLog["viewer_email"] as? String
            let viewerName = firstLog["viewer_name"] as? String
            
            let fingerprint = firstLog["device_fingerprint"] as? [String: Any]
            let deviceType = fingerprint?["device_type"] as? String
            let browser = fingerprint?["browser"] as? String
            
            // Get files accessed at this location
            var filesAccessed: [String] = []
            for log in data.logs {
                if let fileId = log["file_id"] as? String, let name = fileNames[fileId] {
                    if !filesAccessed.contains(name) { filesAccessed.append(name) }
                }
            }
            
            locations.append(MapLocation(
                id: key,
                lat: lat,
                lon: lon,
                city: city,
                country: country,
                countryCode: countryCode,
                isActive: data.isActive,
                isBlocked: data.isBlocked,
                viewerCount: data.count,
                lastAccess: data.lastAccess,
                viewerEmail: viewerEmail,
                viewerName: viewerName,
                deviceType: deviceType,
                browser: browser,
                files: filesAccessed
            ))
        }
        
        // Sort by last access (most recent first)
        locations.sort { $0.lastAccess > $1.lastAccess }
        
        let stats = MapStats(
            totalCountries: countries.count,
            totalLocations: locations.count,
            activeViewers: activeCount,
            blockedAttempts: blockedCount
        )
        
        return (locations, stats)
    }
}

// MARK: - Map Stats
struct MapStats {
    var totalCountries: Int = 0
    var totalLocations: Int = 0
    var activeViewers: Int = 0
    var blockedAttempts: Int = 0
}
