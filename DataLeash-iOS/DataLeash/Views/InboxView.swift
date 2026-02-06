import SwiftUI

// MARK: - Inbox View (Access Requests)
// Manage incoming access requests

struct InboxView: View {
    @State private var requests: [SupabaseClient.AccessRequestItem] = []
    @State private var isLoading = true
    
    var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea()
            
            if isLoading {
                ProgressView().tint(.cyan)
            } else if requests.isEmpty {
                VStack(spacing: 15) {
                    Image(systemName: "tray")
                        .font(.system(size: 50))
                        .foregroundColor(.gray)
                    Text("No pending requests")
                        .foregroundColor(.gray)
                }
            } else {
                List {
                    ForEach(requests) { req in
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Image(systemName: "person.circle.fill")
                                    .foregroundColor(.cyan)
                                Text(req.viewerEmail)
                                    .font(.headline)
                                    .foregroundColor(.white)
                            }
                            
                            Text("Requested access to:")
                                .font(.caption)
                                .foregroundColor(.gray)
                            
                            HStack {
                                Image(systemName: "doc.fill")
                                    .foregroundColor(.gray)
                                Text(req.fileName ?? "Unknown File")
                                    .foregroundColor(.white)
                            }
                            .padding(8)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(8)
                            
                            HStack(spacing: 12) {
                                Button(action: { Task { await respond(req, approve: false) } }) {
                                    Text("Deny")
                                        .fontWeight(.semibold)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 8)
                                        .background(Color.red.opacity(0.2))
                                        .foregroundColor(.red)
                                        .cornerRadius(8)
                                }
                                
                                Button(action: { Task { await respond(req, approve: true) } }) {
                                    Text("Approve")
                                        .fontWeight(.semibold)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 8)
                                        .background(Color.green.opacity(0.2))
                                        .foregroundColor(.green)
                                        .cornerRadius(8)
                                }
                            }
                        }
                        .padding(.vertical, 8)
                        .listRowBackground(Color.white.opacity(0.05))
                    }
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
                .refreshable {
                    await loadRequests()
                }
            }
        }
        .navigationTitle("Access Requests")
        .task {
            await loadRequests()
        }
    }
    
    private func loadRequests() async {
        isLoading = true
        do {
            requests = try await SupabaseClient.shared.getPendingRequests()
        } catch {
            print("Error loading requests: \(error)")
        }
        isLoading = false
    }
    
    private func respond(_ req: SupabaseClient.AccessRequestItem, approve: Bool) async {
        do {
            try await SupabaseClient.shared.respondToRequest(requestId: req.id, approve: approve)
            await loadRequests()
        } catch {
            print("Error responding: \(error)")
        }
    }
}
