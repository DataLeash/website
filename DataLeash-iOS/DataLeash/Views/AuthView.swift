import SwiftUI

struct AuthView: View {
    @EnvironmentObject var authService: AuthService
    @State private var isSignUp = false
    @State private var email = ""
    @State private var password = ""
    @State private var fullName = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 25) {
                // Logo Section
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
                .padding(.top, 40)
                .padding(.bottom, 20)
                
                // Auth Picker
                Picker("Auth Mode", selection: $isSignUp) {
                    Text("Sign In").tag(false)
                    Text("Sign Up").tag(true)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                
                // Form Fields
                VStack(spacing: 15) {
                    if isSignUp {
                        CustomTextField(icon: "person.fill", placeholder: "Full Name", text: $fullName)
                    }
                    
                    CustomTextField(icon: "envelope.fill", placeholder: "Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                    
                    CustomSecureField(icon: "lock.fill", placeholder: "Password", text: $password)
                }
                .padding(.horizontal)
                
                // Action Button
                Button(action: {
                    if isSignUp {
                        authService.signUp(email: email, password: password, fullName: fullName)
                    } else {
                        authService.signIn(email: email, password: password)
                    }
                }) {
                    HStack {
                        if authService.isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text(isSignUp ? "Create Account" : "Sign In")
                                .fontWeight(.bold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [.cyan, .blue],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(email.isEmpty || password.isEmpty || (isSignUp && fullName.isEmpty) || authService.isLoading)
                .opacity(authService.isLoading ? 0.7 : 1)
                .padding(.horizontal)
                
                // Error Message
                if let error = authService.error {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                
                // Divider
                HStack {
                    Rectangle().frame(height: 1).foregroundColor(.gray.opacity(0.3))
                    Text("OR").font(.caption).foregroundColor(.gray)
                    Rectangle().frame(height: 1).foregroundColor(.gray.opacity(0.3))
                }
                .padding(.horizontal)
                .padding(.vertical, 10)
                
                // OAuth Buttons
                VStack(spacing: 12) {
                    OAuthButton(
                        provider: .google,
                        title: "Continue with Google",
                        icon: "g.circle.fill",
                        color: .white
                    ) {
                        signInOAuth(with: .google)
                    }
                    
                    OAuthButton(
                        provider: .github,
                        title: "Continue with GitHub",
                        icon: "chevron.left.forwardslash.chevron.right",
                        color: .gray
                    ) {
                        signInOAuth(with: .github)
                    }
                }
                .padding(.horizontal)
                
                Spacer(minLength: 30)
            }
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
    }
    
    private func signInOAuth(with provider: OAuthProvider) {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            return
        }
        authService.signIn(with: provider, anchor: window)
    }
}

// MARK: - Components

struct CustomTextField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.gray)
                .frame(width: 20)
            TextField(placeholder, text: $text)
                .foregroundColor(.white)
        }
        .padding()
        .background(Color.white.opacity(0.1))
        .cornerRadius(12)
    }
}

struct CustomSecureField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.gray)
                .frame(width: 20)
            SecureField(placeholder, text: $text)
                .foregroundColor(.white)
        }
        .padding()
        .background(Color.white.opacity(0.1))
        .cornerRadius(12)
    }
}

#Preview {
    AuthView()
        .environmentObject(AuthService.shared)
}
