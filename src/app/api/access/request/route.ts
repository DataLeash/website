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

// Dynamic base URL detection - works from any device
function getBaseUrl(request: NextRequest): string {
    // Try to get the origin from headers (works for any device)
    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'http'

    if (host) {
        return `${protocol}://${host}`
    }

    // Fallback to env variable or localhost
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// POST /api/access/request - Request access to a file (after email verification)
export async function POST(request: NextRequest) {
    try {
        const { fileId, viewerName, viewerEmail, sessionId, fingerprint } = await request.json()

        if (!fileId || !viewerEmail || !sessionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = getSupabaseClient()

        // Verify the OTP session is valid and verified
        const { data: otpRecord, error: otpError } = await supabase
            .from('otp_codes')
            .select('*')
            .eq('id', sessionId)
            .eq('verified', true)
            .single()

        if (otpError || !otpRecord) {
            return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
        }

        // Get file and owner details
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('id, original_name, owner_id')
            .eq('id', fileId)
            .single()

        if (fileError || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        const { data: owner } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', file.owner_id)
            .single()

        // Collect device and location info from headers
        const forwardedFor = request.headers.get('x-forwarded-for')
        const realIp = request.headers.get('x-real-ip')
        const cfConnectingIp = request.headers.get('cf-connecting-ip')
        const userAgent = request.headers.get('user-agent') || 'Unknown Device'
        const ipAddress = cfConnectingIp || forwardedFor?.split(',')[0]?.trim() || realIp || 'Unknown'

        // Parse user agent for device info
        const deviceInfo = parseUserAgent(userAgent)

        // Get detailed IP info (VPN detection, geolocation)
        let ipInfo = null
        if (ipAddress && ipAddress !== 'Unknown') {
            try {
                const ipResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,region,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting`)
                const ipData = await ipResponse.json()
                if (ipData.status === 'success') {
                    ipInfo = {
                        ip: ipAddress,
                        city: ipData.city,
                        region: ipData.region,
                        country: ipData.country,
                        countryCode: ipData.countryCode,
                        isp: ipData.isp,
                        org: ipData.org,
                        as: ipData.as,
                        timezone: ipData.timezone,
                        isVpn: ipData.proxy || false,
                        isProxy: ipData.proxy || false,
                        isDatacenter: ipData.hosting || false,
                        riskScore: (ipData.proxy ? 50 : 0) + (ipData.hosting ? 30 : 0)
                    }
                }
            } catch (e) {
                console.log('IP lookup failed:', e)
            }
        }

        // === VM DETECTION BLOCK ===
        // Block access from Virtual Machines
        if (fingerprint?.vmDetection?.isVM && fingerprint.vmDetection.confidence >= 50) {
            // Create notification for owner about VM access attempt
            await supabase.from('notifications').insert({
                user_id: file.owner_id,
                type: 'threat',
                title: `🖥️ VIRTUAL MACHINE ACCESS BLOCKED`,
                message: `A Virtual Machine (${fingerprint.vmDetection.vmType || 'Unknown VM'}) with ${fingerprint.vmDetection.confidence}% confidence attempted to access "${file.original_name}" from ${ipInfo?.city || 'Unknown'}, ${ipInfo?.country || 'Unknown'}`,
                file_id: fileId,
                metadata: {
                    vm_detection: fingerprint.vmDetection,
                    viewer_email: viewerEmail,
                    viewer_name: viewerName,
                    ip_address: ipAddress,
                    fingerprint: fingerprint
                },
                is_read: false
            })

            // Log this as a blocked threat
            await supabase.from('access_logs').insert({
                file_id: fileId,
                action: 'vm_blocked',
                timestamp: new Date().toISOString(),
                location: {
                    ip: ipAddress,
                    city: ipInfo?.city,
                    country: ipInfo?.country,
                    viewer_email: viewerEmail,
                    vm_type: fingerprint.vmDetection.vmType,
                    vm_confidence: fingerprint.vmDetection.confidence,
                    vm_reasons: fingerprint.vmDetection.reasons
                }
            })

            return NextResponse.json({
                error: 'Access denied. Virtual machines are not permitted to view protected files.',
                blocked: true,
                reason: 'VM_DETECTED'
            }, { status: 403 })
        }

        // === BLACKLIST CHECK ===
        // Check if this device/email is blacklisted by the file owner
        let blacklistMatch = null
        try {
            const baseUrl = getBaseUrl(request)
            const blacklistResponse = await fetch(`${baseUrl}/api/blacklist/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner_id: file.owner_id,
                    fingerprint: fingerprint,
                    viewer_email: viewerEmail
                })
            })
            const blacklistData = await blacklistResponse.json()

            if (blacklistData.blacklisted) {
                blacklistMatch = blacklistData

                // Create URGENT notification for owner
                await supabase.from('notifications').insert({
                    user_id: file.owner_id,
                    type: 'threat',
                    title: `🚨 BLACKLISTED DEVICE DETECTED`,
                    message: `A BLACKLISTED device matching ${blacklistData.matches[0]?.blocked_email || 'a blocked user'} (${blacklistData.risk_score}% match) just attempted to access "${file.original_name}" from ${ipInfo?.city || 'Unknown'}, ${ipInfo?.country || 'Unknown'}`,
                    file_id: fileId,
                    metadata: {
                        blacklist_match: blacklistData,
                        viewer_email: viewerEmail,
                        viewer_name: viewerName,
                        ip_address: ipAddress,
                        fingerprint: fingerprint,
                        risk_level: blacklistData.risk_level
                    },
                    is_read: false
                })

                // Log this as a blocked threat
                await supabase.from('access_logs').insert({
                    file_id: fileId,
                    action: 'blacklist_match',
                    timestamp: new Date().toISOString(),
                    location: {
                        ip: ipAddress,
                        city: ipInfo?.city,
                        country: ipInfo?.country,
                        viewer_email: viewerEmail,
                        risk_score: blacklistData.risk_score,
                        matches: blacklistData.matches
                    }
                })

                // If risk is CRITICAL (90%+), immediately deny access
                if (blacklistData.risk_level === 'CRITICAL') {
                    return NextResponse.json({
                        error: 'Access denied. You are not authorized to view this file.',
                        blocked: true,
                        risk_level: 'CRITICAL'
                    }, { status: 403 })
                }
            }
        } catch (e) {
            console.log('Blacklist check failed:', e)
        }

        // === LINK SHARING / LEAKER DETECTION ===
        // Check if this fingerprint is different from previous access by same email for same file
        try {
            if (fingerprint?.combinedHash) {
                // Check previous access requests from this email for this file
                const { data: previousAccess } = await supabase
                    .from('access_requests')
                    .select('fingerprint, viewer_name')
                    .eq('file_id', fileId)
                    .eq('viewer_email', viewerEmail.toLowerCase())
                    .eq('status', 'approved')
                    .order('created_at', { ascending: true })
                    .limit(1)

                if (previousAccess && previousAccess.length > 0) {
                    const originalFp = previousAccess[0].fingerprint
                    if (originalFp?.combinedHash && originalFp.combinedHash !== fingerprint.combinedHash) {
                        // Different device accessing with same email - potential link sharing!
                        const baseUrl = getBaseUrl(request)

                        // Record the suspected leak
                        await fetch(`${baseUrl}/api/leakers`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                original_recipient_email: viewerEmail,
                                original_recipient_name: previousAccess[0].viewer_name || viewerName,
                                original_fingerprint_hash: originalFp.combinedHash,
                                file_id: fileId,
                                file_name: file.original_name,
                                unauthorized_fingerprint_hash: fingerprint.combinedHash,
                                unauthorized_fingerprint: fingerprint,
                                unauthorized_ip: ipAddress,
                                unauthorized_ip_info: ipInfo,
                                unauthorized_location: ipInfo ? `${ipInfo.city}, ${ipInfo.country}` : null,
                                detection_type: 'fingerprint_mismatch',
                                owner_id: file.owner_id
                            })
                        })

                        console.log(`🚨 LEAK DETECTED: ${viewerEmail} accessed from different device`)
                    }
                }
            }
        } catch (e) {
            console.log('Leak detection check failed:', e)
        }

        // Check if extensions detected and should block
        if (fingerprint?.extensionsDetected) {
            // Could block here if desired
            // return NextResponse.json({ error: 'Browser extensions detected. Please disable extensions.' }, { status: 403 })
        }

        // Create access request record with full device info
        const { data: accessRequest, error: insertError } = await supabase
            .from('access_requests')
            .insert({
                file_id: fileId,
                viewer_email: viewerEmail.toLowerCase(),
                viewer_name: viewerName,
                ip_address: ipAddress,
                device_info: deviceInfo,
                user_agent: userAgent,
                fingerprint: fingerprint || null,
                ip_info: ipInfo,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('Access request insert error:', insertError)
            return NextResponse.json({ error: 'Failed to create access request' }, { status: 500 })
        }

        // Create notification for owner with full details
        const vpnWarning = ipInfo?.isVpn ? '⚠️ VPN DETECTED' : ''
        await supabase.from('notifications').insert({
            user_id: file.owner_id,
            type: 'access_request',
            title: `🔔 Access Request ${vpnWarning}`,
            message: `${viewerName} (${viewerEmail}) is requesting access to "${file.original_name}" from ${ipInfo?.city || 'Unknown'}, ${ipInfo?.country || 'Unknown'} (${ipAddress})`,
            file_id: fileId,
            metadata: {
                request_id: accessRequest.id,
                viewer_email: viewerEmail,
                viewer_name: viewerName,
                ip_address: ipAddress,
                device_info: deviceInfo,
                ip_info: ipInfo,
                fingerprint: fingerprint
            },
            is_read: false
        })

        // Send email notification to owner
        if (owner?.email) {
            try {
                await sendAccessRequestEmail({
                    to: owner.email,
                    ownerName: owner.full_name || 'User',
                    viewerName,
                    viewerEmail,
                    fileName: file.original_name,
                    ipAddress,
                    deviceInfo,
                    requestId: accessRequest.id,
                    ipInfo,
                    fingerprint
                })
            } catch (e) {
                console.log('Email notification failed:', e)
            }
        }

        return NextResponse.json({
            success: true,
            requestId: accessRequest.id,
            message: 'Access request sent. Waiting for owner approval.'
        })

    } catch (error) {
        console.error('Access request error:', error)
        return NextResponse.json({ error: 'Failed to request access' }, { status: 500 })
    }
}

// GET /api/access/request?requestId=xxx - Check access request status
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')

    if (!requestId) {
        return NextResponse.json({ error: 'Request ID required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    const { data: accessRequest, error } = await supabase
        .from('access_requests')
        .select('status, created_at, updated_at')
        .eq('id', requestId)
        .single()

    if (error || !accessRequest) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json({
        status: accessRequest.status,
        createdAt: accessRequest.created_at,
        updatedAt: accessRequest.updated_at
    })
}

function parseUserAgent(ua: string): string {
    if (ua.includes('iPhone')) return 'iPhone'
    if (ua.includes('iPad')) return 'iPad'
    if (ua.includes('Android')) return 'Android Device'
    if (ua.includes('Mac')) return 'Mac'
    if (ua.includes('Windows')) return 'Windows PC'
    if (ua.includes('Linux')) return 'Linux'
    return 'Unknown Device'
}

// Email template for access request
import { Resend } from 'resend'

async function sendAccessRequestEmail(params: {
    to: string
    ownerName: string
    viewerName: string
    viewerEmail: string
    fileName: string
    ipAddress: string
    deviceInfo: string
    requestId: string
    ipInfo?: any
    fingerprint?: any
}) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const vpnWarning = params.ipInfo?.isVpn ? '⚠️ VPN/PROXY DETECTED' : ''
    const location = params.ipInfo ? `${params.ipInfo.city}, ${params.ipInfo.country}` : 'Unknown'
    const browser = params.fingerprint?.browser || 'Unknown'
    const os = params.fingerprint?.os || params.deviceInfo

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Data Leash <noreply@dataleash.app>',
        to: [params.to],
        subject: `🔔 Access Request ${vpnWarning}: ${params.viewerName} wants to view "${params.fileName}"`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="550" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,153,255,0.1) 100%); border: 1px solid rgba(0,212,255,0.3); border-radius: 16px; padding: 40px;">
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <h1 style="margin: 0; font-size: 24px; color: #00d4ff;">🔔 Access Request</h1>
                            ${vpnWarning ? `<p style="color: #ef4444; font-weight: bold; margin-top: 8px;">${vpnWarning}</p>` : ''}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom: 24px;">
                            <p style="margin: 0; color: #ffffff; font-size: 16px;">Hi ${params.ownerName},</p>
                            <p style="margin: 16px 0; color: #cccccc; font-size: 14px;">
                                Someone is requesting access to your protected file:
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom: 24px;">
                            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(0,212,255,0.2); border-radius: 8px; padding: 16px;">
                                <table width="100%" style="border-collapse: collapse;">
                                    <tr><td style="color: #888; padding: 4px 0;">📄 File:</td><td style="color: #00d4ff; font-weight: bold;">${params.fileName}</td></tr>
                                    <tr><td style="color: #888; padding: 4px 0;">👤 Name:</td><td style="color: #fff;">${params.viewerName}</td></tr>
                                    <tr><td style="color: #888; padding: 4px 0;">📧 Email:</td><td style="color: #fff;">${params.viewerEmail}</td></tr>
                                    <tr><td style="color: #888; padding: 4px 0;">🌍 Location:</td><td style="color: #fff;">${location}</td></tr>
                                    <tr><td style="color: #888; padding: 4px 0;">🌐 IP:</td><td style="color: #fff;">${params.ipAddress}</td></tr>
                                    <tr><td style="color: #888; padding: 4px 0;">🏢 ISP:</td><td style="color: #fff;">${params.ipInfo?.isp || 'Unknown'}</td></tr>
                                    <tr><td style="color: #888; padding: 4px 0;">💻 Device:</td><td style="color: #fff;">${os}</td></tr>
                                    <tr><td style="color: #888; padding: 4px 0;">🔍 Browser:</td><td style="color: #fff;">${browser}</td></tr>
                                    <tr><td style="color: #888; padding: 4px 0;">🔒 VPN/Proxy:</td><td style="color: ${params.ipInfo?.isVpn ? '#ef4444' : '#22c55e'};">${params.ipInfo?.isVpn ? '⚠️ Detected' : '✓ Not Detected'}</td></tr>
                                    <tr><td style="color: #888; padding: 4px 0;">🧩 Extensions:</td><td style="color: ${params.fingerprint?.extensionsDetected ? '#f59e0b' : '#22c55e'};">${params.fingerprint?.extensionsDetected ? '⚠️ Detected' : '✓ None'}</td></tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom: 16px;">
                            <a href="${appUrl}/dashboard/requests?approve=${params.requestId}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%); color: #000; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin-right: 12px;">
                                ✓ Approve Access
                            </a>
                            <a href="${appUrl}/dashboard/requests?deny=${params.requestId}" style="display: inline-block; background: #ef4444; color: #fff; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
                                ✗ Deny Access
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="border-top: 1px solid rgba(0,212,255,0.2); padding-top: 16px;">
                            <p style="margin: 0; color: #666; font-size: 11px; text-align: center;">
                                If you don't recognize this request, deny it immediately.<br>
                                View full device details in your dashboard. Access expires in 24 hours.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    })
}

