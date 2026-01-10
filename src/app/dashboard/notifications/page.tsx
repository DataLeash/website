'use client'

import { useState } from 'react'
import { useNotifications } from "@/lib/hooks";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase-browser";

export default function NotificationsPage() {
    const { notifications, loading, markAsRead, markAllAsRead, refetch } = useNotifications();
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selectedNotifs, setSelectedNotifs] = useState<Set<string>>(new Set());
    const supabase = createClient();

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    const getIconType = (type: string) => {
        switch (type) {
            case 'view': return 'eye';
            case 'threat': return 'danger';
            case 'access_request': return 'lock';
            case 'revoke': return 'danger';
            default: return 'bell';
        }
    };

    const deleteNotification = async (id: string) => {
        setDeleting(id);
        try {
            await supabase.from('notifications').delete().eq('id', id);
            refetch();
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setDeleting(null);
        }
    };

    const deleteSelected = async () => {
        if (selectedNotifs.size === 0) return;
        if (!confirm(`Delete ${selectedNotifs.size} notification(s)?`)) return;

        for (const id of selectedNotifs) {
            await supabase.from('notifications').delete().eq('id', id);
        }
        setSelectedNotifs(new Set());
        refetch();
    };

    const deleteAll = async () => {
        if (!confirm('Delete ALL notifications?')) return;
        await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        refetch();
    };

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedNotifs);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedNotifs(newSelection);
    };

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Notifications</h1>
                        <p className="text-[var(--foreground-muted)]">Stay updated on file activity</p>
                    </div>
                    <div className="flex gap-2">
                        {selectedNotifs.size > 0 && (
                            <button
                                onClick={deleteSelected}
                                className="px-4 py-2 bg-[var(--error)] text-white rounded-lg font-semibold hover:bg-red-600 transition"
                            >
                                Delete Selected ({selectedNotifs.size})
                            </button>
                        )}
                        <button onClick={markAllAsRead} className="glass-card px-4 py-2 rounded-lg hover:border-[var(--primary)] transition">
                            Mark all read
                        </button>
                        <button onClick={deleteAll} className="glass-card px-4 py-2 rounded-lg hover:border-[var(--error)] text-[var(--error)] transition">
                            Delete All
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" text="Loading notifications..." />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-12 glass-card">
                        <div className="mb-4 flex justify-center">
                            <Icon3D type="bell" size="xl" />
                        </div>
                        <p className="text-xl text-[var(--foreground-muted)]">No notifications</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`glass-card p-4 flex items-center gap-4 transition ${!notif.is_read ? 'border-[var(--primary)]' : 'opacity-80'}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedNotifs.has(notif.id)}
                                    onChange={() => toggleSelection(notif.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded border-[var(--primary)]"
                                />
                                <div
                                    className="flex items-center gap-4 flex-1 cursor-pointer"
                                    onClick={() => markAsRead(notif.id)}
                                >
                                    <Icon3D type={getIconType(notif.type)} size="md" />
                                    <div className="flex-1">
                                        <div className="font-medium">{notif.title}</div>
                                        <div className="text-sm text-[var(--foreground-muted)]">{notif.message}</div>
                                    </div>
                                    <div className="text-sm text-[var(--foreground-muted)]">{formatTime(notif.created_at)}</div>
                                    {!notif.is_read && <div className="w-3 h-3 rounded-full bg-[var(--primary)] animate-pulse"></div>}
                                </div>
                                <button
                                    onClick={() => deleteNotification(notif.id)}
                                    disabled={deleting === notif.id}
                                    className="p-2 text-[var(--error)] hover:bg-[rgba(239,68,68,0.1)] rounded transition disabled:opacity-50"
                                    title="Delete notification"
                                >
                                    {deleting === notif.id ? (
                                        <div className="w-4 h-4 border-2 border-[var(--error)] border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
