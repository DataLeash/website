import SwiftUI

// MARK: - File Detail View
// Shows detailed analytics for a single file

struct FileDetailView: View {
    let file: SupabaseClient.FileItem
    
    @State private var viewers: [SupabaseClient.AccessRequestItem] = []
    @State private var receivers: [FileReceiver] = []
    @State private var activity: [SupabaseClient.ActivityItem] = []
    @State private var isLoading = true
    @State private var showKillAlert = false
    @State private var showShareSheet = false
    @State private var showRevokeAllAlert = false
    @State private var revokeTarget: FileReceiver?
    @State private var copied = false
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // File Header Card
                fileHeaderCard
                
                // Stats Row
                statsRow
                
                // Quick Actions
                quickActions
                
                // Shared With Section (NEW - with revoke)
                sharedWithSection
                
                // Viewers Section (access requests)
                viewersSection
                
                // Activity Section
                activitySection
            }
            .padding()
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("File Details")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadDetails() }
        .refreshable { await loadDetails() }
        .alert("Kill File?", isPresented: $showKillAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Kill", role: .destructive) {
                Task {
                    try? await SupabaseClient.shared.killFile(fileId: file.id)
                    dismiss()
                }
            }
        } message: {
            Text("This will permanently destroy '\(file.originalName)' and revoke all access. This cannot be undone.")
        }
        .alert("Revoke All Access?", isPresented: $showRevokeAllAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Revoke All", role: .destructive) {
                Task { await revokeAllAccess() }
            }
        } message: {
            Text("This will immediately revoke access for all \(receivers.count) recipients.")
        }
        .alert("Revoke Access?", isPresented: .init(
            get: { revokeTarget != nil },
            set: { if !$0 { revokeTarget = nil } }
        )) {
            Button("Cancel", role: .cancel) { revokeTarget = nil }
            Button("Revoke", role: .destructive) {
                if let target = revokeTarget {
                    Task { await revokeAccess(target) }
                }
            }
        } message: {
            Text("Revoke access for \(revokeTarget?.name ?? revokeTarget?.email ?? "this user")?")
        }
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: [file.shareableLink])
        }
    }
    
    // MARK: - File Header
    
    private var fileHeaderCard: some View {
        VStack(spacing: 16) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 20)
                    .fill(LinearGradient(colors: [.cyan.opacity(0.3), .blue.opacity(0.3)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 80, height: 80)
                Image(systemName: file.iconName)
                    .font(.system(size: 36))
                    .foregroundColor(.cyan)
            }
            
            // Name
            Text(file.originalName)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
            
            // Meta info
            HStack(spacing: 16) {
                Label(file.mimeType ?? "Unknown", systemImage: "doc.fill")
                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                    Text(file.createdAt, style: .date)
                }
            }
            .font(.caption)
            .foregroundColor(.gray)
            
            // Status
            HStack {
                Circle()
                    .fill(file.isDestroyed ? Color.red : Color.green)
                    .frame(width: 8, height: 8)
                Text(file.isDestroyed ? "Destroyed" : "Active")
                    .font(.caption)
                    .foregroundColor(file.isDestroyed ? .red : .green)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(file.isDestroyed ? Color.red.opacity(0.2) : Color.green.opacity(0.2))
            .cornerRadius(20)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
    }
    
    // MARK: - Stats Row
    
    private var statsRow: some View {
        HStack(spacing: 12) {
            StatMini(icon: "eye.fill", value: "\(file.totalViews)", label: "Views", color: .cyan)
            StatMini(icon: "person.2.fill", value: "\(viewers.count)", label: "Viewers", color: .purple)
            StatMini(icon: "clock.fill", value: formatAge(), label: "Age", color: .orange)
        }
    }
    
    private func formatAge() -> String {
        let days = Calendar.current.dateComponents([.day], from: file.createdAt, to: Date()).day ?? 0
        if days == 0 { return "Today" }
        if days == 1 { return "1 day" }
        return "\(days) days"
    }
    
    // MARK: - Quick Actions
    
    private var quickActions: some View {
        HStack(spacing: 12) {
            // Copy Link
            Button(action: copyLink) {
                VStack(spacing: 4) {
                    Image(systemName: copied ? "checkmark" : "link")
                        .font(.title3)
                    Text(copied ? "Copied!" : "Copy Link")
                        .font(.caption2)
                }
                .foregroundColor(.cyan)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.cyan.opacity(0.1))
                .cornerRadius(12)
            }
            
            // Share
            Button(action: { showShareSheet = true }) {
                VStack(spacing: 4) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.title3)
                    Text("Share")
                        .font(.caption2)
                }
                .foregroundColor(.blue)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(12)
            }
            
            // Kill
            Button(action: { showKillAlert = true }) {
                VStack(spacing: 4) {
                    Image(systemName: "xmark.octagon.fill")
                        .font(.title3)
                    Text("Kill")
                        .font(.caption2)
                }
                .foregroundColor(.red)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.red.opacity(0.1))
                .cornerRadius(12)
            }
            .disabled(file.isDestroyed)
        }
    }
    
    // MARK: - Viewers Section
    
    private var viewersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Viewers")
                .font(.headline)
                .foregroundColor(.white)
            
            if isLoading {
                ProgressView().tint(.cyan).frame(maxWidth: .infinity).padding()
            } else if viewers.isEmpty {
                Text("No viewers yet")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity)
                    .padding()
            } else {
                ForEach(viewers) { viewer in
                    HStack {
                        Circle()
                            .fill(statusColor(viewer.status))
                            .frame(width: 8, height: 8)
                        Text(viewer.viewerEmail)
                            .font(.subheadline)
                            .foregroundColor(.white)
                        Spacer()
                        Text(viewer.status.capitalized)
                            .font(.caption)
                            .foregroundColor(statusColor(viewer.status))
                    }
                    .padding(.vertical, 8)
                }
            }
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
    }
    
    private func statusColor(_ status: String) -> Color {
        switch status {
        case "approved": return .green
        case "pending": return .orange
        case "denied": return .red
        default: return .gray
        }
    }
    
    // MARK: - Activity Section
    
    private var activitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Activity")
                .font(.headline)
                .foregroundColor(.white)
            
            if isLoading {
                ProgressView().tint(.cyan).frame(maxWidth: .infinity).padding()
            } else if activity.isEmpty {
                Text("No activity yet")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity)
                    .padding()
            } else {
                ForEach(activity.prefix(10)) { item in
                    HStack(spacing: 12) {
                        Image(systemName: item.iconName)
                            .foregroundColor(iconColor(item.iconColor))
                            .frame(width: 24)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.displayAction)
                                .font(.subheadline)
                                .foregroundColor(.white)
                            if let email = item.viewerEmail {
                                Text(email)
                                    .font(.caption)
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
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
    }
    
    private func iconColor(_ colorName: String) -> Color {
        switch colorName {
        case "cyan": return .cyan
        case "red": return .red
        case "green": return .green
        case "orange": return .orange
        case "blue": return .blue
        default: return .gray
        }
    }
    
    // MARK: - Shared With Section
    
    private var sharedWithSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Shared With")
                    .font(.headline)
                    .foregroundColor(.white)
                
                Spacer()
                
                if !receivers.isEmpty {
                    Button(action: { showRevokeAllAlert = true }) {
                        HStack(spacing: 4) {
                            Image(systemName: "xmark.circle")
                            Text("Revoke All")
                        }
                        .font(.caption)
                        .foregroundColor(.red)
                    }
                }
            }
            
            if isLoading {
                ProgressView().tint(.cyan).frame(maxWidth: .infinity).padding()
            } else if receivers.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "person.slash")
                        .font(.system(size: 30))
                        .foregroundColor(.gray)
                    Text("Not shared with anyone yet")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .frame(maxWidth: .infinity)
                .padding()
            } else {
                ForEach(receivers.filter { $0.status != "revoked" }) { receiver in
                    HStack(spacing: 12) {
                        // Avatar
                        ZStack {
                            Circle()
                                .fill(Color.cyan.opacity(0.2))
                                .frame(width: 40, height: 40)
                            Text(String(receiver.email.prefix(1)).uppercased())
                                .font(.headline)
                                .foregroundColor(.cyan)
                        }
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(receiver.name ?? receiver.email)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.white)
                            
                            HStack(spacing: 8) {
                                Label("\(receiver.viewCount)", systemImage: "eye")
                                if let lastViewed = receiver.lastViewedAt {
                                    Text("•")
                                    Text(lastViewed, style: .relative)
                                }
                            }
                            .font(.caption)
                            .foregroundColor(.gray)
                        }
                        
                        Spacer()
                        
                        // Status badge
                        Text(receiver.status.capitalized)
                            .font(.caption2)
                            .fontWeight(.medium)
                            .foregroundColor(receiverStatusColor(receiver.status))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(receiverStatusColor(receiver.status).opacity(0.2))
                            .cornerRadius(4)
                        
                        // Revoke button
                        Button(action: { revokeTarget = receiver }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.red.opacity(0.7))
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
    }
    
    private func receiverStatusColor(_ status: String) -> Color {
        switch status {
        case "approved": return .green
        case "pending": return .orange
        case "revoked": return .red
        default: return .gray
        }
    }
    
    // MARK: - Actions
    
    private func copyLink() {
        UIPasteboard.general.string = file.shareableLink
        copied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { copied = false }
    }
    
    private func revokeAccess(_ receiver: FileReceiver) async {
        do {
            try await SupabaseClient.shared.revokeUserAccess(fileId: file.id, accessId: receiver.id)
            await loadDetails()
        } catch {
            print("Revoke error: \(error)")
        }
        revokeTarget = nil
    }
    
    private func revokeAllAccess() async {
        do {
            try await SupabaseClient.shared.revokeAllAccess(fileId: file.id)
            await loadDetails()
        } catch {
            print("Revoke all error: \(error)")
        }
    }
    
    private func loadDetails() async {
        isLoading = true
        
        // Load receivers (who has access)
        receivers = (try? await SupabaseClient.shared.getFileReceivers(fileId: file.id)) ?? []
        
        // Load viewers (access requests for this file)
        let allRequests = try? await SupabaseClient.shared.getAllRequests()
        viewers = allRequests?.filter { $0.fileId == file.id } ?? []
        
        // Load activity for this file
        let allActivity = try? await SupabaseClient.shared.getRecentActivity(limit: 50)
        activity = allActivity?.filter { $0.fileName == file.originalName } ?? []
        
        isLoading = false
    }
}

// MARK: - Stat Mini

struct StatMini: View {
    let icon: String
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.white)
            Text(label)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
    }
}

#Preview {
    NavigationStack {
        FileDetailView(file: SupabaseClient.FileItem(
            id: "test",
            originalName: "test_photo.jpg",
            mimeType: "image/jpeg",
            createdAt: Date(),
            isDestroyed: false,
            totalViews: 42,
            shareableLink: "https://dataleash.vercel.app/view/test"
        ))
    }
}
