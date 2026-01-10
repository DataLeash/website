'use client'

import { useEffect, useRef, useState } from 'react'

// Matrix rain for homepage - full effect, more dramatic than dashboard
function HomeMatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const chars = '01アイウエオカキクケコDATA₿∆◊⬡LEASH'
        const fontSize = 14
        const columns = Math.floor(canvas.width / fontSize)
        const drops: number[] = []

        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(10, 22, 40, 0.04)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.font = `${fontSize}px monospace`

            for (let i = 0; i < drops.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)]
                const x = i * fontSize
                const y = drops[i] * fontSize

                // Random brightness
                const alpha = 0.1 + Math.random() * 0.2
                ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`
                ctx.fillText(char, x, y)

                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0
                }
                drops[i] += 0.5
            }
        }

        const interval = setInterval(draw, 50)

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
            style={{ opacity: 0.25 }}
        />
    )
}

// Floating encryption keywords
function FloatingKeywords() {
    const [particles, setParticles] = useState<Array<{
        left: string;
        top: string;
        delay: string;
        duration: string;
        text: string;
        size: string;
    }>>([])

    useEffect(() => {
        const texts = ['256-BIT', 'AES', 'RSA-4096', '🔐', 'SHA-512', 'ENCRYPTED', 'SECURE', 'E2E', 'PROTECTED', '🛡️']
        const generated = [...Array(15)].map(() => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${10 + Math.random() * 10}s`,
            text: texts[Math.floor(Math.random() * texts.length)],
            size: `${0.6 + Math.random() * 0.4}rem`
        }))
        setParticles(generated)
    }, [])

    if (particles.length === 0) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="absolute text-[var(--primary)] font-mono animate-float"
                    style={{
                        left: p.left,
                        top: p.top,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                        fontSize: p.size,
                        opacity: 0.1
                    }}
                >
                    {p.text}
                </div>
            ))}
        </div>
    )
}

// Glowing orbs in background
function GlowingOrbs() {
    return (
        <>
            <div
                className="fixed pointer-events-none z-0"
                style={{
                    top: '-20%',
                    left: '-10%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)',
                    animation: 'pulse 8s ease-in-out infinite'
                }}
            />
            <div
                className="fixed pointer-events-none z-0"
                style={{
                    bottom: '-20%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(0,102,255,0.1) 0%, transparent 70%)',
                    animation: 'pulse 10s ease-in-out infinite',
                    animationDelay: '2s'
                }}
            />
            <div
                className="fixed pointer-events-none z-0"
                style={{
                    top: '40%',
                    right: '20%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
                    animation: 'pulse 6s ease-in-out infinite',
                    animationDelay: '1s'
                }}
            />
        </>
    )
}

// Grid lines overlay
function GridOverlay() {
    return (
        <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
                backgroundImage: `
                    linear-gradient(rgba(0,212,255,0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,212,255,0.02) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
                maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)'
            }}
        />
    )
}

// Scan beam - uses CSS animation compatible with all browsers
function ScanBeam() {
    const [topPosition, setTopPosition] = useState(0)

    useEffect(() => {
        let animationFrame: number
        let startTime: number

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const elapsed = timestamp - startTime
            const duration = 12000 // 12 seconds
            const progress = (elapsed % duration) / duration
            setTopPosition(progress * 100)
            animationFrame = requestAnimationFrame(animate)
        }

        animationFrame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationFrame)
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div
                className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent"
                style={{
                    top: `${topPosition}%`,
                    opacity: 0.3
                }}
            />
        </div>
    )
}

// Combined homepage effects
export function HomePageEffects() {
    return (
        <>
            <HomeMatrixRain />
            <GlowingOrbs />
            <GridOverlay />
            <FloatingKeywords />
            <ScanBeam />
        </>
    )
}

export default HomePageEffects
