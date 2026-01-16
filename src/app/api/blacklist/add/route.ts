import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// POST /api/blacklist/add - Add a device to user's blacklist
// SECURITY: Requires authentication and tier check
export async function POST(request: NextRequest) {
    try {
        // ========================================
        // SECURITY: Verify user is authenticated
        // ========================================
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ========================================
        // SECURITY: Check user tier (Pro feature)
        // ========================================
        const { data: userData } = await supabase
            .from('users')
            .select('tier, tier_expires_at')
            .eq('id', user.id)
            .single()

        const userTier = userData?.tier || 'free'
        const tierExpired = userData?.tier_expires_at && new Date(userData.tier_expires_at) < new Date()
        const effectiveTier = tierExpired ? 'free' : userTier

        if (effectiveTier === 'free') {
            return NextResponse.json({
                error: 'Pro feature',
                message: 'Blacklist management is a Pro feature. Upgrade to unlock.',
                upgrade: true
            }, { status: 403 })
        }

        // ========================================
        // Process blacklist addition
        // ========================================
        const adminClient = getSupabaseAdmin()
        const body = await request.json()

        const {
            blocked_email,
            blocked_name,
            reason,
            fingerprint,
            ip_address,
            ip_info
        } = body

        // Use authenticated user's ID as owner (NOT from request body!)
        const owner_id = user.id

        if (!fingerprint && !blocked_email) {
            return NextResponse.json({ error: 'Must provide fingerprint or email' }, { status: 400 })
        }

        // Extract hash values for fast matching
        const canvas_hash = fingerprint?.canvasDataHash || ''
        const webgl_hash = fingerprint?.webglFingerprint?.renderHash || ''
        const audio_hash = fingerprint?.audioFingerprint?.analyserHash || ''
        const font_hash = fingerprint?.fontFingerprint?.fontHash || ''
        const combined_hash = fingerprint?.combinedHash || ''

        // Check if already blacklisted (by email or combined hash)
        let checkQuery = adminClient
            .from('blacklist')
            .select('id')
            .eq('owner_id', owner_id)

        if (blocked_email && combined_hash) {
            checkQuery = checkQuery.or(`blocked_email.eq.${blocked_email},combined_hash.eq.${combined_hash}`)
        } else if (blocked_email) {
            checkQuery = checkQuery.eq('blocked_email', blocked_email)
        } else if (combined_hash) {
            checkQuery = checkQuery.eq('combined_hash', combined_hash)
        }

        const { data: existing } = await checkQuery.maybeSingle()

        if (existing) {
            return NextResponse.json({
                error: 'This device/email is already blacklisted',
                existing_id: existing.id
            }, { status: 409 })
        }

        const { data, error } = await adminClient
            .from('blacklist')
            .insert({
                owner_id,
                blocked_email,
                blocked_name,
                reason,
                fingerprint,
                canvas_hash,
                webgl_hash,
                audio_hash,
                font_hash,
                combined_hash,
                ip_address,
                ip_info
            })
            .select()
            .single()

        if (error) {
            console.error('Blacklist add error:', error)
            return NextResponse.json({ error: 'Failed to add to blacklist' }, { status: 500 })
        }

        return NextResponse.json({
            message: 'Added to blacklist successfully',
            blacklist_entry: data
        })

    } catch (error) {
        console.error('Blacklist error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
