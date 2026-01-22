import SwiftUI

// MARK: - Auth View
// Email/Password authentication only

struct AuthView: View {
    @EnvironmentObject var authService: AuthService
    @State private var isSignUp = false
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var fullName = ""
    @State private var showForgotPassword = false
    
    var body: some View {
        ZStack {
            // Background
            Color(red: 0.04, green: 0.09, blue: 0.16)
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 30) {
                    // Logo
                    VStack(spacing: 16) {
                        Image(systemName: "shield.checkered")
                            .font(.system(size: 80))
                            .foregroundStyle(
                                LinearGradient(colors: [.cyan, .blue], startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                        
                        Text("DataLeash")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("Secure File Sharing")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    .padding(.top, 60)
                    .padding(.bottom, 20)
                    
                    // Form
                    VStack(spacing: 16) {
                        // Sign Up / Sign In Toggle
                        Picker("Mode", selection: $isSignUp) {
                            Text("Sign In").tag(false)
                            Text("Sign Up").tag(true)
                        }
                        .pickerStyle(.segmented)
                        .padding(.bottom, 10)
                        
                        // Full Name (Sign Up only)
                        if isSignUp {
                            AuthTextField(
                                icon: "person.fill",
                                placeholder: "Full Name",
                                text: $fullName
                            )
                        }
                        
                        // Email
                        AuthTextField(
                            icon: "envelope.fill",
                            placeholder: "Email",
                            text: $email,
                            keyboardType: .emailAddress,
                            autocapitalization: .never
                        )
                        
                        // Password
                        AuthSecureField(
                            icon: "lock.fill",
                            placeholder: "Password",
                            text: $password
                        )
                        
                        // Confirm Password (Sign Up only)
                        if isSignUp {
                            AuthSecureField(
                                icon: "lock.fill",
                                placeholder: "Confirm Password",
                                text: $confirmPassword
                            )
                        }
                        
                        // Forgot Password
                        if !isSignUp {
                            Button(action: { showForgotPassword = true }) {
                                Text("Forgot Password?")
                                    .font(.caption)
                                    .foregroundColor(.cyan)
                            }
                            .frame(maxWidth: .infinity, alignment: .trailing)
                        }
                        
                        // Error Message
                        if let error = authService.error {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(error.contains("sent") ? .green : .red)
                                .multilineTextAlignment(.center)
                                .padding(.vertical, 8)
                        }
                        
                        // Submit Button
                        Button(action: submit) {
                            HStack {
                                if authService.isLoading {
                                    ProgressView()
                                        .tint(.black)
                                } else {
                                    Text(isSignUp ? "Create Account" : "Sign In")
                                        .fontWeight(.bold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(colors: [.cyan, .blue], startPoint: .leading, endPoint: .trailing)
                            )
                            .foregroundColor(.black)
                            .cornerRadius(12)
                        }
                        .disabled(authService.isLoading || !isFormValid)
                        .opacity(isFormValid ? 1 : 0.6)
                    }
                    .padding()
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(20)
                    .padding(.horizontal)
                    
                    Spacer()
                }
            }
        }
        .sheet(isPresented: $showForgotPassword) {
            ForgotPasswordSheet(email: email)
        }
    }
    
    private var isFormValid: Bool {
        if isSignUp {
            return !email.isEmpty && !password.isEmpty && !fullName.isEmpty && password == confirmPassword && password.count >= 6
        } else {
            return !email.isEmpty && !password.isEmpty
        }
    }
    
    private func submit() {
        if isSignUp {
            authService.signUp(email: email, password: password, fullName: fullName)
        } else {
            authService.signIn(email: email, password: password)
        }
    }
}

// MARK: - Auth Text Field

struct AuthTextField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    var autocapitalization: TextInputAutocapitalization = .sentences
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.gray)
                .frame(width: 24)
            
            TextField(placeholder, text: $text)
                .foregroundColor(.white)
                .keyboardType(keyboardType)
                .textInputAutocapitalization(autocapitalization)
                .autocorrectionDisabled()
        }
        .padding()
        .background(Color.white.opacity(0.08))
        .cornerRadius(12)
    }
}

// MARK: - Auth Secure Field

struct AuthSecureField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    @State private var showPassword = false
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.gray)
                .frame(width: 24)
            
            if showPassword {
                TextField(placeholder, text: $text)
                    .foregroundColor(.white)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
            } else {
                SecureField(placeholder, text: $text)
                    .foregroundColor(.white)
            }
            
            Button(action: { showPassword.toggle() }) {
                Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                    .foregroundColor(.gray)
            }
        }
        .padding()
        .background(Color.white.opacity(0.08))
        .cornerRadius(12)
    }
}

// MARK: - Forgot Password Sheet

struct ForgotPasswordSheet: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authService: AuthService
    @State var email: String
    @State private var sent = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Image(systemName: "envelope.badge.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.cyan)
                
                Text("Reset Password")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Enter your email and we'll send you a link to reset your password.")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                
                AuthTextField(
                    icon: "envelope.fill",
                    placeholder: "Email",
                    text: $email,
                    keyboardType: .emailAddress,
                    autocapitalization: .never
                )
                
                if sent {
                    Text("Reset link sent! Check your email.")
                        .foregroundColor(.green)
                        .font(.caption)
                }
                
                Button(action: {
                    authService.resetPassword(email: email)
                    sent = true
                }) {
                    Text("Send Reset Link")
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.cyan)
                        .foregroundColor(.black)
                        .cornerRadius(12)
                }
                .disabled(email.isEmpty || authService.isLoading)
                
                Spacer()
            }
            .padding()
            .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.cyan)
                }
            }
        }
    }
}

#Preview {
    AuthView()
        .environmentObject(AuthService.shared)
}
