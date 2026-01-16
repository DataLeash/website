import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOtpEmail } from '@/lib/email'

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

// Generate 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/otp/send - Send OTP to email
export async function POST(request: NextRequest) {
    try {
        const { email, fileId, viewerName } = await request.json()

        if (!email || !fileId) {
            return NextResponse.json({ error: 'Email and fileId are required' }, { status: 400 })
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }

        const supabase = getSupabaseClient()

        // Verify file exists and get details
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('id, original_name, owner_id, is_destroyed')
            .eq('id', fileId)
            .single()

        if (fileError || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        if (file.is_destroyed) {
            return NextResponse.json({ error: 'File has been destroyed' }, { status: 410 })
        }

        // Get file owner details
        const { data: owner } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', file.owner_id)
            .single()

        // Rate limiting: Check if too many OTPs sent recently
        const { count } = await supabase
            .from('otp_codes')
            .select('*', { count: 'exact', head: true })
            .eq('email', email.toLowerCase())
            .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute

        if (count && count >= 3) {
            return NextResponse.json({
                error: 'Too many requests. Please wait a minute before trying again.'
            }, { status: 429 })
        }

        // Generate OTP
        const otp = generateOTP()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Store OTP in database
        const { data: otpRecord, error: insertError } = await supabase
            .from('otp_codes')
            .insert({
                email: email.toLowerCase(),
                code: otp,
                file_id: fileId,
                viewer_name: viewerName,
                expires_at: expiresAt.toISOString(),
                verified: false,
                attempts: 0
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('OTP insert error:', insertError)
            return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
        }

        // Send email via Resend
        try {
            await sendOtpEmail({
                to: email,
                viewerName: viewerName || 'User',
                fileName: file.original_name,
                ownerName: owner?.full_name || 'Someone',
                code: otp
            })
        } catch (emailError: unknown) {
            console.error('Email send error:', emailError)

            // Delete the OTP record if email fails
            await supabase.from('otp_codes').delete().eq('id', otpRecord.id)

            return NextResponse.json({
                error: 'Failed to send verification email. Please check your email address.'
            }, { status: 500 })
        }

        // Create notification for file owner
        if (owner) {
            await supabase.from('notifications').insert({
                user_id: file.owner_id,
                type: 'access_request',
                title: 'Access Request',
                message: `${viewerName || email} is requesting access to "${file.original_name}"`,
                file_id: fileId,
                is_read: false
            })
        }

        return NextResponse.json({
            success: true,
            sessionId: otpRecord.id,
            message: `Verification code sent to ${email}`,
            expiresIn: 600 // 10 minutes in seconds
        })

    } catch (error) {
        console.error('OTP send error:', error)
        return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
    }
}
