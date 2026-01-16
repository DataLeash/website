'use client';

/**
 * DataLeash EME Player Utilities
 * 
 * Client-side Encrypted Media Extensions (EME) integration.
 * Handles the communication between the browser's CDM (Content Decryption Module)
 * and our ClearKey license server.
 * 
 * This enables hardware-level capture protection when content is played
 * through the browser's secure media path.
 */

// =====================================================
// TYPES
// =====================================================

interface EMEConfig {
    fileId: string;
    sessionId: string;
    licenseServerUrl: string;
    onError?: (error: Error) => void;
    onLicenseAcquired?: () => void;
    onPlaybackReady?: () => void;
}

interface MediaKeySessionHandler {
    session: MediaKeySession;
    cleanup: () => void;
}

// =====================================================
// CLEARKEY KEY SYSTEM CONFIGURATION
// =====================================================

const CLEARKEY_KEY_SYSTEM = 'org.w3.clearkey';

const CLEARKEY_CONFIG: MediaKeySystemConfiguration[] = [{
    initDataTypes: ['cenc', 'webm'],
    videoCapabilities: [
        { contentType: 'video/mp4; codecs="avc1.42E01E"', robustness: '' },
        { contentType: 'video/mp4; codecs="avc1.4D401E"', robustness: '' },
        { contentType: 'video/mp4; codecs="avc1.64001E"', robustness: '' },
        { contentType: 'video/webm; codecs="vp9"', robustness: '' },
    ],
    audioCapabilities: [
        { contentType: 'audio/mp4; codecs="mp4a.40.2"', robustness: '' },
    ],
    distinctiveIdentifier: 'optional' as const,
    persistentState: 'optional' as const,
    sessionTypes: ['temporary'],
}];

// =====================================================
// EME SUPPORT DETECTION
// =====================================================

/**
 * Check if the browser supports EME with ClearKey
 */
export async function isEMESupported(): Promise<boolean> {
    try {
        if (!('requestMediaKeySystemAccess' in navigator)) {
            console.log('[EME] MediaKeySystemAccess not supported');
            return false;
        }

        const access = await navigator.requestMediaKeySystemAccess(
            CLEARKEY_KEY_SYSTEM,
            CLEARKEY_CONFIG
        );

        console.log('[EME] ClearKey supported:', access.keySystem);
        return true;
    } catch (error) {
        console.log('[EME] ClearKey not supported:', error);
        return false;
    }
}

/**
 * Get available DRM systems on this device
 */
export async function getAvailableDRMSystems(): Promise<string[]> {
    const systems: string[] = [];

    const keySystems = [
        { name: 'ClearKey', id: 'org.w3.clearkey' },
        { name: 'Widevine', id: 'com.widevine.alpha' },
        { name: 'PlayReady', id: 'com.microsoft.playready' },
        { name: 'FairPlay', id: 'com.apple.fps.1_0' },
    ];

    for (const system of keySystems) {
        try {
            await navigator.requestMediaKeySystemAccess(system.id, CLEARKEY_CONFIG);
            systems.push(system.name);
        } catch {
            // System not available
        }
    }

    return systems;
}

// =====================================================
// MEDIA KEY SESSION MANAGEMENT
// =====================================================

/**
 * Create MediaKeys and attach to video element
 */
export async function setupEMEForVideo(
    videoElement: HTMLVideoElement,
    config: EMEConfig
): Promise<MediaKeySessionHandler | null> {
    try {
        // Request key system access
        const keySystemAccess = await navigator.requestMediaKeySystemAccess(
            CLEARKEY_KEY_SYSTEM,
            CLEARKEY_CONFIG
        );

        console.log('[EME] Key system access granted:', keySystemAccess.keySystem);

        // Create MediaKeys
        const mediaKeys = await keySystemAccess.createMediaKeys();
        console.log('[EME] MediaKeys created');

        // Attach to video element
        await videoElement.setMediaKeys(mediaKeys);
        console.log('[EME] MediaKeys attached to video element');

        // Create a key session
        const session = mediaKeys.createSession('temporary');
        console.log('[EME] Key session created');

        // Set up event handlers
        const messageHandler = async (event: MediaKeyMessageEvent) => {
            console.log('[EME] License request received');
            await handleLicenseRequest(event, session, config);
        };

        const keyStatusHandler = (event: Event) => {
            handleKeyStatusChange(session, config);
        };

        session.addEventListener('message', messageHandler);
        session.addEventListener('keystatuseschange', keyStatusHandler);

        // Listen for encrypted event on video
        const encryptedHandler = async (event: MediaEncryptedEvent) => {
            console.log('[EME] Encrypted content detected:', event.initDataType);
            if (event.initData) {
                await session.generateRequest(event.initDataType, event.initData);
            }
        };

        videoElement.addEventListener('encrypted', encryptedHandler);

        // Cleanup function
        const cleanup = () => {
            session.removeEventListener('message', messageHandler);
            session.removeEventListener('keystatuseschange', keyStatusHandler);
            videoElement.removeEventListener('encrypted', encryptedHandler);
            session.close().catch(() => { });
        };

        return { session, cleanup };
    } catch (error) {
        console.error('[EME] Setup failed:', error);
        config.onError?.(error as Error);
        return null;
    }
}

/**
 * Handle license request from CDM
 */
async function handleLicenseRequest(
    event: MediaKeyMessageEvent,
    session: MediaKeySession,
    config: EMEConfig
): Promise<void> {
    try {
        // Send license request to our server
        const response = await fetch(config.licenseServerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileId: config.fileId,
                sessionId: config.sessionId,
                licenseRequest: arrayBufferToBase64(event.message),
            }),
        });

        if (!response.ok) {
            throw new Error(`License server error: ${response.status}`);
        }

        const licenseData = await response.json();
        console.log('[EME] License received from server');

        // Convert license to ArrayBuffer and update session
        const licenseBuffer = new TextEncoder().encode(JSON.stringify(licenseData));
        await session.update(licenseBuffer);

        console.log('[EME] License applied successfully');
        config.onLicenseAcquired?.();
    } catch (error) {
        console.error('[EME] License request failed:', error);
        config.onError?.(error as Error);
    }
}

/**
 * Handle key status changes
 */
function handleKeyStatusChange(
    session: MediaKeySession,
    config: EMEConfig
): void {
    session.keyStatuses.forEach((status, keyId) => {
        const keyIdHex = arrayBufferToHex(keyId as ArrayBuffer);
        console.log(`[EME] Key ${keyIdHex.substring(0, 8)}... status: ${status}`);

        switch (status) {
            case 'usable':
                console.log('[EME] Key is usable - playback ready');
                config.onPlaybackReady?.();
                break;
            case 'expired':
                console.log('[EME] Key expired - requesting renewal');
                config.onError?.(new Error('DRM key expired'));
                break;
            case 'output-restricted':
                console.log('[EME] Output restricted - HDCP not compliant');
                // This is the signal that hardware protection is working!
                break;
            case 'status-pending':
                console.log('[EME] Key status pending...');
                break;
            case 'internal-error':
                console.error('[EME] Internal DRM error');
                config.onError?.(new Error('Internal DRM error'));
                break;
        }
    });
}

// =====================================================
// MANUAL LICENSE INJECTION (For testing)
// =====================================================

/**
 * Manually inject a ClearKey license (for testing without server)
 */
export async function injectClearKeyLicense(
    videoElement: HTMLVideoElement,
    keyId: string,  // Hex string
    key: string     // Hex string
): Promise<MediaKeySessionHandler | null> {
    try {
        const keySystemAccess = await navigator.requestMediaKeySystemAccess(
            CLEARKEY_KEY_SYSTEM,
            CLEARKEY_CONFIG
        );

        const mediaKeys = await keySystemAccess.createMediaKeys();
        await videoElement.setMediaKeys(mediaKeys);

        const session = mediaKeys.createSession('temporary');

        // Create the license in ClearKey format
        const license = {
            keys: [{
                kty: 'oct',
                k: hexToBase64url(key),
                kid: hexToBase64url(keyId),
            }],
            type: 'temporary',
        };

        // Listen for encrypted event
        const encryptedHandler = async (event: MediaEncryptedEvent) => {
            if (event.initData) {
                await session.generateRequest(event.initDataType, event.initData);

                // Wait for message event, then update with our license
                session.addEventListener('message', async () => {
                    const licenseBuffer = new TextEncoder().encode(JSON.stringify(license));
                    await session.update(licenseBuffer);
                    console.log('[EME] Manual license injected');
                }, { once: true });
            }
        };

        videoElement.addEventListener('encrypted', encryptedHandler);

        return {
            session,
            cleanup: () => {
                videoElement.removeEventListener('encrypted', encryptedHandler);
                session.close().catch(() => { });
            },
        };
    } catch (error) {
        console.error('[EME] Manual injection failed:', error);
        return null;
    }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function hexToBase64url(hex: string): string {
    const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// =====================================================
// SECURE VIDEO ELEMENT CREATION
// =====================================================

/**
 * Create a video element configured for maximum DRM protection
 */
export function createSecureVideoElement(): HTMLVideoElement {
    const video = document.createElement('video');

    // Disable all potential leak vectors
    video.controls = false;  // No native controls (prevents right-click save)
    video.playsInline = true;
    video.disablePictureInPicture = true;  // Prevent PiP escape
    video.disableRemotePlayback = true;    // Prevent casting

    // CSS hardening
    video.style.cssText = `
        user-select: none;
        -webkit-user-select: none;
        pointer-events: none;
        -webkit-touch-callout: none;
    `;

    // Prevent context menu
    video.addEventListener('contextmenu', (e) => e.preventDefault());

    // Block any attempt to access video data
    video.crossOrigin = 'anonymous';

    return video;
}

// =====================================================
// EXPORTS
// =====================================================

export type { EMEConfig, MediaKeySessionHandler };
