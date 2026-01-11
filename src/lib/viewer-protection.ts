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

    // Blur any remaining content
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
    details?: Record<string, any>
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
// SCREEN SHARE / RECORDING DETECTION
// =====================================================

let screenShareActive = false;
let screenShareCheckInterval: NodeJS.Timeout | null = null;

export function setupScreenShareDetection(config: ProtectionConfig) {
    // Method 1: Detect if getDisplayMedia was requested
    // We can't stop it, but we can detect when sharing starts

    // Monitor for screen capture via experimental API
    if ('mediaDevices' in navigator) {
        // Override getDisplayMedia to detect when it's called
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia?.bind(navigator.mediaDevices);

        if (originalGetDisplayMedia) {
            (navigator.mediaDevices as any).getDisplayMedia = async function (constraints: any) {
                console.log('[DataLeash] Screen share/recording request detected!');
                logSecurityEvent('screen_share_detected', config);

                // Blur content immediately
                blurProtectedContent();
                screenShareActive = true;

                try {
                    const stream = await originalGetDisplayMedia(constraints);

                    // Monitor when sharing stops
                    stream.getVideoTracks().forEach(track => {
                        track.addEventListener('ended', () => {
                            console.log('[DataLeash] Screen share ended');
                            screenShareActive = false;
                            unblurProtectedContent();
                        });
                    });

                    return stream;
                } catch (e) {
                    // User cancelled - unblur
                    screenShareActive = false;
                    unblurProtectedContent();
                    throw e;
                }
            };
        }
    }

    // Method 2: Detect Picture-in-Picture (could be used for recording)
    document.addEventListener('enterpictureinpicture', () => {
        console.log('[DataLeash] Picture-in-Picture detected');
        logSecurityEvent('pip_detected', config);
        blurProtectedContent();
    });

    document.addEventListener('leavepictureinpicture', () => {
        if (!screenShareActive) {
            unblurProtectedContent();
        }
    });
}

function blurProtectedContent() {
    const protectedElements = document.querySelectorAll('[data-protected], .protected-content, .content-container');
    protectedElements.forEach(el => {
        (el as HTMLElement).style.filter = 'blur(30px)';
        (el as HTMLElement).style.transition = 'filter 0.1s';
    });

    // Also show warning overlay
    showSecurityOverlay('Screen Sharing Detected - Content Protected');
}

function unblurProtectedContent() {
    const protectedElements = document.querySelectorAll('[data-protected], .protected-content, .content-container');
    protectedElements.forEach(el => {
        (el as HTMLElement).style.filter = '';
    });

    hideSecurityOverlay();
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
    // Monitor for any script injections
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

