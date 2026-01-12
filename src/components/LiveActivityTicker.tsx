'use client'

import { Shield, Lock, AlertTriangle, CheckCircle, Radio, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'

const EVENTS = [
    { type: 'block', text: 'Threat Blocked: SQL Injection Attempt (192.168.x.x)', icon: Shield, color: 'text-red-400' },
    { type: 'secure', text: 'File Encrypted: "Q4_Financials.pdf" (AES-256)', icon: Lock, color: 'text-emerald-400' },
    { type: 'access', text: 'Audit Log: Identity verified via Hardware ID', icon: CheckCircle, color: 'text-blue-400' },
    { type: 'revoke', text: 'Revocation: Access terminated due to geo-fence mismatch', icon: AlertTriangle, color: 'text-orange-400' },
    { type: 'scan', text: 'System Status: All systems operational', icon: Activity, color: 'text-slate-400' },
    { type: 'keys', text: 'Key Management: Interactive Session Key Rotation', icon: Lock, color: 'text-indigo-400' },
]

export function LiveActivityTicker() {
    // Duplicate events to create seamless loop
    const displayEvents = [...EVENTS, ...EVENTS, ...EVENTS]
    const [mounted, setMounted] = useState(false)
    const [currentTime, setCurrentTime] = useState('')

    useEffect(() => {
        setMounted(true)
        setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }))

        // Optional: Update time every second if we want it truly live
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    if (!mounted) return null

    return (
        <div className="w-full bg-slate-950/80 border-b border-slate-800/50 backdrop-blur-sm overflow-hidden py-2 select-none z-[60]">
            <div className="flex animate-ticker whitespace-nowrap">
                {displayEvents.map((event, i) => (
                    <div key={i} className="flex items-center gap-2 mx-8 text-[11px] font-mono tracking-wide text-slate-400/80 uppercase">
                        <event.icon className={`w-3 h-3 ${event.color}`} />
                        <span className="opacity-50">[{currentTime}]</span>
                        <span className="font-medium">{event.text}</span>
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-ticker {
                    animation: ticker 60s linear infinite; /* Slower, more professional speed */
                }
                .animate-ticker:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    )
}
