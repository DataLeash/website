import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Resend } from 'resend'

// Lazy initialization for Resend
function getResendClient() {
    if (!process.env.RESEND_API_KEY) {
        return null
    }
    return new Resend(process.env.RESEND_API_KEY)
}

// Email function for file sharing
async function sendFileShareEmail(params: {
    to: string
    ownerName: string
    fileName: string
    shareLink: string
    expiresAt: string | null
    requiresOTP: boolean
    requiresPassword: boolean
}) {
    try {
        const resend = getResendClient()
        if (!resend) {
            console.log('Resend not configured, skipping email')
            return
        }

        const securityNotice = params.requiresOTP
            ? '<p style="margin: 12px 0 0 0; color: #f59e0b; font-size: 12px;">🔐 Email verification required to access</p>'
            : params.requiresPassword
                ? '<p style="margin: 12px 0 0 0; color: #f59e0b; font-size: 12px;">🔑 Password required to access</p>'
                : ''

        await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Data Leash <noreply@dataleash.app>',
            to: [params.to],
            subject: `🔐 ${params.ownerName} shared a protected file with you`,
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
                            <h1 style="margin: 0; font-size: 28px; color: #00d4ff;">🔐 Protected File Shared</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom: 24px;">
                            <p style="margin: 0; color: #ffffff; font-size: 16px;">Hello,</p>
                            <p style="margin: 16px 0; color: #cccccc; font-size: 14px;">
                                <strong style="color: #00d4ff;">${params.ownerName}</strong> has shared a protected file with you:
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom: 24px;">
                            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(0,212,255,0.2); border-radius: 8px; padding: 20px; text-align: center;">
                                <p style="margin: 0 0 8px 0; color: #888; font-size: 12px;">FILE NAME</p>
                                <p style="margin: 0; color: #00d4ff; font-size: 18px; font-weight: bold;">${params.fileName}</p>
                                ${params.expiresAt ? `<p style="margin: 12px 0 0 0; color: #f59e0b; font-size: 12px;">⏰ Expires: ${new Date(params.expiresAt).toLocaleDateString()}</p>` : ''}
                                ${securityNotice}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <a href="${params.shareLink}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%); color: #000; font-weight: bold; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                                View Protected File
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="border-top: 1px solid rgba(0,212,255,0.2); padding-top: 16px;">
                            <p style="margin: 0; color: #666; font-size: 11px; text-align: center;">
                                This file is protected by Data Leash with enterprise-grade encryption.<br>
                                The file owner will be notified when you access it.
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
    } catch (error) {
        console.error('Email send error:', error)
        throw error
    }
}

// Settings interface for type safety
interface FileSettings {
    // Protection Level
    lockdown_level: number
    trust_level: number

    // Expiration
    expires_at: string | null
    max_views: number | null

    // Access Control
    blocked_countries: string[]
    allowed_ips: string[]
    blocked_ips: string[]
    allowed_domains: string[]
    device_limit: number
    require_vpn_block: boolean

    // Viewer Verification
    require_nda: boolean
    require_facial: boolean
    require_email_otp: boolean
    require_phone_verify: boolean
    require_password: boolean
    file_password: string

    // Document Protection
    add_watermark: boolean
    watermark_text: string
    block_copy_paste: boolean
    block_printing: boolean
    block_download: boolean
    blur_on_inactive: boolean

    // Monitoring
    notify_on_view: boolean
    track_scroll_depth: boolean
    track_time_per_page: boolean
    alert_on_screenshot: boolean
    log_all_actions: boolean

    // Self-Destruct
    auto_kill_on_screenshot: boolean
    self_destruct_after_read: boolean
    destroy_on_forward: boolean
    destroy_on_leak_detected: boolean
    dead_man_switch: boolean
    dead_man_hours: number
}

// Hash password for storage
function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex')
}

// Calculate expiration date from string like "7d", "24h", etc.
function calculateExpirationDate(expiresAt: string | null): Date | null {
    if (!expiresAt) return null

    const now = new Date()
    const match = expiresAt.match(/^(\d+)(h|d)$/)
    if (!match) return null

    const value = parseInt(match[1])
    const unit = match[2]

    if (unit === 'h') {
        now.setHours(now.getHours() + value)
    } else if (unit === 'd') {
        now.setDate(now.getDate() + value)
    }

    return now
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check user's subscription tier and file limits
        const { data: userData } = await supabase
            .from('users')
            .select('tier, tier_expires_at')
            .eq('id', user.id)
            .single()

        const userTier = userData?.tier || 'free'
        const tierExpired = userData?.tier_expires_at && new Date(userData.tier_expires_at) < new Date()
        const effectiveTier = tierExpired ? 'free' : userTier

        // Get file count for free tier limit check
        if (effectiveTier === 'free') {
            const { count: fileCount } = await supabase
                .from('files')
                .select('id', { count: 'exact', head: true })
                .eq('owner_id', user.id)
                .eq('is_destroyed', false)

            const FREE_TIER_FILE_LIMIT = 5
            if ((fileCount || 0) >= FREE_TIER_FILE_LIMIT) {
                return NextResponse.json(
                    {
                        error: 'Free tier limit reached',
                        message: `You have reached the maximum of ${FREE_TIER_FILE_LIMIT} files on the free tier. Upgrade to Pro for unlimited files.`,
                        upgrade: true
                    },
                    { status: 403 }
                )
            }
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const settingsRaw = JSON.parse(formData.get('settings') as string || '{}')
        const recipients = JSON.parse(formData.get('recipients') as string || '[]')

        // Apply defaults for missing settings
        const settings: FileSettings = {
            lockdown_level: settingsRaw.lockdown_level ?? 1,
            trust_level: settingsRaw.trust_level ?? 1,
            expires_at: settingsRaw.expires_at ?? null,
            max_views: settingsRaw.max_views ?? null,
            blocked_countries: settingsRaw.blocked_countries ?? [],
            allowed_ips: settingsRaw.allowed_ips ?? [],
            blocked_ips: settingsRaw.blocked_ips ?? [],
            allowed_domains: settingsRaw.allowed_domains ?? [],
            device_limit: settingsRaw.device_limit ?? 3,
            require_vpn_block: settingsRaw.require_vpn_block ?? false,
            require_nda: settingsRaw.require_nda ?? false,
            require_facial: settingsRaw.require_facial ?? false,
            require_email_otp: settingsRaw.require_email_otp ?? false,
            require_phone_verify: settingsRaw.require_phone_verify ?? false,
            require_password: settingsRaw.require_password ?? false,
            file_password: settingsRaw.file_password ?? '',
            add_watermark: settingsRaw.add_watermark ?? true,
            watermark_text: settingsRaw.watermark_text ?? '',
            block_copy_paste: settingsRaw.block_copy_paste ?? true,
            block_printing: settingsRaw.block_printing ?? true,
            block_download: settingsRaw.block_download ?? true,
            blur_on_inactive: settingsRaw.blur_on_inactive ?? false,
            notify_on_view: settingsRaw.notify_on_view ?? true,
            track_scroll_depth: settingsRaw.track_scroll_depth ?? false,
            track_time_per_page: settingsRaw.track_time_per_page ?? false,
            alert_on_screenshot: settingsRaw.alert_on_screenshot ?? true,
            log_all_actions: settingsRaw.log_all_actions ?? true,
            auto_kill_on_screenshot: settingsRaw.auto_kill_on_screenshot ?? false,
            self_destruct_after_read: settingsRaw.self_destruct_after_read ?? false,
            destroy_on_forward: settingsRaw.destroy_on_forward ?? false,
            destroy_on_leak_detected: settingsRaw.destroy_on_leak_detected ?? true,
            dead_man_switch: settingsRaw.dead_man_switch ?? false,
            dead_man_hours: settingsRaw.dead_man_hours ?? 72,
        }

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Read file and create hash
        const fileBuffer = await file.arrayBuffer()
        const fileHash = crypto.createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex')

        // Generate encryption key (will be split using Shamir's Secret Sharing)
        const encryptionKey = crypto.randomBytes(32).toString('hex')
        const keyId = crypto.randomUUID()

        // Encrypt file content
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), iv)
        const encryptedContent = Buffer.concat([
            cipher.update(Buffer.from(fileBuffer)),
            cipher.final(),
        ])
        const authTag = cipher.getAuthTag()

        // Store encrypted file in Supabase Storage
        const encryptedFileName = `${keyId}.dlx`
        const { error: storageError } = await supabase.storage
            .from('protected-files')
            .upload(`${user.id}/${encryptedFileName}`, encryptedContent, {
                contentType: 'application/octet-stream',
                upsert: false,
            })

        if (storageError) {
            return NextResponse.json(
                { error: `Storage error: ${storageError.message}` },
                { status: 500 }
            )
        }

        // Calculate actual expiration date if string format (e.g. "7d")
        const expirationDate = calculateExpirationDate(settings.expires_at)

        // Hash file password if provided
        const passwordHash = settings.require_password && settings.file_password
            ? hashPassword(settings.file_password)
            : null

        // Prepare settings for storage (remove plain password)
        const storedSettings = {
            ...settings,
            file_password: undefined, // Don't store plain password
            password_hash: passwordHash,
            expires_at_date: expirationDate?.toISOString() || null,
        }

        // Create file record
        const { data: fileRecord, error: fileError } = await supabase
            .from('files')
            .insert({
                owner_id: user.id,
                original_name: file.name,
                file_hash: fileHash,
                file_size: file.size,
                mime_type: file.type,
                encryption_key_id: keyId,
                settings: storedSettings,
                iv: iv.toString('hex'),
                auth_tag: authTag.toString('hex'),
                storage_path: `${user.id}/${encryptedFileName}`,
            })
            .select()
            .single()

        if (fileError) {
            return NextResponse.json(
                { error: fileError.message },
                { status: 500 }
            )
        }

        // Create key shards (4-part split)
        const shards = splitKey(encryptionKey, 4, 4)

        for (let i = 0; i < shards.length; i++) {
            await supabase.from('key_shards').insert({
                file_id: fileRecord.id,
                shard_index: i + 1,
                shard_data: shards[i],
                expires_at: expirationDate?.toISOString() || null,
                is_destroyed: false,
            })
        }

        // Get owner info for emails
        const { data: ownerData } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

        const ownerName = ownerData?.full_name || 'A Data Leash user'
        const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/view/${fileRecord.id}`

        // Create permissions for recipients and send emails
        for (const recipientEmail of recipients) {
            // Check if recipient's email domain is allowed
            if (settings.allowed_domains.length > 0) {
                const recipientDomain = recipientEmail.split('@')[1]
                if (!settings.allowed_domains.includes(recipientDomain)) {
                    console.log(`Skipping recipient ${recipientEmail} - domain not allowed`)
                    continue
                }
            }

            // Find user by email or create invite
            const { data: recipientUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', recipientEmail)
                .single()

            if (recipientUser) {
                await supabase.from('permissions').insert({
                    file_id: fileRecord.id,
                    user_id: recipientUser.id,
                    trust_level: settings.trust_level,
                    expires_at: expirationDate?.toISOString() || null,
                    nda_signed: false,
                    can_comment: true,
                    can_sign: false,
                    device_count: 0,
                })

                // Create notification for recipient
                await supabase.from('notifications').insert({
                    user_id: recipientUser.id,
                    type: 'access_request',
                    title: 'New Protected File Shared',
                    message: `You have been granted access to "${file.name}"`,
                    file_id: fileRecord.id,
                    is_read: false,
                })
            }

            // Send email notification to recipient
            try {
                await sendFileShareEmail({
                    to: recipientEmail,
                    ownerName,
                    fileName: file.name,
                    shareLink,
                    expiresAt: expirationDate?.toISOString() || null,
                    requiresOTP: settings.require_email_otp,
                    requiresPassword: settings.require_password,
                })
            } catch (emailError) {
                console.error('Failed to send email to', recipientEmail, emailError)
            }
        }

        // Log the upload activity
        await supabase.from('access_logs').insert({
            file_id: fileRecord.id,
            action: 'upload',
            location: {
                owner_email: ownerData?.email,
                file_name: file.name,
                settings_summary: {
                    lockdown_level: settings.lockdown_level,
                    blocked_countries: settings.blocked_countries.length,
                    require_otp: settings.require_email_otp,
                    watermarked: settings.add_watermark,
                },
            },
            fingerprint: {},
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        })

        // Create owner notification
        await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'file_protected',
            title: 'File Protected Successfully',
            message: `"${file.name}" is now protected with ${recipients.length} recipient(s)`,
            file_id: fileRecord.id,
            is_read: false,
        })

        return NextResponse.json({
            message: 'File protected successfully',
            file: {
                id: fileRecord.id,
                name: file.name,
                size: file.size,
                settings: {
                    lockdown_level: settings.lockdown_level,
                    blocked_countries: settings.blocked_countries.length,
                    require_otp: settings.require_email_otp,
                    require_password: settings.require_password,
                    watermarked: settings.add_watermark,
                    expires_at: expirationDate?.toISOString() || null,
                    max_views: settings.max_views,
                },
            },
            share_link: shareLink,
            recipients_count: recipients.length,
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Simple key splitting (in production, use proper Shamir's Secret Sharing)
function splitKey(key: string, parts: number, threshold: number): string[] {
    const shards: string[] = []
    const keyBuffer = Buffer.from(key, 'hex')

    for (let i = 0; i < parts; i++) {
        const shard = crypto.randomBytes(32)
        // XOR with key for the last shard to make it reconstructable
        if (i === parts - 1) {
            let combined = keyBuffer
            for (const prevShard of shards) {
                combined = Buffer.from(combined.map((b, idx) => b ^ Buffer.from(prevShard, 'hex')[idx]))
            }
            shards.push(combined.toString('hex'))
        } else {
            shards.push(shard.toString('hex'))
        }
    }

    return shards
}
