import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/sessions/active - Get all active viewing sessions for owner's files
export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get all active sessions for files owned by this user
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select(`
                id,
                file_id,
                viewer_email,
                viewer_name,
                ip_info,
                device_info,
                started_at,
                last_heartbeat,
                files!inner (
                    id,
                    original_name,
                    owner_id
                )
            `)
            .eq('is_active', true)
            .eq('files.owner_id', user.id)
            .order('started_at', { ascending: false })

        if (error) {
            console.error('Active sessions error:', error)
            return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
        }

        // Calculate viewing duration for each session
        const sessionsWithDuration = (sessions || []).map(session => ({
            ...session,
            viewing_duration: Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000),
            location: session.ip_info?.city
                ? `${session.ip_info.city}, ${session.ip_info.country}`
                : 'Unknown'
        }))

        return NextResponse.json({
            sessions: sessionsWithDuration,
            count: sessionsWithDuration.length
        })

    } catch (error) {
        console.error('Active sessions error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
