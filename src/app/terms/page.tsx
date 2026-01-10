import Image from "next/image";
import Link from "next/link";

export default function TermsPage() {
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
                <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

                <div className="glass-card p-8 space-y-6 text-[var(--foreground-muted)]">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
                        <p>By accessing and using Data Leash, you agree to be bound by these Terms of Service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
                        <p>Data Leash provides secure file sharing with encryption, access control, and tracking capabilities.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. User Responsibilities</h2>
                        <p>You are responsible for maintaining the security of your account and all activities under your account.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Data Security</h2>
                        <p>We use industry-standard encryption (AES-256-GCM) and 4-key split architecture to protect your files.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Prohibited Uses</h2>
                        <p>You may not use Data Leash for illegal activities, malware distribution, or harassment.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Termination</h2>
                        <p>We reserve the right to terminate accounts that violate these terms without notice.</p>
                    </section>

                    <p className="text-sm pt-4 border-t border-[rgba(0,212,255,0.2)]">Last updated: January 2026</p>
                </div>
            </main>
        </div>
    );
}
