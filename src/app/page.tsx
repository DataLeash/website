'use client'

import Link from "next/link";
import { useState } from "react";
import dynamic from 'next/dynamic'
import { createClient } from "@/lib/supabase-browser";
import { DataLeashLogo } from "@/components/DataLeashLogo";
import { HomePageEffects } from "@/components/HomePageEffects";
import { LiveActivityTicker } from "@/components/LiveActivityTicker";
import {
  Shield, Lock, Eye, Zap, Cloud, BarChart3,
  KeyRound, Skull, Brain, Cpu, Camera,
  ChevronDown, ChevronUp, Github, Linkedin,
  MessageCircle, ExternalLink, Quote,
  FileKey, Users, Globe as GlobeIcon, Clock, Check, PlayCircle, CreditCard
} from "lucide-react";

// Dynamically import Globe3D to avoid server-side issues
const Globe3D = dynamic(() => import('@/components/Globe3D').then(mod => mod.Globe3D), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-900/20 animate-pulse rounded-full" />
})

// Dummy data for the Globe
const DUMMY_LOCATIONS = [
  { id: '1', lat: 40.7128, lon: -74.0060, city: 'New York', country: 'USA', isActive: true, isBlocked: false, viewerCount: 12 },
  { id: '2', lat: 51.5074, lon: -0.1278, city: 'London', country: 'UK', isActive: true, isBlocked: false, viewerCount: 8 },
  { id: '3', lat: 35.6762, lon: 139.6503, city: 'Tokyo', country: 'Japan', isActive: true, isBlocked: false, viewerCount: 5 },
  { id: '4', lat: 55.7558, lon: 37.6173, city: 'Moscow', country: 'Russia', isActive: false, isBlocked: true, viewerCount: 2 },
  { id: '5', lat: -33.8688, lon: 151.2093, city: 'Sydney', country: 'Australia', isActive: true, isBlocked: false, viewerCount: 3 },
  { id: '6', lat: 48.8566, lon: 2.3522, city: 'Paris', country: 'France', isActive: true, isBlocked: false, viewerCount: 6 },
  { id: '7', lat: 31.2304, lon: 121.4737, city: 'Shanghai', country: 'China', isActive: false, isBlocked: true, viewerCount: 15 },
  { id: '8', lat: 19.0760, lon: 72.8777, city: 'Mumbai', country: 'India', isActive: true, isBlocked: false, viewerCount: 9 },
  { id: '9', lat: -23.5505, lon: -46.6333, city: 'São Paulo', country: 'Brazil', isActive: true, isBlocked: false, viewerCount: 4 },
  { id: '10', lat: 25.2048, lon: 55.2708, city: 'Dubai', country: 'UAE', isActive: true, isBlocked: false, viewerCount: 7 },
]



// Feature data
// Feature data
const features = [
  {
    icon: KeyRound,
    title: "Impossible Math",
    description: "Four keys. Four locations. Zero possibility of brute force. Unless an attacker controls the user, server, device, and runtime simultaneously, the data doesn't exist.",
    color: "text-blue-400",
    border: "group-hover:border-blue-500/50",
    bg: "group-hover:bg-blue-500/10"
  },
  {
    icon: Skull,
    title: "The Kill Switch",
    description: "Nuke access globally in milliseconds. Whether the file is downloaded, open, or halfway across the world—when you say stop, it vanishes.",
    color: "text-red-500",
    border: "group-hover:border-red-500/50",
    bg: "group-hover:bg-red-500/10"
  },
  {
    icon: Brain,
    title: "Active Threat Neutralization",
    description: "Our neural network watches the watcher. If the behavior, location, or device integrity looks wrong, we lock the door before they even knock.",
    color: "text-purple-400",
    border: "group-hover:border-purple-500/50",
    bg: "group-hover:bg-purple-500/10"
  },
  {
    icon: Cpu,
    title: "Ghost Execution",
    description: "Files live in RAM, never on disk. When the session ends, we verify a zero-fill wipe. There is literally nothing left to recover.",
    color: "text-emerald-400",
    border: "group-hover:border-emerald-500/50",
    bg: "group-hover:bg-emerald-500/10"
  },
  {
    icon: Camera,
    title: "Blackout Technology",
    description: "We blind the OS. Snipping tools, screen recorders, and capture APIs return black pixels. If they try to look, the screen goes dark.",
    color: "text-orange-400",
    border: "group-hover:border-orange-500/50",
    bg: "group-hover:bg-orange-500/10"
  },
  {
    icon: BarChart3,
    title: "Forensic Omniscience",
    description: "See everything. Every IP, every device fingerprint, every second of access logged in an immutable ledger. You'll know who, when, and exactly where.",
    color: "text-pink-400",
    border: "group-hover:border-pink-500/50",
    bg: "group-hover:bg-pink-500/10"
  }
];

// FAQ Accordion Component
function FAQItem({ question, answer, isOpen, onClick }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="glass-card overflow-hidden hover:bg-slate-800/30 transition-colors">
      <button
        onClick={onClick}
        className="w-full px-6 py-6 flex items-center justify-between text-left"
      >
        <span className="text-base font-semibold text-slate-200">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-slate-800/50 pt-4">
          {answer}
        </div>
      </div>
    </div>
  );
}

// import { GlitchText } from "@/components/GlitchText"; // Removed
import { SecurityHUD } from "@/components/SecurityHUD";
import { EncryptedText } from "@/components/EncryptedText";
import { AIChatbot } from "@/components/AIChatbot";
import { SecurityProtocols } from "@/components/SecurityProtocols";
import { MissionSection } from "@/components/MissionSection";

// ... (imports remain)

export default function HomePage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [isAttackMode, setIsAttackMode] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCopyDiscord = () => {
    navigator.clipboard.writeText('ashenone616');
    setDiscordCopied(true);
    setTimeout(() => setDiscordCopied(false), 2000);
  };

  const handleNewsletterSubmit = async () => {
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    setNewsletterStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      if (res.ok) {
        setNewsletterStatus('success');
        setNewsletterEmail('');
        setTimeout(() => setNewsletterStatus('idle'), 3000);
      } else {
        setNewsletterStatus('error');
      }
    } catch {
      setNewsletterStatus('error');
    }
  };

  return (
    <div className="gradient-bg min-h-screen relative overflow-hidden flex flex-col font-sans selection:bg-blue-500/30">
      <SecurityHUD />

      {/* Background Effects */}
      <HomePageEffects />

      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <DataLeashLogo size={28} />
              <span className="font-bold text-lg text-white">DataLeash</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className="text-slate-400 hover:text-white transition">Features</a>
              <a href="#how-it-works" className="text-slate-400 hover:text-white transition">How It Works</a>
              <a href="#pricing" className="text-slate-400 hover:text-white transition">Pricing</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition hidden sm:block">Login</Link>
            <Link href="/signup" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-full transition-all">
              Start Free
            </Link>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white transition"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/50 animate-fade-in">
            <nav className="flex flex-col px-6 py-4 gap-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-2 transition">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-2 transition">How It Works</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-2 transition">Pricing</a>
              <hr className="border-slate-800 my-2" />
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-2 transition">Login</Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="bg-blue-600 hover:bg-blue-500 text-white text-center py-3 rounded-lg font-semibold transition">
                Start Free
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ... (Ticker and Nav remain) */}

      <main className="flex-grow pt-24">
        {/* Hero Section */}
        <section className="px-6 min-h-[90vh] flex items-center relative">
          <div className="max-w-[1400px] mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Text Content */}
            <div className="text-left relative z-20 pt-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-8">
                <Shield className="w-3 h-3" />
                Enterprise Grade Security
              </div>

              {/* Main Headline */}
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-8 leading-[1.1]">
                {/* 1st Line */}
                <div className="flex flex-wrap gap-x-6">
                  <EncryptedText text="Own It." startDelay={0} className="inline-block" />
                  <span className="">
                    <EncryptedText text="Control It." startDelay={700} />
                  </span>
                </div>

                {/* 2nd Line */}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 inline-block">
                  <EncryptedText text="Revoke It." startDelay={1400} />
                </span>
              </h1>
              <p className="text-xl text-slate-400 mb-10 max-w-2xl font-light leading-relaxed">
                <EncryptedText text="The Final Word on Your Files." startDelay={2500} />
              </p>

              {/* Add global fade-in keyframe if not present */}
              <style jsx global>{`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 group">
                  Start Leashing
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                </Link>

                {/* OAuth Buttons Row */}
                <div className="flex items-center gap-2">
                  {/* Google */}
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
                      });
                    }}
                    className="w-12 h-12 bg-white hover:bg-gray-50 rounded-full font-bold transition-all flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-110"
                    title="Continue with Google"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </button>

                  {/* GitHub */}
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signInWithOAuth({
                        provider: 'github',
                        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
                      });
                    }}
                    className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-full font-bold transition-all flex items-center justify-center border border-slate-600 shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:scale-110"
                    title="Continue with GitHub"
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </button>

                  {/* Discord */}
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signInWithOAuth({
                        provider: 'discord',
                        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
                      });
                    }}
                    className="w-12 h-12 bg-[#5865F2] hover:bg-[#4752C4] rounded-full font-bold transition-all flex items-center justify-center shadow-[0_0_15px_rgba(88,101,242,0.3)] hover:shadow-[0_0_25px_rgba(88,101,242,0.5)] hover:scale-110"
                    title="Continue with Discord"
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </button>
                </div>
              </div>

            </div>

            {/* Mobile: Hero Visual (shown only on mobile) */}
            <div className="lg:hidden relative h-[350px] w-full flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-cyan-600/10 rounded-3xl" />
              <div className="relative text-center">
                <div className="w-32 h-32 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse" />
                  <div className="absolute inset-4 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                    <Shield className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute inset-0 border-2 border-blue-400/30 rounded-full animate-spin" style={{ animationDuration: '10s' }} />
                </div>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                  Enterprise-grade file protection with real-time monitoring
                </p>
              </div>
            </div>

            {/* Right: Globe 3D with Toggle (Desktop only) */}
            <div className="relative h-[550px] w-full lg:block hidden">

              {/* Toggle Controls */}
              <div className="absolute top-4 right-4 z-30 flex gap-2">
                <button
                  onClick={() => setIsAttackMode(false)}
                  aria-pressed={!isAttackMode}
                  aria-label="View secure traffic mode"
                  className={`px-3 py-1 text-xs font-bold rounded border backdrop-blur-md transition-all ${!isAttackMode ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-black/40 border-slate-700 text-slate-500'}`}
                >
                  SECURE TRAFFIC
                </button>
                <button
                  onClick={() => setIsAttackMode(true)}
                  aria-pressed={isAttackMode}
                  aria-label="View threat map mode"
                  className={`px-3 py-1 text-xs font-bold rounded border backdrop-blur-md transition-all ${isAttackMode ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-black/40 border-slate-700 text-slate-500'}`}
                >
                  THREAT MAP
                </button>
              </div>

              {/* Globe renders with transparent background - no dark backdrop */}
              <div className="relative w-full h-full grayscale-[0.3] hover:grayscale-0 transition-all duration-700 opacity-90">
                <Globe3D locations={DUMMY_LOCATIONS} isAttackMode={isAttackMode} />
              </div>
            </div>

          </div>
        </section>

        {/* Stats Section - Glowing Container */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-blue-500/20 rounded-2xl blur-xl" />
            <div className="relative rounded-2xl border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div className="group">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">2.5K+</div>
                  <div className="text-sm text-slate-400">Files Protected</div>
                </div>
                <div className="group">
                  <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2 animate-pulse">&lt;100ms</div>
                  <div className="text-sm text-slate-400">Kill Switch Speed</div>
                </div>
                <div className="group">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">24/7</div>
                  <div className="text-sm text-slate-400">Active Monitoring</div>
                </div>
                <div className="group">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">256-bit</div>
                  <div className="text-sm text-slate-400">AES Encryption</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-slate-400 max-w-xl mx-auto">Three simple steps to total control</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center group relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 rounded-2xl border border-blue-500/20 bg-slate-900/50 backdrop-blur-sm group-hover:border-blue-500/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                    <FileKey className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-xs text-blue-400 font-mono mb-2">STEP 01</div>
                  <h3 className="text-xl font-bold text-white mb-3">Upload & Encrypt</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Upload any file. We split it with military-grade encryption across 4 locations. No single point has the complete key.</p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="text-center group relative">
                <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 rounded-2xl border border-purple-500/20 bg-slate-900/50 backdrop-blur-sm group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all">
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="text-xs text-purple-400 font-mono mb-2">STEP 02</div>
                  <h3 className="text-xl font-bold text-white mb-3">Set Policies & Share</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Define who can access, from where, and for how long. Enable OTP, watermarks, or geo-restrictions. Share via link or email.</p>
                </div>
              </div>
              {/* Step 3 */}
              <div className="text-center group relative">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 rounded-2xl border border-emerald-500/20 bg-slate-900/50 backdrop-blur-sm group-hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                    <Eye className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-xs text-emerald-400 font-mono mb-2">STEP 03</div>
                  <h3 className="text-xl font-bold text-white mb-3">Monitor & Revoke</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Watch access in real-time. See every view, every screenshot attempt. Hit the kill switch anytime to revoke access globally.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table - Glowing Container */}
        <section className="py-24 px-6">
          <div className="max-w-[900px] mx-auto relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-emerald-500/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 shadow-[0_0_60px_rgba(59,130,246,0.1)]">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why DataLeash?</h2>
                <p className="text-slate-400">What happens after you hit &quot;send&quot;</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-4 px-4 text-slate-400 font-medium">Feature</th>
                      <th className="py-4 px-4 text-slate-400 font-medium text-center">Traditional</th>
                      <th className="py-4 px-4 text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 animate-pulse">DataLeash</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-300">Remote File Destruction</td>
                      <td className="py-4 px-4 text-center text-red-400 text-lg">✗</td>
                      <td className="py-4 px-4 text-center text-emerald-400 text-lg font-bold">✓</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-300">Instant Global Revocation</td>
                      <td className="py-4 px-4 text-center text-red-400 text-lg">✗</td>
                      <td className="py-4 px-4 text-center text-emerald-400 text-lg font-bold">✓</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-300">Anti-Capture & DRM Shielding</td>
                      <td className="py-4 px-4 text-center text-red-400 text-lg">✗</td>
                      <td className="py-4 px-4 text-center text-emerald-400 text-lg font-bold">✓</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-300">Live Forensic Access Logs</td>
                      <td className="py-4 px-4 text-center text-red-400 text-lg">✗</td>
                      <td className="py-4 px-4 text-center text-emerald-400 text-lg font-bold">✓</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-300">Stealer & Bot Fingerprinting</td>
                      <td className="py-4 px-4 text-center text-red-400 text-lg">✗</td>
                      <td className="py-4 px-4 text-center text-emerald-400 text-lg font-bold">✓</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-300">AI-Driven Threat Neutralization</td>
                      <td className="py-4 px-4 text-center text-red-400 text-lg">✗</td>
                      <td className="py-4 px-4 text-center text-emerald-400 text-lg font-bold">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Mission / About Section */}
        <MissionSection />

        {/* Features Grid */}
        <section id="features" className="py-32 px-6 bg-slate-950 border-y border-slate-800 relative z-10 shadow-2xl">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-white">
                  Zero-Trust Architecture.
                </h2>
                <p className="text-slate-300 max-w-xl text-lg font-medium">
                  Encryption is standard. We engineer the environment.
                </p>
              </div>
              <div className="text-right hidden md:block">
                <div className="text-4xl font-bold text-blue-500 mb-1">6</div>
                <div className="text-sm text-slate-400 uppercase tracking-widest font-semibold">Security Layers</div>
              </div>
            </div>

            {/* Inject Scanner CSS */}
            <style jsx global>{`
              @keyframes scan {
                0% { transform: translateY(-100%); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(100%); opacity: 0; }
              }
              .animate-scan {
                animation: scan 2.5s linear infinite;
              }
            `}</style>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div key={i} className={`group p-8 rounded-2xl bg-slate-900 border border-slate-800 transition-all duration-300 shadow-lg hover:shadow-2xl ${feature.border} ${feature.bg} relative overflow-hidden`}>

                  {/* Scanner Effect */}
                  <div className={`absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-transparent via-${feature.color.split('-')[1]}-500/10 to-transparent -translate-y-full group-hover:animate-scan pointer-events-none`} />
                  <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-${feature.color.split('-')[1]}-400 to-transparent -translate-y-full group-hover:animate-scan opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[0_0_15px_rgba(255,255,255,0.5)]`} />

                  {/* Internal Glow Blob */}
                  <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl ${feature.color.replace('text-', 'bg-')}`} />

                  <feature.icon className={`w-8 h-8 ${feature.color} mb-6 relative z-10 transition-transform duration-300 group-hover:scale-110`} />

                  <h3 className="text-xl font-bold mb-3 text-white relative z-10 min-h-[1.75rem]">
                    <EncryptedText text={feature.title} hoverOnly={true} />
                  </h3>

                  <p className="text-slate-300 leading-relaxed text-sm font-medium relative z-10">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Protocols / FAQ */}
        <SecurityProtocols />

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
              <p className="text-slate-400 max-w-xl mx-auto">Start free. Upgrade when you need more power.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Free Tier */}
              <div className="relative group">
                <div className="absolute inset-0 bg-slate-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative rounded-2xl bg-slate-900/70 border border-slate-700/50 p-8 backdrop-blur-sm group-hover:border-slate-600 group-hover:shadow-[0_0_30px_rgba(100,116,139,0.15)] transition-all duration-300 h-full">
                  <div className="text-sm text-slate-400 font-medium mb-2">STARTER</div>
                  <div className="text-4xl font-bold text-white mb-1">Free</div>
                  <div className="text-sm text-slate-500 mb-6">Forever</div>
                  <ul className="space-y-3 mb-8 text-sm">
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-emerald-400" /> 5 protected files</li>
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-emerald-400" /> Basic analytics</li>
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-emerald-400" /> Email OTP verification</li>
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-emerald-400" /> 7-day access logs</li>
                  </ul>
                  <Link href="/signup" className="block w-full py-3 text-center rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 transition-all font-semibold">
                    Get Started
                  </Link>
                </div>
              </div>

              {/* Pro Tier - Featured */}
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-cyan-500/5 rounded-2xl" />
                <div className="relative rounded-2xl border border-blue-500/40 bg-slate-900/80 p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(59,130,246,0.2)] group-hover:shadow-[0_0_80px_rgba(59,130,246,0.3)] transition-all duration-300 h-full">
                  <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-400 text-[10px] font-bold text-white rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]">POPULAR</div>
                  <div className="text-sm text-blue-400 font-medium mb-2">PRO</div>
                  <div className="text-4xl font-bold text-white mb-1">$29<span className="text-lg text-slate-400">/mo</span></div>
                  <div className="text-sm text-slate-500 mb-6">Per user, billed annually</div>
                  <ul className="space-y-3 mb-8 text-sm">
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-blue-400" /> Unlimited files</li>
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-blue-400" /> Kill switch</li>
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-blue-400" /> AI threat detection</li>
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-blue-400" /> Screenshot blocking</li>
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-blue-400" /> Priority support</li>
                  </ul>
                  <Link href="/upgrade" className="block w-full py-3 text-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white transition-all font-semibold shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)]">
                    Upgrade to Pro
                  </Link>
                </div>
              </div>

              {/* Enterprise Tier */}
              <div className="relative group">
                <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative rounded-2xl bg-slate-900/70 border border-slate-700/50 p-8 backdrop-blur-sm group-hover:border-purple-500/30 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 h-full">
                  <div className="text-sm text-purple-400 font-medium mb-2">ENTERPRISE</div>
                  <div className="text-4xl font-bold text-white mb-1">Custom</div>
                  <div className="text-sm text-slate-500 mb-6">Contact for pricing</div>
                  <ul className="space-y-3 mb-8 text-sm">
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-purple-400" /> Everything in Pro</li>
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-purple-400" /> SSO / SAML</li>
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-purple-400" /> Dedicated support</li>
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-purple-400" /> Custom integrations</li>
                    <li className="flex items-center gap-2 text-slate-300"><Check className="w-4 h-4 text-purple-400" /> SLA guarantee</li>
                  </ul>
                  <button className="block w-full py-3 text-center rounded-full border border-purple-500/30 text-slate-300 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all font-semibold">
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Premium & Attractive */}
        <section className="py-32 px-6 relative z-10">
          <div className="max-w-5xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-700" />
            <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-12 md:p-20 text-center overflow-hidden backdrop-blur-xl">

              {/* Subtle background grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none" />

              <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tighter text-white relative z-10">
                Sent Doesn't Mean <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Gone.</span>
              </h2>
              <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed relative z-10">
                Retain absolute ownership of your files even <em className="text-slate-200 not-italic">after</em> they leave your device. Share freely, revoke instantly.
              </p>

              <Link
                href="/signup"
                className="relative z-10 inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-slate-950 bg-white rounded-full hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
              >
                Start Leashing Data
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Enhanced */}
      <footer className="py-16 px-6 border-t border-slate-900 bg-slate-950">
        <div className="max-w-[1400px] mx-auto">
          {/* Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <DataLeashLogo size={28} />
                <span className="font-bold text-lg text-white">DataLeash</span>
              </div>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Own it. Control it. Revoke it.<br />The final word on your files.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><a href="mailto:dataleashowner@gmail.com" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Stay Updated</h4>
              <p className="text-xs text-slate-500 mb-3">Get security tips and product updates.</p>
              {newsletterStatus === 'success' ? (
                <div className="text-emerald-400 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" /> Subscribed!
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNewsletterSubmit()}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleNewsletterSubmit}
                    disabled={newsletterStatus === 'loading'}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    {newsletterStatus === 'loading' ? '...' : '→'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">

            {/* Developer Attribution Bar */}
            <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-center items-center gap-6">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span>Forged by</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-bold drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">soul-less-king</span>
              </div>

              <div className="flex items-center gap-6">
                {/* 3D Button Style */}
                <a href="https://github.com/soul-less-king" target="_blank" className="group relative w-10 h-10 perspective-1000" title="GitHub">
                  <div className="absolute inset-0 bg-slate-800 rounded-xl transform rotate-x-12 translate-y-1 transition-transform group-hover:translate-y-2 group-hover:rotate-x-0 shadow-[0_5px_0_rgb(15,23,42),0_10px_10px_rgba(0,0,0,0.5)]"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center border-t border-slate-600 transform group-hover:translate-y-1 transition-transform z-10">
                    <Github className="w-5 h-5 text-slate-300 group-hover:text-white" />
                  </div>
                </a>

                <a href="https://www.linkedin.com/in/hadi-sleiman-92781825b/" target="_blank" className="group relative w-10 h-10 perspective-1000" title="LinkedIn">
                  <div className="absolute inset-0 bg-blue-900/50 rounded-xl transform rotate-x-12 translate-y-1 transition-transform group-hover:translate-y-2 group-hover:rotate-x-0 shadow-[0_5px_0_rgb(30,58,138),0_10px_10px_rgba(0,0,0,0.5)]"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-900/40 rounded-xl flex items-center justify-center border-t border-blue-500/30 transform group-hover:translate-y-1 transition-transform z-10 backdrop-blur-md">
                    <Linkedin className="w-5 h-5 text-blue-400 group-hover:text-blue-100" />
                  </div>
                </a>

                <button
                  onClick={handleCopyDiscord}
                  className="relative group cursor-pointer w-10 h-10 perspective-1000 border-none outline-none appearance-none p-0"
                >
                  <div className="absolute inset-0 bg-indigo-900/50 rounded-xl transform rotate-x-12 translate-y-1 transition-transform group-hover:translate-y-2 group-hover:rotate-x-0 shadow-[0_5px_0_rgb(49,46,129),0_10px_10px_rgba(0,0,0,0.5)]"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-indigo-900/40 rounded-xl flex items-center justify-center border-t border-indigo-500/30 transform group-hover:translate-y-1 transition-transform z-10 backdrop-blur-md">
                    {discordCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <MessageCircle className="w-5 h-5 text-indigo-400 group-hover:text-indigo-100" />}
                  </div>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1 text-xs font-mono bg-indigo-900 text-indigo-200 border border-indigo-500/30 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-[0_0_15px_rgba(99,102,241,0.5)] z-20">
                    {discordCopied ? <span className="text-emerald-400 font-bold">COPIED!</span> : <>ashenone616 <span className="text-indigo-400 text-[10px] ml-1">(Click to Copy)</span></>}
                  </span>
                </button>

                <a href="https://www.paypal.com/paypalme/xhadiii" target="_blank" className="group relative w-10 h-10 perspective-1000" title="PayPal">
                  <div className="absolute inset-0 bg-[#003087]/50 rounded-xl transform rotate-x-12 translate-y-1 transition-transform group-hover:translate-y-2 group-hover:rotate-x-0 shadow-[0_5px_0_rgb(0,48,135),0_10px_10px_rgba(0,0,0,0.5)]"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#003087]/20 to-[#009cde]/40 rounded-xl flex items-center justify-center border-t border-[#009cde]/30 transform group-hover:translate-y-1 transition-transform z-10 backdrop-blur-md">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#009cde] group-hover:text-white transition-colors" role="img" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 0.467 4.214-.407 0.873-.996 1.638-1.748 2.257-2.73 2.24-6.726 2.05-6.726 2.05l-0.544 1.93-0.544 2.89H11.5c0.528 0 0.902 0.354 0.767 0.86l-0.644 2.14c-0.12 0.47-0.58 0.77-1.07 0.77H7.714a.641.641 0 0 1-.638-.76l0.203-0.78z" />
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <AIChatbot />
    </div>
  );
}
