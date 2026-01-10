import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// POST /api/session/revoke - Revoke a specific viewing session
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin()
        const { session_id, reason } = await request.json()

        if (!session_id) {
            return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
        }

        // Get session info first
        const { data: session, error: fetchError } = await supabase
            .from('sessions')
            .select('id, viewer_email, file_id, is_active')
            .eq('id', session_id)
            .single()

        if (fetchError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        if (!session.is_active) {
            return NextResponse.json({ error: 'Session already ended' }, { status: 400 })
        }

        // Revoke the specific session
        const { error: updateError } = await supabase
            .from('sessions')
            .update({
                is_active: false,
                is_revoked: true,
                revoked_reason: reason || 'Access revoked by owner',
                ended_at: new Date().toISOString()
            })
            .eq('id', session_id)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 })
        }

        // Log the revocation
        await supabase.from('access_logs').insert({
            file_id: session.file_id,
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
