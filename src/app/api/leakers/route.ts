import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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

// GET /api/leakers - Get all suspected leakers for current user
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseClient()

        // Get auth token from cookie
        const cookieStore = await cookies()
        const authCookie = cookieStore.get('dataleash_auth')

        if (!authCookie?.value) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const authData = JSON.parse(authCookie.value)
        const userId = authData.userId

        // Get all suspected leakers for this user
        const { data: leakers, error } = await supabase
            .from('suspected_leakers')
            .select('*')
            .eq('owner_id', userId)
            .order('detected_at', { ascending: false })

        if (error) {
            console.error('Error fetching leakers:', error)
            // Table might not exist yet
            return NextResponse.json({ leakers: [], total: 0 })
        }

        // Get counts by status
        const unreviewed = leakers.filter(l => l.status === 'unreviewed').length
        const confirmed = leakers.filter(l => l.status === 'confirmed_leak').length
        const blacklisted = leakers.filter(l => l.status === 'blacklisted').length

        return NextResponse.json({
            leakers,
            total: leakers.length,
            counts: {
                unreviewed,
                confirmed,
                blacklisted
            }
        })
    } catch (error) {
        console.error('Leakers fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch leakers' }, { status: 500 })
    }
}

// POST /api/leakers - Record a new suspected leak
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            original_recipient_email,
            original_recipient_name,
            original_fingerprint_hash,
            file_id,
            file_name,
            unauthorized_fingerprint_hash,
            unauthorized_fingerprint,
            unauthorized_ip,
            unauthorized_ip_info,
            unauthorized_location,
            access_token_id,
            detection_type,
            similarity_score,
            owner_id
        } = body

        if (!owner_id || !file_id || !unauthorized_fingerprint_hash) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = getSupabaseClient()

        // Check if we already have this exact unauthorized fingerprint for this file
        const { data: existing } = await supabase
            .from('suspected_leakers')
            .select('id')
            .eq('file_id', file_id)
            .eq('unauthorized_fingerprint_hash', unauthorized_fingerprint_hash)
            .single()

        if (existing) {
            return NextResponse.json({
                message: 'Leak already recorded',
                leaker_id: existing.id,
                existing: true
            })
        }

        // Insert new suspected leaker
        const { data: leaker, error } = await supabase
            .from('suspected_leakers')
            .insert({
                original_recipient_email,
                original_recipient_name,
                original_fingerprint_hash,
                file_id,
                file_name,
                unauthorized_fingerprint_hash,
                unauthorized_fingerprint,
                unauthorized_ip,
                unauthorized_ip_info,
                unauthorized_location,
                access_token_id,
                detection_type: detection_type || 'fingerprint_mismatch',
                similarity_score: similarity_score || 0,
                owner_id
            })
            .select()
            .single()

        if (error) {
            console.error('Error recording leaker:', error)
            return NextResponse.json({ error: 'Failed to record leak' }, { status: 500 })
        }

        // Also create a notification for the owner
        await supabase.from('notifications').insert({
            user_id: owner_id,
            type: 'threat',
            title: '🚨 LINK SHARING DETECTED!',
            message: `Someone shared the link to "${file_name || 'your file'}"! Original recipient: ${original_recipient_email || 'Unknown'}. An unauthorized device from ${unauthorized_location || 'unknown location'} attempted access.`,
            file_id,
            metadata: {
                leaker_id: leaker.id,
                original_recipient: original_recipient_email,
                unauthorized_fingerprint_hash,
                detection_type
            },
            is_read: false
        })

        return NextResponse.json({
            success: true,
            leaker_id: leaker.id,
            message: 'Link sharing detected and recorded'
        })
    } catch (error) {
        console.error('Record leaker error:', error)
        return NextResponse.json({ error: 'Failed to record leak' }, { status: 500 })
    }
}

// PATCH /api/leakers - Update leaker status
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { leaker_id, status, notes } = body

        if (!leaker_id || !status) {
            return NextResponse.json({ error: 'Missing leaker_id or status' }, { status: 400 })
        }

        const supabase = getSupabaseClient()

        // Get auth token from cookie
        const cookieStore = await cookies()
        const authCookie = cookieStore.get('dataleash_auth')

        if (!authCookie?.value) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const authData = JSON.parse(authCookie.value)
        const userId = authData.userId

        // Verify ownership
        const { data: leaker, error: fetchError } = await supabase
            .from('suspected_leakers')
            .select('*')
            .eq('id', leaker_id)
            .eq('owner_id', userId)
            .single()

        if (fetchError || !leaker) {
            return NextResponse.json({ error: 'Leaker not found or not authorized' }, { status: 404 })
        }

        // Update status
        const { error: updateError } = await supabase
            .from('suspected_leakers')
            .update({
                status,
                reviewed_notes: notes || null,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', leaker_id)

        if (updateError) {
            console.error('Error updating leaker:', updateError)
            return NextResponse.json({ error: 'Failed to update leaker' }, { status: 500 })
        }

        // If status is 'blacklisted', add to blacklist
        if (status === 'blacklisted') {
            await supabase.from('blacklist').insert({
                owner_id: userId,
                blocked_email: leaker.original_recipient_email,
                blocked_name: leaker.original_recipient_name,
                reason: 'Link sharing detected',
                fingerprint: leaker.unauthorized_fingerprint,
                ip_address: leaker.unauthorized_ip,
                ip_info: leaker.unauthorized_ip_info,
                notes: `Auto-blacklisted from leak detection. ${notes || ''}`
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Update leaker error:', error)
        return NextResponse.json({ error: 'Failed to update leaker' }, { status: 500 })
    }
}
