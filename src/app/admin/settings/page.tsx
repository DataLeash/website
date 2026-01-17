'use client'

import { useState, useEffect } from 'react'
import {
    Settings, Shield, Users, Bell, Lock,
    Save, AlertTriangle, CheckCircle, RefreshCw,
    Globe, Mail, Database, Server
} from 'lucide-react'

interface SystemSettings {
    // Registration
    allowNewRegistrations: boolean
    requireEmailVerification: boolean
    allowedDomains: string[]

    // Security
    maxLoginAttempts: number
    sessionTimeoutMinutes: number
    requireTwoFactor: boolean

    // Tier Defaults
    defaultTier: 'free' | 'pro' | 'enterprise'
    freeMaxFiles: number
    freeMaxStorage: number

    // Notifications
    adminNotifyOnSignup: boolean
    adminNotifyOnPayment: boolean
    adminNotifyOnThreat: boolean
}

const DEFAULT_SETTINGS: SystemSettings = {
    allowNewRegistrations: true,
    requireEmailVerification: true,
    allowedDomains: [],
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 60,
    requireTwoFactor: false,
    defaultTier: 'free',
    freeMaxFiles: 5,
    freeMaxStorage: 100,
    adminNotifyOnSignup: true,
    adminNotifyOnPayment: true,
    adminNotifyOnThreat: true,
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // In a real implementation, fetch settings from API
        // For now, use defaults
        setLoading(false)
    }, [])

    const handleSave = async () => {
        setSaving(true)
        setError(null)

        try {
            // In a real implementation, save to API
            await new Promise(resolve => setTimeout(resolve, 1000))
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            setError('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
        setSaved(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <Settings className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">System Settings</h1>
                        <p className="text-gray-400">Configure global system behavior</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${saved
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        } disabled:opacity-50`}
                >
                    {saving ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : saved ? (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            Saved
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-red-300">{error}</span>
                </div>
            )}

            {/* Registration Settings */}
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-400" />
                    Registration Settings
                </h2>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-gray-200 font-medium">Allow New Registrations</label>
                            <p className="text-sm text-gray-500">Enable or disable new user signups</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.allowNewRegistrations}
                                onChange={(e) => updateSetting('allowNewRegistrations', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-gray-200 font-medium">Require Email Verification</label>
                            <p className="text-sm text-gray-500">Users must verify email before accessing dashboard</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.requireEmailVerification}
                                onChange={(e) => updateSetting('requireEmailVerification', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-red-400" />
                    Security Settings
                </h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-200 font-medium mb-2">Max Login Attempts</label>
                            <input
                                type="number"
                                value={settings.maxLoginAttempts}
                                onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value) || 5)}
                                className="w-full px-4 py-3 bg-[#050505] border border-gray-800 rounded-lg text-white focus:border-red-500 focus:outline-none"
                                min={1}
                                max={20}
                            />
                            <p className="text-sm text-gray-500 mt-1">Lock account after this many failed attempts</p>
                        </div>

                        <div>
                            <label className="block text-gray-200 font-medium mb-2">Session Timeout (minutes)</label>
                            <input
                                type="number"
                                value={settings.sessionTimeoutMinutes}
                                onChange={(e) => updateSetting('sessionTimeoutMinutes', parseInt(e.target.value) || 60)}
                                className="w-full px-4 py-3 bg-[#050505] border border-gray-800 rounded-lg text-white focus:border-red-500 focus:outline-none"
                                min={5}
                                max={1440}
                            />
                            <p className="text-sm text-gray-500 mt-1">Auto-logout after inactivity</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                        <div>
                            <label className="text-gray-200 font-medium">Require Two-Factor Authentication</label>
                            <p className="text-sm text-gray-500">Force all users to enable 2FA</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.requireTwoFactor}
                                onChange={(e) => updateSetting('requireTwoFactor', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Tier Defaults */}
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Database className="w-5 h-5 text-yellow-400" />
                    Tier Defaults
                </h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-gray-200 font-medium mb-2">Default Tier for New Users</label>
                        <select
                            value={settings.defaultTier}
                            onChange={(e) => updateSetting('defaultTier', e.target.value as 'free' | 'pro' | 'enterprise')}
                            className="w-full px-4 py-3 bg-[#050505] border border-gray-800 rounded-lg text-white focus:border-red-500 focus:outline-none"
                        >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-200 font-medium mb-2">Free Tier Max Files</label>
                            <input
                                type="number"
                                value={settings.freeMaxFiles}
                                onChange={(e) => updateSetting('freeMaxFiles', parseInt(e.target.value) || 5)}
                                className="w-full px-4 py-3 bg-[#050505] border border-gray-800 rounded-lg text-white focus:border-red-500 focus:outline-none"
                                min={1}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-200 font-medium mb-2">Free Tier Max Storage (MB)</label>
                            <input
                                type="number"
                                value={settings.freeMaxStorage}
                                onChange={(e) => updateSetting('freeMaxStorage', parseInt(e.target.value) || 100)}
                                className="w-full px-4 py-3 bg-[#050505] border border-gray-800 rounded-lg text-white focus:border-red-500 focus:outline-none"
                                min={10}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Notifications */}
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Bell className="w-5 h-5 text-green-400" />
                    Admin Notifications
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#050505] rounded-lg border border-gray-800">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-blue-400" />
                            <div>
                                <p className="text-gray-200">New User Signups</p>
                                <p className="text-sm text-gray-500">Notify when a new user registers</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.adminNotifyOnSignup}
                                onChange={(e) => updateSetting('adminNotifyOnSignup', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#050505] rounded-lg border border-gray-800">
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5 text-yellow-400" />
                            <div>
                                <p className="text-gray-200">Payment Events</p>
                                <p className="text-sm text-gray-500">Notify on successful payments</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.adminNotifyOnPayment}
                                onChange={(e) => updateSetting('adminNotifyOnPayment', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#050505] rounded-lg border border-gray-800">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <div>
                                <p className="text-gray-200">Security Threats</p>
                                <p className="text-sm text-gray-500">Notify on detected security threats</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.adminNotifyOnThreat}
                                onChange={(e) => updateSetting('adminNotifyOnThreat', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}
