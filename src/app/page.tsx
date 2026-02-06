'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from 'next/dynamic'
import { DataLeashLogo } from "@/components/DataLeashLogo";
import { HomePageEffects } from "@/components/HomePageEffects";
import { LiveActivityTicker } from "@/components/LiveActivityTicker";
import {
  Shield, Lock, Eye, Zap, Cloud, BarChart3,
  KeyRound, Skull, Brain, Cpu, Camera,
  ChevronDown, ChevronUp, Github, Linkedin,
  MessageCircle, ExternalLink, Quote,
  FileKey, Users, Globe as GlobeIcon, Clock, Check, PlayCircle, CreditCard, Monitor
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
    title: "Complete Control",
    description: "Your classified documents and sensitive files remain under your absolute control—even after sharing with external parties.",
    color: "text-blue-400",
    border: "group-hover:border-blue-500/50",
    bg: "group-hover:bg-blue-500/10"
  },
  {
    icon: Skull,
    title: "Instant Access Control",
    description: "Revoke access to any document instantly, anywhere in the world. When clearance is withdrawn, the file becomes inaccessible immediately.",
    color: "text-red-500",
    border: "group-hover:border-red-500/50",
    bg: "group-hover:bg-red-500/10"
  },
  {
    icon: Brain,
    title: "Intelligent Security",
    description: "Advanced protection that identifies and blocks unauthorized access attempts before they happen. Trust verification at every step.",
    color: "text-purple-400",
    border: "group-hover:border-purple-500/50",
    bg: "group-hover:bg-purple-500/10"
  },
  {
    icon: Cpu,
    title: "Secure Viewing",
    description: "Documents are viewed securely without ever being stored on the recipient's device. No local copies, no data residue.",
    color: "text-emerald-400",
    border: "group-hover:border-emerald-500/50",
    bg: "group-hover:bg-emerald-500/10"
  },
  {
    icon: Camera,
    title: "Screenshot Protection",
    description: "Prevent unauthorized copying and screen capture. Sensitive visuals stay protected from data exfiltration attempts.",
    color: "text-orange-400",
    border: "group-hover:border-orange-500/50",
    bg: "group-hover:bg-orange-500/10"
  },
  {
    icon: BarChart3,
    title: "Full Audit Trail",
    description: "Complete visibility into who accessed your files, when, and from where. Meet compliance requirements with comprehensive logging.",
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
import { MissionSection } from "@/components/MissionSection";
import { DemoRequestForm } from "@/components/DemoRequestForm";

// Hook for dynamic base path (works locally and on GitHub Pages)
function useBasePath() {
  const [basePath, setBasePath] = useState('')
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/website')) {
      setBasePath('/website')
    }
  }, [])
  return basePath
}

export default function HomePage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [isAttackMode, setIsAttackMode] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const basePath = useBasePath();

  const handleCopyDiscord = () => {
    navigator.clipboard.writeText('ashenone616');
    setDiscordCopied(true);
    setTimeout(() => setDiscordCopied(false), 2000);
  };

  return (
    <div className="gradient-bg min-h-screen relative overflow-hidden flex flex-col font-sans selection:bg-blue-500/30">
      <SecurityHUD />

      {/* Background Effects */}
      <HomePageEffects />

      {/* Navigation Header - Enhanced */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/70 border-b border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <DataLeashLogo size={28} />
              </div>
              <span className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors">DataLeash</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <a href="#features" className="px-4 py-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">Features</a>
              <a href="#how-it-works" className="px-4 py-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">How It Works</a>
              <a href="#pricing" className="px-4 py-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">Pricing</a>
              <Link href="/faq" className="px-4 py-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">FAQ</Link>
              <a href="#founder" className="px-4 py-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">Founder</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
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

        {/* Mobile Menu Dropdown - Enhanced */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-black/90 backdrop-blur-xl border-b border-blue-500/20 shadow-[0_10px_30px_rgba(59,130,246,0.1)] animate-fade-in">
            <nav className="flex flex-col px-6 py-4 gap-1">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 py-3 px-4 rounded-lg transition-all">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 py-3 px-4 rounded-lg transition-all">How It Works</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 py-3 px-4 rounded-lg transition-all">Pricing</a>
              <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 py-3 px-4 rounded-lg transition-all">FAQ</Link>
              <a href="#founder" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 py-3 px-4 rounded-lg transition-all">Founder</a>
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
              {/* Badge - Enhanced */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-8 shadow-[0_0_20px_rgba(59,130,246,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
                <Shield className="w-3.5 h-3.5 drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]" />
                <span className="drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]">Defense-Grade Protection</span>
              </div>

              {/* Main Headline - Enhanced with glow effects */}
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-8 leading-[1.1]">
                {/* 1st Line */}
                <div className="flex flex-wrap gap-x-6">
                  <span className="drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    <EncryptedText text="Own It." startDelay={0} className="inline-block" />
                  </span>
                  <span className="drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    <EncryptedText text="Control It." startDelay={700} />
                  </span>
                </div>

                {/* 2nd Line - Enhanced gradient with glow */}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 inline-block animate-gradient-shift drop-shadow-[0_0_40px_rgba(59,130,246,0.5)]" style={{ backgroundSize: '200% 100%' }}>
                  <EncryptedText text="Revoke It." startDelay={1400} />
                </span>
              </h1>
              <p className="text-xl text-slate-400 mb-10 max-w-2xl font-light leading-relaxed drop-shadow-[0_0_10px_rgba(148,163,184,0.2)]">
                <EncryptedText text="Trusted by Defense, Government & Critical Infrastructure." startDelay={2500} />
              </p>

              {/* Add global fade-in keyframe if not present */}
              <style jsx global>{`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                @keyframes gradient-shift {
                  0%, 100% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                }
                .animate-gradient-shift {
                  animation: gradient-shift 3s ease-in-out infinite;
                }
              `}</style>

                {/* CTA Button - Enhanced with stronger glow */}
                <Link href="#features" className="relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white rounded-full font-bold transition-all shadow-[0_0_30px_rgba(59,130,246,0.4),0_0_60px_rgba(59,130,246,0.2)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6),0_0_80px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10">Explore Features</span>
                  <ChevronDown className="w-5 h-5 relative z-10 group-hover:translate-y-1 transition-transform drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
                </Link>


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


        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 px-6">
          <div className="max-w-[1200px] mx-auto">
            {/* Section Header with Container */}
            <div className="text-center mb-16 relative">
              {/* Outer Glow Effect */}
              <div className="absolute inset-0 bg-blue-600/10 rounded-2xl blur-2xl mx-auto max-w-md" />
              <div className="inline-block px-12 py-8 rounded-2xl bg-black/60 backdrop-blur-xl border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.15),0_0_80px_rgba(59,130,246,0.05),inset_0_1px_0_rgba(255,255,255,0.05)] relative card-shine">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
                <p className="text-slate-500 max-w-xl mx-auto">Three simple steps to total control</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center relative">
                <div className="absolute inset-0 bg-blue-600/5 rounded-2xl blur-2xl" />
                <div className="relative p-6 rounded-2xl border border-blue-500/20 bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.03)] card-shine">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-black/80 border border-blue-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3),inset_0_0_20px_rgba(59,130,246,0.1)]">
                    <FileKey className="w-8 h-8 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  </div>
                  <div className="text-xs text-blue-400 font-mono mb-2 tracking-widest drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]">STEP 01</div>
                  <h3 className="text-xl font-bold text-white mb-3">Upload & Secure</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Upload your sensitive documents. We apply defense-grade protection automatically.</p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="text-center relative">
                <div className="absolute inset-0 bg-blue-600/5 rounded-2xl blur-2xl" />
                <div className="relative p-6 rounded-2xl border border-blue-500/20 bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.03)] card-shine" style={{ animationDelay: '2s' }}>
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-black/80 border border-blue-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3),inset_0_0_20px_rgba(59,130,246,0.1)]">
                    <Users className="w-8 h-8 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  </div>
                  <div className="text-xs text-blue-400 font-mono mb-2 tracking-widest drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]">STEP 02</div>
                  <h3 className="text-xl font-bold text-white mb-3">Control Access</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Define exactly who can view your documents. Every access request requires your explicit approval.</p>
                </div>
              </div>
              {/* Step 3 */}
              <div className="text-center relative">
                <div className="absolute inset-0 bg-blue-600/5 rounded-2xl blur-2xl" />
                <div className="relative p-6 rounded-2xl border border-blue-500/20 bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.03)] card-shine" style={{ animationDelay: '4s' }}>
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-black/80 border border-blue-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3),inset_0_0_20px_rgba(59,130,246,0.1)]">
                    <Eye className="w-8 h-8 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  </div>
                  <div className="text-xs text-blue-400 font-mono mb-2 tracking-widest drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]">STEP 03</div>
                  <h3 className="text-xl font-bold text-white mb-3">Monitor & Revoke</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Track all access in real-time. Revoke permissions instantly when needed—the document becomes immediately inaccessible.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table - Glowing Container */}
        <section className="py-24 px-6">
          <div className="max-w-[900px] mx-auto relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-blue-600/5 rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl border border-blue-500/20 bg-black/70 backdrop-blur-xl p-8 md:p-12 shadow-[0_0_40px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.03)] card-shine">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why DataLeash?</h2>
                <p className="text-slate-500">What happens after you hit &quot;send&quot;</p>
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
                      <td className="py-4 px-4 text-slate-300">Owner-Controlled Access</td>
                      <td className="py-4 px-4 text-center text-red-400 text-lg">✗</td>
                      <td className="py-4 px-4 text-center text-emerald-400 text-lg font-bold">✓</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-300">Instant Revocation</td>
                      <td className="py-4 px-4 text-center text-red-400 text-lg">✗</td>
                      <td className="py-4 px-4 text-center text-emerald-400 text-lg font-bold">✓</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-300">Screenshot Prevention</td>
                      <td className="py-4 px-4 text-center text-red-400 text-lg">✗</td>
                      <td className="py-4 px-4 text-center text-emerald-400 text-lg font-bold">✓</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-300">Complete Audit Trail</td>
                      <td className="py-4 px-4 text-center text-red-400 text-lg">✗</td>
                      <td className="py-4 px-4 text-center text-emerald-400 text-lg font-bold">✓</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-300">Real-Time Monitoring</td>
                      <td className="py-4 px-4 text-center text-red-400 text-lg">✗</td>
                      <td className="py-4 px-4 text-center text-emerald-400 text-lg font-bold">✓</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-300">No Local File Storage</td>
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

        {/* Platform Availability Section */}
        <section className="py-24 px-6 bg-slate-950 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
          <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />

          <div className="max-w-[1400px] mx-auto relative z-10">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <Monitor className="w-3.5 h-3.5" />
                <span>Cross-Platform</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Available On Your Platform</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Deploy DataLeash across your entire infrastructure with native support for major operating systems.</p>
            </div>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* macOS Intel - Available */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-slate-500/20 to-blue-500/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6 rounded-2xl bg-black/60 border border-slate-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(100,116,139,0.1),inset_0_1px_0_rgba(255,255,255,0.05)] h-full">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-4 relative">
                      <img src={`${basePath}/macos-icon.png`} alt="macOS" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(148,163,184,0.4)]" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">macOS</h3>
                    <p className="text-sm text-slate-400 mb-3">Intel (x86_64)</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Available Now
                    </span>
                  </div>
                </div>
              </div>

              {/* Windows - Available */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6 rounded-2xl bg-black/60 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.1),inset_0_1px_0_rgba(255,255,255,0.05)] h-full">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-4 relative">
                      <img src={`${basePath}/windows-icon.png`} alt="Windows" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Windows</h3>
                    <p className="text-sm text-slate-400 mb-3">10 & 11 (64-bit)</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Available Now
                    </span>
                  </div>
                </div>
              </div>

              {/* Linux - Coming Soon */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity" />
                <div className="relative p-6 rounded-2xl bg-black/40 border border-orange-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(249,115,22,0.05),inset_0_1px_0_rgba(255,255,255,0.03)] h-full opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-4 relative grayscale-[30%] group-hover:grayscale-0 transition-all">
                      <img src={`${basePath}/linux-icon.png`} alt="Linux" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
                    </div>
                    <h3 className="text-lg font-bold text-white/80 mb-1">Linux</h3>
                    <p className="text-sm text-slate-500 mb-3">Ubuntu, Debian, Fedora</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                      <Clock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>

              {/* macOS M1/M2 - Coming Soon */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity" />
                <div className="relative p-6 rounded-2xl bg-black/40 border border-purple-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.05),inset_0_1px_0_rgba(255,255,255,0.03)] h-full opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-4 relative grayscale-[30%] group-hover:grayscale-0 transition-all">
                      <img src={`${basePath}/macos-icon.png`} alt="macOS Apple Silicon" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]" />
                    </div>
                    <h3 className="text-lg font-bold text-white/80 mb-1">macOS</h3>
                    <p className="text-sm text-slate-500 mb-3">Apple Silicon (M1/M2/M3)</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                      <Clock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
        {/* Features Grid */}
        <section id="features" className="py-32 px-6 bg-slate-950 border-y border-slate-800 relative z-10 shadow-2xl">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                <span className="text-shine">Mission-Critical Security.</span>
              </h2>
                <p className="text-slate-300 max-w-xl text-lg font-medium">
                  Built for organizations where data protection is non-negotiable.
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
                <div key={i} className="p-8 rounded-2xl bg-black/60 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.03)] card-shine relative overflow-hidden backdrop-blur-xl">

                  {/* Internal Glow Blob */}
                  <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-10 blur-2xl bg-blue-500" />

                  <feature.icon className="w-8 h-8 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] mb-6 relative z-10" />

                  <h3 className="text-xl font-bold mb-3 text-white relative z-10 min-h-[1.75rem]">
                    {feature.title}
                  </h3>

                  <p className="text-slate-500 leading-relaxed text-sm font-medium relative z-10">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing / Demo Section */}
        <DemoRequestForm />

        {/* CTA Section - Premium & Attractive */}
        <section className="py-32 px-6 relative z-10">
          <div className="max-w-5xl mx-auto relative">
            <div className="absolute inset-0 bg-blue-600/5 rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl bg-black/70 border border-blue-500/20 p-12 md:p-20 text-center overflow-hidden backdrop-blur-xl shadow-[0_0_50px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.03)]">

              {/* Subtle background grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none" />

              <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tighter text-white relative z-10">
                Sent Doesn't Mean <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">Gone.</span>
              </h2>
              <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto font-light leading-relaxed relative z-10">
                Retain absolute ownership of your files even <em className="text-slate-300 not-italic">after</em> they leave your device. Share freely, revoke instantly.
              </p>

                <Link
                href="#features"
                className="relative z-10 inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-slate-950 bg-white rounded-full hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
              >
                Learn More
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
              <div className="p-4 rounded-xl bg-black/40 border border-blue-500/15 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                <div className="flex items-center gap-2 mb-4">
                  <DataLeashLogo size={28} />
                  <span className="font-bold text-lg text-white">DataLeash</span>
                </div>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                  Own it. Control it. Revoke it.<br />The final word on your files.
                </p>
              </div>
            </div>

            {/* Product */}
            <div>
              <div className="p-4 rounded-xl bg-black/40 border border-blue-500/15 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                <h4 className="text-sm font-semibold text-blue-400 mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="#features" className="hover:text-blue-400 transition">Features</a></li>
                  <li><a href="#pricing" className="hover:text-blue-400 transition">Pricing</a></li>
                  <li><a href="#how-it-works" className="hover:text-blue-400 transition">How It Works</a></li>
                </ul>
              </div>
            </div>

            {/* Company */}
            <div>
              <div className="p-4 rounded-xl bg-black/40 border border-blue-500/15 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                <h4 className="text-sm font-semibold text-blue-400 mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li><Link href="/privacy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-blue-400 transition">Terms of Service</Link></li>
                  <li><a href="mailto:dataleashowner@gmail.com" className="hover:text-blue-400 transition">Contact</a></li>
                </ul>
              </div>
            </div>

            {/* Founder - Special Premium Section */}
            <div id="founder" className="relative">
              <div className="absolute -inset-2 bg-blue-500/10 rounded-2xl blur-xl" />
              <div className="relative p-4 rounded-xl bg-black/60 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <h4 className="text-sm font-semibold text-blue-400 mb-4 drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]">✦ Founder</h4>
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src={`${basePath}/founder-avatar.png`} 
                    alt="Founder" 
                    className="w-12 h-12 rounded-full border-2 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.4)] object-cover"
                  />
                  <div>
                    <p className="text-white font-medium text-sm">Hadi Sleiman</p>
                    <p className="text-slate-500 text-xs">Founder & CEO</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <a 
                    href="https://www.linkedin.com/in/hadi-sleiman-92781825b/" 
                    target="_blank"
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-blue-400 transition"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a 
                    href="https://instagram.com/wxx.z" 
                    target="_blank"
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-pink-400 transition"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span>@wxx.z</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">

            {/* Developer Attribution Bar - Enhanced */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl" />
              <div className="relative py-6 px-8 rounded-xl bg-black/50 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)] flex flex-col md:flex-row justify-center items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-slate-500">Forged by</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-bold drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">soul-less-king</span>
                </div>

                <div className="flex items-center gap-4">
                  {/* GitHub */}
                  <a href="https://github.com/soul-less-king" target="_blank" className="group relative w-11 h-11" title="GitHub">
                    <div className="absolute inset-0 bg-blue-500/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-full h-full bg-black/60 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:border-blue-500/40 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all">
                      <Github className="w-5 h-5 text-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
                    </div>
                  </a>

                  {/* LinkedIn */}
                  <a href="https://www.linkedin.com/in/hadi-sleiman-92781825b/" target="_blank" className="group relative w-11 h-11" title="LinkedIn">
                    <div className="absolute inset-0 bg-blue-500/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-full h-full bg-black/60 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:border-blue-500/40 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all">
                      <Linkedin className="w-5 h-5 text-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
                    </div>
                  </a>

                  {/* Discord */}
                  <button
                    onClick={handleCopyDiscord}
                    className="group relative w-11 h-11 border-none outline-none appearance-none p-0 cursor-pointer"
                    title="Discord"
                  >
                    <div className="absolute inset-0 bg-blue-500/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-full h-full bg-black/60 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:border-blue-500/40 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all">
                      {discordCopied ? <Check className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" /> : (
                        <svg className="w-5 h-5 fill-current text-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                      )}
                    </div>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 text-xs font-mono bg-black/80 text-blue-300 border border-blue-500/30 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-[0_0_20px_rgba(59,130,246,0.3)] z-20">
                      {discordCopied ? <span className="text-emerald-400 font-bold">COPIED!</span> : <>ashenone616 <span className="text-blue-500 text-[10px] ml-1">(Click to Copy)</span></>}
                    </span>
                  </button>

                  {/* PayPal */}
                  <a href="https://www.paypal.com/paypalme/xhadiii" target="_blank" className="group relative w-11 h-11" title="PayPal">
                    <div className="absolute inset-0 bg-blue-500/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-full h-full bg-black/60 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:border-blue-500/40 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]" role="img" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 0.467 4.214-.407 0.873-.996 1.638-1.748 2.257-2.73 2.24-6.726 2.05-6.726 2.05l-0.544 1.93-0.544 2.89H11.5c0.528 0 0.902 0.354 0.767 0.86l-0.644 2.14c-0.12 0.47-0.58 0.77-1.07 0.77H7.714a.641.641 0 0 1-.638-.76l0.203-0.78z" />
                      </svg>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <AIChatbot />
    </div>
  );
}
