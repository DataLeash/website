import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

interface ChainNode {
    id: string
    accessId: string
    viewerName: string
    viewerEmail: string
    device: 'desktop' | 'mobile' | 'tablet'
    deviceInfo: string
    city: string
    country: string
    countryCode: string
    accessTime: string
    duration: number
    shareCount: number
    isBlocked: boolean
    isActive: boolean
    children: ChainNode[]
}

export async function GET() {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's files with access requests
        const { data: files } = await supabase
            .from('files')
            .select('id, original_name, settings')
            .eq('owner_id', user.id)
            .eq('is_destroyed', false)

        if (!files?.length) {
            return NextResponse.json({ chains: [] })
        }

        // Get active sessions to determine who is currently viewing
        const { data: activeSessions } = await supabase
            .from('viewing_sessions')
            .select('viewer_email, file_id, is_active, created_at, last_heartbeat, ended_at')
            .in('file_id', files.map(f => f.id))

        const activeViewerMap = new Map<string, Set<string>>()
        // Map to store total viewing duration per viewer+file: "email:fileId" -> seconds
        const sessionDurationMap = new Map<string, number>()

        for (const session of activeSessions || []) {
            const fileId = session.file_id
            const viewerEmail = session.viewer_email?.toLowerCase()

            if (!viewerEmail) continue

            // Track active viewers
            if (session.is_active) {
                if (!activeViewerMap.has(fileId)) {
                    activeViewerMap.set(fileId, new Set())
                }
                activeViewerMap.get(fileId)!.add(viewerEmail)
            }

            // Calculate duration for this session
            const startTime = new Date(session.created_at).getTime()
            const endTime = session.ended_at
                ? new Date(session.ended_at).getTime()
                : session.last_heartbeat
                    ? new Date(session.last_heartbeat).getTime()
                    : Date.now()
            const durationSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000))

            // Accumulate duration per viewer+file
            const key = `${viewerEmail}:${fileId}`
            sessionDurationMap.set(key, (sessionDurationMap.get(key) || 0) + durationSeconds)
        }

        const chains = []

        for (const file of files) {
            // Get access requests for this file (has full fingerprint/location data)
            const { data: accessRequests } = await supabase
                .from('access_requests')
                .select('*')
                .eq('file_id', file.id)
                .order('created_at', { ascending: false })

            if (!accessRequests?.length) continue

            const activeEmails = activeViewerMap.get(file.id) || new Set()
            const activeViewerCount = activeEmails.size

            // Build chain nodes
            const chainNodes: ChainNode[] = []
            const viewers = new Set<string>()

            for (const req of accessRequests) {
                const viewerEmail = req.viewer_email?.toLowerCase() || 'unknown'
                viewers.add(viewerEmail)

                // Get location from fingerprint GPS or IP info
                const fingerprint = req.fingerprint || {}
                const geo = fingerprint.geolocation || {}
                const ipInfo = req.ip_info || {}

                const city = ipInfo.city || geo.city || 'Unknown'
                const country = ipInfo.country || geo.country || 'Unknown'
                const countryCode = ipInfo.countryCode || 'XX'

                const userAgent = req.user_agent || fingerprint.userAgent || ''

                // Detect device type
                let device: 'desktop' | 'mobile' | 'tablet' = 'desktop'
                if (/mobile|android|iphone/i.test(userAgent)) device = 'mobile'
                else if (/tablet|ipad/i.test(userAgent)) device = 'tablet'

                // Check if this viewer is currently active
                const isActive = activeEmails.has(viewerEmail)

                const node: ChainNode = {
                    id: req.id,
                    accessId: req.id,
                    viewerName: req.viewer_name || viewerEmail.split('@')[0] || 'Viewer',
                    viewerEmail,
                    device,
                    deviceInfo: userAgent.substring(0, 100),
                    city,
                    country,
                    countryCode,
                    accessTime: req.created_at,
                    duration: sessionDurationMap.get(`${viewerEmail}:${file.id}`) || 0,
                    shareCount: 0,
                    isBlocked: req.status === 'denied',
                    isActive,
                    children: []
                }

                chainNodes.push(node)
            }

            if (chainNodes.length > 0) {
                chains.push({
                    fileId: file.id,
                    fileName: file.original_name,
                    totalViews: file.settings?.total_views || accessRequests.length,
                    uniqueViewers: viewers.size,
                    activeViewers: activeViewerCount,
                    chain: chainNodes
                })
            }
        }

        return NextResponse.json({ chains })

    } catch (error) {
        console.error('Chains API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
