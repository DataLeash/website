'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, HelpCircle, Shield, Lock, Eye, RefreshCw, FileCheck, UserCheck, Clock, FileType, Building2, Search } from 'lucide-react'
import { DataLeashLogo } from '@/components/DataLeashLogo'

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

const categories = ['All', 'Security', 'Access', 'Protection', 'Control', 'Compliance', 'Verification', 'Compatibility', 'Government']

export default function FAQPage() {
    const [activeQuestion, setActiveQuestion] = useState<string | null>(null)
    const [activeCategory, setActiveCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')

    const filteredFaqs = faqs.filter(faq => {
        const matchesCategory = activeCategory === 'All' || faq.category === activeCategory
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
            <div className="fixed -left-40 top-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed -right-40 bottom-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/70 border-b border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            <DataLeashLogo size={28} />
                        </div>
                        <span className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors">DataLeash</span>
                    </Link>
                    <Link 
                        href="/" 
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/10 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-32 pb-24 px-6 relative z-10">
                <div className="max-w-[1400px] mx-auto">
                    {/* Page Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Support Center</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">Everything you need to know about DataLeash security and features</p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto mb-10">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-black/60 border border-blue-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all"
                            />
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap justify-center gap-2 mb-12">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    activeCategory === category
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                        : 'bg-black/40 text-slate-400 border border-slate-700/50 hover:border-blue-500/20 hover:text-blue-400'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* FAQ Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFaqs.map((faq) => {
                            const Icon = faq.icon
                            const isActive = activeQuestion === faq.id

                            return (
                                <div
                                    key={faq.id}
                                    className={`relative group cursor-pointer transition-all duration-300 ${
                                        isActive ? 'lg:col-span-2 lg:row-span-1' : ''
                                    }`}
                                    onClick={() => setActiveQuestion(isActive ? null : faq.id)}
                                >
                                    {/* Glow Effect */}
                                    <div className={`absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-lg transition-opacity ${
                                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                                    }`} />
                                    
                                    <div className={`relative p-6 rounded-2xl border backdrop-blur-xl h-full transition-all duration-300 ${
                                        isActive 
                                            ? 'bg-black/70 border-blue-500/40 shadow-[0_0_40px_rgba(59,130,246,0.15)]' 
                                            : 'bg-black/50 border-blue-500/15 hover:border-blue-500/30'
                                    }`}>
                                        {/* Header */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                                                isActive 
                                                    ? 'bg-blue-500/20 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                                                    : 'bg-black/60 border border-blue-500/20'
                                            }`}>
                                                <Icon className={`w-5 h-5 transition-all ${
                                                    isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-blue-400/70'
                                                }`} />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-xs text-blue-400/60 font-mono">{faq.id}</span>
                                                <span className="mx-2 text-slate-600">•</span>
                                                <span className="text-xs text-slate-500">{faq.category}</span>
                                            </div>
                                        </div>

                                        {/* Question */}
                                        <h3 className={`font-semibold mb-3 transition-colors ${
                                            isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                                        }`}>
                                            {faq.question}
                                        </h3>

                                        {/* Answer - Always visible but truncated when not active */}
                                        <p className={`text-sm leading-relaxed transition-all ${
                                            isActive 
                                                ? 'text-slate-300' 
                                                : 'text-slate-500 line-clamp-2'
                                        }`}>
                                            {faq.answer}
                                        </p>

                                        {/* Read more indicator */}
                                        {!isActive && (
                                            <p className="text-xs text-blue-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Click to read more →
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* No Results */}
                    {filteredFaqs.length === 0 && (
                        <div className="text-center py-20">
                            <HelpCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-400 mb-2">No matching questions found</h3>
                            <p className="text-slate-500">Try adjusting your search or filter</p>
                        </div>
                    )}

                    {/* Contact Section */}
                    <div className="mt-20 text-center">
                        <div className="relative inline-block">
                            <div className="absolute -inset-2 bg-blue-500/10 rounded-2xl blur-xl" />
                            <div className="relative p-8 rounded-2xl bg-black/60 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                                <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
                                <p className="text-slate-400 mb-6">Our team is here to help you with any questions</p>
                                <a 
                                    href="mailto:dataleashowner@gmail.com"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                                >
                                    Contact Support
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
