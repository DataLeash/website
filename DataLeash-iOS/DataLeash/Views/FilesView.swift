import SwiftUI

// MARK: - Files View
// Shows user's files with real data from Supabase

struct FilesView: View {
    @State private var files: [SupabaseClient.FileItem] = []
    @State private var isLoading = true
    @State private var error: String?
    @State private var searchText = ""
    @State private var showShareSheet = false
    @State private var shareLink = ""
    
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
            
            // Stats Bar
            if !files.isEmpty {
                HStack {
                    Label("\(files.count) files", systemImage: "folder.fill")
                    Spacer()
                    Label("\(files.reduce(0) { $0 + $1.totalViews }) total views", systemImage: "eye.fill")
                }
                .font(.caption)
                .foregroundColor(.gray)
                .padding(.horizontal)
                .padding(.bottom, 8)
            }
            
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
                            FileCardView(
                                file: file,
                                onShare: { shareFile(file) },
                                onKill: { await killFile(file) }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("My Files")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadFiles() }
        .refreshable { await loadFiles() }
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: [shareLink])
        }
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
    
    private func shareFile(_ file: SupabaseClient.FileItem) {
        shareLink = file.shareableLink
        showShareSheet = true
    }
    
    private func killFile(_ file: SupabaseClient.FileItem) async {
        do {
            try await SupabaseClient.shared.killFile(fileId: file.id)
            await loadFiles()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

// MARK: - File Card View

struct FileCardView: View {
    let file: SupabaseClient.FileItem
    let onShare: () -> Void
    let onKill: () async -> Void
    
    @State private var showActions = false
    @State private var showKillAlert = false
    @State private var isKilling = false
    @State private var copied = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Main Card
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
                Circle()
                    .fill(file.isDestroyed ? Color.red : Color.green)
                    .frame(width: 10, height: 10)
                
                // Expand Button
                Button(action: { withAnimation { showActions.toggle() } }) {
                    Image(systemName: showActions ? "chevron.up" : "chevron.down")
                        .foregroundColor(.gray)
                        .padding(8)
                }
            }
            .padding()
            
            // Actions Panel
            if showActions {
                Divider().background(Color.gray.opacity(0.3))
                
                HStack(spacing: 12) {
                    // Share Button
                    Button(action: onShare) {
                        VStack(spacing: 4) {
                            Image(systemName: "square.and.arrow.up")
                                .font(.title3)
                            Text("Share")
                                .font(.caption2)
                        }
                        .foregroundColor(.blue)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(10)
                    }
                    
                    // Copy Link Button
                    Button(action: copyLink) {
                        VStack(spacing: 4) {
                            Image(systemName: copied ? "checkmark" : "link")
                                .font(.title3)
                            Text(copied ? "Copied!" : "Copy Link")
                                .font(.caption2)
                        }
                        .foregroundColor(.purple)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.purple.opacity(0.1))
                        .cornerRadius(10)
                    }
                    
                    // Kill Button
                    Button(action: { showKillAlert = true }) {
                        VStack(spacing: 4) {
                            if isKilling {
                                ProgressView().tint(.red)
                            } else {
                                Image(systemName: "xmark.octagon.fill")
                                    .font(.title3)
                            }
                            Text("Kill")
                                .font(.caption2)
                        }
                        .foregroundColor(.red)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(10)
                    }
                    .disabled(isKilling || file.isDestroyed)
                }
                .padding()
            }
        }
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
        .alert("Kill File?", isPresented: $showKillAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Kill", role: .destructive) {
                isKilling = true
                Task {
                    await onKill()
                    isKilling = false
                }
            }
        } message: {
            Text("This will permanently revoke all access to '\(file.originalName)'. This cannot be undone.")
        }
    }
    
    private func copyLink() {
        UIPasteboard.general.string = file.shareableLink
        copied = true
        
        // Reset after 2 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            copied = false
        }
    }
}

// MARK: - Share Sheet

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    NavigationStack {
        FilesView()
    }
}
