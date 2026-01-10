'use client'

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface BlacklistEntry {
    id: string;
    blocked_email: string;
    blocked_name: string;
    reason: string;
    blocked_at: string;
    match_count: number;
    last_match_at: string | null;
    ip_info?: {
        city?: string;
        country?: string;
    };
    fingerprint?: {
        browser?: string;
        os?: string;
        webglFingerprint?: {
            unmaskedRenderer?: string;
        };
    };
}

export default function BlacklistPage() {
    const [entries, setEntries] = useState<BlacklistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [tableError, setTableError] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchBlacklist();
    }, []);

    const fetchBlacklist = async () => {
        setLoading(true);
        setTableError(false);
        try {
            const res = await fetch('/api/blacklist');
            const data = await res.json();

            if (data.error && data.error.includes('does not exist')) {
                setTableError(true);
            } else {
                setEntries(data.blacklist || []);
            }
        } catch (err) {
            console.error('Failed to fetch blacklist:', err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromBlacklist = async (id: string, email: string) => {
        if (!confirm(`Remove ${email} from blacklist?`)) return;

        try {
            const res = await fetch(`/api/blacklist?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setEntries(entries.filter(e => e.id !== id));
            }
        } catch (err) {
            console.error('Remove failed:', err);
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Icon3D type="danger" size="lg" />
                        Blacklist
                    </h1>
                    <p className="text-[var(--foreground-muted)]">
                        Blocked devices and users. They will be denied access and flagged if they attempt to view your files.
                    </p>
                </div>

                {/* Table Error */}
                {tableError ? (
                    <div className="glass-card p-8 text-center">
                        <Icon3D type="danger" size="xl" />
                        <h2 className="text-xl font-bold text-[var(--warning)] mt-4 mb-2">Database Setup Required</h2>
                        <p className="text-[var(--foreground-muted)] mb-4">Run `add_blacklist_table.sql` in Supabase</p>
                        <button onClick={fetchBlacklist} className="glow-button px-6 py-2 rounded-lg font-semibold text-black">
                            Retry
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" text="Loading blacklist..." />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="mb-4 flex justify-center">
                            <Icon3D type="shield" size="xl" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">No Blocked Devices</h2>
                        <p className="text-[var(--foreground-muted)]">
                            When you blacklist someone from Active Viewers or access requests, they'll appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {entries.map((entry) => (
                            <div key={entry.id} className="glass-card p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[rgba(239,68,68,0.2)] flex items-center justify-center flex-shrink-0">
                                        <Icon3D type="danger" size="md" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg">
                                                    {entry.blocked_name || entry.blocked_email || 'Unknown Device'}
                                                </h3>
                                                <p className="text-[var(--foreground-muted)] text-sm">{entry.blocked_email}</p>
                                            </div>
                                            <button
                                                onClick={() => removeFromBlacklist(entry.id, entry.blocked_email)}
                                                className="px-4 py-2 border border-[var(--error)] text-[var(--error)] rounded-lg hover:bg-[rgba(239,68,68,0.1)] transition text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-[var(--foreground-muted)]">Blocked:</span>
                                                <div>{formatTime(entry.blocked_at)}</div>
                                            </div>
                                            <div>
                                                <span className="text-[var(--foreground-muted)]">Location:</span>
                                                <div>{entry.ip_info?.city || 'Unknown'}, {entry.ip_info?.country || 'Unknown'}</div>
                                            </div>
                                            <div>
                                                <span className="text-[var(--foreground-muted)]">Match Attempts:</span>
                                                <div className={entry.match_count > 0 ? 'text-[var(--error)] font-bold' : ''}>
                                                    {entry.match_count || 0} {entry.match_count > 0 && '⚠️'}
                                                </div>
                                            </div>
                                        </div>

                                        {entry.reason && (
                                            <div className="mt-3 p-3 bg-[rgba(0,0,0,0.2)] rounded-lg text-sm">
                                                <span className="text-[var(--foreground-muted)]">Reason: </span>
                                                {entry.reason}
                                            </div>
                                        )}

                                        {entry.fingerprint && (
                                            <div className="mt-3 text-xs text-[var(--foreground-muted)]">
                                                <span>Device: </span>
                                                {entry.fingerprint.browser} on {entry.fingerprint.os}
                                                {entry.fingerprint.webglFingerprint?.unmaskedRenderer && (
                                                    <span className="block mt-1">GPU: {entry.fingerprint.webglFingerprint.unmaskedRenderer}</span>
                                                )}
                                            </div>
                                        )}

                                        {entry.last_match_at && (
                                            <div className="mt-2 text-xs text-[var(--error)]">
                                                Last attempted access: {formatTime(entry.last_match_at)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
