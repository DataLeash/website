import Foundation
import SwiftUI

// MARK: - Supabase Client
// Direct Supabase REST API calls with JWT token authentication

class SupabaseClient {
    static let shared = SupabaseClient()
    private init() {}
    
    // MARK: - Error Types
    
    enum SupabaseError: LocalizedError {
        case notAuthenticated
        case invalidResponse
        case serverError(String)
        case decodingError(String)
        case invalidData
        case networkError
        
        var errorDescription: String? {
            switch self {
            case .notAuthenticated: return "Please sign in"
            case .invalidResponse: return "Invalid response from server"
            case .serverError(let msg): return msg
            case .decodingError(let msg): return "Data error: \(msg)"
            case .invalidData: return "Invalid data received"
            case .networkError: return "Network error - please check your connection"
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private var userId: String? { AuthService.shared.currentUser?.id }
    private var token: String? { AuthService.shared.accessToken }
    
    private func makeRequest(path: String, query: String = "") -> URLRequest? {
        guard let token = token else { return nil }
        
        var urlString = "\(Config.supabaseURL)/rest/v1/\(path)"
        if !query.isEmpty {
            let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
            urlString += "?\(encodedQuery)"
        }
        
        guard let url = URL(string: urlString) else { return nil }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return request
    }
    
    // MARK: - Activity Logging (Moved from FileService)
    
    func logAccess(fileId: String, action: String, email: String? = nil) async {
        guard let token = token else { return }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/access_logs")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "file_id": fileId,
            "action": action,
            "viewer_email": email ?? AuthService.shared.currentUser?.email ?? "unknown",
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        _ = try? await URLSession.shared.data(for: request)
    }
    
    // MARK: - File Access & Decryption
    
    struct FileAccessResponse {
        var allowed: Bool?
        var approved: Bool?
        var error: String?
    }
    
    struct FileDecryptResponse {
        var data: String? // Base64
        var mimeType: String?
        var needsPassword: Bool?
        var error: String?
    }
    
    func requestAccess(fileId: String, email: String, name: String, checkOnly: Bool) async throws -> FileAccessResponse {
        guard let token = token else { return FileAccessResponse(error: "Not authenticated") }
        
        // 1. Check if I am the owner
        if let userId = userId {
            let fileInfo = try? await getFilePreviewInfo(fileId: fileId)
            // If I am owner, allow. (Simplified check, assumes owner knows their file)
             // Real check would query file owner_id.
             // For now, let's check file_access table.
        }
        
        // 2. Check file_access table
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/file_access?file_id=eq.\(fileId)&viewer_email=eq.\(email)&select=status")!
        var request = URLRequest(url: url)
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        if let accessList = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
           let entry = accessList.first,
           let status = entry["status"] as? String {
            
            if status == "approved" || status == "granted" {
                return FileAccessResponse(allowed: true, approved: true)
            } else if status == "pending" {
                return FileAccessResponse(allowed: false, approved: false) // Pending
            }
        }
        
        if checkOnly {
            return FileAccessResponse(allowed: false)
        }
        
        // 3. Request access (Insert into file_access)
        // If not exists, insert
        let insertUrl = URL(string: "\(Config.supabaseURL)/rest/v1/file_access")!
        var insertReq = URLRequest(url: insertUrl)
        insertReq.httpMethod = "POST"
        insertReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        insertReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        insertReq.setValue("application/json", forHTTPHeaderField: "Content-Type")
        insertReq.setValue("return=minimal", forHTTPHeaderField: "Prefer")
        
        let body: [String: Any] = [
            "file_id": fileId,
            "viewer_email": email,
            "viewer_name": name,
            "status": "pending",
            "created_at": ISO8601DateFormatter().string(from: Date())
        ]
        
        insertReq.httpBody = try? JSONSerialization.data(withJSONObject: body)
        _ = try? await URLSession.shared.data(for: insertReq)
        
        return FileAccessResponse(approved: false)
    }
    
    func decryptFile(fileId: String, password: String?, email: String) async throws -> FileDecryptResponse {
        // Core implementation: simple fetch (mocking crypto for core demo)
        do {
            let data = try await getFileThumbnail(fileId: fileId) // Reusing thumbnail fetch as generic file fetch for now
            let base64 = data.base64EncodedString()
            let info = try await getFilePreviewInfo(fileId: fileId)
            
            return FileDecryptResponse(data: base64, mimeType: info.mimeType, needsPassword: false)
        } catch {
            return FileDecryptResponse(error: error.localizedDescription)
        }
    }
    
    // MARK: - Files
    
    struct FileItem: Identifiable {
        let id: String
        let originalName: String
        let mimeType: String?
        let createdAt: Date
        let isDestroyed: Bool
        let totalViews: Int
        let shareableLink: String
        
        var iconName: String {
            guard let type = mimeType else { return "doc.fill" }
            if type.contains("image") { return "photo.fill" }
            if type.contains("pdf") { return "doc.richtext.fill" }
            if type.contains("video") { return "video.fill" }
            return "doc.fill"
        }
    }
    
    func getMyFiles() async throws -> [FileItem] {
        guard let userId = userId else { throw SupabaseError.notAuthenticated }
        
        guard let req = makeRequest(path: "files", query: "owner_id=eq.\(userId)&is_destroyed=eq.false&order=created_at.desc&select=id,original_name,mime_type,created_at,is_destroyed,settings") else {
            throw SupabaseError.notAuthenticated
        }
        
        let (data, _) = try await URLSession.shared.data(for: req)
        
        guard let files = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        
        return files.compactMap { file -> FileItem? in
            guard let id = file["id"] as? String,
                  let name = file["original_name"] as? String else { return nil }
            
            let settings = file["settings"] as? [String: Any]
            let views = settings?["total_views"] as? Int ?? 0
            
            return FileItem(
                id: id,
                originalName: name,
                mimeType: file["mime_type"] as? String,
                createdAt: Date(), // Simplified date parsing
                isDestroyed: file["is_destroyed"] as? Bool ?? false,
                totalViews: views,
                shareableLink: "\(Config.apiBaseURL)/view/\(id)"
            )
        }
    }
    
    func killFile(fileId: String) async throws {
        guard var req = makeRequest(path: "files", query: "id=eq.\(fileId)") else {
            throw SupabaseError.notAuthenticated
        }
        req.httpMethod = "PATCH"
        req.httpBody = try JSONSerialization.data(withJSONObject: [
            "is_destroyed": true,
            "destroyed_at": ISO8601DateFormatter().string(from: Date())
        ])
        
        let (_, response) = try await URLSession.shared.data(for: req)
        guard let httpResp = response as? HTTPURLResponse, (200...299).contains(httpResp.statusCode) else {
            throw SupabaseError.serverError("Failed to kill file")
        }
    }
    
    // MARK: - File Info & Thumbs
    
    struct FilePreviewInfoResponse {
        let fileName: String
        let mimeType: String
        let storagePath: String
        let status: String
    }
    
    func getFilePreviewInfo(fileId: String) async throws -> FilePreviewInfoResponse {
        guard let token = token else { throw SupabaseError.notAuthenticated }
        
        let url = URL(string: "\(Config.supabaseURL)/rest/v1/files?id=eq.\(fileId)&select=original_name,mime_type,storage_path,status")!
        var request = URLRequest(url: url)
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        guard let files = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
              let file = files.first,
              let fileName = file["original_name"] as? String,
              let mimeType = file["mime_type"] as? String,
              let storagePath = file["storage_path"] as? String else {
            throw SupabaseError.invalidData
        }
        
        return FilePreviewInfoResponse(
            fileName: fileName,
            mimeType: mimeType,
            storagePath: storagePath,
            status: file["status"] as? String ?? "active"
        )
    }
    
    func getFileThumbnail(fileId: String) async throws -> Data {
        guard let token = token else { throw SupabaseError.notAuthenticated }
        let info = try await getFilePreviewInfo(fileId: fileId)
        let url = URL(string: "\(Config.supabaseURL)/storage/v1/object/authenticated/files/\(info.storagePath)")!
        var request = URLRequest(url: url)
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw SupabaseError.networkError
        }
        return data
    }
    
    // MARK: - Access Requests & Receivers
    
    struct FileReceiver: Identifiable {
        let id: String
        let email: String
        let name: String?
        let status: String
        let lastViewedAt: Date?
        let viewCount: Int
        let grantedAt: Date
    }
    
    func getFileReceivers(fileId: String) async throws -> [FileReceiver] {
        guard let token = token else { throw SupabaseError.notAuthenticated }
        
        let accessUrl = URL(string: "\(Config.supabaseURL)/rest/v1/file_access?file_id=eq.\(fileId)&select=*")!
        var accessReq = URLRequest(url: accessUrl)
        accessReq.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        accessReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (accessData, _) = try await URLSession.shared.data(for: accessReq)
        let accessList = (try? JSONSerialization.jsonObject(with: accessData) as? [[String: Any]]) ?? []
        
        return accessList.compactMap { access -> FileReceiver? in
            guard let id = access["id"] as? String,
                  let email = access["viewer_email"] as? String else { return nil }
            return FileReceiver(
                id: id,
                email: email,
                name: access["viewer_name"] as? String,
                status: access["status"] as? String ?? "pending",
                lastViewedAt: Date(), // Simplified
                viewCount: 0,
                grantedAt: Date()
            )
        }
    }
    
    func revokeUserAccess(fileId: String, accessId: String) async throws {
        // Implementation for revoking specific user access
        // (Similar to killFile but on file_access table)
    }
    
    func revokeAllAccess(fileId: String) async throws {
        // Implementation for revoking all access
    }
    
    // MARK: - Inbox / Access Requests
    
    struct AccessRequestItem: Identifiable {
        let id: String
        let fileId: String
        let fileName: String?
        let viewerEmail: String
        let viewerName: String?
        let status: String
        let createdAt: Date
    }
    
    func getPendingRequests() async throws -> [AccessRequestItem] {
        // Core implementation needed for Inbox
        return [] // Placeholder to suppress errors until InboxView is recreated or removed
    }
    
    func respondToRequest(requestId: String, approve: Bool) async throws {
        // Core implementation
    }
}
