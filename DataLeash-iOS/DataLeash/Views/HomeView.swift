import SwiftUI

// MARK: - Home View (Dashboard)
// Shows stats, recent files, recent activity - all real data from Supabase

struct HomeView: View {
    @EnvironmentObject var authService: AuthService
    @State private var stats: SupabaseClient.DashboardStats?
    @State private var files: [SupabaseClient.FileItem] = []
    @State private var activity: [SupabaseClient.ActivityItem] = []
    @State private var isLoading = true
    @State private var error: String?
    
    private var displayName: String {
        if let user = authService.currentUser {
            if let fullName = user.fullName, let firstName = fullName.components(separatedBy: " ").first {
                return firstName
            }
            return user.email.components(separatedBy: "@").first ?? "User"
        }
        return "User"
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    headerSection
                    
                    // Stats Grid
                    if isLoading {
                        loadingView
                    } else if let error = error {
                        errorView(error)
                    } else {
                        statsGrid
                        quickActionsSection
                        recentFilesSection
                        recentActivitySection
                    }
                }
                .padding()
            }
            .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.inline)
            .refreshable {
                await loadData()
            }
        }
        .task {
            await loadData()
        }
    }
    
    // MARK: - Header
    
    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Welcome back,")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                Text(displayName)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
            Spacer()
            Image(systemName: "shield.checkered")
                .font(.system(size: 44))
                .foregroundStyle(
                    LinearGradient(colors: [.cyan, .blue], startPoint: .topLeading, endPoint: .bottomTrailing)
                )
        }
    }
    
    // MARK: - Loading & Error
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(.cyan)
            Text("Loading dashboard...")
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
    
    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 50))
                .foregroundColor(.orange)
            Text(message)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            Button("Retry") {
                Task { await loadData() }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Color.cyan)
            .foregroundColor(.black)
            .fontWeight(.bold)
            .cornerRadius(10)
        }
        .padding()
    }
    
    // MARK: - Stats Grid
    
    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            StatCardView(
                title: "Total Files",
                value: "\(stats?.totalFiles ?? 0)",
                icon: "folder.fill",
                gradient: [.cyan, .blue]
            )
            StatCardView(
                title: "Total Views",
                value: "\(stats?.totalViews ?? 0)",
                icon: "eye.fill",
                gradient: [.green, .mint]
            )
            StatCardView(
                title: "Active Shares",
                value: "\(stats?.activeShares ?? 0)",
                icon: "link",
                gradient: [.purple, .indigo]
            )
            StatCardView(
                title: "Threats Blocked",
                value: "\(stats?.threatsBlocked ?? 0)",
                icon: "shield.slash.fill",
                gradient: [.red, .orange]
            )
        }
    }
    
    // MARK: - Quick Actions
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundColor(.white)
            
            HStack(spacing: 12) {
                QuickActionButton(
                    icon: "folder.fill",
                    title: "Files",
                    color: .cyan
                ) {
                    // Navigate handled by tab
                }
                
                QuickActionButton(
                    icon: "tray.fill",
                    title: "Requests",
                    color: .orange
                ) {
                    // Navigate handled by tab
                }
                
                QuickActionButton(
                    icon: "link",
                    title: "Share",
                    color: .purple
                ) {
                    // Navigate handled by tab
                }
            }
        }
    }
    
    // MARK: - Recent Files
    
    private var recentFilesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Files")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                NavigationLink(destination: FilesView()) {
                    Text("View all →")
                        .font(.caption)
                        .foregroundColor(.cyan)
                }
            }
            
            if files.isEmpty {
                emptyFilesView
            } else {
                ForEach(files.prefix(3)) { file in
                    FileRowCompact(file: file)
                }
            }
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
    }
    
    private var emptyFilesView: some View {
        VStack(spacing: 12) {
            Image(systemName: "folder.badge.plus")
                .font(.system(size: 40))
                .foregroundColor(.gray)
            Text("No files yet")
                .foregroundColor(.gray)
            Text("Upload from the web dashboard")
                .font(.caption)
                .foregroundColor(.gray.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 30)
    }
    
    // MARK: - Recent Activity
    
    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Activity")
                .font(.headline)
                .foregroundColor(.white)
            
            if activity.isEmpty {
                emptyActivityView
            } else {
                ForEach(activity.prefix(5)) { item in
                    ActivityRowCompact(item: item)
                }
            }
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
    }
    
    private var emptyActivityView: some View {
        VStack(spacing: 12) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 40))
                .foregroundColor(.gray)
            Text("No activity yet")
                .foregroundColor(.gray)
            Text("Activity appears when files are viewed")
                .font(.caption)
                .foregroundColor(.gray.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 30)
    }
    
    // MARK: - Load Data
    
    private func loadData() async {
        isLoading = true
        error = nil
        
        do {
            async let statsTask = SupabaseClient.shared.getStats()
            async let filesTask = SupabaseClient.shared.getMyFiles()
            async let activityTask = SupabaseClient.shared.getRecentActivity(limit: 10)
            
            stats = try await statsTask
            files = try await filesTask
            activity = try await activityTask
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
}

// MARK: - Stat Card

struct StatCardView: View {
    let title: String
    let value: String
    let icon: String
    let gradient: [Color]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 44, height: 44)
                    Image(systemName: icon)
                        .font(.title3)
                        .foregroundColor(.white)
                }
                Spacer()
                Text(value)
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundStyle(LinearGradient(colors: gradient, startPoint: .leading, endPoint: .trailing))
            }
            Text(title)
                .font(.subheadline)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
    }
}

// MARK: - Quick Action Button

struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(color.opacity(0.1))
            .cornerRadius(12)
        }
    }
}

// MARK: - File Row Compact

struct FileRowCompact: View {
    let file: SupabaseClient.FileItem
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: file.iconName)
                .font(.title2)
                .foregroundColor(.cyan)
                .frame(width: 36)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(file.originalName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .lineLimit(1)
                Text(file.createdAt, style: .relative)
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(file.totalViews)")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                Text("views")
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Activity Row Compact

struct ActivityRowCompact: View {
    let item: SupabaseClient.ActivityItem
    
    var iconColor: Color {
        switch item.iconColor {
        case "cyan": return .cyan
        case "red": return .red
        case "green": return .green
        case "orange": return .orange
        case "blue": return .blue
        default: return .gray
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: item.iconName)
                .font(.title3)
                .foregroundColor(iconColor)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(item.displayAction)
                    .font(.subheadline)
                    .foregroundColor(.white)
                if let fileName = item.fileName {
                    Text(fileName)
                        .font(.caption)
                        .foregroundColor(.cyan)
                        .lineLimit(1)
                }
                if let city = item.city {
                    Text(city)
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
            }
            
            Spacer()
            
            Text(item.timestamp, style: .relative)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding(.vertical, 6)
    }
}

#Preview {
    HomeView()
        .environmentObject(AuthService.shared)
}
