import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// POST /api/blacklist/add - Add a device to user's blacklist
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin()
        const body = await request.json()

        const {
            owner_id,
            blocked_email,
            blocked_name,
            reason,
            fingerprint,
            ip_address,
            ip_info
        } = body

        if (!owner_id || !fingerprint) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Extract hash values for fast matching
        const canvas_hash = fingerprint.canvasDataHash || ''
        const webgl_hash = fingerprint.webglFingerprint?.renderHash || ''
        const audio_hash = fingerprint.audioFingerprint?.analyserHash || ''
        const font_hash = fingerprint.fontFingerprint?.fontHash || ''
        const combined_hash = fingerprint.combinedHash || ''

        // Check if already blacklisted (by email or combined hash)
        const { data: existing } = await supabase
            .from('blacklist')
            .select('id')
            .eq('owner_id', owner_id)
            .or(`blocked_email.eq.${blocked_email},combined_hash.eq.${combined_hash}`)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({
                error: 'This device/email is already blacklisted',
                existing_id: existing.id
            }, { status: 409 })
        }

        const { data, error } = await supabase
            .from('blacklist')
            .insert({
                owner_id,
                blocked_email,
                blocked_name,
                reason,
                fingerprint,
                canvas_hash,
                webgl_hash,
                audio_hash,
                font_hash,
                combined_hash,
                ip_address,
                ip_info
            })
            .select()
            .single()

        if (error) {
            console.error('Blacklist add error:', error)
            return NextResponse.json({ error: 'Failed to add to blacklist' }, { status: 500 })
        }

        return NextResponse.json({
            message: 'Added to blacklist successfully',
            blacklist_entry: data
        })

    } catch (error) {
        console.error('Blacklist error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
