'use client'

import { useEffect, useRef, useMemo } from 'react'

// Optimized Matrix rain - less intensive, smoother performance
function HomeMatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const chars = '01◊⬡DATALEASH'
        const fontSize = 16
        const columns = Math.floor(canvas.width / fontSize / 2) // Half density
        const drops: number[] = []

        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(10, 22, 40, 0.05)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.font = `${fontSize}px monospace`

            for (let i = 0; i < drops.length; i++) {
                const x = i * fontSize * 2
                const y = drops[i] * fontSize

                if (Math.random() > 0.96) { // Draw occasionally
                    const char = chars[Math.floor(Math.random() * chars.length)]
                    const alpha = 0.08 + Math.random() * 0.12
                    ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`
                    ctx.fillText(char, x, y)
                }

                if (y > canvas.height && Math.random() > 0.98) {
                    drops[i] = 0
                }
                drops[i] += 0.3
            }
        }

        const interval = setInterval(draw, 100) // Slower interval for performance

        const handleResize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        window.addEventListener('resize', handleResize)

        return () => {
            clearInterval(interval)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.2 }}
        />
    )
}

// Floating particles with CSS-only animation (no JS state updates)
function FloatingParticles() {
    const particles = useMemo(() => {
        const texts = ['🔐', '🛡️', '⬡', '◊', '●']
        return [...Array(12)].map((_, i) => ({
            left: `${10 + (i * 8) % 80}%`,
            top: `${15 + (i * 13) % 70}%`,
            delay: `${i * 0.5}s`,
            duration: `${15 + (i % 5) * 3}s`,
            text: texts[i % texts.length],
            size: `${0.8 + (i % 3) * 0.3}rem`
        }))
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="absolute text-[var(--primary)] font-mono"
                    style={{
                        left: p.left,
                        top: p.top,
                        fontSize: p.size,
                        opacity: 0.08,
                        animation: `float ${p.duration} ease-in-out infinite`,
                        animationDelay: p.delay
                    }}
                >
                    {p.text}
                </div>
            ))}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-30px) rotate(10deg); }
                }
            `}</style>
        </div>
    )
}

// Glowing orbs - CSS only
function GlowingOrbs() {
    return (
        <>
            <div
                className="fixed pointer-events-none z-0"
                style={{
                    top: '-15%',
                    left: '-5%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)',
                    animation: 'pulse 10s ease-in-out infinite'
                }}
            />
            <div
                className="fixed pointer-events-none z-0"
                style={{
                    bottom: '-15%',
                    right: '-5%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(0,102,255,0.12) 0%, transparent 70%)',
                    animation: 'pulse 12s ease-in-out infinite',
                    animationDelay: '3s'
                }}
            />
            <div
                className="fixed pointer-events-none z-0"
                style={{
                    top: '50%',
                    right: '15%',
                    width: '250px',
                    height: '250px',
                    background: 'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)',
                    animation: 'pulse 8s ease-in-out infinite',
                    animationDelay: '1.5s'
                }}
            />
        </>
    )
}

// Grid overlay - static CSS
function GridOverlay() {
    return (
        <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
                backgroundImage: `
                    linear-gradient(rgba(0,212,255,0.015) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,212,255,0.015) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
                maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)'
            }}
        />
    )
}

// Scan beam - CSS animation
function ScanBeam() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div
                className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent"
                style={{
                    animation: 'scanbeam 15s linear infinite',
                    opacity: 0.2
                }}
            />
            <style jsx>{`
                @keyframes scanbeam {
                    0% { top: 0%; }
                    100% { top: 100%; }
                }
            `}</style>
        </div>
    )
}

// Hex pattern overlay - static
function HexPattern() {
    return (
        <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%2300d4ff' stroke-opacity='0.02'/%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px',
                opacity: 0.5
            }}
        />
    )
}

// Combined homepage effects - optimized
export function HomePageEffects() {
    return (
        <>
            <HexPattern />
            <GridOverlay />
            <GlowingOrbs />
            <HomeMatrixRain />
            <FloatingParticles />
            <ScanBeam />
        </>
    )
}

export default HomePageEffects
