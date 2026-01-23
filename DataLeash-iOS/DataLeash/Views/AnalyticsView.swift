import SwiftUI

// MARK: - AnalyticsView
struct AnalyticsView: View {
    @State private var fileAnalytics: [FileAnalytics] = []
    @State private var isLoading = true
    @State private var selectedFile: FileAnalytics?
    @State private var overallStats = OverallAnalytics()
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.05, green: 0.05, blue: 0.15),
                    Color(red: 0.1, green: 0.1, blue: 0.2)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                headerView
                
                if isLoading {
                    Spacer()
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.cyan)
                    Text("Loading analytics...")
                        .foregroundColor(.gray)
                        .padding(.top, 16)
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 20) {
                            // Overall Stats
                            overallStatsSection
                            
                            // File Analytics List
                            fileAnalyticsSection
                        }
                        .padding()
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadAnalytics()
        }
        .refreshable {
            await refreshAnalytics()
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "chart.bar.xaxis")
                    .font(.system(size: 28))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.cyan, .blue],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                
                Text("Analytics")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Spacer()
            }
            
            Text("Insights into your file sharing activity")
                .font(.subheadline)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color.black.opacity(0.3))
    }
    
    // MARK: - Overall Stats Section
    private var overallStatsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Overview")
                .font(.headline)
                .foregroundColor(.white)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                AnalyticsStatCard(
                    title: "Total Views",
                    value: "\(overallStats.totalViews)",
                    icon: "eye.fill",
                    color: .cyan
                )
                
                AnalyticsStatCard(
                    title: "Unique Viewers",
                    value: "\(overallStats.uniqueViewers)",
                    icon: "person.2.fill",
                    color: .blue
                )
                
                AnalyticsStatCard(
                    title: "Avg Duration",
                    value: formatDuration(overallStats.avgDuration),
                    icon: "clock.fill",
                    color: .purple
                )
                
                AnalyticsStatCard(
                    title: "Threats Blocked",
                    value: "\(overallStats.threatEvents)",
                    icon: "shield.fill",
                    color: .red
                )
            }
        }
    }
    
    // MARK: - File Analytics Section
    private var fileAnalyticsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("File Performance")
                    .font(.headline)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("\(fileAnalytics.count) files")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            if fileAnalytics.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "chart.bar")
                        .font(.system(size: 48))
                        .foregroundColor(.gray.opacity(0.5))
                    
                    Text("No analytics data yet")
                        .font(.headline)
                        .foregroundColor(.gray)
                    
                    Text("Share some files to see analytics")
                        .font(.subheadline)
                        .foregroundColor(.gray.opacity(0.7))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            } else {
                ForEach(fileAnalytics) { file in
                    FileAnalyticsCard(analytics: file)
                }
            }
        }
    }
    
    // MARK: - Helpers
    private func formatDuration(_ seconds: Int) -> String {
        if seconds < 60 { return "\(seconds)s" }
        let minutes = seconds / 60
        if minutes < 60 { return "\(minutes)m" }
        let hours = minutes / 60
        return "\(hours)h"
    }
    
    private func loadAnalytics() {
        isLoading = true
        Task {
            do {
                let result = try await SupabaseClient.shared.getFileAnalytics()
                await MainActor.run {
                    fileAnalytics = result.files
                    overallStats = result.overall
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                }
            }
        }
    }
    
    private func refreshAnalytics() async {
        do {
            let result = try await SupabaseClient.shared.getFileAnalytics()
            await MainActor.run {
                fileAnalytics = result.files
                overallStats = result.overall
            }
        } catch {
            // Silent fail on refresh
        }
    }
}

// FileAnalytics and OverallAnalytics models are defined in SupabaseClient.swift

// MARK: - AnalyticsStatCard
struct AnalyticsStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(color)
                
                Spacer()
            }
            
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(color.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(color.opacity(0.3), lineWidth: 1)
                )
        )
    }
}

// MARK: - FileAnalyticsCard
struct FileAnalyticsCard: View {
    let analytics: FileAnalytics
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // File Header
            HStack {
                Image(systemName: "doc.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.cyan)
                
                Text(analytics.fileName)
                    .font(.headline)
                    .foregroundColor(.white)
                    .lineLimit(1)
                
                Spacer()
                
                if let lastViewed = analytics.lastViewed {
                    Text(formatRelativeDate(lastViewed))
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            // Stats Row
            HStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(analytics.totalViews)")
                        .font(.headline)
                        .foregroundColor(.cyan)
                    Text("Views")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(analytics.uniqueViewers)")
                        .font(.headline)
                        .foregroundColor(.blue)
                    Text("Viewers")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(formatDuration(analytics.avgDuration))
                        .font(.headline)
                        .foregroundColor(.purple)
                    Text("Avg Time")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                if analytics.threatEvents > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundColor(.red)
                        Text("\(analytics.threatEvents)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.red.opacity(0.2))
                    .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.cyan.opacity(0.2), lineWidth: 1)
                )
        )
    }
    
    private func formatDuration(_ seconds: Int) -> String {
        if seconds < 60 { return "\(seconds)s" }
        let minutes = seconds / 60
        if minutes < 60 { return "\(minutes)m" }
        let hours = minutes / 60
        return "\(hours)h"
    }
    
    private func formatRelativeDate(_ date: Date) -> String {
        let diff = Date().timeIntervalSince(date)
        let minutes = Int(diff / 60)
        let hours = Int(diff / 3600)
        let days = Int(diff / 86400)
        
        if minutes < 1 { return "Just now" }
        if minutes < 60 { return "\(minutes)m ago" }
        if hours < 24 { return "\(hours)h ago" }
        return "\(days)d ago"
    }
}

#Preview {
    NavigationView {
        AnalyticsView()
    }
}
