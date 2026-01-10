import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use service role to bypass RLS for public file viewing
function getSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

// GET /api/files/[id]/info - Get public file info for viewing
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = getSupabaseClient()
        const { id: fileId } = await params

        // Get file record
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('id, original_name, mime_type, file_size, created_at, settings, owner_id, is_destroyed')
            .eq('id', fileId)
            .single()

        if (fileError || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        if (file.is_destroyed) {
            return NextResponse.json({ error: 'File has been destroyed' }, { status: 410 })
        }

        // Check expiry
        if (file.settings?.expires_at && new Date(file.settings.expires_at) < new Date()) {
            return NextResponse.json({ error: 'File link has expired' }, { status: 410 })
        }

        // Get owner info
        const { data: owner } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', file.owner_id)
            .single()

        return NextResponse.json({
            id: file.id,
            original_name: file.original_name,
            mime_type: file.mime_type,
            file_size: file.file_size,
            created_at: file.created_at,
            settings: file.settings,
            owner_id: file.owner_id,
            owner: owner ? {
                full_name: owner.full_name
            } : null
        })

    } catch (error) {
        console.error('File info error:', error)
        return NextResponse.json({ error: 'Failed to get file info' }, { status: 500 })
    }
}
