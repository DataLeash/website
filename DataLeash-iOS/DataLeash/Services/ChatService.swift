import Foundation
import UIKit

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
        var status: String? // sent, delivered, read
        
        enum CodingKeys: String, CodingKey {
            case id
            case senderId = "sender_id"
            case receiverId = "receiver_id"
            case content
            case fileId = "file_id"
            case createdAt = "created_at"
            case readAt = "read_at"
            case status
        }
    }
    
    // MARK: - Conversations List
    
    struct ConversationItem: Identifiable, Equatable {
        let id: String // friendId
        let friendName: String?
        let friendEmail: String
        let lastMessage: String
        let lastMessageTime: Date
        let unreadCount: Int
        var isOnline: Bool
        
        static func == (lhs: ConversationItem, rhs: ConversationItem) -> Bool {
            lhs.id == rhs.id && lhs.lastMessageTime == rhs.lastMessageTime && lhs.unreadCount == rhs.unreadCount && lhs.isOnline == rhs.isOnline
        }
    }
    
    func getRecentConversations() async throws -> [ConversationItem] {
        guard let myId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        // 1. Fetch recent messages involving me (limit 200 for now)
        let query = "or=(sender_id.eq.\(myId),receiver_id.eq.\(myId))"
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/messages?\(query)&order=created_at.desc&limit=200")!
        
        var request = URLRequest(url: url)
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        let messages = try decoder.decode([Message].self, from: data)
        
        // 2. Group by conversation partner
        var conversations: [String: (msg: Message, unread: Int)] = [:]
        
        for msg in messages {
            let partnerId = (msg.senderId == myId) ? msg.receiverId : msg.senderId
            
            // Track unread (if I am receiver and status is not read)
            let isUnread = (msg.receiverId == myId && msg.status != "read") ? 1 : 0
            
            if let existing = conversations[partnerId] {
                // Keep latest message (array is desc sorted, so first one found is latest, unless we iterate backwards? Array is desc, so first is latest)
                // Actually we just need to sum unread. The first one we encounter for a partner is the latest message.
                conversations[partnerId] = (msg: existing.msg, unread: existing.unread + isUnread)
            } else {
                conversations[partnerId] = (msg: msg, unread: isUnread)
            }
        }
        
        // 3. Fetch friend details for these partners
        if conversations.isEmpty { return [] }
        
        let partnerIds = conversations.keys.joined(separator: ",")
        
        // Fetch profiles/users (assuming we have access, or use friends table? Friends table is safer)
        // Let's use friends table to get names
        // But friends table entry has friend_id = partnerId OR user_id = partnerId.. complex.
        // Let's use the users table public info if possible, or friends table.
        // Friend table: user_id=me, friend_id=them OR user_id=them, friend_id=me.
        
        // Simpler: Fetch from 'friends' table where (user_id=me AND friend_id IN (...)) OR (friend_id=me AND user_id IN (...))
        // Actually, just fetch my friends list and match.
        let friends = try await SocialService.shared.getFriends()
        var friendMap: [String: Friend] = [:]
        for f in friends {
            let pid = (f.userId == myId) ? f.friendId : f.userId
            friendMap[pid] = f
        }
        
        // 4. Build Conversation Items
        var result: [ConversationItem] = []
        
        for (pid, data) in conversations {
            let friend = friendMap[pid]
            let name = friend?.friendName ?? "Unknown User"
            let email = friend?.friendEmail ?? "No Email"
            
            let content = data.msg.content ?? (data.msg.fileId != nil ? "Shared a file" : "Message")
            
            result.append(ConversationItem(
                id: pid,
                friendName: name,
                friendEmail: email,
                lastMessage: content,
                lastMessageTime: data.msg.createdAt,
                unreadCount: data.unread,
                isOnline: false // Todo: Fetch online status separately if needed
            ))
        }
        
        return result.sorted { $0.lastMessageTime > $1.lastMessageTime }
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
    
    // MARK: - Message Status
    
    func markMessagesAsRead(_ messageIds: [String]) async {
        guard !messageIds.isEmpty, let token = AuthService.shared.accessToken else { return }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/messages")!
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        // Filter: id in (ids)
        let idsString = messageIds.joined(separator: ",")
        let finalUrl = URL(string: "\(url.absoluteString)?id=in.(\(idsString))")!
        request.url = finalUrl
        
        let body: [String: Any] = [
            "status": "read",
            "read_at": ISO8601DateFormatter().string(from: Date())
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        _ = try? await URLSession.shared.data(for: request)
    }
    
    // MARK: - Presence
    
    struct UserStatus: Codable {
        let isOnline: Bool
        let lastSeen: Date?
        
        enum CodingKeys: String, CodingKey {
            case isOnline = "is_online"
            case lastSeen = "last_seen"
        }
    }
    
    func getUserStatus(userId: String) async throws -> UserStatus? {
        guard let token = AuthService.shared.accessToken else { return nil }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/users?id=eq.\(userId)&select=is_online,last_seen")!
        var request = URLRequest(url: url)
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        let users = try? decoder.decode([UserStatus].self, from: data)
        return users?.first
    }
    
    func updateMyStatus(isOnline: Bool) async {
        guard let userId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else { return }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/users?id=eq.\(userId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let body: [String: Any] = [
            "is_online": isOnline,
            "last_seen": ISO8601DateFormatter().string(from: Date())
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        _ = try? await URLSession.shared.data(for: request)
    }
    
    // MARK: - Share File in Chat
    
    func shareFile(fileId: String, withFriendId friendId: String) async throws {
        // First, grant access to the friend
        guard let myId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        

        
        // 1. Get friend's email
        let friendUrl = URL(string: "\(Config.supabaseURL)/rest/v1/users?id=eq.\(friendId)&select=email")!
        var friendReq = URLRequest(url: friendUrl)
        friendReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        friendReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (friendData, _) = try await URLSession.shared.data(for: friendReq)
        guard let friends = try? JSONSerialization.jsonObject(with: friendData) as? [[String: Any]],
              let friendEmail = friends.first?["email"] as? String else {
            throw URLError(.cannotParseResponse)
        }
        
        // 2. Grant access via file_access table
        // Note: Logic allows forwarding. Attempting to insert access record.
        // If RLS prevents non-owners from inserting, this might fail, but ideal DataLeash behavior
        // allows viral sharing while Owner maintains visibility via file_id.
        
        let accessUrl = URL(string: "\(Config.supabaseURL)/rest/v1/file_access")!
        var accessReq = URLRequest(url: accessUrl)
        accessReq.httpMethod = "POST"
        accessReq.setValue("application/json", forHTTPHeaderField: "Content-Type")
        accessReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        accessReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        // Return representation to check for errors/success
        accessReq.setValue("return=representation", forHTTPHeaderField: "Prefer")
        
        let accessBody: [String: Any] = [
            "file_id": fileId,
            "viewer_email": friendEmail,
            "status": "approved", // auto-approve shared files in chat
            "granted_by": myId // Track who shared it (if column exists, or harmless if ignored usually)
        ]
        
        do {
            accessReq.httpBody = try JSONSerialization.data(withJSONObject: accessBody)
            let (_, response) = try await URLSession.shared.data(for: accessReq)
            
            // If insertion fails (e.g. duplicate or RLS), simple continue.
            // The message sending is the critical part for the chat flow.
            // If the friend already has access, this is fine.
            if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
                print("Note: Access grant returned status \(httpResponse.statusCode)")
            }
        } catch {
            print("Warning: Failed to grant access explicitly: \(error)")
        }
        
        // 3. Send message with file attachment
        _ = try await sendMessage(to: friendId, content: "Shared a file with you", fileId: fileId)
    }
    
    // MARK: - Upload Image to DataLeash
    
    func uploadImageToDataLeash(image: UIImage) async throws -> String {
        guard let userId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        // Compress image to JPEG
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        // Generate unique filename
        let filename = "chat_image_\(UUID().uuidString).jpg"
        let storagePath = "\(userId)/\(filename)"
        
        // Upload to Supabase Storage
        let uploadUrl = URL(string: "\(Config.supabaseURL)/storage/v1/object/files/\(storagePath)")!
        var uploadReq = URLRequest(url: uploadUrl)
        uploadReq.httpMethod = "POST"
        uploadReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        uploadReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        uploadReq.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        uploadReq.httpBody = imageData
        
        let (_, uploadResponse) = try await URLSession.shared.data(for: uploadReq)
        
        guard let httpResponse = uploadResponse as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.cannotCreateFile)
        }
        
        // Create file record in database
        let fileId = UUID().uuidString
        let createUrl = URL(string: "\(Config.supabaseURL)/rest/v1/files")!
        var createReq = URLRequest(url: createUrl)
        createReq.httpMethod = "POST"
        createReq.setValue("application/json", forHTTPHeaderField: "Content-Type")
        createReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        createReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        createReq.setValue("return=representation", forHTTPHeaderField: "Prefer")
        
        let fileRecord: [String: Any] = [
            "id": fileId,
            "user_id": userId,
            "original_name": filename,
            "encrypted_name": filename,
            "storage_path": storagePath,
            "mime_type": "image/jpeg",
            "size": imageData.count,
            "status": "active"
        ]
        
        createReq.httpBody = try JSONSerialization.data(withJSONObject: fileRecord)
        
        let (_, createResponse) = try await URLSession.shared.data(for: createReq)
        
        guard let createHttpResponse = createResponse as? HTTPURLResponse,
              (200...299).contains(createHttpResponse.statusCode) else {
            throw URLError(.cannotCreateFile)
        }
        
        return fileId
    }
}
