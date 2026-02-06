'use client'

import { Shield, Globe, Users, Award } from 'lucide-react'
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
                    <source src="/website/video2.mp4" type="video/mp4" />
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

                    {/* Left: Mission Statement */}
                    <div>
                        <div className="mb-8">
                            <DataLeashLogo size={60} />
                        </div>

                        <div className="inline-flex items-center gap-2 mb-6">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-blue-500 text-xs font-mono tracking-[0.2em] font-bold">OUR MISSION</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tighter leading-tight">
                            Your Data. Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Control.</span>
                        </h2>

                        <div className="space-y-6 text-slate-400 text-lg leading-relaxed font-light">
                            <p>
                                In today's digital landscape, sharing sensitive information means losing control of it. 
                                Once a file is sent, traditional methods offer no way to manage who sees it or for how long.
                            </p>
                            <p>
                                DataLeash changes this. We built a platform where you <strong className="text-white">maintain complete authority</strong> over 
                                your documents—before, during, and after sharing.
                            </p>
                            <p className="text-slate-200 font-medium">
                                Whether you're protecting classified information, confidential contracts, or sensitive intelligence, 
                                DataLeash ensures your data stays under your command.
                            </p>
                        </div>
                    </div>

                    {/* Right: Trust Indicators */}
                    <div className="relative">
                        <div className="relative z-10 bg-black/60 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.03)]">
                            
                            {/* Background Video */}
                            <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover opacity-30"
                                >
                                    <source src="/website/questionvideo.mp4" type="video/mp4" />
                                </video>
                                {/* Dark overlay for text readability */}
                                <div className="absolute inset-0 bg-black/70" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-8 relative z-10">Built for Critical Sectors</h3>
                            
                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-black/80 border border-blue-500/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                        <Shield className="w-6 h-6 text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Defense</h4>
                                        <p className="text-sm text-slate-500">Military & Defense contractors</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-black/80 border border-blue-500/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                        <Globe className="w-6 h-6 text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Government</h4>
                                        <p className="text-sm text-slate-500">Federal & state agencies</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-black/80 border border-blue-500/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                        <Users className="w-6 h-6 text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Intelligence</h4>
                                        <p className="text-sm text-slate-500">Security & intelligence orgs</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-black/80 border border-blue-500/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                        <Award className="w-6 h-6 text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Enterprise</h4>
                                        <p className="text-sm text-slate-500">Critical infrastructure</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-blue-500/10 relative z-10">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Protection Level:</span>
                                    <span className="font-bold text-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]">Defense-Grade</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
