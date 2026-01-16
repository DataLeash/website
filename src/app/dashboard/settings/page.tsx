'use client'

import { useAuth, useSettings } from "@/lib/hooks";
import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Sidebar } from "@/components/Sidebar";
import {
    User, Shield, Bell, Settings as SettingsIcon, Ban,
    Copy, Check, Save, Globe, Clock, FileText, Key
} from "lucide-react";

type SettingsTab = 'profile' | 'security' | 'notifications' | 'defaults' | 'blocked';

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

const COUNTRIES = [
    { code: 'CN', name: 'China' },
    { code: 'RU', name: 'Russia' },
    { code: 'IR', name: 'Iran' },
    { code: 'KP', name: 'North Korea' },
    { code: 'SY', name: 'Syria' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'CU', name: 'Cuba' },
];

export default function SettingsPage() {
    const { user } = useAuth();
    const { settings, loading: settingsLoading, saving: apiSaving, saveSettings, updateSetting } = useSettings();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const supabase = createClient();

    // Use database anonymous_id if available, otherwise fallback to computed
    const anonymousId = useMemo(() => {
        if (!user) return 'DL-000000';
        return (user as any).anonymous_id || generateAnonymousIdFallback(user.id);
    }, [user]);

    const copyId = () => {
        navigator.clipboard.writeText(anonymousId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        try {
            await saveSettings(settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);

            // Also update blocked countries in users table directly as backup/legacy support
            if (user?.id) {
                await supabase
                    .from('users')
                    .update({ blocked_countries: settings.blockedCountries })
                    .eq('id', user.id);
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    const toggleCountry = (code: string) => {
        const blocked = settings.blockedCountries || [];
        const newBlocked = blocked.includes(code)
            ? blocked.filter(c => c !== code)
            : [...blocked, code];
        updateSetting('blockedCountries', newBlocked);
    };

    const tabs = [
        { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
        { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
        { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
        { id: 'defaults' as SettingsTab, label: 'File Defaults', icon: FileText },
        { id: 'blocked' as SettingsTab, label: 'Blocked Regions', icon: Ban },
    ];

    if (settingsLoading) {
        return (
            <div className="gradient-bg min-h-screen">
                <Sidebar />
                <main className="md:ml-72 ml-0 p-4 md:p-8 flex items-center justify-center h-screen">
                    <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                </main>
            </div>
        );
    }

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="md:ml-72 ml-0 p-4 md:p-8">
                <div className="max-w-4xl">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center">
                            <SettingsIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
                            <p className="text-sm text-[var(--foreground-muted)]">Configure your security preferences</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition ${activeTab === tab.id
                                    ? 'bg-[var(--primary)] text-black font-medium'
                                    : 'glass-card hover:border-[var(--primary)]'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden md:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="glass-card p-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white">
                                        {user?.full_name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{user?.full_name || 'User'}</h2>
                                        <p className="text-[var(--foreground-muted)]">{user?.email}</p>
                                    </div>
                                </div>

                                {/* Anonymous ID */}
                                <div className="p-4 rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)]">
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
                                                <><Check className="w-4 h-4 text-green-400" /> Copied!</>
                                            ) : (
                                                <><Copy className="w-4 h-4" /> Copy ID</>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-[var(--foreground-muted)] mt-2">
                                        This is your unique identifier shown to viewers. Your real identity stays private.
                                    </p>
                                </div>

                                {/* Account Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-[var(--foreground-muted)] mb-1">Phone</label>
                                        <p className="font-medium">{user?.phone || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[var(--foreground-muted)] mb-1">Joined</label>
                                        <p className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-[var(--primary)]" />
                                    Security Settings
                                </h3>

                                <div className="space-y-4">
                                    <ToggleSetting
                                        label="Two-factor authentication"
                                        description="Require 2FA when logging in"
                                        checked={settings.twoFactor}
                                        onChange={(v) => updateSetting('twoFactor', v)}
                                    />
                                    <ToggleSetting
                                        label="Auto-kill files on threat"
                                        description="Automatically destroy files when a threat is detected"
                                        checked={settings.autoKillOnThreat}
                                        onChange={(v) => updateSetting('autoKillOnThreat', v)}
                                    />
                                    <ToggleSetting
                                        label="Login alerts"
                                        description="Get notified when someone logs into your account"
                                        checked={settings.loginAlerts}
                                        onChange={(v) => updateSetting('loginAlerts', v)}
                                    />

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Session timeout</label>
                                        <select
                                            value={settings.sessionTimeout}
                                            onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                                            className="w-full md:w-48 px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                                        >
                                            <option value={15}>15 minutes</option>
                                            <option value={30}>30 minutes</option>
                                            <option value={60}>1 hour</option>
                                            <option value={120}>2 hours</option>
                                            <option value={0}>Never</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-[var(--primary)]" />
                                    Notification Preferences
                                </h3>

                                <div className="space-y-4">
                                    <ToggleSetting
                                        label="Email notifications"
                                        description="Receive notifications via email"
                                        checked={settings.emailNotifications}
                                        onChange={(v) => updateSetting('emailNotifications', v)}
                                    />
                                    <ToggleSetting
                                        label="Push notifications"
                                        description="Receive browser push notifications"
                                        checked={settings.pushNotifications}
                                        onChange={(v) => updateSetting('pushNotifications', v)}
                                    />
                                    <ToggleSetting
                                        label="Notify on file view"
                                        description="Get notified when someone views your file"
                                        checked={settings.notifyOnView}
                                        onChange={(v) => updateSetting('notifyOnView', v)}
                                    />
                                    <ToggleSetting
                                        label="Notify on threat detection"
                                        description="Get notified when a security threat is detected"
                                        checked={settings.notifyOnThreat}
                                        onChange={(v) => updateSetting('notifyOnThreat', v)}
                                    />
                                    <ToggleSetting
                                        label="Daily digest"
                                        description="Receive a daily summary of all activity"
                                        checked={settings.dailyDigest}
                                        onChange={(v) => updateSetting('dailyDigest', v)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Defaults Tab */}
                        {activeTab === 'defaults' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-[var(--primary)]" />
                                    Default File Settings
                                </h3>
                                <p className="text-sm text-[var(--foreground-muted)]">
                                    These settings will be applied to new files by default
                                </p>

                                <div className="space-y-4">
                                    <ToggleSetting
                                        label="Require NDA by default"
                                        description="Viewers must sign an NDA before accessing"
                                        checked={settings.requireNdaDefault}
                                        onChange={(v) => updateSetting('requireNdaDefault', v)}
                                    />
                                    <ToggleSetting
                                        label="Require approval by default"
                                        description="You must manually approve each access request"
                                        checked={settings.requireApprovalDefault}
                                        onChange={(v) => updateSetting('requireApprovalDefault', v)}
                                    />

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Default expiry</label>
                                        <select
                                            value={settings.defaultExpiry}
                                            onChange={(e) => updateSetting('defaultExpiry', parseInt(e.target.value))}
                                            className="w-full md:w-48 px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                                        >
                                            <option value={0}>Never expires</option>
                                            <option value={1}>1 day</option>
                                            <option value={7}>7 days</option>
                                            <option value={30}>30 days</option>
                                            <option value={90}>90 days</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Default max views</label>
                                        <select
                                            value={settings.defaultMaxViews}
                                            onChange={(e) => updateSetting('defaultMaxViews', parseInt(e.target.value))}
                                            className="w-full md:w-48 px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                                        >
                                            <option value={0}>Unlimited</option>
                                            <option value={1}>1 view</option>
                                            <option value={5}>5 views</option>
                                            <option value={10}>10 views</option>
                                            <option value={25}>25 views</option>
                                            <option value={100}>100 views</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Blocked Regions Tab */}
                        {activeTab === 'blocked' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-[var(--primary)]" />
                                    Blocked Regions
                                </h3>
                                <p className="text-sm text-[var(--foreground-muted)]">
                                    Block access from specific countries. Viewers from these regions will be denied immediately.
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {COUNTRIES.map(country => (
                                        <button
                                            key={country.code}
                                            onClick={() => toggleCountry(country.code)}
                                            className={`p-3 rounded-lg border text-left transition ${settings.blockedCountries?.includes(country.code)
                                                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                                : 'border-[rgba(0,212,255,0.2)] hover:border-[var(--primary)]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {settings.blockedCountries?.includes(country.code) ? (
                                                    <Ban className="w-4 h-4" />
                                                ) : (
                                                    <Globe className="w-4 h-4 text-[var(--foreground-muted)]" />
                                                )}
                                                <span className="font-medium">{country.name}</span>
                                            </div>
                                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                                {country.code}
                                            </p>
                                        </button>
                                    ))}
                                </div>

                                {(settings.blockedCountries?.length || 0) > 0 && (
                                    <p className="text-sm text-[var(--warning)]">
                                        ⚠️ {settings.blockedCountries!.length} region{settings.blockedCountries!.length > 1 ? 's' : ''} blocked
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={apiSaving}
                        className="glow-button w-full mt-6 py-4 rounded-lg font-bold text-black text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {apiSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : saved ? (
                            <>
                                <Check className="w-5 h-5" />
                                Settings Saved!
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}

// Toggle setting component
function ToggleSetting({ label, description, checked, onChange }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="flex items-center justify-between cursor-pointer group">
            <div>
                <p className="font-medium group-hover:text-[var(--primary)] transition">{label}</p>
                <p className="text-sm text-[var(--foreground-muted)]">{description}</p>
            </div>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition ${checked ? 'bg-[var(--primary)]' : 'bg-[rgba(255,255,255,0.2)]'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
                </div>
            </div>
        </label>
    );
}
