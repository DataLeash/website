'use client'

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedViewer from "@/components/ProtectedViewer";
import { collectDeviceFingerprint } from "@/lib/fingerprint";

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
        full_name: string;
    };
}

type ViewStep = 'info' | 'otp' | 'nda' | 'waiting_approval' | 'viewing' | 'denied';

export default function ViewFilePage() {
    const params = useParams();
    const fileId = params.id as string;

    const [file, setFile] = useState<FileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<ViewStep>('info');

    // Viewer info
    const [viewerName, setViewerName] = useState('');
    const [viewerEmail, setViewerEmail] = useState('');

    // OTP state
    const [sessionId, setSessionId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpError, setOtpError] = useState('');

    // Access request state
    const [requestId, setRequestId] = useState('');
    const [requestStatus, setRequestStatus] = useState<'pending' | 'approved' | 'denied'>('pending');
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

    // File content
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);

    useEffect(() => {
        fetchFile();
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

    const handleSendOtp = async () => {
        if (!viewerName || !viewerEmail) {
            alert('Please enter your name and email');
            return;
        }

        if (!viewerEmail.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }

        setOtpSending(true);
        setOtpError('');

        try {
            const response = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: viewerEmail,
                    fileId,
                    viewerName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send verification code');
            }

            setSessionId(data.sessionId);
            setStep('otp');

        } catch (err: any) {
            setOtpError(err.message);
        } finally {
            setOtpSending(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otpCode.length !== 6) {
            setOtpError('Please enter the 6-digit code');
            return;
        }

        setOtpVerifying(true);
        setOtpError('');

        try {
            const response = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    code: otpCode,
                    email: viewerEmail
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid verification code');
            }

            // Store access token
            if (data.accessToken) {
                setAccessToken(data.accessToken);
            }

            // After email verification, check if NDA is required
            if (file?.settings?.require_nda) {
                setStep('nda');
            } else {
                // Request access from owner
                await requestAccess();
            }

        } catch (err: any) {
            setOtpError(err.message);
        } finally {
            setOtpVerifying(false);
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
                    sessionId,
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
            setError(err.message);
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
                    'x-viewer-token': accessToken,
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

    // Step 1: Enter name and email
    if (step === 'info') {
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
                            Shared by {file?.owner?.full_name || 'Unknown'} • {formatSize(file?.file_size || 0)}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-[var(--foreground-muted)] mb-1">Your Name</label>
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={viewerName}
                                onChange={(e) => setViewerName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--foreground-muted)] mb-1">Your Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={viewerEmail}
                                onChange={(e) => setViewerEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={handleSendOtp}
                            disabled={otpSending}
                            className="w-full glow-button py-4 rounded-lg font-bold text-black disabled:opacity-50"
                        >
                            {otpSending ? '📧 Sending Code...' : '📧 Verify Email'}
                        </button>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)]">
                        <h3 className="font-bold text-sm mb-2">🔐 4-Step Security Verification</h3>
                        <ol className="text-xs text-[var(--foreground-muted)] space-y-1">
                            <li>1️⃣ Email verification (OTP)</li>
                            <li>2️⃣ NDA signature (if required)</li>
                            <li>3️⃣ Owner approval request</li>
                            <li>4️⃣ Secure protected viewing</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Enter OTP
    if (step === 'otp') {
        return (
            <div className="gradient-bg min-h-screen flex items-center justify-center px-6">
                <div className="glass-card p-8 max-w-md">
                    <div className="flex items-center gap-3 mb-6">
                        <Image src="/logo.png" alt="Data Leash" width={40} height={40} />
                        <span className="font-bold text-gradient">Data Leash</span>
                    </div>

                    <div className="text-center mb-6">
                        <div className="text-4xl mb-2">📧</div>
                        <h1 className="text-xl font-bold">Step 1: Verify Email</h1>
                        <p className="text-sm text-[var(--foreground-muted)]">
                            Enter the 6-digit code sent to <span className="text-white">{viewerEmail}</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="000000"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            className="w-full px-4 py-4 rounded-lg bg-[var(--background)] border border-[rgba(0,212,255,0.2)] focus:border-[var(--primary)] focus:outline-none text-center text-3xl font-mono tracking-[0.5em]"
                        />

                        {otpError && (
                            <p className="text-[var(--error)] text-sm text-center">{otpError}</p>
                        )}

                        <button
                            onClick={handleVerifyOtp}
                            disabled={otpVerifying || otpCode.length !== 6}
                            className="w-full glow-button py-4 rounded-lg font-bold text-black disabled:opacity-50"
                        >
                            {otpVerifying ? 'Verifying...' : 'Verify Code'}
                        </button>

                        <button
                            onClick={() => setStep('info')}
                            className="w-full py-2 text-sm text-[var(--foreground-muted)] hover:text-white"
                        >
                            ← Back
                        </button>
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
