'use client'

import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth, useFiles } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";
import { createClient } from "@/lib/supabase-browser";

export default function UploadPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { uploadFile } = useFiles();

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [recipients, setRecipients] = useState<string[]>([]);
    const [recipientEmail, setRecipientEmail] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // Contacts state
    const [contacts, setContacts] = useState<{ email: string; name: string }[]>([]);
    const [showContacts, setShowContacts] = useState(false);

    useEffect(() => {
        const fetchContacts = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('contacts')
                    .select('contact_email, contact_name')
                    .order('contact_name');

                if (data) {
                    setContacts(data.map(c => ({ email: c.contact_email, name: c.contact_name || c.contact_email })));
                }
            }
        };
        fetchContacts();
    }, []);

    const [settings, setSettings] = useState({
        lockdown_level: 1,
        trust_level: 1,
        expires_at: null as string | null,
        max_views: null as number | null,
        require_nda: false,
        require_facial: false,
        allow_comments: true,
        notify_on_view: true,
        auto_kill_on_screenshot: false,
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
        if (droppedFile) {
            setFile(droppedFile);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const addRecipient = () => {
        if (recipientEmail && !recipients.includes(recipientEmail)) {
            setRecipients([...recipients, recipientEmail]);
            setRecipientEmail('');
        }
    };

    const removeRecipient = (email: string) => {
        setRecipients(recipients.filter(r => r !== email));
    };

    const handleSubmit = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setError('');
        setUploading(true);

        try {
            const result = await uploadFile(file, settings, recipients);

            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(`File protected successfully! Share link: ${result.share_link}`);
                setTimeout(() => router.push('/dashboard'), 2000);
            }
        } catch (err) {
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
                <div className="max-w-3xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Upload Protected File</h1>
                        <p className="text-[var(--foreground-muted)]">Convert any file into a secure .dlx container</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-[rgba(239,68,68,0.1)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-[rgba(16,185,129,0.1)] border border-[var(--success)] text-[var(--success)] px-4 py-3 rounded-lg">
                            {success}
                        </div>
                    )}

                    {/* Upload Zone */}
                    <div className="glass-card p-8 mb-8">
                        <div
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition cursor-pointer ${isDragging
                                ? 'border-[var(--primary)] bg-[rgba(0,212,255,0.1)]'
                                : 'border-[var(--primary)] hover:bg-[rgba(0,212,255,0.05)]'
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
                                    <div className="mb-4 flex justify-center">
                                        <Icon3D type="file" size="xl" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{file.name}</h3>
                                    <p className="text-[var(--foreground-muted)] mb-4">{formatFileSize(file.size)}</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                        className="text-[var(--error)] text-sm hover:underline"
                                    >
                                        Remove file
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="mb-4 flex justify-center">
                                        <Icon3D type="upload" size="xl" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Drag & Drop Files Here</h3>
                                    <p className="text-[var(--foreground-muted)] mb-4">or click to browse</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">
                                        Supports: PDF, DOC, XLS, PPT, Images, Videos (Max 100MB)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Protection Settings */}
                    <div className="glass-card p-6 mb-8">
                        <h2 className="text-xl font-bold mb-6">Protection Settings</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-3">Lockdown Level</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[
                                        { level: 0, name: "Relaxed", desc: "Basic" },
                                        { level: 1, name: "Standard", desc: "Block capture" },
                                        { level: 2, name: "Strict", desc: "Close apps" },
                                        { level: 3, name: "Kiosk", desc: "Viewer only" },
                                        { level: 4, name: "Paranoid", desc: "Max lock" },
                                    ].map((option) => (
                                        <button
                                            key={option.level}
                                            type="button"
                                            onClick={() => setSettings({ ...settings, lockdown_level: option.level })}
                                            className={`p-3 rounded-lg text-center text-sm transition ${settings.lockdown_level === option.level
                                                ? "bg-[var(--primary)] text-black font-semibold"
                                                : "bg-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.2)]"
                                                }`}
                                        >
                                            <div className="font-medium">{option.name}</div>
                                            <div className="text-xs opacity-70">{option.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Expires After</label>
                                    <select
                                        value={settings.expires_at || ''}
                                        onChange={(e) => setSettings({ ...settings, expires_at: e.target.value || null })}
                                        className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                                    >
                                        <option value="">Never</option>
                                        <option value="1d">1 day</option>
                                        <option value="7d">7 days</option>
                                        <option value="30d">30 days</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Max Views</label>
                                    <select
                                        value={settings.max_views || ''}
                                        onChange={(e) => setSettings({ ...settings, max_views: e.target.value ? parseInt(e.target.value) : null })}
                                        className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                                    >
                                        <option value="">Unlimited</option>
                                        <option value="1">1 view</option>
                                        <option value="5">5 views</option>
                                        <option value="10">10 views</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { key: 'require_nda', label: "Require NDA signature before viewing" },
                                    { key: 'require_facial', label: "Require facial verification on each open" },
                                    { key: 'allow_comments', label: "Allow comments and annotations" },
                                    { key: 'notify_on_view', label: "Notify me on every view" },
                                    { key: 'auto_kill_on_screenshot', label: "Auto-kill on screenshot attempt" },
                                ].map((toggle) => (
                                    <label key={toggle.key} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings[toggle.key as keyof typeof settings] as boolean}
                                            onChange={(e) => setSettings({ ...settings, [toggle.key]: e.target.checked })}
                                            className="w-5 h-5 rounded border-[var(--primary)] bg-transparent text-[var(--primary)]"
                                        />
                                        <span>{toggle.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recipients */}
                    <div className="glass-card p-6 mb-8">
                        <h2 className="text-xl font-bold mb-4">Recipients</h2>
                        <div className="flex gap-2 mb-4 relative">
                            <input
                                type="email"
                                placeholder="Add email address..."
                                value={recipientEmail}
                                onChange={(e) => {
                                    setRecipientEmail(e.target.value);
                                    setShowContacts(true);
                                }}
                                onFocus={() => setShowContacts(true)}
                                onBlur={() => setTimeout(() => setShowContacts(false), 200)}
                                onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
                                className="flex-1 px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                            />
                            {showContacts && contacts.length > 0 && (
                                <div className="absolute top-full left-0 right-[100px] mt-2 bg-[var(--background-light)] border border-[rgba(0,212,255,0.2)] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                    {contacts
                                        .filter(c => c.email.toLowerCase().includes(recipientEmail.toLowerCase()) && !recipients.includes(c.email))
                                        .map((contact) => (
                                            <button
                                                key={contact.email}
                                                onClick={() => {
                                                    setRecipients([...recipients, contact.email]);
                                                    setRecipientEmail('');
                                                    setShowContacts(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-[rgba(0,212,255,0.1)] flex flex-col"
                                            >
                                                <span className="font-semibold text-sm">{contact.name}</span>
                                                <span className="text-xs text-[var(--foreground-muted)]">{contact.email}</span>
                                            </button>
                                        ))}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={addRecipient}
                                className="glow-button px-6 py-3 rounded-lg font-semibold text-black"
                            >
                                Add
                            </button>
                        </div>

                        {recipients.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {recipients.map((email) => (
                                    <span
                                        key={email}
                                        className="bg-[rgba(0,212,255,0.1)] border border-[var(--primary)] px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                    >
                                        {email}
                                        <button
                                            onClick={() => removeRecipient(email)}
                                            className="text-[var(--error)] hover:text-white"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <p className="text-xs text-[var(--foreground-muted)] mt-2">
                            Recipients will receive an email with instructions to download the viewer
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSubmit}
                            disabled={!file || uploading}
                            className="glow-button flex-1 py-4 rounded-lg font-bold text-black text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                    Encrypting & Uploading...
                                </>
                            ) : (
                                <>
                                    <Icon3D type="lock" size="sm" />
                                    Create Protected File
                                </>
                            )}
                        </button>
                        <Link href="/dashboard" className="glass-card px-8 py-4 rounded-lg font-semibold hover:border-[var(--primary)] transition text-center">
                            Cancel
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
