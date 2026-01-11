'use client'

import { useAuth } from "@/lib/hooks";
import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";
import { Copy, Check } from "lucide-react";

// Fallback: Generate anonymous ID client-side if not in database
function generateAnonymousIdFallback(userId: string): string {
    let hash = 0;
    const str = userId + 'dataleash_salt';
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(6, '0');
    return `DL-${hexHash.substring(0, 6)}`;
}

export default function SettingsPage() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        twoFactor: false,
        autoKillOnThreat: true,
        requireNdaDefault: false,
    });

    // Use database anonymous_id if available, otherwise fallback to computed
    const anonymousId = useMemo(() => {
        if ((user as any)?.anonymous_id) {
            return (user as any).anonymous_id;
        }
        return user?.id ? generateAnonymousIdFallback(user.id) : 'DL-000000';
    }, [user]);

    const copyId = () => {
        navigator.clipboard.writeText(anonymousId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        const savedSettings = localStorage.getItem('dataleash_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleSave = async () => {
        setSaving(true);
        localStorage.setItem('dataleash_settings', JSON.stringify(settings));
        await new Promise(r => setTimeout(r, 500));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                <div className="max-w-2xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-[var(--foreground-muted)]">Configure your security preferences</p>
                    </div>

                    {/* Profile Section */}
                    <div className="glass-card p-6 mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Icon3D type="users" size="lg" />
                            <div>
                                <h2 className="text-xl font-bold">{user?.full_name || 'User'}</h2>
                                <p className="text-[var(--foreground-muted)]">{user?.email}</p>
                            </div>
                        </div>

                        {/* Anonymous ID Display */}
                        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--foreground-muted)]">Your Anonymous ID</p>
                                    <p className="text-lg font-mono font-bold text-[var(--primary)]">{anonymousId}</p>
                                </div>
                                <button
                                    onClick={copyId}
                                    className="px-3 py-2 bg-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.2)] rounded-lg flex items-center gap-2 transition"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-400" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy ID
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-[var(--foreground-muted)] mt-2">
                                This is your unique identifier shown to viewers. Your real identity stays private.
                            </p>
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="glass-card p-6 mb-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Icon3D type="bell" size="sm" />
                            Notifications
                        </h3>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span>Email notifications</span>
                                <input
                                    type="checkbox"
                                    checked={settings.emailNotifications}
                                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                    className="w-5 h-5"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span>Push notifications</span>
                                <input
                                    type="checkbox"
                                    checked={settings.pushNotifications}
                                    onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                                    className="w-5 h-5"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="glass-card p-6 mb-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Icon3D type="shield" size="sm" />
                            Security
                        </h3>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span>Two-factor authentication</span>
                                <input
                                    type="checkbox"
                                    checked={settings.twoFactor}
                                    onChange={(e) => setSettings({ ...settings, twoFactor: e.target.checked })}
                                    className="w-5 h-5"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span>Auto-kill files on threat detection</span>
                                <input
                                    type="checkbox"
                                    checked={settings.autoKillOnThreat}
                                    onChange={(e) => setSettings({ ...settings, autoKillOnThreat: e.target.checked })}
                                    className="w-5 h-5"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <span>Require NDA by default</span>
                                <input
                                    type="checkbox"
                                    checked={settings.requireNdaDefault}
                                    onChange={(e) => setSettings({ ...settings, requireNdaDefault: e.target.checked })}
                                    className="w-5 h-5"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="glow-button w-full py-4 rounded-lg font-bold text-black text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : saved ? (
                            'Settings Saved!'
                        ) : (
                            <>
                                <Icon3D type="shield" size="sm" />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}
