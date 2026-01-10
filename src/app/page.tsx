import Link from "next/link";
import { Icon3D } from "@/components/Icon3D";
import { DataLeashLogo } from "@/components/DataLeashLogo";
import { HomePageEffects } from "@/components/HomePageEffects";

export default function Home() {
  return (
    <div className="gradient-bg min-h-screen relative overflow-hidden">
      {/* Futuristic Background Effects */}
      <HomePageEffects />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-3">
          <DataLeashLogo size={40} />
          <span className="text-xl font-bold text-gradient">Data Leash</span>
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
      <section className="pt-40 pb-20 px-6 relative">
        <div className="max-w-6xl mx-auto text-center perspective-1000">
          <div className="float mb-12 transform hover:scale-110 transition-transform duration-500">
            <DataLeashLogo size={220} className="mx-auto drop-shadow-[0_0_50px_rgba(0,212,255,0.3)]" />
          </div>

          <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tight">
            <span className="text-gradient">Total Control.</span>
            <br />
            <span className="text-white">Zero Trace.</span>
          </h1>

          <p className="text-xl md:text-2xl text-[var(--foreground-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Share files that self-destruct. Track every view. <br className="hidden md:block" />
            Revoke access instantly, even after they download it.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/signup" className="glow-button px-10 py-5 rounded-full text-black font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(0,212,255,0.4)]">
              Start Protecting Files →
            </Link>
            <Link href="#features" className="glass-card px-10 py-5 rounded-full font-bold text-lg hover:bg-white/10 transition border border-white/10 hover:border-white/30">
              See It In Action
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section - Simplified */}
      <section className="py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "100%", label: "Secure" },
            { value: "Zero", label: "Trace Left" },
            { value: "Instant", label: "Revocation" },
            { value: "Any", label: "File Type" },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-8 text-center hover:bg-white/5 transition border-t border-white/5">
              <div className="text-4xl font-black text-gradient mb-2">{stat.value}</div>
              <div className="text-[var(--foreground-muted)] font-medium tracking-wide uppercase text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section - More Visual, Less Text */}
      <section id="features" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16">
            <span className="text-gradient">Ultimate Protection</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                iconType: "lock",
                title: "Unbreakable Encryption",
                desc: "Your files are locked tight. Only the right person sees them, nowhere else."
              },
              {
                iconType: "eye",
                title: "Anti-Screenshot",
                desc: "Advanced tech that prevents screen capture. They see it, but they can't keep it."
              },
              {
                iconType: "bolt",
                title: "Kill Switch",
                desc: "Changed your mind? Revoke access instantly. The file vanishes from their device."
              },
              {
                iconType: "cloud",
                title: "No Local Copies",
                desc: "Files stream securely. They never touch the user's hard drive."
              },
              {
                iconType: "shield",
                title: "AI Security",
                desc: "Smart monitoring detects suspicious behavior and blocks threats automatically."
              },
              {
                iconType: "chart",
                title: "Full Tracking",
                desc: "Know exactly who opened your file, when, and from where."
              }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-8 group hover:-translate-y-2 transition-all duration-300 border border-white/5 hover:border-[var(--primary)]/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform rotate-12 scale-150">
                  <Icon3D type={feature.iconType} size="xl" />
                </div>
                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  <Icon3D type={feature.iconType} size="lg" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[var(--foreground-muted)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Footer Section combined for better flow */}
      <section className="py-20 px-6 border-t border-[rgba(0,212,255,0.1)] bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.5)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Join the Community</h2>

          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-16">
            <a
              href="https://discord.com/users/ashenone616"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card px-8 py-4 rounded-xl flex items-center gap-4 hover:bg-[#5865F2]/20 hover:border-[#5865F2] transition group"
            >
              <svg className="w-8 h-8 text-[#5865F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-[var(--foreground-muted)]">Chat with me on Discord</div>
                <div className="text-lg font-bold">@ashenone616</div>
              </div>
            </a>
          </div>

          <div className="text-[var(--foreground-muted)] text-sm">
            © 2026 Data Leash. All rights reserved.
          </div>
        </div>
      </section>
    </div>
  );
}
