'use client'

import { useState } from 'react'
import { ChevronRight, Terminal, ShieldAlert, Lock, EyeOff, Activity, FileCheck, Fingerprint, Wifi, Box, Database, Play } from 'lucide-react'
import { EncryptedText } from './EncryptedText'

const protocols = [
    {
        id: 'SEC-01',
        icon: ShieldAlert,
        query: 'PROTOCOL: ENCRYPTION_STANDARD_VERIFICATION',
        question: "How secure is DataLeash?",
        output: "We utilize AES-256-GCM authenticated encryption. The master key is split into four fragments using Shamir's Secret Sharing (Server, User, Device, Runtime). Without physically controlling all four vectors simultaneously, decryption is mathematically impossible.",
        status: 'VERIFIED'
    },
    {
        id: 'SEC-02',
        icon: Lock,
        query: 'PROTOCOL: DATA_EXFILTRATION_MITIGATION',
        question: "Can recipients save or download my files?",
        output: "NEGATIVE. Files are streamed directly to volatile memory (RAM) via a secure viewer. No temp files are written to disk. Browser cache is disabled. When the session ends, the memory block is overwritten with zeros.",
        status: 'ENFORCED'
    },
    {
        id: 'SEC-03',
        icon: EyeOff,
        query: 'PROTOCOL: OPTICAL_CAPTURE_DEFENSE',
        question: "What happens if someone tries to screenshot?",
        output: "Our kernel-level driver detects capture APIs (PrintScreen, Snipping Tool, OBS, ShareX). The OS renders a black overlay on the protected window frame. The user is flagged, and you receive an immediate forensic alert.",
        status: 'ACTIVE'
    },
    {
        id: 'SEC-04',
        icon: Activity,
        query: 'PROTOCOL: REMOTE_KILL_CHAIN',
        question: "Can I revoke access after someone downloads a file?",
        output: "AFFIRMATIVE. Since the file decrypts in real-time, it requires a live handshake with our key server. Clicking 'Revoke' deletes the server-side key fragment, instantly rendering the file indecipherable globally, even if currently open.",
        status: 'READY'
    },
    {
        id: 'SEC-05',
        icon: FileCheck,
        query: 'PROTOCOL: REGULATORY_FRAMEWORK_ALIGNMENT',
        question: "Is DataLeash HIPAA & GDPR compliant?",
        output: "AFFIRMATIVE. We operate as a Zero-Knowledge provider. Since we never possess the full decryption keys (due to user-side sharding), we technically cannot access your data even under subpoena. This satisfies 'Safe Harbor' provisions for highest-tier compliance.",
        status: 'CERTIFIED'
    },
    {
        id: 'SEC-06',
        icon: Fingerprint,
        query: 'PROTOCOL: BIOMETRIC_IDENTITY_CHALLENGE',
        question: "How do you verify the recipient's identity?",
        output: "Beyond standard MFA, we enforce 'Liveness Checks'. The recipient must pass a verified session check (FaceID/TouchID/YubiKey) on their trusted device before the decryption key fragment is released. Stolen passwords are useless.",
        status: 'ENFORCED'
    },
    {
        id: 'SEC-07',
        icon: Wifi,
        query: 'PROTOCOL: NETWORK_DEPENDENCY_CHECK',
        question: "Can protected files be viewed offline?",
        output: "NEGATIVE. Zero-Trust requires real-time authorization. An active heartbeat with our Key Server is mandatory every 30 seconds. If the connection drops or the heartbeat fails, the decryption keys are flushed from RAM immediately.",
        status: 'MANDATORY'
    },
    {
        id: 'SEC-08',
        icon: Box,
        query: 'PROTOCOL: UNIVERSAL_CONTAINER_COMPATIBILITY',
        question: "What file types can I protect?",
        output: "UNRESTRICTED. Our proprietary container wraps any binary format—PDF, DOCX, MP4, CAD, and Source Code. The encryption layer is agnostic to the payload. If it's digital, we can leash it.",
        status: 'UNIVERSAL'
    },
    {
        id: 'SEC-09',
        icon: Database,
        query: 'PROTOCOL: INFRASTRUCTURE_VULNERABILITY_AUDIT',
        question: "Isn't my data safe already in my database?",
        output: "Watch this and judge yourself.",
        status: 'CRITICAL',
        video: '/questionvideo.mp4'
    },
    {
        id: 'SEC-10',
        icon: Play,
        query: 'PROTOCOL: SECURE_MEDIA_PIPELINE',
        question: "How do you prevent screen recording and capture?",
        output: "We enforce a HARDWARE-LEVEL secure media path. Decryption occurs inside a Trusted Execution Environment (TEE) — a sandboxed CPU enclave inaccessible to the OS or any third-party app. Decrypted frames never exist in normal RAM. Screen recorders (OBS, ShareX, QuickTime) receive a BLACK SCREEN from the graphics driver. This is the same technology Netflix/Disney+ uses for 4K content.",
        status: 'HARDWARE-ENFORCED'
    },
    {
        id: 'SEC-11',
        icon: Wifi,
        query: 'PROTOCOL: OUTPUT_PROTECTION_ENFORCEMENT',
        question: "Can someone capture it with an HDMI splitter?",
        output: "NEGATIVE. We enforce HDCP 2.2 (High-bandwidth Digital Content Protection) for all external outputs. HDCP encrypts the signal from GPU to display. If the capture card, cable, or monitor fails the cryptographic handshake — the signal is BLOCKED at the hardware level. This defeats HDMI capture cards, wireless casting, and external recorders.",
        status: 'ENCRYPTED'
    }
]

export function SecurityProtocols() {
    const [activeProtocol, setActiveProtocol] = useState<string | null>(null)

    return (
        <section className="py-32 px-6 relative">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-16">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                        <Terminal className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight flex gap-3">
                            <EncryptedText text="Security Protocols" />
                        </h2>
                        <p className="text-slate-400 font-mono text-xs tracking-widest mt-1 uppercase">Knowledge Base // Level 1 Clearance</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {protocols.map((protocol) => (
                        <div
                            key={protocol.id}
                            className={`group border rounded-xl overflow-hidden transition-all duration-500 ${activeProtocol === protocol.id
                                ? 'bg-slate-900/80 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            <button
                                onClick={() => setActiveProtocol(activeProtocol === protocol.id ? null : protocol.id)}
                                className="w-full flex items-center justify-between p-6 text-left"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-2 rounded-lg transition-colors ${activeProtocol === protocol.id ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-900 text-slate-500 group-hover:text-slate-400'}`}>
                                        <protocol.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded border ${activeProtocol === protocol.id
                                                ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                                                : 'border-slate-800 text-slate-600 bg-slate-900'
                                                }`}>
                                                {protocol.id}
                                            </span>
                                            <span className={`text-[10px] font-mono tracking-widest ${activeProtocol === protocol.id ? 'text-blue-400' : 'text-slate-600'
                                                }`}>
                                                [{protocol.status}]
                                            </span>
                                        </div>
                                        <h3 className={`text-lg font-medium transition-colors ${activeProtocol === protocol.id ? 'text-blue-100' : 'text-slate-300 group-hover:text-white'
                                            }`}>
                                            {protocol.question}
                                        </h3>
                                    </div>
                                </div>

                                <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${activeProtocol === protocol.id ? 'rotate-90 text-blue-400' : 'text-slate-600'
                                    }`} />
                            </button>

                            <div className={`grid transition-all duration-300 ease-in-out ${activeProtocol === protocol.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                }`}>
                                <div className="overflow-hidden">
                                    <div className="p-6 pt-0 pl-[5.5rem] pr-12 pb-8">
                                        <div className="p-4 bg-black/40 rounded-lg border border-slate-800 font-mono text-sm leading-relaxed text-slate-300 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />

                                            {/* Terminal Header Info */}
                                            <div className="mb-2 text-xs text-blue-500/50 select-none flex justify-between">
                                                <span><span className="mr-2">$</span><span className="typing-effect">{protocol.query}</span></span>
                                                {/* @ts-ignore */}
                                                {protocol.video && <span className="text-red-400 animate-pulse">● REC_PLAYBACK</span>}
                                            </div>

                                            {/* Content: Video or Text */}
                                            {/* @ts-ignore */}
                                            {protocol.video ? (
                                                <div className="space-y-4">
                                                    <p>
                                                        <span className="text-blue-400 mr-2">{'>'}</span>
                                                        {protocol.output}
                                                    </p>
                                                    <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 aspect-video group/video cursor-pointer">
                                                        <video
                                                            src={protocol.video}
                                                            className="w-full h-full object-cover"
                                                            controls
                                                            playsInline
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <p>
                                                    <span className="text-blue-400 mr-2">{'>'}</span>
                                                    {protocol.output}
                                                </p>
                                            )}
                                        </div>
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
