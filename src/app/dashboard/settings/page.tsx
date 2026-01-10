'use client'

import { useAuth } from "@/lib/hooks";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";

export default function SettingsPage() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        twoFactor: false,
        autoKillOnThreat: true,
        requireNdaDefault: false,
    });

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
                        <div className="flex items-center gap-4 mb-6">
                            <Icon3D type="users" size="lg" />
                            <div>
                                <h2 className="text-xl font-bold">{user?.full_name || 'User'}</h2>
                                <p className="text-[var(--foreground-muted)]">{user?.email}</p>
                            </div>
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
