import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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
        console.log(`[DECRYPT] Start for file: ${fileId}, PasswordCheck: ${isPasswordCheck}`)

        // Use ADMIN client to bypass RLS for fetching keys/checking permissions
        const supabase = createAdminClient()

        let viewerEmail = request.headers.get('x-viewer-email')?.toLowerCase()
        let passwordAttempt = ''

        console.log(`[DECRYPT] Viewer Email Header: ${viewerEmail}`)

        if (isPasswordCheck) {
            const body = await request.json()
            passwordAttempt = body.password
            viewerEmail = body.viewerEmail?.toLowerCase()
            console.log(`[DECRYPT] Password check body email: ${viewerEmail}`)
        }

        // Get file data
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single()

        if (fileError || !file) {
            console.error('[DECRYPT] File fetch error:', fileError)
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }
        if (file.is_destroyed) {
            console.warn('[DECRYPT] File is destroyed')
            return NextResponse.json({ error: 'File destroyed' }, { status: 410 })
        }

        const settings = file.settings || {}

        // 1. Check Expiry
        if (settings.expires_at_date && new Date(settings.expires_at_date) < new Date()) {
            console.warn('[DECRYPT] File expired')
            return NextResponse.json({ error: 'Link expired' }, { status: 410 })
        }

        // 2. Check Password
        if (settings.require_password) {
            if (!isPasswordCheck) {
                console.log('[DECRYPT] Password required, but not provided in GET')
                return NextResponse.json({ error: 'Password required' }, { status: 401 })
            }
            if (hashPassword(passwordAttempt) !== settings.password_hash) {
                console.warn('[DECRYPT] Incorrect password attempt')
                return NextResponse.json({ error: 'Incorrect password' }, { status: 403 })
            }
        }

        // 3. Check Access Permission (if no password and not public)
        else if (!isPasswordCheck) {
            console.log('[DECRYPT] Checking permissions for email:', viewerEmail)

            // Require viewerEmail for non-password-protected files
            if (!viewerEmail) {
                console.error('[DECRYPT] No viewer email provided')
                return NextResponse.json({ error: 'Viewer email required' }, { status: 400 })
            }

            // Check Owner
            const { data: user } = await supabase.from('users').select('id').ilike('email', viewerEmail).single()
            const isOwner = user && user.id === file.owner_id

            // Check allowed recipients (case-insensitive)
            const allowedRecipients = (settings.allowed_recipients || []).map((r: string) => r.toLowerCase())
            const viewerEmailLower = viewerEmail.toLowerCase()

            if (isOwner) {
                console.log('[DECRYPT] Viewer is OWNER - access granted')
            } else if (allowedRecipients.includes(viewerEmailLower)) {
                console.log('[DECRYPT] Viewer is in allowed_recipients')
            } else {
                // Check 'access_requests' for approved request (case-insensitive)
                const { data: requestAccess } = await supabase
                    .from('access_requests')
                    .select('id')
                    .eq('file_id', fileId)
                    .ilike('viewer_email', viewerEmailLower)
                    .eq('status', 'approved')
                    .limit(1)

                if (requestAccess?.length) {
                    console.log('[DECRYPT] Found approved access request')
                } else {
                    // Check 'permissions' table
                    let hasPermission = false
                    if (user) {
                        const { data: perm } = await supabase
                            .from('permissions')
                            .select('id')
                            .eq('file_id', fileId)
                            .eq('user_id', user.id)
                            .maybeSingle()
                        if (perm) hasPermission = true
                    }

                    if (!hasPermission) {
                        console.error(`[DECRYPT] Access denied for ${viewerEmail} - no approved request or permission found`)
                        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
                    }
                    console.log('[DECRYPT] Found permission entry')
                }
            }
        }

        // --- DECRYPTION (STREAMING) ---
        console.log('[DECRYPT] Permission granted. Starting streaming decryption...')

        // Get shards
        const { data: shards, error: shardsError } = await supabase
            .from('key_shards')
            .select('shard_data')
            .eq('file_id', fileId)
            .order('shard_index')

        if (shardsError) {
            console.error('[DECRYPT] Error fetching shards:', shardsError)
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
        }

        if (!shards || shards.length < 4) {
            console.error(`[DECRYPT] Missing shards. Found: ${shards?.length}`)
            return NextResponse.json({ error: 'Keys missing' }, { status: 500 })
        }

        // Reconstruct key
        let keyBuffer = Buffer.from(shards[0].shard_data, 'hex')
        for (let i = 1; i < shards.length; i++) {
            const shard = Buffer.from(shards[i].shard_data, 'hex')
            keyBuffer = Buffer.from(keyBuffer.map((b, idx) => b ^ shard[idx]))
        }
        const encryptionKey = keyBuffer.toString('hex')

        // Generate Signed URL for streaming (bypasses memory limit of download())
        const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from('protected-files')
            .createSignedUrl(file.storage_path, 60) // 60 seconds validity

        if (signedUrlError || !signedUrlData?.signedUrl) {
            console.error('[DECRYPT] Storage signed URL error:', signedUrlError)
            return NextResponse.json({ error: 'Download failed' }, { status: 500 })
        }

        // Fetch the file stream
        const storageResponse = await fetch(signedUrlData.signedUrl)
        if (!storageResponse.ok || !storageResponse.body) {
            console.error('[DECRYPT] Storage fetch failed:', storageResponse.status)
            return NextResponse.json({ error: 'Storage Unavailable' }, { status: 502 })
        }

        // Create Decipher Stream
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), Buffer.from(file.iv, 'hex'))
        decipher.setAuthTag(Buffer.from(file.auth_tag, 'hex'))

        // Prepare the stream pipeline: Storage -> Decipher -> Client
        // We need to convert the Web Stream (fetch) to Node Stream (crypto) and back to Web Stream (NextResponse)

        // @ts-ignore - Readable.fromWeb is available in newer Node envs
        const nodeReadable = import('stream').then(s => s.Readable.fromWeb(storageResponse.body as any))

        // Log View (Async - don't await/block stream)
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '::1'
        getIPInfo(ip).then(async (ipInfo) => {
            // Use admin client for logging
            await supabase.from('access_logs').insert({
                file_id: fileId,
                action: 'view',
                ip_address: ip,
                location: { ...ipInfo, viewer_email: viewerEmail },
                timestamp: new Date().toISOString()
            })
            // Increment view count
            const newViews = (settings.total_views || 0) + 1
            await supabase.from('files').update({ settings: { ...settings, total_views: newViews } }).eq('id', fileId)
        }).catch(err => console.error('Log error:', err))

        // Create a TransformStream to bridge Node stream to Web Stream
        // Simple manual implementation or use response iterator

        const iterator = async function* () {
            const stream = (await nodeReadable).pipe(decipher)
            for await (const chunk of stream) {
                yield chunk
            }
        }

        // Create iterator instance ONCE, then call .next() on same instance
        const gen = iterator();

        const readableStream = new ReadableStream({
            async pull(controller) {
                try {
                    const { value, done } = await gen.next()
                    if (done) {
                        controller.close()
                    } else {
                        controller.enqueue(value)
                    }
                } catch (err) {
                    controller.error(err)
                }
            }
        });

        // Simpler approach that usually works in Next.js App Router:
        // Pass the iterator directly to NextResponse (Next.js handles it)
        // OR pass the node stream directly (Next.js usually handles Stream)

        // Let's use the iterator approach which is safest standards-wise
        // Actually, we can just use the generator

        return new NextResponse(iterator() as any, {
            headers: {
                'Content-Type': file.mime_type,
                'Content-Disposition': `inline; filename="${file.original_name}"`,
                'Cache-Control': 'no-store'
            }
        })

    } catch (e: any) {
        console.error('[DECRYPT] CRITICAL EXCEPTION:', e)
        return NextResponse.json({ error: 'Decryption failed: ' + e.message }, { status: 500 })
    }
}
