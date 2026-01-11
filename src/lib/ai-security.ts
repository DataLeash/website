
import { headers } from 'next/headers';

interface SecurityContext {
    ip: string;
    userAgent: string;
    userId?: string;
    fileId: string;
    timestamp: number;
}

interface ThreatAssessment {
    score: number; // 0-100 (100 = critical threat)
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    blockAction: boolean;
    reason?: string;
    aiAnalysis?: string;
}

// Groq API Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant'; // Fast model for security checks

// =====================================================
// TOR EXIT NODE DETECTION
// =====================================================

// Cache for Tor exit nodes (refreshed every hour)
let torExitNodeCache: Set<string> = new Set();
let torCacheLastUpdated: number = 0;
const TOR_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Fetch and cache the Tor exit node list from the official Tor Project
async function refreshTorExitNodeCache(): Promise<void> {
    try {
        const response = await fetch('https://check.torproject.org/torbulkexitlist', {
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
            console.warn('[DataLeash] Failed to fetch Tor exit list:', response.statusText);
            return;
        }

        const text = await response.text();
        const ips = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));

        torExitNodeCache = new Set(ips);
        torCacheLastUpdated = Date.now();

        console.log(`[DataLeash] Tor exit node cache refreshed: ${torExitNodeCache.size} nodes`);
    } catch (error) {
        console.error('[DataLeash] Error fetching Tor exit list:', error);
    }
}

// Check if an IP is a known Tor exit node
async function checkTorExitNode(ip: string): Promise<boolean> {
    // Skip localhost/development IPs
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return false;
    }

    // Refresh cache if expired or empty
    if (torExitNodeCache.size === 0 || (Date.now() - torCacheLastUpdated) > TOR_CACHE_TTL) {
        await refreshTorExitNodeCache();
    }

    return torExitNodeCache.has(ip);
}

// =====================================================
// SECURITY THREAT ANALYSIS
// =====================================================

// Real Groq LPU (Language Processing Unit) inference for <100ms threat detection
export async function analyzeSecurityThreat(context: SecurityContext): Promise<ThreatAssessment> {
    const { ip, userAgent, timestamp } = context;

    // 1. Static Rule Analysis (The "Pre-flight")
    const isTorExitNode = await checkTorExitNode(ip);
    const isUnusualTime = new Date(timestamp).getHours() < 4; // 12AM - 4AM considered unusual

    // Heuristic base score
    let heuristicScore = 0;
    const reasons: string[] = [];

    if (userAgent.includes('Headless')) {
        heuristicScore += 50;
        reasons.push('Headless browser detected');
    }
    if (userAgent.includes('Python') || userAgent.includes('Curl') || userAgent.includes('Wget')) {
        heuristicScore += 70;
        reasons.push('Automated script tool detected');
    }
    if (isUnusualTime) {
        heuristicScore += 10;
        reasons.push('Unusual access time');
    }
    if (isTorExitNode) {
        heuristicScore += 60;
        reasons.push('Tor exit node detected');
    }

    // If we have a critical heuristic threat or NO API key, return heuristic result
    if (heuristicScore >= 80 || !GROQ_API_KEY) {
        if (!GROQ_API_KEY) console.warn('[DataLeash] GROQ_API_KEY missing - using heuristic fallback');

        return {
            score: heuristicScore,
            riskLevel: heuristicScore < 20 ? 'LOW' : heuristicScore < 50 ? 'MEDIUM' : heuristicScore < 80 ? 'HIGH' : 'CRITICAL',
            blockAction: heuristicScore >= 80,
            reason: reasons.join(', ') || 'Normal traffic pattern',
            aiAnalysis: !GROQ_API_KEY ? "Heuristic only (No API Key)" : "Heuristic override (Critical Threat)"
        };
    }

    // 2. Behavioral AI Analysis (Groq)
    try {
        const prompt = `
        You are a security AI. Analyze this access request.
        Context: Sensitive file viewing.
        
        Metadata:
        - IP: ${ip}
        - User Agent: ${userAgent}
        - Hour: ${new Date(timestamp).getHours()} (0-23)
        - Pre-check Flags: ${reasons.join(', ') || 'None'}
        
        Output valid JSON only: { "risk_score": 0-100, "analysis": "brief reason" }
        High risk (80+) if: automation tools, known bad UAs.
        Medium risk (50-79) if: headless, unusual hours, missing headers.
        Low risk (0-49) if: standard browser, office hours.
        `;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1, // Deterministic for security
                max_tokens: 100,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) throw new Error('Empty AI response');

        const result = JSON.parse(content);
        const aiScore = result.risk_score || heuristicScore;

        return {
            score: aiScore,
            riskLevel: aiScore < 20 ? 'LOW' : aiScore < 50 ? 'MEDIUM' : aiScore < 80 ? 'HIGH' : 'CRITICAL',
            blockAction: aiScore >= 80,
            reason: result.analysis || reasons.join(', '),
            aiAnalysis: `Verified by Groq LPU (${MODEL})`
        };

    } catch (error) {
        console.error('[Groq Security Core] Inference failed:', error);

        // Fallback to heuristic
        return {
            score: heuristicScore,
            riskLevel: heuristicScore < 20 ? 'LOW' : heuristicScore < 50 ? 'MEDIUM' : heuristicScore < 80 ? 'HIGH' : 'CRITICAL',
            blockAction: heuristicScore >= 80,
            reason: reasons.join(', ') || 'Heuristic Fallback (AI Error)',
            aiAnalysis: "Heuristic (AI Unavailable)"
        };
    }
}
