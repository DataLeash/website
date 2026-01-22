import Foundation
import AuthenticationServices

// MARK: - Auth Service
// Handles OAuth authentication with Google/GitHub via Supabase

class AuthService: NSObject, ObservableObject {
    static let shared = AuthService()
    
    @Published var isAuthenticated = false
    @Published var currentUser: AppUser?
    @Published var accessToken: String?
    @Published var isLoading = false
    @Published var error: String?
    
    private var authSession: ASWebAuthenticationSession?
    private var presentationAnchor: ASPresentationAnchor?
    
    private override init() {
        super.init()
        loadStoredSession()
    }
    
    // MARK: - Session Persistence
    
    private func loadStoredSession() {
        if let token = UserDefaults.standard.string(forKey: "accessToken"),
           let userData = UserDefaults.standard.data(forKey: "currentUser"),
           let user = try? JSONDecoder().decode(AppUser.self, from: userData) {
            self.accessToken = token
            self.currentUser = user
            self.isAuthenticated = true
        }
    }
    
    private func saveSession(token: String, user: AppUser) {
        UserDefaults.standard.set(token, forKey: "accessToken")
        if let userData = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(userData, forKey: "currentUser")
        }
    }
    
    private func clearSession() {
        UserDefaults.standard.removeObject(forKey: "accessToken")
        UserDefaults.standard.removeObject(forKey: "currentUser")
    }
    
    // MARK: - OAuth Login
    
    func signIn(with provider: OAuthProvider, anchor: ASPresentationAnchor) {
        isLoading = true
        error = nil
        presentationAnchor = anchor
        
        let redirectURL = "\(Config.oauthRedirectScheme)://auth/callback"
        let providerName = provider == .google ? "google" : "github"
        
        // Construct Supabase OAuth URL
        let authURL = "\(Config.supabaseURL)/auth/v1/authorize?" +
            "provider=\(providerName)" +
            "&redirect_to=\(redirectURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
        
        guard let url = URL(string: authURL) else {
            isLoading = false
            error = "Invalid auth URL"
            return
        }
        
        authSession = ASWebAuthenticationSession(
            url: url,
            callbackURLScheme: Config.oauthRedirectScheme
        ) { [weak self] callbackURL, error in
            DispatchQueue.main.async {
                self?.handleAuthCallback(callbackURL: callbackURL, error: error)
            }
        }
        
        authSession?.presentationContextProvider = self
        authSession?.prefersEphemeralWebBrowserSession = false
        authSession?.start()
    }
    
    private func handleAuthCallback(callbackURL: URL?, error: Error?) {
        isLoading = false
        
        if let error = error {
            self.error = error.localizedDescription
            return
        }
        
        guard let callbackURL = callbackURL,
              let fragment = callbackURL.fragment else {
            self.error = "No callback data received"
            return
        }
        
        // Parse the fragment to get access_token
        var params: [String: String] = [:]
        for pair in fragment.components(separatedBy: "&") {
            let parts = pair.components(separatedBy: "=")
            if parts.count == 2 {
                params[parts[0]] = parts[1].removingPercentEncoding
            }
        }
        
        if let token = params["access_token"] {
            self.accessToken = token
            fetchUserProfile(token: token)
        } else {
            self.error = "No access token in response"
        }
    }
    
    // MARK: - Native Auth (Email/Password)
    
    func signUp(email: String, password: String, fullName: String) {
        isLoading = true
        error = nil
        
        let url = URL(string: "\(Config.supabaseURL)/auth/v1/signup")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        
        let body: [String: Any] = [
            "email": email,
            "password": password,
            "data": ["full_name": fullName]
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                if let error = error {
                    self?.error = error.localizedDescription
                    return
                }
                
                guard let data = data else {
                    self?.error = "No response from server"
                    return
                }
                
                // Sign up usually returns the user and session (if auto-confirm is on)
                // or just user if confirmation is required.
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    if let errorCode = json["error_code"] as? String, let msg = json["msg"] as? String {
                        self?.error = "Error \(errorCode): \(msg)"
                        return
                    }
                    
                    if let accessToken = json["access_token"] as? String {
                        self?.accessToken = accessToken
                        self?.fetchUserProfile(token: accessToken)
                    } else if let _ = json["id"] as? String {
                         // User created but no session (maybe verify email)
                         // For now, try to sign in or just say check email
                         // But usually we want to auto-login if possible.
                         // If no token, maybe require login.
                         self?.error = "Account created! Please sign in (check email if verification needed)."
                    } else {
                        // Attempt to parse standard error
                         if let msg = json["msg"] as? String {
                             self?.error = msg
                         } else {
                             self?.error = "Sign up successful, please sign in."
                         }
                    }
                }
            }
        }.resume()
    }
    
    func signIn(email: String, password: String) {
        isLoading = true
        error = nil
        
        let url = URL(string: "\(Config.supabaseURL)/auth/v1/token?grant_type=password")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        
        let body: [String: Any] = [
            "email": email,
            "password": password
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                if let error = error {
                    self?.error = error.localizedDescription
                    return
                }
                
                guard let data = data else {
                    self?.error = "No response from server"
                    return
                }
                
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    if let errorDescription = json["error_description"] as? String {
                        self?.error = errorDescription
                        return
                    }
                    
                    if let accessToken = json["access_token"] as? String {
                        self?.accessToken = accessToken
                        self?.fetchUserProfile(token: accessToken)
                    } else {
                        self?.error = "Invalid credentials"
                    }
                }
            }
        }.resume()
    }

    private func fetchUserProfile(token: String) {
        guard let url = URL(string: "\(Config.supabaseURL)/auth/v1/user") else { return }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                guard let data = data else {
                    self?.error = error?.localizedDescription ?? "Failed to fetch user"
                    return
                }
                
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let id = json["id"] as? String,
                   let email = json["email"] as? String {
                    let metadata = json["user_metadata"] as? [String: Any]
                    let fullName = metadata?["full_name"] as? String ?? metadata?["name"] as? String
                    
                    let user = AppUser(id: id, email: email, fullName: fullName)
                    self?.currentUser = user
                    self?.isAuthenticated = true
                    self?.saveSession(token: token, user: user)
                } else {
                    self?.error = "Failed to parse user data"
                }
            }
        }.resume()
    }
    
    // MARK: - Logout
    
    func signOut() {
        accessToken = nil
        currentUser = nil
        isAuthenticated = false
        clearSession()
    }
}

// MARK: - OAuth Provider

enum OAuthProvider {
    case google
    case github
}

// MARK: - ASWebAuthenticationSession Presentation

extension AuthService: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return presentationAnchor ?? ASPresentationAnchor()
    }
}
