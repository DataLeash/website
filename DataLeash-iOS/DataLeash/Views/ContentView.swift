import SwiftUI

// MARK: - Content View (Root)

struct ContentView: View {
    @StateObject private var authService = AuthService.shared
    @StateObject private var screenProtection = ScreenProtectionManager.shared
    
    var body: some View {
        Group {
            if authService.isAuthenticated {
                MainTabView()
            } else {
                AuthView()
            }
        }
        .preferredColorScheme(.dark)
        .environmentObject(authService)
        .environmentObject(screenProtection)
    }
}

// MARK: - Profile View

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    
    var body: some View {
        ScrollView {
            VStack(spacing: 25) {
                // Profile Header
                VStack(spacing: 15) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.gray)
                    
                    Text(authService.currentUser?.fullName ?? "User")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    Text(authService.currentUser?.email ?? "")
                        .foregroundColor(.gray)
                }
                .padding(.top, 30)
                
                Divider().background(Color.gray)
                
                // Settings Options
                VStack(spacing: 0) {
                    SettingsRow(icon: "bell.fill", title: "Notifications", color: .orange)
                    SettingsRow(icon: "lock.fill", title: "Privacy", color: .blue)
                    SettingsRow(icon: "questionmark.circle.fill", title: "Help & Support", color: .green)
                    SettingsRow(icon: "info.circle.fill", title: "About", color: .purple)
                }
                .background(Color.white.opacity(0.05))
                .cornerRadius(12)
                .padding(.horizontal)
                
                // Sign Out
                Button(action: {
                    authService.signOut()
                }) {
                    HStack {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                        Text("Sign Out")
                    }
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red.opacity(0.8))
                    .cornerRadius(12)
                }
                .padding(.horizontal)
                .padding(.top, 20)
                
                Spacer()
                
                // App Info
                VStack(spacing: 4) {
                    Text("DataLeash")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text("Version 1.0.0")
                        .font(.caption2)
                        .foregroundColor(.gray.opacity(0.7))
                }
                .padding(.bottom, 30)
            }
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("Profile")
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 30)
            Text(title)
                .foregroundColor(.white)
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color.clear)
    }
}

#Preview {
    ContentView()
}
