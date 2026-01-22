import Foundation

// MARK: - Inbox Service
// Handles access requests and notifications from Supabase

class InboxService {
    static let shared = InboxService()
    private init() {}
    
    struct AccessRequest: Identifiable, Codable {
        let id: String
        let fileId: String
        let viewerEmail: String
        let viewerName: String?
        let status: String
        let createdAt: Date
        var fileName: String? // Populated after join
        
        enum CodingKeys: String, CodingKey {
            case id
            case fileId = "file_id"
            case viewerEmail = "viewer_email"
            case viewerName = "viewer_name"
            case status
            case createdAt = "created_at"
            case fileName
        }
    }
    
    // MARK: - Get Pending Requests
    
    func getPendingRequests() async throws -> [AccessRequest] {
        guard let userId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        // Get file_access where file owner is me and status is pending
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/file_access?select=id,file_id,viewer_email,viewer_name,status,created_at,files!inner(owner_id,original_name)&files.owner_id=eq.\(userId)&status=eq.pending&order=created_at.desc")!
        
        var request = URLRequest(url: url)
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        
        var requests: [AccessRequest] = []
        let dateFormatter = ISO8601DateFormatter()
        
        for item in json {
            let file = item["files"] as? [String: Any]
            let fileName = file?["original_name"] as? String
            let createdAtStr = item["created_at"] as? String ?? ""
            
            requests.append(AccessRequest(
                id: item["id"] as? String ?? UUID().uuidString,
                fileId: item["file_id"] as? String ?? "",
                viewerEmail: item["viewer_email"] as? String ?? "",
                viewerName: item["viewer_name"] as? String,
                status: item["status"] as? String ?? "pending",
                createdAt: dateFormatter.date(from: createdAtStr) ?? Date(),
                fileName: fileName
            ))
        }
        
        return requests
    }
    
    // MARK: - Approve Request
    
    func approveRequest(requestId: String) async throws {
        guard let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/file_access?id=eq.\(requestId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let body = ["status": "approved"]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
    
    // MARK: - Deny Request
    
    func denyRequest(requestId: String) async throws {
        guard let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/file_access?id=eq.\(requestId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let body = ["status": "denied"]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
}
