'use client'

import { Shield, Lock, Globe, Server } from 'lucide-react'
import { EncryptedText } from './EncryptedText'
import { DataLeashLogo } from './DataLeashLogo'

export function MissionSection() {
    return (
        <section className="py-24 px-6 relative overflow-hidden border-b border-slate-800">
            {/* Background Video */}
            <div className="absolute inset-0 z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
                >
                    <source src="/video2.mp4" type="video/mp4" />
                </video>
                {/* Heavy Overlay for readability */}
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]" />

                {/* Gradient Mesh Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/60 to-slate-950" />
            </div>

            {/* Background Grid - slightly visible on top */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none opacity-30 z-0" />

            {/* Floating Elements */}
            <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
            <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Manifesto */}
                    <div>
                        <div className="mb-8">
                            <DataLeashLogo size={60} />
                        </div>

                        <div className="inline-flex items-center gap-2 mb-6">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-blue-500 text-xs font-mono tracking-[0.2em] font-bold">ABSOLUTE DOMINION</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tighter leading-tight">
                            Ownership is <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Absolute.</span>
                        </h2>

                        <div className="space-y-6 text-slate-400 text-lg leading-relaxed font-light">
                            <p>
                                Possession is no longer 9/10ths of the law. It is the <strong className="text-white">only law</strong>.
                            </p>
                            <p>
                                In the digital age, your data has been held hostage by infrastructure. Servers retain logs. Clouds retain backups.
                                Third parties assume ownership by default.
                            </p>
                            <p className="text-slate-200 font-medium">
                                We build the walls that make your information physically impossible for them to touch.
                                Not a promise. Not a policy. A mathematical certainty.
                            </p>
                        </div>

                        <div className="mt-10 flex gap-4">
                            <div className="px-4 py-2 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-400 flex items-center gap-2">
                                <Shield className="w-3 h-3 text-blue-400" /> NO LOGS
                            </div>
                            <div className="px-4 py-2 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-400 flex items-center gap-2">
                                <Globe className="w-3 h-3 text-cyan-400" /> NO BORDERS
                            </div>
                            <div className="px-4 py-2 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-400 flex items-center gap-2">
                                <Server className="w-3 h-3 text-indigo-400" /> NO MASTERS
                            </div>
                        </div>
                    </div>

                    {/* Right: Technical Visualization */}
                    <div className="relative">
                        <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 overflow-hidden group hover:border-blue-500/30 transition-colors duration-500">
                            {/* Terminal Header */}
                            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                                </div>
                                <div className="ml-auto text-xs font-mono text-slate-500">root@dataleash:~/dominion</div>
                            </div>

                            {/* Terminal Content */}
                            <div className="font-mono text-sm space-y-4">
                                <div className="flex gap-3 text-slate-300">
                                    <span className="text-blue-500 shrink-0">$</span>
                                    <span className="typing-effect-fast">audit_system --deep</span>
                                </div>
                                <div className="text-slate-500 pl-5">
                                    {'>'} TRACKING PING ... [ BLOCKED ]<br />
                                    {'>'} SERVER LOGS ..... [ PURGED ]<br />
                                    {'>'} THIRD PARTIES ... [ DENIED ]
                                </div>

                                <div className="flex gap-3 text-slate-300 pt-2">
                                    <span className="text-blue-500 shrink-0">$</span>
                                    <span className="typing-effect-delayed">print_verdict</span>
                                </div>
                                <div className="text-emerald-400/80 pl-5 leading-relaxed font-bold">
                                    "Your keys. Your data. Your rules.
                                    Everyone else is locked out."
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center">
                                    <div className="text-xs text-slate-500">SYSTEM STATUS:</div>
                                    <div className="text-xs font-bold text-emerald-400 animate-pulse">LOCKED DOWN</div>
                                </div>
                            </div>
                        </div>

                        {/* Decoding Decal behind */}
                        <div className="absolute -z-10 -bottom-10 -right-10 text-9xl font-black text-slate-800/20 select-none overflow-hidden whitespace-nowrap">
                            <EncryptedText text="DOMINION" />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
