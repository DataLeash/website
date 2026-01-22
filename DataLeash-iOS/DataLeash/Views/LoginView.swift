import SwiftUI

// MARK: - Login View (Deprecated)
// This view is no longer used. AuthView handles all authentication.
// Keeping as a wrapper for compatibility.

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    
    var body: some View {
        // Redirect to AuthView
        AuthView()
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthService.shared)
}
