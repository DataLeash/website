import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Combined stats endpoint - single query instead of 4 separate ones
export async function GET() {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Single query to get all file IDs
        const { data: userFiles, error: filesError } = await supabase
            .from('files')
            .select('id')
            .eq('owner_id', user.id)
            .eq('is_destroyed', false)

        if (filesError) {
            console.error('Files query error:', filesError)
            return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
        }

        const fileIds = userFiles?.map(f => f.id) || []
        const totalFiles = fileIds.length

        // If no files, return zeros immediately
        if (totalFiles === 0) {
            return NextResponse.json({
                totalFiles: 0,
                totalViews: 0,
                activeShares: 0,
                threatsBlocked: 0
            })
        }

        // Run all count queries in parallel for efficiency
        const [viewsResult, sharesResult, threatsResult] = await Promise.all([
            // Total views
            supabase
                .from('access_logs')
                .select('*', { count: 'exact', head: true })
                .eq('action', 'view')
                .in('file_id', fileIds),

            // Active shares (permissions)
            supabase
                .from('permissions')
                .select('*', { count: 'exact', head: true })
                .in('file_id', fileIds),

            // Threats blocked
            supabase
                .from('access_logs')
                .select('*', { count: 'exact', head: true })
                .eq('action', 'blocked')
                .in('file_id', fileIds)
        ])

        return NextResponse.json({
            totalFiles,
            totalViews: viewsResult.count || 0,
            activeShares: sharesResult.count || 0,
            threatsBlocked: threatsResult.count || 0
        })

    } catch (error) {
        console.error('Stats API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
