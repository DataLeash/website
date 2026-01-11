import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: settings, error } = await supabase
            .from('users')
            .select('blocked_countries')
            .eq('id', user.id)
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            blockedCountries: settings.blocked_countries || []
        })

    } catch (error) {
        console.error('Settings fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/settings - Update user settings
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { blockedCountries } = body

        if (!Array.isArray(blockedCountries)) {
            return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
        }

        const { error } = await supabase
            .from('users')
            .update({ blocked_countries: blockedCountries })
            .eq('id', user.id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Settings update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
