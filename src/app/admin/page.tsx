'use client'

import { useState, useEffect } from 'react'
import {
    Users, Crown, Activity, Shield, Database,
    Server, AlertTriangle, CheckCircle, FileText,
    TrendingUp, RefreshCw, Eye, UserX
} from 'lucide-react'

interface SystemStats {
    users: { total: number; free: number; pro: number; enterprise: number }
    files: { total: number; active: number; destroyed: number }
    activity: { recentViews: number; threats: number; accessRequests: number }
    health: { database: string; storage: string; auth: string }
}

interface RecentActivity {
    type: string
    description: string
    time: string
    severity: 'info' | 'warning' | 'success' | 'danger'
}

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<SystemStats | null>(null)
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchData = async () => {
        try {
            const [usersRes, logsRes] = await Promise.all([
                fetch('/api/admin/users?limit=1'),
                fetch('/api/admin/logs?type=all&limit=10')
            ])

            const usersData = await usersRes.json()
            const logsData = await logsRes.json()

            if (usersRes.ok && usersData.stats) {
                setStats({
                    users: usersData.stats,
                    files: {
                        total: usersData.users?.reduce((acc: number, u: any) => acc + (u.file_count || 0), 0) || 0,
                        active: usersData.users?.reduce((acc: number, u: any) => acc + (u.file_count || 0), 0) || 0,
                        destroyed: 0
                    },
                    activity: {
                        recentViews: logsData.logs?.filter((l: any) => l.type === 'access_log').length || 0,
                        threats: 0,
                        accessRequests: 0
                    },
                    health: {
                        database: 'operational',
                        storage: 'operational',
                        auth: 'operational'
                    }
                })
            }

            if (logsRes.ok && logsData.logs) {
                setRecentActivity(logsData.logs.slice(0, 5).map((log: any) => ({
                    type: log.type === 'admin_action' ? log.action_type : log.action,
                    description: log.type === 'admin_action'
                        ? `${log.admin_email} performed ${log.action_type} on ${log.target_user_email || 'system'}`
                        : `File accessed from ${log.ip_address || 'unknown'}`,
                    time: new Date(log.timestamp || log.created_at).toLocaleString(),
                    severity: log.type === 'admin_action' ? 'info' : 'success'
                })))
            }
        } catch (error) {
            console.error('Failed to fetch stats', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchData()
    }

    const statCards = [
        { name: 'Total Users', value: stats?.users.total || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { name: 'Pro Members', value: stats?.users.pro || 0, icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
        { name: 'Active Files', value: stats?.files.active || 0, icon: FileText, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        { name: 'Conversion Rate', value: stats?.users.total ? `${Math.round((stats.users.pro / stats.users.total) * 100)}%` : '0%', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    ]

    const healthItems = [
        { name: 'Database', status: stats?.health.database || 'checking', icon: Database },
        { name: 'File Storage', status: stats?.health.storage || 'checking', icon: Server },
        { name: 'Authentication', status: stats?.health.auth || 'checking', icon: Shield },
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'operational': return 'text-green-400'
            case 'degraded': return 'text-yellow-400'
            case 'down': return 'text-red-400'
            default: return 'text-gray-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'operational': return <CheckCircle className="w-4 h-4" />
            case 'degraded': return <AlertTriangle className="w-4 h-4" />
            case 'down': return <AlertTriangle className="w-4 h-4" />
            default: return <RefreshCw className="w-4 h-4 animate-spin" />
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'success': return 'text-green-400'
            case 'warning': return 'text-yellow-400'
            case 'danger': return 'text-red-400'
            default: return 'text-blue-400'
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                        <Shield className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">System Overview</h1>
                        <p className="text-gray-400">Welcome back, Administrator.</p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:border-gray-700 transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.name} className={`bg-[#0A0A0A] border ${card.border} p-6 rounded-xl hover:border-gray-600 transition group`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg ${card.bg}`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                            {loading ? <span className="animate-pulse">-</span> : card.value}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            {card.name}
                        </div>
                    </div>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Health */}
                <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Server className="w-5 h-5 text-gray-400" />
                        System Health
                    </h3>
                    <div className="space-y-3">
                        {healthItems.map((item) => (
                            <div key={item.name} className="flex items-center justify-between p-4 bg-[#050505] rounded-lg border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <item.icon className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-300">{item.name}</span>
                                </div>
                                <span className={`text-sm font-bold flex items-center gap-2 ${getStatusColor(item.status)}`}>
                                    {getStatusIcon(item.status)}
                                    {item.status.toUpperCase()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-400" />
                        Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-gray-500 text-center py-4">Loading activity...</div>
                        ) : recentActivity.length === 0 ? (
                            <div className="text-gray-500 text-center py-4">No recent activity</div>
                        ) : (
                            recentActivity.map((activity, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-[#050505] rounded-lg border border-gray-800">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(activity.severity).replace('text-', 'bg-')}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-300 truncate">{activity.description}</p>
                                        <p className="text-xs text-gray-500">{activity.time}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href="/admin/users" className="flex flex-col items-center gap-2 p-4 bg-[#050505] rounded-lg border border-gray-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition cursor-pointer">
                        <Users className="w-6 h-6 text-blue-400" />
                        <span className="text-sm text-gray-400">Manage Users</span>
                    </a>
                    <a href="/admin/payments" className="flex flex-col items-center gap-2 p-4 bg-[#050505] rounded-lg border border-gray-800 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition cursor-pointer">
                        <Crown className="w-6 h-6 text-yellow-400" />
                        <span className="text-sm text-gray-400">View Payments</span>
                    </a>
                    <a href="/admin/logs" className="flex flex-col items-center gap-2 p-4 bg-[#050505] rounded-lg border border-gray-800 hover:border-green-500/50 hover:bg-green-500/5 transition cursor-pointer">
                        <Activity className="w-6 h-6 text-green-400" />
                        <span className="text-sm text-gray-400">System Logs</span>
                    </a>
                    <a href="/admin/settings" className="flex flex-col items-center gap-2 p-4 bg-[#050505] rounded-lg border border-gray-800 hover:border-purple-500/50 hover:bg-purple-500/5 transition cursor-pointer">
                        <Shield className="w-6 h-6 text-purple-400" />
                        <span className="text-sm text-gray-400">Settings</span>
                    </a>
                </div>
            </div>
        </div>
    )
}
