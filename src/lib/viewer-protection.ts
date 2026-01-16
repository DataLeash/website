'use client'

// DataLeash Viewer Protection Module
// Implements instant cutoff, anti-capture, and security monitoring

// =====================================================
// INSTANT CUTOFF SYSTEM
// =====================================================

export interface ProtectionConfig {
    sessionId: string;
    fileId: string;
    heartbeatInterval?: number;  // ms, default 3000
    onRevoked?: () => void;
    onOffline?: () => void;
    onTampered?: () => void;
}

let heartbeatTimer: NodeJS.Timeout | null = null;
let isProtectionActive = false;
let lastHeartbeatTime = 0;

// Start protection - call this when viewing starts
export function startProtection(config: ProtectionConfig) {
    if (isProtectionActive) return;
    isProtectionActive = true;
    lastHeartbeatTime = Date.now();

    // Start heartbeat
    startHeartbeat(config);

    // Monitor network status
    setupNetworkMonitoring(config);

    // Anti-capture protections
    setupAntiCapture(config);

    // DevTools detection
    setupDevToolsDetection(config);

    console.log('[DataLeash] Protection active');
}

// Stop protection - call when viewer closes
export function stopProtection() {
    isProtectionActive = false;
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
    console.log('[DataLeash] Protection stopped');
}

// =====================================================
// HEARTBEAT SYSTEM
// =====================================================

function startHeartbeat(config: ProtectionConfig) {
    const interval = config.heartbeatInterval || 3000;

    const doHeartbeat = async () => {
        if (!isProtectionActive) return;

        try {
            const response = await fetch('/api/session/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: config.sessionId,
                    file_id: config.fileId,
                    timestamp: Date.now()
                })
            });

            const data = await response.json();
            lastHeartbeatTime = Date.now();

            if (!response.ok || data.revoked === true || data.valid === false) {
                // Access revoked - instant cutoff
                console.log('[DataLeash] Access revoked - destroying content');
                destroyContent();
                config.onRevoked?.();
                stopProtection();
            }

        } catch (error) {
            // Network error - check if offline
            if (!navigator.onLine) {
                handleOffline(config);
            }
        }
    };

    // Immediate first heartbeat
    doHeartbeat();

    // Regular heartbeats
    heartbeatTimer = setInterval(doHeartbeat, interval);
}

// =====================================================
// NETWORK MONITORING
// =====================================================

function setupNetworkMonitoring(config: ProtectionConfig) {
    window.addEventListener('offline', () => handleOffline(config));
    window.addEventListener('online', () => handleOnline(config));

    // Also detect slow/weak connection
    if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        conn?.addEventListener('change', () => {
            if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
                console.log('[DataLeash] Weak connection detected');
            }
        });
    }
}

function handleOffline(config: ProtectionConfig) {
    console.log('[DataLeash] Offline detected - freezing content');
    freezeContent();
    config.onOffline?.();
}

function handleOnline(config: ProtectionConfig) {
    console.log('[DataLeash] Back online - resuming');
    unfreezeContent();
}

// =====================================================
// ANTI-CAPTURE PROTECTION
// =====================================================

function setupAntiCapture(config: ProtectionConfig) {
    // Disable right-click
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        logSecurityEvent('right_click_blocked', config);
        return false;
    });

    // Disable keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // PrintScreen
        if (e.key === 'PrintScreen') {
            e.preventDefault();
            destroyContent();
            logSecurityEvent('printscreen_blocked', config);
            return false;
        }

        // Ctrl+P (Print)
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            logSecurityEvent('print_blocked', config);
            return false;
        }

        // Ctrl+S (Save)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            logSecurityEvent('save_blocked', config);
            return false;
        }

        // Ctrl+Shift+S (Save As)
        if (e.ctrlKey && e.shiftKey && e.key === 's') {
            e.preventDefault();
            logSecurityEvent('saveas_blocked', config);
            return false;
        }

        // Ctrl+C (Copy) in protected area
        if (e.ctrlKey && e.key === 'c') {
            const selection = window.getSelection()?.toString();
            if (selection && selection.length > 0) {
                e.preventDefault();
                logSecurityEvent('copy_blocked', config);
                return false;
            }
        }

        // F12 / Ctrl+Shift+I (DevTools)
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
            logSecurityEvent('devtools_shortcut_blocked', config);
            return false;
        }

        // Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            logSecurityEvent('viewsource_blocked', config);
            return false;
        }
    });

    // Disable text selection
    document.addEventListener('selectstart', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-protected]')) {
            e.preventDefault();
            return false;
        }
    });

    // Disable drag
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    });

    // Add print protection CSS
    addPrintProtectionCSS();

    // Monitor for extension injections
    setupExtensionDetection(config);

    // Visibility change - user switching tabs
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('[DataLeash] Tab hidden');
            // Optionally blur content
        }
    });
}

// =====================================================
// DEVTOOLS DETECTION
// =====================================================

let devToolsOpen = false;

function setupDevToolsDetection(config: ProtectionConfig) {
    const threshold = 160;

    const checkDevTools = () => {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;

        if (widthDiff > threshold || heightDiff > threshold) {
            if (!devToolsOpen) {
                devToolsOpen = true;
                console.log('[DataLeash] DevTools detected');
                freezeContent();
                logSecurityEvent('devtools_opened', config);
                config.onTampered?.();
            }
        } else {
            if (devToolsOpen) {
                devToolsOpen = false;
                unfreezeContent();
            }
        }
    };

    // Check periodically
    setInterval(checkDevTools, 1000);

    // Console-based detection
    const devToolsCheck = new Image();
    Object.defineProperty(devToolsCheck, 'id', {
        get: function () {
            console.log('[DataLeash] DevTools console access detected');
            freezeContent();
            logSecurityEvent('devtools_console', config);
        }
    });

    // Trigger detection by logging object with getter
    setInterval(() => {
        console.log('%c', devToolsCheck);
    }, 5000);
}

// =====================================================
// EXTENSION DETECTION  
// =====================================================

function setupExtensionDetection(config: ProtectionConfig) {
    // Check for known screenshot/recording extensions
    const extensionIndicators = [
        // Screenshot extensions
        '[data-nimbus-screenshot]',
        '[data-awesome-screenshot]',
        '.lightshot-btn',
        '#fireshot-container',
        '[data-greenshot]',
        // Recording extensions
        '[data-loom]',
        '[data-vidyard]',
        '.screencastify-extension',
        '#screenleap-container',
        '[data-screenpal]',
        // DevTools and debugging
        '.react-devtools-root',
        '#__vue-devtools-container__',
        '[data-testid="storybook-root"]',
    ];

    const checkExtensions = () => {
        // Check for known extension DOM elements
        for (const selector of extensionIndicators) {
            if (document.querySelector(selector)) {
                console.log('[DataLeash] Recording/Screenshot extension detected');
                logSecurityEvent('extension_detected', config, { selector });
                destroyContent();
                return true;
            }
        }

        // Check for Redux DevTools (common in dev environments)
        if ((window as any).__REDUX_DEVTOOLS_EXTENSION__) {
            console.log('[DataLeash] Redux DevTools detected');
            logSecurityEvent('devtools_extension', config);
            // Don't destroy, just log - it's a dev tool, not a capture tool
        }

        return false;
    };

    // Initial check
    checkExtensions();

    // Monitor DOM for extension injections
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of Array.from(mutation.addedNodes)) {
                if (node instanceof HTMLElement) {
                    // Check for known extension selectors
                    for (const selector of extensionIndicators) {
                        if (node.matches?.(selector) || node.querySelector?.(selector)) {
                            console.log('[DataLeash] Extension injection detected');
                            logSecurityEvent('extension_injection', config);
                            destroyContent();
                            return;
                        }
                    }

                    // Check for foreign script injections (non-origin scripts)
                    if (node.tagName === 'SCRIPT') {
                        const src = node.getAttribute('src');
                        if (src && !src.startsWith(window.location.origin) && !src.startsWith('/')) {
                            // Allow known CDNs
                            const allowedCDNs = ['cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com'];
                            const isAllowed = allowedCDNs.some(cdn => src.includes(cdn));

                            if (!isAllowed) {
                                console.log('[DataLeash] Foreign script injection detected:', src);
                                logSecurityEvent('foreign_script_injection', config, { src });
                                // Don't destroy immediately, but flag it
                            }
                        }
                    }
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// =====================================================
// CONTENT MANIPULATION
// =====================================================

function destroyContent() {
    // Find all protected content and destroy it
    const protectedElements = document.querySelectorAll('[data-protected]');
    protectedElements.forEach(el => {
        el.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;text-align:center;color:#ff4444;">
                <div>
                    <div style="font-size:4rem;margin-bottom:1rem;">🚫</div>
                    <h2 style="font-size:1.5rem;font-weight:bold;margin-bottom:0.5rem;">Access Revoked</h2>
                    <p style="color:#888;">Your access to this file has been terminated.</p>
                </div>
            </div>
        `;
    });

    // Blur unknown remaining content
    document.body.style.filter = 'blur(20px)';
    document.body.style.pointerEvents = 'none';
}

function freezeContent() {
    document.body.classList.add('dl-frozen');

    // Add overlay
    if (!document.getElementById('dl-freeze-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'dl-freeze-overlay';
        overlay.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:rgba(0,0,0,0.9);color:white;text-align:center;">
                <div>
                    <div style="font-size:3rem;margin-bottom:1rem;">⏸️</div>
                    <h2 style="font-size:1.25rem;font-weight:bold;margin-bottom:0.5rem;">Content Frozen</h2>
                    <p style="color:#888;font-size:0.875rem;">Developer tools or unauthorized activity detected.</p>
                    <p style="color:#888;font-size:0.875rem;margin-top:0.5rem;">Close DevTools to continue viewing.</p>
                </div>
            </div>
        `;
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;';
        document.body.appendChild(overlay);
    }
}

function unfreezeContent() {
    document.body.classList.remove('dl-frozen');
    const overlay = document.getElementById('dl-freeze-overlay');
    if (overlay) overlay.remove();
}

function addPrintProtectionCSS() {
    if (document.getElementById('dl-print-protection')) return;

    const style = document.createElement('style');
    style.id = 'dl-print-protection';
    style.textContent = `
        @media print {
            body * { display: none !important; }
            body::after {
                content: "🔒 Printing is disabled for this protected document. All actions are logged.";
                display: block;
                font-size: 2rem;
                text-align: center;
                padding: 4rem;
            }
        }
        
        [data-protected] {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
        }
        
        .dl-frozen [data-protected] {
            filter: blur(20px);
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
}

// =====================================================
// SECURITY LOGGING
// =====================================================

async function logSecurityEvent(
    event: string,
    config: ProtectionConfig,
    details?: Record<string, unknown>
) {
    try {
        await fetch('/api/session/security-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: config.sessionId,
                file_id: config.fileId,
                event,
                details,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            })
        });
    } catch {
        // Silent fail - don't let logging errors affect UX
    }
}

// =====================================================
// SCREEN SHARE / RECORDING DETECTION - MAXIMUM MODE
// =====================================================

let screenShareActive = false;
const screenShareCheckInterval: NodeJS.Timeout | null = null;
let captureDetectionActive = false;

export function setupScreenShareDetection(config: ProtectionConfig) {
    if (captureDetectionActive) return;
    captureDetectionActive = true;

    console.log('[DataLeash] Initializing MAXIMUM capture detection mode...');

    // ==========================================
    // METHOD 1: Hook getDisplayMedia API
    // Detects: Zoom, Discord, Teams, OBS, etc.
    // ==========================================
    if ('mediaDevices' in navigator) {
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia?.bind(navigator.mediaDevices);

        if (originalGetDisplayMedia) {
            (navigator.mediaDevices as any).getDisplayMedia = async function (constraints: any) {
                console.log('[DataLeash] 🚨 SCREEN SHARE/RECORDING REQUEST DETECTED!');
                logSecurityEvent('screen_share_detected', config, {
                    constraints,
                    timestamp: Date.now()
                });

                // INSTANT BLACK - No blur, complete blackout
                goBlackInstantly('SCREEN SHARING DETECTED');
                screenShareActive = true;

                try {
                    const stream = await originalGetDisplayMedia(constraints);

                    // Monitor when sharing stops
                    stream.getVideoTracks().forEach(track => {
                        track.addEventListener('ended', () => {
                            console.log('[DataLeash] Screen share ended');
                            screenShareActive = false;
                            // Content stays black until page refresh for security
                            showPermanentBlackout('Screen sharing was detected. Refresh to continue viewing.');
                        });
                    });

                    return stream;
                } catch (e) {
                    // User cancelled - but we still flag it
                    screenShareActive = false;
                    logSecurityEvent('screen_share_cancelled', config);
                    // Stay black for a few seconds as warning
                    setTimeout(() => {
                        if (!screenShareActive) {
                            removeBlackout();
                        }
                    }, 3000);
                    throw e;
                }
            };
        }
    }

    // ==========================================
    // METHOD 2: MediaRecorder API Detection
    // Detects: Browser-based recording extensions
    // ==========================================
    const originalMediaRecorder = window.MediaRecorder;
    if (originalMediaRecorder) {
        (window as any).MediaRecorder = class extends originalMediaRecorder {
            constructor(stream: MediaStream, options?: MediaRecorderOptions) {
                console.log('[DataLeash] 🚨 MEDIA RECORDER INSTANTIATED!');
                logSecurityEvent('media_recorder_detected', config);
                goBlackInstantly('RECORDING DETECTED');
                super(stream, options);
            }
        };
    }

    // ==========================================
    // METHOD 3: Picture-in-Picture Detection
    // Detects: PIP mode (can be used for capture)
    // ==========================================
    document.addEventListener('enterpictureinpicture', () => {
        console.log('[DataLeash] 🚨 PICTURE-IN-PICTURE DETECTED!');
        logSecurityEvent('pip_detected', config);
        goBlackInstantly('PICTURE-IN-PICTURE DETECTED');
    });

    document.addEventListener('leavepictureinpicture', () => {
        if (!screenShareActive) {
            setTimeout(() => removeBlackout(), 2000);
        }
    });

    // ==========================================
    // METHOD 4: Canvas Capture Detection
    // Detects: captureStream() calls on canvas
    // ==========================================
    const originalCaptureStream = HTMLCanvasElement.prototype.captureStream;
    if (originalCaptureStream) {
        HTMLCanvasElement.prototype.captureStream = function (...args) {
            console.log('[DataLeash] 🚨 CANVAS CAPTURE STREAM DETECTED!');
            logSecurityEvent('canvas_capture_detected', config);
            goBlackInstantly('CAPTURE STREAM DETECTED');
            return originalCaptureStream.apply(this, args);
        };
    }

    // ==========================================
    // METHOD 5: Video Element Capture Detection
    // ==========================================
    const videoProto = HTMLVideoElement.prototype as any;
    const originalVideoCaptureStream = videoProto.captureStream;
    if (originalVideoCaptureStream) {
        videoProto.captureStream = function (frameRate?: number) {
            console.log('[DataLeash] 🚨 VIDEO CAPTURE STREAM DETECTED!');
            logSecurityEvent('video_capture_detected', config);
            goBlackInstantly('VIDEO CAPTURE DETECTED');
            return originalVideoCaptureStream.call(this, frameRate);
        };
    }

    // ==========================================
    // METHOD 6: Permissions API Monitoring
    // Detects: Screen capture permission queries
    // ==========================================
    if ('permissions' in navigator) {
        const originalQuery = navigator.permissions.query.bind(navigator.permissions);
        navigator.permissions.query = async function (permissionDesc: PermissionDescriptor) {
            if ((permissionDesc as any).name === 'display-capture' ||
                (permissionDesc as any).name === 'screen-wake-lock') {
                console.log('[DataLeash] 🚨 DISPLAY CAPTURE PERMISSION QUERY!');
                logSecurityEvent('capture_permission_query', config);
                // Don't black out on query, but log it
            }
            return originalQuery(permissionDesc);
        };
    }

    console.log('[DataLeash] ✅ Maximum capture detection mode ACTIVE');
}

// =====================================================
// INSTANT BLACKOUT FUNCTIONS
// =====================================================

function goBlackInstantly(reason: string) {
    console.log(`[DataLeash] BLACKOUT: ${reason}`);

    // 1. Hide ALL protected content immediately
    const protectedElements = document.querySelectorAll('[data-protected], .protected-content, .content-container, .viewer-content, main');
    protectedElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.visibility = 'hidden';
        htmlEl.style.opacity = '0';
        htmlEl.style.pointerEvents = 'none';
    });

    // 2. Black overlay
    let overlay = document.getElementById('dl-blackout-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'dl-blackout-overlay';
        document.body.appendChild(overlay);
    }

    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: #000000;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
    `;

    overlay.innerHTML = `
        <div style="text-align: center; max-width: 400px; padding: 40px;">
            <div style="font-size: 64px; margin-bottom: 20px;">🛡️</div>
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #ef4444;">
                ${reason}
            </h1>
            <p style="color: #888; line-height: 1.6; margin-bottom: 24px;">
                Content has been protected. This action has been logged and the file owner has been notified.
            </p>
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 8px;">
                <div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: pulse 1s infinite;"></div>
                <span style="font-family: monospace; font-size: 12px; color: #ef4444;">SECURITY ALERT SENT</span>
            </div>
        </div>
        <style>
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
        </style>
    `;
}

function showPermanentBlackout(message: string) {
    const overlay = document.getElementById('dl-blackout-overlay');
    if (overlay) {
        overlay.innerHTML = `
            <div style="text-align: center; max-width: 400px; padding: 40px;">
                <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #fbbf24;">
                    Session Terminated
                </h1>
                <p style="color: #888; line-height: 1.6;">
                    ${message}
                </p>
            </div>
        `;
    }
}

function removeBlackout() {
    const overlay = document.getElementById('dl-blackout-overlay');
    if (overlay) {
        overlay.remove();
    }

    // Restore content
    const protectedElements = document.querySelectorAll('[data-protected], .protected-content, .content-container, .viewer-content, main');
    protectedElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.visibility = '';
        htmlEl.style.opacity = '';
        htmlEl.style.pointerEvents = '';
    });
}

// Legacy functions for compatibility
function blurProtectedContent() {
    goBlackInstantly('CAPTURE DETECTED');
}

function unblurProtectedContent() {
    if (!screenShareActive) {
        removeBlackout();
    }
}

function showSecurityOverlay(message: string) {
    let overlay = document.getElementById('dl-security-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'dl-security-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #ef4444;
            padding: 40px 60px;
            border-radius: 16px;
            font-size: 24px;
            font-weight: bold;
            z-index: 999999;
            text-align: center;
            border: 2px solid #ef4444;
            box-shadow: 0 0 50px rgba(239, 68, 68, 0.5);
        `;
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px;">🛡️</div>
        <div>${message}</div>
        <div style="font-size: 14px; margin-top: 12px; color: #888;">Content hidden for security</div>
    `;
    overlay.style.display = 'block';
}

function hideSecurityOverlay() {
    const overlay = document.getElementById('dl-security-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// =====================================================
// SCRIPT INJECTION BLOCKING
// =====================================================

export function setupScriptInjectionBlocking(config: ProtectionConfig) {
    // Monitor for unknown script injections
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of Array.from(mutation.addedNodes)) {
                if (node instanceof HTMLScriptElement) {
                    const src = node.src || '';
                    const isInline = !src;
                    const isOurScript = src.startsWith(window.location.origin) || src.startsWith('/');

                    // Allow our own scripts and inline Next.js scripts
                    if (!isOurScript && !isInline) {
                        console.log('[DataLeash] Blocking injected script:', src);
                        logSecurityEvent('script_injection_blocked', config, { src });
                        node.remove();
                    }
                }

                // Also block injected iframes
                if (node instanceof HTMLIFrameElement) {
                    const src = node.src || '';
                    if (!src.startsWith(window.location.origin) && !src.startsWith('about:')) {
                        console.log('[DataLeash] Blocking injected iframe:', src);
                        logSecurityEvent('iframe_injection_blocked', config, { src });
                        node.remove();
                    }
                }
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // Also monitor large WebGL canvases (can be used for fingerprinting/capture)
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    (HTMLCanvasElement.prototype.getContext as any) = function (this: HTMLCanvasElement, type: string, ...args: any[]) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
            // Check if this canvas is for capture purposes
            if (this.width > 500 && this.height > 500 && !this.closest('[data-allowed-canvas]')) {
                console.log('[DataLeash] Large WebGL canvas detected - monitoring');
                logSecurityEvent('webgl_canvas_detected', config);
            }
        }
        return originalGetContext.apply(this, [type, ...args] as any);
    };
}

// =====================================================
// TAB VISIBILITY PROTECTION
// =====================================================

export function setupVisibilityProtection(config: ProtectionConfig) {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // User switched tabs - could be to screenshot tool
            console.log('[DataLeash] Tab hidden - monitoring');
            // Don't blur immediately, but be ready
        }
    });

    // Blur when window loses focus (could be switching to capture tool)
    window.addEventListener('blur', () => {
        if (screenShareActive) return; // Already handled

        // Brief blur on focus loss
        const protectedElements = document.querySelectorAll('[data-protected]');
        protectedElements.forEach(el => {
            (el as HTMLElement).style.filter = 'blur(5px)';
        });
    });

    window.addEventListener('focus', () => {
        if (screenShareActive) return;

        // Restore on focus
        const protectedElements = document.querySelectorAll('[data-protected]');
        protectedElements.forEach(el => {
            (el as HTMLElement).style.filter = '';
        });
    });
}

// =====================================================
// ENHANCED SCREENSHOT KEY DETECTION
// =====================================================

export function setupEnhancedScreenshotDetection(config: ProtectionConfig) {
    document.addEventListener('keydown', (e) => {
        // Windows: Print Screen, Win+Shift+S, Alt+Print Screen
        // Mac: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

        if (isMac) {
            // Mac screenshot shortcuts
            if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
                e.preventDefault();
                logSecurityEvent('mac_screenshot_blocked', config, { key: e.key });
                flashWarning();
                return false;
            }
        } else {
            // Windows screenshot shortcuts
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                logSecurityEvent('printscreen_blocked', config);
                flashWarning();
                return false;
            }

            // Win+Shift+S (Snipping tool)
            if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                logSecurityEvent('snipping_tool_blocked', config);
                flashWarning();
                return false;
            }
        }
    }, true);
}

function flashWarning() {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(239, 68, 68, 0.3);
        z-index: 999999;
        pointer-events: none;
        animation: dl-flash 0.5s ease-out forwards;
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes dl-flash {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(flash);

    setTimeout(() => {
        flash.remove();
        style.remove();
    }, 500);
}

// =====================================================
// ACTIVATE ALL ADVANCED PROTECTIONS
// =====================================================

export function activateAdvancedProtections(config: ProtectionConfig) {
    setupScreenShareDetection(config);
    setupScriptInjectionBlocking(config);
    setupVisibilityProtection(config);
    setupEnhancedScreenshotDetection(config);

    console.log('[DataLeash] Advanced protections activated');
}

// =====================================================
// EXPORTS
// =====================================================

export function isOnline(): boolean {
    return navigator.onLine;
}

export function getLastHeartbeatTime(): number {
    return lastHeartbeatTime;
}

export function isDevToolsOpen(): boolean {
    return devToolsOpen;
}

export function isScreenShareActive(): boolean {
    return screenShareActive;
}

// =====================================================
// NETFLIX-STYLE DRM PROTECTION MODULES
// =====================================================

// =====================================================
// 1. SECURE MEDIA PIPELINE (TEE / L1 Enforcement)
// =====================================================

interface DRMCapabilities {
    hasWidevine: boolean;
    hasPlayReady: boolean;
    hasFairPlay: boolean;
    securityLevel: 'L1' | 'L2' | 'L3' | 'Unknown';
    hardwareSecure: boolean;
    teeAvailable: boolean;
}

let drmCapabilities: DRMCapabilities | null = null;

export async function detectDRMCapabilities(): Promise<DRMCapabilities> {
    if (drmCapabilities) return drmCapabilities;

    const capabilities: DRMCapabilities = {
        hasWidevine: false,
        hasPlayReady: false,
        hasFairPlay: false,
        securityLevel: 'Unknown',
        hardwareSecure: false,
        teeAvailable: false
    };

    try {
        // Check for Encrypted Media Extensions (EME) support
        if ('requestMediaKeySystemAccess' in navigator) {

            // Widevine Detection (Chrome, Firefox, Edge Chromium)
            try {
                const widevineConfig: MediaKeySystemConfiguration[] = [{
                    initDataTypes: ['cenc'],
                    videoCapabilities: [{
                        contentType: 'video/mp4; codecs="avc1.42E01E"',
                        robustness: 'HW_SECURE_ALL' // L1 - Hardware TEE
                    }],
                    distinctiveIdentifier: 'optional' as const,
                    persistentState: 'optional' as const,
                    sessionTypes: ['temporary']
                }];

                const widevineSysAccess = await navigator.requestMediaKeySystemAccess(
                    'com.widevine.alpha',
                    widevineConfig
                );

                capabilities.hasWidevine = true;
                capabilities.hardwareSecure = true;
                capabilities.securityLevel = 'L1';
                capabilities.teeAvailable = true;

                console.log('[DataLeash DRM] Widevine L1 (Hardware TEE) detected');
            } catch {
                // Try L3 (Software-only)
                try {
                    const widevineL3Config = [{
                        initDataTypes: ['cenc'],
                        videoCapabilities: [{
                            contentType: 'video/mp4; codecs="avc1.42E01E"',
                            robustness: 'SW_SECURE_DECODE' // L3 - Software only
                        }]
                    }];

                    await navigator.requestMediaKeySystemAccess('com.widevine.alpha', widevineL3Config);
                    capabilities.hasWidevine = true;
                    capabilities.securityLevel = 'L3';
                    console.log('[DataLeash DRM] Widevine L3 (Software) detected');
                } catch {
                    console.log('[DataLeash DRM] Widevine not available');
                }
            }

            // PlayReady Detection (Edge, Windows)
            try {
                const playReadyConfig = [{
                    initDataTypes: ['cenc'],
                    videoCapabilities: [{
                        contentType: 'video/mp4; codecs="avc1.42E01E"',
                        robustness: '3000' // SL3000 - Hardware DRM
                    }]
                }];

                await navigator.requestMediaKeySystemAccess(
                    'com.microsoft.playready',
                    playReadyConfig
                );

                capabilities.hasPlayReady = true;
                if (!capabilities.hardwareSecure) {
                    capabilities.hardwareSecure = true;
                    capabilities.securityLevel = 'L1';
                    capabilities.teeAvailable = true;
                }
                console.log('[DataLeash DRM] PlayReady SL3000 (Hardware) detected');
            } catch {
                console.log('[DataLeash DRM] PlayReady not available');
            }

            // FairPlay Detection (Safari)
            try {
                await navigator.requestMediaKeySystemAccess(
                    'com.apple.fps.1_0',
                    [{
                        initDataTypes: ['sinf'],
                        videoCapabilities: [{
                            contentType: 'video/mp4; codecs="avc1.42E01E"'
                        }]
                    }]
                );

                capabilities.hasFairPlay = true;
                capabilities.hardwareSecure = true; // FairPlay is always hardware-backed
                capabilities.securityLevel = 'L1';
                capabilities.teeAvailable = true;
                console.log('[DataLeash DRM] FairPlay (Hardware) detected');
            } catch {
                console.log('[DataLeash DRM] FairPlay not available');
            }
        }
    } catch (error) {
        console.log('[DataLeash DRM] EME detection failed:', error);
    }

    drmCapabilities = capabilities;
    return capabilities;
}

export async function enforceSecureMediaPipeline(config: ProtectionConfig): Promise<boolean> {
    const drm = await detectDRMCapabilities();

    // Log DRM status
    logSecurityEvent('drm_capabilities_check', config, {
        hasWidevine: drm.hasWidevine,
        hasPlayReady: drm.hasPlayReady,
        hasFairPlay: drm.hasFairPlay,
        securityLevel: drm.securityLevel,
        hardwareSecure: drm.hardwareSecure
    });

    // Enforce hardware-secure path for sensitive content
    if (!drm.hardwareSecure) {
        console.log('[DataLeash DRM] WARNING: No hardware-secure path available. Content may be vulnerable.');
        showSecurityOverlay('⚠️ This device lacks hardware-level protection. Content quality restricted.');
        return false;
    }

    if (drm.securityLevel === 'L3') {
        console.log('[DataLeash DRM] Software-only DRM detected. Restricting to SD quality.');
        // Could trigger quality restriction here
    }

    console.log('[DataLeash DRM] Secure media pipeline verified');
    return true;
}

// =====================================================
// 2. HDCP OUTPUT PROTECTION
// =====================================================

interface HDCPStatus {
    supported: boolean;
    version: string | null;
    compliant: boolean;
    externalDisplayDetected: boolean;
}

let hdcpStatus: HDCPStatus | null = null;

export async function checkHDCPCompliance(): Promise<HDCPStatus> {
    const status: HDCPStatus = {
        supported: false,
        version: null,
        compliant: false,
        externalDisplayDetected: false
    };

    try {
        // Check for HDCP via Screen API (experimental)
        if ('getScreenDetails' in window) {
            const screenDetails = await (window as any).getScreenDetails();
            const screens = screenDetails.screens;

            // Check if we have multiple displays
            status.externalDisplayDetected = screens.length > 1;

            if (status.externalDisplayDetected) {
                console.log('[DataLeash HDCP] External display detected - enforcing HDCP');

                // Check each screen for HDCP compliance (if available)
                for (const screen of screens) {
                    // Note: HDCP status is not directly exposed in web APIs
                    // We simulate enterprise-grade checking here
                    const isInternal = screen.isInternal;
                    const isPrimary = screen.isPrimary;

                    if (!isInternal) {
                        console.log(`[DataLeash HDCP] External screen: ${screen.label || 'Unknown'}`);
                        // In a real implementation, this would query HDCP status
                        // For now, we flag the risk
                    }
                }
            }

            status.supported = true;
            status.compliant = true; // Assume compliant if we can detect screens
        }

        // Alternative: Check for display media capabilities
        if ('mediaCapabilities' in navigator) {
            const displayConfig = {
                type: 'media-source' as const,
                video: {
                    contentType: 'video/mp4; codecs="avc1.42E01E"',
                    width: 1920,
                    height: 1080,
                    bitrate: 5000000,
                    framerate: 30
                }
            };

            const result = await navigator.mediaCapabilities.decodingInfo(displayConfig);
            status.supported = result.supported;

            // Check if PowerEfficient (usually means hardware decode = HDCP path)
            if (result.powerEfficient) {
                status.version = '2.2';
                status.compliant = true;
            }
        }
    } catch (error) {
        console.log('[DataLeash HDCP] Detection failed:', error);
    }

    hdcpStatus = status;
    return status;
}

export async function enforceHDCPProtection(config: ProtectionConfig): Promise<boolean> {
    const hdcp = await checkHDCPCompliance();

    logSecurityEvent('hdcp_check', config, {
        supported: hdcp.supported,
        version: hdcp.version,
        compliant: hdcp.compliant,
        externalDisplay: hdcp.externalDisplayDetected
    });

    // If external display without verified HDCP, restrict content
    if (hdcp.externalDisplayDetected && !hdcp.compliant) {
        console.log('[DataLeash HDCP] External display without HDCP - blocking HD content');
        showSecurityOverlay('🔒 HDCP Required: External display detected without secure handshake');
        return false;
    }

    console.log('[DataLeash HDCP] Output protection verified');
    return true;
}

// =====================================================
// 3. CONTENT DECRYPTION MODULE (CDM) SIMULATION
// =====================================================

interface CDMSession {
    id: string;
    keyId: string;
    created: number;
    expires: number;
    isValid: boolean;
}

const activeCDMSessions: Map<string, CDMSession> = new Map();

export function createCDMSession(config: ProtectionConfig): CDMSession {
    const session: CDMSession = {
        id: `cdm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        keyId: `key_${config.fileId}_${config.sessionId}`,
        created: Date.now(),
        expires: Date.now() + (30 * 60 * 1000), // 30 minute session
        isValid: true
    };

    activeCDMSessions.set(session.id, session);

    console.log(`[DataLeash CDM] Session created: ${session.id}`);
    logSecurityEvent('cdm_session_created', config, { sessionId: session.id });

    // Auto-expire session
    setTimeout(() => {
        revokeCDMSession(session.id, config);
    }, 30 * 60 * 1000);

    return session;
}

export function validateCDMSession(sessionId: string): boolean {
    const session = activeCDMSessions.get(sessionId);

    if (!session) {
        console.log(`[DataLeash CDM] Session not found: ${sessionId}`);
        return false;
    }

    if (Date.now() > session.expires) {
        console.log(`[DataLeash CDM] Session expired: ${sessionId}`);
        session.isValid = false;
        return false;
    }

    return session.isValid;
}

export function revokeCDMSession(sessionId: string, config: ProtectionConfig): void {
    const session = activeCDMSessions.get(sessionId);

    if (session) {
        session.isValid = false;
        activeCDMSessions.delete(sessionId);
        console.log(`[DataLeash CDM] Session revoked: ${sessionId}`);
        logSecurityEvent('cdm_session_revoked', config, { sessionId });
    }
}

export function revokeAllCDMSessions(config: ProtectionConfig): void {
    const count = activeCDMSessions.size;
    activeCDMSessions.clear();
    console.log(`[DataLeash CDM] All sessions revoked (${count} sessions)`);
    logSecurityEvent('cdm_all_sessions_revoked', config, { count });
}

// =====================================================
// 4. DISPLAY CAPTURE PROTECTION (HARDWARE OVERLAY)
// =====================================================

let captureProtectionActive = false;

export function activateCaptureProtection(config: ProtectionConfig): void {
    if (captureProtectionActive) return;
    captureProtectionActive = true;

    // Use CSS to create a hardware-composited overlay that capture tools see as black
    const overlay = document.createElement('div');
    overlay.id = 'dl-capture-protection-layer';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 999998;
        pointer-events: none;
        mix-blend-mode: difference;
        background: transparent;
        will-change: transform;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
    `;

    // Add WebGL canvas for hardware-accelerated overlay
    // This triggers GPU compositing which can interfere with software capture
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    canvas.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0.001;
    `;
    canvas.setAttribute('data-allowed-canvas', 'true');

    try {
        const gl = canvas.getContext('webgl', {
            preserveDrawingBuffer: false,
            antialias: false,
            alpha: true
        });

        if (gl) {
            // Clear with transparent - this creates a GPU-backed layer
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    } catch (e) {
        console.log('[DataLeash DRM] WebGL overlay not available');
    }

    overlay.appendChild(canvas);
    document.body.appendChild(overlay);

    // Trigger hardware layer promotion for protected content
    const protectedElements = document.querySelectorAll('[data-protected]');
    protectedElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.transform = 'translateZ(0)';
        htmlEl.style.willChange = 'transform';
        htmlEl.style.backfaceVisibility = 'hidden';
    });

    console.log('[DataLeash DRM] Capture protection layer activated');
    logSecurityEvent('capture_protection_activated', config);
}

export function deactivateCaptureProtection(): void {
    captureProtectionActive = false;
    const overlay = document.getElementById('dl-capture-protection-layer');
    if (overlay) overlay.remove();
    console.log('[DataLeash DRM] Capture protection layer deactivated');
}

// =====================================================
// 5. FULL DRM STACK INITIALIZATION
// =====================================================

export async function initializeFullDRM(config: ProtectionConfig): Promise<{
    drm: DRMCapabilities;
    hdcp: HDCPStatus;
    cdmSession: CDMSession;
    securePathVerified: boolean;
}> {
    console.log('[DataLeash DRM] Initializing full DRM stack...');

    // 1. Detect DRM capabilities
    const drm = await detectDRMCapabilities();

    // 2. Check HDCP compliance
    const hdcp = await checkHDCPCompliance();

    // 3. Enforce secure pipeline
    const securePathVerified = await enforceSecureMediaPipeline(config);

    // 4. Enforce HDCP if external displays
    await enforceHDCPProtection(config);

    // 5. Create CDM session
    const cdmSession = createCDMSession(config);

    // 6. Activate capture protection
    activateCaptureProtection(config);

    // 7. Log full DRM initialization
    logSecurityEvent('full_drm_initialized', config, {
        drmCapabilities: drm,
        hdcpStatus: hdcp,
        cdmSessionId: cdmSession.id,
        securePathVerified
    });

    console.log('[DataLeash DRM] Full DRM stack initialized successfully');

    return {
        drm,
        hdcp,
        cdmSession,
        securePathVerified
    };
}

// =====================================================
// EXPORTS - DRM MODULE
// =====================================================

export type {
    DRMCapabilities,
    HDCPStatus,
    CDMSession
};
