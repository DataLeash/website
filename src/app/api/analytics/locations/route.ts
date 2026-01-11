import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's files
        const { data: userFiles } = await supabase
            .from('files')
            .select('id')
            .eq('owner_id', user.id)

        if (!userFiles?.length) {
            return NextResponse.json({
                locations: [],
                totalCountries: 0,
                activeViewers: 0,
                blockedAttempts: 0
            })
        }

        const fileIds = userFiles.map(f => f.id)

        // Get access_requests which have fingerprint with GPS geolocation
        const { data: accessRequests } = await supabase
            .from('access_requests')
            .select('*, files(original_name)')
            .in('file_id', fileIds)
            .order('created_at', { ascending: false })
            .limit(500)

        // Get active sessions
        const { data: activeSessions } = await supabase
            .from('viewing_sessions')
            .select('*')
            .in('file_id', fileIds)
            .eq('is_active', true)

        // Create set of active viewer emails
        const activeEmails = new Set(activeSessions?.map(s => s.viewer_email?.toLowerCase()) || [])

        // Group by location - prefer fingerprint geolocation > ip_info > location JSONB
        const locationMap = new Map<string, {
            id: string
            lat: number
            lon: number
            city: string
            country: string
            countryCode: string
            isActive: boolean
            isBlocked: boolean
            viewerCount: number
            lastAccess: string
            files: Set<string>
            mapsUrl: string
            viewerEmail: string
            viewerName: string
        }>()

        for (const req of accessRequests || []) {
            // Priority 1: Browser GPS from fingerprint
            const fingerprint = req.fingerprint || {}
            const geo = fingerprint.geolocation || {}

            // Priority 2: IP-based info
            const ipInfo = req.ip_info || {}

            // Get coordinates - prefer GPS over IP
            let lat = geo.latitude || geo.lat || ipInfo.lat || 0
            let lon = geo.longitude || geo.lon || ipInfo.lon || 0

            // Get city/country from IP info (GPS doesn't provide this)
            const city = ipInfo.city || 'Unknown'
            const country = ipInfo.country || 'Unknown'
            const countryCode = ipInfo.countryCode || 'XX'

            // Get or build maps URL
            const mapsUrl = geo.mapsUrl ||
                (lat && lon ? `https://maps.google.com/maps?q=${lat},${lon}` : '')

            // Skip if no valid coordinates
            if (!lat && !lon) continue

            // Use more precise key for GPS data (5 decimal places = ~1m precision)
            const key = `${lat.toFixed(4)}_${lon.toFixed(4)}`

            const viewerEmail = req.viewer_email?.toLowerCase()

            // Filter out owner's own activity
            if (viewerEmail === user.email?.toLowerCase()) continue

            const isActive = activeEmails.has(viewerEmail)
            const isBlocked = req.status === 'denied'

            if (!locationMap.has(key)) {
                locationMap.set(key, {
                    id: key,
                    lat,
                    lon,
                    city,
                    country,
                    countryCode,
                    isActive,
                    isBlocked,
                    viewerCount: 0,
                    lastAccess: req.created_at,
                    files: new Set(),
                    mapsUrl,
                    viewerEmail: viewerEmail || '',
                    viewerName: req.viewer_name || ''
                })
            }

            const location = locationMap.get(key)!
            location.viewerCount++
            location.files.add(req.files?.original_name || req.file_id)

            if (new Date(req.created_at) > new Date(location.lastAccess)) {
                location.lastAccess = req.created_at
            }
            if (isActive) {
                location.isActive = true
            }
            if (isBlocked) {
                location.isBlocked = true
            }
        }

        // Convert to array
        const locations = Array.from(locationMap.values()).map(loc => ({
            ...loc,
            files: Array.from(loc.files)
        }))

        // Calculate stats
        const countries = new Set(locations.map(l => l.country))
        const blockedCount = locations.filter(l => l.isBlocked).length

        return NextResponse.json({
            locations,
            totalCountries: countries.size,
            activeViewers: activeSessions?.length || 0,
            blockedAttempts: blockedCount
        })

    } catch (error) {
        console.error('Locations API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
