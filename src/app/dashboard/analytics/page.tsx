'use client'

import { useStats } from "@/lib/hooks";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function AnalyticsPage() {
    const { stats, loading } = useStats();

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                <h1 className="text-3xl font-bold mb-2">Analytics</h1>
                <p className="text-[var(--foreground-muted)] mb-8">Track your file protection metrics</p>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" text="Loading analytics..." />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-4 gap-6 mb-8">
                            {[
                                { label: "Total Files", value: stats.totalFiles, iconType: "folder" },
                                { label: "Total Views", value: stats.totalViews, iconType: "eye" },
                                { label: "Active Shares", value: stats.activeShares, iconType: "link" },
                                { label: "Threats Blocked", value: stats.threatsBlocked, iconType: "shield" },
                            ].map((stat, i) => (
                                <div key={i} className="glass-card p-6 text-center">
                                    <div className="mb-2 flex justify-center">
                                        <Icon3D type={stat.iconType} size="lg" />
                                    </div>
                                    <div className="text-3xl font-bold text-gradient">{stat.value}</div>
                                    <div className="text-sm text-[var(--foreground-muted)]">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="glass-card p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Icon3D type="chart" size="sm" />
                                    Views Over Time
                                </h2>
                                <div className="h-48 flex items-end justify-around gap-2">
                                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                        <div key={i} className="flex-1 bg-[var(--primary)] rounded-t opacity-80 hover:opacity-100 transition" style={{ height: `${h}%` }}></div>
                                    ))}
                                </div>
                                <div className="flex justify-around text-xs text-[var(--foreground-muted)] mt-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d}>{d}</span>)}
                                </div>
                            </div>

                            <div className="glass-card p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Icon3D type="shield" size="sm" />
                                    Security Events
                                </h2>
                                <div className="space-y-4">
                                    {[
                                        { event: "Screenshot blocked", count: 12, color: "var(--error)" },
                                        { event: "Unauthorized access", count: 3, color: "var(--warning)" },
                                        { event: "Expired links accessed", count: 8, color: "var(--primary)" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <span className="flex-1">{item.event}</span>
                                            <span className="font-bold">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
