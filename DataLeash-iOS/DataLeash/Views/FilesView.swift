import SwiftUI
import PhotosUI

// MARK: - Files View (Real API Data)

struct FilesView: View {
    @EnvironmentObject var authService: AuthService
    @State private var files: [APIClient.FileResponse] = []
    @State private var isLoading = true
    @State private var error: String?
    @State private var showUploadSheet = false
    @State private var searchText = ""
    
    var filteredFiles: [APIClient.FileResponse] {
        if searchText.isEmpty { return files }
        return files.filter { $0.originalName.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Search Bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                TextField("Search files...", text: $searchText)
                    .foregroundColor(.white)
            }
            .padding()
            .background(Color.white.opacity(0.1))
            .cornerRadius(12)
            .padding()
            
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
                        Task { await loadFiles() }
                    }
                    .foregroundColor(.cyan)
                }
                Spacer()
            } else if files.isEmpty {
                Spacer()
                VStack(spacing: 20) {
                    Image(systemName: "doc.badge.plus")
                        .font(.system(size: 60))
                        .foregroundColor(.gray)
                    Text("No files yet")
                        .font(.title3)
                        .foregroundColor(.white)
                    Text("Upload files from the web dashboard")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                Spacer()
            } else {
                List {
                    ForEach(filteredFiles, id: \.id) { file in
                        NavigationLink(destination: FileDetailView(file: file)) {
                            FileRowView(file: file)
                        }
                        .listRowBackground(Color.white.opacity(0.05))
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("My Files")
        .task {
            await loadFiles()
        }
        .refreshable {
            await loadFiles()
        }
    }
    
    private func loadFiles() async {
        isLoading = true
        error = nil
        
        do {
            files = try await APIClient.shared.getMyFiles()
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
}

// MARK: - File Row

struct FileRowView: View {
    let file: APIClient.FileResponse
    
    var iconName: String {
        guard let type = file.mimeType else { return "doc.fill" }
        if type.contains("image") { return "photo" }
        if type.contains("pdf") { return "doc.richtext" }
        if type.contains("video") { return "video" }
        return "doc.fill"
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconName)
                .font(.title2)
                .foregroundColor(file.isDestroyed ? .red : .cyan)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(file.originalName)
                        .font(.headline)
                        .foregroundColor(.white)
                        .lineLimit(1)
                    if file.isDestroyed {
                        Text("KILLED")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.red)
                            .cornerRadius(4)
                    }
                }
                HStack {
                    Text("\(file.totalViews ?? 0) views")
                    Text("•")
                    Text(formatDate(file.createdAt))
                }
                .font(.caption)
                .foregroundColor(.gray)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundColor(.gray)
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

// MARK: - File Detail View

struct FileDetailView: View {
    let file: APIClient.FileResponse
    @State private var showKillConfirm = false
    @State private var isKilling = false
    @State private var showShareSheet = false
    @Environment(\.dismiss) var dismiss
    
    var iconName: String {
        guard let type = file.mimeType else { return "doc.fill" }
        if type.contains("image") { return "photo" }
        if type.contains("pdf") { return "doc.richtext" }
        if type.contains("video") { return "video" }
        return "doc.fill"
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // File Icon
                Image(systemName: iconName)
                    .font(.system(size: 60))
                    .foregroundColor(file.isDestroyed ? .red : .cyan)
                    .padding()
                
                Text(file.originalName)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                
                if file.isDestroyed {
                    Text("FILE KILLED - ACCESS REVOKED")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.red)
                        .cornerRadius(8)
                }
                
                // Stats
                HStack(spacing: 30) {
                    VStack {
                        Text("\(file.totalViews ?? 0)")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Text("Views")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    VStack {
                        Text(file.isDestroyed ? "Killed" : "Active")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(file.isDestroyed ? .red : .green)
                        Text("Status")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
                .padding()
                
                // Actions
                if !file.isDestroyed {
                    VStack(spacing: 12) {
                        ActionButton(title: "Copy Share Link", icon: "link", color: .purple) {
                            let link = "\(Config.apiBaseURL)/view/\(file.id)"
                            UIPasteboard.general.string = link
                        }
                        ActionButton(title: "KILL FILE", icon: "xmark.octagon.fill", color: .red) {
                            showKillConfirm = true
                        }
                    }
                    .padding()
                }
            }
            .padding()
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("File Details")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Kill File?", isPresented: $showKillConfirm) {
            Button("Cancel", role: .cancel) { }
            Button("Kill", role: .destructive) {
                Task {
                    isKilling = true
                    do {
                        try await APIClient.shared.killFile(fileId: file.id)
                        dismiss()
                    } catch {
                        isKilling = false
                    }
                }
            }
        } message: {
            Text("This will permanently revoke all access. This cannot be undone.")
        }
    }
}

struct ActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                Text(title)
                    .fontWeight(.medium)
                Spacer()
                Image(systemName: "chevron.right")
            }
            .foregroundColor(color)
            .padding()
            .background(color.opacity(0.15))
            .cornerRadius(12)
        }
    }
}

#Preview {
    NavigationStack {
        FilesView()
            .environmentObject(AuthService.shared)
    }
}
