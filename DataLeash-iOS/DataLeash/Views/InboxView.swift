import SwiftUI

// MARK: - Inbox View
// Shows pending access requests and history with real data from Supabase

struct InboxView: View {
    @State private var pendingRequests: [SupabaseClient.AccessRequestItem] = []
    @State private var historyRequests: [SupabaseClient.AccessRequestItem] = []
    @State private var isLoading = true
    @State private var error: String?
    @State private var processingId: String?
    @State private var selectedTab = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Tab Picker
            Picker("Tab", selection: $selectedTab) {
                HStack {
                    Text("Pending")
                    if !pendingRequests.isEmpty {
                        Text("(\(pendingRequests.count))")
                            .foregroundColor(.orange)
                    }
                }
                .tag(0)
                Text("History")
                    .tag(1)
            }
            .pickerStyle(.segmented)
            .padding()
            
            // Content
            if isLoading {
                Spacer()
                ProgressView().tint(.cyan).scaleEffect(1.5)
                Text("Loading requests...")
                    .foregroundColor(.gray)
                    .padding(.top)
                Spacer()
            } else if let error = error {
                Spacer()
                errorView(error)
                Spacer()
            } else {
                if selectedTab == 0 {
                    pendingSection
                } else {
                    historySection
                }
            }
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("Access Requests")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadRequests() }
        .refreshable { await loadRequests() }
    }
    
    // MARK: - Pending Section
    
    private var pendingSection: some View {
        Group {
            if pendingRequests.isEmpty {
                Spacer()
                emptyPendingView
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(pendingRequests) { request in
                            PendingRequestCard(
                                request: request,
                                isProcessing: processingId == request.id,
                                onApprove: { await respond(request, approve: true) },
                                onDeny: { await respond(request, approve: false) }
                            )
                        }
                    }
                    .padding()
                }
            }
        }
    }
    
    // MARK: - History Section
    
    private var historySection: some View {
        Group {
            if historyRequests.isEmpty {
                Spacer()
                VStack(spacing: 16) {
                    Image(systemName: "clock")
                        .font(.system(size: 50))
                        .foregroundColor(.gray)
                    Text("No request history")
                        .foregroundColor(.gray)
                }
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(historyRequests) { request in
                            HistoryRequestRow(request: request)
                        }
                    }
                    .padding()
                }
            }
        }
    }
    
    // MARK: - Views
    
    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 50))
                .foregroundColor(.orange)
            Text(message)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            Button("Retry") {
                Task { await loadRequests() }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Color.cyan)
            .foregroundColor(.black)
            .fontWeight(.bold)
            .cornerRadius(10)
        }
    }
    
    private var emptyPendingView: some View {
        VStack(spacing: 20) {
            Image(systemName: "tray")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            Text("No pending requests")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.white)
            Text("When someone requests access\nto your files, it will appear here")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
    }
    
    // MARK: - Actions
    
    private func loadRequests() async {
        isLoading = true
        error = nil
        
        do {
            let allRequests = try await SupabaseClient.shared.getAllRequests()
            pendingRequests = allRequests.filter { $0.status == "pending" }
            historyRequests = allRequests.filter { $0.status != "pending" }
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    private func respond(_ request: SupabaseClient.AccessRequestItem, approve: Bool) async {
        processingId = request.id
        
        do {
            try await SupabaseClient.shared.respondToRequest(requestId: request.id, approve: approve)
            await loadRequests()
        } catch {
            self.error = error.localizedDescription
        }
        
        processingId = nil
    }
}

// MARK: - Pending Request Card

struct PendingRequestCard: View {
    let request: SupabaseClient.AccessRequestItem
    let isProcessing: Bool
    let onApprove: () async -> Void
    let onDeny: () async -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack(spacing: 12) {
                // Avatar
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [.orange.opacity(0.3), .yellow.opacity(0.3)], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 50, height: 50)
                    Text(String(request.viewerEmail.prefix(1)).uppercased())
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.orange)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(request.viewerName ?? request.viewerEmail)
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(request.viewerEmail)
                        .font(.caption)
                        .foregroundColor(.gray)
                        .lineLimit(1)
                }
                
                Spacer()
                
                // Pending badge
                Text("PENDING")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.orange)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.2))
                    .cornerRadius(4)
            }
            
            // File info
            HStack(spacing: 8) {
                Image(systemName: "doc.fill")
                    .foregroundColor(.cyan)
                Text("Wants access to:")
                    .foregroundColor(.gray)
                Text(request.fileName ?? "Unknown file")
                    .foregroundColor(.cyan)
                    .fontWeight(.medium)
                    .lineLimit(1)
            }
            .font(.subheadline)
            
            // Device info
            if let ip = request.ipAddress, let device = request.deviceInfo {
                HStack(spacing: 16) {
                    Label(ip, systemImage: "network")
                    Label(device, systemImage: "laptopcomputer")
                }
                .font(.caption)
                .foregroundColor(.gray)
            }
            
            // Time
            Text(request.createdAt, style: .relative)
                .font(.caption)
                .foregroundColor(.gray)
            
            // Action Buttons
            HStack(spacing: 12) {
                Button(action: {
                    Task { await onApprove() }
                }) {
                    HStack {
                        if isProcessing {
                            ProgressView().tint(.white)
                        } else {
                            Image(systemName: "checkmark")
                        }
                        Text("Approve")
                    }
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(isProcessing)
                
                Button(action: {
                    Task { await onDeny() }
                }) {
                    HStack {
                        if isProcessing {
                            ProgressView().tint(.white)
                        } else {
                            Image(systemName: "xmark")
                        }
                        Text("Deny")
                    }
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.red)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(isProcessing)
            }
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.orange.opacity(0.3), lineWidth: 1)
        )
        .cornerRadius(16)
    }
}

// MARK: - History Request Row

struct HistoryRequestRow: View {
    let request: SupabaseClient.AccessRequestItem
    
    var statusColor: Color {
        request.status == "approved" ? .green : .red
    }
    
    var statusIcon: String {
        request.status == "approved" ? "checkmark.circle.fill" : "xmark.circle.fill"
    }
    
    var body: some View {
        HStack(spacing: 12) {
            // Status Icon
            Image(systemName: statusIcon)
                .font(.title2)
                .foregroundColor(statusColor)
            
            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(request.viewerName ?? request.viewerEmail)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Text(request.fileName ?? "Unknown file")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            // Status & Time
            VStack(alignment: .trailing, spacing: 4) {
                Text(request.status.capitalized)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(statusColor)
                
                Text(request.createdAt, style: .relative)
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
        }
        .padding()
        .background(Color.white.opacity(0.03))
        .cornerRadius(12)
    }
}

#Preview {
    NavigationStack {
        InboxView()
    }
}
