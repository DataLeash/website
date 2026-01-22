import SwiftUI

// MARK: - Main Tab View (App Root after login)

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var screenProtection: ScreenProtectionManager
    @State private var selectedTab = 0
    
    var body: some View {
        ZStack {
            TabView(selection: $selectedTab) {
                // Tab 1: Dashboard
                NavigationStack {
                    DashboardView()
                }
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Dashboard")
                }
                .tag(0)
                
                // Tab 2: Files
                NavigationStack {
                    FilesView()
                }
                .tabItem {
                    Image(systemName: "doc.fill")
                    Text("Files")
                }
                .tag(1)
                
                // Tab 3: Friends & Chat
                NavigationStack {
                    FriendsView()
                }
                .tabItem {
                    Image(systemName: "person.2.fill")
                    Text("Friends")
                }
                .tag(2)
                
                // Tab 4: Inbox
                NavigationStack {
                    InboxView()
                }
                .tabItem {
                    Image(systemName: "tray.fill")
                    Text("Inbox")
                }
                .tag(3)
                
                // Tab 5: Profile
                NavigationStack {
                    ProfileView()
                }
                .tabItem {
                    Image(systemName: "person.circle")
                    Text("Profile")
                }
                .tag(4)
            }
            .accentColor(.cyan)
            
            // Screen recording blocker
            if screenProtection.showBlocker {
                SecurityBlockerView(isRecording: screenProtection.isRecording)
            }
        }
        .onAppear {
            configureTabBar()
        }
    }
    
    private func configureTabBar() {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(red: 0.04, green: 0.09, blue: 0.16, alpha: 1.0)
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }
}

// MARK: - Security Blocker

struct SecurityBlockerView: View {
    let isRecording: Bool
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(spacing: 20) {
                Image(systemName: isRecording ? "video.slash.fill" : "camera.slash.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.red)
                Text(isRecording ? "Screen Recording Detected" : "Screenshot Detected")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                Text("Content is protected")
                    .foregroundColor(.gray)
            }
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthService.shared)
        .environmentObject(ScreenProtectionManager.shared)
}
