import SwiftUI

// MARK: - Profile View (Minimal)
// Just shows user info and logout

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showLogoutAlert = false
    
    var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea()
            
            VStack(spacing: 32) {
                Spacer()
                
                // Avatar
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [.cyan, .blue], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 100, height: 100)
                    Text(initials)
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.white)
                }
                
                // User Info
                VStack(spacing: 8) {
                    if let name = authService.currentUser?.fullName {
                        Text(name)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    }
                    
                    Text(authService.currentUser?.email ?? "")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                
                // Core Feature Links
                VStack(spacing: 0) {
                    NavigationLink(destination: FilesView()) {
                        HStack {
                            Image(systemName: "folder.fill")
                                .foregroundColor(.cyan)
                                .frame(width: 24)
                            Text("My Files")
                                .foregroundColor(.white)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.gray)
                        }
                        .padding()
                    }
                    
                    Divider().background(Color.white.opacity(0.1))
                    
                    NavigationLink(destination: InboxView()) {
                        HStack {
                            Image(systemName: "tray.fill")
                                .foregroundColor(.orange)
                                .frame(width: 24)
                            Text("Access Requests")
                                .foregroundColor(.white)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.gray)
                        }
                        .padding()
                    }
                }
                .background(Color.white.opacity(0.05))
                .cornerRadius(12)
                .padding(.horizontal, 20)
                .padding(.top, 20)
                
                Spacer()
                
                // Logout Button
                Button(action: { showLogoutAlert = true }) {
                    HStack {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                        Text("Sign Out")
                    }
                    .font(.headline)
                    .foregroundColor(.red)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red.opacity(0.15))
                    .cornerRadius(12)
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 40)
            }
        }
        .navigationTitle("Profile")
        .alert("Sign Out?", isPresented: $showLogoutAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Sign Out", role: .destructive) {
                authService.signOut()
            }
        } message: {
            Text("Are you sure you want to sign out?")
        }
    }
    
    private var initials: String {
        let name = authService.currentUser?.fullName ?? authService.currentUser?.email ?? "U"
        let parts = name.components(separatedBy: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return String(name.prefix(2)).uppercased()
    }
}
