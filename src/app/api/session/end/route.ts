import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// POST /api/session/end - End a viewing session
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin()
        const { session_id } = await request.json()

        if (!session_id) {
            return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
        }

        // Get session to calculate duration
        const { data: session } = await supabase
            .from('sessions')
            .select('started_at, file_id, viewer_email')
            .eq('id', session_id)
            .single()

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        const duration = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)

        // Update session
        await supabase
            .from('sessions')
            .update({
                is_active: false,
                ended_at: new Date().toISOString(),
                session_duration: duration
            })
            .eq('id', session_id)

        // Log the access
        await supabase.from('access_logs').insert({
            file_id: session.file_id,
            action: 'view_ended',
            timestamp: new Date().toISOString(),
            session_duration: duration,
            location: { viewer_email: session.viewer_email }
        })

        return NextResponse.json({
            message: 'Session ended',
            duration
        })

    } catch (error) {
        console.error('Session end error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
