import Link from "next/link";
import { DataLeashLogo } from "@/components/DataLeashLogo";

export default function TermsPage() {
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
                <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
                <p className="text-slate-400 mb-8">Last Updated: January 15, 2026 | Effective Immediately</p>

                <div className="glass-card p-8 space-y-8 text-[var(--foreground-muted)]">

                    <section className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <h2 className="text-lg font-bold text-red-400 mb-2">⚠️ IMPORTANT LEGAL NOTICE</h2>
                        <p className="text-sm">BY ACCESSING OR USING DATALEASH, YOU AGREE TO BE LEGALLY BOUND BY THESE TERMS. IF YOU DO NOT AGREE, DO NOT USE THE SERVICE. THESE TERMS INCLUDE LIMITATIONS OF LIABILITY, ARBITRATION REQUIREMENTS, AND CLASS ACTION WAIVERS.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. About DataLeash</h2>
                        <p className="mb-3"><strong className="text-white">DataLeash</strong> is the legal business name and trading name of this service. References to "DataLeash", "Service", "Platform", "we", "us", or "our" in these Terms refer to DataLeash and its operators.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Acceptance of Terms</h2>
                        <p>By accessing, browsing, registering, or using DataLeash ("Service", "Platform", "we", "us", "our"), you ("User", "you", "your") unconditionally agree to these Terms of Service, our Privacy Policy, and all applicable laws. <strong className="text-white">This agreement is legally binding.</strong></p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Service Description</h2>
                        <p>DataLeash provides file sharing with encryption, access control, monitoring, and revocation capabilities. The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. Account Responsibilities</h2>
                        <p>You are solely responsible for: maintaining account security; all activities under your account; the legality of files you upload; compliance with all applicable laws; and any consequences arising from your use of the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Prohibited Uses</h2>
                        <p className="mb-3">You agree NOT to use DataLeash for:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Illegal activities or distribution of illegal content</li>
                            <li>Copyright infringement or intellectual property violations</li>
                            <li>Malware, viruses, or malicious code distribution</li>
                            <li>Harassment, stalking, or threatening behavior</li>
                            <li>Fraud, phishing, or deceptive practices</li>
                            <li>Circumventing security measures or reverse engineering</li>
                            <li>Any activity that could harm the Service or other users</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Intellectual Property</h2>
                        <p>All DataLeash branding, software, designs, and content are our exclusive property. You retain ownership of your uploaded content but grant us a license to process, store, and transmit it as necessary to provide the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Limitation of Liability</h2>
                        <p className="text-yellow-400/80 font-semibold mb-3">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>DataLeash shall NOT be liable for any indirect, incidental, special, consequential, or punitive damages</li>
                            <li>DataLeash shall NOT be liable for loss of data, profits, revenue, or business opportunities</li>
                            <li>DataLeash shall NOT be liable for any damages arising from security breaches, unauthorized access, or system failures</li>
                            <li>Our total liability shall not exceed the amount you paid us in the past 12 months (or $100 if nothing was paid)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">7. Indemnification</h2>
                        <p><strong className="text-white">You agree to defend, indemnify, and hold harmless DataLeash</strong>, its officers, directors, employees, agents, and affiliates from any claims, damages, losses, liabilities, costs, or expenses (including legal fees) arising from: your use of the Service; your violation of these Terms; your violation of any third-party rights; or your uploaded content.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">8. Disclaimer of Warranties</h2>
                        <p>THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED/ERROR-FREE OPERATION.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">9. Dispute Resolution & Arbitration</h2>
                        <p className="text-yellow-400/80 font-semibold mb-3">PLEASE READ CAREFULLY:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Any disputes shall be resolved through binding individual arbitration</li>
                            <li><strong className="text-white">YOU WAIVE YOUR RIGHT TO PARTICIPATE IN CLASS ACTIONS OR CLASS-WIDE ARBITRATION</strong></li>
                            <li>Arbitration shall be governed by the rules of a mutually agreed arbitration provider</li>
                            <li>Each party shall bear their own arbitration costs</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">10. Governing Law</h2>
                        <p>These Terms shall be governed by the laws of the jurisdiction where DataLeash operates, without regard to conflict of law principles.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">11. Termination</h2>
                        <p>We may suspend or terminate your access at any time, for any reason, without notice or liability. Upon termination, your right to use the Service ceases immediately.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">12. Modifications</h2>
                        <p>We reserve the right to modify these Terms at any time. Changes are effective immediately upon posting. Your continued use constitutes acceptance of modified Terms.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">13. Severability</h2>
                        <p>If any provision is found unenforceable, the remaining provisions shall continue in full force and effect.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">14. Entire Agreement</h2>
                        <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and DataLeash regarding the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">15. Contact</h2>
                        <p>For legal inquiries: <a href="mailto:dataleashowner@gmail.com" className="text-blue-400 hover:underline">dataleashowner@gmail.com</a></p>
                    </section>

                    <div className="pt-6 border-t border-[rgba(0,212,255,0.2)]">
                        <p className="text-sm text-slate-500 mb-4">By clicking &quot;Sign Up&quot;, &quot;Login&quot;, or using the Service, you confirm that:</p>
                        <ul className="text-sm text-slate-400 list-disc list-inside space-y-1 ml-4">
                            <li>You are at least 18 years of age</li>
                            <li>You have legal capacity to enter into binding agreements</li>
                            <li>You have read and understood these Terms</li>
                            <li>You agree to be bound by these Terms and our Privacy Policy</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
