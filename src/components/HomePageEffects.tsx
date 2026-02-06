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

// Interactive particle swarm that reacts to mouse
function InteractiveSwarm() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        // Detect mobile and reduce particles significantly
        const isMobile = window.innerWidth < 768
        const particleCount = isMobile ? 15 : 90 // Much fewer on mobile
        const particleSize = isMobile ? 8 : 14

        const particles: {
            x: number,
            y: number,
            vx: number,
            vy: number,
            size: number,
            color: string,
            char: string,
            changeTimer: number
        }[] = []

        const colors = ['#ffffff', '#00d4ff', '#0099ff'] // White and Tech Blue
        const chars = '0123456789ABCDEF' // Hex characters

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.03, // Barely moving
                vy: (Math.random() - 0.5) * 0.03,
                size: Math.random() * particleSize + (isMobile ? 6 : 10),
                color: colors[Math.floor(Math.random() * colors.length)],
                char: chars[Math.floor(Math.random() * chars.length)],
                changeTimer: Math.floor(Math.random() * 20)
            })
        }

        let mouseX = -1000
        let mouseY = -1000

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX
            mouseY = e.clientY
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.font = 'bold 16px monospace' // Common font setting

            particles.forEach(p => {
                // Basic movement
                p.x += p.vx
                p.y += p.vy

                // Bounce off walls
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1

                // Mouse Interaction (Magnet)
                const dx = mouseX - p.x
                const dy = mouseY - p.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < 300) {
                    p.vx += dx * 0.00005 // Barely affected by mouse
                    p.vy += dy * 0.00005
                }

                // Friction cap
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
                if (speed > 0.2) { // Minimal speed cap
                    p.vx *= 0.95
                    p.vy *= 0.95
                }

                // Character Flicker Logic
                p.changeTimer--
                if (p.changeTimer <= 0) {
                    p.char = chars[Math.floor(Math.random() * chars.length)]
                    p.changeTimer = Math.floor(Math.random() * 10 + 5) // Flickr every 5-15 frames

                    // Occasional color shift
                    if (Math.random() > 0.9) {
                        p.color = colors[Math.floor(Math.random() * colors.length)]
                    }
                }

                // Draw Character
                ctx.font = `bold ${p.size}px monospace`
                ctx.fillStyle = p.color
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.fillText(p.char, p.x, p.y)
                ctx.shadowBlur = 0; // Reset
            })

            requestAnimationFrame(animate)
        }

        const animationId = requestAnimationFrame(animate)
        window.addEventListener('mousemove', handleMouseMove)

        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-80" />
}

// Glowing orbs - Enhanced with floating animation
function GlowingOrbs() {
    return (
        <>
            {/* Primary orb - top left */}
            <div className="floating-orb floating-orb-1" />
            {/* Secondary orb - bottom right */}
            <div className="floating-orb floating-orb-2" />
            {/* Tertiary orb - center left */}
            <div className="floating-orb floating-orb-3" />
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
            <InteractiveSwarm />
            <ScanBeam />
        </>
    )
}

export default HomePageEffects
