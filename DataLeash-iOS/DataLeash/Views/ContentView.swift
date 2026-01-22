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

#Preview {
    ContentView()
}
