import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/blacklist - Get user's blacklist
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('blacklist')
            .select('*')
            .eq('owner_id', user.id)
            .order('blocked_at', { ascending: false })

        if (error) {
            console.error('Blacklist fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch blacklist' }, { status: 500 })
        }

        return NextResponse.json({ blacklist: data || [] })

    } catch (error) {
        console.error('Blacklist error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/blacklist - Add to blacklist
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            blocked_email,
            blocked_name,
            reason,
            fingerprint,
            ip_address,
            ip_info,
            notes
        } = body

        if (!blocked_email) {
            return NextResponse.json({ error: 'Missing blocked_email' }, { status: 400 })
        }

        // Check if already blacklisted
        const { data: existing } = await supabase
            .from('blacklist')
            .select('id')
            .eq('owner_id', user.id)
            .eq('blocked_email', blocked_email)
            .single()

        if (existing) {
            return NextResponse.json({ error: 'User is already blacklisted' }, { status: 409 })
        }

        const { data, error } = await supabase
            .from('blacklist')
            .insert({
                owner_id: user.id,
                blocked_email,
                blocked_name,
                reason,
                fingerprint,
                ip_address,
                ip_info,
                notes
            })
            .select()
            .single()

        if (error) {
            console.error('Blacklist add error:', error)
            return NextResponse.json({ error: 'Failed to add to blacklist' }, { status: 500 })
        }

        return NextResponse.json({
            message: 'Added to blacklist',
            entry: data
        })

    } catch (error) {
        console.error('Blacklist add error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/blacklist - Remove from blacklist
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Missing blacklist ID' }, { status: 400 })
        }

        const { error } = await supabase
            .from('blacklist')
            .delete()
            .eq('id', id)
            .eq('owner_id', user.id)

        if (error) {
            console.error('Blacklist delete error:', error)
            return NextResponse.json({ error: 'Failed to remove from blacklist' }, { status: 500 })
        }

        return NextResponse.json({ message: 'Removed from blacklist' })

    } catch (error) {
        console.error('Blacklist error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
