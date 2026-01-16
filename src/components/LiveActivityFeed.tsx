'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Activity, Eye, Shield, AlertTriangle, FileText, Clock, ChevronDown } from 'lucide-react'

interface LiveEvent {
    id: string
    type: 'view' | 'blocked' | 'request' | 'approved' | 'upload'
    message: string
    fileName?: string
    email?: string
    timestamp: Date
    isNew: boolean
}

interface LiveActivityFeedProps {
    maxItems?: number
    showHeader?: boolean
    compact?: boolean
}

export function LiveActivityFeed({ maxItems = 10, showHeader = true, compact = false }: LiveActivityFeedProps) {
    const [events, setEvents] = useState<LiveEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(true)
    const supabase = createClient()

    // Add new event helper
    const addEvent = useCallback((event: Omit<LiveEvent, 'id' | 'timestamp' | 'isNew'>) => {
        setEvents(prev => {
            const newEvent: LiveEvent = {
                ...event,
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                isNew: true,
            }
            // Remove isNew flag after animation
            setTimeout(() => {
                setEvents(current =>
                    current.map(e => e.id === newEvent.id ? { ...e, isNew: false } : e)
                )
            }, 2000)
            return [newEvent, ...prev].slice(0, maxItems)
        })
    }, [maxItems])

    // Fetch initial events and subscribe to realtime
    useEffect(() => {
        const setup = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Fetch recent logs
            const { data: logs } = await supabase
                .from('access_logs')
                .select('*, files!inner(owner_id, original_name)')
                .eq('files.owner_id', user.id)
                .order('timestamp', { ascending: false })
                .limit(maxItems)

            if (logs) {
                setEvents(logs.map(log => ({
                    id: log.id,
                    type: ['blocked', 'denied', 'access_denied'].includes(log.action)
                        ? 'blocked'
                        : 'view',
                    message: log.action === 'view'
                        ? `${(log.location as any)?.viewer_email || 'Someone'} viewed your file`
                        : `Blocked access attempt`,
                    fileName: log.files?.original_name,
                    email: (log.location as any)?.viewer_email,
                    timestamp: new Date(log.timestamp),
                    isNew: false,
                })))
            }
            setLoading(false)

            // Subscribe to new logs
            const channel = supabase
                .channel('live_activity_feed')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'access_logs',
                    },
                    async (payload) => {
                        const { data: file } = await supabase
                            .from('files')
                            .select('owner_id, original_name')
                            .eq('id', payload.new.file_id)
                            .single()

                        if (file?.owner_id !== user.id) return

                        const location = payload.new.location as any
                        const action = payload.new.action

                        addEvent({
                            type: ['blocked', 'denied', 'access_denied'].includes(action) ? 'blocked' : 'view',
                            message: action === 'view'
                                ? `${location?.viewer_email || 'Someone'} viewed your file`
                                : `Blocked access attempt`,
                            fileName: file.original_name,
                            email: location?.viewer_email,
                        })
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        setup()
    }, [supabase, addEvent, maxItems])

    const formatTime = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)

        if (seconds < 10) return 'Just now'
        if (seconds < 60) return `${seconds}s ago`
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        return date.toLocaleDateString()
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'view': return <Eye className="w-4 h-4 text-emerald-400" />
            case 'blocked': return <AlertTriangle className="w-4 h-4 text-red-400" />
            case 'request': return <Shield className="w-4 h-4 text-[var(--primary)]" />
            case 'approved': return <Shield className="w-4 h-4 text-green-400" />
            case 'upload': return <FileText className="w-4 h-4 text-purple-400" />
            default: return <Activity className="w-4 h-4" />
        }
    }

    if (loading) {
        return (
            <div className={`glass-card ${compact ? 'p-4' : 'p-6'}`}>
                <div className="text-center text-[var(--foreground-muted)]">Loading activity...</div>
            </div>
        )
    }

    return (
        <div className={`glass-card ${compact ? 'p-4' : 'p-6'}`}>
            {showHeader && (
                <div
                    className="flex items-center justify-between mb-4 cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    <h3 className="font-bold flex items-center gap-2">
                        <div className="relative">
                            <Activity className="w-5 h-5 text-[var(--primary)]" />
                            {events.some(e => e.isNew) && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                            )}
                        </div>
                        Live Activity
                    </h3>
                    <ChevronDown className={`w-4 h-4 transition ${expanded ? 'rotate-180' : ''}`} />
                </div>
            )}

            {expanded && (
                <>
                    {events.length === 0 ? (
                        <div className="text-center text-[var(--foreground-muted)] py-4">
                            No recent activity
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className={`flex items-start gap-3 p-2 rounded-lg transition ${event.isNew
                                        ? 'bg-[rgba(0,212,255,0.1)] animate-slide-in-right'
                                        : 'hover:bg-[rgba(0,212,255,0.05)]'
                                        }`}
                                >
                                    <div className="mt-0.5">{getIcon(event.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">
                                            {event.message}
                                            {event.fileName && (
                                                <span className="text-[var(--foreground-muted)]"> • {event.fileName}</span>
                                            )}
                                        </p>
                                    </div>
                                    <span className="text-xs text-[var(--foreground-muted)] flex-shrink-0 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTime(event.timestamp)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
