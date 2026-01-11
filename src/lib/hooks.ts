'use client'

import { createClient } from '@/lib/supabase-browser'
import { User, ProtectedFile, AccessLog, Notification } from '@/types/database'
import { useEffect, useState, useCallback } from 'react'

// Auth hook
export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchUserProfile(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    fetchUserProfile(session.user.id)
                } else {
                    setUser(null)
                    setLoading(false)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const fetchUserProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (!error && data) {
            setUser(data as User)
        }
        setLoading(false)
    }

    const signUp = async (email: string, password: string, fullName: string, phone: string, qid: string) => {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, full_name: fullName, phone, qid }),
        })
        return response.json()
    }

    const signIn = async (email: string, password: string) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
        return response.json()
    }

    const signOut = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        setUser(null)
    }

    return { user, loading, signUp, signIn, signOut }
}

// Files hook
export function useFiles() {
    const [files, setFiles] = useState<ProtectedFile[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchFiles = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('files')
            .select('*')
            .eq('owner_id', user.id)
            .eq('is_destroyed', false)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setFiles(data as ProtectedFile[])
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchFiles()
    }, [fetchFiles])

    const uploadFile = async (file: File, settings: object, recipients: string[]) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('settings', JSON.stringify(settings))
        formData.append('recipients', JSON.stringify(recipients))

        const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData,
        })
        const result = await response.json()

        if (!result.error) {
            fetchFiles()
        }

        return result
    }

    const killFile = async (fileId: string) => {
        const response = await fetch(`/api/files/${fileId}/kill`, {
            method: 'POST',
        })
        const result = await response.json()

        if (!result.error) {
            fetchFiles()
        }

        return result
    }

    const chainKill = async () => {
        const response = await fetch('/api/files', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirmation: 'DESTROY ALL' }),
        })
        const result = await response.json()

        if (!result.error) {
            setFiles([])
        }

        return result
    }

    return { files, loading, fetchFiles, uploadFile, killFile, chainKill }
}

// Activity/Access Logs hook
export function useActivity() {
    const [logs, setLogs] = useState<AccessLog[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

        // Get logs for files owned by user
        const { data, error } = await supabase
            .from('access_logs')
            .select(`
        *,
        files!inner(owner_id, original_name),
        users(full_name, email)
      `)
            .eq('files.owner_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(50)

        if (!error && data) {
            setLogs(data as unknown as AccessLog[])
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    return { logs, loading, fetchLogs }
}

// Notifications hook
export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchNotifications = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (!error && data) {
            setNotifications(data as Notification[])
            setUnreadCount(data.filter(n => !n.is_read).length)
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchNotifications()

        // Subscribe to realtime notifications
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    setNotifications(prev => [payload.new as Notification, ...prev])
                    setUnreadCount(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchNotifications, supabase])

    const markAsRead = async (notificationId: string) => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)

        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
        }
    }

    const refetch = () => {
        fetchNotifications()
    }

    return { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, refetch }
}

// Stats hook - now uses combined API endpoint for better performance
export function useStats() {
    const [stats, setStats] = useState({
        totalFiles: 0,
        totalViews: 0,
        activeShares: 0,
        threatsBlocked: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats')
                if (res.ok) {
                    const data = await res.json()
                    setStats({
                        totalFiles: data.totalFiles || 0,
                        totalViews: data.totalViews || 0,
                        activeShares: data.activeShares || 0,
                        threatsBlocked: data.threatsBlocked || 0,
                    })
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    return { stats, loading }
}
