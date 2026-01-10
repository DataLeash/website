'use client'

import { useActivity } from "@/lib/hooks";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";

export default function ActivityPage() {
    const { logs, loading, fetchLogs } = useActivity();
    const [deleting, setDeleting] = useState<string | null>(null);
    const supabase = createClient();

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'view': return 'text-[var(--success)]';
            case 'access_approved': return 'text-[var(--success)]';
            case 'blocked': return 'text-[var(--error)]';
            case 'access_denied': return 'text-[var(--error)]';
            case 'denied': return 'text-[var(--warning)]';
            default: return 'text-[var(--foreground-muted)]';
        }
    };

    const getActionIconType = (action: string) => {
        switch (action) {
            case 'view': return 'eye';
            case 'access_approved': return 'shield';
            case 'blocked': return 'danger';
            case 'access_denied': return 'danger';
            case 'nda_signed': return 'file';
            case 'upload': return 'upload';
            case 'download': return 'folder';
            case 'kill': return 'danger';
            default: return 'activity';
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
                fetchLogs();
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

            fetchLogs();
        } catch (err) {
            console.error('Delete all error:', err);
        }
        setDeleting(null);
    };

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Activity Log</h1>
                        <p className="text-[var(--foreground-muted)]">Complete history of file access ({logs.length} entries)</p>
                    </div>
                    {logs.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            disabled={deleting === 'all'}
                            className="px-4 py-2 bg-[rgba(239,68,68,0.1)] text-[var(--error)] rounded-lg hover:bg-[rgba(239,68,68,0.2)] disabled:opacity-50"
                        >
                            {deleting === 'all' ? 'Deleting...' : 'Clear All Logs'}
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-12 text-[var(--foreground-muted)]">Loading activity...</div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mb-4 flex justify-center">
                            <Icon3D type="activity" size="xl" />
                        </div>
                        <p className="text-xl text-[var(--foreground-muted)]">No activity yet</p>
                    </div>
                ) : (
                    <div className="glass-card overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-[rgba(0,212,255,0.1)]">
                                <tr>
                                    <th className="text-left px-6 py-4">Time</th>
                                    <th className="text-left px-6 py-4">Action</th>
                                    <th className="text-left px-6 py-4">File</th>
                                    <th className="text-left px-6 py-4">Details</th>
                                    <th className="text-right px-6 py-4">Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log: any) => (
                                    <tr key={log.id} className="border-t border-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.03)]">
                                        <td className="px-6 py-4 text-sm">{formatTime(log.timestamp)}</td>
                                        <td className={`px-6 py-4 font-medium ${getActionColor(log.action)}`}>
                                            <span className="flex items-center gap-2">
                                                <Icon3D type={getActionIconType(log.action)} size="sm" />
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{log.files?.original_name || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                                            {log.location?.viewer_email || log.location?.city || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                disabled={deleting === log.id}
                                                className="px-3 py-1 text-sm text-[var(--error)] hover:bg-[rgba(239,68,68,0.1)] rounded disabled:opacity-50"
                                            >
                                                {deleting === log.id ? '...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
