'use client'

import Link from "next/link";
import { useAuth, useFiles, useActivity, useStats } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { PageLoading } from "@/components/LoadingSpinner";
import { ActiveViewers } from "@/components/ActiveViewers";
import { DashboardEffects } from "@/components/DashboardEffects";
import {
    FolderLock, Eye, Link2, Shield, Upload, Skull, BarChart3,
    FileText, Activity, CircleDot, FolderOpen, Plus
} from "lucide-react";

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { files, loading: filesLoading } = useFiles();
    const { logs, loading: logsLoading } = useActivity();
    const { stats, loading: statsLoading } = useStats();

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Show loading state
    if (authLoading) {
        return <PageLoading text="Loading dashboard..." />;
    }

    // Format relative time
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="gradient-bg min-h-screen relative">
            {/* Futuristic Background Effects */}
            <DashboardEffects />

            <Sidebar />

            {/* Main Content */}
            <main className="md:ml-72 ml-0 p-4 md:p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}</h1>
                        <p className="text-[var(--foreground-muted)]">Manage your protected files</p>
                    </div>
                    <Link href="/dashboard/upload" className="glow-button px-6 py-3 rounded-lg font-semibold text-black flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Upload File
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Total Files", value: statsLoading ? "..." : stats.totalFiles.toString(), icon: FolderLock, change: "Your protected files", color: "from-cyan-500 to-blue-600" },
                        { label: "Total Views", value: statsLoading ? "..." : stats.totalViews.toLocaleString(), icon: Eye, change: "Across all files", color: "from-emerald-500 to-green-600" },
                        { label: "Active Shares", value: statsLoading ? "..." : stats.activeShares.toString(), icon: Link2, change: "People with access", color: "from-purple-500 to-violet-600" },
                        { label: "Threats Blocked", value: statsLoading ? "..." : stats.threatsBlocked.toString(), icon: Shield, change: "Security events", color: "from-red-500 to-rose-600" },
                    ].map((stat, i) => (
                        <div key={i} className="glass-card p-6 group hover:border-[var(--primary)]/50 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-gradient">{stat.value}</span>
                            </div>
                            <div className="text-sm font-medium">{stat.label}</div>
                            <div className="text-xs text-[var(--foreground-muted)] mt-1">{stat.change}</div>
                        </div>
                    ))}
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Files */}
                    <div className="glass-card p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Recent Files</h2>
                            <Link href="/dashboard/files" className="text-[var(--primary)] text-sm hover:underline">
                                View all →
                            </Link>
                        </div>

                        {filesLoading ? (
                            <div className="text-center py-8 text-[var(--foreground-muted)]">Loading files...</div>
                        ) : files.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                                    <FolderOpen className="w-8 h-8 text-[var(--primary)]" />
                                </div>
                                <p className="text-[var(--foreground-muted)]">No files yet</p>
                                <Link href="/dashboard/upload" className="text-[var(--primary)] text-sm hover:underline mt-2 inline-block">
                                    Upload your first file →
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {files.slice(0, 5).map((file) => (
                                    <div key={file.id} className="flex items-center gap-4 p-3 rounded-lg bg-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.1)] transition">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-[var(--primary)]" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{file.original_name}</div>
                                            <div className="text-xs text-[var(--foreground-muted)]">{formatTime(file.created_at)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold">{file.total_views || 0} views</div>
                                            <div className="text-xs text-[var(--success)] flex items-center gap-1">
                                                <CircleDot className="w-3 h-3" /> Active
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="glass-card p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Recent Activity</h2>
                            <Link href="/dashboard/activity" className="text-[var(--primary)] text-sm hover:underline">
                                View all →
                            </Link>
                        </div>

                        {logsLoading ? (
                            <div className="text-center py-8 text-[var(--foreground-muted)]">Loading activity...</div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 flex items-center justify-center">
                                    <Activity className="w-8 h-8 text-[var(--success)]" />
                                </div>
                                <p className="text-[var(--foreground-muted)]">No activity yet</p>
                                <p className="text-xs text-[var(--foreground-muted)] mt-1">Activity will appear when files are accessed</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {logs.slice(0, 5).map((log: any) => (
                                    <div
                                        key={log.id}
                                        className={`flex items-center gap-4 p-3 rounded-lg ${log.action === 'blocked'
                                            ? "bg-[rgba(239,68,68,0.1)] border border-[var(--error)]"
                                            : "bg-[rgba(0,212,255,0.05)]"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.action === 'blocked' ? "bg-[var(--error)]" : "bg-[var(--primary)]"
                                            } text-black font-bold`}>
                                            {log.users?.full_name?.[0] || '?'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                <span className="font-bold">{log.users?.full_name || 'Unknown'}</span> {log.action}{" "}
                                                <span className="text-[var(--primary)]">{log.files?.original_name || 'a file'}</span>
                                            </div>
                                            <div className="text-xs text-[var(--foreground-muted)]">
                                                {formatTime(log.timestamp)} • {log.location?.city || 'Unknown location'}
                                            </div>
                                        </div>
                                        {log.action === 'blocked' && (
                                            <Link href="/dashboard/activity" className="px-3 py-1 bg-[var(--error)] text-white text-xs rounded-full font-semibold hover:bg-red-600 transition">
                                                Review
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Viewers - Real-time monitoring per DataLeash spec */}
                <div className="mt-8">
                    <ActiveViewers />
                </div>

                <div className="mt-8 glass-card p-6">
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Upload, label: "Upload File", href: "/dashboard/upload", color: "from-cyan-500 to-blue-600" },
                            { icon: Link2, label: "Share Link", href: "/dashboard/share", color: "from-purple-500 to-violet-600" },
                            { icon: Skull, label: "Kill All Files", href: "/dashboard/kill", danger: true, color: "from-red-500 to-rose-600" },
                            { icon: BarChart3, label: "View Reports", href: "/dashboard/reports", color: "from-emerald-500 to-green-600" },
                        ].map((action, i) => (
                            <Link
                                key={i}
                                href={action.href}
                                className={`p-4 rounded-lg text-center transition flex flex-col items-center group ${action.danger
                                    ? "bg-[rgba(239,68,68,0.1)] border border-[var(--error)] hover:bg-[rgba(239,68,68,0.2)]"
                                    : "bg-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.1)]"
                                    }`}
                            >
                                <div className={`w-12 h-12 mb-2 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                                    <action.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-sm font-medium">{action.label}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
