import SwiftUI

struct FileAccessView: View {
    let fileId: String
    
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var screenProtection: ScreenProtectionManager
    
    @State private var isLoading = true
    @State private var error: String?
    @State private var fileInfo: FileInfo?
    @State private var accessStatus: AccessStatus = .checking
    @State private var password: String = ""
    @State private var needsPassword = false
    @State private var decryptedData: Data?
    @State private var mimeType: String?
    
    enum AccessStatus {
        case checking
        case hasAccess
        case pending
        case denied
    }
    
    var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.09, blue: 0.16)
                .ignoresSafeArea()
            
            if isLoading {
                loadingView
            } else if let error = error {
                errorView(error)
            } else if needsPassword {
                passwordView
            } else if let data = decryptedData {
                secureFileView(data: data)
            } else {
                accessRequestView
            }
            
            // Screen recording blocker
            if screenProtection.showBlocker {
                blockerOverlay
            }
        }
        .navigationTitle("View File")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await checkAccess()
        }
    }
    
    // MARK: - Views
    
    var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .tint(.cyan)
                .scaleEffect(1.5)
            Text("Loading...")
                .foregroundColor(.gray)
        }
    }
    
    func errorView(_ message: String) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.red)
            
            Text("Error")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text(message)
                .font(.body)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button("Try Again") {
                Task { await checkAccess() }
            }
            .foregroundColor(.cyan)
        }
    }
    
    var passwordView: some View {
        VStack(spacing: 25) {
            Image(systemName: "lock.fill")
                .font(.system(size: 50))
                .foregroundColor(.cyan)
            
            Text("Password Required")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            if let file = fileInfo {
                Text(file.originalName)
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
            
            SecureField("Enter password", text: $password)
                .padding()
                .background(Color.white.opacity(0.1))
                .cornerRadius(12)
                .foregroundColor(.white)
            
            Button(action: {
                Task { await decryptWithPassword() }
            }) {
                HStack {
                    Image(systemName: "lock.open")
                    Text("Unlock")
                }
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.cyan)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(password.isEmpty)
        }
        .padding(.horizontal, 30)
    }
    
    var accessRequestView: some View {
        VStack(spacing: 25) {
            Image(systemName: accessStatus == .pending ? "hourglass" : "hand.raised.fill")
                .font(.system(size: 50))
                .foregroundColor(accessStatus == .pending ? .orange : .yellow)
            
            Text(accessStatus == .pending ? "Access Requested" : "Access Required")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            if let file = fileInfo {
                Text("File: \(file.originalName)")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
            
            if accessStatus == .pending {
                Text("Your request has been sent to the file owner.\nPlease wait for approval.")
                    .font(.body)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                
                Button("Check Status") {
                    Task { await checkAccess() }
                }
                .foregroundColor(.cyan)
            } else {
                Button(action: {
                    Task { await requestAccess() }
                }) {
                    HStack {
                        Image(systemName: "paperplane")
                        Text("Request Access")
                    }
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.cyan)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }
        }
        .padding(.horizontal, 30)
    }
    
    func secureFileView(data: Data) -> some View {
        SecureContainer {
            ZStack {
                // File content
                if mimeType?.hasPrefix("image/") == true, let uiImage = UIImage(data: data) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                } else {
                    // Generic file view
                    VStack(spacing: 15) {
                        Image(systemName: "doc.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.cyan)
                        
                        if let file = fileInfo {
                            Text(file.originalName)
                                .font(.headline)
                                .foregroundColor(.white)
                        }
                        
                        Text("File loaded successfully")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                }
                
                // Watermark overlay
                WatermarkOverlay(email: authService.currentUser?.email ?? "viewer")
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.black)
        }
        .ignoresSafeArea()
    }
    
    var blockerOverlay: some View {
        ZStack {
            Color.black
            
            VStack(spacing: 20) {
                Image(systemName: screenProtection.isRecording ? "video.slash.fill" : "camera.metering.unknown")
                    .font(.system(size: 60))
                    .foregroundColor(.red)
                
                Text(screenProtection.isRecording ? "Screen Recording Detected" : "Screenshot Detected")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Content is protected")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
        }
        .ignoresSafeArea()
    }
    
    // MARK: - Actions
    
    func checkAccess() async {
        isLoading = true
        error = nil
        
        guard let email = authService.currentUser?.email else {
            error = "Not authenticated"
            isLoading = false
            return
        }
        
        do {
            // Check if we have access
            let response = try await FileService.shared.requestAccess(
                fileId: fileId,
                email: email,
                name: authService.currentUser?.fullName ?? email,
                checkOnly: true
            )
            
            if response.allowed == true {
                accessStatus = .hasAccess
                await decryptFile()
            } else {
                accessStatus = .denied
            }
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func requestAccess() async {
        isLoading = true
        
        guard let email = authService.currentUser?.email else {
            error = "Not authenticated"
            isLoading = false
            return
        }
        
        do {
            let response = try await FileService.shared.requestAccess(
                fileId: fileId,
                email: email,
                name: authService.currentUser?.fullName ?? email,
                checkOnly: false
            )
            
            if response.approved == true {
                accessStatus = .hasAccess
                await decryptFile()
            } else {
                accessStatus = .pending
            }
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func decryptFile() async {
        guard let email = authService.currentUser?.email else { return }
        
        do {
            let response = try await FileService.shared.decryptFile(
                fileId: fileId,
                password: nil,
                email: email
            )
            
            if response.needsPassword == true {
                needsPassword = true
            } else if let base64Data = response.data,
                      let data = Data(base64Encoded: base64Data) {
                decryptedData = data
                mimeType = response.mimeType
                
                // Log successful view
                await FileService.shared.logAccess(fileId: fileId, action: "view", email: email)
            } else if let err = response.error {
                error = err
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
    
    func decryptWithPassword() async {
        isLoading = true
        
        guard let email = authService.currentUser?.email else {
            error = "Not authenticated"
            isLoading = false
            return
        }
        
        do {
            let response = try await FileService.shared.decryptFile(
                fileId: fileId,
                password: password,
                email: email
            )
            
            if let base64Data = response.data,
               let data = Data(base64Encoded: base64Data) {
                decryptedData = data
                mimeType = response.mimeType
                needsPassword = false
                
                await FileService.shared.logAccess(fileId: fileId, action: "view", email: email)
            } else if let err = response.error {
                error = err
            }
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
}

// MARK: - Watermark Overlay

struct WatermarkOverlay: View {
    let email: String
    
    var body: some View {
        GeometryReader { geo in
            let text = email
            let rotationAngle: Double = -30
            
            ForEach(0..<10) { row in
                ForEach(0..<5) { col in
                    Text(text)
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.1))
                        .rotationEffect(.degrees(rotationAngle))
                        .position(
                            x: CGFloat(col) * (geo.size.width / 4) + 50,
                            y: CGFloat(row) * (geo.size.height / 8) + 50
                        )
                }
            }
        }
        .allowsHitTesting(false)
    }
}

#Preview {
    NavigationStack {
        FileAccessView(fileId: "test-file-id")
            .environmentObject(AuthService.shared)
            .environmentObject(ScreenProtectionManager())
    }
}
