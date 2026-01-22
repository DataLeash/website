import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    
    var body: some View {
        VStack(spacing: 30) {
            Spacer()
            
            // Logo
            VStack(spacing: 15) {
                Image(systemName: "shield.checkered")
                    .font(.system(size: 80))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.cyan, .blue],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                
                Text("DataLeash")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Own It. Control It. Revoke It.")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            // Login buttons
            VStack(spacing: 15) {
                Text("Sign in to continue")
                    .font(.headline)
                    .foregroundColor(.white)
                
                // Google button
                OAuthButton(
                    provider: .google,
                    title: "Continue with Google",
                    icon: "g.circle.fill",
                    color: .white
                ) {
                    signIn(with: .google)
                }
                
                // GitHub button
                OAuthButton(
                    provider: .github,
                    title: "Continue with GitHub",
                    icon: "chevron.left.forwardslash.chevron.right",
                    color: .gray
                ) {
                    signIn(with: .github)
                }
            }
            .padding(.horizontal, 30)
            
            // Loading indicator
            if authService.isLoading {
                ProgressView()
                    .tint(.cyan)
                    .scaleEffect(1.2)
            }
            
            // Error message
            if let error = authService.error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding()
            }
            
            Spacer()
            
            // Footer
            Text("Secure file sharing with screenshot protection")
                .font(.caption)
                .foregroundColor(.gray)
                .padding(.bottom, 30)
        }
    }
    
    private func signIn(with provider: OAuthProvider) {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            return
        }
        authService.signIn(with: provider, anchor: window)
    }
}

// MARK: - OAuth Button

struct OAuthButton: View {
    let provider: OAuthProvider
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title2)
                
                Text(title)
                    .font(.headline)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.white.opacity(0.1))
            .foregroundColor(color)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
            )
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthService.shared)
        .background(Color(red: 0.04, green: 0.09, blue: 0.16))
}
