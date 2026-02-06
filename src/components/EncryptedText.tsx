'use client'

import { useState, useEffect, useRef } from 'react'

interface EncryptedTextProps {
    text: string
    className?: string
    hoverOnly?: boolean
    startDelay?: number
}

export function EncryptedText({ text, className = '', hoverOnly = false, startDelay = 0 }: EncryptedTextProps) {
    const [displayText, setDisplayText] = useState(text)
    const [isHovered, setIsHovered] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*'

    const scramble = () => {
        let iteration = 0
        if (intervalRef.current) clearInterval(intervalRef.current)

        intervalRef.current = setInterval(() => {
            setDisplayText(
                text
                    .split('')
                    .map((letter, index) => {
                        if (index < iteration) {
                            return text[index]
                        }
                        // Keep spaces as spaces
                        if (letter === ' ') return ' '
                        return chars[Math.floor(Math.random() * chars.length)]
                    })
                    .join('')
            )

            if (iteration >= text.length) {
                if (intervalRef.current) clearInterval(intervalRef.current)
                setDisplayText(text) // Ensure final text is correct
            }

            iteration += 0.5 // Faster resolution
        }, 25)
    }

    useEffect(() => {
        if (!hoverOnly) {
            const timeoutId = setTimeout(scramble, startDelay)
            
            // Fallback: ensure text is shown after max animation time
            const fallbackId = setTimeout(() => {
                if (intervalRef.current) clearInterval(intervalRef.current)
                setDisplayText(text)
            }, startDelay + 3000) // Max 3 seconds for animation
            
            return () => {
                clearTimeout(timeoutId)
                clearTimeout(fallbackId)
                if (intervalRef.current) clearInterval(intervalRef.current)
            }
        }
    }, [text, hoverOnly, startDelay])

    const handleMouseEnter = () => {
        setIsHovered(true)
        scramble()
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
        // Optional: unscramble immediately or let it finish? 
        // Let's let it finish naturally or just reset to text if needed.
        // For now, let's just ensure it eventually settles to 'text' if we stop the interval, 
        // but the interval logic self-terminates.
    }

    return (
        <span
            className={`inline-block whitespace-nowrap ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {displayText}
        </span>
    )
}
