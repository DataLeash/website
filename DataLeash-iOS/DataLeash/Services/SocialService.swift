import Foundation

class SocialService {
    static let shared = SocialService()
    private init() {}
    
    // MARK: - Search Users
    // This is tricky with RLS restricted auth.users. 
    // We'll try to use the `users` table we saw in previous context if it exists and is public.
    // If not, we might need to rely on the backend API or a new edge function.
    // As a fallback, we can try to send a request by Email directly.
    // The friendship RLS "Users can insert friendship request" allows inserting (user_id=me, friend_id=?).
    // We need to know friend_id.
    // WE NEED A WAY TO RESOLVE EMAIL -> UUID.
    // If `public.users` table exists and is readable, we use that.
    
    func resolveUserByEmail(email: String) async throws -> String? {
        // Try querying public users table
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/users?email=eq.\(email)&select=id")!
        var request = URLRequest(url: url)
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(AuthService.shared.accessToken ?? "")", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        if let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
           let first = json.first,
           let id = first["id"] as? String {
            return id
        }
        return nil
    }
    
    // MARK: - Send Request
    
    func sendFriendRequest(toEmail email: String) async throws {
        guard let myId = AuthService.shared.currentUser?.id else { throw URLError(.userAuthenticationRequired) }
        guard let friendId = try await resolveUserByEmail(email: email) else {
            throw SocialError.userNotFound
        }
        
        if friendId == myId { throw SocialError.cannotAddSelf }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/friendships")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(AuthService.shared.accessToken ?? "")", forHTTPHeaderField: "Authorization")
        // Prefer return=minimal or representation
        request.setValue("return=representation", forHTTPHeaderField: "Prefer")
        
        let body: [String: Any] = [
            "user_id": myId,
            "friend_id": friendId,
            "status": "pending"
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
             throw SocialError.requestFailed
        }
    }
    
    // MARK: - Get Friends
    
    // This fetches friendships and then "joins" manually by fetching user details 
    // since we don't have a joined view yet.
    func getFriends() async throws -> [Friend] {
        guard let myId = AuthService.shared.currentUser?.id else { throw URLError(.userAuthenticationRequired) }
        
        // OR filter is complex in URL query params.
        // We need: (user_id=eq.me) OR (friend_id=eq.me)
        let query = "or=(user_id.eq.\(myId),friend_id.eq.\(myId))"
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/friendships?\(query)&select=*")!
        
        var request = URLRequest(url: url)
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(AuthService.shared.accessToken ?? "")", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        struct RawFriendship: Codable {
            let id: String
            let user_id: String
            let friend_id: String
            let status: String
        }
        
        let friendships = try JSONDecoder().decode([RawFriendship].self, from: data)
        
        // Collect IDs to fetch profiles for
        var otherUserIds = Set<String>()
        for f in friendships {
            if f.user_id == myId { otherUserIds.insert(f.friend_id) }
            else { otherUserIds.insert(f.user_id) }
        }
        
        if otherUserIds.isEmpty { return [] }
        
        // Fetch profiles
        // We need to fetch from 'users' table where id in (...)
        let idsStr = otherUserIds.joined(separator: ",")
        let usersUrl = URL(string: "\(Config.supabaseURL)/rest/v1/users?id=in.(\(idsStr))&select=id,email,full_name")!
        var usersReq = URLRequest(url: usersUrl)
        usersReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        usersReq.setValue("Bearer \(AuthService.shared.accessToken ?? "")", forHTTPHeaderField: "Authorization")
        
        let (usersData, _) = try await URLSession.shared.data(for: usersReq)
        let profiles = try JSONDecoder().decode([AppUser].self, from: usersData)
        
        // Map back
        var results: [Friend] = []
        for f in friendships {
            let otherId = (f.user_id == myId) ? f.friend_id : f.user_id
            if let profile = profiles.first(where: { $0.id == otherId }) {
                results.append(Friend(
                    id: f.id,
                    userId: f.user_id,
                    friendId: f.friend_id,
                    status: FriendStatus(rawValue: f.status) ?? .pending,
                    friendEmail: profile.email,
                    friendName: profile.fullName
                ))
            }
        }
        
        return results
    }
    
    // MARK: - Accept Request
    
    func acceptRequest(friendshipId: String) async throws {
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/friendships?id=eq.\(friendshipId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(AuthService.shared.accessToken ?? "")", forHTTPHeaderField: "Authorization")
        
        let body = ["status": "accepted"]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
             throw SocialError.requestFailed
        }
    }
}

enum SocialError: LocalizedError {
    case userNotFound
    case cannotAddSelf
    case requestFailed
    
    var errorDescription: String? {
        switch self {
        case .userNotFound: return "User not found with that email."
        case .cannotAddSelf: return "You cannot add yourself as a friend."
        case .requestFailed: return "Failed to process friend request."
        }
    }
}
