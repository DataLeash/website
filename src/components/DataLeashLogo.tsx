'use client'

import { ReactNode } from 'react'

// Inline SVG Logo for Data Leash - no external file needed
export function DataLeashLogo({ size = 80, className = '' }: { size?: number; className?: string }): ReactNode {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="50%" stopColor="#0099ff" />
                    <stop offset="100%" stopColor="#00d4ff" />
                </linearGradient>
                <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#0066ff" />
                </linearGradient>
            </defs>

            {/* Outer hexagon shield */}
            <path
                d="M50 5L90 25V55C90 75 70 90 50 95C30 90 10 75 10 55V25L50 5Z"
                stroke="url(#logo-gradient)"
                strokeWidth="3"
                fill="rgba(0,212,255,0.1)"
                filter="url(#logo-glow)"
            />

            {/* Inner shield */}
            <path
                d="M50 15L80 30V55C80 70 65 82 50 86C35 82 20 70 20 55V30L50 15Z"
                stroke="url(#logo-gradient)"
                strokeWidth="2"
                fill="none"
            />

            {/* Chain link left */}
            <ellipse
                cx="35"
                cy="50"
                rx="12"
                ry="18"
                stroke="url(#shield-gradient)"
                strokeWidth="4"
                fill="none"
                filter="url(#logo-glow)"
            />

            {/* Chain link right */}
            <ellipse
                cx="65"
                cy="50"
                rx="12"
                ry="18"
                stroke="url(#shield-gradient)"
                strokeWidth="4"
                fill="none"
                filter="url(#logo-glow)"
            />

            {/* Connecting bar */}
            <rect
                x="40"
                y="46"
                width="20"
                height="8"
                rx="4"
                fill="url(#logo-gradient)"
            />

            {/* Lock keyhole */}
            <circle cx="50" cy="48" r="4" fill="url(#shield-gradient)" />
            <rect x="48" y="50" width="4" height="8" rx="2" fill="url(#shield-gradient)" />

            {/* Data dots */}
            <circle cx="50" cy="25" r="3" fill="#00d4ff" opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="30" cy="70" r="2" fill="#00d4ff" opacity="0.6">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="70" cy="70" r="2" fill="#00d4ff" opacity="0.6">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.8s" repeatCount="indefinite" />
            </circle>
        </svg>
    )
}

export default DataLeashLogo
