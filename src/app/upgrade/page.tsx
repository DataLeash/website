'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DataLeashLogo } from '@/components/DataLeashLogo'
import { Check, ArrowLeft, Zap, Shield, AlertTriangle, Sparkles, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import Script from 'next/script'

export default function UpgradePage() {
    const [user, setUser] = useState<any>(null)
    const [showKofiWidget, setShowKofiWidget] = useState(false)

    // Ko-fi configuration
    const KOFI_USERNAME = 'dataleash'
    const KOFI_URL = `https://ko-fi.com/${KOFI_USERNAME}`

    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()
    }, [])

    const handleUpgrade = () => {
        // Open Ko-fi in a new tab
        window.open(KOFI_URL, '_blank')
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
            {/* Ko-fi Widget Script */}
            <Script
                src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
                onLoad={() => {
                    if (typeof window !== 'undefined' && (window as any).kofiWidgetOverlay) {
                        (window as any).kofiWidgetOverlay.draw(KOFI_USERNAME, {
                            'type': 'floating-chat',
                            'floating-chat.donateButton.text': 'Support DataLeash',
                            'floating-chat.donateButton.background-color': '#3b82f6',
                            'floating-chat.donateButton.text-color': '#fff'
                        });
                    }
                }}
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
                                <p className="text-slate-500 text-sm mt-1">Monthly membership • Cancel anytime</p>
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

                        {/* Upgrade Button */}
                        <button
                            onClick={handleUpgrade}
                            className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                        >
                            <span>Subscribe on Ko-fi</span>
                            <ExternalLink className="w-5 h-5" />
                        </button>

                        <p className="text-center text-xs text-slate-500 mt-4">
                            Secure payment via Ko-fi • PayPal or Credit Card accepted
                        </p>

                        {/* How it works */}
                        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <h4 className="text-white font-medium mb-2">How to upgrade:</h4>
                            <ol className="text-sm text-slate-400 space-y-1">
                                <li>1. Click the button to visit our Ko-fi page</li>
                                <li>2. Select the "DataLeash Pro" monthly membership</li>
                                <li>3. Complete payment via PayPal or Credit Card</li>
                                <li>4. Email us at <a href="mailto:dataleashowner@gmail.com" className="text-blue-400">dataleashowner@gmail.com</a> with your receipt</li>
                                <li>5. We&apos;ll upgrade your account within 24 hours!</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Ko-fi Badge */}
                <div className="flex justify-center gap-6 mb-8">
                    <a href={KOFI_URL} target="_blank" rel="noopener noreferrer">
                        <img
                            src="https://storage.ko-fi.com/cdn/kofi2.png?v=3"
                            alt="Buy Me a Coffee at ko-fi.com"
                            className="h-10 hover:opacity-80 transition-opacity"
                        />
                    </a>
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
