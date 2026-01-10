'use client'

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        countryCode: '+974',
        qid: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signUp(
                formData.email,
                formData.password,
                formData.fullName,
                formData.countryCode + formData.phone,
                formData.qid
            );

            if (result.error) {
                setError(result.error);
            } else {
                setStep(2); // Move to verification step
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="gradient-bg min-h-screen flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <Image src="/logo.png" alt="Data Leash" width={80} height={80} className="mx-auto mb-4" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gradient">
                        {step === 1 ? 'Create Account' : 'Verify Email'}
                    </h1>
                    <p className="text-[var(--foreground-muted)] mt-2">
                        {step === 1 ? 'Start protecting your files' : 'Check your inbox for a verification link'}
                    </p>
                </div>

                {step === 1 ? (
                    /* Signup Form */
                    <div className="glass-card p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-[rgba(239,68,68,0.1)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    placeholder="Your full legal name"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition"
                                    required
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                                <div className="flex gap-2">
                                    <select
                                        name="countryCode"
                                        value={formData.countryCode}
                                        onChange={handleChange}
                                        className="px-3 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none transition"
                                    >
                                        <option value="+974">+974</option>
                                        <option value="+971">+971</option>
                                        <option value="+966">+966</option>
                                        <option value="+1">+1</option>
                                    </select>
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="50 123 4567"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition"
                                        required
                                    />
                                </div>
                            </div>

                            {/* QID */}
                            <div>
                                <label className="block text-sm font-medium mb-2">National ID (QID) *</label>
                                <input
                                    type="text"
                                    name="qid"
                                    placeholder="28XXXXXXXXX"
                                    value={formData.qid}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition"
                                    required
                                />
                                <p className="text-xs text-[var(--foreground-muted)] mt-1">Required for legal verification</p>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Min 12 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    minLength={12}
                                    className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition"
                                    required
                                />
                                {formData.password && formData.password.length < 12 && (
                                    <p className="text-xs text-[var(--warning)] mt-1">Password must be at least 12 characters</p>
                                )}
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-3">
                                <input type="checkbox" className="mt-1 rounded border-[rgba(0,212,255,0.3)] bg-transparent" required />
                                <span className="text-sm text-[var(--foreground-muted)]">
                                    I agree to the{" "}
                                    <Link href="/terms" className="text-[var(--primary)] hover:underline">Terms of Service</Link>
                                    {" "}and{" "}
                                    <Link href="/privacy" className="text-[var(--primary)] hover:underline">Privacy Policy</Link>
                                </span>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full glow-button py-4 rounded-lg font-bold text-black text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Verification Step */
                    <div className="glass-card p-8 text-center">
                        <div className="text-6xl mb-4">📧</div>
                        <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
                        <p className="text-[var(--foreground-muted)] mb-6">
                            We sent a verification link to <span className="text-white font-medium">{formData.email}</span>
                        </p>
                        <p className="text-sm text-[var(--foreground-muted)] mb-6">
                            Click the link in your email to verify your account and complete registration.
                        </p>
                        <Link href="/login" className="glow-button inline-block px-8 py-3 rounded-lg font-semibold text-black">
                            Go to Login
                        </Link>
                    </div>
                )}

                {/* Steps indicator */}
                <div className="mt-6 glass-card p-4">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-[var(--primary)] text-black' : 'border border-[var(--primary)]'}`}>1</span>
                            <span>Register</span>
                        </div>
                        <div className="h-px w-8 bg-[rgba(0,212,255,0.3)]"></div>
                        <div className={`flex items-center gap-2 ${step < 2 ? 'opacity-50' : ''}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-[var(--primary)] text-black' : 'border border-[var(--primary)]'}`}>2</span>
                            <span>Verify</span>
                        </div>
                        <div className="h-px w-8 bg-[rgba(0,212,255,0.3)]"></div>
                        <div className={`flex items-center gap-2 ${step < 3 ? 'opacity-50' : ''}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-[var(--primary)] text-black' : 'border border-[var(--primary)]'}`}>3</span>
                            <span>2FA</span>
                        </div>
                    </div>
                </div>

                {/* Login link */}
                <p className="text-center mt-6 text-[var(--foreground-muted)]">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[var(--primary)] hover:underline font-semibold">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
