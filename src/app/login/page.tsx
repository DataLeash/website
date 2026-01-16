'use client'

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { DataLeashLogo } from "@/components/DataLeashLogo";
import { Icon3D } from "@/components/Icon3D";
import { createClient } from "@/lib/supabase-browser";

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
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleGoogleSignIn = async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
        if (error) {
            setError(error.message);
        }
    };

    const handleGitHubSignIn = async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
        if (error) {
            setError(error.message);
        }
    };

    const handleDiscordSignIn = async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
        if (error) {
            setError(error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-6 sm:py-12 relative overflow-hidden bg-[#0a1628]">
            {/* Matrix Background - hidden on mobile for performance */}
            <div className="hidden sm:block">
                <MatrixRain />
                <EncryptionParticles />
            </div>

            {/* Gradient Orbs - smaller on mobile */}
            <div className="fixed top-[-200px] left-[-200px] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[radial-gradient(circle,rgba(0,212,255,0.15)_0%,transparent_70%)] animate-pulse-slow pointer-events-none" />
            <div className="fixed bottom-[-200px] right-[-200px] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[radial-gradient(circle,rgba(0,102,255,0.15)_0%,transparent_70%)] animate-pulse-slow pointer-events-none" style={{ animationDelay: '1s' }} />

            <div className="w-full max-w-md relative z-10">
                {/* Logo with glow effect - smaller on mobile */}
                <div className="text-center mb-4 sm:mb-8 animate-fade-in">
                    <Link href="/" className="inline-block group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[var(--primary)] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <DataLeashLogo size={70} className="sm:w-[100px] sm:h-[100px] mx-auto mb-2 sm:mb-4 drop-shadow-[0_0_30px_rgba(0,212,255,0.5)] transform hover:scale-110 transition-transform duration-300" />
                        </div>
                    </Link>
                    <h1 className="text-2xl sm:text-4xl font-bold text-gradient mb-1 sm:mb-2">
                        <TypingText text="SECURE ACCESS" />
                    </h1>
                    <p className="text-[var(--foreground-muted)] flex items-center justify-center gap-2 text-sm sm:text-base">
                        <span className="w-2 h-2 bg-[var(--success)] rounded-full animate-pulse" />
                        Military-Grade Encryption Active
                    </p>
                </div>

                {/* Login Form with glassmorphism */}
                <div className="glass-card p-5 sm:p-8 backdrop-blur-xl border border-[rgba(0,212,255,0.3)] relative overflow-hidden animate-slide-up">
                    {/* Animated border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(0,212,255,0.1)] to-transparent animate-shimmer" />

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 relative z-10">
                        {error && (
                            <div className="bg-[rgba(239,68,68,0.1)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
                                <Icon3D type="danger" size="sm" />
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="group">
                            <label className="block text-sm font-medium mb-2">Email</label>
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
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-4 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.3)] transition-all duration-300"
                                required
                            />
                        </div>

                        {/* Forgot Password */}
                        <div className="flex justify-end text-sm">
                            <Link href="/forgot" className="text-[var(--primary)] hover:underline hover:text-white transition">
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group bg-gradient-to-r from-[var(--primary)] to-[#0066ff] text-black hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] transition-all duration-300"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? 'Signing In...' : 'Sign In'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-3 sm:my-6">
                        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(0,212,255,0.3)] to-transparent flex-1" />
                        <span className="text-[var(--foreground-muted)] text-xs">OR CONTINUE WITH</span>
                        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(0,212,255,0.3)] to-transparent flex-1" />
                    </div>

                    {/* Social Sign-in Options - Grid on mobile for better visibility */}
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-col sm:space-y-2">
                        {/* Google Sign-in */}
                        <button
                            onClick={handleGoogleSignIn}
                            className="glass-card py-3 sm:py-4 rounded-lg font-semibold hover:border-[var(--primary)] hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 group"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="hidden sm:inline group-hover:text-[var(--primary)] transition">Continue with Google</span>
                        </button>

                        {/* GitHub Sign-in */}
                        <button
                            onClick={handleGitHubSignIn}
                            className="glass-card py-3 sm:py-4 rounded-lg font-semibold hover:border-[var(--primary)] hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 group"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            <span className="hidden sm:inline group-hover:text-[var(--primary)] transition">Continue with GitHub</span>
                        </button>

                        {/* Discord Sign-in */}
                        <button
                            onClick={handleDiscordSignIn}
                            className="glass-card py-3 sm:py-4 rounded-lg font-semibold hover:border-[#5865F2] hover:shadow-[0_0_20px_rgba(88,101,242,0.3)] transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 group"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#5865F2">
                                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            <span className="hidden sm:inline group-hover:text-[#5865F2] transition">Continue with Discord</span>
                        </button>
                    </div>
                </div>

                {/* Sign up link */}
                <p className="text-center mt-6 text-[var(--foreground-muted)] animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-[var(--primary)] hover:underline font-semibold hover:text-white transition">
                        Sign up
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
