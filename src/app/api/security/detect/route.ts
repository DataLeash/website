import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// Threat detection configuration
const HIGH_RISK_COUNTRIES = ['CN', 'RU', 'KP', 'IR', 'SY']
const SUSPICIOUS_ISP_KEYWORDS = ['vpn', 'proxy', 'tor', 'anonymous', 'hide', 'mask', 'private internet']
const VPN_ASN_PREFIXES = ['AS9009', 'AS20473', 'AS396356', 'AS212238'] // Common VPN ASNs

// Type definitions for threat analysis
interface FileSecuritySettings {
    blocked_countries?: string[]
    require_vpn_block?: boolean
    blocked_ips?: string[]
    allowed_ips?: string[]
    allowed_domains?: string[]
}

interface BrowserFingerprint {
    webdriver?: boolean
    timezone?: string
    canvas?: string | null
    [key: string]: unknown
}

interface ThreatAnalysis {
    score: number // 0-100, higher = more suspicious
    level: 'low' | 'medium' | 'high' | 'critical'
    factors: ThreatFactor[]
    action: 'allow' | 'warn' | 'block' | 'kill'
    recommendations: string[]
}

interface ThreatFactor {
    name: string
    score: number
    description: string
    severity: 'info' | 'warning' | 'danger'
}

// Analyze IP and fingerprint for threats
function analyzeThreat(params: {
    ip?: string
    country?: string
    isp?: string
    timezone?: string
    fingerprint?: BrowserFingerprint | null
    userAgent?: string
    viewerEmail?: string
    fileSettings?: FileSecuritySettings | null
    previousAttempts?: number
}): ThreatAnalysis {
    const factors: ThreatFactor[] = []
    let totalScore = 0

    // 1. Country risk analysis
    if (params.country) {
        if (HIGH_RISK_COUNTRIES.includes(params.country)) {
            factors.push({
                name: 'High-Risk Country',
                score: 40,
                description: `Access from ${params.country} - flagged as high-risk region`,
                severity: 'danger'
            })
            totalScore += 40
        }

        // Check if country is blocked in file settings
        if (params.fileSettings?.blocked_countries && params.fileSettings.blocked_countries.includes(params.country)) {
            factors.push({
                name: 'Blocked Country',
                score: 100,
                description: `Country ${params.country} is explicitly blocked by file owner`,
                severity: 'danger'
            })
            totalScore += 100
        }
    }

    // 2. VPN/Proxy detection
    if (params.isp) {
        const ispLower = params.isp.toLowerCase()
        const isVPN = SUSPICIOUS_ISP_KEYWORDS.some(keyword => ispLower.includes(keyword))

        if (isVPN) {
            factors.push({
                name: 'VPN/Proxy Detected',
                score: 35,
                description: `ISP "${params.isp}" appears to be a VPN or proxy service`,
                severity: 'warning'
            })
            totalScore += 35

            // If VPN blocking is enabled
            if (params.fileSettings?.require_vpn_block) {
                factors.push({
                    name: 'VPN Blocked',
                    score: 50,
                    description: 'VPN access is blocked for this file',
                    severity: 'danger'
                })
                totalScore += 50
            }
        }
    }

    // 3. IP analysis
    if (params.ip) {
        // Check if IP is blacklisted
        if (params.fileSettings?.blocked_ips?.includes(params.ip)) {
            factors.push({
                name: 'Blacklisted IP',
                score: 100,
                description: `IP ${params.ip} is explicitly blacklisted`,
                severity: 'danger'
            })
            totalScore += 100
        }

        // Check IP whitelist
        if (params.fileSettings?.allowed_ips && params.fileSettings.allowed_ips.length > 0 && !params.fileSettings.allowed_ips.includes(params.ip)) {
            factors.push({
                name: 'IP Not Whitelisted',
                score: 60,
                description: 'IP not in approved whitelist',
                severity: 'warning'
            })
            totalScore += 60
        }

        // Check for datacenter IP patterns (often used by bots)
        if (params.ip.startsWith('10.') || params.ip.startsWith('172.') || params.ip.startsWith('192.168.')) {
            factors.push({
                name: 'Internal Network IP',
                score: 10,
                description: 'Access from internal/private network',
                severity: 'info'
            })
            totalScore += 10
        }
    }

    // 4. Email domain analysis
    if (params.viewerEmail && params.fileSettings?.allowed_domains && params.fileSettings.allowed_domains.length > 0) {
        const emailDomain = params.viewerEmail.split('@')[1]
        if (emailDomain && !params.fileSettings.allowed_domains.includes(emailDomain)) {
            factors.push({
                name: 'Unauthorized Domain',
                score: 50,
                description: `Email domain @${emailDomain} is not in allowed list`,
                severity: 'warning'
            })
            totalScore += 50
        }
    }

    // 5. Suspicious fingerprint patterns
    if (params.fingerprint) {
        // Check for headless browser
        if (params.fingerprint.webdriver === true) {
            factors.push({
                name: 'Automated Browser',
                score: 70,
                description: 'Browser appears to be automated (webdriver detected)',
                severity: 'danger'
            })
            totalScore += 70
        }

        // Check for inconsistent timezone
        if (params.timezone && params.fingerprint.timezone) {
            if (params.timezone !== params.fingerprint.timezone) {
                factors.push({
                    name: 'Timezone Mismatch',
                    score: 25,
                    description: 'Browser timezone differs from IP geolocation',
                    severity: 'warning'
                })
                totalScore += 25
            }
        }

        // Check for missing canvas fingerprint (common in bots)
        if (!params.fingerprint.canvas) {
            factors.push({
                name: 'Missing Canvas',
                score: 15,
                description: 'Canvas fingerprinting unavailable - possible bot',
                severity: 'info'
            })
            totalScore += 15
        }
    }

    // 6. User agent analysis
    if (params.userAgent) {
        const ua = params.userAgent.toLowerCase()

        // Check for known bot user agents
        const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'requests']
        const isBot = botPatterns.some(pattern => ua.includes(pattern))

        if (isBot) {
            factors.push({
                name: 'Bot User Agent',
                score: 80,
                description: 'User agent indicates automated access',
                severity: 'danger'
            })
            totalScore += 80
        }

        // Check for outdated browsers (security risk)
        if (ua.includes('msie') || (ua.includes('chrome') && parseInt(ua.match(/chrome\/(\d+)/)?.[1] || '100') < 80)) {
            factors.push({
                name: 'Outdated Browser',
                score: 15,
                description: 'Browser version is outdated',
                severity: 'info'
            })
            totalScore += 15
        }
    }

    // 7. Multiple failed attempts
    if (params.previousAttempts && params.previousAttempts > 3) {
        factors.push({
            name: 'Multiple Attempts',
            score: Math.min(50, params.previousAttempts * 10),
            description: `${params.previousAttempts} failed access attempts recorded`,
            severity: params.previousAttempts > 5 ? 'danger' : 'warning'
        })
        totalScore += Math.min(50, params.previousAttempts * 10)
    }

    // Calculate final score (capped at 100)
    const finalScore = Math.min(100, totalScore)

    // Determine threat level and action
    let level: ThreatAnalysis['level']
    let action: ThreatAnalysis['action']
    const recommendations: string[] = []

    if (finalScore >= 80) {
        level = 'critical'
        action = 'block'
        recommendations.push('Access should be blocked immediately')
        recommendations.push('Consider notifying file owner of threat')
    } else if (finalScore >= 50) {
        level = 'high'
        action = 'warn'
        recommendations.push('Additional verification recommended')
        recommendations.push('Monitor this access attempt closely')
    } else if (finalScore >= 25) {
        level = 'medium'
        action = 'allow'
        recommendations.push('Allow with enhanced logging')
    } else {
        level = 'low'
        action = 'allow'
        recommendations.push('Normal access - no concerns')
    }

    return {
        score: finalScore,
        level,
        factors,
        action,
        recommendations
    }
}

// POST /api/security/detect - Analyze threat for access attempt
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const {
            file_id,
            ip,
            country,
            isp,
            timezone,
            fingerprint,
            viewer_email,
        } = body

        // Get file settings if file_id provided
        let fileSettings = null
        if (file_id) {
            const { data: file } = await supabase
                .from('files')
                .select('settings, owner_id')
                .eq('id', file_id)
                .single()

            if (file) {
                fileSettings = file.settings
            }
        }

        // Count previous failed attempts from this IP
        let previousAttempts = 0
        if (ip && file_id) {
            const { count } = await supabase
                .from('access_logs')
                .select('id', { count: 'exact', head: true })
                .eq('file_id', file_id)
                .eq('ip_address', ip)
                .in('action', ['blocked', 'denied', 'access_denied'])

            previousAttempts = count || 0
        }

        // Perform threat analysis
        const analysis = analyzeThreat({
            ip,
            country,
            isp,
            timezone,
            fingerprint,
            userAgent: request.headers.get('user-agent') || undefined,
            viewerEmail: viewer_email,
            fileSettings,
            previousAttempts,
        })

        // Log the threat analysis if high risk
        if (analysis.level === 'high' || analysis.level === 'critical') {
            await supabase.from('access_logs').insert({
                file_id: file_id || null,
                action: 'threat_detected',
                location: {
                    ip,
                    country,
                    isp,
                    viewer_email,
                    threat_score: analysis.score,
                    threat_level: analysis.level,
                    factors: analysis.factors.map(f => f.name),
                },
                fingerprint: fingerprint || {},
                ip_address: ip || 'unknown',
            })
        }

        return NextResponse.json({
            success: true,
            analysis,
            timestamp: new Date().toISOString(),
        })

    } catch (error) {
        console.error('Threat detection error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET /api/security/detect - Get threat stats for user
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get recent threats for user's files
        const { data: threats } = await supabase
            .from('access_logs')
            .select('*, files!inner(owner_id, original_name)')
            .eq('files.owner_id', user.id)
            .eq('action', 'threat_detected')
            .order('timestamp', { ascending: false })
            .limit(20)

        // Get threat summary
        const { count: totalThreats } = await supabase
            .from('access_logs')
            .select('id', { count: 'exact', head: true })
            .eq('action', 'threat_detected')

        const { count: blockedCount } = await supabase
            .from('access_logs')
            .select('id', { count: 'exact', head: true })
            .in('action', ['blocked', 'denied', 'access_denied'])

        return NextResponse.json({
            threats: threats || [],
            summary: {
                total_threats_detected: totalThreats || 0,
                total_blocked: blockedCount || 0,
            }
        })

    } catch (error) {
        console.error('Threat stats error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
