'use client'

import Link from "next/link";
import { useFiles } from "@/lib/hooks";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { FolderLock, FileText, Copy, Check, QrCode, X, Link2, Trash2 } from "lucide-react";
import { QRCodeShare } from "@/components/QRCodeShare";

export default function FilesPage() {
    const { files, loading, killFile } = useFiles();
    const [search, setSearch] = useState('');
    const [shareModal, setShareModal] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);

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
        setShowQR(false);
    };

    const getShareUrl = (fileId: string) => {
        return `${typeof window !== 'undefined' ? window.location.origin : ''}/view/${fileId}`;
    };

    const copyShareLink = (fileId: string) => {
        navigator.clipboard.writeText(getShareUrl(fileId));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleKill = async (fileId: string) => {
        if (confirm('Are you sure you want to destroy this file? This cannot be undone.')) {
            await killFile(fileId);
        }
    };

    const currentFile = files.find(f => f.id === shareModal);

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                                <FolderLock className="w-5 h-5 text-white" />
                            </div>
                            My Protected Files
                        </h1>
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
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 flex items-center justify-center">
                                <FolderLock className="w-8 h-8 text-emerald-500" />
                            </div>
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
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                                                <FileText className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="font-medium">{file.original_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--foreground-muted)]">{formatSize(file.file_size)}</td>
                                        <td className="px-6 py-4 text-[var(--foreground-muted)]">{formatDate(file.created_at)}</td>
                                        <td className="px-6 py-4">{file.total_views || 0}</td>
                                        <td className="px-6 py-4"><span className="text-[var(--success)]">● Active</span></td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleShare(file.id)}
                                                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg hover:from-cyan-500/30 hover:to-blue-500/30 transition inline-flex items-center gap-1"
                                            >
                                                <Link2 className="w-4 h-4" />
                                                Share
                                            </button>
                                            <button
                                                onClick={() => handleKill(file.id)}
                                                className="px-3 py-1.5 bg-red-500/10 text-[var(--error)] rounded-lg hover:bg-red-500/20 transition inline-flex items-center gap-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Kill
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Share Modal */}
            {shareModal && !showQR && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShareModal(null)}>
                    <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Link2 className="w-5 h-5 text-[var(--primary)]" />
                                Share File
                            </h2>
                            <button onClick={() => setShareModal(null)} className="text-[var(--foreground-muted)] hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-[var(--foreground-muted)] mb-4">
                            {currentFile?.original_name}
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm text-[var(--foreground-muted)] mb-2">Share Link</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={getShareUrl(shareModal)}
                                    readOnly
                                    className="flex-1 px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] text-sm font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => copyShareLink(shareModal)}
                                className="glow-button py-3 rounded-lg font-semibold text-black flex items-center justify-center gap-2"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button
                                onClick={() => setShowQR(true)}
                                className="glass-card py-3 rounded-lg font-semibold hover:border-[var(--primary)] flex items-center justify-center gap-2 transition"
                            >
                                <QrCode className="w-4 h-4" />
                                QR Code
                            </button>
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)]">
                            <p className="text-xs text-[var(--foreground-muted)]">
                                🔒 Anyone with this link must verify their identity and get your approval to view the file.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {shareModal && showQR && (
                <QRCodeShare
                    url={getShareUrl(shareModal)}
                    fileName={currentFile?.original_name || 'File'}
                    onClose={() => setShowQR(false)}
                />
            )}
        </div>
    );
}
