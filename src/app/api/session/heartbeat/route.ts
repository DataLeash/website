import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// POST /api/session/heartbeat - Update session heartbeat & check if still valid
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin()
        const { session_id } = await request.json()

        if (!session_id) {
            return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
        }

        // Get current session state
        const { data: session, error: fetchError } = await supabase
            .from('sessions')
            .select('is_active, is_revoked, revoked_reason, file_id')
            .eq('id', session_id)
            .single()

        if (fetchError || !session) {
            return NextResponse.json({
                valid: false,
                reason: 'Session not found'
            })
        }

        // Check if session was revoked by owner
        if (session.is_revoked) {
            return NextResponse.json({
                valid: false,
                reason: session.revoked_reason || 'Access revoked by file owner'
            })
        }

        // Check if session was marked inactive
        if (!session.is_active) {
            return NextResponse.json({
                valid: false,
                reason: 'Session expired'
            })
        }

        // Check if file still exists and is not destroyed
        const { data: file } = await supabase
            .from('files')
            .select('is_destroyed, settings')
            .eq('id', session.file_id)
            .single()

        if (!file) {
            return NextResponse.json({
                valid: false,
                reason: 'File no longer exists'
            })
        }

        if (file.is_destroyed) {
            return NextResponse.json({
                valid: false,
                reason: 'File has been destroyed by owner'
            })
        }

        // Check file expiry
        if (file.settings?.expires_at && new Date(file.settings.expires_at) < new Date()) {
            return NextResponse.json({
                valid: false,
                reason: 'File link has expired'
            })
        }

        // Update heartbeat
        await supabase
            .from('sessions')
            .update({ last_heartbeat: new Date().toISOString() })
            .eq('id', session_id)

        return NextResponse.json({
            valid: true,
            next_heartbeat: 30000 // 30 seconds
        })

    } catch (error) {
        console.error('Heartbeat error:', error)
        return NextResponse.json({
            valid: false,
            reason: 'Server error - please refresh'
        })
    }
}
