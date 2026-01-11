import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/files/[id]/revoke - Revoke all active sessions for a file
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id: fileId } = await params

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify file ownership
        const { data: file } = await supabase
            .from('files')
            .select('id, original_name, owner_id')
            .eq('id', fileId)
            .eq('owner_id', user.id)
            .single()

        if (!file) {
            return NextResponse.json({ error: 'File not found or not owned by you' }, { status: 404 })
        }

        const { reason } = await request.json().catch(() => ({ reason: 'Access revoked by file owner' }))

        // Revoke all active sessions for this file
        const { data: revokedSessions, error: revokeError } = await supabase
            .from('viewing_sessions')
            .update({
                is_active: false,
                is_revoked: true,
                revoked_reason: reason,
                ended_at: new Date().toISOString()
            })
            .eq('file_id', fileId)
            .eq('is_active', true)
            .select('id, viewer_email')

        if (revokeError) {
            console.error('Revoke error:', revokeError)
            return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 })
        }

        // Log the revocation
        await supabase.from('access_logs').insert({
            file_id: fileId,
            user_id: user.id,
            action: 'access_revoked',
            timestamp: new Date().toISOString(),
            location: {
                revoked_count: revokedSessions?.length || 0,
                reason
            }
        })

        return NextResponse.json({
            message: 'Access revoked successfully',
            revoked_count: revokedSessions?.length || 0,
            revoked_sessions: revokedSessions?.map(s => s.viewer_email) || []
        })

    } catch (error) {
        console.error('Revoke error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
