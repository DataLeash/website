'use client'

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Sidebar } from "@/components/Sidebar";
import {
    Users, Search, Filter, ChevronDown, Ban, Eye,
    Mail, Shield, Clock, FileText, AlertTriangle,
    CheckCircle, XCircle, MoreVertical, Trash2
} from "lucide-react";

interface Viewer {
    email: string;
    firstAccess: string;
    lastAccess: string;
    totalViews: number;
    filesAccessed: string[];
    status: 'active' | 'blocked' | 'pending';
    country?: string;
    trustScore?: number;
}

type ViewerFilter = 'all' | 'active' | 'blocked' | 'pending';

export default function ViewersPage() {
    const [viewers, setViewers] = useState<Viewer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<ViewerFilter>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedViewer, setSelectedViewer] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const supabase = createClient();

    // Fetch unique viewers from access logs and requests
    useEffect(() => {
        const fetchViewers = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                // Get access logs for user's files
                const { data: logs } = await supabase
                    .from('access_logs')
                    .select('*, files!inner(owner_id, original_name)')
                    .eq('files.owner_id', user.id)
                    .order('timestamp', { ascending: false });

                // Get access requests
                const { data: requests } = await supabase
                    .from('access_requests')
                    .select('*, files!inner(owner_id, original_name)')
                    .eq('files.owner_id', user.id);

                // Get blacklist
                const { data: blacklist } = await supabase
                    .from('blacklist')
                    .select('*')
                    .eq('owner_id', user.id);

                const blacklistedEmails = new Set(blacklist?.map(b => b.email.toLowerCase()) || []);

                // Aggregate by email
                const viewerMap = new Map<string, Viewer>();

                // Process access logs
                logs?.forEach(log => {
                    const email = (log.location as any)?.viewer_email?.toLowerCase();
                    if (!email) return;

                    const existing = viewerMap.get(email);
                    if (existing) {
                        existing.totalViews++;
                        if (new Date(log.timestamp) > new Date(existing.lastAccess)) {
                            existing.lastAccess = log.timestamp;
                        }
                        if (new Date(log.timestamp) < new Date(existing.firstAccess)) {
                            existing.firstAccess = log.timestamp;
                        }
                        if (!existing.filesAccessed.includes(log.files?.original_name)) {
                            existing.filesAccessed.push(log.files?.original_name);
                        }
                        if ((log.location as any)?.country) {
                            existing.country = (log.location as any).country;
                        }
                    } else {
                        viewerMap.set(email, {
                            email,
                            firstAccess: log.timestamp,
                            lastAccess: log.timestamp,
                            totalViews: 1,
                            filesAccessed: [log.files?.original_name].filter(Boolean),
                            status: blacklistedEmails.has(email) ? 'blocked' : 'active',
                            country: (log.location as any)?.country,
                        });
                    }
                });

                // Process pending requests
                requests?.forEach(req => {
                    const email = req.viewer_email?.toLowerCase();
                    if (!email || viewerMap.has(email)) return;

                    if (req.status === 'pending') {
                        viewerMap.set(email, {
                            email,
                            firstAccess: req.created_at,
                            lastAccess: req.created_at,
                            totalViews: 0,
                            filesAccessed: [req.files?.original_name].filter(Boolean),
                            status: 'pending',
                        });
                    }
                });

                setViewers(Array.from(viewerMap.values()));
            } catch (err) {
                console.error('Error fetching viewers:', err);
            }
            setLoading(false);
        };

        fetchViewers();
    }, [supabase]);

    // Filter and search
    const filteredViewers = useMemo(() => {
        let result = viewers;

        // Search
        if (search) {
            result = result.filter(v =>
                v.email.toLowerCase().includes(search.toLowerCase()) ||
                v.filesAccessed.some(f => f.toLowerCase().includes(search.toLowerCase()))
            );
        }

        // Filter
        if (filter !== 'all') {
            result = result.filter(v => v.status === filter);
        }

        // Sort by last access
        result.sort((a, b) => new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime());

        return result;
    }, [viewers, search, filter]);

    const handleBlock = async (email: string) => {
        if (!confirm(`Block ${email}? They will no longer be able to access any of your files.`)) return;

        setActionLoading(email);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Add to blacklist
            await supabase.from('blacklist').insert({
                owner_id: user.id,
                email: email.toLowerCase(),
                reason: 'Manually blocked from viewer management',
                created_at: new Date().toISOString(),
            });

            // Update local state
            setViewers(prev => prev.map(v =>
                v.email === email ? { ...v, status: 'blocked' as const } : v
            ));
        } catch (err) {
            console.error('Error blocking viewer:', err);
        }
        setActionLoading(null);
    };

    const handleUnblock = async (email: string) => {
        setActionLoading(email);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Remove from blacklist
            await supabase.from('blacklist')
                .delete()
                .eq('owner_id', user.id)
                .eq('email', email.toLowerCase());

            // Update local state
            setViewers(prev => prev.map(v =>
                v.email === email ? { ...v, status: 'active' as const } : v
            ));
        } catch (err) {
            console.error('Error unblocking viewer:', err);
        }
        setActionLoading(null);
    };

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return { label: 'Active', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle };
            case 'blocked':
                return { label: 'Blocked', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Ban };
            case 'pending':
                return { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock };
            default:
                return { label: status, color: 'bg-gray-500/20 text-gray-400', icon: Users };
        }
    };

    const stats = {
        total: viewers.length,
        active: viewers.filter(v => v.status === 'active').length,
        blocked: viewers.filter(v => v.status === 'blocked').length,
        pending: viewers.filter(v => v.status === 'pending').length,
    };

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="md:ml-72 ml-0 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Viewer Management</h1>
                            <p className="text-sm text-[var(--foreground-muted)]">
                                Manage all users who have accessed your files
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Viewers', value: stats.total, color: 'from-cyan-500 to-blue-600' },
                        { label: 'Active', value: stats.active, color: 'from-emerald-500 to-green-600' },
                        { label: 'Blocked', value: stats.blocked, color: 'from-red-500 to-rose-600' },
                        { label: 'Pending', value: stats.pending, color: 'from-yellow-500 to-orange-600' },
                    ].map((stat, i) => (
                        <div key={i} className="glass-card p-4 text-center">
                            <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                {stat.value}
                            </div>
                            <div className="text-sm text-[var(--foreground-muted)]">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Search and Filters */}
                <div className="glass-card p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                            <input
                                type="text"
                                placeholder="Search by email or file..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                            />
                        </div>
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

                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-[rgba(0,212,255,0.1)]">
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'all', label: 'All' },
                                    { value: 'active', label: '✓ Active' },
                                    { value: 'blocked', label: '🚫 Blocked' },
                                    { value: 'pending', label: '⏳ Pending' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilter(opt.value as ViewerFilter)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition ${filter === opt.value
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

                {/* Viewers List */}
                {loading ? (
                    <div className="text-center py-12 text-[var(--foreground-muted)]">Loading viewers...</div>
                ) : filteredViewers.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                            <Users className="w-8 h-8 text-indigo-400" />
                        </div>
                        <p className="text-[var(--foreground-muted)]">
                            {search || filter !== 'all' ? 'No viewers match your filters' : 'No viewers yet'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredViewers.map((viewer) => {
                            const badge = getStatusBadge(viewer.status);
                            const BadgeIcon = badge.icon;
                            const isSelected = selectedViewer === viewer.email;

                            return (
                                <div
                                    key={viewer.email}
                                    className={`glass-card p-4 transition ${isSelected ? 'border-[var(--primary)]' : ''}`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                            {viewer.email[0].toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium truncate">{viewer.email}</span>
                                                <span className={`px-2 py-0.5 text-xs rounded border ${badge.color} flex items-center gap-1`}>
                                                    <BadgeIcon className="w-3 h-3" />
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 mt-1 text-sm text-[var(--foreground-muted)]">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3 h-3" /> {viewer.totalViews} views
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-3 h-3" /> {viewer.filesAccessed.length} files
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Last: {formatTime(viewer.lastAccess)}
                                                </span>
                                                {viewer.country && (
                                                    <span>{viewer.country}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            {viewer.status === 'blocked' ? (
                                                <button
                                                    onClick={() => handleUnblock(viewer.email)}
                                                    disabled={actionLoading === viewer.email}
                                                    className="px-3 py-1.5 text-sm bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition disabled:opacity-50"
                                                >
                                                    {actionLoading === viewer.email ? '...' : 'Unblock'}
                                                </button>
                                            ) : viewer.status === 'active' ? (
                                                <button
                                                    onClick={() => handleBlock(viewer.email)}
                                                    disabled={actionLoading === viewer.email}
                                                    className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition disabled:opacity-50"
                                                >
                                                    {actionLoading === viewer.email ? '...' : 'Block'}
                                                </button>
                                            ) : null}
                                            <button
                                                onClick={() => setSelectedViewer(isSelected ? null : viewer.email)}
                                                className="p-2 hover:bg-[rgba(0,212,255,0.1)] rounded-lg transition"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isSelected && (
                                        <div className="mt-4 pt-4 border-t border-[rgba(0,212,255,0.1)]">
                                            <h4 className="text-sm font-medium mb-2">Files Accessed:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {viewer.filesAccessed.map((file, i) => (
                                                    <span key={i} className="px-2 py-1 text-xs bg-[rgba(0,212,255,0.1)] rounded">
                                                        {file}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-3 text-xs text-[var(--foreground-muted)]">
                                                First access: {new Date(viewer.firstAccess).toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
