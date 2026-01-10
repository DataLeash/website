import Image from "next/image";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="gradient-bg min-h-screen">
            <header className="p-6 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Data Leash" width={40} height={40} />
                    <span className="font-bold text-gradient">Data Leash</span>
                </Link>
                <Link href="/login" className="glow-button px-6 py-2 rounded-lg font-semibold text-black">Login</Link>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

                <div className="glass-card p-8 space-y-6 text-[var(--foreground-muted)]">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
                        <p>We collect your email, phone number, and National ID for identity verification. File metadata is stored but file contents are encrypted.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
                        <p>Your information is used to provide secure file sharing services, verify your identity, and notify you about file access.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. Zero-Knowledge Architecture</h2>
                        <p>Your files are encrypted with keys that only you control. We cannot access your file contents.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Data Retention</h2>
                        <p>When you delete files, they are permanently destroyed along with all encryption keys.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Access Logging</h2>
                        <p>We log file access events including IP addresses and locations to provide you with security insights.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Third Parties</h2>
                        <p>We do not sell your data. We use Supabase for infrastructure and may use AI services for threat detection.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">7. Your Rights</h2>
                        <p>You can export or delete your data at any time through your account settings.</p>
                    </section>

                    <p className="text-sm pt-4 border-t border-[rgba(0,212,255,0.2)]">Last updated: January 2026</p>
                </div>
            </main>
        </div>
    );
}
