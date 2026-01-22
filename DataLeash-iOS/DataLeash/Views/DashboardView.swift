import SwiftUI

// MARK: - Dashboard View (Real API Data)

struct DashboardView: View {
    @EnvironmentObject var authService: AuthService
    @State private var stats: APIClient.StatsResponse?
    @State private var activity: [APIClient.ActivityItem] = []
    @State private var isLoading = true
    @State private var error: String?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Welcome Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Welcome back,")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                        Text(authService.currentUser?.fullName ?? authService.currentUser?.email ?? "User")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    }
                    Spacer()
                    Image(systemName: "shield.checkered")
                        .font(.system(size: 40))
                        .foregroundStyle(
                            LinearGradient(colors: [.cyan, .blue], startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                }
                .padding()
                
                // Stats Cards
                if isLoading {
                    ProgressView().tint(.cyan).padding()
                } else if let error = error {
                    VStack(spacing: 10) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.title)
                            .foregroundColor(.orange)
                        Text(error)
                            .foregroundColor(.gray)
                            .font(.caption)
                            .multilineTextAlignment(.center)
                        Button("Retry") {
                            Task { await loadDashboard() }
                        }
                        .foregroundColor(.cyan)
                    }
                    .padding()
                } else if let stats = stats {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 15) {
                        StatCard(title: "Total Files", value: "\(stats.totalFiles)", icon: "doc.fill", color: .blue)
                        StatCard(title: "Total Views", value: "\(stats.totalViews)", icon: "eye.fill", color: .green)
                        StatCard(title: "Active Shares", value: "\(stats.activeShares)", icon: "arrowshape.turn.up.right.fill", color: .orange)
                        StatCard(title: "Threats Blocked", value: "\(stats.threatsBlocked)", icon: "shield.slash.fill", color: .red)
                    }
                    .padding(.horizontal)
                }
                
                // Quick Actions
                HStack(spacing: 15) {
                    NavigationLink(destination: FilesView()) {
                        QuickActionCard(icon: "arrow.up.doc", title: "My Files", color: .cyan)
                    }
                    NavigationLink(destination: InboxView()) {
                        QuickActionCard(icon: "tray.full", title: "Requests", color: .purple)
                    }
                    NavigationLink(destination: FriendsView()) {
                        QuickActionCard(icon: "person.2", title: "Friends", color: .green)
                    }
                }
                .padding(.horizontal)
                
                // Recent Activity
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Activity")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding(.horizontal)
                    
                    if activity.isEmpty && !isLoading {
                        Text("No recent activity")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                            .frame(maxWidth: .infinity)
                            .padding()
                    } else {
                        ForEach(activity) { item in
                            ActivityRowView(item: item)
                        }
                    }
                }
                .padding(.top)
            }
            .padding(.vertical)
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("Dashboard")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadDashboard()
        }
        .refreshable {
            await loadDashboard()
        }
    }
    
    private func loadDashboard() async {
        isLoading = true
        error = nil
        
        do {
            async let statsTask = APIClient.shared.getStats()
            async let activityTask = APIClient.shared.getRecentActivity()
            
            stats = try await statsTask
            activity = try await activityTask
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
}

// MARK: - Components

struct QuickActionCard: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.white.opacity(0.1))
        .cornerRadius(12)
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            Spacer()
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
        }
        .padding()
        .background(Color.white.opacity(0.08))
        .cornerRadius(12)
    }
}

struct ActivityRowView: View {
    let item: APIClient.ActivityItem
    
    var iconName: String {
        switch item.action {
        case "view": return "eye.fill"
        case "blocked": return "shield.slash.fill"
        case "access_approved": return "checkmark.circle.fill"
        case "access_denied": return "xmark.circle.fill"
        case "screenshot_attempt": return "camera.metering.unknown"
        default: return "doc.fill"
        }
    }
    
    var iconColor: Color {
        switch item.action {
        case "view": return .cyan
        case "blocked": return .red
        case "access_approved": return .green
        case "access_denied": return .orange
        case "screenshot_attempt": return .red
        default: return .gray
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconName)
                .foregroundColor(iconColor)
                .frame(width: 30)
            VStack(alignment: .leading, spacing: 2) {
                Text(item.action.replacingOccurrences(of: "_", with: " ").capitalized)
                    .font(.subheadline)
                    .foregroundColor(.white)
                if let email = item.location?.viewerEmail {
                    Text(email)
                        .font(.caption)
                        .foregroundColor(.gray)
                        .lineLimit(1)
                }
            }
            Spacer()
            if !item.timestamp.isEmpty {
                Text(formatDate(item.timestamp))
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }
    
    private func formatDate(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: isoString) else { return "" }
        
        let relative = RelativeDateTimeFormatter()
        relative.unitsStyle = .abbreviated
        return relative.localizedString(for: date, relativeTo: Date())
    }
}

#Preview {
    NavigationStack {
        DashboardView()
            .environmentObject(AuthService.shared)
    }
}
