'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, Lock, Zap, ArrowLeft } from 'lucide-react'
import { DataLeashLogo } from './DataLeashLogo'

interface TierInfo {
    tier: string
    limits: {
        maxFiles: number
        currentFiles: number
        remainingFiles: number
    }
    features: Record<string, boolean>
}

interface RequireProProps {
    children: React.ReactNode
    feature?: string
}

// Wrapper component that blocks free users from accessing Pro content
export function RequirePro({ children, feature }: RequireProProps) {
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
            <div className="min-h-screen flex items-center justify-center gradient-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-slate-400">Checking access...</p>
                </div>
            </div>
        )
    }

    const isPro = tierInfo?.tier === 'pro'

    if (isPro) {
        return <>{children}</>
    }

    // Show upgrade prompt for free users
    return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
            <div className="max-w-lg w-full">
                {/* Back button */}
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                {/* Lock card */}
                <div className="glass-card p-8 text-center relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-yellow-500/5" />
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />

                    <div className="relative">
                        {/* Lock icon */}
                        <div className="w-20 h-20 mx-auto mb-6 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl rotate-12 opacity-50" />
                            <div className="relative w-full h-full bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/30">
                                <Lock className="w-10 h-10 text-black" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-2">Pro Feature</h1>
                        <p className="text-slate-400 mb-6">
                            {feature
                                ? `${feature} is available exclusively for Pro subscribers.`
                                : 'This feature is available exclusively for Pro subscribers.'
                            }
                        </p>

                        {/* Benefits list */}
                        <div className="text-left bg-slate-800/50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-slate-300 font-medium mb-3">Upgrade to unlock:</p>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li className="flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-amber-400" />
                                    Unlimited file uploads
                                </li>
                                <li className="flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-amber-400" />
                                    Kill switch & instant revoke
                                </li>
                                <li className="flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-amber-400" />
                                    AI threat detection
                                </li>
                                <li className="flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-amber-400" />
                                    Advanced analytics & reports
                                </li>
                                <li className="flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-amber-400" />
                                    90-day access log retention
                                </li>
                            </ul>
                        </div>

                        {/* Price */}
                        <div className="mb-6">
                            <div className="text-4xl font-bold text-white">
                                $29<span className="text-lg text-slate-400">/mo</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Cancel anytime</p>
                        </div>

                        {/* CTA Button */}
                        <Link
                            href="/upgrade"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30"
                        >
                            <Zap className="w-5 h-5" />
                            Upgrade to Pro
                        </Link>

                        <p className="text-xs text-slate-500 mt-4">
                            Join hundreds of professionals protecting their documents
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RequirePro
