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

        // Get user's files with access logs
        const { data: files } = await supabase
            .from('files')
            .select('id, original_name, settings')
            .eq('owner_id', user.id)
            .eq('is_destroyed', false)

        if (!files?.length) {
            return NextResponse.json({ chains: [] })
        }

        const chains = []

        for (const file of files) {
            // Get access logs for this file
            const { data: accessLogs } = await supabase
                .from('access_logs')
                .select('*')
                .eq('file_id', file.id)
                .eq('action', 'view')
                .order('timestamp', { ascending: true })

            if (!accessLogs?.length) continue

            // Get viewing sessions for duration info
            const { data: sessions } = await supabase
                .from('viewing_sessions')
                .select('*')
                .eq('file_id', file.id)

            const sessionMap = new Map(sessions?.map(s => [s.viewer_email, s]) || [])

            // Build chain nodes
            const chainNodes: ChainNode[] = []
            const viewers = new Set<string>()

            for (const log of accessLogs) {
                // location JSONB has the info we need
                const loc = log.location || {}
                const viewerEmail = loc.viewer_email || log.ip_address || 'unknown'
                viewers.add(viewerEmail)

                const session = sessionMap.get(viewerEmail)
                const userAgent = loc.userAgent || ''

                // Detect device type
                let device: 'desktop' | 'mobile' | 'tablet' = 'desktop'
                if (/mobile|android|iphone/i.test(userAgent)) device = 'mobile'
                else if (/tablet|ipad/i.test(userAgent)) device = 'tablet'

                const node: ChainNode = {
                    id: log.id,
                    accessId: log.id,
                    viewerName: loc.viewer_name || viewerEmail.split('@')[0] || 'Viewer',
                    viewerEmail,
                    device,
                    deviceInfo: userAgent.substring(0, 100),
                    city: loc.city || 'Unknown',
                    country: loc.country || 'Unknown',
                    countryCode: loc.countryCode || 'XX',
                    accessTime: log.timestamp,
                    duration: session?.viewing_duration || log.session_duration || 0,
                    shareCount: 0,
                    isBlocked: log.action === 'blocked',
                    children: []
                }

                chainNodes.push(node)
            }

            if (chainNodes.length > 0) {
                chains.push({
                    fileId: file.id,
                    fileName: file.original_name,
                    totalViews: file.settings?.total_views || accessLogs.length,
                    uniqueViewers: viewers.size,
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
