'use client'

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { useFiles } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import {
    Shield, Lock, Clock, Users, AlertTriangle,
    Eye, FileText, X, Check, Upload, Globe
} from "lucide-react";

// Common blocked countries
const COUNTRIES = [
    { code: 'CN', name: 'China' },
    { code: 'RU', name: 'Russia' },
    { code: 'KP', name: 'North Korea' },
    { code: 'IR', name: 'Iran' },
];

export default function UploadPage() {
    const router = useRouter();
    const { uploadFile } = useFiles();

    // Core state
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [recipients, setRecipients] = useState<string[]>([]);
    const [recipientEmail, setRecipientEmail] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Simplified settings - only what actually works
    const [settings, setSettings] = useState({
        // Expiration
        expires_at: null as string | null,
        max_views: null as number | null,
        // Password
        require_password: false,
        file_password: '',
        // Protection
        add_watermark: true,
        block_copy_paste: true,
        block_printing: true,
        block_download: true,
        // Notifications
        notify_on_view: true,
        // Geo-blocking
        blocked_countries: [] as string[],
    });

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) setFile(droppedFile);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) setFile(selectedFile);
    };

    const addRecipient = () => {
        const email = recipientEmail.trim().toLowerCase();
        if (email && !recipients.includes(email) && email.includes('@')) {
            setRecipients([...recipients, email]);
            setRecipientEmail('');
        }
    };

    const removeRecipient = (email: string) => {
        setRecipients(recipients.filter(r => r !== email));
    };

    const toggleCountry = (code: string) => {
        if (settings.blocked_countries.includes(code)) {
            setSettings({ ...settings, blocked_countries: settings.blocked_countries.filter(c => c !== code) });
        } else {
            setSettings({ ...settings, blocked_countries: [...settings.blocked_countries, code] });
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        if (settings.require_password && !settings.file_password) {
            setError('Please enter a password for the file');
            return;
        }

        setError('');
        setUploading(true);
        setUploadProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 300);

        try {
            const result = await uploadFile(file, settings, recipients);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(`File protected! Share link copied to clipboard.`);
                if (result.share_link) {
                    navigator.clipboard.writeText(result.share_link);
                }
                setTimeout(() => router.push('/dashboard/files'), 2000);
            }
        } catch (err) {
            clearInterval(progressInterval);
            setError('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                <div className="max-w-2xl">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Shield className="w-8 h-8 text-[var(--primary)]" />
                            Upload Protected File
                        </h1>
                        <p className="text-[var(--foreground-muted)] mt-2">
                            Encrypt and protect your file with view controls
                        </p>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            {success}
                        </div>
                    )}

                    {/* Upload Zone */}
                    <div className="glass-card p-6 mb-6">
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${isDragging
                                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                : 'border-gray-600 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            {file ? (
                                <div>
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-[var(--primary)]" />
                                    <h3 className="text-lg font-bold">{file.name}</h3>
                                    <p className="text-[var(--foreground-muted)] text-sm">{formatFileSize(file.size)}</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                        className="mt-3 text-red-400 text-sm hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <Upload className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                                    <h3 className="text-lg font-semibold">Drop file here</h3>
                                    <p className="text-[var(--foreground-muted)] text-sm">or click to browse</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="glass-card p-6 mb-6 space-y-6">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <Lock className="w-5 h-5 text-[var(--primary)]" />
                            Protection Settings
                        </h2>

                        {/* Expiration Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    Expires After
                                </label>
                                <select
                                    value={settings.expires_at || ''}
                                    onChange={(e) => setSettings({ ...settings, expires_at: e.target.value || null })}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-gray-700 focus:border-[var(--primary)] focus:outline-none"
                                >
                                    <option value="">Never</option>
                                    <option value="24h">24 hours</option>
                                    <option value="7d">7 days</option>
                                    <option value="30d">30 days</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Eye className="w-4 h-4 inline mr-1" />
                                    Max Views
                                </label>
                                <select
                                    value={settings.max_views || ''}
                                    onChange={(e) => setSettings({ ...settings, max_views: e.target.value ? parseInt(e.target.value) : null })}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-gray-700 focus:border-[var(--primary)] focus:outline-none"
                                >
                                    <option value="">Unlimited</option>
                                    <option value="1">1 view</option>
                                    <option value="5">5 views</option>
                                    <option value="10">10 views</option>
                                </select>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-medium">Password Protection</span>
                                <div
                                    onClick={() => setSettings({ ...settings, require_password: !settings.require_password, file_password: '' })}
                                    className={`relative w-11 h-6 rounded-full transition ${settings.require_password ? 'bg-[var(--primary)]' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${settings.require_password ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </div>
                            </label>
                            {settings.require_password && (
                                <input
                                    type="password"
                                    placeholder="Enter password for file"
                                    value={settings.file_password}
                                    onChange={(e) => setSettings({ ...settings, file_password: e.target.value })}
                                    className="mt-3 w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-gray-700 focus:border-[var(--primary)] focus:outline-none"
                                />
                            )}
                        </div>

                        {/* Toggles */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'add_watermark', label: 'Add Watermark' },
                                { key: 'notify_on_view', label: 'Notify on View' },
                                { key: 'block_copy_paste', label: 'Block Copy/Paste' },
                                { key: 'block_download', label: 'Block Download' },
                            ].map((item) => (
                                <label key={item.key} className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-white/5">
                                    <span className="text-sm">{item.label}</span>
                                    <div
                                        onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                                        className={`relative w-9 h-5 rounded-full transition ${settings[item.key as keyof typeof settings] ? 'bg-[var(--primary)]' : 'bg-gray-600'}`}
                                    >
                                        <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${settings[item.key as keyof typeof settings] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* Geo-blocking */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                <Globe className="w-4 h-4 inline mr-1" />
                                Block Countries
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {COUNTRIES.map((country) => (
                                    <button
                                        key={country.code}
                                        onClick={() => toggleCountry(country.code)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition ${settings.blocked_countries.includes(country.code)
                                            ? 'bg-red-500/20 border border-red-500 text-red-400'
                                            : 'bg-gray-800 hover:bg-gray-700'
                                            }`}
                                    >
                                        {country.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recipients */}
                    <div className="glass-card p-6 mb-6">
                        <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-[var(--primary)]" />
                            Recipients
                        </h2>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="email"
                                placeholder="Add email address..."
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
                                className="flex-1 px-4 py-2 rounded-lg bg-[var(--background)] border border-gray-700 focus:border-[var(--primary)] focus:outline-none"
                            />
                            <button
                                onClick={addRecipient}
                                className="px-4 py-2 bg-[var(--primary)] text-black rounded-lg font-semibold hover:opacity-90"
                            >
                                Add
                            </button>
                        </div>

                        {recipients.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {recipients.map((email) => (
                                    <span
                                        key={email}
                                        className="bg-[var(--primary)]/20 border border-[var(--primary)]/50 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                    >
                                        {email}
                                        <button onClick={() => removeRecipient(email)} className="text-red-400 hover:text-red-300">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-[var(--foreground-muted)] mt-3">
                            Recipients will get instant access. Others will need approval.
                        </p>
                    </div>

                    {/* Progress */}
                    {uploading && (
                        <div className="glass-card p-4 mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                <span>Encrypting & uploading...</span>
                                <span className="ml-auto font-bold text-[var(--primary)]">{uploadProgress}%</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--primary)] transition-all"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSubmit}
                            disabled={!file || uploading}
                            className="flex-1 py-4 rounded-lg font-bold text-lg bg-[var(--primary)] text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 transition"
                        >
                            {uploading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5" />
                                    Protect & Share
                                </>
                            )}
                        </button>
                        <Link
                            href="/dashboard"
                            className="px-8 py-4 rounded-lg font-semibold border border-gray-700 hover:border-[var(--primary)] transition text-center"
                        >
                            Cancel
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
