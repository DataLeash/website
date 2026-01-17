import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

function getResendClient() {
    return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
}

export async function POST(request: NextRequest) {
    try {
        const { fileId, viewerEmail, viewerName, fingerprint, checkOnly } = await request.json()

        if (!fileId || !viewerEmail) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = getSupabaseClient()
        const email = viewerEmail.toLowerCase()

        // Get file
        const { data: file, error } = await supabase
            .from('files')
            .select('id, owner_id, original_name, settings')
            .eq('id', fileId)
            .single()

        if (error || !file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

        // Check if recipient is allowed (auto-approve)
        const settings = file.settings || {}
        const allowedRecipients = settings.allowed_recipients || []
        const isRecipient = allowedRecipients.includes(email)

        if (checkOnly) {
            // Just checking if auto-allowed
            return NextResponse.json({ allowed: isRecipient })
        }

        // If recipient, grant access immediately
        if (isRecipient) {
            await grantAccess(supabase, file.id, email, viewerName, 1) // Trust level 1
            return NextResponse.json({ approved: true, message: 'Access granted' })
        }

        // If not recipient, create request
        const { data: requestRecord, error: reqError } = await supabase
            .from('access_requests')
            .insert({
                file_id: file.id,
                viewer_email: email,
                viewer_name: viewerName || email,
                fingerprint: fingerprint || {},
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select('id')
            .single()

        if (reqError) throw reqError

        // Notify owner
        await supabase.from('notifications').insert({
            user_id: file.owner_id,
            type: 'access_request',
            title: 'New Access Request',
            message: `${viewerName || email} wants to view "${file.original_name}"`,
            file_id: file.id,
            metadata: { request_id: requestRecord.id, viewer_email: email },
            is_read: false
        })

        // Send email to owner
        const { data: owner } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', file.owner_id)
            .single()

        if (owner?.email) {
            const resend = getResendClient()
            if (resend) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                await resend.emails.send({
                    from: 'DataLeash <noreply@dataleash.app>',
                    to: [owner.email],
                    subject: `🔔 Access Request: "${file.original_name}"`,
                    html: `
                        <p><strong>${viewerName}</strong> (${email}) requests access to <strong>${file.original_name}</strong>.</p>
                        <p>
                            <a href="${appUrl}/dashboard/requests" style="background:#00d4ff;color:#000;padding:10px 20px;text-decoration:none;border-radius:5px;font-weight:bold;">Review Request</a>
                        </p>
                    `
                })
            }
        }

        return NextResponse.json({
            approved: false,
            requestId: requestRecord.id,
            message: 'Request sent to owner'
        })

    } catch (e: any) {
        console.error('Request error:', e)
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
    }
}

async function grantAccess(supabase: any, fileId: string, email: string, name: string, trust: number) {
    // Determine user ID if exists
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single()

    // Create/Update permission
    if (user) {
        await supabase.from('permissions').upsert({
            file_id: fileId,
            user_id: user.id,
            trust_level: trust,
            can_comment: true,
            updated_at: new Date().toISOString()
        })
    }

    // Log it
    await supabase.from('access_logs').insert({
        file_id: fileId,
        action: 'access_granted',
        location: { viewer_email: email, viewer_name: name },
        timestamp: new Date().toISOString()
    })
}

// GET status check
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')
    if (!requestId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const supabase = getSupabaseClient()
    const { data } = await supabase
        .from('access_requests')
        .select('status')
        .eq('id', requestId)
        .single()

    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ status: data.status })
}
