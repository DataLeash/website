'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Users, Search, RefreshCw, ChevronLeft, ChevronRight,
    Crown, Ban, Clock, Filter
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

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [tierFilter, setTierFilter] = useState('all')
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

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

            if (res.ok) {
                setUsers(data.users || [])
                setHasMore(data.pagination?.hasMore || false)
            }
        } catch (err) {
            console.error('Failed to load users', err)
        } finally {
            setLoading(false)
        }
    }, [page, tierFilter, search])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleAction = async (userId: string, action: string) => {
        if (!confirm(`Are you sure you want to ${action.replace('_', ' ')} this user?`)) return

        setActionLoading(userId)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, action })
            })

            if (res.ok) fetchUsers()
        } catch (err) {
            console.error('Action failed:', err)
        } finally {
            setActionLoading(null)
        }
    }

    const formatDate = (date: string | null) => {
        if (!date) return 'Never'
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
                <p className="text-gray-400 text-sm">Monitor accounts, manage tiers, and enforce policies</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-[#0A0A0A] border border-gray-800 rounded-xl">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                        className="w-full pl-9 pr-4 py-2 bg-[#050505] border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={tierFilter}
                        onChange={(e) => setTierFilter(e.target.value)}
                        className="px-3 py-2 bg-[#050505] border border-gray-800 rounded-lg text-sm text-gray-300 focus:outline-none"
                    >
                        <option value="all">All Tiers</option>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                    </select>
                    <button
                        onClick={fetchUsers}
                        className="p-2 bg-[#050505] border border-gray-800 rounded-lg text-gray-400 hover:text-white transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0F0F0F] text-gray-500 font-medium border-b border-gray-800">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Files</th>
                                <th className="px-4 py-3">Tier Expires</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-200">{user.email}</div>
                                        <div className="text-xs text-gray-500">{user.full_name || 'No Name'}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${user.effective_tier === 'pro'
                                                    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                    : 'bg-gray-800 text-gray-400 border-gray-700'
                                                }`}>
                                                {user.effective_tier.toUpperCase()}
                                            </span>
                                            {user.account_status !== 'active' && (
                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                                                    {user.account_status.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{user.file_count}</td>
                                    <td className="px-4 py-3 text-gray-400">
                                        {formatDate(user.tier_expires_at)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            {user.effective_tier === 'free' ? (
                                                <button
                                                    onClick={() => handleAction(user.id, 'upgrade_pro')}
                                                    disabled={!!actionLoading}
                                                    className="p-1.5 text-yellow-500 hover:bg-yellow-500/10 rounded transition"
                                                    title="Upgrade to Pro"
                                                >
                                                    <Crown className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(user.id, 'extend_pro')}
                                                        disabled={!!actionLoading}
                                                        className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition"
                                                        title="Extend +30 Days"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(user.id, 'downgrade_free')}
                                                        disabled={!!actionLoading}
                                                        className="p-1.5 text-gray-400 hover:bg-gray-800 rounded transition"
                                                        title="Downgrade to Free"
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-[#0F0F0F]">
                    <span className="text-xs text-gray-500">Page {page + 1}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-1 rounded hover:bg-white/5 disabled:opacity-30 text-gray-400"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!hasMore}
                            className="p-1 rounded hover:bg-white/5 disabled:opacity-30 text-gray-400"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
