'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DataLeashLogo } from '@/components/DataLeashLogo'
import { Check, ArrowLeft, Zap, Shield, AlertTriangle, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import Script from 'next/script'

// Paddle types
declare global {
    interface Window {
        Paddle?: {
            Environment: {
                set: (env: string) => void;
            };
            Initialize: (config: { token: string }) => void;
            Checkout: {
                open: (options: any) => void;
            };
        };
    }
}

export default function UpgradePage() {
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [error, setError] = useState('')
    const [paddleReady, setPaddleReady] = useState(false)

    // Paddle configuration
    const PADDLE_CLIENT_TOKEN = 'live_f00c04a598a1f4ff4ff0860010b'
    const PADDLE_PRICE_ID = 'pri_01kf2fe80za3t3gmnz1b10q82v'

    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()
    }, [])

    // Initialize Paddle when script loads
    const initializePaddle = () => {
        if (window.Paddle) {
            window.Paddle.Initialize({
                token: PADDLE_CLIENT_TOKEN
            })
            setPaddleReady(true)
        }
    }

    const handleUpgrade = async () => {
        if (!paddleReady || !window.Paddle) {
            setError('Payment system loading. Please try again.')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Open Paddle checkout overlay
            window.Paddle.Checkout.open({
                items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
                customer: user?.email ? { email: user.email } : undefined,
                customData: {
                    user_id: user?.id || '',
                    plan_id: 'pro'
                },
                settings: {
                    displayMode: 'overlay',
                    theme: 'dark',
                    locale: 'en',
                    successUrl: `${window.location.origin}/dashboard?upgrade=success`,
                },
            })

            // Reset loading after checkout opens
            setTimeout(() => setLoading(false), 1000)

        } catch (err) {
            console.error('Checkout error:', err)
            setError('Failed to open checkout. Please try again.')
            setLoading(false)
        }
    }

    const features = [
        { icon: Zap, text: 'Unlimited protected files', highlight: true },
        { icon: AlertTriangle, text: 'Instant kill switch' },
        { icon: Shield, text: 'AI threat detection' },
        { icon: Sparkles, text: 'Screenshot blocking' },
        { icon: Check, text: 'Real-time access logs (90 days)' },
        { icon: Check, text: 'Priority email support' },
    ]

    return (
        <div className="gradient-bg min-h-screen">
            {/* Paddle.js Script */}
            <Script
                src="https://cdn.paddle.com/paddle/v2/paddle.js"
                onLoad={initializePaddle}
            />

            <header className="p-6 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3">
                    <DataLeashLogo size={32} />
                    <span className="font-bold text-gradient">DataLeash</span>
                </Link>
                <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-4">
                        🚀 Upgrade Your Protection
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Upgrade to Pro</h1>
                    <p className="text-slate-400">Unlock the full power of DataLeash</p>
                </div>

                {/* Pricing Card */}
                <div className="glass-card p-8 mb-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />

                    <div className="relative">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <div className="text-sm text-blue-400 font-medium mb-1">PRO PLAN</div>
                                <div className="text-5xl font-bold text-white">
                                    $29<span className="text-lg text-slate-400">/mo</span>
                                </div>
                                <p className="text-slate-500 text-sm mt-1">Billed monthly • Cancel anytime</p>
                            </div>
                            <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full">
                                MOST POPULAR
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8">
                            {features.map((feature, i) => (
                                <li key={i} className={`flex items-center gap-3 ${feature.highlight ? 'text-white' : 'text-slate-300'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${feature.highlight ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
                                        <feature.icon className={`w-4 h-4 ${feature.highlight ? 'text-cyan-400' : 'text-emerald-400'}`} />
                                    </div>
                                    <span className={feature.highlight ? 'font-medium' : ''}>{feature.text}</span>
                                </li>
                            ))}
                        </ul>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleUpgrade}
                            disabled={loading || !paddleReady}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-cyan-500/25 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Opening checkout...
                                </>
                            ) : !paddleReady ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Loading payment...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    Upgrade Now
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-slate-500 mt-4">
                            Secure payment powered by Paddle • 256-bit SSL encryption
                        </p>
                    </div>
                </div>

                {/* Comparison */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Free vs Pro</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-slate-800">
                            <span className="text-slate-400">Files</span>
                            <div className="flex gap-8">
                                <span className="text-slate-500 w-20 text-center">5</span>
                                <span className="text-cyan-400 w-20 text-center font-medium">Unlimited</span>
                            </div>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-800">
                            <span className="text-slate-400">Kill Switch</span>
                            <div className="flex gap-8">
                                <span className="text-slate-500 w-20 text-center">—</span>
                                <span className="text-cyan-400 w-20 text-center">✓</span>
                            </div>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-800">
                            <span className="text-slate-400">AI Threat Detection</span>
                            <div className="flex gap-8">
                                <span className="text-slate-500 w-20 text-center">—</span>
                                <span className="text-cyan-400 w-20 text-center">✓</span>
                            </div>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-slate-400">Access Log Retention</span>
                            <div className="flex gap-8">
                                <span className="text-slate-500 w-20 text-center">7 days</span>
                                <span className="text-cyan-400 w-20 text-center font-medium">90 days</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500">
                        Questions? Email us at <a href="mailto:dataleashowner@gmail.com" className="text-blue-400 hover:underline">dataleashowner@gmail.com</a>
                    </p>
                </div>
            </main>
        </div>
    )
}
