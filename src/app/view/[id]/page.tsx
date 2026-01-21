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
    const [viewer, setViewer] = useState<{ email: string; name: string; id?: string } | null>(null);
    const [password, setPassword] = useState('');
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [accessRequestStatus, setAccessRequestStatus] = useState<string>('');
    const [screenshotBlocked, setScreenshotBlocked] = useState(false);
    const [contentHidden, setContentHidden] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const lastFrameTime = useRef<number>(0);
    const frameDropCount = useRef<number>(0);

    // AGGRESSIVE Mobile Security: Multi-layer screenshot/screen recording prevention
    useEffect(() => {
        if (step !== 'viewing') return;

        const HIDE_DURATION = 5000; // Hide for 5 seconds when triggered
        let hideTimeout: NodeJS.Timeout | null = null;

        const hideContent = (reason: string) => {
            setContentHidden(true);
            setScreenshotBlocked(true);

            // Log the attempt
            fetch('/api/access/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileId,
                    action: reason,
                    viewerEmail: viewer?.email,
                    timestamp: new Date().toISOString()
                })
            }).catch(() => { });

            // Clear any existing timeout and set new one
            if (hideTimeout) clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                if (document.hasFocus() && document.visibilityState === 'visible') {
                    setContentHidden(false);
                    setScreenshotBlocked(false);
                }
            }, HIDE_DURATION);
        };

        // ========================
        // LAYER 1: HIGH-FREQUENCY VISIBILITY POLLING (every 16ms)
        // Catches screenshot faster than event-based detection
        // ========================
        let lastVisibilityState = document.visibilityState;
        const visibilityPollInterval = setInterval(() => {
            if (document.visibilityState !== lastVisibilityState) {
                if (document.visibilityState !== 'visible') {
                    hideContent('visibility_change');
                }
                lastVisibilityState = document.visibilityState;
            }
            // Also check if document lost focus
            if (!document.hasFocus() && !contentHidden) {
                hideContent('focus_lost');
            }
        }, 16); // ~60fps polling

        // ========================
        // LAYER 2: ACCELEROMETER/DEVICEMOTION - Detect button press movement
        // When user presses hardware buttons, device moves slightly
        // ========================
        let lastAcceleration = { x: 0, y: 0, z: 0 };
        let motionEventCount = 0;

        const handleDeviceMotion = (e: DeviceMotionEvent) => {
            if (!e.acceleration) return;

            const { x, y, z } = e.acceleration;
            if (x === null || y === null || z === null) return;

            // Calculate jerk (sudden movement)
            const jerk = Math.abs(x - lastAcceleration.x) +
                Math.abs(y - lastAcceleration.y) +
                Math.abs(z - lastAcceleration.z);

            // High jerk = button press motion (threshold ~2-5)
            if (jerk > 3 && motionEventCount > 10) {
                hideContent('device_motion_jerk');
            }

            lastAcceleration = { x, y, z };
            motionEventCount++;
        };

        // ========================
        // LAYER 3: TOUCH RELEASE DETECTION
        // When user removes ALL fingers to press buttons
        // ========================
        let touchCount = 0;
        let touchReleaseTime = 0;

        const handleTouchStart = (e: TouchEvent) => {
            touchCount = e.touches.length;

            // Multi-touch = possible screenshot
            if (touchCount >= 2) {
                hideContent('multi_touch');
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const previousCount = touchCount;
            touchCount = e.touches.length;

            // ALL touches removed suddenly = preparing for button press
            if (previousCount > 0 && touchCount === 0) {
                touchReleaseTime = Date.now();
                // Give a brief window then hide
                setTimeout(() => {
                    // If still no touches after 100ms, might be button press
                    if (touchCount === 0 && Date.now() - touchReleaseTime >= 100) {
                        hideContent('all_touches_released');
                    }
                }, 150);
            }

            // Double-tap prevention
            const now = Date.now();
            if (now - touchReleaseTime <= 300 && previousCount > 0) {
                e.preventDefault();
            }
        };

        // ========================
        // LAYER 4: Window blur/focus detection
        // ========================
        const handleWindowBlur = () => hideContent('window_blur');

        const handleWindowFocus = () => {
            if (hideTimeout) clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                setContentHidden(false);
                setScreenshotBlocked(false);
            }, 500);
        };

        // ========================
        // LAYER 5: Visibility change event (backup)
        // ========================
        const handleVisibilityChange = () => {
            if (document.hidden || document.visibilityState !== 'visible') {
                hideContent('visibility_hidden');
            } else {
                if (hideTimeout) clearTimeout(hideTimeout);
                hideTimeout = setTimeout(() => {
                    setContentHidden(false);
                    setScreenshotBlocked(false);
                }, 500);
            }
        };

        // ========================
        // LAYER 6: Screen Recording Detection via Frame Rate Drop
        // ========================
        let animationFrameId: number;
        const detectScreenRecording = () => {
            const now = performance.now();
            const delta = now - lastFrameTime.current;

            if (lastFrameTime.current > 0 && delta > 50) {
                frameDropCount.current++;
                if (frameDropCount.current > 3) {
                    hideContent('frame_drop_recording');
                }
            } else {
                frameDropCount.current = Math.max(0, frameDropCount.current - 1);
            }

            lastFrameTime.current = now;
            animationFrameId = requestAnimationFrame(detectScreenRecording);
        };
        animationFrameId = requestAnimationFrame(detectScreenRecording);

        // ========================
        // LAYER 7: Page lifecycle events (iOS specific)
        // ========================
        const handlePageHide = () => hideContent('page_hide');
        const handleFreeze = () => hideContent('page_freeze');

        // ========================
        // LAYER 8: Prevent all save/copy mechanisms
        // ========================
        const preventContextMenu = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const preventDrag = (e: DragEvent) => {
            e.preventDefault();
            return false;
        };

        const preventCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            return false;
        };

        const preventKeyboard = (e: KeyboardEvent) => {
            if (
                e.key === 'PrintScreen' ||
                (e.metaKey && e.shiftKey) ||
                (e.ctrlKey && e.key === 'p') ||
                (e.ctrlKey && e.key === 's')
            ) {
                e.preventDefault();
                hideContent('keyboard_shortcut');
            }
        };

        const preventZoom = (e: TouchEvent) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        };

        // ========================
        // Add all event listeners
        // ========================
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('freeze', handleFreeze as EventListener);
        window.addEventListener('devicemotion', handleDeviceMotion as EventListener);
        document.addEventListener('contextmenu', preventContextMenu, true);
        document.addEventListener('dragstart', preventDrag);
        document.addEventListener('copy', preventCopy);
        document.addEventListener('keydown', preventKeyboard);
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchstart', preventZoom, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Cleanup
        return () => {
            clearInterval(visibilityPollInterval);
            cancelAnimationFrame(animationFrameId);
            if (hideTimeout) clearTimeout(hideTimeout);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleWindowFocus);
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('freeze', handleFreeze as EventListener);
            window.removeEventListener('devicemotion', handleDeviceMotion as EventListener);
            document.removeEventListener('contextmenu', preventContextMenu, true);
            document.removeEventListener('dragstart', preventDrag);
            document.removeEventListener('copy', preventCopy);
            document.removeEventListener('keydown', preventKeyboard);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchstart', preventZoom);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [step, fileId, viewer?.email, contentHidden]);

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
                        name: user.user_metadata?.full_name || user.email?.split('@')[0],
                        id: user.id
                    });

                    // If user is logged in, check if they can access directly
                    if (fileData.settings?.require_password) {
                        setStep('password');
                    } else {
                        // Try to auto-access (for recipients) - pass user directly to avoid race condition
                        checkAccess(user.email!, user.id);
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

    const checkAccess = async (email: string, userId?: string) => {
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
                loadFileContent(email, userId); // Pass both email and userId directly
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
                loadFileContent(viewer.email, viewer.id);
            } else if (data.error) {
                console.error('[ACCESS] Request error:', data.error);
                setError(data.error);
                setAccessRequestStatus('');
            } else {
                setAccessRequestStatus('sent');
                // Poll for approval
                const pollInterval = setInterval(async () => {
                    const statusRes = await fetch(`/api/access/request?requestId=${data.requestId}`);
                    const statusData = await statusRes.json();
                    if (statusData.status === 'approved') {
                        clearInterval(pollInterval);
                        loadFileContent(viewer.email, viewer.id);
                    } else if (statusData.status === 'denied') {
                        clearInterval(pollInterval);
                        setStep('denied');
                    }
                }, 3000);
            }
        } catch (e) {
            console.error('[ACCESS] Request failed:', e);
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

    const loadFileContent = async (emailOverride?: string, userIdOverride?: string) => {
        setLoading(true);
        const emailToUse = emailOverride || viewer?.email || '';
        const userIdToUse = userIdOverride || viewer?.id || '';
        try {
            const res = await fetch(`/api/files/${fileId}/decrypt`, {
                headers: {
                    'x-viewer-email': emailToUse,
                    'x-viewer-id': userIdToUse
                }
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('[VIEWER] Decrypt failed:', res.status, errorData);
                throw new Error(errorData.error || 'Failed to load file');
            }
            const blob = await res.blob();
            setFileContent(URL.createObjectURL(blob));
            setStep('viewing');
        } catch (e: any) {
            console.error('[VIEWER] Error:', e);
            setError(e.message || 'Could not decrypt file');
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

    // 4. Viewing Step - Secure Viewer with Mobile Protection
    return (
        <div
            className="min-h-screen bg-black flex flex-col touch-none select-none"
            style={{
                WebkitUserSelect: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none',
                touchAction: 'none'
            }}
        >
            {/* Screenshot blocked overlay */}
            {screenshotBlocked && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
                    <div className="text-center">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-red-500">Screenshot Detected</h2>
                        <p className="text-gray-400 text-sm mt-2">This action has been logged.</p>
                    </div>
                </div>
            )}

            <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 md:px-6 bg-[#0a0a0a] shrink-0">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <Link href="/" className="font-bold text-base md:text-lg text-white shrink-0">DataLeash</Link>
                    <span className="text-gray-600 hidden sm:block">/</span>
                    <span className="text-gray-300 text-xs md:text-sm truncate max-w-[120px] md:max-w-[200px] hidden sm:block">{file?.original_name}</span>
                </div>
                <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs text-gray-500">
                    <span className="truncate max-w-[100px] md:max-w-none">{viewer?.email}</span>
                    <div className="flex items-center gap-1 text-green-500 shrink-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="hidden sm:inline">Secure Session</span>
                    </div>
                </div>
            </header>

            <div
                ref={contentRef}
                className="flex-1 relative w-full bg-[#111] overflow-hidden flex items-center justify-center"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{
                    // When hidden, blur and darken the content
                    filter: contentHidden ? 'blur(50px) brightness(0)' : 'none',
                    transition: 'filter 0.05s ease-out'
                }}
            >
                {/* Content is completely hidden when screenshot detected */}
                {!contentHidden && fileContent && file?.mime_type?.startsWith('image/') ? (
                    // Render images directly centered (not in iframe)
                    <img
                        src={fileContent}
                        alt={file?.original_name}
                        className="max-w-full max-h-full object-contain pointer-events-none"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        style={{
                            WebkitUserDrag: 'none',
                            WebkitTouchCallout: 'none'
                        } as React.CSSProperties}
                    />
                ) : !contentHidden && fileContent ? (
                    // Non-image files use iframe
                    <iframe
                        src={fileContent}
                        className="w-full h-full border-none"
                        allow="autoplay; fullscreen"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation"
                    />
                ) : null}

                {/* When hidden, show black overlay */}
                {contentHidden && (
                    <div className="absolute inset-0 bg-black z-[60]" />
                )}

                {/* Watermark Overlay - More dense for mobile */}
                {!contentHidden && (
                    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-[0.04]">
                        <div className="absolute inset-0 flex flex-wrap content-start justify-start" style={{ transform: 'rotate(-30deg) scale(1.5)', transformOrigin: 'center' }}>
                            {Array.from({ length: 30 }).map((_, i) => (
                                <div key={i} className="text-lg md:text-2xl font-bold text-white whitespace-nowrap m-4 md:m-8 select-none">
                                    {viewer?.email}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Invisible overlay to prevent touch interactions with content */}
                <div
                    className="absolute inset-0 z-40"
                    style={{ pointerEvents: 'auto' }}
                    onContextMenu={(e) => e.preventDefault()}
                    onTouchStart={(e) => {
                        // Allow single touch for scrolling but log multi-touch (zoom attempts)
                        if (e.touches.length > 1) {
                            e.preventDefault();
                        }
                    }}
                />
            </div>

            {/* Mobile footer indicator */}
            <div className="h-8 bg-[#0a0a0a] border-t border-gray-800 flex items-center justify-center text-[10px] text-gray-600 shrink-0">
                🔒 Protected by DataLeash
            </div>
        </div>
    );
}
