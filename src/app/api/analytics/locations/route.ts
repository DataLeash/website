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

        // Get access logs with location data
        // location JSONB has: city, country, countryCode, lat, lon
        const { data: accessLogs } = await supabase
            .from('access_logs')
            .select('*, files(original_name)')
            .in('file_id', fileIds)
            .order('timestamp', { ascending: false })
            .limit(500)

        // Get active sessions
        const { data: activeSessions } = await supabase
            .from('viewing_sessions')
            .select('*')
            .in('file_id', fileIds)
            .eq('is_active', true)

        // Group by location
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
        }>()

        for (const log of accessLogs || []) {
            // location is stored in the `location` JSONB column
            const loc = log.location || {}
            const lat = loc.lat || 0
            const lon = loc.lon || 0
            const city = loc.city || 'Unknown'
            const country = loc.country || 'Unknown'

            // Skip if no valid location
            if (!lat && !lon && city === 'Unknown') continue

            const key = `${lat.toFixed(1)}_${lon.toFixed(1)}`

            if (!locationMap.has(key)) {
                locationMap.set(key, {
                    id: key,
                    lat,
                    lon,
                    city,
                    country,
                    countryCode: loc.countryCode || 'XX',
                    isActive: false,
                    isBlocked: log.action === 'blocked',
                    viewerCount: 0,
                    lastAccess: log.timestamp,
                    files: new Set()
                })
            }

            const location = locationMap.get(key)!
            location.viewerCount++
            location.files.add(log.files?.original_name || log.file_id)
            if (new Date(log.timestamp) > new Date(location.lastAccess)) {
                location.lastAccess = log.timestamp
            }
            if (log.action === 'blocked') {
                location.isBlocked = true
            }
        }

        // Mark active locations
        for (const session of activeSessions || []) {
            // Try to match by viewer email in the session
            for (const log of accessLogs || []) {
                if (log.location?.viewer_email === session.viewer_email) {
                    const loc = log.location
                    const key = `${(loc.lat || 0).toFixed(1)}_${(loc.lon || 0).toFixed(1)}`
                    if (locationMap.has(key)) {
                        locationMap.get(key)!.isActive = true
                    }
                    break
                }
            }
        }

        // Convert to array
        const locations = Array.from(locationMap.values()).map(loc => ({
            ...loc,
            files: Array.from(loc.files)
        }))

        // Calculate stats
        const countries = new Set(locations.map(l => l.country))
        const blockedCount = (accessLogs || []).filter(l => l.action === 'blocked').length

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
