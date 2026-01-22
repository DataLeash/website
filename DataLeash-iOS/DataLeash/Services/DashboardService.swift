import Foundation

// MARK: - Dashboard Service
// Fetches real stats and activity from Supabase

class DashboardService {
    static let shared = DashboardService()
    private init() {}
    
    struct Stats {
        var totalFiles: Int = 0
        var totalViews: Int = 0
        var activeShares: Int = 0
        var friendCount: Int = 0
    }
    
    struct Activity: Identifiable {
        let id: String
        let icon: String
        let title: String
        let subtitle: String
        let time: Date
    }
    
    // MARK: - Fetch Dashboard Stats
    
    func getStats() async throws -> Stats {
        guard let userId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        var stats = Stats()
        
        // 1. Count files owned by user
        let filesUrl = URL(string: "\(Config.supabaseURL)/rest/v1/files?owner_id=eq.\(userId)&select=id,view_count")!
        var filesReq = URLRequest(url: filesUrl)
        filesReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        filesReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (filesData, _) = try await URLSession.shared.data(for: filesReq)
        if let files = try? JSONSerialization.jsonObject(with: filesData) as? [[String: Any]] {
            stats.totalFiles = files.count
            stats.totalViews = files.reduce(0) { $0 + (($1["view_count"] as? Int) ?? 0) }
        }
        
        // 2. Count active shares (file_access where file owner is me and status is approved)
        let sharesUrl = URL(string: "\(Config.supabaseURL)/rest/v1/file_access?select=id,file_id,files!inner(owner_id)&files.owner_id=eq.\(userId)&status=eq.approved")!
        var sharesReq = URLRequest(url: sharesUrl)
        sharesReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        sharesReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        if let (sharesData, _) = try? await URLSession.shared.data(for: sharesReq),
           let shares = try? JSONSerialization.jsonObject(with: sharesData) as? [[String: Any]] {
            stats.activeShares = shares.count
        }
        
        // 3. Count friends
        let friendsUrl = URL(string: "\(Config.supabaseURL)/rest/v1/friendships?or=(user_id.eq.\(userId),friend_id.eq.\(userId))&status=eq.accepted&select=id")!
        var friendsReq = URLRequest(url: friendsUrl)
        friendsReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        friendsReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        if let (friendsData, _) = try? await URLSession.shared.data(for: friendsReq),
           let friends = try? JSONSerialization.jsonObject(with: friendsData) as? [[String: Any]] {
            stats.friendCount = friends.count
        }
        
        return stats
    }
    
    // MARK: - Fetch Recent Activity
    
    func getRecentActivity() async throws -> [Activity] {
        guard let userId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else {
            throw URLError(.userAuthenticationRequired)
        }
        
        var activities: [Activity] = []
        
        // Fetch recent access logs for user's files
        let logsUrl = URL(string: "\(Config.supabaseURL)/rest/v1/access_logs?select=id,action,created_at,viewer_email,file_id,files!inner(owner_id,original_name)&files.owner_id=eq.\(userId)&order=created_at.desc&limit=10")!
        var logsReq = URLRequest(url: logsUrl)
        logsReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        logsReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        if let (logsData, _) = try? await URLSession.shared.data(for: logsReq),
           let logs = try? JSONSerialization.jsonObject(with: logsData) as? [[String: Any]] {
            for log in logs {
                let action = log["action"] as? String ?? "viewed"
                let email = log["viewer_email"] as? String ?? "Someone"
                let file = log["files"] as? [String: Any]
                let fileName = file?["original_name"] as? String ?? "a file"
                let createdAt = log["created_at"] as? String ?? ""
                
                let date = ISO8601DateFormatter().date(from: createdAt) ?? Date()
                
                activities.append(Activity(
                    id: log["id"] as? String ?? UUID().uuidString,
                    icon: action == "view" ? "eye.fill" : "doc.fill",
                    title: action == "view" ? "File viewed" : action.capitalized,
                    subtitle: "\(fileName) - \(email)",
                    time: date
                ))
            }
        }
        
        return activities
    }
}
