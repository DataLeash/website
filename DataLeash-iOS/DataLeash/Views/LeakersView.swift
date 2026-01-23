import SwiftUI

// MARK: - LeakersView
struct LeakersView: View {
    @State private var leakers: [SupabaseClient.LeakerItem] = []
    @State private var counts = SupabaseClient.LeakerCounts()
    @State private var isLoading = true
    @State private var selectedFilter = "all"
    @State private var selectedLeaker: SupabaseClient.LeakerItem?
    
    private let filters = ["all", "unreviewed", "confirmed_leak", "blacklisted", "false_positive"]
    
    var filteredLeakers: [SupabaseClient.LeakerItem] {
        if selectedFilter == "all" {
            return leakers
        }
        return leakers.filter { $0.status == selectedFilter }
    }
    
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
                
                // Stats Cards
                statsCardsView
                
                // Filter Pills
                filterPillsView
                
                // Content
                if isLoading {
                    Spacer()
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.cyan)
                    Text("Loading leaker reports...")
                        .foregroundColor(.gray)
                        .padding(.top, 16)
                    Spacer()
                } else if filteredLeakers.isEmpty {
                    Spacer()
                    emptyStateView
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(filteredLeakers) { leaker in
                                LeakerCard(leaker: leaker) {
                                    selectedLeaker = leaker
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadLeakers()
        }
        .refreshable {
            await refreshLeakers()
        }
        .sheet(item: $selectedLeaker) { leaker in
            LeakerDetailSheet(leaker: leaker, onStatusChange: { newStatus in
                updateStatus(leaker: leaker, status: newStatus)
            })
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "person.crop.circle.badge.exclamationmark.fill")
                    .font(.system(size: 28))
                    .foregroundColor(.orange)
                
                Text("Suspected Leakers")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Spacer()
            }
            
            Text("Detect when someone shares your link to unauthorized recipients")
                .font(.subheadline)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color.black.opacity(0.3))
    }
    
    // MARK: - Stats Cards
    private var statsCardsView: some View {
        HStack(spacing: 12) {
            StatBadge(count: counts.unreviewed, label: "Unreviewed", color: .yellow)
            StatBadge(count: counts.confirmed, label: "Confirmed", color: .red)
            StatBadge(count: counts.blacklisted, label: "Blacklisted", color: .cyan)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
    }
    
    // MARK: - Filter Pills
    private var filterPillsView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(filters, id: \.self) { filter in
                    Button(action: { selectedFilter = filter }) {
                        Text(formatFilterName(filter))
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(selectedFilter == filter ? .black : .white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                selectedFilter == filter
                                    ? AnyShapeStyle(LinearGradient(colors: [.cyan, .blue], startPoint: .leading, endPoint: .trailing))
                                    : AnyShapeStyle(Color.white.opacity(0.1))
                            )
                            .cornerRadius(20)
                    }
                }
            }
            .padding(.horizontal)
        }
        .padding(.bottom, 8)
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Text("✅")
                .font(.system(size: 64))
            
            Text("No Suspected Leakers")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text("No one has been detected sharing\nyour links yet.")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
    
    // MARK: - Helpers
    private func formatFilterName(_ filter: String) -> String {
        if filter == "all" { return "All" }
        return filter.replacingOccurrences(of: "_", with: " ").capitalized
    }
    
    private func loadLeakers() {
        isLoading = true
        Task {
            do {
                let result = try await SupabaseClient.shared.getLeakers()
                await MainActor.run {
                    leakers = result.leakers
                    counts = result.counts
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                }
            }
        }
    }
    
    private func refreshLeakers() async {
        do {
            let result = try await SupabaseClient.shared.getLeakers()
            await MainActor.run {
                leakers = result.leakers
                counts = result.counts
            }
        } catch {
            // Silent fail on refresh
        }
    }
    
    private func updateStatus(leaker: SupabaseClient.LeakerItem, status: String) {
        Task {
            do {
                try await SupabaseClient.shared.updateLeakerStatus(leakerId: leaker.id, status: status)
                selectedLeaker = nil
                loadLeakers()
            } catch {
                print("Failed to update status: \(error)")
            }
        }
    }
}

// MARK: - StatBadge
struct StatBadge: View {
    let count: Int
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text("\(count)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(label)
                .font(.caption2)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
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

// MARK: - LeakerCard
struct LeakerCard: View {
    let leaker: SupabaseClient.LeakerItem
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top) {
                    // Status Icon
                    Text(statusEmoji)
                        .font(.system(size: 32))
                    
                    // Info
                    VStack(alignment: .leading, spacing: 4) {
                        Text(leaker.originalRecipientEmail)
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        HStack {
                            Text("Shared link to:")
                                .foregroundColor(.gray)
                            Text(leaker.fileName ?? "Unknown File")
                                .foregroundColor(.red)
                        }
                        .font(.subheadline)
                        
                        Text("Unauthorized access from: \(leaker.unauthorizedLocation ?? leaker.unauthorizedIp ?? "Unknown")")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    
                    Spacer()
                    
                    // Status Badge & Time
                    VStack(alignment: .trailing, spacing: 4) {
                        Text(leaker.status.replacingOccurrences(of: "_", with: " "))
                            .font(.caption2)
                            .fontWeight(.medium)
                            .foregroundColor(statusColor)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(statusColor.opacity(0.2))
                            .cornerRadius(8)
                        
                        Text(formatTime(leaker.detectedAt))
                            .font(.caption2)
                            .foregroundColor(.gray)
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
    }
    
    private var statusEmoji: String {
        switch leaker.status {
        case "unreviewed": return "⚠️"
        case "confirmed_leak": return "🚨"
        case "blacklisted": return "🚫"
        default: return "✅"
        }
    }
    
    private var statusColor: Color {
        switch leaker.status {
        case "unreviewed": return .yellow
        case "confirmed_leak": return .red
        case "blacklisted": return .cyan
        default: return .green
        }
    }
    
    private func formatTime(_ timestamp: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let date = formatter.date(from: timestamp) else { return timestamp }
        
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

// MARK: - LeakerDetailSheet
struct LeakerDetailSheet: View {
    let leaker: SupabaseClient.LeakerItem
    let onStatusChange: (String) -> Void
    
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.05, green: 0.05, blue: 0.15)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        // Original Recipient
                        VStack(alignment: .leading, spacing: 12) {
                            Label("Original Recipient (Suspected Leaker)", systemImage: "arrow.up.forward.circle.fill")
                                .font(.headline)
                                .foregroundColor(.yellow)
                            
                            VStack(alignment: .leading, spacing: 6) {
                                infoRow(label: "Email", value: leaker.originalRecipientEmail)
                                infoRow(label: "Name", value: leaker.originalRecipientName ?? "Unknown")
                            }
                        }
                        .padding()
                        .background(Color.yellow.opacity(0.1))
                        .cornerRadius(16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.yellow.opacity(0.3), lineWidth: 1)
                        )
                        
                        // Unauthorized Access
                        VStack(alignment: .leading, spacing: 12) {
                            Label("Unauthorized Access", systemImage: "exclamationmark.triangle.fill")
                                .font(.headline)
                                .foregroundColor(.red)
                            
                            VStack(alignment: .leading, spacing: 6) {
                                infoRow(label: "IP", value: leaker.unauthorizedIp ?? "Unknown")
                                infoRow(label: "Location", value: leaker.unauthorizedLocation ?? "Unknown")
                            }
                        }
                        .padding()
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.red.opacity(0.3), lineWidth: 1)
                        )
                        
                        // File Info
                        VStack(alignment: .leading, spacing: 12) {
                            Label("Leaked File", systemImage: "doc.fill")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            VStack(alignment: .leading, spacing: 6) {
                                infoRow(label: "Name", value: leaker.fileName ?? "Unknown")
                                infoRow(label: "Detection", value: leaker.detectionType.replacingOccurrences(of: "_", with: " "))
                                infoRow(label: "Detected", value: formatDate(leaker.detectedAt))
                            }
                        }
                        .padding()
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                        
                        // Actions
                        VStack(spacing: 12) {
                            Button(action: { onStatusChange("confirmed_leak") }) {
                                HStack {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                    Text("Confirm as Leak")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.red.opacity(0.2))
                                .foregroundColor(.red)
                                .cornerRadius(12)
                            }
                            
                            Button(action: { onStatusChange("blacklisted") }) {
                                HStack {
                                    Image(systemName: "hand.raised.slash.fill")
                                    Text("Blacklist Both")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.cyan.opacity(0.2))
                                .foregroundColor(.cyan)
                                .cornerRadius(12)
                            }
                            
                            Button(action: { onStatusChange("false_positive") }) {
                                HStack {
                                    Image(systemName: "checkmark.circle.fill")
                                    Text("False Positive")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white.opacity(0.1))
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }
                        }
                        .padding(.top)
                    }
                    .padding()
                }
            }
            .navigationTitle("Leak Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        dismiss()
                    }
                    .foregroundColor(.cyan)
                }
            }
        }
    }
    
    private func infoRow(label: String, value: String) -> some View {
        HStack {
            Text("\(label):")
                .foregroundColor(.gray)
            Text(value)
                .foregroundColor(.white)
        }
        .font(.subheadline)
    }
    
    private func formatDate(_ timestamp: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let date = formatter.date(from: timestamp) else { return timestamp }
        
        let displayFormatter = DateFormatter()
        displayFormatter.dateFormat = "MMM d, yyyy 'at' h:mm a"
        return displayFormatter.string(from: date)
    }
}

#Preview {
    NavigationView {
        LeakersView()
    }
}
