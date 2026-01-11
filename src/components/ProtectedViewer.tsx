'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { SecurityToast } from './SecurityToast'
import { activateAdvancedProtections, type ProtectionConfig } from '@/lib/viewer-protection'

interface ProtectedViewerProps {
    fileUrl: string
    fileName: string
    mimeType: string
    viewerName: string
    viewerEmail: string
    fileId: string
    sessionId?: string  // Added for session tracking
    fingerprint?: any   // Device fingerprint
}

export default function ProtectedViewer({
    fileUrl,
    fileName,
    mimeType,
    viewerName,
    viewerEmail,
    fileId,
    sessionId: initialSessionId,
    fingerprint
}: ProtectedViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [watermarkText, setWatermarkText] = useState('')
    const [isBlurred, setIsBlurred] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)
    const [sessionError, setSessionError] = useState<string | null>(null)
    const [isOnline, setIsOnline] = useState(true)
    const [toast, setToast] = useState<{ message: string, type: 'warning' | 'error' } | null>(null)
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

    const showSecurityAlert = useCallback((message: string) => {
        setToast({ message, type: 'error' })
    }, [])

    useEffect(() => {
        // Generate watermark with viewer info and timestamp
        const timestamp = new Date().toISOString()
        setWatermarkText(`CONFIDENTIAL • ${viewerEmail} • ${timestamp}`)

        // Prevent right-click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault()
            showSecurityAlert('Right-click is disabled for security reasons.')
            return false
        }

        // Prevent keyboard shortcuts (Ctrl+S, Ctrl+C, Print Screen, etc.)
        const handleKeyDown = (e: KeyboardEvent) => {
            // Block common copy/save shortcuts
            if (
                (e.ctrlKey || e.metaKey) &&
                ['s', 'c', 'x', 'p', 'a', 'u'].includes(e.key.toLowerCase())
            ) {
                e.preventDefault()
                showSecurityAlert('This shortcut is disabled for security.')
                return false
            }
            // Block Print Screen
            if (e.key === 'PrintScreen') {
                e.preventDefault()
                navigator.clipboard.writeText('')
                showSecurityAlert('Screenshots are blocked by DataLeash.')
                return false
            }
            // Block F12 (Developer tools)
            if (e.key === 'F12') {
                e.preventDefault()
                return false
            }
        }

        // Prevent drag and drop
        const handleDragStart = (e: DragEvent) => {
            e.preventDefault()
            return false
        }

        // Detect tab/window visibility changes (potential screenshot)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // User switched away - could be screenshotting
                console.log('Tab hidden - potential screenshot attempt')
            }
        }

        // Detect DevTools opening
        const detectDevTools = () => {
            // Skip on mobile/touch devices where window dimensions are unreliable
            if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return

            const threshold = 160
            const widthThreshold = window.outerWidth - window.innerWidth > threshold
            const heightThreshold = window.outerHeight - window.innerHeight > threshold

            if (widthThreshold || heightThreshold) {
                setIsBlurred(true)
            } else {
                setIsBlurred(false)
            }
        }

        // Prevent copy
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault()
            showSecurityAlert('Copying content is disabled.')
        }

        // Prevent selection
        const handleSelectStart = (e: Event) => {
            e.preventDefault()
            return false
        }

        // Add event listeners
        document.addEventListener('contextmenu', handleContextMenu)
        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('dragstart', handleDragStart)
        document.addEventListener('visibilitychange', handleVisibilityChange)
        document.addEventListener('copy', handleCopy)
        document.addEventListener('selectstart', handleSelectStart)

        // Check for DevTools periodically
        const devToolsInterval = setInterval(detectDevTools, 1000)

        // Cleanup
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu)
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('dragstart', handleDragStart)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            document.removeEventListener('copy', handleCopy)
            document.removeEventListener('selectstart', handleSelectStart)
            clearInterval(devToolsInterval)
        }
    }, [viewerEmail, showSecurityAlert])

    // Session heartbeat - continuous authorization per DataLeash spec
    useEffect(() => {
        // Create session on mount if no sessionId provided
        const createSession = async () => {
            if (!sessionId) {
                try {
                    const res = await fetch('/api/session/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            file_id: fileId,
                            viewer_email: viewerEmail,
                            viewer_name: viewerName,
                            fingerprint,
                            device_info: navigator.userAgent
                        })
                    })
                    const data = await res.json()
                    if (data.session_id) {
                        setSessionId(data.session_id)

                        // Activate advanced security protections
                        activateAdvancedProtections({
                            sessionId: data.session_id,
                            fileId,
                            onRevoked: () => {
                                setSessionError('Access has been revoked')
                                setIsBlurred(true)
                            },
                            onTampered: () => {
                                setSessionError('Security violation detected')
                                setIsBlurred(true)
                            }
                        })
                    }
                } catch (err) {
                    console.error('Failed to create session:', err)
                }
            }
        }
        createSession()

        // Heartbeat function
        const sendHeartbeat = async () => {
            if (!sessionId) return

            try {
                const res = await fetch('/api/session/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId })
                })
                const data = await res.json()

                if (!data.valid) {
                    setSessionError(data.reason || 'Session expired')
                    setIsBlurred(true)
                    if (heartbeatRef.current) {
                        clearInterval(heartbeatRef.current)
                    }
                }
            } catch (err) {
                // Network error - likely offline
                setIsOnline(false)
                setIsBlurred(true)
                setSessionError('Connection lost. Internet required to view this file.')
            }
        }

        // Start heartbeat interval (30 seconds)
        if (sessionId) {
            heartbeatRef.current = setInterval(sendHeartbeat, 30000)
            // Send first heartbeat immediately
            sendHeartbeat()
        }

        // Aggressive online/offline detection - clear content on disconnect
        const handleOnline = () => {
            setIsOnline(true)
            // Content cannot be restored - security measure
            // User must reload the page
        }
        const handleOffline = () => {
            setIsOnline(false)
            setIsBlurred(true)
            setSessionError('DISCONNECTED - Content secured. Internet required to view.')

            // AGGRESSIVE: Clear the file content from memory
            // This is a security measure per DataLeash spec
            if (fileUrl && fileUrl.startsWith('blob:')) {
                URL.revokeObjectURL(fileUrl)
            }
        }
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Check online status immediately
        if (!navigator.onLine) {
            handleOffline()
        }

        // Cleanup
        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current)
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)

            // End session on unmount
            if (sessionId) {
                try {
                    navigator.sendBeacon('/api/session/end', JSON.stringify({ session_id: sessionId }))
                } catch (e) {
                    // Ignore errors during unload
                }
            }

            // Clear file URL on unmount for security
            if (fileUrl && fileUrl.startsWith('blob:')) {
                URL.revokeObjectURL(fileUrl)
            }
        }
    }, [sessionId, fileId, viewerEmail, viewerName, fingerprint, fileUrl])

    // Render based on file type
    const renderContent = () => {
        if (mimeType.startsWith('image/')) {
            return (
                <div className="relative select-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={fileUrl}
                        alt={fileName}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        className="max-w-full max-h-[70vh] rounded-lg pointer-events-none"
                        style={{
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            WebkitTouchCallout: 'none'
                        }}
                    />
                </div>
            )
        }

        if (mimeType === 'application/pdf') {
            // Render PDF in protected embed with overlay to prevent downloads
            return (
                <div className="relative w-full h-[70vh] select-none">
                    {/* PDF Embed */}
                    <embed
                        src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                        type="application/pdf"
                        className="w-full h-full rounded-lg"
                        style={{
                            pointerEvents: 'auto', // Allow scrolling
                        }}
                    />
                    {/* Invisible overlay to prevent right-click on PDF */}
                    <div
                        className="absolute inset-0 z-10"
                        style={{ pointerEvents: 'none' }}
                        onContextMenu={(e) => e.preventDefault()}
                    />
                    {/* Security notice */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80 text-center text-xs text-[var(--foreground-muted)]">
                        🔒 Protected Document • {viewerEmail} • Downloads Disabled
                    </div>
                </div>
            )
        }

        if (mimeType.startsWith('text/')) {
            return (
                <pre
                    className="p-4 bg-[rgba(0,0,0,0.3)] rounded-lg overflow-auto max-h-[70vh] text-sm select-none"
                    style={{ userSelect: 'none' }}
                >
                    {/* Text content would be loaded here */}
                    Protected text content
                </pre>
            )
        }

        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📁</div>
                <h2 className="text-xl font-bold mb-2">{fileName}</h2>
                <p className="text-[var(--foreground-muted)]">
                    This file type requires the Data Leash desktop app to view securely.
                </p>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className={`protected-viewer relative ${isBlurred ? 'blur-lg' : ''}`}
            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
            }}
        >
            {/* Security Toasts */}
            {toast && (
                <SecurityToast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Invisible overlay to prevent interactions */}
            <div
                className="absolute inset-0 z-10"
                style={{ pointerEvents: 'none' }}
            />

            {/* Watermark overlay */}
            <div
                className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
                style={{ opacity: 0.03 }}
            >
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute whitespace-nowrap text-white font-bold text-sm"
                        style={{
                            transform: `rotate(-30deg)`,
                            top: `${(i * 100) - 200}px`,
                            left: '-100px',
                            width: '200%',
                        }}
                    >
                        {watermarkText} &nbsp;&nbsp;&nbsp; {watermarkText} &nbsp;&nbsp;&nbsp; {watermarkText}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="relative z-5">
                {renderContent()}
            </div>

            {/* Security/Session alert overlay */}
            {(isBlurred || sessionError) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30 backdrop-blur-sm">
                    <div className="text-center glass-card p-8 max-w-md">
                        <div className="text-6xl mb-4">
                            {sessionError ? '🔒' : '🚫'}
                        </div>
                        <h2 className="text-xl font-bold text-[var(--error)] mb-2">
                            {sessionError ? 'Access Terminated' : 'Security Alert'}
                        </h2>
                        <p className="text-[var(--foreground-muted)] mb-4">
                            {sessionError || 'Developer tools detected. Content hidden for security.'}
                        </p>
                        {sessionError && (
                            <button
                                onClick={() => window.location.reload()}
                                className="glow-button px-6 py-2 rounded-lg font-semibold text-black"
                            >
                                Try Again
                            </button>
                        )}
                        {!isOnline && (
                            <p className="text-xs text-[var(--warning)] mt-4">
                                ⚠️ DataLeash requires an active internet connection
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* CSS to prevent various attacks */}
            <style jsx global>{`
                .protected-viewer {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                    -webkit-touch-callout: none !important;
                }
                .protected-viewer img {
                    -webkit-user-drag: none !important;
                    -khtml-user-drag: none !important;
                    -moz-user-drag: none !important;
                    -o-user-drag: none !important;
                    user-drag: none !important;
                    pointer-events: none !important;
                }
                @media print {
                    .protected-viewer {
                        display: none !important;
                    }
                    body::after {
                        content: "Printing is disabled for security reasons.";
                        display: block;
                        text-align: center;
                        padding: 50px;
                        font-size: 24px;
                    }
                }
            `}</style>
        </div>
    )
}
