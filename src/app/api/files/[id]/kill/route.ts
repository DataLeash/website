import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { sendKillNotification } from '@/lib/email'

// POST /api/files/[id]/kill - Instantly destroy a file and kill all active sessions
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

        // Verify ownership and get file name
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('owner_id, original_name')
            .eq('id', fileId)
            .single()

        if (fileError || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        if (file.owner_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Get user profile for email
        const { data: owner } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

        // 1. Mark file as destroyed
        const { error: updateError } = await supabase
            .from('files')
            .update({
                is_destroyed: true,
                destroyed_at: new Date().toISOString()
            })
            .eq('id', fileId)

        if (updateError) {
            throw updateError
        }

        // 2. Destroy encryption keys (hard delete for security)
        await supabase
            .from('key_shards')
            .delete()
            .eq('file_id', fileId)

        // 2b. Delete physical file from storage (Fix Storage Leak)
        // Need to fetch storage_path first if not already fetched
        const { data: fileWithStorage } = await supabase
            .from('files')
            .select('storage_path')
            .eq('id', fileId)
            .single()

        if (fileWithStorage?.storage_path) {
            const { error: storageError } = await supabase.storage
                .from('protected-files')
                .remove([fileWithStorage.storage_path])

            if (storageError) {
                console.error('Failed to remove file from storage:', storageError)
                // Don't fail the request, but log it
            }
        }

        // 3. Kill all active sessions instantly
        await supabase
            .from('viewing_sessions')
            .update({
                is_active: false,
                ended_at: new Date().toISOString()
            })
            .eq('file_id', fileId)
            .eq('is_active', true)

        // 4. Log the action
        await supabase.from('access_logs').insert({
            file_id: fileId,
            user_id: user.id,
            action: 'killed',
            timestamp: new Date().toISOString()
        })

        // 5. Send email notification (non-blocking)
        if (owner?.email) {
            sendKillNotification({
                to: owner.email,
                ownerName: owner.full_name || 'User',
                fileName: file.original_name,
                reason: 'Manual kill switch activation'
            }).catch(err => console.error('Kill notification email failed:', err))
        }

        return NextResponse.json({ success: true, message: 'File destroyed and sessions killed' })

    } catch (error) {
        console.error('Kill file error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
