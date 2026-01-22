import { NextResponse } from 'next/server'
import { getAuthenticatedClient } from '@/lib/auth-helper'

// GET /api/access/pending - Get pending access requests for current user's files
// Supports both cookie auth (web) and Bearer token (iOS)
export async function GET() {
    try {
        const { supabase, user, error: authError } = await getAuthenticatedClient()

        if (authError || !supabase || !user) {
            return NextResponse.json(
                { error: authError || 'Unauthorized' },
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
