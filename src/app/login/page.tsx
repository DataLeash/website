'use client'

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { DataLeashLogo } from "@/components/DataLeashLogo";
import { Icon3D } from "@/components/Icon3D";

// Matrix rain effect component
function MatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops: number[] = [];

        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100;
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(10, 22, 40, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#00d4ff';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                // Gradient effect - brighter at head
                ctx.fillStyle = `rgba(0, 212, 255, ${Math.random() * 0.5 + 0.2})`;
                ctx.fillText(char, x, y);

                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 50);

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none opacity-30 z-0"
        />
    );
}

// Floating encryption particles - uses client-side only rendering to avoid hydration mismatch
function EncryptionParticles() {
    const [particles, setParticles] = useState<Array<{
        left: string;
        top: string;
        delay: string;
        duration: string;
        text: string;
    }>>([]);

    useEffect(() => {
        // Generate random positions only on client to avoid hydration mismatch
        const texts = ['256-BIT', 'AES', 'RSA', '🔐', 'SHA-512', 'ENCRYPTED', '••••', 'SSL', 'E2E'];
        const generated = [...Array(20)].map(() => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${8 + Math.random() * 8}s`,
            text: texts[Math.floor(Math.random() * texts.length)]
        }));
        setParticles(generated);
    }, []);

    if (particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="absolute text-[var(--primary)] opacity-20 font-mono text-xs animate-float"
                    style={{
                        left: p.left,
                        top: p.top,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                    }}
                >
                    {p.text}
                </div>
            ))}
        </div>
    );
}

// Typing animation for text
function TypingText({ text, className = '' }: { text: string; className?: string }) {
    const [displayText, setDisplayText] = useState('');
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayText(text.slice(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 80);

        const cursorTimer = setInterval(() => setShowCursor(prev => !prev), 500);

        return () => {
            clearInterval(timer);
            clearInterval(cursorTimer);
        };
    }, [text]);

    return (
        <span className={className}>
            {displayText}
            <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>|</span>
        </span>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [encryptingText, setEncryptingText] = useState('');

    // Fake encryption animation when typing password
    useEffect(() => {
        if (password.length > 0) {
            const chars = '•○◉●◎⬤';
            setEncryptingText(
                password.split('').map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
            );
        } else {
            setEncryptingText('');
        }
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn(email, password);

            if (result.error) {
                setError(result.error);
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-[#0a1628]">
            {/* Matrix Background */}
            <MatrixRain />
            <EncryptionParticles />

            {/* Gradient Orbs */}
            <div className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,212,255,0.15)_0%,transparent_70%)] animate-pulse-slow pointer-events-none" />
            <div className="fixed bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,102,255,0.15)_0%,transparent_70%)] animate-pulse-slow pointer-events-none" style={{ animationDelay: '1s' }} />

            <div className="w-full max-w-md relative z-10">
                {/* Logo with glow effect */}
                <div className="text-center mb-8 animate-fade-in">
                    <Link href="/" className="inline-block group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[var(--primary)] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <DataLeashLogo size={100} className="mx-auto mb-4 drop-shadow-[0_0_30px_rgba(0,212,255,0.5)] transform hover:scale-110 transition-transform duration-300" />
                        </div>
                    </Link>
                    <h1 className="text-4xl font-bold text-gradient mb-2">
                        <TypingText text="SECURE ACCESS" />
                    </h1>
                    <p className="text-[var(--foreground-muted)] flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-[var(--success)] rounded-full animate-pulse" />
                        Military-Grade Encryption Active
                    </p>
                </div>

                {/* Login Form with glassmorphism */}
                <div className="glass-card p-8 backdrop-blur-xl border border-[rgba(0,212,255,0.3)] relative overflow-hidden animate-slide-up">
                    {/* Animated border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(0,212,255,0.1)] to-transparent animate-shimmer" />

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        {error && (
                            <div className="bg-[rgba(239,68,68,0.1)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
                                <Icon3D type="danger" size="sm" />
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="group">
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <span className="text-[var(--primary)]">◆</span> Secure Email
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="agent@secure.io"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-4 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.3)] transition-all duration-300 font-mono"
                                    required
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
                                    {email.length > 0 && <span className="text-[var(--success)]">✓</span>}
                                </div>
                            </div>
                        </div>

                        {/* Password with encryption animation */}
                        <div className="group">
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <span className="text-[var(--primary)]">◆</span> Encryption Key
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-4 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.3)] transition-all duration-300 font-mono tracking-widest"
                                    required
                                />
                                {password.length > 0 && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--primary)] font-mono animate-pulse">
                                        ENCRYPTING...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2FA Code */}
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <span className="text-[var(--primary)]">◆</span> 2FA Token <span className="text-[var(--foreground-muted)] text-xs">(if enabled)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="◇ ◇ ◇ ◇ ◇ ◇"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                className="w-full px-4 py-4 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.3)] transition-all duration-300 text-center text-2xl tracking-[1em] font-mono"
                            />
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex justify-between items-center text-sm">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-[rgba(0,212,255,0.3)] bg-transparent accent-[var(--primary)]" />
                                <span className="text-[var(--foreground-muted)] group-hover:text-white transition">Trusted Device</span>
                            </label>
                            <Link href="/forgot" className="text-[var(--primary)] hover:underline hover:text-white transition">
                                Recovery Protocol
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group bg-gradient-to-r from-[var(--primary)] to-[#0066ff] text-black hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] transition-all duration-300"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        AUTHENTICATING...
                                    </>
                                ) : (
                                    <>
                                        <Icon3D type="shield" size="sm" />
                                        INITIATE SECURE LOGIN
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(0,212,255,0.3)] to-transparent flex-1" />
                        <span className="text-[var(--foreground-muted)] text-xs font-mono">ALTERNATIVE ACCESS</span>
                        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(0,212,255,0.3)] to-transparent flex-1" />
                    </div>

                    {/* Biometric */}
                    <button className="w-full glass-card py-4 rounded-lg font-semibold hover:border-[var(--primary)] hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-300 flex items-center justify-center gap-3 group">
                        <Icon3D type="lock" size="sm" />
                        <span className="group-hover:text-[var(--primary)] transition">Biometric Verification</span>
                    </button>
                </div>

                {/* Sign up link */}
                <p className="text-center mt-6 text-[var(--foreground-muted)] animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    New operative?{" "}
                    <Link href="/signup" className="text-[var(--primary)] hover:underline font-semibold hover:text-white transition">
                        Request Access
                    </Link>
                </p>

                {/* Security badge */}
                <div className="text-center mt-8 flex items-center justify-center gap-4 text-xs text-[var(--foreground-muted)] opacity-60">
                    <span className="flex items-center gap-1">🔒 256-bit AES</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">🛡️ Zero-Knowledge</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">⚡ E2E Encrypted</span>
                </div>
            </div>
        </div>
    );
}
