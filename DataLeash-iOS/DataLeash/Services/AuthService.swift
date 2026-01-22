import Foundation

// MARK: - Auth Service
// Email/Password authentication with Supabase

class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var isAuthenticated = false
    @Published var currentUser: AppUser?
    @Published var accessToken: String?
    @Published var isLoading = false
    @Published var error: String?
    
    private init() {
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
    
    // MARK: - Sign Up
    
    func signUp(email: String, password: String, fullName: String) {
        isLoading = true
        error = nil
        
        guard let url = URL(string: "\(Config.supabaseURL)/auth/v1/signup") else {
            isLoading = false
            error = "Invalid URL"
            return
        }
        
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
                
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    // Check for error
                    if let errorMsg = json["error_description"] as? String {
                        self?.error = errorMsg
                        return
                    }
                    if let msg = json["msg"] as? String {
                        self?.error = msg
                        return
                    }
                    
                    // Check for access token (auto-confirm)
                    if let accessToken = json["access_token"] as? String {
                        self?.accessToken = accessToken
                        self?.fetchUserProfile(token: accessToken)
                    } else {
                        // Email confirmation required
                        self?.error = "Please check your email to confirm your account"
                    }
                }
            }
        }.resume()
    }
    
    // MARK: - Sign In
    
    func signIn(email: String, password: String) {
        isLoading = true
        error = nil
        
        guard let url = URL(string: "\(Config.supabaseURL)/auth/v1/token?grant_type=password") else {
            isLoading = false
            error = "Invalid URL"
            return
        }
        
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
    
    // MARK: - Fetch User Profile
    
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
    
    // MARK: - Sign Out
    
    func signOut() {
        accessToken = nil
        currentUser = nil
        isAuthenticated = false
        clearSession()
    }
    
    // MARK: - Password Reset
    
    func resetPassword(email: String) {
        isLoading = true
        error = nil
        
        guard let url = URL(string: "\(Config.supabaseURL)/auth/v1/recover") else {
            isLoading = false
            error = "Invalid URL"
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        
        let body = ["email": email]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                if let error = error {
                    self?.error = error.localizedDescription
                    return
                }
                
                // Success - show message
                self?.error = "Password reset email sent! Check your inbox."
            }
        }.resume()
    }
}
