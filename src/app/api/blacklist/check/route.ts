import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// Type definitions
interface FingerprintData {
    combinedHash?: string
    canvasDataHash?: string
    screenResolution?: string
    hardwareConcurrency?: number
    webglFingerprint?: {
        renderHash?: string
        unmaskedRenderer?: string
    }
    audioFingerprint?: {
        analyserHash?: string
    }
    fontFingerprint?: {
        fontHash?: string
    }
    [key: string]: unknown
}

interface BlacklistEntry {
    id: string
    combined_hash?: string
    canvas_hash?: string
    webgl_hash?: string
    audio_hash?: string
    font_hash?: string
    fingerprint?: FingerprintData
    blocked_email?: string
    blocked_name?: string
    reason?: string
    match_count?: number
    [key: string]: unknown
}

interface MatchResult {
    entry_id: string
    match_type: string
    similarity: number
    blocked_email?: string
    blocked_name?: string
    reason?: string
}

// Calculate similarity between two fingerprints (0-100)
function calculateFingerprintSimilarity(fp1: FingerprintData, fp2: BlacklistEntry): number {
    let matchScore = 0;
    let totalChecks = 0;

    // Combined hash - exact match is very high confidence
    if (fp1.combinedHash && fp2.combined_hash) {
        totalChecks += 30;
        if (fp1.combinedHash === fp2.combined_hash) matchScore += 30;
    }

    // Canvas hash
    if (fp1.canvasDataHash && fp2.canvas_hash) {
        totalChecks += 20;
        if (fp1.canvasDataHash === fp2.canvas_hash) matchScore += 20;
    }

    // WebGL render hash
    if (fp1.webglFingerprint?.renderHash && fp2.webgl_hash) {
        totalChecks += 20;
        if (fp1.webglFingerprint.renderHash === fp2.webgl_hash) matchScore += 20;
    }

    // Audio hash
    if (fp1.audioFingerprint?.analyserHash && fp2.audio_hash) {
        totalChecks += 15;
        if (fp1.audioFingerprint.analyserHash === fp2.audio_hash) matchScore += 15;
    }

    // Font hash
    if (fp1.fontFingerprint?.fontHash && fp2.font_hash) {
        totalChecks += 15;
        if (fp1.fontFingerprint.fontHash === fp2.font_hash) matchScore += 15;
    }

    // Screen resolution
    const storedFP = fp2.fingerprint || {};
    if (fp1.screenResolution && storedFP.screenResolution) {
        totalChecks += 5;
        if (fp1.screenResolution === storedFP.screenResolution) matchScore += 5;
    }

    // Hardware concurrency
    if (fp1.hardwareConcurrency && storedFP.hardwareConcurrency) {
        totalChecks += 5;
        if (fp1.hardwareConcurrency === storedFP.hardwareConcurrency) matchScore += 5;
    }

    // WebGL unmasked renderer (very unique)
    if (fp1.webglFingerprint?.unmaskedRenderer && storedFP.webglFingerprint?.unmaskedRenderer) {
        totalChecks += 20;
        if (fp1.webglFingerprint.unmaskedRenderer === storedFP.webglFingerprint.unmaskedRenderer) {
            matchScore += 20;
        }
    }

    return totalChecks > 0 ? Math.round((matchScore / totalChecks) * 100) : 0;
}

// POST /api/blacklist/check - Check if fingerprint matches any blacklisted device
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin()
        const { owner_id, fingerprint, viewer_email } = await request.json()

        if (!owner_id || !fingerprint) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get owner's blacklist
        const { data: blacklist, error } = await supabase
            .from('blacklist')
            .select('*')
            .eq('owner_id', owner_id)

        if (error) {
            console.error('Blacklist check error:', error)
            return NextResponse.json({ error: 'Failed to check blacklist' }, { status: 500 })
        }

        if (!blacklist || blacklist.length === 0) {
            return NextResponse.json({
                blacklisted: false,
                matches: [],
                risk_score: 0
            })
        }

        // Check against each blacklisted entry
        const matches: MatchResult[] = []

        for (const entry of blacklist) {
            // Check email match
            if (viewer_email && entry.blocked_email &&
                viewer_email.toLowerCase() === entry.blocked_email.toLowerCase()) {
                matches.push({
                    entry_id: entry.id,
                    match_type: 'email',
                    similarity: 100,
                    blocked_email: entry.blocked_email,
                    blocked_name: entry.blocked_name,
                    reason: entry.reason
                })
                continue
            }

            // Check fingerprint similarity
            const similarity = calculateFingerprintSimilarity(fingerprint, entry)

            if (similarity >= 70) { // 70%+ match threshold
                matches.push({
                    entry_id: entry.id,
                    match_type: 'fingerprint',
                    similarity,
                    blocked_email: entry.blocked_email,
                    blocked_name: entry.blocked_name,
                    reason: entry.reason
                })

                // Update match count
                await supabase
                    .from('blacklist')
                    .update({
                        match_count: (entry.match_count || 0) + 1,
                        last_match_at: new Date().toISOString()
                    })
                    .eq('id', entry.id)
            }
        }

        // Calculate overall risk score
        let risk_score = 0
        if (matches.length > 0) {
            const maxSimilarity = Math.max(...matches.map(m => m.similarity))
            risk_score = maxSimilarity
        }

        // Determine if blacklisted
        const blacklisted = matches.length > 0

        return NextResponse.json({
            blacklisted,
            matches,
            risk_score,
            risk_level: risk_score >= 90 ? 'CRITICAL' :
                risk_score >= 70 ? 'HIGH' :
                    risk_score >= 50 ? 'MEDIUM' : 'LOW'
        })

    } catch (error) {
        console.error('Blacklist check error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
