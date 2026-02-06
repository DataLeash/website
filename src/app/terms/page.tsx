'use client'

import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { DataLeashLogo } from '@/components/DataLeashLogo'

export default function TermsPage() {
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
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none">
            <p className="text-slate-400 text-lg mb-8">
              Last updated: February 2026
            </p>

            <div className="space-y-8 text-slate-300">
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using DataLeash, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
                <p>
                  DataLeash provides document security and access control services, allowing users to 
                  protect, share, and revoke access to sensitive documents.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">3. User Responsibilities</h2>
                <p>
                  Users are responsible for maintaining the confidentiality of their account credentials 
                  and for all activities that occur under their account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h2>
                <p>
                  You agree not to use DataLeash for any unlawful purposes or to violate the rights of others. 
                  Misuse of our services may result in account termination.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">5. Limitation of Liability</h2>
                <p>
                  DataLeash is provided "as is" without warranties. We are not liable for any damages 
                  arising from the use of our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">6. Contact</h2>
                <p>
                  For questions about these terms, contact us at: <a href="mailto:dataleashowner@gmail.com" className="text-blue-400 hover:underline">dataleashowner@gmail.com</a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
