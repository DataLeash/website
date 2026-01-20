import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

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

// POST /api/access/respond - Approve or deny an access request
export async function POST(request: NextRequest) {
    try {
        const { requestId, action, userId } = await request.json()

        if (!requestId || !action || !['approve', 'deny'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        // userId is REQUIRED for authorization
        if (!userId) {
            return NextResponse.json({ error: 'userId required for authorization' }, { status: 400 })
        }

        const supabase = getSupabaseClient()

        // Get access request
        const { data: accessRequest, error: fetchError } = await supabase
            .from('access_requests')
            .select('*, files(original_name, owner_id)')
            .eq('id', requestId)
            .single()

        if (fetchError || !accessRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        // ALWAYS verify the user is the file owner
        if (accessRequest.files.owner_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized - not file owner' }, { status: 403 })
        }

        // Update request status
        const { error: updateError } = await supabase
            .from('access_requests')
            .update({
                status: action === 'approve' ? 'approved' : 'denied',
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId)

        // If denying, also kill any active viewing sessions (Instant Revoke)
        if (action === 'deny' && accessRequest) {
            await supabase
                .from('viewing_sessions')
                .update({ is_active: false })
                .eq('file_id', accessRequest.file_id)
                .eq('viewer_email', accessRequest.viewer_email)
        }

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
        }

        // Log the action
        await supabase.from('access_logs').insert({
            file_id: accessRequest.file_id,
            action: action === 'approve' ? 'access_approved' : 'access_denied',
            location: {
                viewer_email: accessRequest.viewer_email,
                viewer_name: accessRequest.viewer_name
            },
            timestamp: new Date().toISOString()
        })

        // Send email to viewer about the decision
        try {
            if (process.env.RESEND_API_KEY) {
                const resend = new Resend(process.env.RESEND_API_KEY)
                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || 'Data Leash <noreply@dataleash.app>',
                    to: [accessRequest.viewer_email],
                    subject: action === 'approve'
                        ? `✓ Access Granted: ${accessRequest.files.original_name}`
                        : `✗ Access Denied: ${accessRequest.files.original_name}`,
                    html: action === 'approve'
                        ? `<p>Your request to view "${accessRequest.files.original_name}" has been <strong style="color: #00d4ff;">approved</strong>.</p><p>You can now view the file by returning to the share link.</p>`
                        : `<p>Your request to view "${accessRequest.files.original_name}" has been <strong style="color: #ef4444;">denied</strong>.</p><p>If you believe this is a mistake, please contact the file owner.</p>`
                })
            }
        } catch (e) {
            console.log('Email to viewer failed:', e)
        }

        return NextResponse.json({
            success: true,
            status: action === 'approve' ? 'approved' : 'denied'
        })

    } catch (error) {
        console.error('Access respond error:', error)
        return NextResponse.json({ error: 'Failed to process response' }, { status: 500 })
    }
}
