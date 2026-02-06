import SwiftUI

// MARK: - Files View (Simplified)
// List of my uploaded files

struct FilesView: View {
    @State private var files: [SupabaseClient.FileItem] = []
    @State private var isLoading = true
    
    var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea()
            
            if isLoading {
                ProgressView().tint(.cyan)
            } else if files.isEmpty {
                VStack(spacing: 15) {
                    Image(systemName: "folder")
                        .font(.system(size: 50))
                        .foregroundColor(.gray)
                    Text("No files yet")
                        .foregroundColor(.gray)
                }
            } else {
                List {
                    ForEach(files) { file in
                        HStack {
                            Image(systemName: file.iconName)
                                .foregroundColor(.cyan)
                                .frame(width: 30)
                            
                            VStack(alignment: .leading) {
                                Text(file.originalName)
                                    .foregroundColor(.white)
                                Text("\(file.totalViews) views")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            
                            Spacer()
                            
                            // Share Button
                            ShareLink(item: URL(string: file.shareableLink)!) {
                                Image(systemName: "square.and.arrow.up")
                                    .foregroundColor(.cyan)
                            }
                        }
                        .listRowBackground(Color.white.opacity(0.05))
                        .contextMenu {
                            Button(role: .destructive) {
                                Task { await deleteFile(file.id) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
                .refreshable {
                    await loadFiles()
                }
            }
        }
        .navigationTitle("My Files")
        .task {
            await loadFiles()
        }
    }
    
    private func loadFiles() async {
        isLoading = true
        do {
            files = try await SupabaseClient.shared.getMyFiles()
        } catch {
            print("Error loading files: \(error)")
        }
        isLoading = false
    }
    
    private func deleteFile(_ id: String) async {
        do {
            try await SupabaseClient.shared.killFile(fileId: id)
            await loadFiles()
        } catch {
            print("Error deleting file: \(error)")
        }
    }
}
