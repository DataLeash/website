import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// DELETE /api/analytics/chains/[id] - Delete an access record
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get the access request to verify ownership
        const { data: accessRequest } = await supabase
            .from('access_requests')
            .select('*, files(owner_id)')
            .eq('id', id)
            .single()

        if (!accessRequest) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 })
        }

        // Verify the user owns this file
        if (accessRequest.files?.owner_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Delete the access request
        const { error } = await supabase
            .from('access_requests')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete error:', error)
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
        }

        // Also delete related access logs
        await supabase
            .from('access_logs')
            .delete()
            .eq('file_id', accessRequest.file_id)
            .ilike('location->>viewer_email', accessRequest.viewer_email)

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Delete chain record error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
