'use client'

import { ReactNode, useState, useEffect } from 'react'

// DataLeash Logo with integrated text
// DataLeash Logo - Text based with Neon Accent
export function DataLeashLogo({ size = 80, className = '', showText = false }: { size?: number; className?: string; showText?: boolean }): ReactNode {
    // If showText is true (like in sidebar), we use a different layout or just ignore it since the logo IS text now.
    // However, for backward compatibility with the sidebar calling convention, we can just render the new text logo.

    // Scramble Text Logic
    const [displayText, setDisplayText] = useState('DATALEASH')
    const finalText = 'DATALEASH'
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*'

    useEffect(() => {
        let iteration = 0
        let interval: NodeJS.Timeout

        const scramble = () => {
            clearInterval(interval)
            interval = setInterval(() => {
                setDisplayText(prev =>
                    finalText
                        .split('')
                        .map((letter, index) => {
                            if (index < iteration) {
                                return finalText[index]
                            }
                            return chars[Math.floor(Math.random() * chars.length)]
                        })
                        .join('')
                )

                if (iteration >= finalText.length) {
                    clearInterval(interval)
                }

                iteration += 1 / 3 // Speed of resolution
            }, 30)
        }

        scramble()

        // Re-scramble on hover? Maybe simpler to just do it on mount for now.
        // Or we can expose a ref/handler if needed.

        return () => clearInterval(interval)
    }, [])

    return (
        <div className={`flex items-center ${className} group`}>
            <div className="relative flex flex-col items-start justify-center">
                {/* Main Text */}
                <span
                    className="font-bold tracking-tighter"
                    style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: size * 0.4,
                        background: 'linear-gradient(180deg, #ffffff 0%, #e0f7ff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.5))',
                        width: '10ch', // Fixed width to prevent jitter
                        display: 'inline-block'
                    }}
                >
                    {displayText}
                </span>

                {/* Neon Accent under 'D' */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-15%',
                        left: '2%',
                        width: size * 0.3,
                        height: size * 0.05,
                        backgroundColor: '#00d4ff',
                        borderRadius: '999px',
                        boxShadow: '0 0 10px #00d4ff, 0 0 20px #00d4ff'
                    }}
                />
            </div>
        </div>
    )
}

// Compact logo for sidebar - For now, we can re-use the main text logo but smaller
export function DataLeashLogoCompact({ size = 30 }: { size?: number }): ReactNode {
    return <DataLeashLogo size={size * 2.5} /> // Scale up slightly to match text size expectation
}

export default DataLeashLogo

