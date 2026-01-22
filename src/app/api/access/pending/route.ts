import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/access/pending - Get pending access requests for current user's files
export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get pending access requests for files owned by this user
        const { data: requests, error } = await supabase
            .from('access_requests')
            .select(`
                *,
                files!inner(original_name, owner_id)
            `)
            .eq('files.owner_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Pending requests error:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ requests: requests || [] })
    } catch (error) {
        console.error('Get pending requests error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
