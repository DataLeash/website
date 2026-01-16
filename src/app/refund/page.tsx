import Link from "next/link";
import { DataLeashLogo } from "@/components/DataLeashLogo";

export const metadata = {
    title: "Refund Policy - DataLeash",
    description: "DataLeash refund policy. 14-day money-back guarantee on all Pro subscriptions.",
};

export default function RefundPolicyPage() {
    return (
        <div className="gradient-bg min-h-screen">
            <header className="p-6 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3">
                    <DataLeashLogo size={32} />
                    <span className="font-bold text-gradient">DataLeash</span>
                </Link>
                <Link href="/login" className="glow-button px-6 py-2 rounded-lg font-semibold text-black">Login</Link>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
                <p className="text-slate-400 mb-8">Last Updated: January 16, 2026 | Effective Immediately</p>

                <div className="glass-card p-8 space-y-8 text-[var(--foreground-muted)]">

                    <section className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                        <h2 className="text-lg font-bold text-emerald-400 mb-2">✓ 14-Day Money-Back Guarantee</h2>
                        <p className="text-sm">DataLeash offers a 14-day money-back guarantee on all Pro subscription purchases. If you&apos;re not satisfied, we&apos;ll refund your payment—no questions asked.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. About DataLeash</h2>
                        <p><strong className="text-white">DataLeash</strong> is the legal business name and trading name of this service. This Refund Policy applies to all purchases made through DataLeash.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Eligibility for Refunds</h2>
                        <p className="mb-3">You are eligible for a full refund if:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>You request a refund within <strong className="text-white">14 days</strong> of your initial purchase</li>
                            <li>This is your first subscription to DataLeash Pro</li>
                            <li>You have not previously received a refund from DataLeash</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. How to Request a Refund</h2>
                        <p className="mb-3">To request a refund, please:</p>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Email us at <a href="mailto:dataleashowner@gmail.com" className="text-blue-400 hover:underline">dataleashowner@gmail.com</a></li>
                            <li>Include your account email address</li>
                            <li>Include your transaction ID or order number (if available)</li>
                            <li>Brief reason for the refund request (optional, but helps us improve)</li>
                        </ol>
                        <p className="mt-4">We aim to process all refund requests within <strong className="text-white">3-5 business days</strong>.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Refund Processing</h2>
                        <p className="mb-3">Once approved:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Refunds are processed through our payment provider, Paddle</li>
                            <li>Refunds will be credited to your original payment method</li>
                            <li>It may take <strong className="text-white">5-10 business days</strong> for the refund to appear on your statement</li>
                            <li>Your Pro subscription will be cancelled immediately upon refund</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Non-Refundable Situations</h2>
                        <p className="mb-3">Refunds are <strong className="text-white">not available</strong> in the following cases:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Requests made after the 14-day refund window</li>
                            <li>Subscription renewals (only initial purchases qualify)</li>
                            <li>Accounts terminated for Terms of Service violations</li>
                            <li>Previous refund recipients (one refund per customer)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Subscription Cancellation</h2>
                        <p>You may cancel your Pro subscription at any time from your dashboard. Upon cancellation:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                            <li>You retain Pro access until the end of your current billing period</li>
                            <li>No additional charges will be made</li>
                            <li>Your account reverts to the Free tier after the billing period ends</li>
                            <li>Cancellation does not trigger an automatic refund for unused time</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">7. Disputes</h2>
                        <p>If you believe a charge was made in error or you have a billing dispute, please contact us at <a href="mailto:dataleashowner@gmail.com" className="text-blue-400 hover:underline">dataleashowner@gmail.com</a> before initiating a chargeback with your bank. We&apos;re committed to resolving issues fairly and promptly.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">8. Changes to This Policy</h2>
                        <p>We reserve the right to modify this Refund Policy at any time. Changes are effective immediately upon posting. Your continued use of DataLeash constitutes acceptance of the updated policy.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">9. Contact Us</h2>
                        <p>For refund requests or questions about this policy:</p>
                        <p className="mt-2">
                            <strong className="text-white">Email:</strong>{" "}
                            <a href="mailto:dataleashowner@gmail.com" className="text-blue-400 hover:underline">dataleashowner@gmail.com</a>
                        </p>
                    </section>

                    <div className="pt-6 border-t border-[rgba(0,212,255,0.2)]">
                        <p className="text-sm text-slate-500">
                            By subscribing to DataLeash Pro, you acknowledge that you have read and understood this Refund Policy.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex gap-4 text-sm">
                    <Link href="/terms" className="text-slate-400 hover:text-white transition">Terms of Service</Link>
                    <Link href="/privacy" className="text-slate-400 hover:text-white transition">Privacy Policy</Link>
                    <Link href="/pricing" className="text-slate-400 hover:text-white transition">Pricing</Link>
                </div>
            </main>
        </div>
    );
}
