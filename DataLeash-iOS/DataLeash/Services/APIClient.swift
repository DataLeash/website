import Foundation

// MARK: - API Client
// Unified client for calling Next.js backend APIs with authentication

class APIClient {
    static let shared = APIClient()
    private init() {}
    
    enum APIError: LocalizedError {
        case unauthorized
        case invalidResponse
        case serverError(String)
        case httpError(Int)
        case noData
        
        var errorDescription: String? {
            switch self {
            case .unauthorized: return "Please sign in to continue"
            case .invalidResponse: return "Invalid server response"
            case .serverError(let msg): return msg
            case .httpError(let code): return "Server error (\(code))"
            case .noData: return "No data received"
            }
        }
    }
    
    // MARK: - Base Request
    
    private func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: [String: Any]? = nil
    ) async throws -> T {
        guard let token = AuthService.shared.accessToken else {
            throw APIError.unauthorized
        }
        
        let url = URL(string: "\(Config.apiBaseURL)\(path)")!
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        // Also pass Supabase session cookie for server-side auth
        request.setValue(token, forHTTPHeaderField: "x-supabase-auth")
        
        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 401 {
            throw APIError.unauthorized
        }
        
        if httpResponse.statusCode >= 400 {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let error = json["error"] as? String {
                throw APIError.serverError(error)
            }
            throw APIError.httpError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode(T.self, from: data)
    }
    
    private func requestRaw(
        path: String,
        method: String = "GET",
        body: [String: Any]? = nil
    ) async throws -> [String: Any] {
        guard let token = AuthService.shared.accessToken else {
            throw APIError.unauthorized
        }
        
        let url = URL(string: "\(Config.apiBaseURL)\(path)")!
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(token, forHTTPHeaderField: "x-supabase-auth")
        
        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 401 {
            throw APIError.unauthorized
        }
        
        if httpResponse.statusCode >= 400 {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let error = json["error"] as? String {
                throw APIError.serverError(error)
            }
            throw APIError.httpError(httpResponse.statusCode)
        }
        
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw APIError.invalidResponse
        }
        
        return json
    }
    
    // MARK: - Stats (Dashboard)
    
    struct StatsResponse: Codable {
        let totalFiles: Int
        let totalViews: Int
        let activeShares: Int
        let threatsBlocked: Int
    }
    
    func getStats() async throws -> StatsResponse {
        return try await request(path: "/api/stats")
    }
    
    // MARK: - Files
    
    struct FileResponse: Codable {
        let id: String
        let originalName: String
        let mimeType: String?
        let isDestroyed: Bool
        let createdAt: String
        let totalViews: Int?
        let settings: FileSettingsResponse?
    }
    
    struct FileSettingsResponse: Codable {
        let passwordProtected: Bool?
        let maxViews: Int?
        let expiresAt: String?
    }
    
    struct FilesListResponse: Codable {
        let files: [FileResponse]
    }
    
    func getMyFiles() async throws -> [FileResponse] {
        let response: FilesListResponse = try await request(path: "/api/files")
        return response.files
    }
    
    func killFile(fileId: String) async throws {
        let _: [String: Any] = try await requestRaw(
            path: "/api/files/\(fileId)/kill",
            method: "POST",
            body: ["confirmation": "KILL"]
        )
    }
    
    func chainKill() async throws {
        let _: [String: Any] = try await requestRaw(
            path: "/api/files",
            method: "DELETE",
            body: ["confirmation": "DESTROY ALL"]
        )
    }
    
    // MARK: - Access Requests
    
    struct AccessRequestResponse: Codable {
        let id: String
        let fileId: String
        let viewerEmail: String
        let viewerName: String?
        let status: String
        let createdAt: String
        let file: FileBasicInfo?
        
        struct FileBasicInfo: Codable {
            let originalName: String?
        }
    }
    
    func getPendingRequests() async throws -> [AccessRequestResponse] {
        // The web app fetches from access_requests table where file owner matches
        // We'll use the dashboard/requests page logic
        let json = try await requestRaw(path: "/api/access/pending")
        
        guard let requests = json["requests"] as? [[String: Any]] else {
            return []
        }
        
        return requests.compactMap { item -> AccessRequestResponse? in
            guard let id = item["id"] as? String,
                  let fileId = item["file_id"] as? String,
                  let email = item["viewer_email"] as? String else {
                return nil
            }
            
            let file = item["files"] as? [String: Any]
            
            return AccessRequestResponse(
                id: id,
                fileId: fileId,
                viewerEmail: email,
                viewerName: item["viewer_name"] as? String,
                status: item["status"] as? String ?? "pending",
                createdAt: item["created_at"] as? String ?? "",
                file: AccessRequestResponse.FileBasicInfo(originalName: file?["original_name"] as? String)
            )
        }
    }
    
    func respondToRequest(requestId: String, action: String) async throws {
        guard let userId = AuthService.shared.currentUser?.id else {
            throw APIError.unauthorized
        }
        
        let _: [String: Any] = try await requestRaw(
            path: "/api/access/respond",
            method: "POST",
            body: [
                "requestId": requestId,
                "action": action,
                "userId": userId
            ]
        )
    }
    
    // MARK: - Activity
    
    struct ActivityItem: Codable, Identifiable {
        let id: String
        let action: String
        let timestamp: String
        let location: ActivityLocation?
        let fileId: String?
        
        struct ActivityLocation: Codable {
            let viewerEmail: String?
            let city: String?
            let country: String?
        }
    }
    
    func getRecentActivity() async throws -> [ActivityItem] {
        let json = try await requestRaw(path: "/api/activity")
        
        guard let logs = json["logs"] as? [[String: Any]] else {
            return []
        }
        
        return logs.prefix(20).compactMap { item -> ActivityItem? in
            guard let id = item["id"] as? String,
                  let action = item["action"] as? String else {
                return nil
            }
            
            let loc = item["location"] as? [String: Any]
            
            return ActivityItem(
                id: id,
                action: action,
                timestamp: item["timestamp"] as? String ?? "",
                location: ActivityItem.ActivityLocation(
                    viewerEmail: loc?["viewer_email"] as? String,
                    city: loc?["city"] as? String,
                    country: loc?["country"] as? String
                ),
                fileId: item["file_id"] as? String
            )
        }
    }
}
