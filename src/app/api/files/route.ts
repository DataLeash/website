import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/files - Get all files for current user
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

        const { data: files, error } = await supabase
            .from('files')
            .select(`
        *,
        access_logs (count),
        permissions (count)
      `)
            .eq('owner_id', user.id)
            .eq('is_destroyed', false)
            .order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        // Transform files to include total_views from settings
        const transformedFiles = (files || []).map(file => {
            // Priority: settings.total_views > access_logs count
            let viewCount = 0

            if (file.settings?.total_views) {
                viewCount = file.settings.total_views
            } else if (file.access_logs && Array.isArray(file.access_logs) && file.access_logs.length > 0) {
                // Supabase returns [{count: N}] for count queries
                viewCount = file.access_logs[0]?.count || 0
            }

            return {
                ...file,
                total_views: viewCount
            }
        })

        return NextResponse.json({ files: transformedFiles })
    } catch (error) {
        console.error('Get files error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/files - Kill all files (chain kill)
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { confirmation } = await request.json()

        if (confirmation !== 'DESTROY ALL') {
            return NextResponse.json(
                { error: 'Invalid confirmation code' },
                { status: 400 }
            )
        }

        // Get all user's file IDs first
        const { data: userFiles } = await supabase
            .from('files')
            .select('id')
            .eq('owner_id', user.id)

        const fileIds = userFiles?.map(f => f.id) || []

        if (fileIds.length > 0) {
            // Get storage paths before deletion
            const { data: filesWithPaths } = await supabase
                .from('files')
                .select('storage_path')
                .in('id', fileIds);

            // Delete actual files from storage (FIX: Storage Leak)
            if (filesWithPaths && filesWithPaths.length > 0) {
                const paths = filesWithPaths.map(f => f.storage_path).filter(Boolean);
                if (paths.length > 0) {
                    const { error: storageError } = await supabase.storage
                        .from('protected-files')
                        .remove(paths);
                    if (storageError) {
                        console.error('Chain kill storage deletion error:', storageError);
                        // Continue anyway - DB cleanup is more important
                    }
                }
            }

            // Revoke all permissions
            await supabase
                .from('permissions')
                .delete()
                .in('file_id', fileIds)

            // Delete all key shards
            await supabase
                .from('key_shards')
                .delete()
                .in('file_id', fileIds)

            // Kill all active sessions instantly
            await supabase
                .from('viewing_sessions')
                .update({ is_active: false, ended_at: new Date().toISOString() })
                .in('file_id', fileIds)
                .eq('is_active', true)
        }

        // Mark files as destroyed
        const { data: files, error } = await supabase
            .from('files')
            .update({
                is_destroyed: true,
                destroyed_at: new Date().toISOString(),
            })
            .eq('owner_id', user.id)
            .select()

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        // Log the chain kill event
        await supabase.from('access_logs').insert({
            user_id: user.id,
            action: 'chain_kill',
            timestamp: new Date().toISOString(),
        })

        return NextResponse.json({
            message: 'All files destroyed',
            destroyed_count: files?.length || 0,
        })
    } catch (error) {
        console.error('Chain kill error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
