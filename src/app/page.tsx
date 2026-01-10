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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 px-4">
            {/* Discord - Primary */}
            <a
              href="https://discord.com/users/ashenone616"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card px-8 py-6 rounded-xl flex flex-col items-center gap-4 hover:bg-[#5865F2]/20 hover:border-[#5865F2] transition group md:col-span-3"
            >
              <svg className="w-12 h-12 text-[#5865F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
              </svg>
              <div className="text-center">
                <div className="text-sm text-[var(--foreground-muted)] mb-1">Chat on Discord</div>
                <div className="text-2xl font-bold">@ashenone616</div>
              </div>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/hadi-sleiman-92781825b/"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card px-6 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-[#0077b5]/20 hover:border-[#0077b5] transition group md:col-span-1 md:col-start-1"
            >
              <svg className="w-6 h-6 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span className="font-semibold">LinkedIn</span>
            </a>

            {/* PayPal/Donate */}
            <a
              href="https://paypal.me/xhadiii"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card px-6 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-[#00457C]/20 hover:border-[#00457C] transition group md:col-span-1 md:col-start-3"
            >
              <svg className="w-6 h-6 text-[#00457C]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.654h6.584c2.194 0 3.889.6 4.951 1.753.955 1.04 1.3 2.477 1.026 4.268l-.015.097v.103c-.247 1.671-.98 2.98-2.184 3.892-1.227.928-2.881 1.422-4.9 1.422h-.614a.78.78 0 0 0-.77.66l-.015.09-.59 3.727-.016.07a.78.78 0 0 1-.77.66H7.077l-.001-.471zm.573-14.263l-2.29 14.263h1.548l.59-3.727a.78.78 0 0 1 .77-.66h.614c2.02 0 3.673-.494 4.9-1.422 1.204-.912 1.937-2.221 2.184-3.892v-.103l.015-.097c.274-1.791-.071-3.228-1.026-4.268-1.062-1.153-2.757-1.753-4.951-1.753H8.42a.77.77 0 0 0-.76.654l-.011.095z" />
              </svg>
              <span className="font-semibold">Donate</span>
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
