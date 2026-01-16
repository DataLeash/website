'use client';

/**
 * DataLeash Secure Video Viewer
 * 
 * A React component that displays protected content through the EME pipeline,
 * enabling hardware-level capture protection via the browser's DRM system.
 * 
 * When playing, screen recording/sharing will see BLACK instead of the content.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { setupEMEForVideo, isEMESupported, createSecureVideoElement } from '@/lib/drm/eme-player';
import { Shield, Lock, AlertTriangle, Loader2, Play, Pause, Volume2, VolumeX } from 'lucide-react';

// =====================================================
// TYPES
// =====================================================

interface SecureVideoViewerProps {
    /** The encrypted video source URL */
    src: string;
    /** File ID for license requests */
    fileId: string;
    /** Session ID for access validation */
    sessionId: string;
    /** Optional poster image while loading */
    poster?: string;
    /** Callback when DRM setup fails */
    onDRMError?: (error: Error) => void;
    /** Callback when playback is ready */
    onReady?: () => void;
    /** Callback when access is revoked */
    onRevoked?: () => void;
    /** Whether to auto-play when ready */
    autoPlay?: boolean;
    /** Custom CSS class */
    className?: string;
}

type DRMStatus =
    | 'checking'      // Checking EME support
    | 'unsupported'   // Browser doesn't support EME
    | 'loading'       // Loading encrypted content
    | 'acquiring'     // Acquiring license
    | 'ready'         // Ready to play
    | 'playing'       // Currently playing
    | 'paused'        // Paused
    | 'error'         // DRM error occurred
    | 'revoked';      // Access was revoked

// =====================================================
// COMPONENT
// =====================================================

export function SecureVideoViewer({
    src,
    fileId,
    sessionId,
    poster,
    onDRMError,
    onReady,
    onRevoked,
    autoPlay = false,
    className = '',
}: SecureVideoViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    const [status, setStatus] = useState<DRMStatus>('checking');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);

    // =====================================================
    // EME INITIALIZATION
    // =====================================================

    const initializeEME = useCallback(async () => {
        if (!containerRef.current) return;

        try {
            // Check EME support
            setStatus('checking');
            const supported = await isEMESupported();

            if (!supported) {
                setStatus('unsupported');
                setErrorMessage('Your browser does not support secure playback (EME).');
                return;
            }

            // Create secure video element
            setStatus('loading');
            const video = createSecureVideoElement();
            video.src = src;
            video.poster = poster || '';
            video.muted = true; // Start muted for autoplay policies

            // Add to container
            containerRef.current.appendChild(video);
            videoRef.current = video;

            // Set up EME
            setStatus('acquiring');
            const handler = await setupEMEForVideo(video, {
                fileId,
                sessionId,
                licenseServerUrl: '/api/drm/license',
                onError: (error) => {
                    console.error('[SecureViewer] DRM Error:', error);
                    setStatus('error');
                    setErrorMessage(error.message);
                    onDRMError?.(error);
                },
                onLicenseAcquired: () => {
                    console.log('[SecureViewer] License acquired');
                },
                onPlaybackReady: () => {
                    console.log('[SecureViewer] Playback ready');
                    setStatus('ready');
                    onReady?.();

                    if (autoPlay) {
                        video.play().catch(() => {
                            // Autoplay blocked - that's OK
                            setStatus('ready');
                        });
                    }
                },
            });

            if (handler) {
                cleanupRef.current = handler.cleanup;
            }

            // Progress tracking
            video.addEventListener('timeupdate', () => {
                if (video.duration) {
                    setProgress((video.currentTime / video.duration) * 100);
                }
            });

            video.addEventListener('play', () => setStatus('playing'));
            video.addEventListener('pause', () => setStatus('paused'));

            // Load the video
            video.load();

        } catch (error) {
            console.error('[SecureViewer] Initialization failed:', error);
            setStatus('error');
            setErrorMessage((error as Error).message);
            onDRMError?.(error as Error);
        }
    }, [src, fileId, sessionId, poster, autoPlay, onDRMError, onReady]);

    // Initialize on mount
    useEffect(() => {
        initializeEME();

        return () => {
            cleanupRef.current?.();
            if (videoRef.current && containerRef.current) {
                containerRef.current.removeChild(videoRef.current);
            }
        };
    }, [initializeEME]);

    // =====================================================
    // CONTROLS
    // =====================================================

    const handlePlayPause = () => {
        if (!videoRef.current) return;

        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    };

    const handleMuteToggle = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div
            className={`relative bg-black rounded-xl overflow-hidden ${className}`}
            data-protected
        >
            {/* Video Container - CSS hardened */}
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    // @ts-ignore
                    WebkitTouchCallout: 'none',
                }}
                onContextMenu={(e) => e.preventDefault()}
            />

            {/* DRM Status Overlay */}
            {status !== 'playing' && status !== 'paused' && status !== 'ready' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
                    <div className="text-center p-8">
                        {/* Status Icon */}
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-slate-800/50">
                            {status === 'checking' && (
                                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                            )}
                            {status === 'loading' && (
                                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                            )}
                            {status === 'acquiring' && (
                                <Lock className="w-8 h-8 text-amber-400 animate-pulse" />
                            )}
                            {status === 'unsupported' && (
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                            )}
                            {status === 'error' && (
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                            )}
                            {status === 'revoked' && (
                                <Shield className="w-8 h-8 text-red-400" />
                            )}
                        </div>

                        {/* Status Text */}
                        <h3 className="text-white font-semibold text-lg mb-2">
                            {status === 'checking' && 'Verifying DRM Support...'}
                            {status === 'loading' && 'Loading Protected Content...'}
                            {status === 'acquiring' && 'Acquiring License...'}
                            {status === 'unsupported' && 'Browser Not Supported'}
                            {status === 'error' && 'Playback Error'}
                            {status === 'revoked' && 'Access Revoked'}
                        </h3>

                        <p className="text-slate-400 text-sm max-w-xs mx-auto">
                            {status === 'checking' && 'Checking if your browser supports hardware-protected playback.'}
                            {status === 'loading' && 'Content is encrypted using industry-standard DRM.'}
                            {status === 'acquiring' && 'Validating your access rights with the license server.'}
                            {status === 'unsupported' && 'Try using Chrome, Edge, or Safari for secure playback.'}
                            {status === 'error' && (errorMessage || 'An error occurred during playback.')}
                            {status === 'revoked' && 'The owner has revoked access to this content.'}
                        </p>

                        {/* Security Badge */}
                        <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 text-xs font-mono">HARDWARE-PROTECTED</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Play Button Overlay (when ready but not playing) */}
            {status === 'ready' && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer group"
                    onClick={handlePlayPause}
                >
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <Play className="w-10 h-10 text-white ml-1" />
                    </div>
                </div>
            )}

            {/* Minimal Controls (when playing/paused) */}
            {(status === 'playing' || status === 'paused') && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    {/* Progress Bar */}
                    <div className="h-1 bg-white/20 rounded-full mb-3 overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-200"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePlayPause}
                            className="text-white hover:text-blue-400 transition-colors"
                        >
                            {status === 'playing' ? (
                                <Pause className="w-6 h-6" />
                            ) : (
                                <Play className="w-6 h-6" />
                            )}
                        </button>

                        <button
                            onClick={handleMuteToggle}
                            className="text-white hover:text-blue-400 transition-colors"
                        >
                            {isMuted ? (
                                <VolumeX className="w-5 h-5" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </button>

                        <div className="flex-1" />

                        {/* DRM Badge */}
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 rounded text-emerald-400 text-xs font-mono">
                            <Lock className="w-3 h-3" />
                            <span>DRM</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SecureVideoViewer;
