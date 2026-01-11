import { NextRequest, NextResponse } from 'next/server'

// IP lookup and VPN detection using free APIs
export interface IPInfo {
    ip: string;
    city: string;
    region: string;
    country: string;
    countryCode: string;
    isp: string;
    org: string;
    as: string;
    timezone: string;
    lat?: number;
    lon?: number;
    mapsUrl?: string;

    // VPN Detection
    isVpn: boolean;
    isProxy: boolean;
    isTor: boolean;
    isDatacenter: boolean;
    vpnProvider: string | null;
    riskScore: number;
}

// Get real public IP from external service
async function getRealPublicIP(): Promise<string> {
    try {
        // Try multiple services for reliability
        const services = [
            'https://api.ipify.org?format=json',
            'https://ipinfo.io/json',
            'https://api.ip.sb/ip'
        ];

        for (const service of services) {
            try {
                const response = await fetch(service, {
                    signal: AbortSignal.timeout(3000)
                });
                if (response.ok) {
                    const text = await response.text();
                    // Try JSON parse first
                    try {
                        const json = JSON.parse(text);
                        return json.ip || text.trim();
                    } catch {
                        // Plain text response
                        return text.trim();
                    }
                }
            } catch {
                continue;
            }
        }
        return 'unknown';
    } catch {
        return 'unknown';
    }
}

export async function getIPInfo(ip: string): Promise<IPInfo | null> {
    try {
        // Handle localhost IP - get real public IP
        if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost' || !ip || ip === 'unknown') {
            const realIP = await getRealPublicIP();
            if (realIP && realIP !== 'unknown') {
                ip = realIP;
            } else {
                // Return placeholder for localhost development
                return {
                    ip: ip || '::1',
                    city: 'Localhost',
                    region: 'Development',
                    country: 'Local Machine',
                    countryCode: 'XX',
                    isp: 'Localhost',
                    org: 'Development Environment',
                    as: 'Local',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    isVpn: false,
                    isProxy: false,
                    isTor: false,
                    isDatacenter: false,
                    vpnProvider: null,
                    riskScore: 0
                };
            }
        }

        // Use ip-api.com for basic info (free, no API key needed)
        const response = await fetch(
            `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting`,
            { signal: AbortSignal.timeout(5000) }
        );
        const data = await response.json();

        if (data.status !== 'success') {
            return {
                ip,
                city: 'Unknown',
                region: 'Unknown',
                country: 'Unknown',
                countryCode: 'XX',
                isp: 'Unknown',
                org: 'Unknown',
                as: 'Unknown',
                timezone: 'Unknown',
                isVpn: false,
                isProxy: false,
                isTor: false,
                isDatacenter: false,
                vpnProvider: null,
                riskScore: 0
            };
        }

        return {
            ip,
            city: data.city || 'Unknown',
            region: data.regionName || data.region || 'Unknown',
            country: data.country || 'Unknown',
            countryCode: data.countryCode || 'XX',
            isp: data.isp || 'Unknown',
            org: data.org || 'Unknown',
            as: data.as || 'Unknown',
            timezone: data.timezone || 'Unknown',
            lat: data.lat,
            lon: data.lon,
            mapsUrl: data.lat && data.lon ? `https://maps.google.com/maps?q=${data.lat},${data.lon}` : undefined,

            isVpn: data.proxy || false,
            isProxy: data.proxy || false,
            isTor: false, // Would need additional checks
            isDatacenter: data.hosting || false,
            vpnProvider: data.hosting ? 'Datacenter/VPN' : null,
            riskScore: calculateRiskScore(data)
        };
    } catch (error) {
        console.error('IP lookup error:', error);
        return null;
    }
}

function calculateRiskScore(data: any): number {
    let score = 0;

    if (data.proxy) score += 50;
    if (data.hosting) score += 30;

    // Known datacenter ASNs
    const datacenterAsns = ['AS396982', 'AS14061', 'AS16276', 'AS15169', 'AS13335', 'AS16509', 'AS8075'];
    // DigitalOcean, Cloudflare, AWS, Google, Microsoft
    if (datacenterAsns.some(asn => data.as?.includes(asn))) {
        score += 20;
    }

    return Math.min(score, 100);
}

// API Route: GET /api/ip/lookup?ip=xxx
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    let ip = searchParams.get('ip');

    if (!ip) {
        // Get requester's IP
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare

        ip = cfConnectingIp || forwardedFor?.split(',')[0]?.trim() || realIp || '::1';
    }

    const info = await getIPInfo(ip);
    return NextResponse.json(info);
}
