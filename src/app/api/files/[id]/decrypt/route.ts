import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Use direct client without RLS for public file viewing
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

// Get IP info for logging
async function getIPInfo(ip: string): Promise<any> {
    if (!ip || ip === '::1' || ip === '127.0.0.1') {
        return { city: 'Localhost', country: 'Development', countryCode: 'XX' }
    }
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country,countryCode,lat,lon,isp`, {
            signal: AbortSignal.timeout(3000)
        })
        const data = await res.json()
        if (data.status === 'success') {
            return data
        }
    } catch { }
    return { city: 'Unknown', country: 'Unknown', countryCode: 'XX' }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = getSupabaseClient()
        const { id: fileId } = await params

        // Get client IP
        const forwardedFor = request.headers.get('x-forwarded-for')
        const realIp = request.headers.get('x-real-ip')
        const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || '::1'
        const userAgent = request.headers.get('user-agent') || ''

        console.log('Decrypting file:', fileId, 'IP:', clientIp)

        // Get file record
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single()

        console.log('File query result:', { file: file?.id, error: fileError?.message })

        if (fileError || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        if (file.is_destroyed) {
            return NextResponse.json({ error: 'File has been destroyed' }, { status: 410 })
        }

        // Check expiry
        if (file.settings?.expires_at && new Date(file.settings.expires_at) < new Date()) {
            return NextResponse.json({ error: 'File link has expired' }, { status: 410 })
        }

        // Get key shards
        const { data: shards, error: shardsError } = await supabase
            .from('key_shards')
            .select('shard_index, shard_data')
            .eq('file_id', fileId)
            .eq('is_destroyed', false)
            .order('shard_index')

        console.log('Shards query result:', { count: shards?.length, error: shardsError?.message })

        if (shardsError || !shards || shards.length < 4) {
            return NextResponse.json({ error: 'Decryption keys unavailable' }, { status: 403 })
        }

        // Reconstruct encryption key from shards (XOR method)
        const reconstructKey = (shards: { shard_data: string }[]): string => {
            let key = Buffer.from(shards[0].shard_data, 'hex')
            for (let i = 1; i < shards.length; i++) {
                const shard = Buffer.from(shards[i].shard_data, 'hex')
                key = Buffer.from(key.map((b, idx) => b ^ shard[idx]))
            }
            return key.toString('hex')
        }

        const encryptionKey = reconstructKey(shards)

        // Download encrypted file from storage
        console.log('Downloading from storage:', file.storage_path)
        const { data: encryptedData, error: downloadError } = await supabase.storage
            .from('protected-files')
            .download(file.storage_path)

        if (downloadError || !encryptedData) {
            console.error('Download error:', downloadError)
            return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
        }

        // Decrypt file
        const encryptedBuffer = Buffer.from(await encryptedData.arrayBuffer())
        const iv = Buffer.from(file.iv, 'hex')
        const authTag = Buffer.from(file.auth_tag, 'hex')

        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(encryptionKey, 'hex'),
            iv
        )
        decipher.setAuthTag(authTag)

        const decrypted = Buffer.concat([
            decipher.update(encryptedBuffer),
            decipher.final()
        ])

        // Get IP info for logging
        const ipInfo = await getIPInfo(clientIp)

        // Log the view with full info
        await supabase.from('access_logs').insert({
            file_id: fileId,
            action: 'view',
            ip_address: clientIp,
            location: {
                city: ipInfo.city || 'Unknown',
                country: ipInfo.country || 'Unknown',
                countryCode: ipInfo.countryCode || 'XX',
                lat: ipInfo.lat || 0,
                lon: ipInfo.lon || 0,
                isp: ipInfo.isp || 'Unknown',
                userAgent: userAgent.substring(0, 200)
            },
            timestamp: new Date().toISOString()
        })

        // Increment view count on file (using settings JSONB or a separate call)
        const currentViews = file.settings?.total_views || 0
        await supabase
            .from('files')
            .update({
                settings: {
                    ...file.settings,
                    total_views: currentViews + 1,
                    last_viewed: new Date().toISOString()
                }
            })
            .eq('id', fileId)

        console.log('View logged successfully for file:', fileId)

        // Return decrypted file
        return new NextResponse(decrypted, {
            headers: {
                'Content-Type': file.mime_type || 'application/octet-stream',
                'Content-Disposition': `inline; filename="${file.original_name}"`,
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'X-Content-Type-Options': 'nosniff',
            }
        })

    } catch (error) {
        console.error('Decrypt error:', error)
        return NextResponse.json({ error: 'Decryption failed' }, { status: 500 })
    }
}
