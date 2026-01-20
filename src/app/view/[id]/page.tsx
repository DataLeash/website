'use client'

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Lock, FileText, AlertTriangle } from "lucide-react";
import { collectDeviceFingerprint } from "@/lib/fingerprint";

interface FileData {
    id: string;
    original_name: string;
    mime_type: string;
    file_size: number;
    created_at: string;
    owner_id: string;
    settings: {
        expires_at?: string;
        require_password?: boolean;
        notify_on_view?: boolean;
    };
    owner?: {
        display_name: string;
    };
}

export default function ViewFilePage() {
    const params = useParams();
    const fileId = params.id as string;
    const supabase = createClient();

    // State
    const [file, setFile] = useState<FileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'auth' | 'request' | 'password' | 'viewing' | 'denied'>('auth');

    // Auth & Access
    const [viewer, setViewer] = useState<{ email: string; name: string } | null>(null);
    const [password, setPassword] = useState('');
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [accessRequestStatus, setAccessRequestStatus] = useState<string>('');

    // Fetch file info
    useEffect(() => {
        const init = async () => {
            try {
                // Get file info
                const res = await fetch(`/api/files/${fileId}/info`);
                if (!res.ok) throw new Error(res.status === 404 ? 'File not found' : 'File unavailable');
                const fileData = await res.json();
                setFile(fileData);

                // Check auth
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setViewer({
                        email: user.email!,
                        name: user.user_metadata?.full_name || user.email?.split('@')[0]
                    });

                    // If user is logged in, check if they can access directly
                    if (fileData.settings?.require_password) {
                        setStep('password');
                    } else {
                        // Try to auto-access (for recipients)
                        checkAccess(user.email!);
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [fileId]);

    const checkAccess = async (email: string) => {
        try {
            const fingerprint = await collectDeviceFingerprint();
            const res = await fetch('/api/access/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileId,
                    viewerEmail: email,
                    viewerName: viewer?.name,
                    fingerprint,
                    checkOnly: true // Just check, don't create request yet
                })
            });

            const data = await res.json();

            if (data.allowed) {
                loadFileContent(email); // Auto-approved! Pass email explicitly to avoid race condition
            } else {
                setStep('request'); // Need to request access
            }
        } catch (e) {
            console.error(e);
            setStep('request');
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/view/${fileId}`)}`;
        await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: callbackUrl }
        });
    };

    const requestAccess = async () => {
        if (!viewer) return;
        setAccessRequestStatus('sending');

        try {
            const fingerprint = await collectDeviceFingerprint();
            const res = await fetch('/api/access/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileId,
                    viewerEmail: viewer.email,
                    viewerName: viewer.name,
                    fingerprint
                })
            });
            const data = await res.json();

            if (data.approved) {
                // Instant approval (recipient)
                loadFileContent(viewer.email);
            } else {
                setAccessRequestStatus('sent');
                // Poll for approval
                const pollInterval = setInterval(async () => {
                    const statusRes = await fetch(`/api/access/request?requestId=${data.requestId}`);
                    const statusData = await statusRes.json();
                    if (statusData.status === 'approved') {
                        clearInterval(pollInterval);
                        loadFileContent(viewer.email);
                    } else if (statusData.status === 'denied') {
                        clearInterval(pollInterval);
                        setStep('denied');
                    }
                }, 3000);
            }
        } catch (e) {
            setError('Failed to request access');
            setAccessRequestStatus('');
        }
    };

    const submitPassword = async () => {
        setLoading(true);
        // Special endpoint that validates password and returns content if valid
        try {
            const res = await fetch(`/api/files/${fileId}/decrypt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, viewerEmail: viewer?.email })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Invalid password');
            }

            const blob = await res.blob();
            setFileContent(URL.createObjectURL(blob));
            setStep('viewing');
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const loadFileContent = async (emailOverride?: string) => {
        setLoading(true);
        const emailToUse = emailOverride || viewer?.email || '';
        try {
            const res = await fetch(`/api/files/${fileId}/decrypt`, {
                headers: { 'x-viewer-email': emailToUse }
            });
            if (!res.ok) throw new Error('Failed to load file');
            const blob = await res.blob();
            setFileContent(URL.createObjectURL(blob));
            setStep('viewing');
        } catch (e) {
            setError('Could not decrypt file');
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // --- RENDER ---

    if (loading) return (
        <div className="min-h-screen gradient-bg flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
        </div>
    );

    if (error || step === 'denied') return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <h1 className="text-xl font-bold mb-2">{error || 'Access Denied'}</h1>
                <p className="text-gray-400 mb-6">You do not have permission to view this file.</p>
                <Link href="/" className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20">Home</Link>
            </div>
        </div>
    );

    // 1. Auth Step
    if (step === 'auth' && !viewer) return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md w-full text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-[var(--primary)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-[var(--primary)]" />
                    </div>
                    <h1 className="text-xl font-bold">{file?.original_name}</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Shared by {file?.owner?.display_name || 'Anonymous'} • {formatSize(file?.file_size || 0)}
                    </p>
                </div>

                <div className="space-y-3">
                    <p className="text-sm text-gray-400 mb-4">Sign in to verify your identity</p>
                    <button onClick={() => handleOAuthLogin('google')} className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition">
                        Continue with Google
                    </button>
                    <button onClick={() => handleOAuthLogin('github')} className="w-full py-3 bg-[#24292e] text-white font-semibold rounded-lg hover:bg-[#2f363d] transition">
                        Continue with GitHub
                    </button>
                </div>
            </div>
        </div>
    );

    // 2. Access Request Step
    if (step === 'request') return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-yellow-500" />
                </div>
                <h1 className="text-xl font-bold mb-2">Request Access</h1>
                <p className="text-gray-400 mb-6 text-sm">
                    This file is protected. Detailed logs of your access will be sent to the owner.
                </p>

                {accessRequestStatus === 'sent' ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg animate-pulse">
                        <p className="text-yellow-400 font-medium">Request Sent</p>
                        <p className="text-xs text-yellow-500/80 mt-1">Waiting for owner approval...</p>
                    </div>
                ) : (
                    <button
                        onClick={requestAccess}
                        disabled={accessRequestStatus === 'sending'}
                        className="w-full glow-button py-3 font-bold rounded-lg text-black"
                    >
                        {accessRequestStatus === 'sending' ? 'Sending...' : 'Request Access'}
                    </button>
                )}
            </div>
        </div>
    );

    // 3. Password Step
    if (step === 'password') return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-xl font-bold mb-6">Password Required</h1>
                <input
                    type="password"
                    placeholder="Enter file password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg mb-4 focus:border-[var(--primary)] outline-none"
                />
                <button
                    onClick={submitPassword}
                    className="w-full glow-button py-3 font-bold rounded-lg text-black"
                >
                    Unlock File
                </button>
            </div>
        </div>
    );

    // 4. Viewing Step
    return (
        <div className="min-h-screen bg-black flex flex-col">
            <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-[#0a0a0a]">
                <div className="flex items-center gap-3">
                    <Link href="/" className="font-bold text-lg text-white">DataLeash</Link>
                    <span className="text-gray-600">/</span>
                    <span className="text-gray-300 text-sm truncate max-w-[200px]">{file?.original_name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{viewer?.email}</span>
                    <div className="flex items-center gap-1 text-green-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Secure Session
                    </div>
                </div>
            </header>

            <div className="flex-1 relative w-full bg-[#111] overflow-hidden">
                {fileContent && (
                    <iframe
                        src={fileContent}
                        className="absolute inset-0 w-full h-full border-none"
                        allow="autoplay; fullscreen"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation"
                    />
                )}

                {/* Watermark Overlay */}
                <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex flex-wrap content-center justify-center opacity-[0.03]">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="text-4xl font-bold text-white rotate-[-45deg] m-12 select-none">
                            {viewer?.email}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
