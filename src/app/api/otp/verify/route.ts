import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAccessNotification } from '@/lib/email'

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

// POST /api/otp/verify - Verify OTP code
export async function POST(request: NextRequest) {
    try {
        const { sessionId, code, email } = await request.json()

        if (!sessionId || !code) {
            return NextResponse.json({ error: 'Session ID and code are required' }, { status: 400 })
        }

        // Validate code format (6 digits)
        if (!/^\d{6}$/.test(code)) {
            return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
        }

        const supabase = getSupabaseClient()

        // Get OTP record
        const { data: otpRecord, error: fetchError } = await supabase
            .from('otp_codes')
            .select('*')
            .eq('id', sessionId)
            .single()

        if (fetchError || !otpRecord) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
        }

        // Check if already verified
        if (otpRecord.verified) {
            return NextResponse.json({ error: 'Code already used' }, { status: 401 })
        }

        // Check if expired
        if (new Date(otpRecord.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Code has expired. Please request a new one.' }, { status: 401 })
        }

        // Check attempts (max 5)
        if (otpRecord.attempts >= 5) {
            return NextResponse.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 })
        }

        // Increment attempts
        await supabase
            .from('otp_codes')
            .update({ attempts: otpRecord.attempts + 1 })
            .eq('id', sessionId)

        // Verify code
        if (otpRecord.code !== code) {
            const remaining = 4 - otpRecord.attempts
            return NextResponse.json({
                error: `Invalid code. ${remaining} attempts remaining.`
            }, { status: 401 })
        }

        // Mark as verified
        await supabase
            .from('otp_codes')
            .update({ verified: true })
            .eq('id', sessionId)

        // Get file and owner details for notification
        const { data: file } = await supabase
            .from('files')
            .select('original_name, owner_id')
            .eq('id', otpRecord.file_id)
            .single()

        if (file) {
            const { data: owner } = await supabase
                .from('users')
                .select('full_name, email')
                .eq('id', file.owner_id)
                .single()

            // Send notification email to owner
            if (owner?.email) {
                try {
                    await sendAccessNotification({
                        to: owner.email,
                        ownerName: owner.full_name || 'User',
                        viewerName: otpRecord.viewer_name || 'Someone',
                        viewerEmail: otpRecord.email,
                        fileName: file.original_name,
                        action: 'accessed'
                    })
                } catch (e) {
                    console.log('Notification email failed:', e)
                }
            }
        }

        // Generate access token
        const accessToken = Buffer.from(JSON.stringify({
            sessionId,
            email: otpRecord.email,
            fileId: otpRecord.file_id,
            viewerName: otpRecord.viewer_name,
            verified: true,
            verifiedAt: new Date().toISOString(),
            expires: Date.now() + 30 * 60 * 1000 // 30 minutes
        })).toString('base64')

        return NextResponse.json({
            success: true,
            verified: true,
            accessToken,
            viewerName: otpRecord.viewer_name,
            email: otpRecord.email
        })

    } catch (error) {
        console.error('OTP verify error:', error)
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }
}
