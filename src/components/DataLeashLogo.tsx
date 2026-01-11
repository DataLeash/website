'use client'

import { ReactNode } from 'react'

// DataLeash Logo with integrated text
export function DataLeashLogo({ size = 80, className = '', showText = false }: { size?: number; className?: string; showText?: boolean }): ReactNode {
    const iconSize = showText ? size * 0.6 : size

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00d4ff" />
                        <stop offset="50%" stopColor="#0099ff" />
                        <stop offset="100%" stopColor="#00d4ff" />
                    </linearGradient>
                    <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
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

                {/* Outer shield - pentagonal shape */}
                <path
                    d="M50 8L88 28V58C88 76 70 88 50 93C30 88 12 76 12 58V28L50 8Z"
                    stroke="url(#logo-gradient)"
                    strokeWidth="3"
                    fill="rgba(0,212,255,0.08)"
                    filter="url(#logo-glow)"
                />

                {/* Inner shield ring */}
                <path
                    d="M50 18L78 33V55C78 68 64 78 50 82C36 78 22 68 22 55V33L50 18Z"
                    stroke="url(#logo-gradient)"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.6"
                />

                {/* Chain link - stylized "D" shape left */}
                <path
                    d="M32 42C32 36 36 32 42 32H48V68H42C36 68 32 64 32 58V42Z"
                    stroke="url(#shield-gradient)"
                    strokeWidth="3"
                    fill="none"
                    filter="url(#logo-glow)"
                />

                {/* Chain link - stylized "L" shape right */}
                <path
                    d="M52 32H62C68 32 72 36 72 42V58C72 64 68 68 62 68H52V60H62C64 60 64 58 64 56V44C64 42 64 40 62 40H52V32Z"
                    stroke="url(#shield-gradient)"
                    strokeWidth="3"
                    fill="none"
                    filter="url(#logo-glow)"
                />

                {/* Connecting chain bar */}
                <rect
                    x="46"
                    y="47"
                    width="12"
                    height="6"
                    rx="3"
                    fill="url(#logo-gradient)"
                />

                {/* Lock keyhole */}
                <circle cx="50" cy="50" r="3" fill="url(#shield-gradient)" />

                {/* Animated pulse dots */}
                <circle cx="50" cy="20" r="2.5" fill="#00d4ff" opacity="0.9">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="26" cy="72" r="2" fill="#00d4ff" opacity="0.7">
                    <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="74" cy="72" r="2" fill="#00d4ff" opacity="0.7">
                    <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.2s" repeatCount="indefinite" />
                </circle>
            </svg>

            {showText && (
                <div className="flex flex-col">
                    <span
                        className="font-bold tracking-tight"
                        style={{
                            fontSize: size * 0.28,
                            background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 50%, #00d4ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textShadow: '0 0 20px rgba(0,212,255,0.3)'
                        }}
                    >
                        DataLeash
                    </span>
                    <span
                        className="text-[var(--foreground-muted)] tracking-widest uppercase"
                        style={{ fontSize: size * 0.08 }}
                    >
                        Secure • Protected
                    </span>
                </div>
            )}
        </div>
    )
}

// Compact logo for sidebar - icon only with text beside it
export function DataLeashLogoCompact({ size = 40 }: { size?: number }): ReactNode {
    return (
        <div className="flex items-center gap-3">
            <DataLeashLogo size={size} />
            <span
                className="font-bold text-gradient"
                style={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}
            >
                DataLeash
            </span>
        </div>
    )
}

export default DataLeashLogo

