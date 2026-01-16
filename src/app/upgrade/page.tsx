'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DataLeashLogo } from '@/components/DataLeashLogo'
import { Check, ArrowLeft, Zap, Shield, AlertTriangle, Sparkles, Lock, CreditCard, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

export default function UpgradePage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [userTier, setUserTier] = useState<string>('free')
    const router = useRouter()

    // Ko-fi configuration - Direct membership link
    const KOFI_MEMBERSHIP_URL = 'https://ko-fi.com/dataleash/tiers'

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                // Redirect to login if not authenticated
                router.push('/login?redirect=/upgrade&message=Please login to upgrade your account')
                return
            }

            setUser(user)

            // Check current tier
            const { data: userData } = await supabase
                .from('users')
                .select('tier')
                .eq('id', user.id)
                .single()

            if (userData) {
                setUserTier(userData.tier || 'free')
            }

            setLoading(false)
        }
        checkAuth()
    }, [router])

    const handleUpgrade = () => {
        if (!user) {
            router.push('/login?redirect=/upgrade')
            return
        }
        // Open Ko-fi membership page with user email for tracking
        const kofiUrl = `${KOFI_MEMBERSHIP_URL}?email=${encodeURIComponent(user.email)}`
        window.open(kofiUrl, '_blank')
    }

    const features = [
        { icon: Zap, text: 'Unlimited protected files', highlight: true },
        { icon: AlertTriangle, text: 'Instant kill switch - revoke access instantly' },
        { icon: Shield, text: 'AI-powered threat detection' },
        { icon: Sparkles, text: 'Screenshot & screen recording blocking' },
        { icon: Check, text: 'Real-time access logs (90 days retention)' },
        { icon: Check, text: 'Priority email support' },
        { icon: Check, text: 'Advanced analytics dashboard' },
    ]

    const testimonials = [
        { name: 'Alex K.', role: 'Startup Founder', text: 'DataLeash saved my confidential investor docs from being leaked.' },
        { name: 'Sarah M.', role: 'Legal Consultant', text: 'The kill switch feature is a game-changer for sensitive contracts.' },
    ]

    if (loading) {
        return (
            <div className="gradient-bg min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-slate-400">Checking your account...</p>
                </div>
            </div>
        )
    }

    if (userTier === 'pro') {
        return (
            <div className="gradient-bg min-h-screen">
                <header className="p-6 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3">
                        <DataLeashLogo size={32} />
                        <span className="font-bold text-gradient">DataLeash</span>
                    </Link>
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                </header>
                <main className="max-w-2xl mx-auto px-6 py-20 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">You're Already Pro!</h1>
                    <p className="text-slate-400 mb-8">You have full access to all DataLeash Pro features.</p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:opacity-90 transition"
                    >
                        Go to Dashboard
                    </Link>
                </main>
            </div>
        )
    }

    return (
        <div className="gradient-bg min-h-screen">
            <header className="p-6 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3">
                    <DataLeashLogo size={32} />
                    <span className="font-bold text-gradient">DataLeash</span>
                </Link>
                <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full text-amber-400 text-sm font-medium mb-4">
                        <Star className="w-4 h-4" />
                        Limited Time: 7-Day Free Trial
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Upgrade to <span className="text-gradient">DataLeash Pro</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Take complete control of your shared files with enterprise-grade security features
                    </p>
                </div>

                {/* Pricing Card */}
                <div className="glass-card p-8 mb-12 relative overflow-hidden max-w-xl mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/5" />
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />

                    <div className="relative">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm text-blue-400 font-semibold uppercase tracking-wider">Pro Plan</span>
                                    <span className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full">
                                        BEST VALUE
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-bold text-white">$29</span>
                                    <span className="text-lg text-slate-400">/month</span>
                                </div>
                                <p className="text-slate-500 text-sm mt-1">Billed monthly • Cancel anytime</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl">🛡️</div>
                            </div>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-6" />

                        <ul className="space-y-3 mb-8">
                            {features.map((feature, i) => (
                                <li key={i} className={`flex items-center gap-3 ${feature.highlight ? 'text-white' : 'text-slate-300'}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${feature.highlight ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
                                        <feature.icon className={`w-3 h-3 ${feature.highlight ? 'text-cyan-400' : 'text-emerald-400'}`} />
                                    </div>
                                    <span className={`text-sm ${feature.highlight ? 'font-medium' : ''}`}>{feature.text}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Upgrade Button - Professional branded */}
                        <button
                            onClick={handleUpgrade}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 group"
                        >
                            <Lock className="w-5 h-5 group-hover:hidden" />
                            <CreditCard className="w-5 h-5 hidden group-hover:block" />
                            <span>Upgrade to DataLeash Pro</span>
                        </button>

                        <div className="flex items-center justify-center gap-4 mt-4">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Lock className="w-3 h-3" />
                                <span>Secure Payment</span>
                            </div>
                            <div className="w-1 h-1 bg-slate-600 rounded-full" />
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <span>PayPal & Cards Accepted</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Proof */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {testimonials.map((t, i) => (
                        <div key={i} className="glass-card p-6">
                            <p className="text-slate-300 italic mb-4">"{t.text}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {t.name[0]}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{t.name}</p>
                                    <p className="text-slate-500 text-sm">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Comparison Table */}
                <div className="glass-card p-6 mb-12">
                    <h3 className="text-xl font-bold text-white mb-6 text-center">Free vs Pro Comparison</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left py-3 text-slate-400 font-medium">Feature</th>
                                    <th className="text-center py-3 text-slate-400 font-medium w-24">Free</th>
                                    <th className="text-center py-3 text-cyan-400 font-medium w-24">Pro</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr className="border-b border-slate-800/50">
                                    <td className="py-3 text-slate-300">Protected Files</td>
                                    <td className="text-center text-slate-500">5</td>
                                    <td className="text-center text-cyan-400 font-semibold">Unlimited</td>
                                </tr>
                                <tr className="border-b border-slate-800/50">
                                    <td className="py-3 text-slate-300">Kill Switch</td>
                                    <td className="text-center text-slate-500">—</td>
                                    <td className="text-center text-cyan-400">✓</td>
                                </tr>
                                <tr className="border-b border-slate-800/50">
                                    <td className="py-3 text-slate-300">AI Threat Detection</td>
                                    <td className="text-center text-slate-500">—</td>
                                    <td className="text-center text-cyan-400">✓</td>
                                </tr>
                                <tr className="border-b border-slate-800/50">
                                    <td className="py-3 text-slate-300">Screenshot Blocking</td>
                                    <td className="text-center text-slate-500">—</td>
                                    <td className="text-center text-cyan-400">✓</td>
                                </tr>
                                <tr>
                                    <td className="py-3 text-slate-300">Access Log Retention</td>
                                    <td className="text-center text-slate-500">7 days</td>
                                    <td className="text-center text-cyan-400 font-semibold">90 days</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FAQ */}
                <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-4">Questions?</h3>
                    <p className="text-slate-400 mb-2">
                        Email us at <a href="mailto:dataleashowner@gmail.com" className="text-blue-400 hover:underline">dataleashowner@gmail.com</a>
                    </p>
                    <p className="text-xs text-slate-500">
                        Your subscription will be activated automatically within minutes of payment.
                    </p>
                </div>
            </main>
        </div>
    )
}
