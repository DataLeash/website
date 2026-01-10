'use client'

import { useEffect, useState } from 'react'
import { Icon3D } from './Icon3D'

interface ActiveSession {
    id: string
    viewer_email: string
    viewer_name: string
    viewing_duration: number
    location: string
    ip_info?: {
        city?: string
        country?: string
        isp?: string
    }
    device_info?: string
    files: {
        original_name: string
        id: string
    }
}

export function ActiveViewers() {
    const [sessions, setSessions] = useState<ActiveSession[]>([])
    const [loading, setLoading] = useState(true)
    const [revoking, setRevoking] = useState<string | null>(null)
    const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/sessions/active')
            const data = await res.json()
            setSessions(data.sessions || [])
        } catch (err) {
            console.error('Failed to fetch sessions:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSessions()
        // Refresh every 5 seconds for more real-time feel
        const interval = setInterval(fetchSessions, 5000)
        return () => clearInterval(interval)
    }, [])

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
    }

    // Revoke single session
    const revokeSession = async (sessionId: string) => {
        setRevoking(sessionId)
        try {
            const res = await fetch('/api/session/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId })
            })
            if (res.ok) {
                setSessions(sessions.filter(s => s.id !== sessionId))
                selectedSessions.delete(sessionId)
                setSelectedSessions(new Set(selectedSessions))
            }
        } catch (err) {
            console.error('Revoke failed:', err)
        } finally {
            setRevoking(null)
        }
    }

    // Revoke selected sessions
    const revokeSelected = async () => {
        if (selectedSessions.size === 0) return
        if (!confirm(`Revoke access for ${selectedSessions.size} selected viewer(s)?`)) return

        for (const sessionId of selectedSessions) {
            await revokeSession(sessionId)
        }
        setSelectedSessions(new Set())
    }

    // Toggle session selection
    const toggleSelection = (sessionId: string) => {
        const newSelection = new Set(selectedSessions)
        if (newSelection.has(sessionId)) {
            newSelection.delete(sessionId)
        } else {
            newSelection.add(sessionId)
        }
        setSelectedSessions(newSelection)
    }

    // Select all
    const selectAll = () => {
        if (selectedSessions.size === sessions.length) {
            setSelectedSessions(new Set())
        } else {
            setSelectedSessions(new Set(sessions.map(s => s.id)))
        }
    }

    if (loading) {
        return (
            <div className="glass-card p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Icon3D type="eye" size="sm" />
                    Active Viewers
                </h2>
                <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Icon3D type="eye" size="sm" />
                    Active Viewers
                    {sessions.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-[var(--success)] text-black text-xs rounded-full font-semibold">
                            {sessions.length} live
                        </span>
                    )}
                </h2>
                {sessions.length > 0 && selectedSessions.size > 0 && (
                    <button
                        onClick={revokeSelected}
                        className="px-3 py-1 bg-[var(--error)] text-white text-sm rounded-lg hover:bg-red-600 transition font-semibold"
                    >
                        Revoke Selected ({selectedSessions.size})
                    </button>
                )}
            </div>

            {sessions.length === 0 ? (
                <div className="text-center py-8">
                    <div className="mb-3 flex justify-center opacity-50">
                        <Icon3D type="eye" size="lg" />
                    </div>
                    <p className="text-[var(--foreground-muted)] text-sm">No one viewing files right now</p>
                </div>
            ) : (
                <>
                    {sessions.length > 1 && (
                        <div className="mb-3 flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedSessions.size === sessions.length}
                                    onChange={selectAll}
                                    className="w-4 h-4 rounded border-[var(--primary)]"
                                />
                                Select All
                            </label>
                        </div>
                    )}
                    <div className="space-y-3">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={`flex items-center gap-4 p-3 rounded-lg transition border ${selectedSessions.has(session.id)
                                        ? 'bg-[rgba(0,212,255,0.15)] border-[var(--primary)]'
                                        : 'bg-[rgba(0,212,255,0.05)] border-[rgba(0,212,255,0.1)]'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedSessions.has(session.id)}
                                    onChange={() => toggleSelection(session.id)}
                                    className="w-4 h-4 rounded border-[var(--primary)]"
                                />
                                <div className="w-10 h-10 rounded-full bg-[rgba(0,212,255,0.2)] flex items-center justify-center">
                                    <Icon3D type="users" size="sm" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate text-white">
                                        {session.viewer_name || session.viewer_email}
                                    </div>
                                    <div className="text-xs text-[var(--foreground-muted)] truncate">
                                        {session.files?.original_name} • {session.location}
                                    </div>
                                    {session.device_info && (
                                        <div className="text-xs text-[var(--foreground-muted)] truncate opacity-70 mt-0.5">
                                            {session.device_info.substring(0, 50)}...
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-[var(--success)] flex items-center gap-1">
                                        <span className="w-2 h-2 bg-[var(--success)] rounded-full animate-pulse"></span>
                                        {formatDuration(session.viewing_duration)}
                                    </div>
                                    <button
                                        onClick={() => revokeSession(session.id)}
                                        disabled={revoking === session.id}
                                        className="text-xs text-[var(--error)] hover:underline disabled:opacity-50 mt-1"
                                    >
                                        {revoking === session.id ? 'Revoking...' : 'Revoke'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
