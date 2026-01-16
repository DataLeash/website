'use client'

import { useState, useEffect } from "react";
import { useStats, useFiles } from "@/lib/hooks";
import { createClient } from "@/lib/supabase-browser";
import { Sidebar } from "@/components/Sidebar";
import {
    BarChart3, Eye, Users, Shield, FileText, Clock,
    Globe, TrendingUp, AlertTriangle, ChevronDown
} from "lucide-react";

interface FileAnalytics {
    fileId: string;
    fileName: string;
    totalViews: number;
    uniqueViewers: number;
    avgDuration: number;
    threatEvents: number;
    lastViewed: string | null;
    viewsByDay: { date: string; count: number }[];
    viewerLocations: { country: string; count: number }[];
}

export default function AnalyticsPage() {
    const { stats, loading: statsLoading } = useStats();
    const { files, loading: filesLoading } = useFiles();
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [fileAnalytics, setFileAnalytics] = useState<FileAnalytics | null>(null);
    const [loadingFileAnalytics, setLoadingFileAnalytics] = useState(false);
    const supabase = createClient();

    // Fetch per-file analytics when a file is selected
    useEffect(() => {
        if (!selectedFileId) {
            setFileAnalytics(null);
            return;
        }

        const fetchFileAnalytics = async () => {
            setLoadingFileAnalytics(true);
            try {
                const file = files.find(f => f.id === selectedFileId);

                // Fetch view logs for this file
                const { data: logs } = await supabase
                    .from('access_logs')
                    .select('*')
                    .eq('file_id', selectedFileId)
                    .order('timestamp', { ascending: false });

                // Process analytics
                const uniqueEmails = new Set(logs?.map(l => (l.location as { viewer_email?: string })?.viewer_email).filter(Boolean));
                const threatLogs = logs?.filter(l => ['blocked', 'denied', 'access_denied'].includes(l.action)) || [];

                // Group by day (last 7 days)
                const viewsByDay: { date: string; count: number }[] = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const count = logs?.filter(l => l.timestamp.startsWith(dateStr)).length || 0;
                    viewsByDay.push({ date: dateStr, count });
                }

                // Group by country
                const countryMap: Record<string, number> = {};
                logs?.forEach(l => {
                    const country = (l.location as { country?: string })?.country || 'Unknown';
                    countryMap[country] = (countryMap[country] || 0) + 1;
                });
                const viewerLocations = Object.entries(countryMap)
                    .map(([country, count]) => ({ country, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                setFileAnalytics({
                    fileId: selectedFileId,
                    fileName: file?.original_name || 'Unknown',
                    totalViews: logs?.filter(l => l.action === 'view').length || 0,
                    uniqueViewers: uniqueEmails.size,
                    avgDuration: 0, // Would need session data
                    threatEvents: threatLogs.length,
                    lastViewed: logs?.[0]?.timestamp || null,
                    viewsByDay,
                    viewerLocations,
                });
            } catch (err) {
                console.error('Error fetching file analytics:', err);
            }
            setLoadingFileAnalytics(false);
        };

        fetchFileAnalytics();
    }, [selectedFileId, files, supabase]);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="md:ml-72 ml-0 p-4 md:p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>
                        <p className="text-sm text-[var(--foreground-muted)]">Track your file protection metrics</p>
                    </div>
                </div>

                {/* Global Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total Files", value: stats.totalFiles, icon: FileText, color: "from-cyan-500 to-blue-600" },
                        { label: "Total Views", value: stats.totalViews, icon: Eye, color: "from-emerald-500 to-green-600" },
                        { label: "Active Shares", value: stats.activeShares, icon: Users, color: "from-purple-500 to-violet-600" },
                        { label: "Threats Blocked", value: stats.threatsBlocked, icon: Shield, color: "from-red-500 to-rose-600" },
                    ].map((stat, i) => (
                        <div key={i} className="glass-card p-4 md:p-6 text-center group hover:border-[var(--primary)]/50 transition">
                            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-2xl md:text-3xl font-bold text-gradient">{statsLoading ? '...' : stat.value}</div>
                            <div className="text-xs md:text-sm text-[var(--foreground-muted)]">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Per-File Analytics Section */}
                <div className="glass-card p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[var(--primary)]" />
                            Per-File Analytics
                        </h2>
                        <div className="relative">
                            <select
                                value={selectedFileId || ''}
                                onChange={(e) => setSelectedFileId(e.target.value || null)}
                                className="appearance-none w-full md:w-64 px-4 py-2.5 pr-10 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                            >
                                <option value="">Select a file...</option>
                                {files.map(file => (
                                    <option key={file.id} value={file.id}>{file.original_name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)] pointer-events-none" />
                        </div>
                    </div>

                    {!selectedFileId ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-600/20 flex items-center justify-center">
                                <BarChart3 className="w-8 h-8 text-teal-400" />
                            </div>
                            <p className="text-[var(--foreground-muted)]">Select a file to view detailed analytics</p>
                        </div>
                    ) : loadingFileAnalytics ? (
                        <div className="text-center py-12 text-[var(--foreground-muted)]">Loading analytics...</div>
                    ) : fileAnalytics ? (
                        <div className="space-y-6">
                            {/* File Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-[rgba(0,212,255,0.05)]">
                                    <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] mb-1">
                                        <Eye className="w-4 h-4" /> Total Views
                                    </div>
                                    <div className="text-2xl font-bold">{fileAnalytics.totalViews}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-[rgba(0,212,255,0.05)]">
                                    <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] mb-1">
                                        <Users className="w-4 h-4" /> Unique Viewers
                                    </div>
                                    <div className="text-2xl font-bold">{fileAnalytics.uniqueViewers}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-[rgba(0,212,255,0.05)]">
                                    <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] mb-1">
                                        <AlertTriangle className="w-4 h-4" /> Threat Events
                                    </div>
                                    <div className={`text-2xl font-bold ${fileAnalytics.threatEvents > 0 ? 'text-[var(--error)]' : ''}`}>
                                        {fileAnalytics.threatEvents}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-[rgba(0,212,255,0.05)]">
                                    <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] mb-1">
                                        <Clock className="w-4 h-4" /> Last Viewed
                                    </div>
                                    <div className="text-lg font-bold">
                                        {fileAnalytics.lastViewed ? formatTime(fileAnalytics.lastViewed) : 'Never'}
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Views Over Time */}
                                <div className="p-4 rounded-lg bg-[rgba(0,212,255,0.05)]">
                                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                                        Views Over Last 7 Days
                                    </h3>
                                    <div className="h-32 flex items-end justify-around gap-2">
                                        {fileAnalytics.viewsByDay.map((day, i) => {
                                            const maxCount = Math.max(...fileAnalytics.viewsByDay.map(d => d.count), 1);
                                            const height = (day.count / maxCount) * 100;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                    <span className="text-xs text-[var(--foreground-muted)]">{day.count}</span>
                                                    <div
                                                        className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t opacity-80 hover:opacity-100 transition min-h-[4px]"
                                                        style={{ height: `${Math.max(height, 4)}%` }}
                                                    ></div>
                                                    <span className="text-xs text-[var(--foreground-muted)]">
                                                        {formatDate(day.date).split(' ')[1]}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Top Locations */}
                                <div className="p-4 rounded-lg bg-[rgba(0,212,255,0.05)]">
                                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-[var(--primary)]" />
                                        Top Viewer Locations
                                    </h3>
                                    {fileAnalytics.viewerLocations.length === 0 ? (
                                        <p className="text-[var(--foreground-muted)] text-sm">No location data yet</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {fileAnalytics.viewerLocations.map((loc, i) => {
                                                const maxCount = Math.max(...fileAnalytics.viewerLocations.map(l => l.count), 1);
                                                const width = (loc.count / maxCount) * 100;
                                                return (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <span className="w-20 text-sm truncate">{loc.country}</span>
                                                        <div className="flex-1 h-4 bg-[rgba(0,212,255,0.1)] rounded overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded"
                                                                style={{ width: `${width}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium w-8 text-right">{loc.count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Security Events Summary */}
                <div className="glass-card p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[var(--primary)]" />
                        Security Overview
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { event: "Screenshot attempts blocked", count: 12, color: "from-red-500 to-rose-600" },
                            { event: "Unauthorized access attempts", count: 3, color: "from-orange-500 to-amber-600" },
                            { event: "Expired link access attempts", count: 8, color: "from-yellow-500 to-orange-600" },
                        ].map((item, i) => (
                            <div key={i} className="p-4 rounded-lg bg-[rgba(0,212,255,0.05)] flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                                    <span className="text-white font-bold">{item.count}</span>
                                </div>
                                <span className="text-sm flex-1">{item.event}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
