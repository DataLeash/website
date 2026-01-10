import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use service role for session management (bypasses RLS)
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// POST /api/session/create - Create a new viewing session
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin()
        const body = await request.json()

        const { file_id, viewer_email, viewer_name, fingerprint, ip_info, device_info } = body

        if (!file_id || !viewer_email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get client IP
        const forwarded = request.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '0.0.0.0'

        // Create session
        const { data: session, error } = await supabase
            .from('sessions')
            .insert({
                file_id,
                viewer_email,
                viewer_name: viewer_name || null,
                fingerprint: fingerprint || null,
                ip_address: ip,
                ip_info: ip_info || null,
                device_info: device_info || null,
                is_active: true,
                last_heartbeat: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('Session create error:', error)
            return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
        }

        // Notify file owner of new viewer
        const { data: file } = await supabase
            .from('files')
            .select('owner_id, original_name')
            .eq('id', file_id)
            .single()

        if (file) {
            await supabase.from('notifications').insert({
                user_id: file.owner_id,
                type: 'view',
                title: 'File Being Viewed',
                message: `${viewer_name || viewer_email} is now viewing "${file.original_name}"`,
                file_id,
                is_read: false
            })
        }

        return NextResponse.json({
            session_id: session.id,
            started_at: session.started_at,
            heartbeat_interval: 30000 // 30 seconds in ms
        })

    } catch (error) {
        console.error('Session create error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
