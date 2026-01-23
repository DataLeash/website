import SwiftUI

// BlacklistEntry model is defined in SupabaseClient.swift

// MARK: - BlacklistView
struct BlacklistView: View {
    @State private var entries: [BlacklistEntry] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showingAddSheet = false
    @State private var newEmail = ""
    @State private var newReason = ""
    
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
                
                // Content
                if isLoading {
                    Spacer()
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.cyan)
                    Text("Loading blacklist...")
                        .foregroundColor(.gray)
                        .padding(.top, 16)
                    Spacer()
                } else if let error = errorMessage {
                    Spacer()
                    errorView(message: error)
                    Spacer()
                } else if entries.isEmpty {
                    Spacer()
                    emptyStateView
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(entries) { entry in
                                BlacklistEntryCard(entry: entry, onRemove: {
                                    removeFromBlacklist(entry)
                                })
                            }
                        }
                        .padding()
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingAddSheet = true }) {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(.cyan)
                }
            }
        }
        .sheet(isPresented: $showingAddSheet) {
            addBlacklistSheet
        }
        .onAppear {
            loadBlacklist()
        }
        .refreshable {
            await refreshBlacklist()
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "hand.raised.slash.fill")
                    .font(.system(size: 28))
                    .foregroundColor(.red)
                
                Text("Blacklist")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("\(entries.count)")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.red)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.red.opacity(0.2))
                    .cornerRadius(12)
            }
            
            Text("Blocked devices and users are denied access to all your files")
                .font(.subheadline)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color.black.opacity(0.3))
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "shield.checkmark.fill")
                .font(.system(size: 64))
                .foregroundStyle(
                    LinearGradient(
                        colors: [.green, .cyan],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            
            Text("No Blocked Devices")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text("When you blacklist someone from Active Viewers\nor access requests, they'll appear here.")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            
            Button(action: { showingAddSheet = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add to Blacklist")
                }
                .font(.headline)
                .foregroundColor(.black)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(
                    LinearGradient(
                        colors: [.cyan, .blue],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(12)
            }
            .padding(.top, 8)
        }
        .padding()
    }
    
    // MARK: - Error View
    private func errorView(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundColor(.orange)
            
            Text("Database Setup Required")
                .font(.headline)
                .foregroundColor(.orange)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            
            Button("Retry") {
                loadBlacklist()
            }
            .font(.headline)
            .foregroundColor(.black)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Color.cyan)
            .cornerRadius(12)
        }
        .padding()
    }
    
    // MARK: - Add Blacklist Sheet
    private var addBlacklistSheet: some View {
        NavigationView {
            ZStack {
                Color(red: 0.05, green: 0.05, blue: 0.15)
                    .ignoresSafeArea()
                
                VStack(spacing: 24) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Email Address")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                        
                        TextField("user@example.com", text: $newEmail)
                            .textFieldStyle(.plain)
                            .padding()
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(12)
                            .foregroundColor(.white)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Reason (Optional)")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                        
                        TextField("Why are you blocking this user?", text: $newReason)
                            .textFieldStyle(.plain)
                            .padding()
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(12)
                            .foregroundColor(.white)
                    }
                    
                    Spacer()
                    
                    Button(action: addToBlacklist) {
                        HStack {
                            Image(systemName: "hand.raised.slash.fill")
                            Text("Add to Blacklist")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            LinearGradient(
                                colors: [.red, .orange],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(12)
                    }
                    .disabled(newEmail.isEmpty)
                    .opacity(newEmail.isEmpty ? 0.5 : 1)
                }
                .padding()
            }
            .navigationTitle("Block User")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        showingAddSheet = false
                    }
                    .foregroundColor(.cyan)
                }
            }
        }
    }
    
    // MARK: - API Functions
    private func loadBlacklist() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                entries = try await SupabaseClient.shared.getBlacklist()
                isLoading = false
            } catch {
                errorMessage = error.localizedDescription
                isLoading = false
            }
        }
    }
    
    private func refreshBlacklist() async {
        do {
            entries = try await SupabaseClient.shared.getBlacklist()
        } catch {
            // Silent fail on refresh
        }
    }
    
    private func removeFromBlacklist(_ entry: BlacklistEntry) {
        Task {
            do {
                try await SupabaseClient.shared.removeFromBlacklist(id: entry.id)
                if let index = entries.firstIndex(where: { $0.id == entry.id }) {
                    await MainActor.run {
                        entries.remove(at: index)
                    }
                }
            } catch {
                print("Failed to remove from blacklist: \(error)")
            }
        }
    }
    
    private func addToBlacklist() {
        Task {
            do {
                try await SupabaseClient.shared.addToBlacklist(email: newEmail, reason: newReason)
                showingAddSheet = false
                newEmail = ""
                newReason = ""
                loadBlacklist()
            } catch {
                print("Failed to add to blacklist: \(error)")
            }
        }
    }
}

// MARK: - BlacklistEntryCard
struct BlacklistEntryCard: View {
    let entry: BlacklistEntry
    let onRemove: () -> Void
    
    @State private var showingRemoveAlert = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack(alignment: .top) {
                // Icon
                ZStack {
                    Circle()
                        .fill(Color.red.opacity(0.2))
                        .frame(width: 48, height: 48)
                    
                    Image(systemName: "hand.raised.slash.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.red)
                }
                
                // Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(entry.blocked_name ?? entry.blocked_email)
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text(entry.blocked_email)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                // Remove button
                Button(action: { showingRemoveAlert = true }) {
                    Text("Remove")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.red)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.red, lineWidth: 1)
                        )
                }
            }
            
            // Stats Grid
            HStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Blocked")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(formatDate(entry.blocked_at))
                        .font(.caption)
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Location")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(formatLocation(entry.ip_info))
                        .font(.caption)
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Match Attempts")
                        .font(.caption)
                        .foregroundColor(.gray)
                    HStack(spacing: 4) {
                        Text("\(entry.match_count)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(entry.match_count > 0 ? .red : .white)
                        if entry.match_count > 0 {
                            Text("⚠️")
                                .font(.caption2)
                        }
                    }
                }
            }
            
            // Reason
            if let reason = entry.reason, !reason.isEmpty {
                HStack(spacing: 8) {
                    Text("Reason:")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(reason)
                        .font(.caption)
                        .foregroundColor(.white)
                }
                .padding(10)
                .background(Color.black.opacity(0.3))
                .cornerRadius(8)
            }
            
            // Device info
            if let fingerprint = entry.fingerprint {
                HStack(spacing: 8) {
                    Image(systemName: "desktopcomputer")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text("\(fingerprint.browser ?? "Unknown") on \(fingerprint.os ?? "Unknown")")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            // Last match
            if let lastMatch = entry.last_match_at {
                Text("Last attempted access: \(formatDate(lastMatch))")
                    .font(.caption2)
                    .foregroundColor(.red)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.red.opacity(0.3), lineWidth: 1)
                )
        )
        .alert("Remove from Blacklist?", isPresented: $showingRemoveAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Remove", role: .destructive) {
                onRemove()
            }
        } message: {
            Text("\(entry.blocked_email) will be able to access your files again.")
        }
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateFormat = "MMM d, yyyy"
            return displayFormatter.string(from: date)
        }
        return dateString
    }
    
    private func formatLocation(_ ipInfo: BlacklistEntry.IpInfo?) -> String {
        guard let info = ipInfo else { return "Unknown" }
        let city = info.city ?? "Unknown"
        let country = info.country ?? "Unknown"
        return "\(city), \(country)"
    }
}

#Preview {
    NavigationView {
        BlacklistView()
    }
}
