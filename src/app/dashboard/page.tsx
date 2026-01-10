'use client'

import Link from "next/link";
import { useAuth, useFiles, useActivity, useStats } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon3D } from "@/components/Icon3D";
import { Sidebar } from "@/components/Sidebar";
import { PageLoading } from "@/components/LoadingSpinner";
import { ActiveViewers } from "@/components/ActiveViewers";
import { DashboardEffects } from "@/components/DashboardEffects";

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
            <main className="ml-72 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}</h1>
                        <p className="text-[var(--foreground-muted)]">Manage your protected files</p>
                    </div>
                    <Link href="/dashboard/upload" className="glow-button px-6 py-3 rounded-lg font-semibold text-black flex items-center gap-2">
                        <span>+</span> Upload File
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Total Files", value: statsLoading ? "..." : stats.totalFiles.toString(), iconType: "folder", change: "Your protected files" },
                        { label: "Total Views", value: statsLoading ? "..." : stats.totalViews.toLocaleString(), iconType: "eye", change: "Across all files" },
                        { label: "Active Shares", value: statsLoading ? "..." : stats.activeShares.toString(), iconType: "link", change: "People with access" },
                        { label: "Threats Blocked", value: statsLoading ? "..." : stats.threatsBlocked.toString(), iconType: "shield", change: "Security events" },
                    ].map((stat, i) => (
                        <div key={i} className="glass-card p-6">
                            <div className="flex justify-between items-start mb-4">
                                <Icon3D type={stat.iconType} size="md" />
                                <span className="text-2xl font-bold text-gradient">{stat.value}</span>
                            </div>
                            <div className="text-sm font-medium">{stat.label}</div>
                            <div className="text-xs text-[var(--foreground-muted)] mt-1">{stat.change}</div>
                        </div>
                    ))}
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-6">
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
                                <div className="text-4xl mb-2">📁</div>
                                <p className="text-[var(--foreground-muted)]">No files yet</p>
                                <Link href="/dashboard/upload" className="text-[var(--primary)] text-sm hover:underline mt-2 inline-block">
                                    Upload your first file →
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {files.slice(0, 5).map((file) => (
                                    <div key={file.id} className="flex items-center gap-4 p-3 rounded-lg bg-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.1)] transition">
                                        <span className="text-2xl">📄</span>
                                        <div className="flex-1">
                                            <div className="font-medium">{file.original_name}</div>
                                            <div className="text-xs text-[var(--foreground-muted)]">{formatTime(file.created_at)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold">{file.total_views || 0} views</div>
                                            <div className="text-xs text-[var(--success)]">● Active</div>
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
                                <div className="text-4xl mb-2">📊</div>
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

                {/* Quick Actions */}
                <div className="mt-8 glass-card p-6">
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { iconType: "upload", label: "Upload File", href: "/dashboard/upload" },
                            { iconType: "link", label: "Share Link", href: "/dashboard/share" },
                            { iconType: "destroy", label: "Kill All Files", href: "/dashboard/kill", danger: true },
                            { iconType: "analytics", label: "View Reports", href: "/dashboard/reports" },
                        ].map((action, i) => (
                            <Link
                                key={i}
                                href={action.href}
                                className={`p-4 rounded-lg text-center transition flex flex-col items-center ${action.danger
                                    ? "bg-[rgba(239,68,68,0.1)] border border-[var(--error)] hover:bg-[rgba(239,68,68,0.2)]"
                                    : "bg-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.1)]"
                                    }`}
                            >
                                <div className="mb-2"><Icon3D type={action.iconType} size="md" /></div>
                                <div className="text-sm font-medium">{action.label}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
