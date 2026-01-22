import SwiftUI

// MARK: - Main Tab View
// Primary navigation with 4 tabs: Home, Files, Inbox, Profile

struct MainTabView: View {
    @State private var selectedTab = 0
    @StateObject private var screenProtection = ScreenProtectionManager.shared
    
    init() {
        // Custom tab bar appearance
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(red: 0.04, green: 0.09, blue: 0.16, alpha: 1.0)
        
        // Selected item
        appearance.stackedLayoutAppearance.selected.iconColor = UIColor.cyan
        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [.foregroundColor: UIColor.cyan]
        
        // Normal item
        appearance.stackedLayoutAppearance.normal.iconColor = UIColor.gray
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [.foregroundColor: UIColor.gray]
        
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }
    
    var body: some View {
        ZStack {
            TabView(selection: $selectedTab) {
                // Home Tab
                HomeView()
                    .tabItem {
                        Label("Home", systemImage: "house.fill")
                    }
                    .tag(0)
                
                // Files Tab
                NavigationStack {
                    FilesView()
                }
                .tabItem {
                    Label("Files", systemImage: "folder.fill")
                }
                .tag(1)
                
                // Inbox Tab
                NavigationStack {
                    InboxView()
                }
                .tabItem {
                    Label("Inbox", systemImage: "tray.fill")
                }
                .tag(2)
                
                // Profile Tab
                NavigationStack {
                    ProfileView()
                }
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(3)
            }
            .tint(.cyan)
            
            // Security Overlay
            if screenProtection.isRecording {
                SecurityBlockerView()
            }
        }
    }
}

// MARK: - Security Blocker

struct SecurityBlockerView: View {
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 20) {
                Image(systemName: "eye.slash.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.red)
                
                Text("Screen Recording Detected")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Content hidden for security")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthService.shared)
}
