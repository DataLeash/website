'use client'

import Link from "next/link";
import { useState } from "react";
import { DataLeashLogo } from "@/components/DataLeashLogo";
import { HomePageEffects } from "@/components/HomePageEffects";
import {
  Shield, Lock, Eye, Zap, Cloud, BarChart3,
  KeyRound, Skull, Brain, Cpu, Camera,
  ChevronDown, ChevronUp, Github, Linkedin,
  MessageCircle, Heart, ExternalLink, Quote,
  FileKey, Users, Globe, Clock
} from "lucide-react";

// FAQ Data from DataLeash documentation
const faqData = [
  {
    question: "How secure is DataLeash?",
    answer: "Military-grade AES-256-GCM encryption with 4-part key splitting using Shamir's Secret Sharing. Your files are protected with ChaCha20-Poly1305 container encryption, TLS 1.3 transport, and server-side encryption. Without ALL four key parts, the file is mathematically impossible to decrypt."
  },
  {
    question: "Can recipients save or download my files?",
    answer: "No. Files decrypt ONLY in RAM and never touch the disk. They stream securely through our protected viewer. When the session ends, memory is overwritten with zeros and freed. There's literally nothing to save."
  },
  {
    question: "What happens if someone tries to screenshot?",
    answer: "Screenshots are blocked at the kernel level. We detect and block Print Screen, Snipping Tool, ShareX, OBS, and all known capture software. If an attempt is made, the screen shows blank and you're immediately alerted with the attacker's details."
  },
  {
    question: "Can I revoke access after someone downloads a file?",
    answer: "Absolutely. One button instantly revokes access for anyone, anywhere. Our Chain Kill feature can destroy ALL copies—even if shared to millions of people. The files become permanent garbage without the server keys."
  },
  {
    question: "What platforms are supported?",
    answer: "The web portal works on any browser. For viewing protected files, we support Windows 10/11 and macOS 12+ (Monterey and later) with our secure runtime. Mobile notifications work via PWA on iOS and Android."
  },
  {
    question: "How does the ownership system work?",
    answer: "Your identity is cryptographically embedded in every file and can NEVER be removed. No matter how many times the file is shared (even to millions), you remain the verified owner with full control, tracking, and revocation rights."
  }
];

// Feature data with Lucide icons
const features = [
  {
    icon: KeyRound,
    title: "4-Key Encryption",
    description: "Shamir's Secret Sharing splits your encryption key into 4 parts. Without ALL parts—from server, device, user, and runtime—the file is mathematically unbreakable garbage.",
    gradient: "from-cyan-500 to-blue-600"
  },
  {
    icon: Skull,
    title: "Instant Revocation",
    description: "One button destroys the decryption keys. Future access attempts are instantly denied. Anyone currently viewing will lose access on their next session.",
    gradient: "from-red-500 to-rose-600"
  },
  {
    icon: Brain,
    title: "AI Security",
    description: "Groq-powered threat detection analyzes behavior in real-time. Unusual time, location, or device? Automatic risk scoring, alerts, and blocking before damage happens.",
    gradient: "from-purple-500 to-violet-600"
  },
  {
    icon: Cpu,
    title: "Streaming Decryption",
    description: "Files are decrypted on-the-fly in the browser and never saved to disk. When you close the viewer, the decrypted content is released from memory.",
    gradient: "from-emerald-500 to-green-600"
  },
  {
    icon: Camera,
    title: "Capture Prevention",
    description: "Browser-level protections block common screenshot shortcuts and disable copy/paste. Watermarks identify viewers. Detected capture attempts are logged and alerted.",
    gradient: "from-orange-500 to-amber-600"
  },
  {
    icon: BarChart3,
    title: "Complete Tracking",
    description: "Know exactly who opened your file, when, from where, for how long. See the entire sharing tree. Get real-time alerts. Generate court-ready evidence packages.",
    gradient: "from-pink-500 to-fuchsia-600"
  }
];

// Stats data
const stats = [
  { icon: Shield, value: "AES-256", label: "Military Encryption" },
  { icon: Users, value: "∞", label: "Share to Anyone" },
  { icon: Globe, value: "Instant", label: "Global Revoke" },
  { icon: Clock, value: "0ms", label: "Trace Left" }
];

// Professional quotes
const quotes = [
  {
    text: "Information shouldn't be immortal. It should exist only as long as you permit.",
    author: "Ephemeral Security",
    role: "Core Philosophy"
  },
  {
    text: "The only way to keep a secret is to ensure it can vanish without a trace.",
    author: "Data Sovereignty",
    role: "Zero-Trust Architecture"
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
    <div className="glass-card border border-white/10 overflow-hidden transition-all duration-300">
      <button
        onClick={onClick}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition"
      >
        <span className="text-lg font-semibold pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--foreground-muted)] flex-shrink-0" />
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-5 text-[var(--foreground-muted)] leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  return (
    <div className="gradient-bg min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <HomePageEffects />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <DataLeashLogo size={40} />
          <span className="text-xl font-bold text-gradient">DataLeash</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#about" className="text-[var(--foreground-muted)] hover:text-white transition text-sm">About</a>
          <a href="#features" className="text-[var(--foreground-muted)] hover:text-white transition text-sm">Features</a>
          <a href="#faq" className="text-[var(--foreground-muted)] hover:text-white transition text-sm">FAQ</a>
          <a
            href="https://github.com/soul-less-king"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-white transition text-sm"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[var(--foreground-muted)] hover:text-white transition">
            Login
          </Link>
          <Link href="/signup" className="glow-button px-6 py-2 rounded-full text-black font-semibold hover:scale-105 transition-transform">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 md:pt-40 pb-16 px-6 relative">
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo with glow */}
          <div className="mb-10 transform hover:scale-105 transition-transform duration-500">
            <DataLeashLogo size={180} className="mx-auto drop-shadow-[0_0_60px_rgba(0,212,255,0.4)]" showText={true} />
          </div>

          {/* Philosophy Quote */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-[var(--foreground-muted)] border border-white/10">
            <Quote className="w-4 h-4 text-[var(--primary)]" />
            <span className="italic">"Data usually never dies. We gave it a kill switch."</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tight leading-tight">
            <span className="text-gradient">Total Control.</span>
            <br />
            <span className="text-white">Zero Trace.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[var(--foreground-muted)] max-w-3xl mx-auto mb-10 leading-relaxed">
            Share files that self-destruct. Track every view in real-time.
            <br className="hidden md:block" />
            Revoke access instantly—even after they download it.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/signup"
              className="glow-button px-10 py-4 rounded-full text-black font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(0,212,255,0.4)] flex items-center gap-2"
            >
              <FileKey className="w-5 h-5" />
              Start Protecting Files
            </Link>
            <a
              href="#features"
              className="glass-card px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition border border-white/10 hover:border-white/30 flex items-center gap-2"
            >
              See How It Works
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>

          {/* Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="glass-card p-6 text-center group hover:bg-white/5 transition border border-white/5 hover:border-[var(--primary)]/30"
              >
                <stat.icon className="w-6 h-6 mx-auto mb-3 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-black text-gradient mb-1">{stat.value}</div>
                <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section id="about" className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-gradient">Who We Are</span>
              </h2>
              <p className="text-lg text-[var(--foreground-muted)] mb-6 leading-relaxed">
                DataLeash was born from a simple truth: once you share a file, you lose control.
                We built a system that breaks that paradigm completely.
              </p>
              <p className="text-[var(--foreground-muted)] mb-8 leading-relaxed">
                Our technology treats files as <strong className="text-white">self-executing programs</strong> that
                require the DataLeash runtime to function. Without it, your data is encrypted garbage—
                mathematically impossible to access.
              </p>

              {/* Tech Stack Pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {['AES-256-GCM', 'ChaCha20', 'Intel SGX', 'Zero-Knowledge', 'Blockchain Audit'].map((tech, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-mono bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/soul-less-king"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-lg glass-card hover:bg-white/10 transition border border-white/10"
                >
                  <Github className="w-5 h-5" />
                  View on GitHub
                  <ExternalLink className="w-4 h-4 opacity-50" />
                </a>
              </div>
            </div>

            {/* Right: Quote Card */}
            <div className="glass-card p-8 border border-[var(--primary)]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--primary)]/20 to-transparent rounded-bl-full" />
              <Quote className="w-10 h-10 text-[var(--primary)] mb-6 opacity-50" />
              {quotes.map((quote, i) => (
                <div key={i} className={i > 0 ? 'mt-8 pt-8 border-t border-white/10' : ''}>
                  <p className="text-xl md:text-2xl font-light italic mb-4 leading-relaxed">
                    "{quote.text}"
                  </p>
                  <div>
                    <div className="font-semibold text-[var(--primary)]">{quote.author}</div>
                    <div className="text-sm text-[var(--foreground-muted)]">{quote.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Ultimate Protection</span>
            </h2>
            <p className="text-[var(--foreground-muted)] max-w-2xl mx-auto">
              Six layers of security that work together to make your files completely untouchable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="glass-card p-8 group hover:-translate-y-2 transition-all duration-300 border border-white/5 hover:border-[var(--primary)]/50 relative overflow-hidden"
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[var(--foreground-muted)] leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Section */}
      <section className="py-16 px-6 border-y border-[var(--primary)]/10 bg-gradient-to-r from-[var(--primary)]/5 via-transparent to-[var(--primary)]/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[var(--primary)]" />
            <span className="text-[var(--primary)] uppercase text-sm tracking-widest font-semibold">Research-Backed</span>
            <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[var(--primary)]" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Built on <span className="text-gradient">16 Academic Papers</span>
          </h3>
          <p className="text-[var(--foreground-muted)] mb-6">
            DataLeash incorporates cutting-edge research in cryptography, trusted execution environments,
            blockchain audit trails, and secure data deletion from leading academic institutions.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            {['Intel SGX Enclaves', 'CP-ABE Encryption', 'Vanish Protocol', 'Blockchain Audit', 'Homomorphic Auth'].map((paper, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-white/5 text-[var(--foreground-muted)] border border-white/10">
                {paper}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 relative">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Questions?</span>
            </h2>
            <p className="text-[var(--foreground-muted)]">
              Everything you need to know about DataLeash security.
            </p>
          </div>

          <div className="space-y-3">
            {faqData.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === i}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-12 text-center relative overflow-hidden border border-[var(--primary)]/20">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/10 via-transparent to-[var(--primary)]/10" />

            <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">
              Ready to Take Control?
            </h2>
            <p className="text-[var(--foreground-muted)] mb-8 max-w-xl mx-auto relative z-10">
              Start protecting your sensitive files today. No credit card required.
            </p>
            <Link
              href="/signup"
              className="glow-button px-10 py-4 rounded-full text-black font-bold text-lg hover:scale-105 transition-transform inline-flex items-center gap-2 relative z-10"
            >
              <Shield className="w-5 h-5" />
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer / Contact Section */}
      <footer className="py-16 px-6 border-t border-[rgba(0,212,255,0.1)] bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto">
          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {/* GitHub - Primary */}
            <a
              href="https://github.com/soul-less-king"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card px-6 py-6 rounded-xl flex flex-col items-center gap-3 hover:bg-white/10 hover:border-white/30 transition group md:col-span-2"
            >
              <Github className="w-10 h-10 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="text-xs text-[var(--foreground-muted)] mb-1">Open Source on</div>
                <div className="text-xl font-bold">GitHub</div>
                <div className="text-sm text-[var(--primary)]">@soul-less-king</div>
              </div>
            </a>

            {/* Discord */}
            <a
              href="https://discord.com/users/ashenone616"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card px-6 py-6 rounded-xl flex flex-col items-center gap-3 hover:bg-[#5865F2]/20 hover:border-[#5865F2]/50 transition group"
            >
              <MessageCircle className="w-8 h-8 text-[#5865F2] group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="text-xs text-[var(--foreground-muted)] mb-1">Chat on</div>
                <div className="font-bold">Discord</div>
              </div>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/hadi-sleiman-92781825b/"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card px-6 py-6 rounded-xl flex flex-col items-center gap-3 hover:bg-[#0077b5]/20 hover:border-[#0077b5]/50 transition group"
            >
              <Linkedin className="w-8 h-8 text-[#0077b5] group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="text-xs text-[var(--foreground-muted)] mb-1">Connect on</div>
                <div className="font-bold">LinkedIn</div>
              </div>
            </a>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3">
              <DataLeashLogo size={28} />
              <span className="font-semibold text-gradient">DataLeash</span>
            </div>
            <div className="text-[var(--foreground-muted)] text-sm flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 inline" /> in 2026
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--foreground-muted)]">
              <Link href="/terms" className="hover:text-white transition">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
