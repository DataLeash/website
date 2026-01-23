import SwiftUI

// MARK: - Chain Kill View
// Kill ALL files at once - emergency destroy

struct ChainKillView: View {
    @Environment(\.dismiss) var dismiss
    @State private var confirmText = ""
    @State private var isDestroying = false
    @State private var destroyed = false
    @State private var error: String?
    @State private var fileCount = 0
    
    private let requiredText = "DESTROY ALL"
    
    var body: some View {
        VStack(spacing: 24) {
            if destroyed {
                successView
            } else {
                warningView
            }
        }
        .padding()
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("Chain Kill")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadFileCount() }
    }
    
    // MARK: - Warning View
    
    private var warningView: some View {
        VStack(spacing: 24) {
            Spacer()
            
            // Danger Icon
            ZStack {
                Circle()
                    .fill(Color.red.opacity(0.2))
                    .frame(width: 120, height: 120)
                Circle()
                    .stroke(Color.red, lineWidth: 3)
                    .frame(width: 120, height: 120)
                Image(systemName: "exclamationmark.octagon.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.red)
            }
            
            Text("Chain Kill")
                .font(.largeTitle)
                .fontWeight(.black)
                .foregroundColor(.red)
            
            Text("This will PERMANENTLY destroy ALL \(fileCount) files and revoke ALL access immediately.")
                .font(.body)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            
            // Warning Box
            VStack(spacing: 12) {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text("WARNING: This action cannot be undone!")
                        .fontWeight(.bold)
                        .foregroundColor(.orange)
                }
                
                Text("• All encryption keys will be destroyed\n• All active viewing sessions will be terminated\n• File data will be permanently deleted")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.leading)
            }
            .padding()
            .background(Color.orange.opacity(0.1))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.orange.opacity(0.3), lineWidth: 1)
            )
            .cornerRadius(12)
            
            // Confirmation Input
            VStack(alignment: .leading, spacing: 8) {
                Text("Type '\(requiredText)' to confirm:")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                TextField("", text: $confirmText)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .padding()
                    .background(Color.red.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(confirmText == requiredText ? Color.red : Color.gray.opacity(0.3), lineWidth: 2)
                    )
                    .cornerRadius(12)
                    .foregroundColor(.white)
            }
            
            if let error = error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
            }
            
            // Destroy Button
            Button(action: executeChainKill) {
                HStack {
                    if isDestroying {
                        ProgressView().tint(.white)
                    } else {
                        Image(systemName: "flame.fill")
                        Text("DESTROY ALL FILES")
                    }
                }
                .font(.headline)
                .fontWeight(.black)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(confirmText == requiredText ? Color.red : Color.gray)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(confirmText != requiredText || isDestroying)
            
            Spacer()
        }
    }
    
    // MARK: - Success View
    
    private var successView: some View {
        VStack(spacing: 24) {
            Spacer()
            
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.green)
            
            Text("All Files Destroyed")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text("All \(fileCount) files have been permanently destroyed. Encryption keys deleted. Active sessions terminated.")
                .font(.body)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            
            Button(action: { dismiss() }) {
                Text("Done")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.cyan)
                    .foregroundColor(.black)
                    .cornerRadius(12)
            }
            
            Spacer()
        }
    }
    
    // MARK: - Actions
    
    private func loadFileCount() async {
        let files = try? await SupabaseClient.shared.getMyFiles()
        fileCount = files?.count ?? 0
    }
    
    private func executeChainKill() {
        isDestroying = true
        error = nil
        
        Task {
            do {
                // Call the chain kill API
                guard let token = AuthService.shared.accessToken else {
                    throw URLError(.userAuthenticationRequired)
                }
                
                let url = URL(string: "\(Config.apiBaseURL)/api/files")!
                var request = URLRequest(url: url)
                request.httpMethod = "DELETE"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                request.httpBody = try JSONSerialization.data(withJSONObject: ["confirmation": "DESTROY ALL"])
                
                let (data, response) = try await URLSession.shared.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
                    if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let errorMsg = json["error"] as? String {
                        throw NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: errorMsg])
                    }
                    throw URLError(.badServerResponse)
                }
                
                destroyed = true
            } catch {
                self.error = error.localizedDescription
            }
            
            isDestroying = false
        }
    }
}

#Preview {
    NavigationStack {
        ChainKillView()
    }
}
