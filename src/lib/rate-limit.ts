/**
 * Simple in-memory rate limiter for API routes
 * Uses a sliding window approach
 */

interface RateLimitConfig {
    windowMs: number      // Time window in milliseconds
    maxRequests: number   // Max requests per window
}

interface RateLimitEntry {
    count: number
    resetAt: number
}

// In-memory store (works for single instance, use Redis for distributed)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Default configs for different endpoint types
export const RATE_LIMIT_CONFIGS = {
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },      // 10 per 15 min
    api: { windowMs: 60 * 1000, maxRequests: 60 },            // 60 per min
    upload: { windowMs: 60 * 1000, maxRequests: 10 },         // 10 per min
    sensitive: { windowMs: 60 * 1000, maxRequests: 5 },       // 5 per min
} as const

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt < now) {
            rateLimitStore.delete(key)
        }
    }
}, 60000) // Clean every minute

/**
 * Check if request should be rate limited
 * Returns { limited: false } if allowed, or { limited: true, retryAfter } if blocked
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
): { limited: boolean; remaining: number; retryAfter?: number } {
    const now = Date.now()
    const key = identifier

    const existing = rateLimitStore.get(key)

    if (!existing || existing.resetAt < now) {
        // First request or window expired - start new window
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + config.windowMs
        })
        return { limited: false, remaining: config.maxRequests - 1 }
    }

    if (existing.count >= config.maxRequests) {
        // Rate limited
        const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
        return { limited: true, remaining: 0, retryAfter }
    }

    // Increment counter
    existing.count++
    return { limited: false, remaining: config.maxRequests - existing.count }
}

/**
 * Get client identifier from request headers
 */
export function getClientIdentifier(headers: Headers): string {
    const forwarded = headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() :
        headers.get('x-real-ip') ||
        'unknown'
    return ip
}

/**
 * Create rate limit response headers
 */
export function getRateLimitHeaders(
    remaining: number,
    limit: number,
    resetAt?: number
): Record<string, string> {
    const headers: Record<string, string> = {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    }

    if (resetAt) {
        headers['X-RateLimit-Reset'] = String(Math.ceil(resetAt / 1000))
        headers['Retry-After'] = String(Math.ceil((resetAt - Date.now()) / 1000))
    }

    return headers
}
