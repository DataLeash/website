'use client'

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ProtectedViewer from "@/components/ProtectedViewer";
import { collectDeviceFingerprint } from "@/lib/fingerprint";
import { createClient } from "@/lib/supabase-browser";

interface FileData {
    id: string;
    original_name: string;
    mime_type: string;
    file_size: number;
    created_at: string;
    owner_id: string;
    settings: {
        require_nda?: boolean;
        expires_at?: string;
        notify_on_view?: boolean;
        require_approval?: boolean;
    };
    owner?: {
        id: string;
        display_name: string;
    };
}

type ViewStep = 'auth' | 'nda' | 'waiting_approval' | 'viewing' | 'denied';

export default function ViewFilePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const fileId = params.id as string;

    const [file, setFile] = useState<FileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<ViewStep>('auth');

    // Viewer info (from OAuth)
    const [viewerName, setViewerName] = useState('');
    const [viewerEmail, setViewerEmail] = useState('');
    const [oauthProvider, setOauthProvider] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);

    // Access tokens
    const [accessToken, setAccessToken] = useState('');
    const accessTokenRef = useRef('');

    // Access request state
    const [requestId, setRequestId] = useState('');
    const [requestStatus, setRequestStatus] = useState<'pending' | 'approved' | 'denied'>('pending');
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

    // File content
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);

    // Check for authenticated viewer on mount
    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();

            // Check if user is authenticated (came back from OAuth)
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // User is authenticated via OAuth
                setViewerEmail(user.email || '');
                setViewerName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Viewer');
                setOauthProvider(user.app_metadata?.provider || 'oauth');
                setIsAuthenticated(true);

                // Generate access token for this viewer session
                const tokenResponse = await fetch('/api/viewer/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        fileId,
                        userId: user.id
                    })
                });

                if (tokenResponse.ok) {
                    const tokenData = await tokenResponse.json();
                    setAccessToken(tokenData.accessToken || '');
                    accessTokenRef.current = tokenData.accessToken || '';
                }
            }
        };

        fetchFile();
        checkAuth();

        return () => {
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, [fileId]);

    const fetchFile = async () => {
        try {
            const response = await fetch(`/api/files/${fileId}/info`);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 404) {
                    setError('File not found or has been deleted');
                } else if (response.status === 410) {
                    setError('This secure link has expired or the file was destroyed');
                } else {
                    setError(data.error || 'Failed to load secure file');
                }
                setLoading(false);
                return;
            }

            setFile(data);
            setLoading(false);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Connection failed. Please check your internet connection.');
            setLoading(false);
        }
    };

    // OAuth login handler
    const handleOAuthLogin = async (provider: 'google' | 'github' | 'discord') => {
        setAuthLoading(true);
        const supabase = createClient();

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/view/${fileId}`,
                    queryParams: {
                        // Pass file context in the OAuth flow
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });

            if (error) {
                console.error('OAuth error:', error);
                setError('Failed to authenticate. Please try again.');
            }
        } catch (err) {
            console.error('OAuth login error:', err);
            setError('Authentication failed');
        } finally {
            setAuthLoading(false);
        }
    };

    // Proceed to request access after authentication
    const handleProceedToAccess = async () => {
        if (!isAuthenticated) return;

        // Check if NDA is required
        if (file?.settings?.require_nda) {
            setStep('nda');
        } else {
            await requestAccess();
        }
    };

    const handleSignNda = async () => {
        // After NDA, request access from owner
        await requestAccess();
    };

    const requestAccess = async () => {
        try {
            // Collect device fingerprint
            const fingerprint = await collectDeviceFingerprint();

            const response = await fetch('/api/access/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileId,
                    viewerName,
                    viewerEmail,
                    oauthProvider,
                    fingerprint
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to request access');
            }

            setRequestId(data.requestId);
            setStep('waiting_approval');

            // Start polling for approval status
            startPolling(data.requestId);

        } catch (err: any) {
            setError(err.message || 'Failed to request access');
        }
    };

    const startPolling = (reqId: string) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/access/request?requestId=${reqId}`);
                const data = await response.json();

                if (data.status === 'approved') {
                    clearInterval(interval);
                    setRequestStatus('approved');
                    setStep('viewing');
                    loadFileContent();
                } else if (data.status === 'denied') {
                    clearInterval(interval);
                    setRequestStatus('denied');
                    setStep('denied');
                }
            } catch (e) {
                console.log('Polling error:', e);
            }
        }, 3000); // Check every 3 seconds

        setPollingInterval(interval);
    };

    const loadFileContent = async () => {
        setLoadingContent(true);
        try {
            // Create viewing session first
            try {
                await fetch('/api/session/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileId,
                        viewerEmail,
                        viewerName
                    })
                });
            } catch (e) {
                console.log('Session creation failed:', e);
            }

            const response = await fetch(`/api/files/${fileId}/decrypt`, {
                headers: {
                    'x-viewer-token': accessTokenRef.current || accessToken,  // Use ref first (closure-safe)
                    'x-viewer-email': viewerEmail
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to load file');
            }

            const blob = await response.blob();
            setFileContent(URL.createObjectURL(blob));

            // Start heartbeat to keep session active
            startHeartbeat();
        } catch (err: any) {
            setError(err.message || 'Failed to decrypt file');
        }
        setLoadingContent(false);
    };

    // Heartbeat to keep viewing session active
    const startHeartbeat = () => {
        const heartbeat = setInterval(async () => {
            try {
                await fetch('/api/session/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileId,
                        viewerEmail
                    })
                });
            } catch (e) {
                console.log('Heartbeat failed:', e);
            }
        }, 30000); // Every 30 seconds

        // Cleanup on unmount
        return () => clearInterval(heartbeat);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Loading state
    if (loading) {
        return (
            <div className="gradient-bg min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 float">🔐</div>
                    <p className="text-[var(--foreground-muted)]">Loading protected file...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="gradient-bg min-h-screen flex items-center justify-center px-6">
                <div className="glass-card p-8 max-w-md text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-[var(--foreground-muted)] mb-6">{error}</p>
                    <Link href="/" className="glow-button px-6 py-3 rounded-lg font-semibold text-black inline-block">
                        Go to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    // Step 1: Authenticate with OAuth
    if (step === 'auth') {
        return (
            <div className="gradient-bg min-h-screen flex items-center justify-center px-6">
                <div className="glass-card p-8 max-w-md">
                    <div className="flex items-center gap-3 mb-6">
                        <Image src="/logo.png" alt="Data Leash" width={40} height={40} />
                        <span className="font-bold text-gradient">Data Leash</span>
                    </div>

                    <div className="text-center mb-6">
                        <div className="text-4xl mb-2">📄</div>
                        <h1 className="text-xl font-bold">{file?.original_name}</h1>
                        <p className="text-sm text-[var(--foreground-muted)]">
                            Shared by {file?.owner?.display_name || file?.owner?.id || 'Anonymous'} • {formatSize(file?.file_size || 0)}
                        </p>
                    </div>

                    {/* Show authenticated state or login buttons */}
                    {isAuthenticated ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)]">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-xl">
                                        ✓
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--primary)]">Verified</p>
                                        <p className="text-sm text-[var(--foreground-muted)]">{viewerEmail}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-[var(--foreground-muted)]">
                                    Authenticated via {oauthProvider.charAt(0).toUpperCase() + oauthProvider.slice(1)}
                                </p>
                            </div>

                            <button
                                onClick={handleProceedToAccess}
                                className="w-full glow-button py-4 rounded-lg font-bold text-black"
                            >
                                🔓 Request File Access
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-center text-sm text-[var(--foreground-muted)] mb-4">
                                Sign in to verify your identity before requesting access
                            </p>

                            {/* Google */}
                            <button
                                onClick={() => handleOAuthLogin('google')}
                                disabled={authLoading}
                                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white hover:bg-gray-100 text-gray-800 font-semibold transition-all disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>

                            {/* GitHub */}
                            <button
                                onClick={() => handleOAuthLogin('github')}
                                disabled={authLoading}
                                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-[#24292e] hover:bg-[#2d3339] text-white font-semibold transition-all disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                </svg>
                                Continue with GitHub
                            </button>

                            {/* Discord */}
                            <button
                                onClick={() => handleOAuthLogin('discord')}
                                disabled={authLoading}
                                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-all disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                                Continue with Discord
                            </button>
                        </div>
                    )}

                    <div className="mt-6 p-4 rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)]">
                        <h3 className="font-bold text-sm mb-2">🔐 3-Step Security Verification</h3>
                        <ol className="text-xs text-[var(--foreground-muted)] space-y-1">
                            <li className={isAuthenticated ? 'text-[var(--success)]' : ''}>
                                1️⃣ Identity verification {isAuthenticated ? '✓' : '(OAuth login)'}
                            </li>
                            <li>2️⃣ {file?.settings?.require_nda ? 'NDA signature required' : 'NDA (if required)'}</li>
                            <li>3️⃣ Owner approval request</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    // Step 3: NDA (if required)
    if (step === 'nda') {
        return (
            <div className="gradient-bg min-h-screen flex items-center justify-center px-6">
                <div className="glass-card p-8 max-w-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <Image src="/logo.png" alt="Data Leash" width={40} height={40} />
                        <span className="font-bold text-gradient">Data Leash</span>
                    </div>

                    <div className="text-center mb-6">
                        <div className="text-4xl mb-2">📜</div>
                        <h1 className="text-2xl font-bold">Step 2: Sign NDA</h1>
                    </div>

                    <div className="glass-card p-4 mb-6 max-h-48 overflow-y-auto text-sm text-[var(--foreground-muted)]">
                        <h3 className="font-bold text-white mb-2">NON-DISCLOSURE AGREEMENT</h3>
                        <p className="mb-2">By signing, you ({viewerName}) agree to:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Keep all information confidential</li>
                            <li>Not share, copy, screenshot, or distribute contents</li>
                            <li>Not attempt to circumvent security measures</li>
                            <li>Accept that violations may result in legal action</li>
                        </ul>
                    </div>

                    <button
                        onClick={handleSignNda}
                        className="w-full glow-button py-4 rounded-lg font-bold text-black"
                    >
                        ✍️ I Agree - Sign NDA
                    </button>
                </div>
            </div>
        );
    }

    // Step 4: Waiting for owner approval
    if (step === 'waiting_approval') {
        return (
            <div className="gradient-bg min-h-screen flex items-center justify-center px-6">
                <div className="glass-card p-8 max-w-md text-center">
                    <div className="text-6xl mb-4 float">⏳</div>
                    <h1 className="text-2xl font-bold mb-2">Step 3: Waiting for Approval</h1>
                    <p className="text-[var(--foreground-muted)] mb-6">
                        Your access request has been sent to the file owner.<br />
                        They will receive your details including:
                    </p>
                    <div className="glass-card p-4 mb-6 text-left text-sm">
                        <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.1)]">
                            <span className="text-[var(--foreground-muted)]">Name:</span>
                            <span>{viewerName}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.1)]">
                            <span className="text-[var(--foreground-muted)]">Email:</span>
                            <span>{viewerEmail}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.1)]">
                            <span className="text-[var(--foreground-muted)]">IP Address:</span>
                            <span>Sent to owner</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-[var(--foreground-muted)]">Device:</span>
                            <span>Sent to owner</span>
                        </div>
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                        Please wait... This page will update automatically when the owner responds.
                    </p>
                    <div className="mt-4">
                        <div className="inline-block w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Access denied
    if (step === 'denied') {
        return (
            <div className="gradient-bg min-h-screen flex items-center justify-center px-6">
                <div className="glass-card p-8 max-w-md text-center">
                    <div className="text-6xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-[var(--error)] mb-2">Access Denied</h1>
                    <p className="text-[var(--foreground-muted)] mb-6">
                        The file owner has denied your access request.
                    </p>
                    <Link href="/" className="glow-button px-6 py-3 rounded-lg font-semibold text-black inline-block">
                        Go to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    // Step 5: Loading content
    if (loadingContent) {
        return (
            <div className="gradient-bg min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 float">🔓</div>
                    <p className="text-[var(--foreground-muted)]">Decrypting file...</p>
                </div>
            </div>
        );
    }

    // Step 6: Protected file viewer
    return (
        <div className="gradient-bg min-h-screen">
            {/* Header */}
            <header className="glass-card m-4 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Data Leash" width={32} height={32} />
                    <span className="font-bold text-gradient">Data Leash</span>
                </div>
                <div className="text-center">
                    <div className="font-medium">{file?.original_name}</div>
                    <div className="text-xs text-[var(--foreground-muted)]">Protected • View Only • No Downloads</div>
                </div>
                <div className="text-right text-xs">
                    <div className="text-[var(--success)]">✓ Verified & Approved</div>
                    <div className="text-[var(--foreground-muted)]">{viewerEmail}</div>
                </div>
            </header>

            {/* Protected Content */}
            <main className="p-4">
                <div className="glass-card p-4 max-w-5xl mx-auto min-h-[75vh] flex items-center justify-center">
                    {fileContent ? (
                        <ProtectedViewer
                            fileUrl={fileContent}
                            fileName={file?.original_name || 'Unknown'}
                            mimeType={file?.mime_type || 'application/octet-stream'}
                            viewerName={viewerName}
                            viewerEmail={viewerEmail}
                            fileId={fileId}
                        />
                    ) : (
                        <div className="text-center">
                            <div className="text-6xl mb-4">⚠️</div>
                            <p className="text-[var(--foreground-muted)]">Unable to load file content</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Security Footer */}
            <footer className="fixed bottom-0 left-0 right-0 p-3 bg-[rgba(0,0,0,0.9)] text-center text-xs text-[var(--foreground-muted)]">
                🔐 Protected by Data Leash • 📧 {viewerEmail} • 🚫 Copying, Screenshots & Downloads Disabled • All activity logged
            </footer>
        </div>
    );
}
