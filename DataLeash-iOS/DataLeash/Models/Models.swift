import Foundation

// MARK: - File Models

struct FileInfo: Codable {
    let id: String
    let originalName: String
    let mimeType: String?
    let ownerId: String
    let settings: FileSettings?
    
    enum CodingKeys: String, CodingKey {
        case id
        case originalName = "original_name"
        case mimeType = "mime_type"
        case ownerId = "owner_id"
        case settings
    }
}

struct FileSettings: Codable {
    let passwordProtected: Bool?
    let allowedRecipients: [String]?
    let maxViews: Int?
    let expiresAt: String?
    
    enum CodingKeys: String, CodingKey {
        case passwordProtected = "password_protected"
        case allowedRecipients = "allowed_recipients"
        case maxViews = "max_views"
        case expiresAt = "expires_at"
    }
}

// MARK: - User Models

struct AppUser: Codable {
    let id: String
    let email: String
    let fullName: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case fullName = "full_name"
    }
}

// MARK: - API Response Models

struct AccessCheckResponse: Codable {
    let allowed: Bool?
    let approved: Bool?
    let requestId: String?
    let message: String?
    let needsPassword: Bool?
}

struct DecryptResponse: Codable {
    let success: Bool?
    let data: String? // Base64 encoded file data
    let mimeType: String?
    let error: String?
    let needsPassword: Bool?
    
    enum CodingKeys: String, CodingKey {
        case success
        case data
        case mimeType = "mime_type"
        case error
        case needsPassword
    }
}

// MARK: - Access Request

struct AccessRequest: Codable {
    let fileId: String
    let viewerEmail: String
    let viewerName: String
    let checkOnly: Bool?
    
    enum CodingKeys: String, CodingKey {
        case fileId
        case viewerEmail
        case viewerName
        case checkOnly
    }
}
