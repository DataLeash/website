import SwiftUI

// MARK: - Profile View
// User settings and navigation to features

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showSignOutAlert = false
    @State private var showChainKill = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Profile Header
                VStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(colors: [.cyan, .blue], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 100, height: 100)
                        Text(initials)
                            .font(.system(size: 36, weight: .bold))
                            .foregroundColor(.white)
                    }
                    
                    Text(authService.currentUser?.fullName ?? "User")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    Text(authService.currentUser?.email ?? "")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .padding(.vertical, 20)
                
                // Quick Stats
                HStack(spacing: 16) {
                    NavigationLink(destination: FilesView()) {
                        ProfileStatCard(icon: "folder.fill", title: "Files", color: .cyan)
                    }
                    NavigationLink(destination: InboxView()) {
                        ProfileStatCard(icon: "tray.fill", title: "Requests", color: .orange)
                    }
                    NavigationLink(destination: ActiveSessionsView()) {
                        ProfileStatCard(icon: "eye.fill", title: "Viewers", color: .green)
                    }
                }
                .padding(.horizontal)
                
                // Account Section
                VStack(alignment: .leading, spacing: 12) {
                    Text("ACCOUNT")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                        .padding(.horizontal)
                    
                    VStack(spacing: 0) {
                        NavigationLink(destination: SettingsView()) {
                            ProfileRow(icon: "gearshape.fill", title: "Settings", color: .cyan)
                        }
                        Divider().background(Color.gray.opacity(0.3))
                        NavigationLink(destination: NotificationsView()) {
                            ProfileRow(icon: "bell.fill", title: "Notifications", color: .orange)
                        }
                        Divider().background(Color.gray.opacity(0.3))
                        NavigationLink(destination: ChangePasswordView()) {
                            ProfileRow(icon: "key.fill", title: "Change Password", color: .blue)
                        }
                    }
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }
                
                // Security Section
                VStack(alignment: .leading, spacing: 12) {
                    Text("SECURITY")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                        .padding(.horizontal)
                    
                    VStack(spacing: 0) {
                        NavigationLink(destination: SecurityView()) {
                            ProfileRow(icon: "shield.checkmark.fill", title: "Security Dashboard", color: .green)
                        }
                        Divider().background(Color.gray.opacity(0.3))
                        NavigationLink(destination: AnalyticsView()) {
                            ProfileRow(icon: "chart.bar.xaxis", title: "Analytics", color: .purple)
                        }
                        Divider().background(Color.gray.opacity(0.3))
                        NavigationLink(destination: ActiveSessionsView()) {
                            ProfileRow(icon: "person.2.fill", title: "Active Sessions", color: .cyan)
                        }
                        Divider().background(Color.gray.opacity(0.3))
                        NavigationLink(destination: BlacklistView()) {
                            ProfileRow(icon: "hand.raised.slash.fill", title: "Blacklist", color: .red)
                        }
                        Divider().background(Color.gray.opacity(0.3))
                        NavigationLink(destination: LeakersView()) {
                            ProfileRow(icon: "person.crop.circle.badge.exclamationmark.fill", title: "Suspected Leakers", color: .orange)
                        }
                    }
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }
                
                // Danger Zone
                VStack(alignment: .leading, spacing: 12) {
                    Text("DANGER ZONE")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                        .padding(.horizontal)
                    
                    VStack(spacing: 0) {
                        NavigationLink(destination: ChainKillView()) {
                            ProfileRow(icon: "flame.fill", title: "Chain Kill (Destroy All)", color: .red)
                        }
                    }
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.red.opacity(0.3), lineWidth: 1)
                    )
                    .padding(.horizontal)
                }
                
                // App Section
                VStack(alignment: .leading, spacing: 12) {
                    Text("APP")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                        .padding(.horizontal)
                    
                    VStack(spacing: 0) {
                        Link(destination: URL(string: "https://dataleash.vercel.app/terms")!) {
                            ProfileRow(icon: "doc.text.fill", title: "Terms of Service", color: .gray)
                        }
                        Divider().background(Color.gray.opacity(0.3))
                        Link(destination: URL(string: "https://dataleash.vercel.app/privacy")!) {
                            ProfileRow(icon: "hand.raised.fill", title: "Privacy Policy", color: .gray)
                        }
                    }
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }
                
                // Sign Out
                Button(action: { showSignOutAlert = true }) {
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
                .padding(.horizontal)
                .padding(.top, 20)
                
                // Version
                Text("DataLeash v1.0.0")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .padding(.top, 10)
            }
            .padding(.vertical)
        }
        .background(Color(red: 0.04, green: 0.09, blue: 0.16).ignoresSafeArea())
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Sign Out?", isPresented: $showSignOutAlert) {
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

// MARK: - Profile Stat Card

struct ProfileStatCard: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
    }
}

// MARK: - Profile Row

struct ProfileRow: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 30)
            
            Text(title)
                .font(.body)
                .foregroundColor(.white)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding()
    }
}

#Preview {
    NavigationStack {
        ProfileView()
            .environmentObject(AuthService.shared)
    }
}
