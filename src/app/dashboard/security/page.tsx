'use client'

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useStats, useAuth } from "@/lib/hooks";
import { Sidebar } from "@/components/Sidebar";
import {
    Shield, AlertTriangle, CheckCircle, XCircle, Eye,
    Lock, Globe, Clock, TrendingUp, RefreshCw
} from "lucide-react";

interface SecurityEvent {
    id: string;
    type: 'blocked' | 'denied' | 'threat' | 'warning' | 'success';
    message: string;
    timestamp: string;
    details?: string;
}

export default function SecurityPage() {
    const { user } = useAuth();
    const { stats, loading: statsLoading } = useStats();
    const [securityScore, setSecurityScore] = useState(85);
    const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Calculate security score based on settings and activity
    useEffect(() => {
        const savedSettings = localStorage.getItem('dataleash_settings');
        let score = 50; // Base score

        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (settings.twoFactor) score += 15;
            if (settings.autoKillOnThreat) score += 10;
            if (settings.loginAlerts) score += 5;
            if (settings.requireApprovalDefault) score += 10;
            if (settings.requireNdaDefault) score += 5;
            if ((settings.blockedCountries?.length || 0) > 0) score += 5;
        }

        // Cap at 100
        setSecurityScore(Math.min(score, 100));
    }, []);

    // Fetch recent security events
    useEffect(() => {
        const fetchSecurityEvents = async () => {
            setLoading(true);
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    setLoading(false);
                    return;
                }

                // Get blocked/denied events
                const { data: logs } = await supabase
                    .from('access_logs')
                    .select('*, files!inner(owner_id, original_name)')
                    .eq('files.owner_id', authUser.id)
                    .in('action', ['blocked', 'denied', 'access_denied', 'view'])
                    .order('timestamp', { ascending: false })
                    .limit(20);

                const events: SecurityEvent[] = (logs || []).map(log => ({
                    id: log.id,
                    type: ['blocked', 'denied', 'access_denied'].includes(log.action) ? 'blocked' : 'success',
                    message: log.action === 'view'
                        ? `${(log.location as any)?.viewer_email || 'Someone'} viewed ${log.files?.original_name}`
                        : `Blocked access attempt on ${log.files?.original_name}`,
                    timestamp: log.timestamp,
                    details: (log.location as any)?.country || 'Unknown location',
                }));

                setRecentEvents(events);
            } catch (err) {
                console.error('Error fetching security events:', err);
            }
            setLoading(false);
        };

        fetchSecurityEvents();
    }, [supabase]);

    const getScoreColor = () => {
        if (securityScore >= 80) return 'text-emerald-400';
        if (securityScore >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getScoreGradient = () => {
        if (securityScore >= 80) return 'from-emerald-500 to-green-500';
        if (securityScore >= 60) return 'from-yellow-500 to-orange-500';
        return 'from-red-500 to-rose-500';
    };

    const recommendations = [
        {
            enabled: securityScore < 100,
            title: 'Enable Two-Factor Authentication',
            description: 'Add an extra layer of security to your account',
            impact: '+15 points',
            link: '/dashboard/settings'
        },
        {
            enabled: true,
            title: 'Require NDA by Default',
            description: 'Make viewers sign an NDA before accessing files',
            impact: '+5 points',
            link: '/dashboard/settings'
        },
        {
            enabled: true,
            title: 'Block High-Risk Regions',
            description: 'Prevent access from countries with high cyber threat activity',
            impact: '+5 points',
            link: '/dashboard/settings'
        },
    ];

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
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="md:ml-72 ml-0 p-4 md:p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Security Dashboard</h1>
                        <p className="text-sm text-[var(--foreground-muted)]">Monitor and improve your security posture</p>
                    </div>
                </div>

                {/* Security Score Card */}
                <div className="glass-card p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-6">
                            {/* Score Circle */}
                            <div className="relative w-28 h-28">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="56"
                                        cy="56"
                                        r="48"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="8"
                                        fill="none"
                                    />
                                    <circle
                                        cx="56"
                                        cy="56"
                                        r="48"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeLinecap="round"
                                        className={getScoreColor()}
                                        strokeDasharray={`${(securityScore / 100) * 301.6} 301.6`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-3xl font-bold ${getScoreColor()}`}>{securityScore}</span>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Security Score</h2>
                                <p className="text-[var(--foreground-muted)]">
                                    {securityScore >= 80 ? 'Excellent protection' :
                                        securityScore >= 60 ? 'Good, but can improve' : 'Needs attention'}
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-400">{stats.totalFiles}</div>
                                <div className="text-xs text-[var(--foreground-muted)]">Protected Files</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-[var(--primary)]">{stats.activeShares}</div>
                                <div className="text-xs text-[var(--foreground-muted)]">Active Shares</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-400">{stats.threatsBlocked}</div>
                                <div className="text-xs text-[var(--foreground-muted)]">Threats Blocked</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Recommendations */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                            Recommendations
                        </h2>
                        <div className="space-y-3">
                            {recommendations.map((rec, i) => (
                                <a
                                    key={i}
                                    href={rec.link}
                                    className="block p-3 rounded-lg bg-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.1)] transition"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium">{rec.title}</p>
                                            <p className="text-sm text-[var(--foreground-muted)]">{rec.description}</p>
                                        </div>
                                        <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                                            {rec.impact}
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Protection Status */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-[var(--primary)]" />
                            Protection Status
                        </h2>
                        <div className="space-y-3">
                            {[
                                { label: 'AES-256 Encryption', status: true },
                                { label: 'Session Monitoring', status: true },
                                { label: 'Screenshot Protection', status: true },
                                { label: 'Country Blocking', status: true },
                                { label: 'Two-Factor Auth', status: securityScore >= 65 },
                                { label: 'Auto Kill on Threat', status: true },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-2">
                                    <span>{item.label}</span>
                                    {item.status ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-[var(--foreground-muted)]" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Security Events */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-[var(--primary)]" />
                            Recent Security Events
                        </h2>
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2 hover:bg-[rgba(0,212,255,0.1)] rounded-lg transition"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-[var(--foreground-muted)]">Loading events...</div>
                    ) : recentEvents.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                <Shield className="w-8 h-8 text-emerald-400" />
                            </div>
                            <p className="text-[var(--foreground-muted)]">No security events yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentEvents.slice(0, 10).map((event) => (
                                <div
                                    key={event.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg ${event.type === 'blocked'
                                        ? 'bg-red-500/10 border border-red-500/20'
                                        : 'bg-[rgba(0,212,255,0.05)]'
                                        }`}
                                >
                                    {event.type === 'blocked' ? (
                                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    ) : (
                                        <Eye className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{event.message}</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">{event.details}</p>
                                    </div>
                                    <span className="text-xs text-[var(--foreground-muted)] flex-shrink-0">
                                        {formatTime(event.timestamp)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
