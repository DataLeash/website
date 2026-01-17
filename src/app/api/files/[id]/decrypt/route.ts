import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function getSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex')
}

async function getIPInfo(ip: string) {
    if (!ip || ip === '::1' || ip === '127.0.0.1') return { city: 'Localhost', country: 'Development' }
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country,countryCode,isp`, { signal: AbortSignal.timeout(3000) })
        const data = await res.json()
        return data.status === 'success' ? data : { city: 'Unknown', country: 'Unknown' }
    } catch { return { city: 'Unknown', country: 'Unknown' } }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Handle password validation
    return commonDecrypt(req, await params, true)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Handle normal viewing
    return commonDecrypt(req, await params, false)
}

async function commonDecrypt(request: NextRequest, { id: fileId }: { id: string }, isPasswordCheck: boolean) {
    try {
        const supabase = getSupabaseClient()
        let viewerEmail = request.headers.get('x-viewer-email')?.toLowerCase()
        let passwordAttempt = ''

        if (isPasswordCheck) {
            const body = await request.json()
            passwordAttempt = body.password
            viewerEmail = body.viewerEmail?.toLowerCase()
        }

        // Get file data
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single()

        if (fileError || !file) return NextResponse.json({ error: 'File not found' }, { status: 404 })
        if (file.is_destroyed) return NextResponse.json({ error: 'File destroyed' }, { status: 410 })

        const settings = file.settings || {}

        // 1. Check Expiry
        if (settings.expires_at_date && new Date(settings.expires_at_date) < new Date()) {
            return NextResponse.json({ error: 'Link expired' }, { status: 410 })
        }

        // 2. Check Password
        if (settings.require_password) {
            if (!isPasswordCheck) {
                // GET request on password file -> unauthorized
                return NextResponse.json({ error: 'Password required' }, { status: 401 })
            }
            if (hashPassword(passwordAttempt) !== settings.password_hash) {
                return NextResponse.json({ error: 'Incorrect password' }, { status: 403 })
            }
        }

        // 3. Check Access Permission (if no password and not public)
        else if (!isPasswordCheck) {
            // Check allowed recipients
            const allowedRecipients = settings.allowed_recipients || []

            if (allowedRecipients.includes(viewerEmail)) {
                // Auto-allowed
            } else {
                // Must have approved access request
                const { data: access } = await supabase
                    .from('access_requests')
                    .select('id')
                    .eq('file_id', fileId)
                    .eq('viewer_email', viewerEmail)
                    .eq('status', 'approved')
                    .limit(1)

                if (!access?.length) {
                    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
                }
            }
        }

        // --- DECRYPTION ---

        // Get shards
        const { data: shards } = await supabase
            .from('key_shards')
            .select('shard_data')
            .eq('file_id', fileId)
            .order('shard_index')

        if (!shards || shards.length < 4) return NextResponse.json({ error: 'Keys missing' }, { status: 500 })

        // Reconstruct key
        let keyBuffer = Buffer.from(shards[0].shard_data, 'hex')
        for (let i = 1; i < shards.length; i++) {
            const shard = Buffer.from(shards[i].shard_data, 'hex')
            keyBuffer = Buffer.from(keyBuffer.map((b, idx) => b ^ shard[idx]))
        }
        const encryptionKey = keyBuffer.toString('hex')

        // Download & Decrypt
        const { data: encryptedData } = await supabase.storage.from('protected-files').download(file.storage_path)
        if (!encryptedData) return NextResponse.json({ error: 'Download failed' }, { status: 500 })

        const encryptedBuffer = Buffer.from(await encryptedData.arrayBuffer())
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), Buffer.from(file.iv, 'hex'))
        decipher.setAuthTag(Buffer.from(file.auth_tag, 'hex'))
        const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()])

        // Log View
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '::1'
        const ipInfo = await getIPInfo(ip)
        await supabase.from('access_logs').insert({
            file_id: fileId,
            action: 'view',
            ip_address: ip,
            location: { ...ipInfo, viewer_email: viewerEmail },
            timestamp: new Date().toISOString()
        })

        // Increment view count
        const newViews = (settings.total_views || 0) + 1
        await supabase.from('files').update({
            settings: { ...settings, total_views: newViews }
        }).eq('id', fileId)

        if (settings.max_views && newViews >= settings.max_views) {
            // Auto destroy if limit reached? Or just disable?
            // For now just note it. Could add logic to block future views.
        }

        return new NextResponse(decrypted, {
            headers: {
                'Content-Type': file.mime_type,
                'Content-Disposition': `inline; filename="${file.original_name}"`,
                'Cache-Control': 'no-store'
            }
        })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Decryption failed' }, { status: 500 })
    }
}
