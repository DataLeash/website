'use client'

import { useEffect, useRef, useState, useMemo } from 'react'

// Subtle Matrix rain for dashboard - optimized for performance
export function DashboardMatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const chars = '01◊⬡DATALEASH'
        const fontSize = 14
        const columns = Math.floor(canvas.width / fontSize / 2) // Fewer columns
        const drops: number[] = []

        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -200
        }

        const draw = () => {
            // Fade effect - very subtle
            ctx.fillStyle = 'rgba(10, 22, 40, 0.04)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.font = `${fontSize}px monospace`

            for (let i = 0; i < drops.length; i++) {
                if (Math.random() > 0.98) { // Draw less frequently
                    const char = chars[Math.floor(Math.random() * chars.length)]
                    const x = i * fontSize * 2
                    const y = drops[i] * fontSize

                    const alpha = 0.08 + Math.random() * 0.1
                    ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`
                    ctx.fillText(char, x, y)
                }

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.995) {
                    drops[i] = 0
                }
                drops[i] += 0.2 // Even slower fall
            }
        }

        const interval = setInterval(draw, 200) // Much slower interval (was 80ms)

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
            style={{ opacity: 0.12 }}
        />
    )
}

// Horizontal scan line effect - CSS-based for better performance
export function ScanLine() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-15"
                style={{
                    animation: 'scanline 10s linear infinite',
                    top: 0
                }}
            />
            <style jsx>{`
                @keyframes scanline {
                    0% { top: 0%; }
                    100% { top: 100%; }
                }
            `}</style>
        </div>
    )
}

// Optimized data streams - fewer elements, CSS animations
export function DataStreams() {
    const streams = useMemo(() =>
        [...Array(4)].map((_, i) => ({
            id: i,
            y: 15 + (i * 20),
            duration: 20 + i * 5,
            opacity: 0.03 + (i * 0.01)
        })), []
    )

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
                        animation: `streamMove ${stream.duration}s linear infinite`,
                        willChange: 'transform'
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes streamMove {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0%); }
                }
            `}</style>
        </div>
    )
}

// Floating hex grid pattern - static, no JS animation needed
export function HexGrid() {
    return (
        <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%2300d4ff' stroke-opacity='0.02'/%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px',
                opacity: 0.4
            }}
        />
    )
}

// Corner brackets decoration - static
export function CornerBrackets() {
    return (
        <>
            <div className="fixed top-4 left-[290px] w-8 h-8 border-l-2 border-t-2 border-[var(--primary)] opacity-15 pointer-events-none z-0" />
            <div className="fixed top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[var(--primary)] opacity-15 pointer-events-none z-0" />
            <div className="fixed bottom-4 left-[290px] w-8 h-8 border-l-2 border-b-2 border-[var(--primary)] opacity-15 pointer-events-none z-0" />
            <div className="fixed bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[var(--primary)] opacity-15 pointer-events-none z-0" />
        </>
    )
}

// Status indicators - CSS animation only
export function StatusIndicators() {
    return (
        <div className="fixed top-6 right-20 flex items-center gap-4 text-xs text-[var(--foreground-muted)] opacity-40 pointer-events-none z-10">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" style={{ animation: 'pulse 3s ease-in-out infinite' }} />
                <span>SECURE</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" style={{ animation: 'pulse 3s ease-in-out infinite 1s' }} />
                <span>ENCRYPTED</span>
            </div>
        </div>
    )
}

// Combined dashboard effects - optimized
export function DashboardEffects() {
    return (
        <>
            <HexGrid />
            <DashboardMatrixRain />
            <DataStreams />
            <ScanLine />
            <CornerBrackets />
            <StatusIndicators />
        </>
    )
}

export default DashboardEffects
