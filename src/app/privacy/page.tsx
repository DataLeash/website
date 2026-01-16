import Link from "next/link";
import { DataLeashLogo } from "@/components/DataLeashLogo";

export default function PrivacyPage() {
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
                <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                <p className="text-slate-400 mb-8">Last Updated: January 15, 2026 | Effective Immediately</p>

                <div className="glass-card p-8 space-y-8 text-[var(--foreground-muted)]">

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. Agreement to Privacy Policy</h2>
                        <p>By accessing, using, or registering for DataLeash (&quot;Service&quot;, &quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;), you (&quot;User&quot;, &quot;you&quot;, &quot;your&quot;) explicitly acknowledge that you have read, understood, and irrevocably agree to be bound by this Privacy Policy. <strong className="text-white">Your continued use of the Service constitutes your unconditional acceptance of all terms herein.</strong></p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>
                        <p className="mb-3">We collect and process the following information:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Account information (email, phone number, name, National ID for verification)</li>
                            <li>Device identifiers, IP addresses, browser fingerprints, and hardware signatures</li>
                            <li>File metadata, access logs, timestamps, and geolocation data</li>
                            <li>Behavioral analytics, usage patterns, and session recordings</li>
                            <li>Any information you voluntarily provide through forms, support requests, or communications</li>
                        </ul>
                        <p className="mt-3 text-sm text-slate-500">You consent to the collection of all such data by using the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Information</h2>
                        <p>Your information may be used for: providing and improving the Service; identity verification; fraud prevention; security monitoring; analytics; marketing communications; compliance with legal obligations; and any other purpose we deem necessary for operating the Platform.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Data Sharing and Disclosure</h2>
                        <p>We may share your information with: service providers and third-party vendors; law enforcement upon request; affiliated entities; potential acquirers in case of merger or sale; and any party where disclosure is necessary to protect our rights, property, or safety.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Encryption and Security</h2>
                        <p>While we implement encryption technologies, <strong className="text-white">no system is 100% secure.</strong> You acknowledge that you use the Service at your own risk and that we are not liable for any data breaches, unauthorized access, or security incidents beyond our reasonable control.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Data Retention</h2>
                        <p>We retain your data for as long as necessary to provide the Service and comply with legal obligations. Even after account deletion, certain data may be retained in backups, logs, or archives for legitimate business and legal purposes.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">7. Third-Party Services</h2>
                        <p>The Service may integrate with third-party services (Supabase, AI providers, payment processors, analytics). These third parties have their own privacy policies and we are not responsible for their practices.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">8. International Data Transfers</h2>
                        <p>Your data may be transferred and processed in countries outside your jurisdiction. By using the Service, you consent to such transfers.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">9. Your Rights</h2>
                        <p>Subject to applicable laws, you may request access to or deletion of your personal data by contacting <a href="mailto:dataleashowner@gmail.com" className="text-blue-400 hover:underline">dataleashowner@gmail.com</a>. We reserve the right to verify your identity and may refuse requests that are unreasonable or impractical.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">10. Waiver of Claims</h2>
                        <p className="text-yellow-400/80"><strong>BY USING THIS SERVICE, YOU EXPRESSLY WAIVE ANY RIGHT TO BRING CLASS ACTION LAWSUITS OR CLASS-WIDE ARBITRATION AGAINST DATALEASH. ANY DISPUTES MUST BE RESOLVED INDIVIDUALLY.</strong></p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">11. Changes to This Policy</h2>
                        <p>We may update this Privacy Policy at any time without prior notice. Your continued use after changes constitutes acceptance of the revised policy.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">12. Contact</h2>
                        <p>For privacy inquiries: <a href="mailto:dataleashowner@gmail.com" className="text-blue-400 hover:underline">dataleashowner@gmail.com</a></p>
                    </section>

                    <div className="pt-6 border-t border-[rgba(0,212,255,0.2)] text-sm text-slate-500">
                        <p>By using DataLeash, you confirm that you are at least 18 years old and have the legal capacity to enter into binding agreements.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
