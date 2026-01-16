'use client'

import { ProtectedFile } from "@/types/database";
import Link from "next/link";
import { useFiles } from "@/lib/hooks";
import { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    FolderLock, FileText, Copy, Check, QrCode, X, Link2, Trash2,
    Search, Filter, ChevronDown, BarChart3, Users, Ban, RefreshCw,
    CheckSquare, Square, Eye, Clock, AlertTriangle
} from "lucide-react";
import { QRCodeShare } from "@/components/QRCodeShare";

type FileStatus = 'all' | 'active' | 'expiring' | 'destroyed';
type SortBy = 'created' | 'name' | 'views' | 'size';

export default function FilesPage() {
    const { files, loading, killFile, fetchFiles } = useFiles();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<FileStatus>('all');
    const [sortBy, setSortBy] = useState<SortBy>('created');
    const [sortDesc, setSortDesc] = useState(true);
    const [shareModal, setShareModal] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Bulk selection state
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [bulkActionLoading, setBulkActionLoading] = useState(false);

    // Filter and sort files
    const filteredFiles = useMemo(() => {
        let result = files.filter(f =>
            f.original_name.toLowerCase().includes(search.toLowerCase())
        );

        // Status filter
        if (statusFilter === 'active') {
            result = result.filter(f => !f.is_destroyed);
        } else if (statusFilter === 'destroyed') {
            result = result.filter(f => f.is_destroyed);
        } else if (statusFilter === 'expiring') {
            const now = new Date();
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            result = result.filter(f => {
                if (f.settings?.expires_at) {
                    const expiryDate = new Date(f.settings.expires_at);
                    return expiryDate > now && expiryDate < weekFromNow;
                }
                return false;
            });
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.original_name.localeCompare(b.original_name);
                    break;
                case 'views':
                    comparison = (a.total_views || 0) - (b.total_views || 0);
                    break;
                case 'size':
                    comparison = a.file_size - b.file_size;
                    break;
                case 'created':
                default:
                    comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
            return sortDesc ? -comparison : comparison;
        });

        return result;
    }, [files, search, statusFilter, sortBy, sortDesc]);

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

    // Bulk actions
    const toggleSelectAll = () => {
        if (selectedFiles.size === filteredFiles.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
        }
    };

    const toggleSelect = (fileId: string) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId);
        } else {
            newSelected.add(fileId);
        }
        setSelectedFiles(newSelected);
    };

    const handleBulkKill = async () => {
        if (selectedFiles.size === 0) return;
        if (!confirm(`Destroy ${selectedFiles.size} files? This cannot be undone.`)) return;

        setBulkActionLoading(true);
        try {
            for (const fileId of selectedFiles) {
                await killFile(fileId);
            }
            setSelectedFiles(new Set());
        } finally {
            setBulkActionLoading(false);
        }
    };

    const getFileStatus = (file: ProtectedFile) => {
        if (file.is_destroyed) return { label: 'Destroyed', color: 'text-[var(--error)]', icon: Trash2 };
        if (file.settings?.expires_at) {
            const expiryDate = new Date(file.settings.expires_at);
            const now = new Date();
            if (expiryDate < now) return { label: 'Expired', color: 'text-[var(--warning)]', icon: Clock };
            const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: 'text-[var(--warning)]', icon: AlertTriangle };
        }
        return { label: 'Active', color: 'text-[var(--success)]', icon: Eye };
    };

    const currentFile = files.find(f => f.id === shareModal);
    const allSelected = filteredFiles.length > 0 && selectedFiles.size === filteredFiles.length;

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="md:ml-72 ml-0 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                                <FolderLock className="w-5 h-5 text-white" />
                            </div>
                            My Protected Files
                        </h1>
                        <p className="text-[var(--foreground-muted)]">{files.length} files • {filteredFiles.length} shown</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchFiles?.()}
                            className="px-4 py-2.5 glass-card rounded-lg hover:border-[var(--primary)] transition flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden md:inline">Refresh</span>
                        </button>
                        <Link href="/dashboard/upload" className="glow-button px-4 md:px-6 py-2.5 rounded-lg font-semibold text-black">
                            + Upload
                        </Link>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="glass-card p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                            />
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2.5 rounded-lg border flex items-center gap-2 transition ${showFilters ? 'border-[var(--primary)] bg-[rgba(0,212,255,0.1)]' : 'border-[rgba(0,212,255,0.2)] hover:border-[var(--primary)]'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            <ChevronDown className={`w-4 h-4 transition ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-[rgba(0,212,255,0.1)] grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs text-[var(--foreground-muted)] mb-2">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as FileStatus)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                                >
                                    <option value="all">All Files</option>
                                    <option value="active">Active</option>
                                    <option value="expiring">Expiring Soon</option>
                                    <option value="destroyed">Destroyed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-[var(--foreground-muted)] mb-2">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                                >
                                    <option value="created">Date Created</option>
                                    <option value="name">Name</option>
                                    <option value="views">Views</option>
                                    <option value="size">Size</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-[var(--foreground-muted)] mb-2">Order</label>
                                <select
                                    value={sortDesc ? 'desc' : 'asc'}
                                    onChange={(e) => setSortDesc(e.target.value === 'desc')}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                                >
                                    <option value="desc">Descending</option>
                                    <option value="asc">Ascending</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bulk Actions Bar */}
                {selectedFiles.size > 0 && (
                    <div className="glass-card p-4 mb-4 flex items-center justify-between bg-[rgba(0,212,255,0.05)]">
                        <span className="font-medium">{selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected</span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleBulkKill}
                                disabled={bulkActionLoading}
                                className="px-4 py-2 bg-[var(--error)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                {bulkActionLoading ? 'Destroying...' : 'Destroy Selected'}
                            </button>
                            <button
                                onClick={() => setSelectedFiles(new Set())}
                                className="px-4 py-2 border border-[rgba(0,212,255,0.2)] rounded-lg hover:border-[var(--primary)] transition"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Files Table */}
                {loading ? (
                    <div className="text-center py-12 text-[var(--foreground-muted)]">Loading files...</div>
                ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mb-4 flex justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 flex items-center justify-center">
                                <FolderLock className="w-8 h-8 text-emerald-500" />
                            </div>
                        </div>
                        <p className="text-xl text-[var(--foreground-muted)]">
                            {search || statusFilter !== 'all' ? 'No files match your filters' : 'No files found'}
                        </p>
                        {!search && statusFilter === 'all' && (
                            <Link href="/dashboard/upload" className="text-[var(--primary)] hover:underline mt-2 inline-block">
                                Upload your first file →
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[rgba(0,212,255,0.1)]">
                                    <tr>
                                        <th className="text-left px-4 py-3 w-12">
                                            <button onClick={toggleSelectAll} className="hover:text-[var(--primary)] transition">
                                                {allSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                            </button>
                                        </th>
                                        <th className="text-left px-4 py-3">File</th>
                                        <th className="text-left px-4 py-3 hidden md:table-cell">Size</th>
                                        <th className="text-left px-4 py-3 hidden lg:table-cell">Created</th>
                                        <th className="text-left px-4 py-3">Views</th>
                                        <th className="text-left px-4 py-3">Status</th>
                                        <th className="text-right px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFiles.map((file) => {
                                        const status = getFileStatus(file);
                                        const isSelected = selectedFiles.has(file.id);
                                        return (
                                            <tr
                                                key={file.id}
                                                className={`border-t border-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.05)] transition ${isSelected ? 'bg-[rgba(0,212,255,0.08)]' : ''
                                                    }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <button onClick={() => toggleSelect(file.id)} className="hover:text-[var(--primary)] transition">
                                                        {isSelected ? <CheckSquare className="w-5 h-5 text-[var(--primary)]" /> : <Square className="w-5 h-5" />}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                                            <FileText className="w-4 h-4 text-white" />
                                                        </div>
                                                        <span className="font-medium truncate max-w-[150px] md:max-w-[250px]">{file.original_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-[var(--foreground-muted)] hidden md:table-cell">{formatSize(file.file_size)}</td>
                                                <td className="px-4 py-3 text-[var(--foreground-muted)] hidden lg:table-cell">{formatDate(file.created_at)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="w-4 h-4 text-[var(--foreground-muted)]" />
                                                        {file.total_views || 0}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`flex items-center gap-1 ${status.color}`}>
                                                        <status.icon className="w-3 h-3" />
                                                        <span className="text-sm">{status.label}</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleShare(file.id)}
                                                            className="p-2 hover:bg-[rgba(0,212,255,0.1)] rounded-lg transition"
                                                            title="Share"
                                                        >
                                                            <Link2 className="w-4 h-4" />
                                                        </button>
                                                        <Link
                                                            href={`/dashboard/analytics?file=${file.id}`}
                                                            className="p-2 hover:bg-[rgba(0,212,255,0.1)] rounded-lg transition"
                                                            title="Analytics"
                                                        >
                                                            <BarChart3 className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleKill(file.id)}
                                                            className="p-2 hover:bg-[rgba(239,68,68,0.1)] rounded-lg transition text-[var(--error)]"
                                                            title="Destroy"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Share Modal */}
            {shareModal && !showQR && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShareModal(null)}>
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
