import SwiftUI

// MARK: - Inbox View
// Shows pending access requests with real data from Supabase

struct InboxView: View {
    @State private var requests: [SupabaseClient.AccessRequestItem] = []
    @State private var isLoading = true
    @State private var error: String?
    
    var body: some View {
        VStack(spacing: 0) {
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
            } else if requests.isEmpty {
                Spacer()
                emptyView
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(requests) { request in
                            AccessRequestCard(
                                request: request,
                                onApprove: { await respond(request, approve: true) },
                                onDeny: { await respond(request, approve: false) }
                            )
                        }
                    }
                    .padding()
                    .padding(.bottom, 80)
                }
            }
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("Access Requests")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { Task { await loadRequests() } }) {
                    Image(systemName: "arrow.clockwise")
                }
            }
        }
        .task { await loadRequests() }
        .refreshable { await loadRequests() }
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
    
    private var emptyView: some View {
        VStack(spacing: 20) {
            Image(systemName: "tray")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            Text("No Pending Requests")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text("When someone attempts to view one of your protected files, their request will appear here for you to approve or deny.")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            
            Button("Check Again") {
                Task { await loadRequests() }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Color.white.opacity(0.1))
            .foregroundColor(.white)
            .cornerRadius(10)
            .padding(.top, 10)
        }
    }
    
    private func loadRequests() async {
        isLoading = true
        error = nil
        
        do {
            requests = try await SupabaseClient.shared.getPendingRequests()
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    private func respond(_ request: SupabaseClient.AccessRequestItem, approve: Bool) async {
        do {
            try await SupabaseClient.shared.respondToRequest(requestId: request.id, approve: approve)
            await loadRequests()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

// MARK: - Access Request Card

struct AccessRequestCard: View {
    let request: SupabaseClient.AccessRequestItem
    let onApprove: () async -> Void
    let onDeny: () async -> Void
    
    @State private var isProcessing = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [.cyan.opacity(0.3), .blue.opacity(0.3)], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 44, height: 44)
                    Text(String(request.viewerEmail.prefix(1)).uppercased())
                        .font(.headline)
                        .foregroundColor(.cyan)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(request.viewerName ?? request.viewerEmail)
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(request.viewerEmail)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                Text(request.createdAt, style: .relative)
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            // File info
            HStack {
                Image(systemName: "doc.fill")
                    .foregroundColor(.cyan)
                Text("Wants access to: ")
                    .foregroundColor(.gray)
                    .font(.subheadline)
                + Text(request.fileName ?? "Unknown file")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.05))
            .cornerRadius(8)
            .frame(maxWidth: .infinity, alignment: .leading)
            
            // Actions
            HStack(spacing: 12) {
                Button(action: {
                    isProcessing = true
                    Task {
                        await onApprove()
                        isProcessing = false
                    }
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
                    .padding(.vertical, 12)
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .disabled(isProcessing)
                
                Button(action: {
                    isProcessing = true
                    Task {
                        await onDeny()
                        isProcessing = false
                    }
                }) {
                    HStack {
                        Image(systemName: "xmark")
                        Text("Deny")
                    }
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.red.opacity(0.8))
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .disabled(isProcessing)
            }
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
    }
}

#Preview {
    NavigationStack {
        InboxView()
    }
}
