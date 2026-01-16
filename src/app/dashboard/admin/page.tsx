'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import {
    Users, CreditCard, Shield, Crown, Clock, Search,
    RefreshCw, ChevronLeft, ChevronRight, Ban, Check,
    AlertTriangle, TrendingUp, DollarSign, Calendar
} from 'lucide-react'

interface User {
    id: string
    email: string
    full_name: string | null
    tier: string
    tier_started_at: string | null
    tier_expires_at: string | null
    kofi_subscription_id: string | null
    payment_source: string | null
    is_admin: boolean
    account_status: string
    last_login_at: string | null
    created_at: string
    file_count: number
    is_expired: boolean
    effective_tier: string
}

interface Payment {
    id: string
    user_email: string
    amount: number
    currency: string
    payment_source: string
    status: string
    tier_granted: string
    tier_duration_days: number
    auto_activated: boolean
    created_at: string
}

interface Stats {
    total: number
    free: number
    pro: number
    enterprise: number
}

export default function AdminPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'users' | 'payments'>('users')
    const [users, setUsers] = useState<User[]>([])
    const [payments, setPayments] = useState<Payment[]>([])
    const [stats, setStats] = useState<Stats>({ total: 0, free: 0, pro: 0, enterprise: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [tierFilter, setTierFilter] = useState('all')
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                limit: '20',
                offset: String(page * 20),
                ...(tierFilter !== 'all' && { tier: tierFilter }),
                ...(search && { search })
            })

            const res = await fetch(`/api/admin/users?${params}`)
            const data = await res.json()

            if (!res.ok) {
                if (res.status === 403) {
                    setError('Access denied. Admin privileges required.')
                    setIsAdmin(false)
                    return
                }
                throw new Error(data.error)
            }

            setIsAdmin(true)
            setUsers(data.users || [])
            setStats(data.stats || { total: 0, free: 0, pro: 0, enterprise: 0 })
            setHasMore(data.pagination?.hasMore || false)
        } catch (err) {
            setError('Failed to load users')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [page, tierFilter, search])

    const fetchPayments = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/payments?limit=50')
            const data = await res.json()

            if (res.ok) {
                setPayments(data.payments || [])
            }
        } catch (err) {
            console.error('Failed to load payments:', err)
        }
    }, [])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    useEffect(() => {
        if (activeTab === 'payments' && isAdmin) {
            fetchPayments()
        }
    }, [activeTab, isAdmin, fetchPayments])

    const handleAction = async (userId: string, action: string, reason?: string) => {
        if (!confirm(`Are you sure you want to ${action.replace('_', ' ')} this user?`)) return

        setActionLoading(userId)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, action, reason })
            })

            if (res.ok) {
                fetchUsers()
            }
        } catch (err) {
            console.error('Action failed:', err)
        } finally {
            setActionLoading(null)
        }
    }

    const formatDate = (date: string | null) => {
        if (!date) return 'Never'
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatTime = (date: string) => {
        return new Date(date).toLocaleString()
    }

    if (!isAdmin && !loading) {
        return (
            <div className="gradient-bg min-h-screen">
                <Sidebar />
                <main className="md:ml-72 p-8">
                    <div className="glass-card p-12 text-center">
                        <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
                        <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
                        <p className="text-[var(--foreground-muted)]">
                            You don't have administrator privileges.
                        </p>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="md:ml-72 ml-0 p-4 md:p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-[var(--foreground-muted)]">Manage users, tiers, and payments</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-[var(--primary)]" />
                            <div>
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <div className="text-xs text-[var(--foreground-muted)]">Total Users</div>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <Crown className="w-8 h-8 text-yellow-500" />
                            <div>
                                <div className="text-2xl font-bold text-yellow-500">{stats.pro}</div>
                                <div className="text-xs text-[var(--foreground-muted)]">Pro Users</div>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-gray-400" />
                            <div>
                                <div className="text-2xl font-bold">{stats.free}</div>
                                <div className="text-xs text-[var(--foreground-muted)]">Free Users</div>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-emerald-400" />
                            <div>
                                <div className="text-2xl font-bold text-emerald-400">
                                    {stats.total > 0 ? Math.round((stats.pro / stats.total) * 100) : 0}%
                                </div>
                                <div className="text-xs text-[var(--foreground-muted)]">Conversion</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${activeTab === 'users'
                            ? 'bg-[var(--primary)] text-black'
                            : 'glass-card hover:border-[var(--primary)]'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${activeTab === 'payments'
                            ? 'bg-[var(--primary)] text-black'
                            : 'glass-card hover:border-[var(--primary)]'
                            }`}
                    >
                        <CreditCard className="w-4 h-4" />
                        Payments
                    </button>
                </div>

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <>
                        {/* Search & Filters */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search by email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                                    className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[rgba(255,255,255,0.1)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                                />
                            </div>
                            <select
                                value={tierFilter}
                                onChange={(e) => setTierFilter(e.target.value)}
                                className="px-4 py-2 bg-[var(--background)] border border-[rgba(255,255,255,0.1)] rounded-lg"
                            >
                                <option value="all">All Tiers</option>
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                            </select>
                            <button
                                onClick={fetchUsers}
                                className="px-4 py-2 glass-card hover:border-[var(--primary)] flex items-center gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        {/* Users Table */}
                        <div className="glass-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-[rgba(255,255,255,0.1)]">
                                        <tr className="text-left text-sm text-[var(--foreground-muted)]">
                                            <th className="px-4 py-3">User</th>
                                            <th className="px-4 py-3">Tier</th>
                                            <th className="px-4 py-3">Files</th>
                                            <th className="px-4 py-3">Expires</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)]">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <div className="font-medium">{user.email}</div>
                                                        <div className="text-xs text-[var(--foreground-muted)]">
                                                            {user.full_name || 'No name'} • Joined {formatDate(user.created_at)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.effective_tier === 'pro'
                                                        ? 'bg-yellow-500/20 text-yellow-500'
                                                        : 'bg-gray-500/20 text-gray-400'
                                                        }`}>
                                                        {user.effective_tier.toUpperCase()}
                                                        {user.is_expired && ' (expired)'}
                                                    </span>
                                                    {user.payment_source && (
                                                        <div className="text-xs text-[var(--foreground-muted)] mt-1">
                                                            via {user.payment_source}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-medium">{user.file_count}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {user.tier_expires_at ? (
                                                        <div className={user.is_expired ? 'text-red-400' : ''}>
                                                            {formatDate(user.tier_expires_at)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[var(--foreground-muted)]">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${user.account_status === 'active'
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : user.account_status === 'suspended'
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {user.account_status || 'active'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        {user.effective_tier === 'free' ? (
                                                            <button
                                                                onClick={() => handleAction(user.id, 'upgrade_pro')}
                                                                disabled={actionLoading === user.id}
                                                                className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 disabled:opacity-50"
                                                            >
                                                                <Crown className="w-3 h-3 inline mr-1" />
                                                                Upgrade
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAction(user.id, 'extend_pro')}
                                                                    disabled={actionLoading === user.id}
                                                                    className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30 disabled:opacity-50"
                                                                >
                                                                    <Clock className="w-3 h-3 inline mr-1" />
                                                                    +30d
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(user.id, 'downgrade_free')}
                                                                    disabled={actionLoading === user.id}
                                                                    className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs hover:bg-gray-500/30 disabled:opacity-50"
                                                                >
                                                                    Downgrade
                                                                </button>
                                                            </>
                                                        )}
                                                        {user.account_status !== 'suspended' && (
                                                            <button
                                                                onClick={() => handleAction(user.id, 'suspend')}
                                                                disabled={actionLoading === user.id}
                                                                className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 disabled:opacity-50"
                                                            >
                                                                <Ban className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(255,255,255,0.1)]">
                                <span className="text-sm text-[var(--foreground-muted)]">
                                    Page {page + 1}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="p-2 glass-card disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={!hasMore}
                                        className="p-2 glass-card disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-[rgba(255,255,255,0.1)]">
                            <h2 className="font-bold flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Payment History
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-[rgba(255,255,255,0.1)]">
                                    <tr className="text-left text-sm text-[var(--foreground-muted)]">
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Source</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Auto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-[var(--foreground-muted)]">
                                                No payments recorded yet
                                            </td>
                                        </tr>
                                    ) : (
                                        payments.map((payment) => (
                                            <tr key={payment.id} className="border-b border-[rgba(255,255,255,0.05)]">
                                                <td className="px-4 py-3 text-sm">
                                                    {formatTime(payment.created_at)}
                                                </td>
                                                <td className="px-4 py-3">{payment.user_email}</td>
                                                <td className="px-4 py-3 font-medium text-emerald-400">
                                                    ${payment.amount} {payment.currency}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 bg-[rgba(0,212,255,0.1)] rounded text-xs">
                                                        {payment.payment_source}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${payment.status === 'completed'
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-yellow-500/20 text-yellow-400'
                                                        }`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {payment.auto_activated ? (
                                                        <Check className="w-4 h-4 text-emerald-400" />
                                                    ) : (
                                                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
