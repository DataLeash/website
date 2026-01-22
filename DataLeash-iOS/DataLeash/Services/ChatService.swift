import Foundation

// MARK: - Chat Service
// Handles real-time messaging via Supabase

class ChatService {
    static let shared = ChatService()
    private init() {}
    
    struct Message: Identifiable, Codable {
        let id: String
        let senderId: String
        let receiverId: String
        let content: String?
        let fileId: String?
        let createdAt: Date
        var readAt: Date?
        
        enum CodingKeys: String, CodingKey {
            case id
            case senderId = "sender_id"
            case receiverId = "receiver_id"
            case content
            case fileId = "file_id"
            case createdAt = "created_at"
            case readAt = "read_at"
        }
    }
    
    // MARK: - Get Messages
    
    func getMessages(withUserId friendId: String) async throws -> [Message] {
        guard let myId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        // Messages where (sender=me AND receiver=friend) OR (sender=friend AND receiver=me)
        let query = "or=(and(sender_id.eq.\(myId),receiver_id.eq.\(friendId)),and(sender_id.eq.\(friendId),receiver_id.eq.\(myId)))"
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/messages?\(query)&order=created_at.asc")!
        
        var request = URLRequest(url: url)
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode([Message].self, from: data)
    }
    
    // MARK: - Send Message
    
    func sendMessage(to receiverId: String, content: String?, fileId: String? = nil) async throws -> Message {
        guard let senderId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/messages")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("return=representation", forHTTPHeaderField: "Prefer")
        
        var body: [String: Any] = [
            "sender_id": senderId,
            "receiver_id": receiverId
        ]
        if let content = content { body["content"] = content }
        if let fileId = fileId { body["file_id"] = fileId }
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        let messages = try decoder.decode([Message].self, from: data)
        guard let message = messages.first else {
            throw URLError(.cannotParseResponse)
        }
        
        return message
    }
    
    // MARK: - Share File in Chat
    
    func shareFile(fileId: String, withFriendId friendId: String) async throws {
        // First, grant access to the friend
        guard let myId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        // Get friend's email for file_access
        let friendUrl = URL(string: "\(Config.supabaseURL)/rest/v1/users?id=eq.\(friendId)&select=email")!
        var friendReq = URLRequest(url: friendUrl)
        friendReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        friendReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (friendData, _) = try await URLSession.shared.data(for: friendReq)
        guard let friends = try? JSONSerialization.jsonObject(with: friendData) as? [[String: Any]],
              let friendEmail = friends.first?["email"] as? String else {
            throw URLError(.cannotParseResponse)
        }
        
        // Grant access via file_access table
        let accessUrl = URL(string: "\(Config.supabaseURL)/rest/v1/file_access")!
        var accessReq = URLRequest(url: accessUrl)
        accessReq.httpMethod = "POST"
        accessReq.setValue("application/json", forHTTPHeaderField: "Content-Type")
        accessReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        accessReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let accessBody: [String: Any] = [
            "file_id": fileId,
            "viewer_email": friendEmail,
            "status": "approved"
        ]
        accessReq.httpBody = try JSONSerialization.data(withJSONObject: accessBody)
        
        _ = try await URLSession.shared.data(for: accessReq)
        
        // Send message with file attachment
        _ = try await sendMessage(to: friendId, content: "Shared a file with you", fileId: fileId)
    }
}
