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

    // VPN Detection
    isVpn: boolean;
    isProxy: boolean;
    isTor: boolean;
    isDatacenter: boolean;
    vpnProvider: string | null;
    riskScore: number;
}

export async function getIPInfo(ip: string): Promise<IPInfo | null> {
    try {
        // Use ip-api.com for basic info (free, no API key needed)
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting`);
        const data = await response.json();

        if (data.status !== 'success') {
            return null;
        }

        return {
            ip,
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            country: data.country || 'Unknown',
            countryCode: data.countryCode || 'XX',
            isp: data.isp || 'Unknown',
            org: data.org || 'Unknown',
            as: data.as || 'Unknown',
            timezone: data.timezone || 'Unknown',

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
    const datacenterAsns = ['AS396982', 'AS14061', 'AS16276', 'AS15169']; // DigitalOcean, Google, etc
    if (datacenterAsns.some(asn => data.as?.includes(asn))) {
        score += 20;
    }

    return Math.min(score, 100);
}

// API Route: GET /api/ip/lookup?ip=xxx
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
        // Get requester's IP
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

        const info = await getIPInfo(clientIp);
        return NextResponse.json(info);
    }

    const info = await getIPInfo(ip);
    return NextResponse.json(info);
}
