import Link from "next/link";
import { DataLeashLogo } from "@/components/DataLeashLogo";
import { Check, Zap, Shield, AlertTriangle, Sparkles, Crown } from "lucide-react";

export const metadata = {
    title: "Pricing - DataLeash",
    description: "Choose your DataLeash plan. Free tier for getting started, Pro for unlimited protection.",
};

export default function PricingPage() {
    const freeFeatures = [
        "5 protected files",
        "Basic access logging",
        "7-day log retention",
        "Standard encryption",
        "Email support",
    ];

    const proFeatures = [
        { text: "Unlimited protected files", highlight: true },
        { text: "Instant kill switch", highlight: true },
        { text: "AI threat detection", highlight: true },
        { text: "Screenshot blocking", highlight: false },
        { text: "90-day log retention", highlight: false },
        { text: "Priority email support", highlight: false },
        { text: "Advanced analytics", highlight: false },
    ];

    return (
        <div className="gradient-bg min-h-screen">
            <header className="p-6 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3">
                    <DataLeashLogo size={32} />
                    <span className="font-bold text-gradient">DataLeash</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-slate-400 hover:text-white transition">Login</Link>
                    <Link href="/signup" className="glow-button px-6 py-2 rounded-lg font-semibold text-black">Get Started</Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Start free and upgrade when you need more power. No hidden fees, cancel anytime.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <div className="glass-card p-8 relative">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Free</h2>
                            <p className="text-slate-400">Perfect for getting started</p>
                        </div>

                        <div className="mb-8">
                            <div className="text-5xl font-bold text-white mb-1">
                                $0<span className="text-lg text-slate-400">/mo</span>
                            </div>
                            <p className="text-slate-500 text-sm">Free forever</p>
                        </div>

                        <ul className="space-y-4 mb-8">
                            {freeFeatures.map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-300">
                                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <Link
                            href="/signup"
                            className="block w-full py-3 text-center border border-slate-600 hover:border-slate-500 text-white font-semibold rounded-xl transition"
                        >
                            Get Started Free
                        </Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="glass-card p-8 relative overflow-hidden border-2 border-cyan-500/30">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />

                        <div className="relative">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Crown className="w-5 h-5 text-yellow-400" />
                                        <h2 className="text-2xl font-bold text-white">Pro</h2>
                                    </div>
                                    <p className="text-slate-400">Full protection suite</p>
                                </div>
                                <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full">
                                    POPULAR
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="text-5xl font-bold text-white mb-1">
                                    $29<span className="text-lg text-slate-400">/mo</span>
                                </div>
                                <p className="text-slate-500 text-sm">Billed monthly • Cancel anytime</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {proFeatures.map((feature, i) => (
                                    <li key={i} className={`flex items-center gap-3 ${feature.highlight ? 'text-white' : 'text-slate-300'}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${feature.highlight ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
                                            {feature.highlight ? (
                                                <Zap className="w-4 h-4 text-cyan-400" />
                                            ) : (
                                                <Check className="w-4 h-4 text-emerald-400" />
                                            )}
                                        </div>
                                        <span className={feature.highlight ? 'font-medium' : ''}>{feature.text}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/upgrade"
                                className="block w-full py-3 text-center bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-500/25"
                            >
                                Upgrade to Pro
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Feature Comparison */}
                <div className="mt-20">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">Feature Comparison</h2>
                    <div className="glass-card overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left p-4 text-slate-400 font-medium">Feature</th>
                                    <th className="text-center p-4 text-white font-bold">Free</th>
                                    <th className="text-center p-4 text-cyan-400 font-bold">Pro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                <tr>
                                    <td className="p-4 text-slate-300">Protected Files</td>
                                    <td className="p-4 text-center text-slate-400">5</td>
                                    <td className="p-4 text-center text-cyan-400 font-medium">Unlimited</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-slate-300">Kill Switch</td>
                                    <td className="p-4 text-center text-slate-500">—</td>
                                    <td className="p-4 text-center text-cyan-400">✓</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-slate-300">AI Threat Detection</td>
                                    <td className="p-4 text-center text-slate-500">—</td>
                                    <td className="p-4 text-center text-cyan-400">✓</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-slate-300">Screenshot Blocking</td>
                                    <td className="p-4 text-center text-slate-500">—</td>
                                    <td className="p-4 text-center text-cyan-400">✓</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-slate-300">Log Retention</td>
                                    <td className="p-4 text-center text-slate-400">7 days</td>
                                    <td className="p-4 text-center text-cyan-400 font-medium">90 days</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-slate-300">Support</td>
                                    <td className="p-4 text-center text-slate-400">Email</td>
                                    <td className="p-4 text-center text-cyan-400 font-medium">Priority</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-20 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-bold text-white mb-2">Can I cancel anytime?</h3>
                            <p className="text-slate-400">Yes! You can cancel your Pro subscription at any time. You&apos;ll continue to have access until the end of your billing period.</p>
                        </div>
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-bold text-white mb-2">What payment methods do you accept?</h3>
                            <p className="text-slate-400">We accept all major credit cards, debit cards, and PayPal through our secure payment processor, Paddle.</p>
                        </div>
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-bold text-white mb-2">Is there a refund policy?</h3>
                            <p className="text-slate-400">Yes, we offer a 14-day money-back guarantee. See our <Link href="/refund" className="text-cyan-400 hover:underline">Refund Policy</Link> for details.</p>
                        </div>
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-bold text-white mb-2">What happens to my files if I downgrade?</h3>
                            <p className="text-slate-400">Your files remain protected. If you exceed the free tier limit, you won&apos;t be able to add new files until you upgrade or delete some existing files.</p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-20 text-center">
                    <p className="text-slate-400 mb-6">
                        Questions? Contact us at <a href="mailto:dataleashowner@gmail.com" className="text-cyan-400 hover:underline">dataleashowner@gmail.com</a>
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-8 px-6">
                <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-slate-400">
                    <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
                    <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
                    <Link href="/refund" className="hover:text-white transition">Refund Policy</Link>
                </div>
            </footer>
        </div>
    );
}
