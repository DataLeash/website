import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const range = searchParams.get('range') // today, week, month, all

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

        // Calculate date filter based on range
        let dateFilter: Date | null = null
        if (range === 'today') {
            dateFilter = new Date()
            dateFilter.setHours(0, 0, 0, 0)
        } else if (range === 'week') {
            dateFilter = new Date()
            dateFilter.setDate(dateFilter.getDate() - 7)
        } else if (range === 'month') {
            dateFilter = new Date()
            dateFilter.setDate(dateFilter.getDate() - 30)
        }

        // Build query
        let query = supabase
            .from('access_requests')
            .select('*, files(original_name)')
            .in('file_id', fileIds)
            .order('created_at', { ascending: false })
            .limit(500)

        if (dateFilter) {
            query = query.gte('created_at', dateFilter.toISOString())
        }

        const { data: accessRequests } = await query

        // Get active sessions
        const { data: activeSessions } = await supabase
            .from('viewing_sessions')
            .select('*')
            .in('file_id', fileIds)
            .eq('is_active', true)

        // Create set of active viewer emails
        const activeEmails = new Set(activeSessions?.map(s => s.viewer_email?.toLowerCase()) || [])

        // Group by location with enhanced recon data
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
            // Reconnaissance data
            deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'
            browser: string
            os: string
            ip: string
            isp: string
            timezone: string
            screenRes: string
            language: string
        }>()

        for (const req of accessRequests || []) {
            // Priority 1: Browser GPS from fingerprint
            const fingerprint = req.fingerprint || {}
            const geo = fingerprint.geolocation || {}

            // Priority 2: IP-based info
            const ipInfo = req.ip_info || {}

            // Get coordinates - prefer GPS over IP
            const lat = geo.latitude || geo.lat || ipInfo.lat || 0
            const lon = geo.longitude || geo.lon || ipInfo.lon || 0

            // Get city/country from IP info (GPS doesn't provide this)
            const city = ipInfo.city || 'Unknown'
            const country = ipInfo.country || 'Unknown'
            const countryCode = ipInfo.countryCode || 'XX'

            // Get or build maps URL
            const mapsUrl = geo.mapsUrl ||
                (lat && lon ? `https://maps.google.com/maps?q=${lat},${lon}` : '')

            // Skip if no valid coordinates
            if (!lat && !lon) continue

            // Extract device/browser info from fingerprint
            const ua = fingerprint.userAgent || fingerprint.user_agent || ''
            const deviceType = detectDeviceType(ua, fingerprint)
            const browser = detectBrowser(ua, fingerprint)
            const os = detectOS(ua, fingerprint)
            const screenRes = fingerprint.screenResolution || fingerprint.screen || ''
            const language = fingerprint.language || fingerprint.languages?.[0] || ''
            const timezone = fingerprint.timezone || ipInfo.timezone || ''
            const ip = req.viewer_ip || ipInfo.query || ipInfo.ip || ''
            const isp = ipInfo.isp || ipInfo.org || ''

            // Use more precise key for GPS data
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
                    viewerName: req.viewer_name || '',
                    // Recon data
                    deviceType,
                    browser,
                    os,
                    ip,
                    isp,
                    timezone,
                    screenRes,
                    language
                })
            }

            const location = locationMap.get(key)!
            location.viewerCount++
            location.files.add(req.files?.original_name || req.file_id)

            if (new Date(req.created_at) > new Date(location.lastAccess)) {
                location.lastAccess = req.created_at
                // Update recon data with most recent
                if (deviceType !== 'unknown') location.deviceType = deviceType
                if (browser) location.browser = browser
                if (os) location.os = os
                if (ip) location.ip = ip
                if (isp) location.isp = isp
                if (timezone) location.timezone = timezone
                if (screenRes) location.screenRes = screenRes
                if (language) location.language = language
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

// Fingerprint interface for type safety
interface Fingerprint {
    platform?: string
    browser?: string
    os?: string
    userAgent?: string
    user_agent?: string
    screenResolution?: string
    screen?: string
    language?: string
    languages?: string[]
    timezone?: string
    geolocation?: {
        latitude?: number
        lat?: number
        longitude?: number
        lon?: number
        mapsUrl?: string
    }
    [key: string]: unknown
}

// Helper functions to detect device info from user agent and fingerprint
function detectDeviceType(ua: string, fingerprint: Fingerprint | null): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
    if (!ua && !fingerprint) return 'unknown'

    const uaLower = ua.toLowerCase()

    // Check fingerprint first
    if (fingerprint?.platform) {
        const platform = fingerprint.platform.toLowerCase()
        if (platform.includes('android') || platform.includes('iphone')) return 'mobile'
        if (platform.includes('ipad')) return 'tablet'
        if (platform.includes('win') || platform.includes('mac') || platform.includes('linux')) return 'desktop'
    }

    // Tablet detection (must be before mobile since tablets may include mobile keywords)
    if (/ipad|tablet|playbook|silk|android(?!.*mobile)/i.test(uaLower)) {
        return 'tablet'
    }

    // Mobile detection
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop|windows phone/i.test(uaLower)) {
        return 'mobile'
    }

    // Desktop by elimination
    if (/windows|macintosh|mac os|linux|cros/i.test(uaLower)) {
        return 'desktop'
    }

    return 'unknown'
}

function detectBrowser(ua: string, fingerprint: Fingerprint | null): string {
    if (!ua) return fingerprint?.browser || ''

    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Edg')) return 'Edge'
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
    if (ua.includes('MSIE') || ua.includes('Trident')) return 'IE'

    return fingerprint?.browser || 'Unknown'
}

function detectOS(ua: string, fingerprint: Fingerprint | null): string {
    if (!ua) return fingerprint?.os || fingerprint?.platform || ''

    if (ua.includes('Windows NT 10')) return 'Windows 10'
    if (ua.includes('Windows NT 6.3')) return 'Windows 8.1'
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac OS X')) {
        const match = ua.match(/Mac OS X (\d+[._]\d+)/)
        return match ? `macOS ${match[1].replace('_', '.')}` : 'macOS'
    }
    if (ua.includes('iPhone OS') || ua.includes('iPad')) {
        const match = ua.match(/(iPhone OS|CPU OS) (\d+[._]\d+)/)
        return match ? `iOS ${match[2].replace('_', '.')}` : 'iOS'
    }
    if (ua.includes('Android')) {
        const match = ua.match(/Android (\d+(\.\d+)?)/)
        return match ? `Android ${match[1]}` : 'Android'
    }
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('CrOS')) return 'Chrome OS'

    return fingerprint?.os || fingerprint?.platform || 'Unknown'
}

