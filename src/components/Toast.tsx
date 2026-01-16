'use client'

import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { Check, X, AlertTriangle, Info, Copy } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void
    copyToClipboard: (text: string, successMessage?: string) => Promise<boolean>
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        setToasts(prev => [...prev, { id, message, type }])

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3000)
    }, [])

    const copyToClipboard = useCallback(async (text: string, successMessage = 'Copied to clipboard!'): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(text)
            showToast(successMessage, 'success')
            return true
        } catch (err) {
            showToast('Failed to copy', 'error')
            return false
        }
    }, [showToast])

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <Check className="w-5 h-5" />
            case 'error': return <X className="w-5 h-5" />
            case 'warning': return <AlertTriangle className="w-5 h-5" />
            case 'info': return <Info className="w-5 h-5" />
        }
    }

    const getColors = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
            case 'error': return 'bg-red-500/20 border-red-500 text-red-400'
            case 'warning': return 'bg-amber-500/20 border-amber-500 text-amber-400'
            case 'info': return 'bg-blue-500/20 border-blue-500 text-blue-400'
        }
    }

    return (
        <ToastContext.Provider value={{ showToast, copyToClipboard }}>
            {children}

            {/* Toast Container */}
            {toasts.length > 0 && (
                <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-xl shadow-lg animate-slide-in-right ${getColors(toast.type)}`}
                        >
                            {getIcon(toast.type)}
                            <span className="text-sm font-medium text-white">{toast.message}</span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-auto opacity-50 hover:opacity-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    )
}

// Standalone copy button component for easy reuse
export function CopyButton({
    text,
    label = 'Copy',
    successMessage = 'Copied!',
    className = ''
}: {
    text: string
    label?: string
    successMessage?: string
    className?: string
}) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all ${copied
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                } ${className}`}
        >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? successMessage : label}
        </button>
    )
}
