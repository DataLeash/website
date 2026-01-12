'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert, Activity } from 'lucide-react'

export function SecurityHUD() {
    const [time, setTime] = useState('')

    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            setTime(now.toISOString().replace('T', ' ').split('.')[0] + ' UTC')
        }
        const interval = setInterval(updateTime, 1000)
        updateTime()
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden font-mono text-[10px] sm:text-xs text-blue-500/40 select-none hidden md:block">
            {/* Corner Brackets */}
            <div className="absolute top-4 left-4 w-16 h-16 border-t border-l border-blue-500/60" />
            <div className="absolute top-4 right-4 w-16 h-16 border-t border-r border-blue-500/60" />
            <div className="absolute bottom-4 left-4 w-16 h-16 border-b border-l border-blue-500/60" />
            <div className="absolute bottom-4 right-4 w-16 h-16 border-b border-r border-blue-500/60" />

            {/* Top Info */}
            <div className="absolute top-6 left-24 flex items-center gap-4">
                <span className="animate-pulse">REC ●</span>
                <span>SYS_OP_NORMAL</span>
                <span>{time}</span>
            </div>

            <div className="absolute top-6 right-24 text-right">
                <div>SECURE_LINK_ESTABLISHED</div>
                <div className="text-[10px] opacity-70">ENCRYPTION: AES-256-GCM</div>
            </div>

            {/* Crosshair Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
                <div className="w-[100px] h-[1px] bg-blue-500" />
                <div className="h-[100px] w-[1px] bg-blue-500 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Bottom Status */}
            <div className="absolute bottom-6 left-24 flex items-center gap-4">
                <ShieldAlert className="w-4 h-4 opacity-50" />
                <span>THREAT_LEVEL: ZERO</span>
            </div>

            {/* Scanlines Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-[60] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
        </div>
    )
}
