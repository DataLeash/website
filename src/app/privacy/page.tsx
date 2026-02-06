'use client'

import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import { DataLeashLogo } from '@/components/DataLeashLogo'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/50">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <DataLeashLogo size={28} />
            <span className="font-bold text-lg text-white">DataLeash</span>
          </Link>
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-black/60 border border-blue-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none">
            <p className="text-slate-400 text-lg mb-8">
              Last updated: February 2026
            </p>

            <div className="space-y-8 text-slate-300">
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
                <p>
                  DataLeash collects only the minimum information necessary to provide our document security services. 
                  This includes your account information (email, name) and metadata about documents you protect.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
                <p>
                  Your information is used solely to provide document protection services, authenticate access requests, 
                  and maintain audit logs. We never sell or share your data with third parties.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">3. Data Security</h2>
                <p>
                  All documents are encrypted using defense-grade encryption. We employ zero-knowledge architecture, 
                  meaning we cannot access the contents of your protected documents.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">4. Your Rights</h2>
                <p>
                  You have the right to access, modify, or delete your data at any time. 
                  Contact us at dataleashowner@gmail.com for any privacy-related requests.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">5. Contact</h2>
                <p>
                  For privacy inquiries, contact us at: <a href="mailto:dataleashowner@gmail.com" className="text-blue-400 hover:underline">dataleashowner@gmail.com</a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
