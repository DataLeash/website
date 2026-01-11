import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// POST /api/session/heartbeat - Update session heartbeat & check if still valid
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin()
        const body = await request.json()

        // Support both formats
        const sessionId = body.session_id
        const fileId = body.file_id || body.fileId
        const viewerEmail = body.viewer_email || body.viewerEmail

        // If we have fileId and viewerEmail, find session that way
        if (fileId && viewerEmail) {
            // Try viewing_sessions first
            const { data: session } = await supabase
                .from('viewing_sessions')
                .select('id, is_active, file_id')
                .eq('file_id', fileId)
                .eq('viewer_email', viewerEmail.toLowerCase())
                .eq('is_active', true)
                .single()

            if (session) {
                // Check if file is still valid
                const { data: file } = await supabase
                    .from('files')
                    .select('is_destroyed, settings, owner_id')
                    .eq('id', fileId)
                    .single()

                if (file?.is_destroyed) {
                    return NextResponse.json({
                        valid: false,
                        reason: 'File has been destroyed by owner'
                    })
                }

                if (file?.settings?.expires_at && new Date(file.settings.expires_at) < new Date()) {
                    return NextResponse.json({
                        valid: false,
                        reason: 'File link has expired'
                    })
                }

                // Country Check (Instant Revocation)
                const country = request.headers.get('x-vercel-ip-country')
                if (country && file) {
                    const { data: ownerSettings } = await supabase
                        .from('users')
                        .select('blocked_countries')
                        .eq('id', file.owner_id)
                        .single()

                    if (ownerSettings?.blocked_countries?.includes(country)) {
                        return NextResponse.json({
                            valid: false,
                            reason: 'Access revoked: Region blocked'
                        })
                    }
                }

                // Update heartbeat
                await supabase
                    .from('viewing_sessions')
                    .update({ last_heartbeat: new Date().toISOString() })
                    .eq('id', session.id)

                return NextResponse.json({
                    valid: true,
                    next_heartbeat: 30000
                })
            }
        }

        // Legacy: lookup by session_id
        if (sessionId) {
            // Try viewing_sessions first
            let session = null
            let tableName = 'viewing_sessions'

            const { data: vs } = await supabase
                .from('viewing_sessions')
                .select('is_active, file_id')
                .eq('id', sessionId)
                .single()

            if (vs) {
                session = vs
            } else {
                // Fallback to sessions table
                const { data: s } = await supabase
                    .from('sessions')
                    .select('is_active, is_revoked, revoked_reason, file_id')
                    .eq('id', sessionId)
                    .single()

                if (s) {
                    session = s
                    tableName = 'sessions'

                    if (s.is_revoked) {
                        return NextResponse.json({
                            valid: false,
                            reason: s.revoked_reason || 'Access revoked by file owner'
                        })
                    }
                }
            }

            if (!session) {
                return NextResponse.json({
                    valid: false,
                    reason: 'Session not found'
                })
            }

            if (!session.is_active) {
                return NextResponse.json({
                    valid: false,
                    reason: 'Session expired'
                })
            }

            // Check file status
            const { data: file } = await supabase
                .from('files')
                .select('is_destroyed, settings, owner_id')
                .eq('id', session.file_id)
                .single()

            if (!file) {
                return NextResponse.json({
                    valid: false,
                    reason: 'File no longer exists'
                })
            }

            if (file.is_destroyed) {
                return NextResponse.json({
                    valid: false,
                    reason: 'File has been destroyed by owner'
                })
            }

            if (file.settings?.expires_at && new Date(file.settings.expires_at) < new Date()) {
                return NextResponse.json({
                    valid: false,
                    reason: 'File link has expired'
                })
            }

            // Country Check (Instant Revocation for Legacy Path)
            const country = request.headers.get('x-vercel-ip-country')
            if (country) {
                const { data: ownerSettings } = await supabase
                    .from('users')
                    .select('blocked_countries')
                    .eq('id', file.owner_id)
                    .single()

                if (ownerSettings?.blocked_countries?.includes(country)) {
                    return NextResponse.json({
                        valid: false,
                        reason: 'Access revoked: Region blocked'
                    })
                }
            }

            // Update heartbeat
            await supabase
                .from(tableName)
                .update({ last_heartbeat: new Date().toISOString() })
                .eq('id', sessionId)

            return NextResponse.json({
                valid: true,
                next_heartbeat: 30000
            })
        }

        return NextResponse.json({ error: 'Missing session identifier' }, { status: 400 })

    } catch (error) {
        console.error('Heartbeat error:', error)
        return NextResponse.json({
            valid: false,
            reason: 'Server error - please refresh'
        })
    }
}
