'use client'

import Link from "next/link";
import { useState } from "react";
import dynamic from 'next/dynamic'
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

      {/* Centered Header with Logo */}
      <header className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-8 pointer-events-none">
        <div className="pointer-events-auto">
          <DataLeashLogo size={120} />
        </div>
      </header>

      {/* ... (Ticker and Nav remain) */}

      <main className="flex-grow pt-48">
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

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 group">
                  Start Leashing
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                </Link>
              </div>

            </div>

            {/* Right: Globe 3D with Toggle */}
            <div className="relative h-[550px] w-full lg:block hidden">

              {/* Toggle Controls */}
              <div className="absolute top-4 right-4 z-30 flex gap-2">
                <button
                  onClick={() => setIsAttackMode(false)}
                  className={`px-3 py-1 text-xs font-bold rounded border backdrop-blur-md transition-all ${!isAttackMode ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-black/40 border-slate-700 text-slate-500'}`}
                >
                  SECURE TRAFFIC
                </button>
                <button
                  onClick={() => setIsAttackMode(true)}
                  className={`px-3 py-1 text-xs font-bold rounded border backdrop-blur-md transition-all ${isAttackMode ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-black/40 border-slate-700 text-slate-500'}`}
                >
                  THREAT MAP
                </button>
              </div>

              <div className={`absolute inset-0 blur-[120px] rounded-full transition-colors duration-700 ${isAttackMode ? 'bg-red-600/10' : 'bg-blue-600/5'}`} />
              <div className="relative w-full h-full grayscale-[0.3] hover:grayscale-0 transition-all duration-700 opacity-90">
                <Globe3D locations={DUMMY_LOCATIONS} isAttackMode={isAttackMode} />
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

      {/* Footer - Minimal */}
      <footer className="py-12 px-6 border-t border-slate-900 bg-slate-950">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
          <div className="flex items-center gap-3 opacity-80">
            <DataLeashLogo size={24} />
            <span className="font-semibold text-slate-300">DataLeash</span>
          </div>

          <div className="flex items-center gap-8 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-slate-300 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition">Terms of Service</Link>
          </div>
        </div>

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
      </footer>
      <AIChatbot />
    </div>
  );
}
