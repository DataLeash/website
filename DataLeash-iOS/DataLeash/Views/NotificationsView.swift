import SwiftUI

// MARK: - Notifications View
// Shows in-app notifications from the server

struct NotificationsView: View {
    @State private var notifications: [NotificationItem] = []
    @State private var isLoading = true
    @State private var error: String?
    
    var body: some View {
        VStack(spacing: 0) {
            if isLoading {
                Spacer()
                ProgressView().tint(.cyan).scaleEffect(1.5)
                Spacer()
            } else if let error = error {
                errorView(error)
            } else if notifications.isEmpty {
                emptyView
            } else {
                ScrollView {
                    LazyVStack(spacing: 1) {
                        ForEach(notifications) { notification in
                            NotificationRow(item: notification) {
                                await markAsRead(notification.id)
                            }
                        }
                    }
                }
            }
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Mark All Read") {
                    Task { await markAllAsRead() }
                }
                .foregroundColor(.cyan)
                .disabled(notifications.filter { !$0.isRead }.isEmpty)
            }
        }
        .task { await loadNotifications() }
        .refreshable { await loadNotifications() }
    }
    
    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 50))
                .foregroundColor(.orange)
            Text(message)
                .foregroundColor(.gray)
            Button("Retry") {
                Task { await loadNotifications() }
            }
            .foregroundColor(.cyan)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var emptyView: some View {
        VStack(spacing: 16) {
            Image(systemName: "bell.slash")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            Text("No notifications")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.white)
            Text("You'll see notifications when\nsomeone views or requests access")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private func loadNotifications() async {
        isLoading = true
        error = nil
        
        do {
            guard let userId = AuthService.shared.currentUser?.id,
                  let token = AuthService.shared.accessToken else {
                throw URLError(.userAuthenticationRequired)
            }
            
            let url = URL(string: "\(Config.supabaseURL)/rest/v1/notifications?user_id=eq.\(userId)&order=created_at.desc&limit=50")!
            var request = URLRequest(url: url)
            request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            
            let (data, _) = try await URLSession.shared.data(for: request)
            
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            decoder.dateDecodingStrategy = .iso8601
            
            notifications = try decoder.decode([NotificationItem].self, from: data)
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    private func markAsRead(_ id: String) async {
        guard let token = AuthService.shared.accessToken else { return }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/notifications?id=eq.\(id)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["is_read": true])
        
        _ = try? await URLSession.shared.data(for: request)
        
        if let index = notifications.firstIndex(where: { $0.id == id }) {
            notifications[index].isRead = true
        }
    }
    
    private func markAllAsRead() async {
        guard let userId = AuthService.shared.currentUser?.id,
              let token = AuthService.shared.accessToken else { return }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/notifications?user_id=eq.\(userId)&is_read=eq.false")!
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["is_read": true])
        
        _ = try? await URLSession.shared.data(for: request)
        
        for i in notifications.indices {
            notifications[i].isRead = true
        }
    }
}

// MARK: - Notification Item Model

struct NotificationItem: Identifiable, Codable {
    let id: String
    let type: String
    let title: String
    let message: String
    var isRead: Bool
    let createdAt: Date
    let fileId: String?
    
    var iconName: String {
        switch type {
        case "access_request": return "person.badge.key.fill"
        case "access_approved": return "checkmark.circle.fill"
        case "access_denied": return "xmark.circle.fill"
        case "file_viewed": return "eye.fill"
        case "file_killed": return "xmark.octagon.fill"
        case "security_alert": return "shield.slash.fill"
        default: return "bell.fill"
        }
    }
    
    var iconColor: Color {
        switch type {
        case "access_request": return .orange
        case "access_approved": return .green
        case "access_denied": return .red
        case "file_viewed": return .cyan
        case "file_killed": return .red
        case "security_alert": return .red
        default: return .blue
        }
    }
}

// MARK: - Notification Row

struct NotificationRow: View {
    let item: NotificationItem
    let onTap: () async -> Void
    
    var body: some View {
        Button(action: { Task { await onTap() } }) {
            HStack(spacing: 16) {
                // Icon
                ZStack {
                    Circle()
                        .fill(item.iconColor.opacity(0.2))
                        .frame(width: 44, height: 44)
                    Image(systemName: item.iconName)
                        .foregroundColor(item.iconColor)
                }
                
                // Content
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(item.message)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .lineLimit(2)
                    Text(item.createdAt, style: .relative)
                        .font(.caption)
                        .foregroundColor(.gray.opacity(0.7))
                }
                
                Spacer()
                
                // Unread indicator
                if !item.isRead {
                    Circle()
                        .fill(Color.cyan)
                        .frame(width: 10, height: 10)
                }
            }
            .padding()
            .background(item.isRead ? Color.clear : Color.cyan.opacity(0.05))
        }
    }
}

#Preview {
    NavigationStack {
        NotificationsView()
    }
}
