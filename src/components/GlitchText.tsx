'use client'

import { useState, useEffect } from 'react'

export function GlitchText({ text, className = "" }: { text: string, className?: string }) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            className={`relative inline-block group ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span className="relative z-10">{text}</span>

            {/* Red Channel Glitch */}
            <span
                className={`absolute top-0 left-0 -z-10 text-red-500 opacity-70 mix-blend-screen transition-transform duration-100 ${isHovered ? 'animate-glitch-1' : ''}`}
                aria-hidden="true"
            >
                {text}
            </span>

            {/* Blue Channel Glitch */}
            <span
                className={`absolute top-0 left-0 -z-10 text-cyan-500 opacity-70 mix-blend-screen transition-transform duration-100 ${isHovered ? 'animate-glitch-2' : ''}`}
                aria-hidden="true"
            >
                {text}
            </span>

            <style jsx>{`
                @keyframes glitch-1 {
                    0% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                    100% { transform: translate(0); }
                }
                @keyframes glitch-2 {
                    0% { transform: translate(0); }
                    20% { transform: translate(2px, -2px); }
                    40% { transform: translate(2px, 2px); }
                    60% { transform: translate(-2px, 2px); }
                    80% { transform: translate(-2px, -2px); }
                    100% { transform: translate(0); }
                }
                .animate-glitch-1 {
                    animation: glitch-1 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite;
                }
                .animate-glitch-2 {
                    animation: glitch-2 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse both infinite;
                }
            `}</style>
        </div>
    )
}
