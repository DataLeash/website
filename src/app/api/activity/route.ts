import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/activity - Get recent activity for current user's files
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

        // Get file IDs owned by this user
        const { data: userFiles } = await supabase
            .from('files')
            .select('id')
            .eq('owner_id', user.id)

        const fileIds = userFiles?.map(f => f.id) || []

        if (fileIds.length === 0) {
            return NextResponse.json({ logs: [] })
        }

        // Get recent access logs for these files
        const { data: logs, error } = await supabase
            .from('access_logs')
            .select('*')
            .in('file_id', fileIds)
            .order('timestamp', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Activity error:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ logs: logs || [] })
    } catch (error) {
        console.error('Get activity error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
