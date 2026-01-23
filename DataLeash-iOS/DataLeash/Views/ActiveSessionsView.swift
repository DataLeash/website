import SwiftUI

// MARK: - Active Sessions View
// Shows who is currently viewing files in real-time

struct ActiveSessionsView: View {
    @State private var sessions: [ViewingSession] = []
    @State private var isLoading = true
    @State private var error: String?
    
    var body: some View {
        VStack(spacing: 0) {
            // Stats Header
            if !sessions.isEmpty {
                HStack {
                    VStack(alignment: .leading) {
                        Text("\(sessions.count)")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                        Text("Active viewers")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    Spacer()
                    Circle()
                        .fill(Color.green)
                        .frame(width: 12, height: 12)
                        .overlay(
                            Circle()
                                .stroke(Color.green.opacity(0.5), lineWidth: 4)
                                .scaleEffect(1.5)
                        )
                }
                .padding()
                .background(Color.green.opacity(0.1))
            }
            
            // Content
            if isLoading {
                Spacer()
                ProgressView().tint(.cyan).scaleEffect(1.5)
                Spacer()
            } else if let error = error {
                Spacer()
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.orange)
                    Text(error)
                        .foregroundColor(.gray)
                    Button("Retry") { Task { await loadSessions() } }
                        .foregroundColor(.cyan)
                }
                Spacer()
            } else if sessions.isEmpty {
                Spacer()
                VStack(spacing: 16) {
                    Image(systemName: "eye.slash")
                        .font(.system(size: 60))
                        .foregroundColor(.gray)
                    Text("No active viewers")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    Text("When someone views your files,\nthey'll appear here in real-time")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                }
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(sessions) { session in
                            SessionCard(session: session) {
                                await killSession(session.id)
                            }
                        }
                    }
                    .padding()
                }
            }
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("Active Sessions")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { Task { await loadSessions() } }) {
                    Image(systemName: "arrow.clockwise")
                        .foregroundColor(.cyan)
                }
            }
        }
        .task { await loadSessions() }
        .refreshable { await loadSessions() }
    }
    
    private func loadSessions() async {
        isLoading = true
        error = nil
        
        do {
            guard let userId = AuthService.shared.currentUser?.id,
                  let token = AuthService.shared.accessToken else {
                throw URLError(.userAuthenticationRequired)
            }
            
            // Get file IDs first
            let filesUrl = URL(string: "\(Config.supabaseURL)/rest/v1/files?owner_id=eq.\(userId)&is_destroyed=eq.false&select=id")!
            var filesReq = URLRequest(url: filesUrl)
            filesReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
            filesReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            
            let (filesData, _) = try await URLSession.shared.data(for: filesReq)
            guard let files = try? JSONSerialization.jsonObject(with: filesData) as? [[String: Any]] else {
                sessions = []
                isLoading = false
                return
            }
            
            let fileIds = files.compactMap { $0["id"] as? String }
            if fileIds.isEmpty {
                sessions = []
                isLoading = false
                return
            }
            
            // Get active sessions
            let idsJoined = fileIds.joined(separator: ",")
            let sessionsUrl = URL(string: "\(Config.supabaseURL)/rest/v1/viewing_sessions?file_id=in.(\(idsJoined))&is_active=eq.true&select=*")!
            var sessionsReq = URLRequest(url: sessionsUrl)
            sessionsReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
            sessionsReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            
            let (sessionsData, _) = try await URLSession.shared.data(for: sessionsReq)
            
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            decoder.dateDecodingStrategy = .iso8601
            
            sessions = (try? decoder.decode([ViewingSession].self, from: sessionsData)) ?? []
            
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    private func killSession(_ sessionId: String) async {
        guard let token = AuthService.shared.accessToken else { return }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/viewing_sessions?id=eq.\(sessionId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try? JSONSerialization.data(withJSONObject: [
            "is_active": false,
            "ended_at": ISO8601DateFormatter().string(from: Date())
        ])
        
        _ = try? await URLSession.shared.data(for: request)
        
        // Remove from list
        sessions.removeAll { $0.id == sessionId }
    }
}

// MARK: - Viewing Session Model

struct ViewingSession: Identifiable, Codable {
    let id: String
    let fileId: String
    let viewerEmail: String?
    let viewerName: String?
    let ipAddress: String?
    let deviceInfo: String?
    let startedAt: Date
    let isActive: Bool
    
    var displayName: String {
        viewerName ?? viewerEmail ?? "Anonymous"
    }
}

// MARK: - Session Card

struct SessionCard: View {
    let session: ViewingSession
    let onKill: () async -> Void
    
    @State private var isKilling = false
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                // Avatar
                ZStack {
                    Circle()
                        .fill(Color.green.opacity(0.2))
                        .frame(width: 50, height: 50)
                    Text(String(session.displayName.prefix(1)).uppercased())
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }
                
                // Info
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(session.displayName)
                            .font(.headline)
                            .foregroundColor(.white)
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                    }
                    if let email = session.viewerEmail, session.viewerName != nil {
                        Text(email)
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
                
                Spacer()
                
                // Duration
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Viewing")
                        .font(.caption)
                        .foregroundColor(.green)
                    Text(session.startedAt, style: .relative)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            // Device Info Row
            HStack(spacing: 16) {
                if let ip = session.ipAddress {
                    Label(ip, systemImage: "network")
                }
                if let device = session.deviceInfo {
                    Label(device, systemImage: "laptopcomputer")
                }
                Spacer()
            }
            .font(.caption)
            .foregroundColor(.gray)
            
            // Kill Session Button
            Button(action: {
                isKilling = true
                Task {
                    await onKill()
                    isKilling = false
                }
            }) {
                HStack {
                    if isKilling {
                        ProgressView().tint(.white)
                    } else {
                        Image(systemName: "xmark.circle.fill")
                        Text("End Session")
                    }
                }
                .font(.subheadline)
                .fontWeight(.bold)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.red)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(isKilling)
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.green.opacity(0.3), lineWidth: 1)
        )
        .cornerRadius(16)
    }
}

#Preview {
    NavigationStack {
        ActiveSessionsView()
    }
}
