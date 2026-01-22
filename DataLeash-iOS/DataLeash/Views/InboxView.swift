import SwiftUI

// MARK: - Inbox View (Real API Data)

struct InboxView: View {
    @State private var requests: [APIClient.AccessRequestResponse] = []
    @State private var isLoading = true
    @State private var error: String?
    
    var body: some View {
        VStack(spacing: 0) {
            if isLoading {
                Spacer()
                ProgressView().tint(.cyan)
                Spacer()
            } else if let error = error {
                Spacer()
                VStack(spacing: 15) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 50))
                        .foregroundColor(.orange)
                    Text(error)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    Button("Retry") {
                        Task { await loadRequests() }
                    }
                    .foregroundColor(.cyan)
                }
                Spacer()
            } else if requests.isEmpty {
                Spacer()
                VStack(spacing: 15) {
                    Image(systemName: "tray")
                        .font(.system(size: 50))
                        .foregroundColor(.gray)
                    Text("No pending requests")
                        .font(.title3)
                        .foregroundColor(.white)
                    Text("When someone requests access to your files,\nit will appear here")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                }
                Spacer()
            } else {
                List {
                    ForEach(requests, id: \.id) { request in
                        RequestRowView(request: request, onApprove: {
                            await handleResponse(request, action: "approve")
                        }, onDeny: {
                            await handleResponse(request, action: "deny")
                        })
                        .listRowBackground(Color.white.opacity(0.05))
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("Access Requests")
        .task {
            await loadRequests()
        }
        .refreshable {
            await loadRequests()
        }
    }
    
    private func loadRequests() async {
        isLoading = true
        error = nil
        
        do {
            requests = try await APIClient.shared.getPendingRequests()
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    private func handleResponse(_ request: APIClient.AccessRequestResponse, action: String) async {
        do {
            try await APIClient.shared.respondToRequest(requestId: request.id, action: action)
            await loadRequests()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

// MARK: - Request Row

struct RequestRowView: View {
    let request: APIClient.AccessRequestResponse
    let onApprove: () async -> Void
    let onDeny: () async -> Void
    @State private var isProcessing = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "doc.fill")
                    .foregroundColor(.cyan)
                VStack(alignment: .leading) {
                    Text(request.file?.originalName ?? "Unknown file")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(request.viewerEmail)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                Spacer()
                if !request.createdAt.isEmpty {
                    Text(formatDate(request.createdAt))
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
            }
            
            if let name = request.viewerName, !name.isEmpty {
                Text("From: \(name)")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
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
                            Text("Approve")
                        }
                    }
                    .font(.caption)
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(8)
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
                    .font(.caption)
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.red.opacity(0.8))
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
                .disabled(isProcessing)
            }
        }
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
        InboxView()
    }
}
