import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

// Settings schema for validation
interface UserSettings {
    blockedCountries?: string[]
    emailNotifications?: boolean
    pushNotifications?: boolean
    notifyOnView?: boolean
    notifyOnThreat?: boolean
    notifyOnApproval?: boolean
    dailyDigest?: boolean
    twoFactor?: boolean
    autoKillOnThreat?: boolean
    sessionTimeout?: number
    loginAlerts?: boolean
    requireNdaDefault?: boolean
    requireApprovalDefault?: boolean
    defaultExpiry?: number
    defaultMaxViews?: number
}

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
    try {
        // Rate limiting
        const clientId = getClientIdentifier(request.headers)
        const rateLimit = checkRateLimit(`settings:${clientId}`, RATE_LIMIT_CONFIGS.api)

        if (rateLimit.limited) {
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
            )
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData, error } = await supabase
            .from('users')
            .select('blocked_countries, settings')
            .eq('id', user.id)
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Merge database settings with blocked countries
        const settings = {
            blockedCountries: userData.blocked_countries || [],
            ...(userData.settings || {})
        }

        return NextResponse.json(settings)

    } catch (error) {
        console.error('Settings fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/settings - Update user settings
export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const clientId = getClientIdentifier(request.headers)
        const rateLimit = checkRateLimit(`settings:${clientId}`, RATE_LIMIT_CONFIGS.api)

        if (rateLimit.limited) {
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
            )
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body: UserSettings = await request.json()

        // Validate blocked countries if provided
        if (body.blockedCountries !== undefined && !Array.isArray(body.blockedCountries)) {
            return NextResponse.json({ error: 'Invalid blockedCountries format' }, { status: 400 })
        }

        // Validate numeric fields
        if (body.sessionTimeout !== undefined && (typeof body.sessionTimeout !== 'number' || body.sessionTimeout < 0)) {
            return NextResponse.json({ error: 'Invalid sessionTimeout' }, { status: 400 })
        }

        if (body.defaultExpiry !== undefined && (typeof body.defaultExpiry !== 'number' || body.defaultExpiry < 0)) {
            return NextResponse.json({ error: 'Invalid defaultExpiry' }, { status: 400 })
        }

        if (body.defaultMaxViews !== undefined && (typeof body.defaultMaxViews !== 'number' || body.defaultMaxViews < 0)) {
            return NextResponse.json({ error: 'Invalid defaultMaxViews' }, { status: 400 })
        }

        // Separate blocked_countries from other settings
        const { blockedCountries, ...otherSettings } = body

        // Update in database
        const updateData: Record<string, unknown> = {}

        if (blockedCountries !== undefined) {
            updateData.blocked_countries = blockedCountries
        }

        if (Object.keys(otherSettings).length > 0) {
            // Get existing settings first
            const { data: existing } = await supabase
                .from('users')
                .select('settings')
                .eq('id', user.id)
                .single()

            updateData.settings = { ...(existing?.settings || {}), ...otherSettings }
        }

        if (Object.keys(updateData).length > 0) {
            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.id)

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Settings update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

