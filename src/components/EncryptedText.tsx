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
            setDisplayText(prev =>
                text
                    .split('')
                    .map((letter, index) => {
                        if (index < iteration) {
                            return text[index]
                        }
                        return chars[Math.floor(Math.random() * chars.length)]
                    })
                    .join('')
            )

            if (iteration >= text.length) {
                if (intervalRef.current) clearInterval(intervalRef.current)
            }

            iteration += 1 / 3
        }, 30)
    }

    useEffect(() => {
        if (!hoverOnly) {
            if (startDelay > 0) {
                setTimeout(scramble, startDelay)
            } else {
                scramble()
            }
        }
    }, [])

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
