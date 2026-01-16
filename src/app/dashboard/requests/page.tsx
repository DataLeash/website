'use client'

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/hooks";
import { Sidebar } from "@/components/Sidebar";
import { Icon3D } from "@/components/Icon3D";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface IpInfo {
    isVpn?: boolean;
    isDatacenter?: boolean;
    riskScore?: number;
    city?: string;
    region?: string;
    country?: string;
    isp?: string;
    org?: string;
    as?: string;
    timezone?: string;
    [key: string]: any;
}

interface Fingerprint {
    browser?: string;
    browserVersion?: string;
    os?: string;
    platform?: string;
    screenResolution?: string;
    colorDepth?: number;
    maxTouchPoints?: number;
    cpuCores?: number;
    deviceMemory?: number;
    webglVendor?: string;
    webglRenderer?: string;
    language?: string;
    connectionType?: string;
    extensionsDetected?: boolean;
    incognitoMode?: boolean;
    timezone?: string;
    canvasDataHash?: string;
    canvasFingerprint?: string;
    webglFingerprint?: { renderHash?: string; unmaskedRenderer?: string };
    audioFingerprint?: { analyserHash?: string; sampleRate?: number };
    fontFingerprint?: { fontHash?: string; fontCount?: number };
    webrtcIps?: string[];
    geolocation?: { mapsUrl?: string };
    batteryLevel?: number;
    batteryCharging?: boolean;
    combinedHash?: string;
    [key: string]: any;
}

interface AccessRequest {
    id: string;
    file_id: string;
    viewer_email: string;
    viewer_name: string;
    ip_address: string;
    device_info: string;
    user_agent: string;
    fingerprint: Fingerprint | null;
    ip_info: IpInfo | null;
    status: 'pending' | 'approved' | 'denied';
    created_at: string;
    files?: {
        original_name: string;
    };
}

// Wrapper component for Suspense
export default function RequestsPage() {
    return (
        <Suspense fallback={
            <div className="gradient-bg min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading requests..." />
            </div>
        }>
            <RequestsPageContent />
        </Suspense>
    );
}

function RequestsPageContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

    // Handle approve/deny from email links
    useEffect(() => {
        const approveId = searchParams.get('approve');
        const denyId = searchParams.get('deny');

        if (approveId) {
            handleResponse(approveId, 'approve');
        } else if (denyId) {
            handleResponse(denyId, 'deny');
        }
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            fetchRequests();
        }
    }, [user]);

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from('access_requests')
            .select(`
                *,
                files(original_name)
            `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setRequests(data);
        }
        setLoading(false);
    };

    const handleResponse = async (requestId: string, action: 'approve' | 'deny') => {
        setProcessing(requestId);

        try {
            const response = await fetch('/api/access/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId,
                    action,
                    userId: user?.id
                })
            });

            if (response.ok) {
                setRequests(prev => prev.map(r =>
                    r.id === requestId
                        ? { ...r, status: action === 'approve' ? 'approved' : 'denied' }
                        : r
                ));
            }
        } catch (error) {
            console.error('Response error:', error);
        }

        setProcessing(null);
    };

    const handleDelete = async (requestId: string) => {
        if (!confirm('Delete this access request?')) return;

        setProcessing(requestId);
        try {
            const { error } = await supabase
                .from('access_requests')
                .delete()
                .eq('id', requestId);

            if (!error) {
                setRequests(prev => prev.filter(r => r.id !== requestId));
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
        setProcessing(null);
    };

    const handleDeleteAll = async () => {
        if (!confirm('Delete ALL access requests? This cannot be undone.')) return;

        setProcessing('all');
        try {
            // Get all file IDs owned by user
            const { data: userFiles } = await supabase
                .from('files')
                .select('id')
                .eq('owner_id', user?.id);

            if (userFiles && userFiles.length > 0) {
                const fileIds = userFiles.map(f => f.id);
                await supabase
                    .from('access_requests')
                    .delete()
                    .in('file_id', fileIds);
            }

            setRequests([]);
        } catch (err) {
            console.error('Delete all error:', err);
        }
        setProcessing(null);
    };

    const handleBlacklist = async (request: AccessRequest) => {
        const reason = prompt(`Reason for blacklisting ${request.viewer_name || request.viewer_email}?`);
        if (reason === null) return; // Cancelled

        setProcessing(request.id);
        try {
            const res = await fetch('/api/blacklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner_id: user?.id,
                    blocked_email: request.viewer_email,
                    blocked_name: request.viewer_name,
                    reason: reason || 'Manually blacklisted from access request',
                    fingerprint: request.fingerprint,
                    ip_address: request.ip_address,
                    ip_info: request.ip_info
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert(`✅ ${request.viewer_name || request.viewer_email} has been blacklisted. Their device fingerprint is saved and they will be blocked from future access.`);
                // Also deny the request
                await handleResponse(request.id, 'deny');
            } else {
                alert(data.error || 'Failed to blacklist');
            }
        } catch (err) {
            console.error('Blacklist error:', err);
            alert('Failed to blacklist');
        }
        setProcessing(null);
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleString();
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const historyRequests = requests.filter(r => r.status !== 'pending');

    const DeviceInfoPanel = ({ request }: { request: AccessRequest }) => {
        const fp: Fingerprint = request.fingerprint || {};
        const ipInfo: IpInfo = request.ip_info || {};

        return (
            <div className="mt-4 p-4 bg-[rgba(0,0,0,0.3)] rounded-lg text-sm">
                <h4 className="font-bold mb-3 text-[var(--primary)]">📋 Full Device Information</h4>

                <div className="grid grid-cols-2 gap-4">
                    {/* Network Info */}
                    <div>
                        <h5 className="font-semibold mb-2">🌐 Network</h5>
                        <table className="w-full text-xs">
                            <tbody>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">IP Address:</td><td>{request.ip_address || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">City:</td><td>{ipInfo.city || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">Region:</td><td>{ipInfo.region || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">Country:</td><td>{ipInfo.country || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">ISP:</td><td>{ipInfo.isp || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">Organization:</td><td>{ipInfo.org || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">ASN:</td><td>{ipInfo.as || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">Timezone:</td><td>{ipInfo.timezone || fp.timezone || 'Unknown'}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Security Status */}
                    <div>
                        <h5 className="font-semibold mb-2">🔒 Security Status</h5>
                        <table className="w-full text-xs">
                            <tbody>
                                <tr>
                                    <td className="text-[var(--foreground-muted)] pr-2">VPN/Proxy:</td>
                                    <td className={ipInfo.isVpn ? 'text-[var(--error)]' : 'text-[var(--success)]'}>
                                        {ipInfo.isVpn ? '⚠️ Detected' : '✓ Not Detected'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-[var(--foreground-muted)] pr-2">Datacenter:</td>
                                    <td className={ipInfo.isDatacenter ? 'text-[var(--warning)]' : 'text-[var(--success)]'}>
                                        {ipInfo.isDatacenter ? '⚠️ Yes' : '✓ No'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-[var(--foreground-muted)] pr-2">Extensions:</td>
                                    <td className={fp.extensionsDetected ? 'text-[var(--warning)]' : 'text-[var(--success)]'}>
                                        {fp.extensionsDetected ? '⚠️ Detected' : '✓ None'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-[var(--foreground-muted)] pr-2">Incognito:</td>
                                    <td className={fp.incognitoMode ? 'text-[var(--warning)]' : 'text-[var(--success)]'}>
                                        {fp.incognitoMode ? '⚠️ Yes' : '✓ No'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-[var(--foreground-muted)] pr-2">Risk Score:</td>
                                    <td className={(ipInfo.riskScore || 0) > 50 ? 'text-[var(--error)]' : (ipInfo.riskScore || 0) > 20 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}>
                                        {ipInfo.riskScore || 0}/100
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Browser/Device */}
                    <div>
                        <h5 className="font-semibold mb-2">💻 Browser & Device</h5>
                        <table className="w-full text-xs">
                            <tbody>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">Browser:</td><td>{fp.browser || 'Unknown'} {fp.browserVersion || ''}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">OS:</td><td>{fp.os || request.device_info || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">Platform:</td><td>{fp.platform || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">Screen:</td><td>{fp.screenResolution || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">Color Depth:</td><td>{fp.colorDepth || 'Unknown'} bit</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">Touch Points:</td><td>{fp.maxTouchPoints || 0}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Hardware */}
                    <div>
                        <h5 className="font-semibold mb-2">🖥️ Hardware</h5>
                        <table className="w-full text-xs">
                            <tbody>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">CPU Cores:</td><td>{fp.cpuCores || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">Memory:</td><td>{fp.deviceMemory ? `${fp.deviceMemory} GB` : 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">GPU Vendor:</td><td>{fp.webglVendor || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">GPU Renderer:</td><td className="truncate max-w-[200px]">{fp.webglRenderer || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">Language:</td><td>{fp.language || 'Unknown'}</td></tr>
                                <tr><td className="text-[var(--foreground-muted)] pr-2">Connection:</td><td>{fp.connectionType || 'Unknown'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Advanced Fingerprint Identifiers */}
                <div className="mt-4 pt-4 border-t border-[rgba(0,212,255,0.1)]">
                    <h5 className="font-semibold mb-2">🔑 Fingerprint Identifiers (Holy Trinity)</h5>
                    <div className="text-xs space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[var(--foreground-muted)]">Canvas Hash:</span><br />
                                <code className="bg-[rgba(0,212,255,0.1)] px-2 py-0.5 rounded text-[10px]">{fp.canvasDataHash || fp.canvasFingerprint?.substring(0, 20) || 'N/A'}</code>
                            </div>
                            <div>
                                <span className="text-[var(--foreground-muted)]">WebGL Render Hash:</span><br />
                                <code className="bg-[rgba(0,212,255,0.1)] px-2 py-0.5 rounded text-[10px]">{fp.webglFingerprint?.renderHash || 'N/A'}</code>
                            </div>
                            <div>
                                <span className="text-[var(--foreground-muted)]">Audio Hash:</span><br />
                                <code className="bg-[rgba(0,212,255,0.1)] px-2 py-0.5 rounded text-[10px]">{fp.audioFingerprint?.analyserHash || 'N/A'}</code>
                            </div>
                            <div>
                                <span className="text-[var(--foreground-muted)]">Font Hash:</span><br />
                                <code className="bg-[rgba(0,212,255,0.1)] px-2 py-0.5 rounded text-[10px]">{fp.fontFingerprint?.fontHash || 'N/A'}</code>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-[var(--foreground-muted)]">Combined Unique ID:</span>
                            <code className="bg-[rgba(0,255,150,0.1)] text-[var(--success)] px-2 py-0.5 rounded ml-2">{fp.combinedHash || 'N/A'}</code>
                        </div>
                        {fp.webglFingerprint?.unmaskedRenderer && (
                            <div>
                                <span className="text-[var(--foreground-muted)]">GPU (Unmasked):</span><br />
                                <span className="text-[10px]">{fp.webglFingerprint.unmaskedRenderer}</span>
                            </div>
                        )}
                        {(fp.fontFingerprint?.fontCount || 0) > 0 && (
                            <div>
                                <span className="text-[var(--foreground-muted)]">Fonts Detected:</span> {fp.fontFingerprint?.fontCount} unique fonts
                            </div>
                        )}
                        {(fp.audioFingerprint?.sampleRate || 0) > 0 && (
                            <div>
                                <span className="text-[var(--foreground-muted)]">Audio Sample Rate:</span> {fp.audioFingerprint?.sampleRate}Hz
                            </div>
                        )}
                        {(fp.webrtcIps?.length || 0) > 0 && (
                            <div className="text-[var(--warning)]">
                                <span className="text-[var(--foreground-muted)]">WebRTC IPs (VPN Leak):</span> {fp.webrtcIps?.join(', ')}
                            </div>
                        )}
                        {fp.geolocation?.mapsUrl && (
                            <div>
                                <span className="text-[var(--foreground-muted)]">📍 Location:</span>
                                <a href={fp.geolocation.mapsUrl} target="_blank" rel="noopener" className="text-[var(--primary)] hover:underline ml-2">
                                    View on Google Maps
                                </a>
                            </div>
                        )}
                        {fp.batteryLevel !== undefined && (
                            <div>
                                <span className="text-[var(--foreground-muted)]">🔋 Battery:</span> {fp.batteryLevel}% {fp.batteryCharging ? '(Charging)' : ''}
                            </div>
                        )}
                    </div>
                </div>

                {/* User Agent */}
                <div className="mt-4 pt-4 border-t border-[rgba(0,212,255,0.1)]">
                    <h5 className="font-semibold mb-2">📝 Full User Agent</h5>
                    <p className="text-xs text-[var(--foreground-muted)] break-all">{request.user_agent || 'Unknown'}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Access Requests</h1>
                        <p className="text-[var(--foreground-muted)]">Approve or deny file access requests with full device info</p>
                    </div>
                    {requests.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            disabled={processing === 'all'}
                            className="px-4 py-2 bg-[rgba(239,68,68,0.1)] text-[var(--error)] rounded-lg hover:bg-[rgba(239,68,68,0.2)] disabled:opacity-50"
                        >
                            {processing === 'all' ? 'Deleting...' : '🗑️ Clear All'}
                        </button>
                    )}
                </div>

                {/* Pending Requests */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                        Pending Requests ({pendingRequests.length})
                    </h2>

                    {loading ? (
                        <div className="text-[var(--foreground-muted)]">Loading...</div>
                    ) : pendingRequests.length === 0 ? (
                        <div className="glass-card p-6 text-center text-[var(--foreground-muted)]">
                            No pending requests
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingRequests.map(request => (
                                <div key={request.id} className="glass-card p-6 border-l-4 border-yellow-500">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg">{request.viewer_name}</h3>
                                            <p className="text-sm text-[var(--foreground-muted)]">{request.viewer_email}</p>
                                            <p className="text-sm mt-2">
                                                Requesting access to: <span className="text-[var(--primary)]">{request.files?.original_name}</span>
                                            </p>
                                            <div className="mt-3 grid grid-cols-4 gap-4 text-xs">
                                                <div>
                                                    <span className="text-[var(--foreground-muted)]">IP:</span><br />
                                                    <span>{request.ip_address || 'Unknown'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[var(--foreground-muted)]">Device:</span><br />
                                                    <span>{request.device_info || 'Unknown'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[var(--foreground-muted)]">VPN:</span><br />
                                                    <span className={request.ip_info?.isVpn ? 'text-[var(--error)]' : 'text-[var(--success)]'}>
                                                        {request.ip_info?.isVpn ? '⚠️ Yes' : '✓ No'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[var(--foreground-muted)]">Requested:</span><br />
                                                    <span>{formatDate(request.created_at)}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                                                className="mt-3 text-xs text-[var(--primary)] hover:underline"
                                            >
                                                {expandedRequest === request.id ? '▼ Hide Details' : '▶ Show Full Device Info'}
                                            </button>

                                            {expandedRequest === request.id && <DeviceInfoPanel request={request} />}
                                        </div>
                                        <div className="flex flex-col gap-2 ml-4">
                                            <button
                                                onClick={() => handleResponse(request.id, 'approve')}
                                                disabled={processing === request.id}
                                                className="px-6 py-3 bg-[var(--success)] text-white rounded-lg font-semibold hover:opacity-80 disabled:opacity-50"
                                            >
                                                {processing === request.id ? '...' : '✓ Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleResponse(request.id, 'deny')}
                                                disabled={processing === request.id}
                                                className="px-6 py-3 bg-[var(--error)] text-white rounded-lg font-semibold hover:opacity-80 disabled:opacity-50"
                                            >
                                                {processing === request.id ? '...' : '✗ Deny'}
                                            </button>
                                            <button
                                                onClick={() => handleBlacklist(request)}
                                                disabled={processing === request.id}
                                                className="px-6 py-3 bg-[rgba(255,50,50,0.2)] border-2 border-[var(--error)] text-[var(--error)] rounded-lg font-semibold hover:bg-[rgba(255,50,50,0.3)] disabled:opacity-50"
                                                title="Block this device from all future access"
                                            >
                                                {processing === request.id ? '...' : '🚫 Blacklist'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Request History */}
                <div>
                    <h2 className="text-xl font-bold mb-4">Request History ({historyRequests.length})</h2>

                    {historyRequests.length === 0 ? (
                        <div className="glass-card p-6 text-center text-[var(--foreground-muted)]">
                            No previous requests
                        </div>
                    ) : (
                        <div className="glass-card overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-[rgba(0,212,255,0.1)]">
                                    <tr>
                                        <th className="text-left px-6 py-3">Requester</th>
                                        <th className="text-left px-6 py-3">File</th>
                                        <th className="text-left px-6 py-3">IP / Device</th>
                                        <th className="text-left px-6 py-3">Date</th>
                                        <th className="text-left px-6 py-3">Status</th>
                                        <th className="text-right px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyRequests.map(request => (
                                        <tr key={request.id} className="border-t border-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.03)]">
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{request.viewer_name}</div>
                                                <div className="text-xs text-[var(--foreground-muted)]">{request.viewer_email}</div>
                                            </td>
                                            <td className="px-6 py-4">{request.files?.original_name}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div>{request.ip_address || 'Unknown'}</div>
                                                <div className="text-xs text-[var(--foreground-muted)]">{request.device_info}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">{formatDate(request.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${request.status === 'approved'
                                                    ? 'bg-[rgba(34,197,94,0.2)] text-[var(--success)]'
                                                    : 'bg-[rgba(239,68,68,0.2)] text-[var(--error)]'
                                                    }`}>
                                                    {request.status === 'approved' ? '✓ Approved' : '✗ Denied'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                {request.status === 'approved' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Revoke access for ${request.viewer_name}? They will be kicked out immediately.`)) {
                                                                handleResponse(request.id, 'deny');
                                                            }
                                                        }}
                                                        disabled={processing === request.id}
                                                        className="px-3 py-1 text-sm bg-[rgba(239,68,68,0.1)] text-[var(--error)] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.2)] rounded disabled:opacity-50"
                                                    >
                                                        {processing === request.id ? '...' : '🚫 Revoke'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleBlacklist(request)}
                                                    disabled={processing === request.id}
                                                    className="px-3 py-1 text-sm text-[var(--error)] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.1)] rounded disabled:opacity-50"
                                                    title="Blacklist & Block Device"
                                                >
                                                    {processing === request.id ? '...' : '🚫'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(request.id)}
                                                    disabled={processing === request.id}
                                                    className="px-3 py-1 text-sm text-[var(--foreground-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded disabled:opacity-50"
                                                    title="Remove from history"
                                                >
                                                    {processing === request.id ? '...' : '🗑️'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
