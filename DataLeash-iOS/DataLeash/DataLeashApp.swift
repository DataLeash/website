import SwiftUI

@main
struct DataLeashApp: App {
    @StateObject private var authService = AuthService.shared
    @StateObject private var screenProtection = ScreenProtectionManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authService)
                .environmentObject(screenProtection)
                .preferredColorScheme(.dark)
        }
    }
}
