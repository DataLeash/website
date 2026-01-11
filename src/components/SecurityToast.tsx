'use client'

import { useEffect, useState } from 'react'
import { Shield, Lock, AlertTriangle, X } from 'lucide-react'

interface SecurityToastProps {
    message: string
    type?: 'warning' | 'error' | 'info'
    onClose: () => void
    duration?: number
}

export function SecurityToast({ message, type = 'warning', onClose, duration = 3000 }: SecurityToastProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Small delay for enter animation
        const timer = setTimeout(() => setIsVisible(true), 10)

        // Auto close
        const closeTimer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(onClose, 300) // Wait for exit animation
        }, duration)

        return () => {
            clearTimeout(timer)
            clearTimeout(closeTimer)
        }
    }, [duration, onClose])

    const getIcon = () => {
        switch (type) {
            case 'error': return <Shield className="w-5 h-5 text-red-500" />
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />
            case 'info': return <Lock className="w-5 h-5 text-blue-500" />
        }
    }

    const getColors = () => {
        switch (type) {
            case 'error': return 'bg-red-500/10 border-red-500/50 text-red-200'
            case 'warning': return 'bg-amber-500/10 border-amber-500/50 text-amber-200'
            case 'info': return 'bg-blue-500/10 border-blue-500/50 text-blue-200'
        }
    }

    return (
        <div
            className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-lg transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
                } ${getColors()}`}
        >
            {getIcon()}
            <span className="font-medium text-sm">{message}</span>
            <button
                onClick={() => {
                    setIsVisible(false)
                    setTimeout(onClose, 300)
                }}
                className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
