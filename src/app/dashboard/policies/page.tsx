'use client'

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Sidebar } from "@/components/Sidebar";
import {
    Shield, Plus, Trash2, Clock, Globe, Users, Key, FileText,
    ChevronDown, ChevronRight, Save, X, AlertTriangle
} from "lucide-react";

interface AccessPolicy {
    id: string;
    name: string;
    description: string;
    rules: PolicyRule[];
    isDefault: boolean;
    createdAt: string;
}

interface PolicyConfig {
    days?: number;
    max?: number;
    startHour?: number;
    endHour?: number;
    countries?: string[];
    [key: string]: any;
}

interface PolicyRule {
    type: 'time' | 'geo' | 'device' | 'nda' | 'approval' | 'expiry' | 'views';
    enabled: boolean;
    config: PolicyConfig;
}

const DEFAULT_POLICIES: AccessPolicy[] = [
    {
        id: 'quick-share',
        name: 'Quick Share',
        description: 'Fast sharing with minimal friction. Link only, 24h expiry.',
        isDefault: true,
        createdAt: '',
        rules: [
            { type: 'approval', enabled: false, config: {} },
            { type: 'nda', enabled: false, config: {} },
            { type: 'expiry', enabled: true, config: { days: 1 } },
        ]
    },
    {
        id: 'secure-share',
        name: 'Secure Share',
        description: 'Email + OTP verification with your approval required.',
        isDefault: true,
        createdAt: '',
        rules: [
            { type: 'approval', enabled: true, config: {} },
            { type: 'nda', enabled: false, config: {} },
            { type: 'expiry', enabled: true, config: { days: 7 } },
        ]
    },
    {
        id: 'nda-share',
        name: 'NDA Share',
        description: 'Full protection: NDA + Approval + Tracking.',
        isDefault: true,
        createdAt: '',
        rules: [
            { type: 'approval', enabled: true, config: {} },
            { type: 'nda', enabled: true, config: {} },
            { type: 'expiry', enabled: true, config: { days: 30 } },
            { type: 'views', enabled: true, config: { max: 10 } },
        ]
    },
];

export default function AccessPoliciesPage() {
    const [policies, setPolicies] = useState<AccessPolicy[]>(DEFAULT_POLICIES);
    const [customPolicies, setCustomPolicies] = useState<AccessPolicy[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    // Load custom policies from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('dataleash_policies');
        if (saved) {
            setCustomPolicies(JSON.parse(saved));
        }
    }, []);

    const saveCustomPolicies = (updated: AccessPolicy[]) => {
        setCustomPolicies(updated);
        localStorage.setItem('dataleash_policies', JSON.stringify(updated));
    };

    const handleDeletePolicy = (id: string) => {
        if (confirm('Delete this policy?')) {
            saveCustomPolicies(customPolicies.filter(p => p.id !== id));
        }
    };

    const allPolicies = [...policies, ...customPolicies];

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="md:ml-72 ml-0 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Access Policies</h1>
                            <p className="text-sm text-[var(--foreground-muted)]">
                                Pre-configured sharing templates
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="glow-button px-4 py-2.5 rounded-lg font-semibold text-black flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Policy
                    </button>
                </div>

                {/* Info Banner */}
                <div className="glass-card p-4 mb-6 flex items-start gap-3 bg-[rgba(0,212,255,0.05)]">
                    <AlertTriangle className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm">
                            Access policies define the default security settings when sharing files.
                            Select a policy during upload to quickly apply these rules.
                        </p>
                    </div>
                </div>

                {/* Built-in Policies */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Key className="w-5 h-5 text-[var(--primary)]" />
                        Built-in Policies
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {policies.map(policy => (
                            <PolicyCard
                                key={policy.id}
                                policy={policy}
                                isExpanded={expandedPolicy === policy.id}
                                onToggle={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Custom Policies */}
                <div>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[var(--primary)]" />
                        Custom Policies
                    </h2>
                    {customPolicies.length === 0 ? (
                        <div className="glass-card p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                                <Shield className="w-8 h-8 text-violet-400" />
                            </div>
                            <p className="text-[var(--foreground-muted)]">No custom policies yet</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="text-[var(--primary)] hover:underline mt-2"
                            >
                                Create your first policy →
                            </button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-4">
                            {customPolicies.map(policy => (
                                <PolicyCard
                                    key={policy.id}
                                    policy={policy}
                                    isExpanded={expandedPolicy === policy.id}
                                    onToggle={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                                    onDelete={() => handleDeletePolicy(policy.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create Policy Modal */}
            {showCreateModal && (
                <CreatePolicyModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={(policy) => {
                        saveCustomPolicies([...customPolicies, policy]);
                        setShowCreateModal(false);
                    }}
                />
            )}
        </div>
    );
}

// Policy Card Component
function PolicyCard({ policy, isExpanded, onToggle, onDelete }: {
    policy: AccessPolicy;
    isExpanded: boolean;
    onToggle: () => void;
    onDelete?: () => void;
}) {
    const getRuleIcon = (type: string) => {
        switch (type) {
            case 'time': return <Clock className="w-4 h-4" />;
            case 'geo': return <Globe className="w-4 h-4" />;
            case 'device': return <Users className="w-4 h-4" />;
            case 'nda': return <FileText className="w-4 h-4" />;
            case 'approval': return <Shield className="w-4 h-4" />;
            case 'expiry': return <Clock className="w-4 h-4" />;
            case 'views': return <Users className="w-4 h-4" />;
            default: return <Key className="w-4 h-4" />;
        }
    };

    const getRuleLabel = (rule: PolicyRule) => {
        switch (rule.type) {
            case 'approval': return rule.enabled ? 'Requires Approval' : 'No Approval';
            case 'nda': return rule.enabled ? 'Requires NDA' : 'No NDA';
            case 'expiry': return rule.enabled ? `Expires in ${rule.config.days}d` : 'No Expiry';
            case 'views': return rule.enabled ? `Max ${rule.config.max} views` : 'Unlimited Views';
            case 'time': return `${rule.config.startHour}:00 - ${rule.config.endHour}:00`;
            case 'geo': return `${rule.config.countries?.length || 0} countries blocked`;
            default: return rule.type;
        }
    };

    return (
        <div className={`glass-card p-4 transition ${isExpanded ? 'border-[var(--primary)]' : ''}`}>
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-bold">{policy.name}</h3>
                    <p className="text-sm text-[var(--foreground-muted)]">{policy.description}</p>
                </div>
                {policy.isDefault && (
                    <span className="px-2 py-0.5 text-xs bg-[rgba(0,212,255,0.1)] text-[var(--primary)] rounded">
                        Built-in
                    </span>
                )}
            </div>

            {/* Rules Summary */}
            <div className="flex flex-wrap gap-2 mb-3">
                {policy.rules.filter(r => r.enabled).map((rule, i) => (
                    <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[rgba(255,255,255,0.05)] rounded"
                    >
                        {getRuleIcon(rule.type)}
                        {getRuleLabel(rule)}
                    </span>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[rgba(0,212,255,0.1)]">
                <button
                    onClick={onToggle}
                    className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {isExpanded ? 'Less' : 'Details'}
                </button>
                {onDelete && !policy.isDefault && (
                    <button
                        onClick={onDelete}
                        className="text-sm text-[var(--error)] hover:underline flex items-center gap-1"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                )}
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[rgba(0,212,255,0.1)] space-y-2">
                    {policy.rules.map((rule, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-[var(--foreground-muted)]">
                                {getRuleIcon(rule.type)}
                                {rule.type.charAt(0).toUpperCase() + rule.type.slice(1)}
                            </span>
                            <span className={rule.enabled ? 'text-[var(--success)]' : 'text-[var(--foreground-muted)]'}>
                                {getRuleLabel(rule)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Create Policy Modal
function CreatePolicyModal({ onClose, onCreate }: {
    onClose: () => void;
    onCreate: (policy: AccessPolicy) => void;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [rules, setRules] = useState<PolicyRule[]>([
        { type: 'approval', enabled: true, config: {} },
        { type: 'nda', enabled: false, config: {} },
        { type: 'expiry', enabled: true, config: { days: 7 } },
        { type: 'views', enabled: false, config: { max: 10 } },
    ]);

    const handleCreate = () => {
        if (!name.trim()) return;

        onCreate({
            id: `custom-${Date.now()}`,
            name: name.trim(),
            description: description.trim() || 'Custom policy',
            rules,
            isDefault: false,
            createdAt: new Date().toISOString(),
        });
    };

    const toggleRule = (type: string) => {
        setRules(prev => prev.map(r =>
            r.type === type ? { ...r, enabled: !r.enabled } : r
        ));
    };

    const updateRuleConfig = (type: string, config: Partial<PolicyConfig>) => {
        setRules(prev => prev.map(r =>
            r.type === type ? { ...r, config: { ...r.config, ...config } } : r
        ));
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[var(--primary)]" />
                        Create Access Policy
                    </h2>
                    <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Name & Description */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Policy Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Client Documents"
                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this policy"
                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                        />
                    </div>
                </div>

                {/* Rules */}
                <div className="space-y-4 mb-6">
                    <h3 className="text-sm font-bold text-[var(--foreground-muted)]">RULES</h3>

                    {/* Approval */}
                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.1)] transition">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-[var(--primary)]" />
                            <span>Require Approval</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={rules.find(r => r.type === 'approval')?.enabled}
                            onChange={() => toggleRule('approval')}
                            className="w-5 h-5"
                        />
                    </label>

                    {/* NDA */}
                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.1)] transition">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-[var(--primary)]" />
                            <span>Require NDA</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={rules.find(r => r.type === 'nda')?.enabled}
                            onChange={() => toggleRule('nda')}
                            className="w-5 h-5"
                        />
                    </label>

                    {/* Expiry */}
                    <div className="p-3 rounded-lg bg-[rgba(0,212,255,0.05)]">
                        <label className="flex items-center justify-between cursor-pointer mb-2">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-[var(--primary)]" />
                                <span>Auto Expire</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={rules.find(r => r.type === 'expiry')?.enabled}
                                onChange={() => toggleRule('expiry')}
                                className="w-5 h-5"
                            />
                        </label>
                        {rules.find(r => r.type === 'expiry')?.enabled && (
                            <select
                                value={rules.find(r => r.type === 'expiry')?.config.days || 7}
                                onChange={(e) => updateRuleConfig('expiry', { days: parseInt(e.target.value) })}
                                className="w-full mt-2 px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)]"
                            >
                                <option value={1}>1 day</option>
                                <option value={7}>7 days</option>
                                <option value={14}>14 days</option>
                                <option value={30}>30 days</option>
                                <option value={90}>90 days</option>
                            </select>
                        )}
                    </div>

                    {/* Max Views */}
                    <div className="p-3 rounded-lg bg-[rgba(0,212,255,0.05)]">
                        <label className="flex items-center justify-between cursor-pointer mb-2">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-[var(--primary)]" />
                                <span>Limit Views</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={rules.find(r => r.type === 'views')?.enabled}
                                onChange={() => toggleRule('views')}
                                className="w-5 h-5"
                            />
                        </label>
                        {rules.find(r => r.type === 'views')?.enabled && (
                            <select
                                value={rules.find(r => r.type === 'views')?.config.max || 10}
                                onChange={(e) => updateRuleConfig('views', { max: parseInt(e.target.value) })}
                                className="w-full mt-2 px-3 py-2 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)]"
                            >
                                <option value={1}>1 view</option>
                                <option value={5}>5 views</option>
                                <option value={10}>10 views</option>
                                <option value={25}>25 views</option>
                                <option value={50}>50 views</option>
                            </select>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-lg border border-[rgba(0,212,255,0.2)] hover:border-[var(--primary)] transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim()}
                        className="flex-1 glow-button py-3 rounded-lg font-semibold text-black disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Create Policy
                    </button>
                </div>
            </div>
        </div>
    );
}
