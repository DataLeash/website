'use client'

import Link from "next/link";
import { useState } from "react";
import { useFiles } from "@/lib/hooks";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";

export default function SharePage() {
    const { files } = useFiles();
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [shareLink, setShareLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [shareSettings, setShareSettings] = useState({
        expiresIn: '7days',
        requireNda: false,
        notifyOnView: true,
    });

    const generateLink = () => {
        if (!selectedFile) {
            alert('Please select a file to share');
            return;
        }
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dataleash.app';
        setShareLink(`${baseUrl}/view/${selectedFile}`);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Share File</h1>
                    <p className="text-[var(--foreground-muted)]">Generate secure share links for your files</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Icon3D type="folder" size="sm" />
                            Select File
                        </h2>
                        {files.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="mb-4 flex justify-center">
                                    <Icon3D type="file" size="lg" />
                                </div>
                                <p className="text-[var(--foreground-muted)]">No files to share</p>
                                <Link href="/dashboard/upload" className="text-[var(--primary)] hover:underline mt-2 inline-block">
                                    Upload a file first
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {files.map((file) => (
                                    <button
                                        key={file.id}
                                        onClick={() => setSelectedFile(file.id)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${selectedFile === file.id
                                                ? 'bg-[var(--primary)] text-black'
                                                : 'bg-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.2)]'
                                            }`}
                                    >
                                        <Icon3D type="file" size="sm" />
                                        <span className="truncate">{file.original_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Icon3D type="settings" size="sm" />
                            Share Settings
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Link Expires In</label>
                                <select
                                    value={shareSettings.expiresIn}
                                    onChange={(e) => setShareSettings({ ...shareSettings, expiresIn: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                                >
                                    <option value="1day">1 Day</option>
                                    <option value="7days">7 Days</option>
                                    <option value="30days">30 Days</option>
                                    <option value="never">Never</option>
                                </select>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={shareSettings.requireNda}
                                    onChange={(e) => setShareSettings({ ...shareSettings, requireNda: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                <span>Require NDA signature</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={shareSettings.notifyOnView}
                                    onChange={(e) => setShareSettings({ ...shareSettings, notifyOnView: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                <span>Notify me when viewed</span>
                            </label>

                            <button
                                onClick={generateLink}
                                disabled={!selectedFile}
                                className="w-full glow-button py-3 rounded-lg font-semibold text-black disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Icon3D type="link" size="sm" />
                                Generate Share Link
                            </button>
                        </div>

                        {shareLink && (
                            <div className="mt-6 p-4 bg-[rgba(0,212,255,0.1)] rounded-lg">
                                <p className="text-sm text-[var(--foreground-muted)] mb-2">Share Link:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={shareLink}
                                        readOnly
                                        className="flex-1 px-4 py-2 rounded bg-[var(--background)] border border-[rgba(0,212,255,0.2)] text-sm"
                                    />
                                    <button
                                        onClick={copyLink}
                                        className="px-4 py-2 rounded bg-[var(--primary)] text-black font-semibold"
                                    >
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
