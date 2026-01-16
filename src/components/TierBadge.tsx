'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, Zap, Lock, Sparkles } from 'lucide-react'

interface TierInfo {
    tier: string
    limits: {
        maxFiles: number
        currentFiles: number
        remainingFiles: number
    }
    features: Record<string, boolean>
}

export function TierBadge({ className = '' }: { className?: string }) {
    const [tierInfo, setTierInfo] = useState<TierInfo | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/tier')
            .then(res => res.json())
            .then(data => {
                setTierInfo(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className={`animate-pulse bg-slate-700/50 rounded-lg h-16 ${className}`} />
        )
    }

    if (!tierInfo) return null

    const isPro = tierInfo.tier === 'pro'

    if (isPro) {
        return (
            <div className={`bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl p-4 ${className}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Crown className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-amber-400 font-bold text-sm">PRO</span>
                            <Sparkles className="w-3 h-3 text-amber-400" />
                        </div>
                        <p className="text-xs text-amber-400/70">All features unlocked</p>
                    </div>
                </div>
            </div>
        )
    }

    // Free tier
    const filesRemaining = tierInfo.limits.remainingFiles
    const filesUsed = tierInfo.limits.currentFiles
    const maxFiles = tierInfo.limits.maxFiles

    return (
        <div className={`bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-4 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                        <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                        <span className="text-slate-300 font-semibold text-sm">FREE TRIAL</span>
                        <p className="text-xs text-slate-500">Limited features</p>
                    </div>
                </div>
            </div>

            {/* File usage indicator */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Files: {filesUsed}/{maxFiles}</span>
                    <span>{filesRemaining} left</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${filesRemaining === 0
                                ? 'bg-red-500'
                                : filesRemaining === 1
                                    ? 'bg-amber-500'
                                    : 'bg-cyan-500'
                            }`}
                        style={{ width: `${(filesUsed / maxFiles) * 100}%` }}
                    />
                </div>
            </div>

            <Link
                href="/upgrade"
                className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/20"
            >
                <Zap className="w-4 h-4" />
                Upgrade to Pro
            </Link>
        </div>
    )
}

// Pro feature lock overlay component
export function ProFeatureLock({
    feature,
    children,
    showOverlay = true
}: {
    feature: string
    children: React.ReactNode
    showOverlay?: boolean
}) {
    const [tierInfo, setTierInfo] = useState<TierInfo | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/tier')
            .then(res => res.json())
            .then(data => {
                setTierInfo(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return <>{children}</>

    const isPro = tierInfo?.tier === 'pro'
    const isFeatureEnabled = tierInfo?.features?.[feature]

    if (isPro || isFeatureEnabled) {
        return <>{children}</>
    }

    if (!showOverlay) {
        return (
            <div className="opacity-50 pointer-events-none relative">
                {children}
                <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    PRO
                </div>
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="opacity-30 pointer-events-none blur-[1px]">
                {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-lg">
                <Link
                    href="/upgrade"
                    className="flex flex-col items-center gap-2 p-4 text-center"
                >
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Crown className="w-6 h-6 text-black" />
                    </div>
                    <span className="text-white font-bold">Pro Feature</span>
                    <span className="text-amber-400 text-sm hover:underline">Upgrade Now →</span>
                </Link>
            </div>
        </div>
    )
}

// Small inline Pro badge
export function ProBadge() {
    return (
        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            <Crown className="w-2.5 h-2.5" />
            PRO
        </span>
    )
}
