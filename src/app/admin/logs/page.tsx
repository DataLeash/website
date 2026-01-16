'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, Search, RefreshCw, Filter, Shield, FileText, DollarSign, User } from 'lucide-react'

interface LogEntry {
    id: string
    type: 'access_log' | 'admin_action'
    timestamp: string
    // Access Log specific
    action?: string
    user_id?: string
    file_id?: string
    ip_address?: string
    location?: any
    // Admin Action specific
    action_type?: string
    admin_email?: string
    target_user_email?: string
    reason?: string
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/logs?type=${filter}&limit=100`)
            const data = await res.json()
            if (res.ok) {
                setLogs(data.logs || [])
            }
        } catch (err) {
            console.error('Failed to fetch logs', err)
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const getIcon = (type: string, action?: string) => {
        if (type === 'admin_action') return <Shield className="w-4 h-4 text-purple-400" />
        if (action === 'view') return <FileText className="w-4 h-4 text-blue-400" />
        if (action === 'login') return <User className="w-4 h-4 text-green-400" />
        return <Activity className="w-4 h-4 text-gray-400" />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">System Logs</h1>
                    <p className="text-gray-400 text-sm">Real-time system activity and audit trail</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 p-1 bg-[#0A0A0A] rounded-lg border border-gray-800 w-fit">
                {['all', 'access', 'admin'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${filter === f
                                ? 'bg-gray-800 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Logs Table */}
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#0F0F0F] text-gray-500 font-medium border-b border-gray-800">
                        <tr>
                            <th className="px-4 py-3 w-12"></th>
                            <th className="px-4 py-3">Timestamp</th>
                            <th className="px-4 py-3">Event</th>
                            <th className="px-4 py-3">User / Actor</th>
                            <th className="px-4 py-3">Details</th>
                            <th className="px-4 py-3">IP Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {loading && logs.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading logs...</td></tr>
                        ) : logs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3 text-center">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                        {getIcon(log.type, log.action || log.action_type)}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.type === 'admin_action'
                                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                        {log.type === 'admin_action' ? log.action_type : log.action}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-300">
                                    {log.type === 'admin_action'
                                        ? <span className="text-purple-300">{log.admin_email}</span>
                                        : (log.user_id || 'Anonymous')
                                    }
                                    {log.target_user_email && (
                                        <div className="text-xs text-gray-500">Target: {log.target_user_email}</div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-500 truncate max-w-xs">
                                    {log.reason || log.file_id || '-'}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                    {log.ip_address || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
