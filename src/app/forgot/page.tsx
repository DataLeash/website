'use client'

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // In production, this would call the API
        await new Promise(r => setTimeout(r, 1000));
        setSent(true);
        setLoading(false);
    };

    return (
        <div className="gradient-bg min-h-screen flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <Image src="/logo.png" alt="Data Leash" width={80} height={80} className="mx-auto mb-4" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gradient">Reset Password</h1>
                    <p className="text-[var(--foreground-muted)] mt-2">We&apos;ll send you a reset link</p>
                </div>

                <div className="glass-card p-8">
                    {sent ? (
                        <div className="text-center">
                            <div className="text-6xl mb-4">📧</div>
                            <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
                            <p className="text-[var(--foreground-muted)] mb-6">We sent a password reset link to <span className="text-white">{email}</span></p>
                            <Link href="/login" className="glow-button inline-block px-8 py-3 rounded-lg font-semibold text-black">Back to Login</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full glow-button py-4 rounded-lg font-bold text-black disabled:opacity-50">
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center mt-6 text-[var(--foreground-muted)]">
                    Remember your password? <Link href="/login" className="text-[var(--primary)] hover:underline font-semibold">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
