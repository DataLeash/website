import { createClient } from '@/lib/supabase-server'
import { NextResponse, NextRequest } from 'next/server'
import { analyzeSecurityThreat } from '@/lib/ai-security'

// Use service role for session management (bypasses RLS)
async function getSupabaseAdmin() {
    return await createClient()
}

// POST /api/session/create - Create a new viewing session
export async function POST(request: NextRequest) {
    try {
        const supabase = await getSupabaseAdmin()
        const body = await request.json()

        // Support both naming conventions
        const fileId = body.file_id || body.fileId
        const viewerEmail = body.viewer_email || body.viewerEmail
        const viewerName = body.viewer_name || body.viewerName

        if (!fileId || !viewerEmail) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get client IP
        const forwarded = request.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '0.0.0.0'

        // AI Threat Detection (Groq Powered)
        const threat = await analyzeSecurityThreat({
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown', // Using user-agent from headers
            fileId: fileId,
            timestamp: Date.now()
        });

        if (threat.blockAction) {
            console.warn(`[Blocked] High risk session attempt: ${threat.reason}`);
            return NextResponse.json(
                { error: 'Security Risk Detected', reason: threat.reason },
                { status: 403 }
            );
        }

        // Country Blocking Check
        const country = request.headers.get('x-vercel-ip-country')
        if (country) {
            // Get file owner to check their blocklist
            const { data: fileOwner } = await supabase
                .from('files')
                .select('owner_id')
                .eq('id', fileId)
                .single()

            if (fileOwner) {
                const { data: ownerSettings } = await supabase
                    .from('users')
                    .select('blocked_countries')
                    .eq('id', fileOwner.owner_id)
                    .single()

                if (ownerSettings?.blocked_countries?.includes(country)) {
                    console.warn(`[Blocked] Connection from blocked country: ${country}`);
                    return NextResponse.json(
                        { error: 'Access Denied', reason: 'This content is not available in your region' },
                        { status: 403 }
                    );
                }
            }
        }

        // Check if session already exists
        const { data: existing } = await supabase
            .from('viewing_sessions')
            .select('id')
            .eq('file_id', fileId)
            .eq('viewer_email', viewerEmail.toLowerCase())
            .eq('is_active', true)
            .single()

        if (existing) {
            // Update existing session
            await supabase
                .from('viewing_sessions')
                .update({ last_heartbeat: new Date().toISOString() })
                .eq('id', existing.id)

            return NextResponse.json({
                session_id: existing.id,
                heartbeat_interval: 30000
            })
        }

        // Create new session
        const { data: session, error } = await supabase
            .from('viewing_sessions')
            .insert({
                file_id: fileId,
                viewer_email: viewerEmail.toLowerCase(),
                viewer_name: viewerName || null,
                ip_address: ip,
                is_active: true,
                started_at: new Date().toISOString(),
                last_heartbeat: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('Session create error:', error)
            // Try with sessions table as fallback
            const { data: fallbackSession, error: fallbackError } = await supabase
                .from('sessions')
                .insert({
                    file_id: fileId,
                    viewer_email: viewerEmail.toLowerCase(),
                    viewer_name: viewerName || null,
                    ip_address: ip,
                    is_active: true,
                    last_heartbeat: new Date().toISOString()
                })
                .select()
                .single()

            if (fallbackError) {
                console.error('Fallback session create error:', fallbackError)
                return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
            }

            return NextResponse.json({
                session_id: fallbackSession.id,
                heartbeat_interval: 30000
            })
        }

        // Notify file owner of new viewer
        const { data: file } = await supabase
            .from('files')
            .select('owner_id, original_name')
            .eq('id', fileId)
            .single()

        if (file) {
            await supabase.from('notifications').insert({
                user_id: file.owner_id,
                type: 'view',
                title: '👁️ File Being Viewed',
                message: `${viewerName || viewerEmail} is now viewing "${file.original_name}"`,
                file_id: fileId,
                is_read: false
            })
        }

        return NextResponse.json({
            session_id: session.id,
            security_check: threat.riskLevel,
            started_at: session.started_at,
            heartbeat_interval: 30000
        })

    } catch (error) {
        console.error('Session create error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
