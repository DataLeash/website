import Foundation

struct Friend: Codable, Identifiable {
    let id: String
    let userId: String
    let friendId: String
    let status: FriendStatus
    // We don't have joined user data directly from simple RLS usually, 
    // but we can query it. For now, assume we fetch friend details separately or via view.
    // Actually, for "List Friends", we need to know WHO the friend is.
    // The `friendships` table has `user_id`, `friend_id`.
    // If I am `user_id`, friend is `friend_id`.
    // If I am `friend_id`, friend is `user_id`.
    
    // Simplification: We will fetch the friendship, then fetch the OTHER user's profile.
    // Or simpler: The API returns joined data if we use Supabase views or specialized queries.
    // Since we are using raw REST for Supabase, we might need a separate call or a view.
    
    // Let's create a local model that holds the friend's info
    let friendEmail: String?
    let friendName: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case friendId = "friend_id"
        case status
        case friendEmail // These won't be in the raw table response
        case friendName
    }
}

enum FriendStatus: String, Codable {
    case pending
    case accepted
}
