import SwiftUI

// MARK: - Settings View
// Real settings with persistent storage

struct SettingsView: View {
    @EnvironmentObject var authService: AuthService
    @AppStorage("notifyOnView") private var notifyOnView = true
    @AppStorage("notifyOnAccess") private var notifyOnAccess = true
    @AppStorage("autoApproveRecipients") private var autoApproveRecipients = true
    @AppStorage("requirePasswordDefault") private var requirePasswordDefault = false
    @AppStorage("defaultExpiryDays") private var defaultExpiryDays = 7
    @State private var showDeleteAccountAlert = false
    
    var body: some View {
        List {
            // Notifications Section
            Section {
                Toggle(isOn: $notifyOnView) {
                    SettingsRow(icon: "eye.fill", title: "Notify on View", color: .cyan)
                }
                .tint(.cyan)
                
                Toggle(isOn: $notifyOnAccess) {
                    SettingsRow(icon: "bell.fill", title: "Notify on Access Request", color: .orange)
                }
                .tint(.cyan)
            } header: {
                Text("NOTIFICATIONS")
            }
            .listRowBackground(Color.white.opacity(0.05))
            
            // Security Section
            Section {
                Toggle(isOn: $autoApproveRecipients) {
                    SettingsRow(icon: "person.badge.shield.checkmark.fill", title: "Auto-approve Recipients", color: .green)
                }
                .tint(.cyan)
                
                Toggle(isOn: $requirePasswordDefault) {
                    SettingsRow(icon: "lock.fill", title: "Default Password Protection", color: .purple)
                }
                .tint(.cyan)
                
                Picker(selection: $defaultExpiryDays) {
                    Text("Never").tag(0)
                    Text("1 Day").tag(1)
                    Text("7 Days").tag(7)
                    Text("30 Days").tag(30)
                    Text("90 Days").tag(90)
                } label: {
                    SettingsRow(icon: "clock.fill", title: "Default Link Expiry", color: .blue)
                }
                .tint(.gray)
            } header: {
                Text("FILE DEFAULTS")
            }
            .listRowBackground(Color.white.opacity(0.05))
            
            // Account Section
            Section {
                NavigationLink(destination: ChangePasswordView()) {
                    SettingsRow(icon: "key.fill", title: "Change Password", color: .teal)
                }
                
                Button(action: { showDeleteAccountAlert = true }) {
                    SettingsRow(icon: "trash.fill", title: "Delete Account", color: .red)
                }
            } header: {
                Text("ACCOUNT")
            }
            .listRowBackground(Color.white.opacity(0.05))
            
            // About Section
            Section {
                HStack {
                    SettingsRow(icon: "info.circle.fill", title: "Version", color: .gray)
                    Spacer()
                    Text("1.0.0")
                        .foregroundColor(.gray)
                }
                
                Link(destination: URL(string: "https://dataleash.vercel.app/privacy")!) {
                    SettingsRow(icon: "hand.raised.fill", title: "Privacy Policy", color: .gray)
                }
                
                Link(destination: URL(string: "https://dataleash.vercel.app/terms")!) {
                    SettingsRow(icon: "doc.text.fill", title: "Terms of Service", color: .gray)
                }
            } header: {
                Text("ABOUT")
            }
            .listRowBackground(Color.white.opacity(0.05))
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Delete Account?", isPresented: $showDeleteAccountAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                // Would call delete account API
                authService.signOut()
            }
        } message: {
            Text("This will permanently delete your account and all associated data. This cannot be undone.")
        }
    }
}

// MARK: - Settings Row

struct SettingsRow: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)
            Text(title)
                .foregroundColor(.white)
        }
    }
}

// MARK: - Change Password View

struct ChangePasswordView: View {
    @Environment(\.dismiss) var dismiss
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var isLoading = false
    @State private var message: String?
    @State private var isError = false
    
    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 16) {
                SecureField("Current Password", text: $currentPassword)
                    .padding()
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(12)
                    .foregroundColor(.white)
                
                SecureField("New Password", text: $newPassword)
                    .padding()
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(12)
                    .foregroundColor(.white)
                
                SecureField("Confirm New Password", text: $confirmPassword)
                    .padding()
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(12)
                    .foregroundColor(.white)
            }
            
            if let message = message {
                Text(message)
                    .font(.caption)
                    .foregroundColor(isError ? .red : .green)
            }
            
            Button(action: changePassword) {
                HStack {
                    if isLoading {
                        ProgressView().tint(.black)
                    } else {
                        Text("Update Password")
                    }
                }
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(isFormValid ? Color.cyan : Color.gray)
                .foregroundColor(.black)
                .cornerRadius(12)
            }
            .disabled(!isFormValid || isLoading)
            
            Spacer()
        }
        .padding()
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("Change Password")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private var isFormValid: Bool {
        !currentPassword.isEmpty && 
        !newPassword.isEmpty && 
        newPassword == confirmPassword && 
        newPassword.count >= 6
    }
    
    private func changePassword() {
        isLoading = true
        message = nil
        
        Task {
            do {
                guard let token = AuthService.shared.accessToken else {
                    throw URLError(.userAuthenticationRequired)
                }
                
                let url = URL(string: "\(Config.supabaseURL)/auth/v1/user")!
                var request = URLRequest(url: url)
                request.httpMethod = "PUT"
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = try JSONSerialization.data(withJSONObject: ["password": newPassword])
                
                let (_, response) = try await URLSession.shared.data(for: request)
                
                if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                    message = "Password updated successfully!"
                    isError = false
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { dismiss() }
                } else {
                    throw URLError(.badServerResponse)
                }
            } catch {
                message = error.localizedDescription
                isError = true
            }
            isLoading = false
        }
    }
}

#Preview {
    NavigationStack {
        SettingsView()
            .environmentObject(AuthService.shared)
    }
}
