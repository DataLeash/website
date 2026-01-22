import Foundation

// MARK: - Files Management Service
// Handles file CRUD operations via Supabase

class FilesManagementService {
    static let shared = FilesManagementService()
    private init() {}
    
    struct UserFile: Identifiable, Codable {
        let id: String
        let originalName: String
        let mimeType: String?
        let viewCount: Int
        let createdAt: Date
        let isKilled: Bool
        
        enum CodingKeys: String, CodingKey {
            case id
            case originalName = "original_name"
            case mimeType = "mime_type"
            case viewCount = "view_count"
            case createdAt = "created_at"
            case isKilled = "is_killed"
        }
        
        var iconName: String {
            guard let type = mimeType else { return "doc.fill" }
            if type.contains("image") { return "photo" }
            if type.contains("pdf") { return "doc.richtext" }
            if type.contains("video") { return "video" }
            return "doc.fill"
        }
    }
    
    // MARK: - Get User's Files
    
    func getMyFiles() async throws -> [UserFile] {
        guard let userId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/files?owner_id=eq.\(userId)&order=created_at.desc")!
        var request = URLRequest(url: url)
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode([UserFile].self, from: data)
    }
    
    // MARK: - Kill File
    
    func killFile(fileId: String) async throws {
        guard let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        // Update is_killed to true
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/files?id=eq.\(fileId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let body = ["is_killed": true]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
    
    // MARK: - Get File Viewers
    
    func getViewers(forFileId fileId: String) async throws -> [FileViewer] {
        guard let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/file_access?file_id=eq.\(fileId)&select=id,viewer_email,status,created_at")!
        var request = URLRequest(url: url)
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode([FileViewer].self, from: data)
    }
    
    // MARK: - Copy Share Link
    
    func getShareLink(forFileId fileId: String) -> String {
        return "\(Config.apiBaseURL)/view/\(fileId)"
    }
}

struct FileViewer: Identifiable, Codable {
    let id: String
    let viewerEmail: String
    let status: String
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case viewerEmail = "viewer_email"
        case status
        case createdAt = "created_at"
    }
}
