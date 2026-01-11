import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get limit from query params (default 10)
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '10')

        // Get user's files
        const { data: userFiles } = await supabase
            .from('files')
            .select('id')
            .eq('owner_id', user.id)

        if (!userFiles?.length) {
            return NextResponse.json({ events: [], threats: [] })
        }

        const fileIds = userFiles.map(f => f.id)

        // Get recent activity from access_logs
        const { data: recentLogs } = await supabase
            .from('access_logs')
            .select('*, files(original_name)')
            .in('file_id', fileIds)
            .order('timestamp', { ascending: false })
            .limit(limit)

        // Get recent access requests (for more detail)
        const { data: accessRequests } = await supabase
            .from('access_requests')
            .select('*, files(original_name)')
            .in('file_id', fileIds)
            .order('created_at', { ascending: false })
            .limit(limit)

        // Get threats (denied requests + blacklist matches)
        const { data: threats } = await supabase
            .from('access_requests')
            .select('*, files(original_name)')
            .in('file_id', fileIds)
            .eq('status', 'denied')
            .order('created_at', { ascending: false })
            .limit(20)

        // Get active sessions for real-time status
        const { data: activeSessions } = await supabase
            .from('viewing_sessions')
            .select('*')
            .in('file_id', fileIds)
            .eq('is_active', true)

        // Format events for the feed
        const events = (recentLogs || []).map(log => ({
            id: log.id,
            type: log.action,
            timestamp: log.timestamp,
            fileName: log.files?.original_name || 'Unknown File',
            fileId: log.file_id,
            location: log.location || {},
            ipAddress: log.ip_address,
            isBlocked: log.action === 'blocked' || log.action === 'access_denied'
        }))

        // Add access requests to events
        const requestEvents = (accessRequests || []).map(req => ({
            id: req.id,
            type: req.status === 'approved' ? 'access_approved' :
                req.status === 'denied' ? 'access_denied' : 'access_requested',
            timestamp: req.created_at,
            fileName: req.files?.original_name || 'Unknown File',
            fileId: req.file_id,
            viewerEmail: req.viewer_email,
            viewerName: req.viewer_name,
            location: {
                city: req.ip_info?.city || 'Unknown',
                country: req.ip_info?.country || 'Unknown'
            },
            isBlocked: req.status === 'denied'
        }))

        // Format threats
        const threatList = (threats || []).map(t => ({
            id: t.id,
            email: t.viewer_email,
            name: t.viewer_name,
            fileName: t.files?.original_name,
            timestamp: t.created_at,
            location: {
                city: t.ip_info?.city || 'Unknown',
                country: t.ip_info?.country || 'Unknown'
            },
            reason: t.deny_reason || 'Access denied by owner',
            fingerprint: t.fingerprint
        }))

        // Merge and sort by timestamp
        const allEvents = [...events, ...requestEvents]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit)

        return NextResponse.json({
            events: allEvents,
            threats: threatList,
            activeViewers: activeSessions?.length || 0,
            activeDetails: (activeSessions || []).map(s => ({
                email: s.viewer_email,
                fileId: s.file_id,
                startedAt: s.created_at,
                lastHeartbeat: s.last_heartbeat
            }))
        })

    } catch (error) {
        console.error('Recent activity API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
