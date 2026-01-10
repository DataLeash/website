'use client'

import { ReactNode } from 'react'

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    text?: string
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps): ReactNode {
    const sizeMap = {
        sm: 'w-8 h-8',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32'
    }

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className={`${sizeMap[size]} relative`}>
                {/* Outer ring */}
                <svg className="absolute inset-0 animate-spin" viewBox="0 0 64 64" fill="none">
                    <defs>
                        <linearGradient id="spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00d4ff" />
                            <stop offset="50%" stopColor="#0099ff" />
                            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="url(#spinner-grad)"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Inner pulse */}
                <svg className="absolute inset-0 animate-pulse" viewBox="0 0 64 64" fill="none">
                    <defs>
                        <radialGradient id="pulse-grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#0099ff" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <circle cx="32" cy="32" r="16" fill="url(#pulse-grad)" />
                </svg>

                {/* Center icon */}
                <svg className="absolute inset-0" viewBox="0 0 64 64" fill="none">
                    <defs>
                        <linearGradient id="lock-center-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00d4ff" />
                            <stop offset="100%" stopColor="#0099ff" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M32 20c-4 0-7 3-7 7v5h-2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V34c0-1.1-.9-2-2-2h-2v-5c0-4-3-7-7-7zm4 12v-5c0-2.2-1.8-4-4-4s-4 1.8-4 4v5h8z"
                        fill="url(#lock-center-grad)"
                    />
                </svg>
            </div>

            {text && (
                <p className="text-[var(--foreground-muted)] animate-pulse">{text}</p>
            )}
        </div>
    )
}

// Full page loading state
export function PageLoading({ text = "Loading..." }: { text?: string }): ReactNode {
    return (
        <div className="gradient-bg min-h-screen flex items-center justify-center">
            <LoadingSpinner size="lg" text={text} />
        </div>
    )
}

// Dashboard loading (with sidebar space)
export function DashboardLoading({ text = "Loading..." }: { text?: string }): ReactNode {
    return (
        <div className="gradient-bg min-h-screen">
            <div className="ml-72 p-8 flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" text={text} />
            </div>
        </div>
    )
}

export default LoadingSpinner
