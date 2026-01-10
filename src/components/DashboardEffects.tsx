'use client'

import { useEffect, useRef, useState } from 'react'

// Subtle Matrix rain for dashboard - less dense, more professional
export function DashboardMatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const chars = '01₿∆◊⬡⬢◈◇DATALEASH'
        const fontSize = 12
        const columns = Math.floor(canvas.width / fontSize)
        const drops: number[] = []

        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -200
        }

        const draw = () => {
            // Fade effect - very subtle
            ctx.fillStyle = 'rgba(10, 22, 40, 0.03)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.font = `${fontSize}px monospace`

            for (let i = 0; i < drops.length; i++) {
                if (Math.random() > 0.97) { // Only draw occasionally for subtlety
                    const char = chars[Math.floor(Math.random() * chars.length)]
                    const x = i * fontSize
                    const y = drops[i] * fontSize

                    // Gradient from bright to dim
                    const alpha = 0.1 + Math.random() * 0.15
                    ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`
                    ctx.fillText(char, x, y)
                }

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.99) {
                    drops[i] = 0
                }
                drops[i] += 0.3 // Slower fall
            }
        }

        const interval = setInterval(draw, 80)

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
            style={{ opacity: 0.15 }}
        />
    )
}

// Horizontal scan line effect - Safari compatible
export function ScanLine() {
    const [topPosition, setTopPosition] = useState(0)

    useEffect(() => {
        let animationFrame: number
        let startTime: number

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const elapsed = timestamp - startTime
            const duration = 8000
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
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-20"
                style={{ top: `${topPosition}%` }}
            />
        </div>
    )
}

// Data flow particles - horizontal data streams (Safari compatible)
export function DataStreams() {
    const [streams, setStreams] = useState<Array<{
        id: number;
        y: number;
        duration: number;
        delay: number;
        opacity: number;
        xOffset: number;
    }>>([])

    useEffect(() => {
        const generated = [...Array(8)].map((_, i) => ({
            id: i,
            y: 10 + (i * 12),
            duration: 15 + Math.random() * 10,
            delay: Math.random() * 5,
            opacity: 0.03 + Math.random() * 0.05,
            xOffset: 0
        }))
        setStreams(generated)

        let animationFrame: number
        let startTime: number

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const elapsed = timestamp - startTime

            setStreams(prev => prev.map(stream => {
                const effectiveElapsed = elapsed - (stream.delay * 1000)
                if (effectiveElapsed < 0) return stream
                const progress = ((effectiveElapsed / 1000) % stream.duration) / stream.duration
                return { ...stream, xOffset: -50 + (progress * 50) }
            }))

            animationFrame = requestAnimationFrame(animate)
        }

        animationFrame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationFrame)
    }, [])

    if (streams.length === 0) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {streams.map(stream => (
                <div
                    key={stream.id}
                    className="absolute left-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent"
                    style={{
                        top: `${stream.y}%`,
                        width: '200%',
                        opacity: stream.opacity,
                        transform: `translateX(${stream.xOffset}%)`
                    }}
                />
            ))}
        </div>
    )
}

// Floating hex grid pattern
export function HexGrid() {
    return (
        <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%2300d4ff' stroke-opacity='0.03'/%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px',
                opacity: 0.5
            }}
        />
    )
}

// Corner brackets decoration
export function CornerBrackets() {
    return (
        <>
            {/* Top Left */}
            <div className="fixed top-4 left-[290px] w-8 h-8 border-l-2 border-t-2 border-[var(--primary)] opacity-20 pointer-events-none z-0" />
            {/* Top Right */}
            <div className="fixed top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[var(--primary)] opacity-20 pointer-events-none z-0" />
            {/* Bottom Left */}
            <div className="fixed bottom-4 left-[290px] w-8 h-8 border-l-2 border-b-2 border-[var(--primary)] opacity-20 pointer-events-none z-0" />
            {/* Bottom Right */}
            <div className="fixed bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[var(--primary)] opacity-20 pointer-events-none z-0" />
        </>
    )
}

// Status indicators - subtle animated dots
export function StatusIndicators() {
    return (
        <div className="fixed top-6 right-20 flex items-center gap-4 text-xs text-[var(--foreground-muted)] opacity-50 pointer-events-none z-10">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                <span>SECURE</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                <span>ENCRYPTED</span>
            </div>
        </div>
    )
}

// Combined dashboard effects
export function DashboardEffects() {
    return (
        <>
            <DashboardMatrixRain />
            <HexGrid />
            <DataStreams />
            <ScanLine />
            <CornerBrackets />
            <StatusIndicators />
        </>
    )
}

export default DashboardEffects
