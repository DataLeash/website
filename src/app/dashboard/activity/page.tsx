'use client'

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";
import {
    Activity, Filter, ChevronDown, Trash2, RefreshCw,
    ArrowDown, Search, Eye, Shield, AlertTriangle,
    FileText, Upload, Folder, Clock
} from "lucide-react";

type ActionFilter = 'all' | 'view' | 'blocked' | 'approved' | 'denied';

interface ActivityLog {
    id: string;
    action: string;
    timestamp: string;
    file_id: string;
    files?: { original_name: string };
    location?: { viewer_email?: string; city?: string; country?: string };
}

const PAGE_SIZE = 20;

export default function ActivityPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const supabase = createClient();

    const fetchLogs = useCallback(async (loadMore = false) => {
        if (loadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            let query = supabase
                .from('access_logs')
                .select(`
                    *,
                    files!inner(owner_id, original_name)
                `)
                .eq('files.owner_id', user.id)
                .order('timestamp', { ascending: false });

            // Apply action filter
            if (actionFilter !== 'all') {
                if (actionFilter === 'view') {
                    query = query.eq('action', 'view');
                } else if (actionFilter === 'blocked') {
                    query = query.in('action', ['blocked', 'denied', 'access_denied']);
                } else if (actionFilter === 'approved') {
                    query = query.eq('action', 'access_approved');
                }
            }

            // Pagination
            if (loadMore && logs.length > 0) {
                query = query.range(logs.length, logs.length + PAGE_SIZE - 1);
            } else {
                query = query.range(0, PAGE_SIZE - 1);
            }

            const { data, error } = await query;

            if (!error && data) {
                if (loadMore) {
                    setLogs(prev => [...prev, ...data as ActivityLog[]]);
                } else {
                    setLogs(data as ActivityLog[]);
                }
                setHasMore(data.length === PAGE_SIZE);
            }
        } catch (err) {
            console.error('Fetch logs error:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [supabase, actionFilter, logs.length]);

    useEffect(() => {
        fetchLogs();
    }, [actionFilter]); // Re-fetch when filter changes

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const formatFullTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'view':
                return { label: 'Viewed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Eye };
            case 'access_approved':
                return { label: 'Approved', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Shield };
            case 'blocked':
            case 'access_denied':
                return { label: 'Blocked', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle };
            case 'denied':
                return { label: 'Denied', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle };
            case 'nda_signed':
                return { label: 'NDA Signed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: FileText };
            case 'upload':
                return { label: 'Uploaded', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Upload };
            case 'download':
                return { label: 'Downloaded', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Folder };
            default:
                return { label: action, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Activity };
        }
    };

    const handleDelete = async (logId: string) => {
        if (!confirm('Delete this activity log entry?')) return;

        setDeleting(logId);
        try {
            const { error } = await supabase
                .from('access_logs')
                .delete()
                .eq('id', logId);

            if (!error) {
                setLogs(prev => prev.filter(l => l.id !== logId));
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
        setDeleting(null);
    };

    const handleDeleteAll = async () => {
        if (!confirm('Are you sure you want to delete ALL activity logs? This cannot be undone.')) return;

        setDeleting('all');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userFiles } = await supabase
                .from('files')
                .select('id')
                .eq('owner_id', user.id);

            if (userFiles && userFiles.length > 0) {
                const fileIds = userFiles.map(f => f.id);
                await supabase
                    .from('access_logs')
                    .delete()
                    .in('file_id', fileIds);
            }

            setLogs([]);
        } catch (err) {
            console.error('Delete all error:', err);
        }
        setDeleting(null);
    };

    // Filter by search
    const filteredLogs = logs.filter(log =>
        log.files?.original_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.location?.viewer_email?.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="md:ml-72 ml-0 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Activity Log</h1>
                            <p className="text-sm text-[var(--foreground-muted)]">
                                {logs.length} entries {hasMore && '(more available)'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchLogs()}
                            className="px-4 py-2.5 glass-card rounded-lg hover:border-[var(--primary)] transition flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden md:inline">Refresh</span>
                        </button>
                        {logs.length > 0 && (
                            <button
                                onClick={handleDeleteAll}
                                disabled={deleting === 'all'}
                                className="px-4 py-2.5 bg-[rgba(239,68,68,0.1)] text-[var(--error)] rounded-lg hover:bg-[rgba(239,68,68,0.2)] disabled:opacity-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden md:inline">{deleting === 'all' ? 'Deleting...' : 'Clear All'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="glass-card p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                            <input
                                type="text"
                                placeholder="Search by file, email, or action..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                            />
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2.5 rounded-lg border flex items-center gap-2 transition ${showFilters ? 'border-[var(--primary)] bg-[rgba(0,212,255,0.1)]' : 'border-[rgba(0,212,255,0.2)] hover:border-[var(--primary)]'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            <ChevronDown className={`w-4 h-4 transition ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-[rgba(0,212,255,0.1)]">
                            <label className="block text-xs text-[var(--foreground-muted)] mb-2">Filter by Action</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'all', label: 'All' },
                                    { value: 'view', label: '👁️ Views' },
                                    { value: 'approved', label: '✓ Approved' },
                                    { value: 'blocked', label: '🚫 Blocked' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setActionFilter(opt.value as ActionFilter)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition ${actionFilter === opt.value
                                            ? 'bg-[var(--primary)] text-black font-medium'
                                            : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Activity List */}
                {loading ? (
                    <div className="text-center py-12 text-[var(--foreground-muted)]">Loading activity...</div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mb-4 flex justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-600/20 flex items-center justify-center">
                                <Activity className="w-8 h-8 text-pink-400" />
                            </div>
                        </div>
                        <p className="text-xl text-[var(--foreground-muted)]">
                            {search || actionFilter !== 'all' ? 'No matching activity' : 'No activity yet'}
                        </p>
                        <p className="text-sm text-[var(--foreground-muted)] mt-1">
                            Activity will appear when files are accessed
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Activity Cards (Mobile & Desktop) */}
                        <div className="space-y-3">
                            {filteredLogs.map((log) => {
                                const badge = getActionBadge(log.action);
                                const BadgeIcon = badge.icon;
                                return (
                                    <div
                                        key={log.id}
                                        className="glass-card p-4 hover:border-[rgba(0,212,255,0.3)] transition group"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Action Badge */}
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${badge.color} border`}>
                                                <BadgeIcon className="w-5 h-5" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.color} border`}>
                                                        {badge.label}
                                                    </span>
                                                    <span className="text-sm font-medium truncate">
                                                        {log.files?.original_name || 'Unknown file'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                                                    {log.location?.viewer_email || log.location?.city || 'Unknown viewer'}
                                                    {log.location?.country && ` • ${log.location.country}`}
                                                </p>
                                                <p className="text-xs text-[var(--foreground-muted)] mt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span title={formatFullTime(log.timestamp)}>{formatTime(log.timestamp)}</span>
                                                </p>
                                            </div>

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                disabled={deleting === log.id}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-[var(--error)] hover:bg-[rgba(239,68,68,0.1)] rounded-lg transition disabled:opacity-50"
                                            >
                                                {deleting === log.id ? '...' : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Load More */}
                        {hasMore && (
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => fetchLogs(true)}
                                    disabled={loadingMore}
                                    className="px-6 py-3 glass-card rounded-lg hover:border-[var(--primary)] transition inline-flex items-center gap-2 disabled:opacity-50"
                                >
                                    <ArrowDown className="w-4 h-4" />
                                    {loadingMore ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
