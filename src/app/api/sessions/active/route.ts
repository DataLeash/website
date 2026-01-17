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
            .from('viewing_sessions')
            .select(`
                id,
                file_id,
                viewer_email,
                viewer_ip,
                viewer_location,
                user_agent,
                started_at,
                last_heartbeat,
                view_duration_seconds,
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
            // Handle case where table doesn't exist yet
            if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
                return NextResponse.json({
                    sessions: [],
                    count: 0,
                    message: 'No viewing sessions table yet'
                })
            }
            console.error('Active sessions error:', error)
            return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
        }

        // Filter out owner's own sessions if any
        const filteredSessions = sessions?.filter(s => s.viewer_email?.toLowerCase() !== user.email?.toLowerCase())

        // Calculate viewing duration for each session
        const sessionsWithDuration = (filteredSessions || []).map(session => ({
            ...session,
            viewing_duration: session.view_duration_seconds || Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000),
            location: session.viewer_location?.city
                ? `${session.viewer_location.city}, ${session.viewer_location.country}`
                : 'Unknown'
        }))

        return NextResponse.json({
            sessions: sessionsWithDuration,
            count: sessionsWithDuration.length
        })

    } catch (error) {
        console.error('Active sessions error:', error)
        // Return empty array instead of error for better UX
        return NextResponse.json({ sessions: [], count: 0 })
    }
}
