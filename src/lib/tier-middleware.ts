import { createClient } from '@/lib/supabase-server'
import { SupabaseClient } from '@supabase/supabase-js'

// Admin emails - stored in environment for security
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

export interface TierInfo {
    tier: 'free' | 'pro' | 'enterprise'
    isExpired: boolean
    effectiveTier: 'free' | 'pro' | 'enterprise'
    tierExpiresAt: string | null
    hasSubscription: boolean
}

export interface AuthResult {
    user: { id: string; email: string } | null
    tierInfo: TierInfo | null
    isAdmin: boolean
    error: string | null
}

/**
 * Get authenticated user with tier information
 * Use this in API routes to check auth + tier in one call
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                user: null,
                tierInfo: null,
                isAdmin: false,
                error: 'Unauthorized'
            }
        }

        // Get user tier from database
        const { data: userData } = await supabase
            .from('users')
            .select('tier, tier_started_at, tier_expires_at, kofi_subscription_id, is_admin')
            .eq('id', user.id)
            .single()

        const tier = (userData?.tier || 'free') as 'free' | 'pro' | 'enterprise'
        const tierExpiresAt = userData?.tier_expires_at
        const isExpired = tierExpiresAt ? new Date(tierExpiresAt) < new Date() : false
        const effectiveTier = isExpired ? 'free' : tier

        // Check if user is admin (from DB or env)
        const isAdmin = userData?.is_admin === true ||
            ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')

        return {
            user: { id: user.id, email: user.email || '' },
            tierInfo: {
                tier,
                isExpired,
                effectiveTier,
                tierExpiresAt,
                hasSubscription: !!userData?.kofi_subscription_id
            },
            isAdmin,
            error: null
        }
    } catch (error) {
        console.error('Auth check error:', error)
        return {
            user: null,
            tierInfo: null,
            isAdmin: false,
            error: 'Internal server error'
        }
    }
}

/**
 * Check if user has Pro tier access
 * Returns true if user is Pro, Enterprise, or admin
 */
export function hasProAccess(auth: AuthResult): boolean {
    if (!auth.user || auth.error) return false
    if (auth.isAdmin) return true
    return auth.tierInfo?.effectiveTier === 'pro' || auth.tierInfo?.effectiveTier === 'enterprise'
}

/**
 * Check if user is an admin
 */
export function isAdminUser(auth: AuthResult): boolean {
    return auth.isAdmin
}

/**
 * Create standard error response for Pro-only features
 */
export function proFeatureError(featureName: string) {
    return {
        error: 'Pro feature required',
        message: `${featureName} is a Pro feature. Upgrade to unlock.`,
        upgrade: true
    }
}

/**
 * Create standard error response for admin-only features
 */
export function adminOnlyError() {
    return {
        error: 'Admin access required',
        message: 'This action requires administrator privileges.'
    }
}

/**
 * Helper to check file ownership
 */
export async function checkFileOwnership(
    supabase: SupabaseClient,
    fileId: string,
    userId: string
): Promise<{ isOwner: boolean; error?: string }> {
    try {
        const { data: file, error } = await supabase
            .from('files')
            .select('owner_id')
            .eq('id', fileId)
            .single()

        if (error || !file) {
            return { isOwner: false, error: 'File not found' }
        }

        return { isOwner: file.owner_id === userId }
    } catch {
        return { isOwner: false, error: 'Failed to check ownership' }
    }
}

/**
 * Get effective tier from user data
 * Handles expiration logic
 */
export function getEffectiveTier(userData: {
    tier?: string | null
    tier_expires_at?: string | null
}): 'free' | 'pro' | 'enterprise' {
    const tier = userData?.tier || 'free'
    const expiresAt = userData?.tier_expires_at

    if (expiresAt && new Date(expiresAt) < new Date()) {
        return 'free' // Expired
    }

    return tier as 'free' | 'pro' | 'enterprise'
}
