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
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DataLeashLogo size={40} />
          <span className="text-xl font-bold text-gradient">Data Leash</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[var(--foreground-muted)] hover:text-white transition">
            Login
          </Link>
          <Link href="/signup" className="glow-button px-6 py-2 rounded-full text-black font-semibold">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="max-w-6xl mx-auto text-center">
          <div className="float mb-8">
            <DataLeashLogo size={200} className="mx-auto" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-gradient">Control Your Data</span>
            <br />
            <span className="text-white">After It&apos;s Shared</span>
          </h1>

          <p className="text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto mb-10">
            Data is a fish—it cannot survive outside its container.
            Share files that self-destruct, track every view, and revoke access instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="glow-button px-8 py-4 rounded-full text-black font-bold text-lg">
              Start Protecting Files →
            </Link>
            <Link href="#features" className="glass-card px-8 py-4 rounded-full font-semibold hover:border-[var(--primary)] transition">
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "256-bit", label: "Encryption" },
            { value: "4-Key", label: "Split System" },
            { value: "0", label: "Local Storage" },
            { value: "∞", label: "Control Level" },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-gradient">{stat.value}</div>
              <div className="text-[var(--foreground-muted)] mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            <span className="text-gradient">Military-Grade</span> Protection
          </h2>
          <p className="text-[var(--foreground-muted)] text-center mb-12 max-w-2xl mx-auto">
            Your files are protected at every level—from encryption to display.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                iconType: "lock",
                title: "4-Key Encryption",
                desc: "File requires 4 separate keys to decrypt. Miss any one = permanent garbage."
              },
              {
                iconType: "eye",
                title: "No Screenshots",
                desc: "Kernel-level blocking prevents all capture attempts. Screen goes black."
              },
              {
                iconType: "cloud",
                title: "Zero Local Storage",
                desc: "Files stream from server, exist only in protected memory. Never touches disk."
              },
              {
                iconType: "bolt",
                title: "Instant Revoke",
                desc: "Kill access to any file with one click. Works on all copies instantly."
              },
              {
                iconType: "robot",
                title: "AI Threat Detection",
                desc: "Groq-powered AI monitors for suspicious behavior and auto-blocks threats."
              },
              {
                iconType: "chart",
                title: "Complete Visibility",
                desc: "See who viewed, when, where, and for how long. Track every interaction."
              }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-6 hover:border-[var(--primary)] transition group">
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <Icon3D type={feature.iconType} size="lg" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-[var(--foreground-muted)]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-[var(--background-light)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            <span className="text-gradient">How It Works</span>
          </h2>

          <div className="space-y-8">
            {[
              { step: "1", title: "Upload Your File", desc: "Drag & drop any file. It gets converted to a secure .dlx container." },
              { step: "2", title: "Set Permissions", desc: "Choose who can view, require NDA, set expiry, and lockdown level." },
              { step: "3", title: "Share the Link", desc: "Recipients download our viewer and open the protected file." },
              { step: "4", title: "Stay in Control", desc: "Track views, approve requests, and revoke access anytime." },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full glow-button flex items-center justify-center text-black font-bold text-xl shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                  <p className="text-[var(--foreground-muted)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto glass-card p-12 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-4 right-4 opacity-20">
            <Icon3D type="shield" size="xl" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-15">
            <Icon3D type="lock" size="lg" />
          </div>

          <h2 className="text-4xl font-bold mb-4 relative z-10">
            Ready to <span className="text-gradient">Take Control</span>?
          </h2>
          <p className="text-[var(--foreground-muted)] mb-8 relative z-10">
            Start protecting your files for free. No credit card required.
          </p>
          <Link href="/signup" className="glow-button inline-block px-10 py-4 rounded-full text-black font-bold text-lg relative z-10">
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[rgba(0,212,255,0.1)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <DataLeashLogo size={30} />
            <span className="font-semibold">Data Leash</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://www.linkedin.com/in/hadi-sleiman-92781825b/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span className="text-sm">LinkedIn</span>
            </a>
            <a
              href="https://paypal.me/xhadiii"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[#00457C] transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.654h6.584c2.194 0 3.889.6 4.951 1.753.955 1.04 1.3 2.477 1.026 4.268l-.015.097v.103c-.247 1.671-.98 2.98-2.184 3.892-1.227.928-2.881 1.422-4.9 1.422h-.614a.78.78 0 0 0-.77.66l-.015.09-.59 3.727-.016.07a.78.78 0 0 1-.77.66H7.077l-.001-.471zm.573-14.263l-2.29 14.263h1.548l.59-3.727a.78.78 0 0 1 .77-.66h.614c2.02 0 3.673-.494 4.9-1.422 1.204-.912 1.937-2.221 2.184-3.892v-.103l.015-.097c.274-1.791-.071-3.228-1.026-4.268-1.062-1.153-2.757-1.753-4.951-1.753H8.42a.77.77 0 0 0-.76.654l-.011.095z" />
              </svg>
              <span className="text-sm">Donate</span>
            </a>
            <p className="text-[var(--foreground-muted)] text-sm">
              © 2026 Data Leash. Your data, your control.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
