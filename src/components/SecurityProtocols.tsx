'use client'

import { useState } from 'react'
import { ChevronRight, HelpCircle, Shield, Lock, Eye, RefreshCw, FileCheck, UserCheck, Clock, FileType, Building2 } from 'lucide-react'

const faqs = [
    {
        id: 'FAQ-01',
        icon: Shield,
        question: "How does DataLeash protect my files?",
        answer: "DataLeash uses multiple layers of protection to keep your files secure. When you upload a document, it's protected using defense-grade security measures. Only recipients you explicitly approve can view the content, and they can never download or save it to their device.",
        category: 'Security'
    },
    {
        id: 'FAQ-02',
        icon: Lock,
        question: "Can recipients save or download my files?",
        answer: "No. Files are displayed securely within our protected viewer. Recipients can view the content but cannot download, save, or copy it to their device. When the viewing session ends, no trace of the file remains on their system.",
        category: 'Access'
    },
    {
        id: 'FAQ-03',
        icon: Eye,
        question: "What happens if someone tries to screenshot?",
        answer: "DataLeash includes built-in screenshot protection. If someone attempts to capture your content, the screen appears blank in their capture. You're also notified immediately of any capture attempts, giving you complete visibility into how your files are being accessed.",
        category: 'Protection'
    },
    {
        id: 'FAQ-04',
        icon: RefreshCw,
        question: "Can I revoke access after sharing?",
        answer: "Absolutely. You can revoke access to any file at any time with a single click. Once revoked, the document becomes immediately inaccessible—even if someone is currently viewing it. This gives you complete control over your sensitive information.",
        category: 'Control'
    },
    {
        id: 'FAQ-05',
        icon: FileCheck,
        question: "Does DataLeash support compliance requirements?",
        answer: "Yes. DataLeash is designed with compliance in mind. Our complete audit trail, access controls, and revocation capabilities help organizations meet regulatory requirements for data protection, including standards used by government and defense organizations.",
        category: 'Compliance'
    },
    {
        id: 'FAQ-06',
        icon: UserCheck,
        question: "How do you verify who's accessing my files?",
        answer: "Every access request requires your explicit approval. Before granting access, you can review detailed information about the requester. This ensures that only verified, authorized individuals can view your sensitive content.",
        category: 'Verification'
    },
    {
        id: 'FAQ-07',
        icon: Clock,
        question: "Can files be viewed offline?",
        answer: "No. DataLeash requires an active connection to verify that access is still authorized. This ensures that if you revoke access, the document becomes immediately inaccessible, even if someone previously had permission to view it.",
        category: 'Access'
    },
    {
        id: 'FAQ-08',
        icon: FileType,
        question: "What file types can I protect?",
        answer: "DataLeash supports all common file formats including documents (PDF, Word, PowerPoint), images, videos, spreadsheets, and more. If it's a digital file, DataLeash can protect it.",
        category: 'Compatibility'
    },
    {
        id: 'FAQ-09',
        icon: Building2,
        question: "Is DataLeash suitable for government use?",
        answer: "Yes. DataLeash is specifically designed for organizations with the highest security requirements, including defense agencies, government departments, and critical infrastructure. Our protection measures meet the stringent security standards required by these sectors.",
        category: 'Government'
    }
]

export function SecurityProtocols() {
    const [activeQuestion, setActiveQuestion] = useState<string | null>(null)

    return (
        <section className="py-32 px-6 relative">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-16">
                    <div className="w-12 h-12 bg-black/80 rounded-xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <HelpCircle className="w-6 h-6 text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Everything you need to know about DataLeash</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq) => (
                        <div
                            key={faq.id}
                            className={`border rounded-xl overflow-hidden transition-all duration-500 backdrop-blur-xl ${activeQuestion === faq.id
                                ? 'bg-black/70 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.12)]'
                                : 'bg-black/50 border-blue-500/15'
                                }`}
                        >
                            <button
                                onClick={() => setActiveQuestion(activeQuestion === faq.id ? null : faq.id)}
                                className="w-full flex items-center justify-between p-6 text-left"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-2 rounded-lg transition-colors ${activeQuestion === faq.id ? 'bg-black/80 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'bg-black/60 text-slate-600'}`}>
                                        <faq.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-[10px] font-medium tracking-wide px-2 py-0.5 rounded ${activeQuestion === faq.id
                                                ? 'text-blue-400 bg-blue-500/20'
                                                : 'text-slate-600 bg-black/60'
                                                }`}>
                                                {faq.category}
                                            </span>
                                        </div>
                                        <h3 className={`text-lg font-medium transition-colors ${activeQuestion === faq.id ? 'text-blue-100' : 'text-slate-300 group-hover:text-white'
                                            }`}>
                                            {faq.question}
                                        </h3>
                                    </div>
                                </div>

                                <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${activeQuestion === faq.id ? 'rotate-90 text-blue-400' : 'text-slate-600'
                                    }`} />
                            </button>

                            <div className={`grid transition-all duration-300 ease-in-out ${activeQuestion === faq.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                }`}>
                                <div className="overflow-hidden">
                                    <div className="p-6 pt-0 pl-[5.5rem] pr-12 pb-8">
                                        <p className="text-slate-400 leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
