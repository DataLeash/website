'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { X, Bell, Eye, AlertTriangle, CheckCircle, Shield } from 'lucide-react'

interface RealtimeNotification {
    id: string
    type: 'view' | 'access_request' | 'threat' | 'approval' | 'info'
    title: string
    message: string
    timestamp: Date
    read: boolean
}

interface RealtimeContextType {
    notifications: RealtimeNotification[]
    unreadCount: number
    addNotification: (notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => void
    markAsRead: (id: string) => void
    clearAll: () => void
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function useRealtime() {
    const context = useContext(RealtimeContext)
    if (!context) {
        throw new Error('useRealtime must be used within RealtimeProvider')
    }
    return context
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
    const supabase = createClient()

    // Add notification helper
    const addNotification = useCallback((notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: RealtimeNotification = {
            ...notification,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            read: false,
        }
        setNotifications(prev => [newNotification, ...prev].slice(0, 50))
    }, [])

    // Subscribe to realtime events
    useEffect(() => {
        let logsChannel: ReturnType<typeof supabase.channel> | null = null
        let requestsChannel: ReturnType<typeof supabase.channel> | null = null
        let isMounted = true

        const setupSubscriptions = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !isMounted) return

            // Subscribe to access_logs for the user's files
            logsChannel = supabase
                .channel('realtime_logs')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'access_logs',
                    },
                    async (payload) => {
                        if (!isMounted) return
                        // Check if this log is for the user's files
                        const { data: file } = await supabase
                            .from('files')
                            .select('owner_id, original_name')
                            .eq('id', payload.new.file_id)
                            .single()

                        if (file?.owner_id !== user.id || !isMounted) return

                        const location = payload.new.location as { viewer_email?: string } | null
                        const action = payload.new.action

                        if (action === 'view') {
                            addNotification({
                                type: 'view',
                                title: 'File Viewed',
                                message: `${location?.viewer_email || 'Someone'} viewed ${file.original_name}`,
                            })
                        } else if (['blocked', 'denied'].includes(action)) {
                            addNotification({
                                type: 'threat',
                                title: 'Access Blocked',
                                message: `Blocked access attempt on ${file.original_name}`,
                            })
                        }
                    }
                )
                .subscribe()

            // Subscribe to access_requests
            requestsChannel = supabase
                .channel('realtime_requests')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'access_requests',
                    },
                    async (payload) => {
                        if (!isMounted) return
                        const { data: file } = await supabase
                            .from('files')
                            .select('owner_id, original_name')
                            .eq('id', payload.new.file_id)
                            .single()

                        if (file?.owner_id !== user.id || !isMounted) return

                        addNotification({
                            type: 'access_request',
                            title: 'New Access Request',
                            message: `${payload.new.viewer_email} wants access to ${file.original_name}`,
                        })
                    }
                )
                .subscribe()
        }

        setupSubscriptions()

        return () => {
            isMounted = false
            if (logsChannel) supabase.removeChannel(logsChannel)
            if (requestsChannel) supabase.removeChannel(requestsChannel)
        }
    }, [supabase, addNotification])

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
    }, [])

    const clearAll = useCallback(() => {
        setNotifications([])
    }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <RealtimeContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, clearAll }}>
            {children}
            <NotificationToasts notifications={notifications} onDismiss={markAsRead} />
        </RealtimeContext.Provider>
    )
}

// Toast notifications component
function NotificationToasts({ notifications, onDismiss }: {
    notifications: RealtimeNotification[]
    onDismiss: (id: string) => void
}) {
    const [visibleToasts, setVisibleToasts] = useState<RealtimeNotification[]>([])

    useEffect(() => {
        // Show new notifications as toasts
        const unreadNotifications = notifications.filter(n => !n.read)
        const newNotifications = unreadNotifications.filter(
            n => !visibleToasts.some(t => t.id === n.id)
        )

        if (newNotifications.length > 0) {
            setVisibleToasts(prev => [...newNotifications, ...prev].slice(0, 3))

            // Auto dismiss after 5 seconds
            newNotifications.forEach(n => {
                setTimeout(() => {
                    setVisibleToasts(prev => prev.filter(t => t.id !== n.id))
                }, 5000)
            })
        }
    }, [notifications, visibleToasts])

    const getIcon = (type: string) => {
        switch (type) {
            case 'view': return <Eye className="w-5 h-5" />
            case 'access_request': return <Bell className="w-5 h-5" />
            case 'threat': return <AlertTriangle className="w-5 h-5" />
            case 'approval': return <CheckCircle className="w-5 h-5" />
            default: return <Shield className="w-5 h-5" />
        }
    }

    const getColor = (type: string) => {
        switch (type) {
            case 'view': return 'border-emerald-500 bg-emerald-500/10'
            case 'access_request': return 'border-[var(--primary)] bg-[rgba(0,212,255,0.1)]'
            case 'threat': return 'border-red-500 bg-red-500/10'
            case 'approval': return 'border-green-500 bg-green-500/10'
            default: return 'border-[rgba(0,212,255,0.2)]'
        }
    }

    const getIconColor = (type: string) => {
        switch (type) {
            case 'view': return 'text-emerald-400'
            case 'access_request': return 'text-[var(--primary)]'
            case 'threat': return 'text-red-400'
            case 'approval': return 'text-green-400'
            default: return 'text-[var(--foreground-muted)]'
        }
    }

    if (visibleToasts.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
            {visibleToasts.map(toast => (
                <div
                    key={toast.id}
                    className={`glass-card p-4 border-l-4 ${getColor(toast.type)} animate-slide-in-right`}
                >
                    <div className="flex items-start gap-3">
                        <div className={getIconColor(toast.type)}>
                            {getIcon(toast.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{toast.title}</p>
                            <p className="text-sm text-[var(--foreground-muted)] truncate">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => {
                                setVisibleToasts(prev => prev.filter(t => t.id !== toast.id))
                                onDismiss(toast.id)
                            }}
                            className="text-[var(--foreground-muted)] hover:text-white transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

// CSS animation for toasts (add to globals.css)
const toastAnimationCSS = `
@keyframes slide-in-right {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
}
`
