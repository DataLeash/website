import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Tier limits and features
export const TIER_CONFIG = {
    free: {
        maxFiles: 2,
        maxAccessLogDays: 7,
        features: {
            killSwitch: false,
            aiThreatDetection: false,
            screenshotBlocking: false,
            advancedAnalytics: false,
            prioritySupport: false,
            customWatermark: false,
            deviceLimit: 1,
        }
    },
    pro: {
        maxFiles: Infinity,
        maxAccessLogDays: 90,
        features: {
            killSwitch: true,
            aiThreatDetection: true,
            screenshotBlocking: true,
            advancedAnalytics: true,
            prioritySupport: true,
            customWatermark: true,
            deviceLimit: 10,
        }
    }
}

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user tier from database
        const { data: userData } = await supabase
            .from('users')
            .select('tier, tier_started_at, tier_expires_at, kofi_subscription_id')
            .eq('id', user.id)
            .single()

        const tier = userData?.tier || 'free'
        const tierExpiresAt = userData?.tier_expires_at
        const isExpired = tierExpiresAt && new Date(tierExpiresAt) < new Date()
        const effectiveTier = isExpired ? 'free' : tier

        // Get current file count
        const { count: fileCount } = await supabase
            .from('files')
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', user.id)
            .eq('is_destroyed', false)

        const config = TIER_CONFIG[effectiveTier as keyof typeof TIER_CONFIG] || TIER_CONFIG.free

        return NextResponse.json({
            tier: effectiveTier,
            tierStartedAt: userData?.tier_started_at,
            tierExpiresAt: tierExpiresAt,
            isExpired,
            hasSubscription: !!userData?.kofi_subscription_id,
            limits: {
                maxFiles: config.maxFiles,
                currentFiles: fileCount || 0,
                remainingFiles: effectiveTier === 'pro' ? Infinity : Math.max(0, config.maxFiles - (fileCount || 0)),
                maxAccessLogDays: config.maxAccessLogDays,
            },
            features: config.features,
        })
    } catch (error) {
        console.error('Tier info error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
