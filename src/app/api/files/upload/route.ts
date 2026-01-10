import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Email function for file sharing
async function sendFileShareEmail(params: {
    to: string
    ownerName: string
    fileName: string
    shareLink: string
    expiresAt: string | null
}) {
    try {
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
                                This file is protected by Data Leash. You'll need to verify your identity to view it.<br>
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

        const formData = await request.formData()
        const file = formData.get('file') as File
        const settings = JSON.parse(formData.get('settings') as string || '{}')
        const recipients = JSON.parse(formData.get('recipients') as string || '[]')

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
                settings: {
                    lockdown_level: settings.lockdown_level || 1,
                    trust_level: settings.trust_level || 1,
                    expires_at: settings.expires_at || null,
                    max_views: settings.max_views || null,
                    require_nda: settings.require_nda || false,
                    require_facial: settings.require_facial || false,
                    allow_comments: settings.allow_comments || true,
                    notify_on_view: settings.notify_on_view || true,
                    auto_kill_on_screenshot: settings.auto_kill_on_screenshot || false,
                },
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
        // Shard 1: Server-side (stored in DB)
        // Shard 2: Would be in device TPM (simulated for web)
        // Shard 3: User's password derivative
        // Shard 4: Session token
        const shards = splitKey(encryptionKey, 4, 4) // All 4 required

        for (let i = 0; i < shards.length; i++) {
            await supabase.from('key_shards').insert({
                file_id: fileRecord.id,
                shard_index: i + 1,
                shard_data: shards[i],
                expires_at: settings.expires_at || null,
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
                    trust_level: settings.trust_level || 1,
                    expires_at: settings.expires_at || null,
                    nda_signed: false,
                    can_comment: settings.allow_comments || false,
                    can_sign: false,
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

            // Send email notification to recipient (regardless of whether they have an account)
            try {
                await sendFileShareEmail({
                    to: recipientEmail,
                    ownerName,
                    fileName: file.name,
                    shareLink,
                    expiresAt: settings.expires_at || null,
                })
            } catch (emailError) {
                console.error('Failed to send email to', recipientEmail, emailError)
            }
        }

        return NextResponse.json({
            message: 'File protected successfully',
            file: fileRecord,
            share_link: shareLink,
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
