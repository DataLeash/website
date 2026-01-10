'use client'

import Link from "next/link";
import { useFiles } from "@/lib/hooks";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";

export default function FilesPage() {
    const { files, loading, killFile } = useFiles();
    const [search, setSearch] = useState('');
    const [shareModal, setShareModal] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const filteredFiles = files.filter(f =>
        f.original_name.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (date: string) => new Date(date).toLocaleDateString();
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleShare = (fileId: string) => {
        setShareModal(fileId);
    };

    const copyShareLink = (fileId: string) => {
        const shareUrl = `${window.location.origin}/view/${fileId}`;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
            setShareModal(null);
        }, 1500);
    };

    const handleKill = async (fileId: string) => {
        if (confirm('Are you sure you want to destroy this file? This cannot be undone.')) {
            await killFile(fileId);
        }
    };

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">My Protected Files</h1>
                        <p className="text-[var(--foreground-muted)]">{files.length} files protected</p>
                    </div>
                    <Link href="/dashboard/upload" className="glow-button px-6 py-3 rounded-lg font-semibold text-black">+ Upload File</Link>
                </div>

                <div className="glass-card p-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                    />
                </div>

                {loading ? (
                    <div className="text-center py-12 text-[var(--foreground-muted)]">Loading files...</div>
                ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mb-4 flex justify-center">
                            <Icon3D type="folder" size="xl" />
                        </div>
                        <p className="text-xl text-[var(--foreground-muted)]">No files found</p>
                        <Link href="/dashboard/upload" className="text-[var(--primary)] hover:underline mt-2 inline-block">Upload your first file →</Link>
                    </div>
                ) : (
                    <div className="glass-card overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-[rgba(0,212,255,0.1)]">
                                <tr>
                                    <th className="text-left px-6 py-4">File Name</th>
                                    <th className="text-left px-6 py-4">Size</th>
                                    <th className="text-left px-6 py-4">Created</th>
                                    <th className="text-left px-6 py-4">Views</th>
                                    <th className="text-left px-6 py-4">Status</th>
                                    <th className="text-right px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFiles.map((file) => (
                                    <tr key={file.id} className="border-t border-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.05)]">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <Icon3D type="file" size="sm" />
                                            <span className="font-medium">{file.original_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--foreground-muted)]">{formatSize(file.file_size)}</td>
                                        <td className="px-6 py-4 text-[var(--foreground-muted)]">{formatDate(file.created_at)}</td>
                                        <td className="px-6 py-4">{file.total_views || 0}</td>
                                        <td className="px-6 py-4"><span className="text-[var(--success)]">● Active</span></td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleShare(file.id)} className="px-3 py-1 bg-[rgba(0,212,255,0.1)] rounded hover:bg-[rgba(0,212,255,0.2)]">Share</button>
                                            <button onClick={() => handleKill(file.id)} className="px-3 py-1 bg-[rgba(239,68,68,0.1)] text-[var(--error)] rounded hover:bg-[rgba(239,68,68,0.2)]">Kill</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Share Modal */}
            {shareModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShareModal(null)}>
                    <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Share File</h2>
                        <div className="mb-4">
                            <label className="block text-sm text-[var(--foreground-muted)] mb-2">Share Link</label>
                            <input
                                type="text"
                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/view/${shareModal}`}
                                readOnly
                                className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)]"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => copyShareLink(shareModal)} className="flex-1 glow-button py-3 rounded-lg font-semibold text-black">
                                {copied ? '✓ Copied!' : 'Copy Link'}
                            </button>
                            <button onClick={() => setShareModal(null)} className="flex-1 glass-card py-3 rounded-lg font-semibold hover:border-[var(--primary)]">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
