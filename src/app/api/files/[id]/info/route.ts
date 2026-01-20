import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Use service role to bypass RLS for public file viewing
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

// Fallback: Generate anonymous ID if not in database
function generateAnonymousIdFallback(ownerId: string): string {
    const hash = crypto.createHash('sha256').update(ownerId + 'dataleash_salt').digest('hex')
    return `DL-${hash.substring(0, 6).toUpperCase()}`
}

// Helper to get country from IP - uses Vercel header first (fast), then external API fallback
async function getCountryFromIp(ip: string, vercelCountry?: string | null): Promise<string | null> {
    // Vercel provides country instantly - use it if available
    if (vercelCountry) {
        return vercelCountry;
    }

    // Localhost / internal
    if (ip === '::1' || ip === '127.0.0.1') return 'US'; // Mock local as US

    try {
        // Fast timeout for GeoIP lookup prevents slow loads
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const res = await fetch(`https://geolocation-db.com/json/${ip}&position=true`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            return data.country_code;
        }
    } catch (e) {
        console.warn('GeoIP lookup failed:', e);
    }
    return null;
}

// GET /api/files/[id]/info - Get public file info for viewing
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = getSupabaseClient()
        const { id: fileId } = await params

        // Get viewer IP
        const forwardedFor = request.headers.get('x-forwarded-for')
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1'

        // Get file record
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('id, original_name, mime_type, file_size, created_at, settings, owner_id, is_destroyed')
            .eq('id', fileId)
            .single()

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

        // Get owner's anonymous_id and blocked_countries from database
        const { data: owner } = await supabase
            .from('users')
            .select('anonymous_id, blocked_countries')
            .eq('id', file.owner_id)
            .single()

        // --- GEOFENCING CHECK ---
        // Use Vercel's header if available (fast, reliable), fallback to external API
        const vercelCountry = request.headers.get('x-vercel-ip-country');
        const viewerCountry = await getCountryFromIp(ip, vercelCountry);

        // Fail Closed: If we can't determine country, and there ARE restrictions, BLOCK IT.
        // Use Array.isArray to safely check for actual block lists
        const globalBlockList = Array.isArray(owner?.blocked_countries) ? owner.blocked_countries : [];
        const fileBlockList = Array.isArray(file.settings?.blocked_countries) ? file.settings.blocked_countries : [];
        const hasGlobalBlocks = globalBlockList.length > 0;
        const hasFileBlocks = fileBlockList.length > 0;

        if (!viewerCountry && (hasGlobalBlocks || hasFileBlocks)) {
            console.warn(`Geoblock triggered (Fail-Closed): ${ip} location unknown, but blocks are active.`);
            return NextResponse.json({
                error: `Access Denied: Unable to verify your location, and this content has regional restrictions.`,
                is_geoblocked: true
            }, { status: 403 });
        }

        // Check Global Blocklist
        if (viewerCountry && globalBlockList.includes(viewerCountry)) {
            console.log(`Geoblock triggered: ${ip} (${viewerCountry}) blocked by owner global setting`);
            return NextResponse.json({
                error: `Access Denied: This content is not available in your region (${viewerCountry})`,
                is_geoblocked: true
            }, { status: 403 });
        }

        // Check File-Specific Blocklist
        if (viewerCountry && fileBlockList.includes(viewerCountry)) {
            console.log(`Geoblock triggered: ${ip} (${viewerCountry}) blocked by file setting`);
            return NextResponse.json({
                error: `Access Denied: This content is not available in your region (${viewerCountry})`,
                is_geoblocked: true
            }, { status: 403 });
        }

        // Use database ID, or fallback to computed if not available
        const anonymousId = owner?.anonymous_id || generateAnonymousIdFallback(file.owner_id)

        return NextResponse.json({
            id: file.id,
            original_name: file.original_name,
            mime_type: file.mime_type,
            file_size: file.file_size,
            created_at: file.created_at,
            settings: file.settings,
            // Anonymous owner info - read from database
            owner: {
                id: anonymousId,
                display_name: `User ${anonymousId}`
            }
        })

    } catch (error) {
        console.error('File info error:', error)
        return NextResponse.json({ error: 'Failed to get file info' }, { status: 500 })
    }
}


