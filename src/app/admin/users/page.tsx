'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    Users, Search, RefreshCw, ChevronLeft, ChevronRight,
    Crown, Ban, Clock, Shield, UserX, UserCheck, MoreVertical,
    Download, AlertTriangle, Trash2, Key, Infinity, Star, X
} from 'lucide-react'

interface User {
    id: string
    email: string
    full_name: string | null
    avatar_url?: string | null
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
    // Auth provider info
    auth_provider: string
    auth_providers: string[]
    email_confirmed: boolean
    in_users_table: boolean
}

interface Toast {
    message: string
    type: 'success' | 'error'
}

interface MenuPosition {
    top: number
    right: number
}

interface PendingAction {
    userId: string
    action: string
    message: string
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [tierFilter, setTierFilter] = useState('all')
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [total, setTotal] = useState(0)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
    const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, right: 0 })
    const [toast, setToast] = useState<Toast | null>(null)
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
    const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 4000)
    }

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
                setTotal(data.pagination?.total || 0)
            } else {
                showToast(data.error || 'Failed to load users', 'error')
            }
        } catch (err) {
            console.error('Failed to load users', err)
            showToast('Failed to load users', 'error')
        } finally {
            setLoading(false)
        }
    }, [page, tierFilter, search])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const openActionMenu = (userId: string) => {
        const button = menuButtonRefs.current[userId]
        if (button) {
            const rect = button.getBoundingClientRect()
            setMenuPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right
            })
        }
        setShowActionMenu(userId)
    }

    const actionMessages: Record<string, string> = {
        'upgrade_pro': 'upgrade this user to Pro tier (30 days)',
        'upgrade_enterprise': 'upgrade this user to Enterprise tier (1 year)',
        'downgrade_free': 'downgrade this user to Free tier',
        'extend_pro': 'extend subscription by 30 days',
        'set_lifetime': 'grant LIFETIME Pro access',
        'suspend': 'suspend this user account',
        'activate': 'activate this user account',
        'ban': 'permanently ban this user',
        'make_admin': 'grant admin privileges to this user',
        'remove_admin': 'revoke admin privileges from this user',
        'reset_password': 'send a password reset email',
        'delete_all_files': 'DELETE ALL FILES for this user (cannot be undone)',
        'delete': 'PERMANENTLY DELETE this user account (cannot be undone)'
    }

    // Show confirmation modal instead of browser confirm
    const requestAction = (userId: string, action: string) => {
        setShowActionMenu(null)
        setPendingAction({
            userId,
            action,
            message: actionMessages[action] || action
        })
    }

    // Execute the confirmed action
    const executeAction = async () => {
        if (!pendingAction) return

        const { userId, action } = pendingAction
        setPendingAction(null)
        setActionLoading(userId)

        try {
            const method = action === 'delete' ? 'DELETE' : 'PATCH'
            const url = action === 'delete'
                ? `/api/admin/users?user_id=${userId}`
                : '/api/admin/users'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                ...(method === 'PATCH' && { body: JSON.stringify({ user_id: userId, action }) })
            })

            const data = await res.json()

            if (res.ok) {
                showToast(data.message || 'Action completed successfully', 'success')
                fetchUsers()
            } else {
                showToast(data.error || data.details || 'Action failed', 'error')
            }
        } catch (err) {
            console.error('Action failed:', err)
            showToast('Action failed - check console', 'error')
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

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string, text: string }> = {
            'active': { bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-400' },
            'suspended': { bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400' },
            'banned': { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' }
        }
        return badges[status] || badges['active']
    }

    const getTierBadge = (tier: string, isExpired: boolean) => {
        if (isExpired) return { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400' }
        const badges: Record<string, { bg: string, text: string }> = {
            'pro': { bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400' },
            'enterprise': { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400' },
            'free': { bg: 'bg-gray-800 border-gray-700', text: 'text-gray-400' }
        }
        return badges[tier] || badges['free']
    }

    const selectedUser = users.find(u => u.id === showActionMenu)

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg border shadow-lg flex items-center gap-2 ${toast.type === 'success'
                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                    : 'bg-red-500/20 border-red-500/30 text-red-400'
                    }`}>
                    {toast.type === 'success' ? <UserCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            {/* Confirmation Modal */}
            {pendingAction && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setPendingAction(null)} />
                    <div className="relative bg-[#111] border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Confirm Action</h3>
                        </div>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to <span className="font-medium text-white">{pendingAction.message}</span>?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setPendingAction(null)}
                                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeAction}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-400" />
                        User Management
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {total} users total • Full control over accounts, tiers, and permissions
                    </p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:border-gray-700 transition"
                    onClick={() => {
                        const csv = users.map(u => `${u.email},${u.full_name || ''},${u.tier},${u.account_status},${u.file_count},${u.created_at}`).join('\n')
                        const blob = new Blob([`Email,Name,Tier,Status,Files,Created\n${csv}`], { type: 'text/csv' })
                        const a = document.createElement('a')
                        a.href = URL.createObjectURL(blob)
                        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
                        a.click()
                    }}
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-[#0A0A0A] border border-gray-800 rounded-xl">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                        className="w-full pl-9 pr-4 py-2 bg-[#050505] border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={tierFilter}
                        onChange={(e) => { setTierFilter(e.target.value); setPage(0) }}
                        className="px-3 py-2 bg-[#050505] border border-gray-800 rounded-lg text-sm text-gray-300 focus:outline-none"
                    >
                        <option value="all">All Tiers</option>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
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
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0F0F0F] text-gray-500 font-medium border-b border-gray-800">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Login Method</th>
                                <th className="px-4 py-3">Tier</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Files</th>
                                <th className="px-4 py-3">Expires</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user.id} className={`hover:bg-white/[0.02] transition-colors ${actionLoading === user.id ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {user.avatar_url && (
                                                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                                            )}
                                            {user.is_admin && (
                                                <span title="System Admin" className="text-red-400">
                                                    <Shield className="w-4 h-4" />
                                                </span>
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-200">{user.email}</div>
                                                <div className="text-xs text-gray-500">
                                                    {user.full_name || 'No Name'}
                                                    {!user.in_users_table && <span className="text-yellow-500 ml-1">(not synced)</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            {user.auth_providers?.includes('google') && (
                                                <span title="Google" className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10">
                                                    <svg className="w-3 h-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                                </span>
                                            )}
                                            {user.auth_providers?.includes('github') && (
                                                <span title="GitHub" className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10">
                                                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                                                </span>
                                            )}
                                            {user.auth_providers?.includes('discord') && (
                                                <span title="Discord" className="flex items-center justify-center w-5 h-5 rounded-full bg-[#5865F2]/20">
                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                                                </span>
                                            )}
                                            {user.auth_providers?.includes('email') && (
                                                <span title="Email/Password" className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20">
                                                    <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></svg>
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500 ml-1">{user.auth_provider}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getTierBadge(user.effective_tier, user.is_expired).bg} ${getTierBadge(user.effective_tier, user.is_expired).text}`}>
                                            {user.effective_tier.toUpperCase()}
                                            {user.is_expired && ' (EXP)'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(user.account_status).bg} ${getStatusBadge(user.account_status).text}`}>
                                            {user.account_status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{user.file_count}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(user.tier_expires_at)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            {/* Quick tier action */}
                                            {user.effective_tier === 'free' ? (
                                                <button
                                                    onClick={() => requestAction(user.id, 'upgrade_pro')}
                                                    disabled={!!actionLoading}
                                                    className="p-1.5 text-yellow-500 hover:bg-yellow-500/10 rounded transition"
                                                    title="Upgrade to Pro (30 days)"
                                                >
                                                    <Crown className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => requestAction(user.id, 'extend_pro')}
                                                    disabled={!!actionLoading}
                                                    className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition"
                                                    title="Extend +30 Days"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* More actions button */}
                                            <button
                                                ref={el => { menuButtonRefs.current[user.id] = el }}
                                                onClick={() => openActionMenu(user.id)}
                                                className="p-1.5 text-gray-400 hover:bg-gray-800 rounded transition"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-[#0F0F0F]">
                    <span className="text-xs text-gray-500">
                        Showing {page * 20 + 1} - {Math.min((page + 1) * 20, total)} of {total}
                    </span>
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

            {/* Fixed Position Action Menu */}
            {showActionMenu && selectedUser && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[60]"
                        onClick={() => setShowActionMenu(null)}
                    />

                    {/* Menu */}
                    <div
                        className="fixed z-[70] w-64 bg-[#111] border border-gray-700 rounded-xl shadow-2xl scrollbar-thin"
                        style={{
                            top: menuPosition.top,
                            right: menuPosition.right,
                            maxHeight: '400px',
                            overflowY: 'auto',
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#4B5563 #1F2937'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                            <div>
                                <div className="text-sm font-medium text-white truncate max-w-[180px]">{selectedUser.email}</div>
                                <div className="text-xs text-gray-500">{selectedUser.full_name || 'No Name'}</div>
                            </div>
                            <button onClick={() => setShowActionMenu(null)} className="p-1 hover:bg-gray-800 rounded">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        <div className="py-2">
                            {/* Tier Management */}
                            <div className="px-4 py-1.5 text-[10px] text-gray-500 uppercase font-bold tracking-wider">Tier Management</div>

                            {selectedUser.effective_tier === 'free' ? (
                                <>
                                    <button onClick={() => requestAction(selectedUser.id, 'upgrade_pro')} className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3">
                                        <Crown className="w-4 h-4 text-yellow-500" />
                                        Upgrade to Pro (30 days)
                                    </button>
                                    <button onClick={() => requestAction(selectedUser.id, 'upgrade_enterprise')} className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3">
                                        <Star className="w-4 h-4 text-purple-400" />
                                        Upgrade to Enterprise (1 year)
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => requestAction(selectedUser.id, 'extend_pro')} className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-green-500" />
                                        Extend +30 Days
                                    </button>
                                    <button onClick={() => requestAction(selectedUser.id, 'downgrade_free')} className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3">
                                        <Ban className="w-4 h-4 text-gray-500" />
                                        Downgrade to Free
                                    </button>
                                </>
                            )}

                            <button onClick={() => requestAction(selectedUser.id, 'set_lifetime')} className="w-full px-4 py-2.5 text-left text-sm text-green-400 hover:bg-white/5 flex items-center gap-3">
                                <Infinity className="w-4 h-4" />
                                Grant Lifetime Access
                            </button>

                            <div className="border-t border-gray-800 my-2" />

                            {/* Admin Privileges */}
                            <div className="px-4 py-1.5 text-[10px] text-gray-500 uppercase font-bold tracking-wider">Admin Privileges</div>

                            {selectedUser.is_admin ? (
                                <button onClick={() => requestAction(selectedUser.id, 'remove_admin')} className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-gray-500" />
                                    Remove Admin
                                </button>
                            ) : (
                                <button onClick={() => requestAction(selectedUser.id, 'make_admin')} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-3">
                                    <Shield className="w-4 h-4" />
                                    Make Admin
                                </button>
                            )}

                            <div className="border-t border-gray-800 my-2" />

                            {/* Account Control */}
                            <div className="px-4 py-1.5 text-[10px] text-gray-500 uppercase font-bold tracking-wider">Account Control</div>

                            {selectedUser.account_status === 'active' ? (
                                <button onClick={() => requestAction(selectedUser.id, 'suspend')} className="w-full px-4 py-2.5 text-left text-sm text-yellow-400 hover:bg-white/5 flex items-center gap-3">
                                    <UserX className="w-4 h-4" />
                                    Suspend User
                                </button>
                            ) : (
                                <button onClick={() => requestAction(selectedUser.id, 'activate')} className="w-full px-4 py-2.5 text-left text-sm text-green-400 hover:bg-white/5 flex items-center gap-3">
                                    <UserCheck className="w-4 h-4" />
                                    Activate User
                                </button>
                            )}

                            {selectedUser.account_status !== 'banned' && (
                                <button onClick={() => requestAction(selectedUser.id, 'ban')} className="w-full px-4 py-2.5 text-left text-sm text-orange-400 hover:bg-white/5 flex items-center gap-3">
                                    <Ban className="w-4 h-4" />
                                    Ban User
                                </button>
                            )}

                            <button onClick={() => requestAction(selectedUser.id, 'reset_password')} className="w-full px-4 py-2.5 text-left text-sm text-blue-400 hover:bg-white/5 flex items-center gap-3">
                                <Key className="w-4 h-4" />
                                Send Password Reset
                            </button>

                            <div className="border-t border-gray-800 my-2" />

                            {/* Danger Zone */}
                            <div className="px-4 py-1.5 text-[10px] text-red-500 uppercase font-bold tracking-wider">Danger Zone</div>

                            <button onClick={() => requestAction(selectedUser.id, 'delete_all_files')} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3">
                                <Trash2 className="w-4 h-4" />
                                Delete All Files
                            </button>

                            <button onClick={() => requestAction(selectedUser.id, 'delete')} className="w-full px-4 py-2.5 text-left text-sm text-red-500 font-medium hover:bg-red-500/10 flex items-center gap-3">
                                <AlertTriangle className="w-4 h-4" />
                                Delete Account
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
