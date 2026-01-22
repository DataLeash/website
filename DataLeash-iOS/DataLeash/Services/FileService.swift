import Foundation

// MARK: - File Service
// Handles all file-related API calls to the Next.js backend

class FileService {
    static let shared = FileService()
    private init() {}
    
    // MARK: - Get File Info
    
    func getFileInfo(fileId: String) async throws -> FileInfo {
        let url = URL(string: "\(Config.apiBaseURL)/api/files/\(fileId)/info")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FileServiceError.invalidResponse
        }
        
        if httpResponse.statusCode != 200 {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let error = json["error"] as? String {
                throw FileServiceError.serverError(error)
            }
            throw FileServiceError.httpError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(FileInfo.self, from: data)
    }
    
    // MARK: - Check/Request Access
    
    func requestAccess(fileId: String, email: String, name: String, checkOnly: Bool = false) async throws -> AccessCheckResponse {
        let url = URL(string: "\(Config.apiBaseURL)/api/access/request")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "fileId": fileId,
            "viewerEmail": email,
            "viewerName": name,
            "checkOnly": checkOnly
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FileServiceError.invalidResponse
        }
        
        if httpResponse.statusCode >= 400 {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let error = json["error"] as? String {
                throw FileServiceError.serverError(error)
            }
            throw FileServiceError.httpError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(AccessCheckResponse.self, from: data)
    }
    
    // MARK: - Decrypt File
    
    func decryptFile(fileId: String, password: String? = nil, email: String) async throws -> DecryptResponse {
        let url = URL(string: "\(Config.apiBaseURL)/api/files/\(fileId)/decrypt")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        var body: [String: Any] = [
            "viewerEmail": email
        ]
        if let password = password {
            body["password"] = password
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FileServiceError.invalidResponse
        }
        
        if httpResponse.statusCode >= 400 {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                if let needsPassword = json["needsPassword"] as? Bool, needsPassword {
                    return DecryptResponse(success: false, data: nil, mimeType: nil, error: nil, needsPassword: true)
                }
                if let error = json["error"] as? String {
                    throw FileServiceError.serverError(error)
                }
            }
            throw FileServiceError.httpError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(DecryptResponse.self, from: data)
    }
    
    // MARK: - Log Access
    
    func logAccess(fileId: String, action: String, email: String) async {
        guard let url = URL(string: "\(Config.apiBaseURL)/api/access/log") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "fileId": fileId,
            "action": action,
            "viewerEmail": email,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        // Fire and forget
        _ = try? await URLSession.shared.data(for: request)
    }
}

// MARK: - Errors

enum FileServiceError: LocalizedError {
    case invalidResponse
    case httpError(Int)
    case serverError(String)
    case noData
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .serverError(let message):
            return message
        case .noData:
            return "No data received"
        }
    }
}
