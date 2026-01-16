'use client'

import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth, useFiles } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";
import { createClient } from "@/lib/supabase-browser";
import {
    Shield, Lock, Globe, Eye, Clock, Users, AlertTriangle,
    Key, Fingerprint, Mail, Phone, FileText, Copy, Printer,
    Download, Zap, Bell, ChevronDown, ChevronUp, X, Plus, Check
} from "lucide-react";

// Country list for geo-blocking
const COUNTRIES = [
    { code: 'CN', name: 'China' },
    { code: 'RU', name: 'Russia' },
    { code: 'KP', name: 'North Korea' },
    { code: 'IR', name: 'Iran' },
    { code: 'SY', name: 'Syria' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'IN', name: 'India' },
    { code: 'BD', name: 'Bangladesh' },
];

export default function UploadPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { uploadFile } = useFiles();

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [recipients, setRecipients] = useState<string[]>([]);
    const [recipientEmail, setRecipientEmail] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // UI State
    const [expandedSection, setExpandedSection] = useState<string | null>('access');
    const [contacts, setContacts] = useState<{ email: string; name: string }[]>([]);
    const [showContacts, setShowContacts] = useState(false);
    const [newIP, setNewIP] = useState('');
    const [newDomain, setNewDomain] = useState('');

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

    // Comprehensive settings
    const [settings, setSettings] = useState({
        // Protection Level
        lockdown_level: 2,
        trust_level: 1,

        // Expiration
        expires_at: null as string | null,
        max_views: null as number | null,

        // Access Control
        blocked_countries: [] as string[],
        allowed_ips: [] as string[],
        blocked_ips: [] as string[],
        allowed_domains: [] as string[],
        device_limit: 3,
        require_vpn_block: true,

        // Viewer Verification
        require_nda: false,
        require_facial: false,
        require_email_otp: false,
        require_phone_verify: false,
        require_password: false,
        file_password: '',

        // Document Protection
        add_watermark: true,
        watermark_text: '',
        block_copy_paste: true,
        block_printing: true,
        block_download: true,
        blur_on_inactive: false,

        // Monitoring
        notify_on_view: true,
        track_scroll_depth: false,
        track_time_per_page: false,
        alert_on_screenshot: true,
        log_all_actions: true,

        // Self-Destruct
        auto_kill_on_screenshot: false,
        self_destruct_after_read: false,
        destroy_on_forward: false,
        destroy_on_leak_detected: true,
        dead_man_switch: false,
        dead_man_hours: 72,
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

    const toggleCountry = (code: string) => {
        if (settings.blocked_countries.includes(code)) {
            setSettings({ ...settings, blocked_countries: settings.blocked_countries.filter(c => c !== code) });
        } else {
            setSettings({ ...settings, blocked_countries: [...settings.blocked_countries, code] });
        }
    };

    const addIP = (type: 'allowed' | 'blocked') => {
        if (newIP && /^(?:\d{1,3}\.){3}\d{1,3}$/.test(newIP)) {
            if (type === 'allowed') {
                setSettings({ ...settings, allowed_ips: [...settings.allowed_ips, newIP] });
            } else {
                setSettings({ ...settings, blocked_ips: [...settings.blocked_ips, newIP] });
            }
            setNewIP('');
        }
    };

    const addDomain = () => {
        if (newDomain && !settings.allowed_domains.includes(newDomain)) {
            setSettings({ ...settings, allowed_domains: [...settings.allowed_domains, newDomain] });
            setNewDomain('');
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        // Validate password if required
        if (settings.require_password && !settings.file_password) {
            setError('Please enter a file password');
            return;
        }

        setError('');
        setUploading(true);
        setUploadProgress(0);

        // Simulate progress for UX
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 5, 90));
        }, 200);

        try {
            const result = await uploadFile(file, settings, recipients);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(`File protected successfully! Share link: ${result.share_link}`);
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

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Apply presets
    const applyPreset = (preset: 'relaxed' | 'standard' | 'strict' | 'paranoid') => {
        const presets = {
            relaxed: {
                lockdown_level: 0, require_vpn_block: false, block_copy_paste: false,
                block_printing: false, add_watermark: false, require_email_otp: false,
                alert_on_screenshot: false, auto_kill_on_screenshot: false,
            },
            standard: {
                lockdown_level: 1, require_vpn_block: true, block_copy_paste: true,
                block_printing: true, add_watermark: true, require_email_otp: false,
                alert_on_screenshot: true, auto_kill_on_screenshot: false,
            },
            strict: {
                lockdown_level: 2, require_vpn_block: true, block_copy_paste: true,
                block_printing: true, add_watermark: true, require_email_otp: true,
                alert_on_screenshot: true, auto_kill_on_screenshot: true,
            },
            paranoid: {
                lockdown_level: 4, require_vpn_block: true, block_copy_paste: true,
                block_printing: true, add_watermark: true, require_email_otp: true,
                require_facial: true, alert_on_screenshot: true, auto_kill_on_screenshot: true,
                blur_on_inactive: true, destroy_on_leak_detected: true,
            },
        };
        setSettings({ ...settings, ...presets[preset] });
    };

    const SectionHeader = ({ title, icon: Icon, section, badge }: { title: string, icon: any, section: string, badge?: number }) => (
        <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between p-4 hover:bg-[rgba(0,212,255,0.05)] transition rounded-lg"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-blue-500 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-black" />
                </div>
                <span className="font-semibold">{title}</span>
                {badge !== undefined && badge > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-[var(--primary)] text-black rounded-full font-bold">{badge}</span>
                )}
            </div>
            {expandedSection === section ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
    );

    const Toggle = ({ checked, onChange, label }: { checked: boolean, onChange: (v: boolean) => void, label: string }) => (
        <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm">{label}</span>
            <div
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition ${checked ? 'bg-[var(--primary)]' : 'bg-gray-600'}`}
            >
                <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
        </label>
    );

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                <div className="max-w-4xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Upload Protected File</h1>
                        <p className="text-[var(--foreground-muted)]">Create a secure .dlx container with enterprise-grade protection</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-[rgba(239,68,68,0.1)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-[rgba(16,185,129,0.1)] border border-[var(--success)] text-[var(--success)] px-4 py-3 rounded-lg flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            {success}
                        </div>
                    )}

                    {/* Upload Zone */}
                    <div className="glass-card p-6 mb-6">
                        <div
                            className={`border-2 border-dashed rounded-xl p-10 text-center transition cursor-pointer ${isDragging
                                ? 'border-[var(--primary)] bg-[rgba(0,212,255,0.1)]'
                                : 'border-[var(--primary)]/50 hover:bg-[rgba(0,212,255,0.05)] hover:border-[var(--primary)]'
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
                                    <h3 className="text-xl font-bold mb-1">{file.name}</h3>
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
                                    <p className="text-[var(--foreground-muted)] mb-3">or click to browse</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">
                                        PDF, DOC, XLS, PPT, Images, Videos (Max 100MB)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="glass-card p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-sm">Quick Presets</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { key: 'relaxed', label: 'Relaxed', desc: 'Basic sharing', color: 'from-green-500 to-emerald-500' },
                                { key: 'standard', label: 'Standard', desc: 'Recommended', color: 'from-blue-500 to-cyan-500' },
                                { key: 'strict', label: 'Strict', desc: 'High security', color: 'from-orange-500 to-amber-500' },
                                { key: 'paranoid', label: 'Paranoid', desc: 'Maximum lock', color: 'from-red-500 to-rose-500' },
                            ].map((preset) => (
                                <button
                                    key={preset.key}
                                    onClick={() => applyPreset(preset.key as any)}
                                    className={`p-3 rounded-lg text-center transition hover:scale-105 ${settings.lockdown_level === ['relaxed', 'standard', 'strict', 'paranoid'].indexOf(preset.key as any)
                                        ? `bg-gradient-to-br ${preset.color} text-white`
                                        : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                                        }`}
                                >
                                    <div className="font-semibold text-sm">{preset.label}</div>
                                    <div className="text-xs opacity-70">{preset.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Security Options Accordion */}
                    <div className="glass-card mb-6 divide-y divide-[rgba(255,255,255,0.05)]">
                        {/* Access Control */}
                        <div>
                            <SectionHeader title="Access Control" icon={Globe} section="access" badge={settings.blocked_countries.length} />
                            {expandedSection === 'access' && (
                                <div className="px-4 pb-4 space-y-4">
                                    {/* Geo Blocking */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Block Countries</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COUNTRIES.map((country) => (
                                                <button
                                                    key={country.code}
                                                    onClick={() => toggleCountry(country.code)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm transition ${settings.blocked_countries.includes(country.code)
                                                        ? 'bg-red-500/20 border border-red-500 text-red-400'
                                                        : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                                                        }`}
                                                >
                                                    {country.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* IP Whitelist */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">IP Whitelist</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                placeholder="192.168.1.1"
                                                value={newIP}
                                                onChange={(e) => setNewIP(e.target.value)}
                                                className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none text-sm"
                                            />
                                            <button onClick={() => addIP('allowed')} className="px-4 py-2 bg-[var(--primary)] text-black rounded-lg text-sm font-semibold">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {settings.allowed_ips.map((ip, i) => (
                                                <span key={i} className="px-2 py-1 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded text-xs flex items-center gap-1">
                                                    {ip}
                                                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSettings({ ...settings, allowed_ips: settings.allowed_ips.filter((_, idx) => idx !== i) })} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Domain Restriction */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Allowed Email Domains</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                placeholder="company.com"
                                                value={newDomain}
                                                onChange={(e) => setNewDomain(e.target.value)}
                                                className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none text-sm"
                                            />
                                            <button onClick={addDomain} className="px-4 py-2 bg-[var(--primary)] text-black rounded-lg text-sm font-semibold">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {settings.allowed_domains.map((domain, i) => (
                                                <span key={i} className="px-2 py-1 bg-blue-500/20 border border-blue-500 text-blue-400 rounded text-xs flex items-center gap-1">
                                                    @{domain}
                                                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSettings({ ...settings, allowed_domains: settings.allowed_domains.filter((_, idx) => idx !== i) })} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Device Limit</label>
                                            <select
                                                value={settings.device_limit}
                                                onChange={(e) => setSettings({ ...settings, device_limit: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none text-sm"
                                            >
                                                <option value="1">1 device</option>
                                                <option value="2">2 devices</option>
                                                <option value="3">3 devices</option>
                                                <option value="5">5 devices</option>
                                                <option value="10">10 devices</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <Toggle
                                                checked={settings.require_vpn_block}
                                                onChange={(v) => setSettings({ ...settings, require_vpn_block: v })}
                                                label="Block VPN/Proxy"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Viewer Verification */}
                        <div>
                            <SectionHeader title="Viewer Verification" icon={Fingerprint} section="verify" />
                            {expandedSection === 'verify' && (
                                <div className="px-4 pb-4 space-y-3">
                                    <Toggle checked={settings.require_email_otp} onChange={(v) => setSettings({ ...settings, require_email_otp: v })} label="Require Email OTP" />
                                    <Toggle checked={settings.require_phone_verify} onChange={(v) => setSettings({ ...settings, require_phone_verify: v })} label="Require Phone Verification" />
                                    <Toggle checked={settings.require_nda} onChange={(v) => setSettings({ ...settings, require_nda: v })} label="Require NDA Signature" />
                                    <Toggle checked={settings.require_facial} onChange={(v) => setSettings({ ...settings, require_facial: v })} label="Require Facial Verification" />

                                    <div className="pt-2">
                                        <Toggle checked={settings.require_password} onChange={(v) => setSettings({ ...settings, require_password: v })} label="Password Protected" />
                                        {settings.require_password && (
                                            <input
                                                type="password"
                                                placeholder="Enter file password"
                                                value={settings.file_password}
                                                onChange={(e) => setSettings({ ...settings, file_password: e.target.value })}
                                                className="mt-2 w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none text-sm"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Document Protection */}
                        <div>
                            <SectionHeader title="Document Protection" icon={Shield} section="protect" />
                            {expandedSection === 'protect' && (
                                <div className="px-4 pb-4 space-y-3">
                                    <Toggle checked={settings.add_watermark} onChange={(v) => setSettings({ ...settings, add_watermark: v })} label="Add Watermark (Email/IP)" />
                                    {settings.add_watermark && (
                                        <input
                                            type="text"
                                            placeholder="Custom watermark text (optional)"
                                            value={settings.watermark_text}
                                            onChange={(e) => setSettings({ ...settings, watermark_text: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none text-sm"
                                        />
                                    )}
                                    <Toggle checked={settings.block_copy_paste} onChange={(v) => setSettings({ ...settings, block_copy_paste: v })} label="Block Copy/Paste" />
                                    <Toggle checked={settings.block_printing} onChange={(v) => setSettings({ ...settings, block_printing: v })} label="Block Printing" />
                                    <Toggle checked={settings.block_download} onChange={(v) => setSettings({ ...settings, block_download: v })} label="Block Download" />
                                    <Toggle checked={settings.blur_on_inactive} onChange={(v) => setSettings({ ...settings, blur_on_inactive: v })} label="Blur on Window Inactive" />
                                </div>
                            )}
                        </div>

                        {/* Monitoring & Alerts */}
                        <div>
                            <SectionHeader title="Monitoring & Alerts" icon={Bell} section="monitor" />
                            {expandedSection === 'monitor' && (
                                <div className="px-4 pb-4 space-y-3">
                                    <Toggle checked={settings.notify_on_view} onChange={(v) => setSettings({ ...settings, notify_on_view: v })} label="Notify on Every View" />
                                    <Toggle checked={settings.alert_on_screenshot} onChange={(v) => setSettings({ ...settings, alert_on_screenshot: v })} label="Alert on Screenshot Attempt" />
                                    <Toggle checked={settings.log_all_actions} onChange={(v) => setSettings({ ...settings, log_all_actions: v })} label="Log All Viewer Actions" />
                                    <Toggle checked={settings.track_scroll_depth} onChange={(v) => setSettings({ ...settings, track_scroll_depth: v })} label="Track Reading Progress" />
                                    <Toggle checked={settings.track_time_per_page} onChange={(v) => setSettings({ ...settings, track_time_per_page: v })} label="Track Time per Page" />
                                </div>
                            )}
                        </div>

                        {/* Self-Destruct */}
                        <div>
                            <SectionHeader title="Self-Destruct" icon={Zap} section="destruct" />
                            {expandedSection === 'destruct' && (
                                <div className="px-4 pb-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Expires After</label>
                                            <select
                                                value={settings.expires_at || ''}
                                                onChange={(e) => setSettings({ ...settings, expires_at: e.target.value || null })}
                                                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none text-sm"
                                            >
                                                <option value="">Never</option>
                                                <option value="1h">1 hour</option>
                                                <option value="24h">24 hours</option>
                                                <option value="7d">7 days</option>
                                                <option value="30d">30 days</option>
                                                <option value="90d">90 days</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Max Views</label>
                                            <select
                                                value={settings.max_views || ''}
                                                onChange={(e) => setSettings({ ...settings, max_views: e.target.value ? parseInt(e.target.value) : null })}
                                                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none text-sm"
                                            >
                                                <option value="">Unlimited</option>
                                                <option value="1">1 view</option>
                                                <option value="3">3 views</option>
                                                <option value="5">5 views</option>
                                                <option value="10">10 views</option>
                                                <option value="25">25 views</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Toggle checked={settings.auto_kill_on_screenshot} onChange={(v) => setSettings({ ...settings, auto_kill_on_screenshot: v })} label="Auto-Kill on Screenshot" />
                                        <Toggle checked={settings.self_destruct_after_read} onChange={(v) => setSettings({ ...settings, self_destruct_after_read: v })} label="Self-Destruct After Full Read" />
                                        <Toggle checked={settings.destroy_on_forward} onChange={(v) => setSettings({ ...settings, destroy_on_forward: v })} label="Destroy if Forwarded" />
                                        <Toggle checked={settings.destroy_on_leak_detected} onChange={(v) => setSettings({ ...settings, destroy_on_leak_detected: v })} label="Destroy on Leak Detection" />

                                        <div className="pt-2">
                                            <Toggle checked={settings.dead_man_switch} onChange={(v) => setSettings({ ...settings, dead_man_switch: v })} label="Dead Man's Switch" />
                                            {settings.dead_man_switch && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-xs text-[var(--foreground-muted)]">Destroy if no check-in for</span>
                                                    <select
                                                        value={settings.dead_man_hours}
                                                        onChange={(e) => setSettings({ ...settings, dead_man_hours: parseInt(e.target.value) })}
                                                        className="px-2 py-1 rounded bg-[var(--background)] border border-[rgba(0,212,255,0.2)] text-sm"
                                                    >
                                                        <option value="24">24 hours</option>
                                                        <option value="48">48 hours</option>
                                                        <option value="72">72 hours</option>
                                                        <option value="168">1 week</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recipients */}
                    <div className="glass-card p-6 mb-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-[var(--primary)]" />
                            Recipients
                        </h2>
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
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <p className="text-xs text-[var(--foreground-muted)] mt-3">
                            Recipients will receive an email with a secure link to view the protected file
                        </p>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                        <div className="glass-card p-4 mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                <span className="font-medium">Encrypting & Uploading...</span>
                                <span className="ml-auto text-[var(--primary)] font-bold">{uploadProgress}%</span>
                            </div>
                            <div className="h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[var(--primary)] to-blue-500 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSubmit}
                            disabled={!file || uploading}
                            className="glow-button flex-1 py-4 rounded-lg font-bold text-black text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5" />
                                    Create Protected File
                                </>
                            )}
                        </button>
                        <Link href="/dashboard" className="glass-card px-8 py-4 rounded-lg font-semibold hover:border-[var(--primary)] transition text-center">
                            Cancel
                        </Link>
                    </div>

                    {/* Security Summary */}
                    {file && (
                        <div className="mt-6 glass-card p-4 border border-[var(--primary)]/30">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-5 h-5 text-[var(--primary)]" />
                                <span className="font-semibold">Security Summary</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                    {settings.require_vpn_block ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-gray-500" />}
                                    <span>VPN Blocked</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {settings.add_watermark ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-gray-500" />}
                                    <span>Watermarked</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {settings.block_copy_paste ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-gray-500" />}
                                    <span>Copy Blocked</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {settings.require_email_otp ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-gray-500" />}
                                    <span>Email OTP</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {settings.alert_on_screenshot ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-gray-500" />}
                                    <span>Screenshot Alert</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {settings.auto_kill_on_screenshot ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-gray-500" />}
                                    <span>Auto-Kill</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {settings.blocked_countries.length > 0 ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-gray-500" />}
                                    <span>Geo-Blocked ({settings.blocked_countries.length})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {settings.destroy_on_leak_detected ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-gray-500" />}
                                    <span>Leak Protection</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
