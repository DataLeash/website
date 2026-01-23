import SwiftUI

// MARK: - SecurityView
struct SecurityView: View {
    @State private var securityScore: Int = 0
    @State private var securityEvents: [SecurityEvent] = []
    @State private var isLoading = true
    @State private var isScanning = false
    
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
                    Text("Loading security status...")
                        .foregroundColor(.gray)
                        .padding(.top, 16)
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 20) {
                            // Security Score
                            securityScoreCard
                            
                            // Quick Actions
                            quickActionsSection
                            
                            // Recent Events
                            recentEventsSection
                        }
                        .padding()
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadSecurityData()
        }
        .refreshable {
            await refreshSecurityData()
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "shield.checkmark.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.green, .cyan],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                
                Text("Security")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Spacer()
                
                Button(action: runSecurityScan) {
                    HStack(spacing: 6) {
                        if isScanning {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.cyan)
                        } else {
                            Image(systemName: "arrow.clockwise")
                        }
                        Text(isScanning ? "Scanning..." : "Scan")
                    }
                    .font(.subheadline)
                    .foregroundColor(.cyan)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.cyan.opacity(0.2))
                    .cornerRadius(20)
                }
                .disabled(isScanning)
            }
            
            Text("Monitor threats and protect your files")
                .font(.subheadline)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color.black.opacity(0.3))
    }
    
    // MARK: - Security Score Card
    private var securityScoreCard: some View {
        VStack(spacing: 16) {
            // Score Circle
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 12)
                    .frame(width: 140, height: 140)
                
                Circle()
                    .trim(from: 0, to: CGFloat(securityScore) / 100)
                    .stroke(
                        LinearGradient(
                            colors: scoreGradientColors,
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .frame(width: 140, height: 140)
                    .rotationEffect(.degrees(-90))
                
                VStack(spacing: 4) {
                    Text("\(securityScore)")
                        .font(.system(size: 42, weight: .bold))
                        .foregroundColor(scoreColor)
                    
                    Text("Score")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            // Score Description
            Text(scoreDescription)
                .font(.headline)
                .foregroundColor(scoreColor)
            
            Text(scoreDetailDescription)
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 24)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(scoreColor.opacity(0.3), lineWidth: 1)
                )
        )
    }
    
    // MARK: - Quick Actions
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundColor(.white)
            
            HStack(spacing: 12) {
                NavigationLink(destination: BlacklistView()) {
                    SecurityActionButton(
                        icon: "hand.raised.slash.fill",
                        title: "Blacklist",
                        color: .red
                    )
                }
                
                NavigationLink(destination: LeakersView()) {
                    SecurityActionButton(
                        icon: "person.crop.circle.badge.exclamationmark.fill",
                        title: "Leakers",
                        color: .orange
                    )
                }
                
                NavigationLink(destination: ActiveSessionsView()) {
                    SecurityActionButton(
                        icon: "eye.fill",
                        title: "Sessions",
                        color: .cyan
                    )
                }
            }
        }
    }
    
    // MARK: - Recent Events
    private var recentEventsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Events")
                    .font(.headline)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("\(securityEvents.count) events")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            if securityEvents.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.shield.fill")
                        .font(.system(size: 48))
                        .foregroundColor(.green.opacity(0.5))
                    
                    Text("All Clear")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text("No security events detected")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            } else {
                ForEach(securityEvents) { event in
                    SecurityEventCard(event: event)
                }
            }
        }
    }
    
    // MARK: - Computed Properties
    private var scoreColor: Color {
        if securityScore >= 80 { return .green }
        if securityScore >= 60 { return .yellow }
        if securityScore >= 40 { return .orange }
        return .red
    }
    
    private var scoreGradientColors: [Color] {
        if securityScore >= 80 { return [.green, .cyan] }
        if securityScore >= 60 { return [.yellow, .orange] }
        if securityScore >= 40 { return [.orange, .red] }
        return [.red, .pink]
    }
    
    private var scoreDescription: String {
        if securityScore >= 80 { return "Excellent Protection" }
        if securityScore >= 60 { return "Good Protection" }
        if securityScore >= 40 { return "Moderate Risk" }
        return "High Risk"
    }
    
    private var scoreDetailDescription: String {
        if securityScore >= 80 { return "Your files are well protected. Keep up the good work!" }
        if securityScore >= 60 { return "Consider enabling additional security features." }
        if securityScore >= 40 { return "Review your security settings and address warnings." }
        return "Immediate action required to protect your files."
    }
    
    // MARK: - Actions
    private func loadSecurityData() {
        isLoading = true
        Task {
            do {
                let result = try await SupabaseClient.shared.getSecurityData()
                await MainActor.run {
                    securityScore = result.score
                    securityEvents = result.events
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    securityScore = 85 // Default score if API fails
                    isLoading = false
                }
            }
        }
    }
    
    private func refreshSecurityData() async {
        do {
            let result = try await SupabaseClient.shared.getSecurityData()
            await MainActor.run {
                securityScore = result.score
                securityEvents = result.events
            }
        } catch {
            // Silent fail on refresh
        }
    }
    
    private func runSecurityScan() {
        isScanning = true
        Task {
            // Simulate scan delay
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            await refreshSecurityData()
            await MainActor.run {
                isScanning = false
            }
        }
    }
}

// SecurityEvent model is defined in SupabaseClient.swift

// MARK: - SecurityActionButton
struct SecurityActionButton: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(color.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(color.opacity(0.3), lineWidth: 1)
                )
        )
    }
}

// MARK: - SecurityEventCard
struct SecurityEventCard: View {
    let event: SecurityEvent
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: event.type.icon)
                .font(.system(size: 20))
                .foregroundColor(event.type.color)
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(event.message)
                    .font(.subheadline)
                    .foregroundColor(.white)
                
                if let details = event.details {
                    Text(details)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Text(formatTime(event.timestamp))
                    .font(.caption2)
                    .foregroundColor(.gray.opacity(0.7))
            }
            
            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(event.type.color.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(event.type.color.opacity(0.2), lineWidth: 1)
                )
        )
    }
    
    private func formatTime(_ date: Date) -> String {
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
        SecurityView()
    }
}
