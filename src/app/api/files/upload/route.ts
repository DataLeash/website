import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Resend } from 'resend'

// Lazy init Resend
function getResendClient() {
    return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
}

// Simplified settings interface
interface FileSettings {
    expires_at: string | null
    max_views: number | null
    require_password: boolean
    file_password: string
    add_watermark: boolean
    block_copy_paste: boolean
    block_printing: boolean
    block_download: boolean
    notify_on_view: boolean
    blocked_countries: string[]
}

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex')
}

function calculateExpirationDate(expiresAt: string | null): Date | null {
    if (!expiresAt) return null
    const now = new Date()
    const match = expiresAt.match(/^(\d+)(h|d)$/)
    if (!match) return null

    const value = parseInt(match[1])
    const unit = match[2]
    if (unit === 'h') now.setHours(now.getHours() + value)
    else if (unit === 'd') now.setDate(now.getDate() + value)
    return now
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check tier limits
        const { data: userData } = await supabase
            .from('users')
            .select('tier, tier_expires_at')
            .eq('id', user.id)
            .single()

        const userTier = userData?.tier || 'free'
        const tierExpired = userData?.tier_expires_at && new Date(userData.tier_expires_at) < new Date()
        const effectiveTier = tierExpired ? 'free' : userTier

        if (effectiveTier === 'free') {
            const { count: fileCount } = await supabase
                .from('files')
                .select('id', { count: 'exact', head: true })
                .eq('owner_id', user.id)
                .eq('is_destroyed', false)

            if ((fileCount || 0) >= 2) {
                return NextResponse.json({
                    error: 'Free tier limit reached (2 files). Upgrade to Pro for unlimited.',
                    upgrade: true
                }, { status: 403 })
            }
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const settingsRaw = JSON.parse(formData.get('settings') as string || '{}')
        const recipients = JSON.parse(formData.get('recipients') as string || '[]')

        // Apply defaults
        const settings: FileSettings = {
            expires_at: settingsRaw.expires_at ?? null,
            max_views: settingsRaw.max_views ?? null,
            require_password: settingsRaw.require_password ?? false,
            file_password: settingsRaw.file_password ?? '',
            add_watermark: settingsRaw.add_watermark ?? true,
            block_copy_paste: settingsRaw.block_copy_paste ?? true,
            block_printing: settingsRaw.block_printing ?? true,
            block_download: settingsRaw.block_download ?? true,
            notify_on_view: settingsRaw.notify_on_view ?? true,
            blocked_countries: settingsRaw.blocked_countries ?? [],
        }

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Encrypt file
        const fileBuffer = await file.arrayBuffer()
        const fileHash = crypto.createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex')
        const encryptionKey = crypto.randomBytes(32).toString('hex')
        const keyId = crypto.randomUUID()
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), iv)
        const encryptedContent = Buffer.concat([cipher.update(Buffer.from(fileBuffer)), cipher.final()])
        const authTag = cipher.getAuthTag()

        // Store encrypted file
        const encryptedFileName = `${keyId}.dlx`
        const { error: storageError } = await supabase.storage
            .from('protected-files')
            .upload(`${user.id}/${encryptedFileName}`, encryptedContent, {
                contentType: 'application/octet-stream',
                upsert: false,
            })

        if (storageError) {
            return NextResponse.json({ error: `Storage error: ${storageError.message}` }, { status: 500 })
        }

        const expirationDate = calculateExpirationDate(settings.expires_at)
        const passwordHash = settings.require_password && settings.file_password
            ? hashPassword(settings.file_password)
            : null

        // Store settings (without plain password)
        const storedSettings = {
            ...settings,
            file_password: undefined,
            password_hash: passwordHash,
            expires_at_date: expirationDate?.toISOString() || null,
            // Store recipients for auto-approve
            allowed_recipients: recipients.map((e: string) => e.toLowerCase()),
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
            return NextResponse.json({ error: fileError.message }, { status: 500 })
        }

        // Store encryption key shards using ADMIN client (RLS only allows service_role)
        const adminClient = createAdminClient()
        const shards = splitKey(encryptionKey, 4)
        for (let i = 0; i < shards.length; i++) {
            const { error: shardError } = await adminClient.from('key_shards').insert({
                file_id: fileRecord.id,
                shard_index: i + 1,
                shard_data: shards[i],
                expires_at: expirationDate?.toISOString() || null,
                is_destroyed: false,
            })
            if (shardError) {
                console.error(`[UPLOAD] Failed to insert shard ${i + 1}:`, shardError)
                // Clean up: delete the file record and storage
                await supabase.from('files').delete().eq('id', fileRecord.id)
                await supabase.storage.from('protected-files').remove([`${user.id}/${encryptedFileName}`])
                return NextResponse.json({ error: 'Failed to store encryption keys' }, { status: 500 })
            }
        }
        console.log(`[UPLOAD] Successfully stored ${shards.length} key shards for file ${fileRecord.id}`)

        // Get owner info
        const { data: ownerData } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

        const ownerName = ownerData?.full_name || 'A DataLeash user'
        const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/view/${fileRecord.id}`

        // Create permissions for recipients and send emails
        for (const recipientEmail of recipients) {
            const email = recipientEmail.toLowerCase()

            // Find or note recipient
            const { data: recipientUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single()

            if (recipientUser) {
                await supabase.from('permissions').insert({
                    file_id: fileRecord.id,
                    user_id: recipientUser.id,
                    trust_level: 1,
                    expires_at: expirationDate?.toISOString() || null,
                    nda_signed: false,
                    can_comment: true,
                    can_sign: false,
                    device_count: 0,
                })

                await supabase.from('notifications').insert({
                    user_id: recipientUser.id,
                    type: 'file_shared',
                    title: 'File Shared With You',
                    message: `${ownerName} shared "${file.name}" with you`,
                    file_id: fileRecord.id,
                    is_read: false,
                })
            }

            // Send email
            try {
                await sendFileShareEmail({
                    to: email,
                    ownerName,
                    fileName: file.name,
                    shareLink,
                    expiresAt: expirationDate?.toISOString() || null,
                    requiresPassword: settings.require_password,
                })
            } catch (e) {
                console.error('Email failed for', email, e)
            }
        }

        // Log upload
        await supabase.from('access_logs').insert({
            file_id: fileRecord.id,
            action: 'upload',
            location: { owner_email: ownerData?.email, file_name: file.name },
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        })

        // Notify owner
        await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'file_protected',
            title: 'File Protected',
            message: `"${file.name}" is protected with ${recipients.length} recipient(s)`,
            file_id: fileRecord.id,
            is_read: false,
        })

        return NextResponse.json({
            message: 'File protected successfully',
            file: { id: fileRecord.id, name: file.name, size: file.size },
            share_link: shareLink,
            recipients_count: recipients.length,
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Simple XOR-based key splitting
function splitKey(key: string, parts: number): string[] {
    const shards: string[] = []
    const keyBuffer = Buffer.from(key, 'hex')

    for (let i = 0; i < parts; i++) {
        const shard = crypto.randomBytes(32)
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

// Email sender
async function sendFileShareEmail(params: {
    to: string
    ownerName: string
    fileName: string
    shareLink: string
    expiresAt: string | null
    requiresPassword: boolean
}) {
    const resend = getResendClient()
    if (!resend) return

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'DataLeash <noreply@dataleash.app>',
        to: [params.to],
        subject: `🔐 ${params.ownerName} shared a protected file with you`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="500" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(59,130,246,0.1),rgba(14,165,233,0.1));border:1px solid rgba(59,130,246,0.3);border-radius:16px;padding:32px;">
<tr><td align="center" style="padding-bottom:20px;">
<h1 style="margin:0;font-size:24px;color:#3b82f6;">🔐 Protected File Shared</h1>
</td></tr>
<tr><td style="padding-bottom:20px;">
<p style="margin:0;color:#fff;font-size:16px;">Hi,</p>
<p style="margin:12px 0;color:#ccc;font-size:14px;">
<strong style="color:#3b82f6;">${params.ownerName}</strong> has shared a protected file with you:
</p>
</td></tr>
<tr><td style="padding-bottom:20px;">
<div style="background:rgba(0,0,0,0.3);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:16px;text-align:center;">
<p style="margin:0 0 4px;color:#666;font-size:12px;">FILE</p>
<p style="margin:0;color:#3b82f6;font-size:18px;font-weight:bold;">${params.fileName}</p>
${params.expiresAt ? `<p style="margin:8px 0 0;color:#f59e0b;font-size:12px;">⏰ Expires: ${new Date(params.expiresAt).toLocaleDateString()}</p>` : ''}
${params.requiresPassword ? `<p style="margin:8px 0 0;color:#f59e0b;font-size:12px;">🔑 Password required</p>` : ''}
</div>
</td></tr>
<tr><td align="center" style="padding-bottom:16px;">
<a href="${params.shareLink}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#0ea5e9);color:#fff;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;">
View File
</a>
</td></tr>
<tr><td style="border-top:1px solid rgba(59,130,246,0.2);padding-top:12px;">
<p style="margin:0;color:#666;font-size:11px;text-align:center;">
Protected by DataLeash • The owner will be notified when you view
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
        `
    })
}
