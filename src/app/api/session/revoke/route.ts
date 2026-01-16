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

// POST /api/session/revoke - Revoke a specific viewing session
// SECURITY: Requires authentication and ownership verification
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
                message: 'Session management is a Pro feature. Upgrade to unlock.',
                upgrade: true
            }, { status: 403 })
        }

        const adminClient = getSupabaseAdmin()
        const { session_id, reason } = await request.json()

        if (!session_id) {
            return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
        }

        // Get session info first
        const { data: session, error: fetchError } = await adminClient
            .from('viewing_sessions')
            .select('id, viewer_email, file_id, is_active')
            .eq('id', session_id)
            .single()

        if (fetchError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // ========================================
        // SECURITY: Verify the user owns this file
        // ========================================
        const { data: file, error: fileError } = await adminClient
            .from('files')
            .select('owner_id')
            .eq('id', session.file_id)
            .single()

        if (fileError || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        if (file.owner_id !== user.id) {
            console.warn(`[SECURITY] User ${user.id} tried to revoke session on file owned by ${file.owner_id}`)
            return NextResponse.json({ error: 'You do not own this file' }, { status: 403 })
        }

        // ========================================
        // Proceed with revocation
        // ========================================
        if (!session.is_active) {
            return NextResponse.json({ error: 'Session already ended' }, { status: 400 })
        }

        // Revoke the specific session
        const { error: updateError } = await adminClient
            .from('viewing_sessions')
            .update({
                is_active: false,
                is_revoked: true,
                revoked_reason: reason || 'Access revoked by owner',
                ended_at: new Date().toISOString()
            })
            .eq('id', session_id)

        if (updateError) {
            console.error('Session revoke error:', updateError)
            return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 })
        }

        // Log the revocation
        await adminClient.from('access_logs').insert({
            file_id: session.file_id,
            user_id: user.id,
            action: 'session_revoked',
            timestamp: new Date().toISOString(),
            location: {
                viewer_email: session.viewer_email,
                reason: reason || 'Revoked by owner'
            }
        })

        return NextResponse.json({
            message: 'Session revoked successfully',
            revoked_viewer: session.viewer_email
        })

    } catch (error) {
        console.error('Session revoke error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
