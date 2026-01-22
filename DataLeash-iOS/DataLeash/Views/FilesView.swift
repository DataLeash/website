import SwiftUI

// MARK: - Files View
// Shows user's files with real data from Supabase

struct FilesView: View {
    @State private var files: [SupabaseClient.FileItem] = []
    @State private var isLoading = true
    @State private var error: String?
    @State private var searchText = ""
    
    var filteredFiles: [SupabaseClient.FileItem] {
        if searchText.isEmpty { return files }
        return files.filter { $0.originalName.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Search
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                TextField("Search files...", text: $searchText)
                    .foregroundColor(.white)
                if !searchText.isEmpty {
                    Button(action: { searchText = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.gray)
                    }
                }
            }
            .padding()
            .background(Color.white.opacity(0.08))
            .cornerRadius(12)
            .padding()
            
            // Content
            if isLoading {
                Spacer()
                ProgressView().tint(.cyan).scaleEffect(1.5)
                Spacer()
            } else if let error = error {
                Spacer()
                errorView(error)
                Spacer()
            } else if files.isEmpty {
                Spacer()
                emptyView
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(filteredFiles) { file in
                            NavigationLink(destination: FileDetailScreen(file: file, onKill: { await loadFiles() })) {
                                FileCard(file: file)
                                    .contentShape(Rectangle()) // Make fully tappable
                            }
                            .buttonStyle(PlainButtonStyle()) // Avoid blue highlight issues
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 80) // Space for tab bar
                }
            }
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("My Files")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadFiles() }
        .refreshable { await loadFiles() }
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
                Task { await loadFiles() }
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
            Image(systemName: "folder.badge.plus")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            Text("No files yet")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.white)
            Text("Upload files from the web dashboard\nat dataleash.vercel.app")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
    }
    
    private func loadFiles() async {
        isLoading = true
        error = nil
        
        do {
            files = try await SupabaseClient.shared.getMyFiles()
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
}

// MARK: - File Card

struct FileCard: View {
    let file: SupabaseClient.FileItem
    
    var body: some View {
        HStack(spacing: 16) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(LinearGradient(colors: [.cyan.opacity(0.3), .blue.opacity(0.3)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 50, height: 50)
                Image(systemName: file.iconName)
                    .font(.title2)
                    .foregroundColor(.cyan)
            }
            
            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(file.originalName)
                    .font(.headline)
                    .foregroundColor(.white)
                    .lineLimit(1)
                HStack(spacing: 8) {
                    Label("\(file.totalViews)", systemImage: "eye")
                    Text("•")
                    Text(file.createdAt, style: .relative)
                }
                .font(.caption)
                .foregroundColor(.gray)
            }
            
            Spacer()
            
            // Status
            VStack(alignment: .trailing, spacing: 4) {
                Circle()
                    .fill(file.isDestroyed ? Color.red : Color.green)
                    .frame(width: 8, height: 8)
                Text(file.isDestroyed ? "Killed" : "Active")
                    .font(.caption2)
                    .foregroundColor(file.isDestroyed ? .red : .green)
            }
            
            Image(systemName: "chevron.right")
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
    }
}

// MARK: - File Detail Screen

struct FileDetailScreen: View {
    let file: SupabaseClient.FileItem
    let onKill: () async -> Void
    
    @State private var showKillAlert = false
    @State private var isKilling = false
    @State private var killError: String?
    @State private var showShareSheet = false
    
    @Environment(\.dismiss) var dismiss
    
    var shareLink: String {
        "\(Config.apiBaseURL)/view/\(file.id)"
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Icon
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [.cyan.opacity(0.3), .blue.opacity(0.3)], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 100, height: 100)
                    Image(systemName: file.iconName)
                        .font(.system(size: 44))
                        .foregroundColor(.cyan)
                }
                .padding(.top, 20)
                
                // Name
                Text(file.originalName)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                // Stats
                HStack(spacing: 40) {
                    VStack(spacing: 4) {
                        Text("\(file.totalViews)")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Text("Views")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    
                    VStack(spacing: 4) {
                        Circle()
                            .fill(file.isDestroyed ? Color.red : Color.green)
                            .frame(width: 20, height: 20)
                        Text(file.isDestroyed ? "Killed" : "Active")
                            .font(.caption)
                            .foregroundColor(file.isDestroyed ? .red : .green)
                    }
                }
                .padding()
                .background(Color.white.opacity(0.05))
                .cornerRadius(16)
                
                // Actions
                VStack(spacing: 12) {
                    if !file.isDestroyed {
                        // Share Button
                        Button(action: { showShareSheet = true }) {
                            HStack {
                                Image(systemName: "square.and.arrow.up")
                                Text("Share File")
                            }
                            .font(.headline)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        
                        // Copy Link (Backup)
                        Button(action: copyLink) {
                            HStack {
                                Image(systemName: "link")
                                Text("Copy Link")
                            }
                            .font(.headline)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.white.opacity(0.1))
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        
                        // Kill Button
                        Button(action: { showKillAlert = true }) {
                            HStack {
                                Image(systemName: "xmark.octagon.fill")
                                Text("KILL FILE")
                                Spacer()
                                if isKilling {
                                    ProgressView().tint(.white)
                                }
                            }
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.red.opacity(0.2))
                            .foregroundColor(.red)
                            .fontWeight(.bold)
                            .cornerRadius(12)
                        }
                        .disabled(isKilling)
                    } else {
                        Text("This file has been killed and is no longer accessible.")
                            .foregroundColor(.red)
                            .padding()
                    }
                }
                .padding()
                
                if let error = killError {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding()
                }
                
                Spacer()
            }
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("File Details")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(activityItems: [URL(string: shareLink)!])
        }
        .alert("Kill File?", isPresented: $showKillAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Kill", role: .destructive) {
                Task { await killFile() }
            }
        } message: {
            Text("This will permanently revoke all access to this file. This action cannot be undone.")
        }
    }
    
    private func copyLink() {
        UIPasteboard.general.string = shareLink
    }
    
    private func killFile() async {
        isKilling = true
        killError = nil
        
        do {
            try await SupabaseClient.shared.killFile(fileId: file.id)
            await onKill()
            dismiss()
        } catch {
            killError = error.localizedDescription
        }
        
        isKilling = false
    }
}

#Preview {
    NavigationStack {
        FilesView()
    }
}
