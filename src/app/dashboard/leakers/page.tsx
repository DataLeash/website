'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks'
import { Sidebar } from '@/components/Sidebar'
import { Icon3D } from '@/components/Icon3D'
import { PageLoading, LoadingSpinner } from '@/components/LoadingSpinner'

interface Leaker {
    id: string
    original_recipient_email: string
    original_recipient_name: string | null
    original_fingerprint_hash: string | null
    file_id: string
    file_name: string | null
    unauthorized_fingerprint_hash: string
    unauthorized_fingerprint: any
    unauthorized_ip: string | null
    unauthorized_ip_info: any | null
    unauthorized_location: string | null
    detection_type: string
    similarity_score: number
    status: string
    detected_at: string
}

export default function LeakersPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [leakers, setLeakers] = useState<Leaker[]>([])
    const [loading, setLoading] = useState(true)
    const [counts, setCounts] = useState({ unreviewed: 0, confirmed: 0, blacklisted: 0 })
    const [selectedLeaker, setSelectedLeaker] = useState<Leaker | null>(null)
    const [filter, setFilter] = useState<string>('all')

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (user) {
            fetchLeakers()
        }
    }, [user])

    const fetchLeakers = async () => {
        try {
            const res = await fetch('/api/leakers')
            const data = await res.json()
            setLeakers(data.leakers || [])
            setCounts(data.counts || { unreviewed: 0, confirmed: 0, blacklisted: 0 })
        } catch (error) {
            console.error('Error fetching leakers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (leakerId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/leakers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leaker_id: leakerId,
                    status: newStatus
                })
            })

            if (res.ok) {
                fetchLeakers()
                setSelectedLeaker(null)
            }
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        return `${days}d ago`
    }

    const filteredLeakers = filter === 'all'
        ? leakers
        : leakers.filter(l => l.status === filter)

    if (authLoading) {
        return <PageLoading text="Loading..." />
    }

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <Icon3D type="danger" size="lg" />
                        <div>
                            <h1 className="text-3xl font-bold">Suspected Leakers</h1>
                            <p className="text-[var(--foreground-muted)]">
                                Detect when someone shares your link to unauthorized recipients
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="glass-card p-6 border-l-4 border-yellow-500">
                        <div className="text-3xl font-bold text-yellow-500">{counts.unreviewed}</div>
                        <div className="text-sm text-[var(--foreground-muted)]">Unreviewed</div>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-red-500">
                        <div className="text-3xl font-bold text-red-500">{counts.confirmed}</div>
                        <div className="text-sm text-[var(--foreground-muted)]">Confirmed Leaks</div>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-[var(--primary)]">
                        <div className="text-3xl font-bold text-[var(--primary)]">{counts.blacklisted}</div>
                        <div className="text-sm text-[var(--foreground-muted)]">Blacklisted</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    {['all', 'unreviewed', 'confirmed_leak', 'blacklisted', 'false_positive'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                    ? 'bg-[var(--primary)] text-black'
                                    : 'glass-card hover:border-[var(--primary)]'
                                }`}
                        >
                            {f === 'all' ? 'All' : f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </button>
                    ))}
                </div>

                {/* Leakers List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : filteredLeakers.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="text-6xl mb-4">✅</div>
                        <h3 className="text-xl font-bold mb-2">No Suspected Leakers</h3>
                        <p className="text-[var(--foreground-muted)]">
                            No one has been detected sharing your links yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredLeakers.map(leaker => (
                            <div
                                key={leaker.id}
                                className="glass-card p-6 cursor-pointer hover:border-[var(--primary)] transition-all"
                                onClick={() => setSelectedLeaker(leaker)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-4">
                                        <div className="text-4xl">
                                            {leaker.status === 'unreviewed' ? '⚠️' :
                                                leaker.status === 'confirmed_leak' ? '🚨' :
                                                    leaker.status === 'blacklisted' ? '🚫' : '✅'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">
                                                {leaker.original_recipient_email || 'Unknown Recipient'}
                                            </h3>
                                            <p className="text-[var(--foreground-muted)] text-sm">
                                                Shared link to: <span className="text-red-400">{leaker.file_name || 'Unknown File'}</span>
                                            </p>
                                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                                Unauthorized access from: {leaker.unauthorized_location || leaker.unauthorized_ip || 'Unknown Location'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${leaker.status === 'unreviewed' ? 'bg-yellow-500/20 text-yellow-500' :
                                                leaker.status === 'confirmed_leak' ? 'bg-red-500/20 text-red-500' :
                                                    leaker.status === 'blacklisted' ? 'bg-[var(--primary)]/20 text-[var(--primary)]' :
                                                        'bg-green-500/20 text-green-500'
                                            }`}>
                                            {leaker.status.replace(/_/g, ' ')}
                                        </span>
                                        <div className="text-sm text-[var(--foreground-muted)] mt-2">
                                            {formatTime(leaker.detected_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detail Modal */}
                {selectedLeaker && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="glass-card p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold">Leak Details</h2>
                                <button
                                    onClick={() => setSelectedLeaker(null)}
                                    className="text-[var(--foreground-muted)] hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Original Recipient */}
                                <div className="glass-card p-4 bg-yellow-500/10 border-yellow-500/30">
                                    <h3 className="font-bold mb-2 text-yellow-500">📤 Original Recipient (Suspected Leaker)</h3>
                                    <p><strong>Email:</strong> {selectedLeaker.original_recipient_email || 'Unknown'}</p>
                                    <p><strong>Name:</strong> {selectedLeaker.original_recipient_name || 'Unknown'}</p>
                                </div>

                                {/* Unauthorized Access */}
                                <div className="glass-card p-4 bg-red-500/10 border-red-500/30">
                                    <h3 className="font-bold mb-2 text-red-500">🚨 Unauthorized Access (Who They Shared To)</h3>
                                    <p><strong>IP:</strong> {selectedLeaker.unauthorized_ip || 'Unknown'}</p>
                                    <p><strong>Location:</strong> {selectedLeaker.unauthorized_location || 'Unknown'}</p>
                                    {selectedLeaker.unauthorized_ip_info && (
                                        <>
                                            <p><strong>ISP:</strong> {selectedLeaker.unauthorized_ip_info.isp}</p>
                                            <p><strong>Country:</strong> {selectedLeaker.unauthorized_ip_info.country}</p>
                                        </>
                                    )}
                                    {selectedLeaker.unauthorized_fingerprint && (
                                        <div className="mt-2 p-2 bg-black/20 rounded text-xs font-mono">
                                            <p><strong>Device:</strong> {selectedLeaker.unauthorized_fingerprint.browser} / {selectedLeaker.unauthorized_fingerprint.os}</p>
                                            <p><strong>Screen:</strong> {selectedLeaker.unauthorized_fingerprint.screenResolution}</p>
                                        </div>
                                    )}
                                </div>

                                {/* File Info */}
                                <div className="glass-card p-4">
                                    <h3 className="font-bold mb-2">📄 Leaked File</h3>
                                    <p><strong>Name:</strong> {selectedLeaker.file_name || 'Unknown'}</p>
                                    <p><strong>Detection:</strong> {selectedLeaker.detection_type.replace(/_/g, ' ')}</p>
                                    <p><strong>Detected:</strong> {new Date(selectedLeaker.detected_at).toLocaleString()}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleStatusChange(selectedLeaker.id, 'confirmed_leak')}
                                        className="flex-1 py-3 bg-red-500/20 text-red-500 rounded-lg font-medium hover:bg-red-500/30 transition"
                                    >
                                        Confirm as Leak
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(selectedLeaker.id, 'blacklisted')}
                                        className="flex-1 py-3 bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg font-medium hover:bg-[var(--primary)]/30 transition"
                                    >
                                        🚫 Blacklist Both
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(selectedLeaker.id, 'false_positive')}
                                        className="flex-1 py-3 glass-card hover:bg-white/10 rounded-lg font-medium transition"
                                    >
                                        False Positive
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
