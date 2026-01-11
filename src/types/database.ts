export interface User {
    id: string
    email: string
    phone: string
    phone_verified: boolean
    email_verified: boolean
    full_name: string
    qid: string
    qid_verified: boolean
    created_at: string
    updated_at: string
    is_active: boolean
    trust_score: number
    anonymous_id?: string
    blocked_countries?: string[] // ISO 2-letter codes
}

export interface Device {
    id: string
    user_id: string
    device_name: string
    device_type: 'windows' | 'macos' | 'ios' | 'android'
    hardware_id: string
    tpm_attestation: string | null
    is_trusted: boolean
    last_seen: string
    created_at: string
}

export interface ProtectedFile {
    id: string
    owner_id: string
    original_name: string
    file_hash: string
    file_size: number
    mime_type: string
    encryption_key_id: string
    settings: FileSettings
    created_at: string
    updated_at: string
    total_views: number
    active_shares: number
}

export interface FileSettings {
    lockdown_level: 0 | 1 | 2 | 3 | 4
    trust_level: 0 | 1 | 2 | 3 | 4 | 5
    expires_at: string | null
    max_views: number | null
    require_nda: boolean
    require_facial: boolean
    allow_comments: boolean
    notify_on_view: boolean
    auto_kill_on_screenshot: boolean
    blocked_countries?: string[] // Override global settings
}

export interface Permission {
    id: string
    file_id: string
    user_id: string
    trust_level: number
    expires_at: string | null
    nda_signed: boolean
    nda_signed_at: string | null
    can_comment: boolean
    can_sign: boolean
    created_at: string
}

export interface AccessLog {
    id: string
    file_id: string
    user_id: string
    device_id: string
    action: 'view' | 'denied' | 'revoked' | 'expired' | 'blocked'
    ip_address: string
    location: {
        country: string
        city: string
        lat: number
        lng: number
    }
    timestamp: string
    session_duration: number
    ai_risk_score: number
}

export interface Notification {
    id: string
    user_id: string
    type: 'access_request' | 'view' | 'threat' | 'revoke' | 'expiry'
    title: string
    message: string
    file_id: string | null
    is_read: boolean
    created_at: string
}
