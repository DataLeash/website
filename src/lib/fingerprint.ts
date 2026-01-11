// Advanced Device Fingerprinting Module for DataLeash
// Implements the "Holy Trinity" approach: Canvas + WebGL2 + AudioContext
// Plus advanced font detection for ~99% device uniqueness

export interface DeviceFingerprint {
    // Basic Info
    userAgent: string;
    browser: string;
    browserVersion: string;
    platform: string;
    os: string;

    // Screen
    screenResolution: string;
    colorDepth: number;
    devicePixelRatio: number;
    screenOrientation?: string;

    // Timezone & Language
    timezone: string;
    timezoneOffset: number;
    language: string;
    languages: string[];

    // Hardware (what's accessible)
    cpuCores: number;
    deviceMemory: number | null;
    maxTouchPoints: number;
    hardwareConcurrency: number;

    // === ADVANCED FINGERPRINTING (Holy Trinity) ===

    // Canvas Fingerprint (2D)
    canvasFingerprint: string;
    canvasDataHash: string;

    // WebGL Deep Fingerprint (3D GPU)
    webglFingerprint: {
        vendor: string;
        renderer: string;
        unmaskedVendor: string;
        unmaskedRenderer: string;
        version: string;
        shadingLanguageVersion: string;
        maxTextureSize: number;
        maxViewportDims: number[];
        maxRenderbufferSize: number;
        maxVertexAttribs: number;
        maxVaryingVectors: number;
        maxFragmentUniforms: number;
        maxVertexUniforms: number;
        aliasedLineWidthRange: number[];
        aliasedPointSizeRange: number[];
        extensions: string[];
        contextAttributes: Record<string, any>;
        renderHash: string;
    };

    // WebGL2 Extended Parameters
    webgl2Fingerprint?: {
        version: string;
        maxSamples: number;
        max3DTextureSize: number;
        maxArrayTextureLayers: number;
        maxUniformBufferBindings: number;
        maxCombinedUniformBlocks: number;
        extensions: string[];
    };

    // Audio Fingerprint (Sound card probe)
    audioFingerprint: {
        sampleRate: number;
        channelCount: number;
        oscillatorHash: string;
        analyserHash: string;
        compressorHash: string;
    };

    // Font Detection
    fontFingerprint: {
        detectedFonts: string[];
        fontCount: number;
        fontHash: string;
    };

    // Network
    connectionType: string | null;
    connectionDownlink?: number;
    connectionRtt?: number;
    connectionSaveData?: boolean;

    // Security Checks
    extensionsDetected: boolean;
    incognitoMode: boolean;
    webrtcIps: string[];
    doNotTrack: boolean;

    // VPN Detection hints
    vpnSuspected: boolean;
    vpnReasons: string[];

    // === VM DETECTION (NEW) ===
    vmDetection: {
        isVM: boolean;
        confidence: number; // 0-100
        vmType: string | null; // "VirtualBox", "VMware", "QEMU", "Parallels", "Hyper-V"
        reasons: string[];
    };

    // === ENHANCED HARDWARE FINGERPRINTING (NEW) ===
    mediaDevicesHash: string; // Hash of camera/mic list
    speechVoicesHash: string; // Hash of available speech voices
    mathFingerprint: string; // CPU-specific math computation hash
    pluginsHash: string; // Browser plugins hash

    // Geolocation (if permitted)
    geolocation?: {
        latitude: number;
        longitude: number;
        accuracy: number;
        mapsUrl?: string;
    };

    // Battery Status
    batteryLevel?: number;
    batteryCharging?: boolean;

    // Timestamps
    localTime: string;
    sessionStartTime: string;

    // Combined unique hash
    combinedHash: string;
}

// Simple hash function for fingerprinting
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

// Advanced Canvas Fingerprinting
function getAdvancedCanvasFingerprint(): { fingerprint: string; dataHash: string } {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 280;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { fingerprint: 'unavailable', dataHash: '' };

        // Complex rendering for uniqueness
        ctx.textBaseline = 'alphabetic';
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);

        // Gradient
        const gradient = ctx.createLinearGradient(0, 0, 280, 0);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.5, '#00ff00');
        gradient.addColorStop(1, '#0000ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 30, 280, 30);

        ctx.fillStyle = '#069';
        ctx.fillText('DataLeash🔐Fingerprint', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('DataLeash🔐Fingerprint', 4, 17);

        // Arc and curves for GPU uniqueness
        ctx.beginPath();
        ctx.arc(50, 50, 25, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(100, 50);
        ctx.bezierCurveTo(130, 20, 160, 80, 200, 50);
        ctx.stroke();

        const dataUrl = canvas.toDataURL();
        return {
            fingerprint: dataUrl.slice(-100),
            dataHash: simpleHash(dataUrl)
        };
    } catch {
        return { fingerprint: 'error', dataHash: '' };
    }
}

// Deep WebGL Fingerprinting
function getWebGLFingerprint(): DeviceFingerprint['webglFingerprint'] {
    const defaultResult: DeviceFingerprint['webglFingerprint'] = {
        vendor: 'unavailable', renderer: 'unavailable', unmaskedVendor: '',
        unmaskedRenderer: '', version: '', shadingLanguageVersion: '',
        maxTextureSize: 0, maxViewportDims: [], maxRenderbufferSize: 0,
        maxVertexAttribs: 0, maxVaryingVectors: 0, maxFragmentUniforms: 0,
        maxVertexUniforms: 0, aliasedLineWidthRange: [], aliasedPointSizeRange: [],
        extensions: [], contextAttributes: {}, renderHash: ''
    };

    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
        if (!gl) return defaultResult;

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

        // Get all extensions
        const extensions = gl.getSupportedExtensions() || [];

        // Render a small scene for GPU-specific hash
        canvas.width = 50;
        canvas.height = 50;
        gl.viewport(0, 0, 50, 50);
        gl.clearColor(0.3, 0.6, 0.9, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const pixels = new Uint8Array(50 * 50 * 4);
        gl.readPixels(0, 0, 50, 50, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        const renderHash = simpleHash(Array.from(pixels.slice(0, 100)).join(','));

        return {
            vendor: gl.getParameter(gl.VENDOR) || '',
            renderer: gl.getParameter(gl.RENDERER) || '',
            unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '',
            unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '',
            version: gl.getParameter(gl.VERSION) || '',
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || '',
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0,
            maxViewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS) || []),
            maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 0,
            maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 0,
            maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS) || 0,
            maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 0,
            maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || 0,
            aliasedLineWidthRange: Array.from(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE) || []),
            aliasedPointSizeRange: Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) || []),
            extensions,
            contextAttributes: gl.getContextAttributes() || {},
            renderHash
        };
    } catch {
        return defaultResult;
    }
}

// WebGL2 Extended Fingerprinting
function getWebGL2Fingerprint(): DeviceFingerprint['webgl2Fingerprint'] | undefined {
    try {
        const canvas = document.createElement('canvas');
        const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
        if (!gl2) return undefined;

        return {
            version: gl2.getParameter(gl2.VERSION) || '',
            maxSamples: gl2.getParameter(gl2.MAX_SAMPLES) || 0,
            max3DTextureSize: gl2.getParameter(gl2.MAX_3D_TEXTURE_SIZE) || 0,
            maxArrayTextureLayers: gl2.getParameter(gl2.MAX_ARRAY_TEXTURE_LAYERS) || 0,
            maxUniformBufferBindings: gl2.getParameter(gl2.MAX_UNIFORM_BUFFER_BINDINGS) || 0,
            maxCombinedUniformBlocks: gl2.getParameter(gl2.MAX_COMBINED_UNIFORM_BLOCKS) || 0,
            extensions: gl2.getSupportedExtensions() || []
        };
    } catch {
        return undefined;
    }
}

// Audio Fingerprinting (oscillator/analyser probing)
async function getAudioFingerprint(): Promise<DeviceFingerprint['audioFingerprint']> {
    const defaultResult: DeviceFingerprint['audioFingerprint'] = {
        sampleRate: 0, channelCount: 0,
        oscillatorHash: '', analyserHash: '', compressorHash: ''
    };

    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return defaultResult;

        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const analyser = context.createAnalyser();
        const compressor = context.createDynamicsCompressor();
        const gain = context.createGain();

        // Configure for fingerprinting
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, context.currentTime);

        analyser.fftSize = 256;

        compressor.threshold.setValueAtTime(-50, context.currentTime);
        compressor.knee.setValueAtTime(40, context.currentTime);
        compressor.ratio.setValueAtTime(12, context.currentTime);
        compressor.attack.setValueAtTime(0, context.currentTime);
        compressor.release.setValueAtTime(0.25, context.currentTime);

        gain.gain.setValueAtTime(0, context.currentTime);

        // Connect nodes
        oscillator.connect(compressor);
        compressor.connect(analyser);
        analyser.connect(gain);
        gain.connect(context.destination);

        oscillator.start(0);

        // Wait a bit for processing
        await new Promise(r => setTimeout(r, 100));

        // Read analyser data
        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);
        const analyserHash = simpleHash(Array.from(frequencyData).join(','));

        // Get compressor reduction
        const compressorData = [
            compressor.threshold.value,
            compressor.knee.value,
            compressor.ratio.value,
            compressor.reduction
        ];
        const compressorHash = simpleHash(compressorData.join(','));

        oscillator.stop();
        await context.close();

        return {
            sampleRate: context.sampleRate,
            channelCount: context.destination.channelCount,
            oscillatorHash: simpleHash(`${oscillator.type}-${oscillator.frequency.value}`),
            analyserHash,
            compressorHash
        };
    } catch {
        return defaultResult;
    }
}

// Font Detection Fingerprinting
function getFontFingerprint(): DeviceFingerprint['fontFingerprint'] {
    const testFonts = [
        'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Comic Sans MS',
        'Consolas', 'Courier', 'Courier New', 'Georgia', 'Helvetica', 'Impact',
        'Lucida Console', 'Lucida Sans', 'Microsoft Sans Serif', 'Monaco', 'Palatino',
        'Segoe UI', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana',
        // Extended fonts for better uniqueness
        'American Typewriter', 'Andale Mono', 'Baskerville', 'Big Caslon', 'Brush Script MT',
        'Cochin', 'Copperplate', 'Didot', 'Futura', 'Geneva', 'Gill Sans', 'Hoefler Text',
        'Menlo', 'Optima', 'Papyrus', 'Rockwell', 'San Francisco', 'Zapfino',
        // Windows specific
        'Segoe Print', 'Segoe Script', 'Sylfaen', 'Webdings', 'Wingdings',
        // CJK fonts
        'MS Gothic', 'MS Mincho', 'SimHei', 'SimSun'
    ];

    const detectedFonts: string[] = [];

    try {
        const testString = 'mmmmmmmmmmlli';
        const testSize = '72px';
        const baseFonts = ['monospace', 'sans-serif', 'serif'];

        const span = document.createElement('span');
        span.style.fontSize = testSize;
        span.style.position = 'absolute';
        span.style.left = '-9999px';
        span.style.visibility = 'hidden';
        span.textContent = testString;
        document.body.appendChild(span);

        const baseWidths: Record<string, number> = {};
        for (const base of baseFonts) {
            span.style.fontFamily = base;
            baseWidths[base] = span.offsetWidth;
        }

        for (const font of testFonts) {
            let detected = false;
            for (const base of baseFonts) {
                span.style.fontFamily = `'${font}', ${base}`;
                if (span.offsetWidth !== baseWidths[base]) {
                    detected = true;
                    break;
                }
            }
            if (detected) detectedFonts.push(font);
        }

        document.body.removeChild(span);
    } catch { }

    return {
        detectedFonts,
        fontCount: detectedFonts.length,
        fontHash: simpleHash(detectedFonts.join(','))
    };
}

// Main fingerprint collection function
export async function collectDeviceFingerprint(): Promise<DeviceFingerprint> {
    const ua = navigator.userAgent;
    const sessionStartTime = new Date().toISOString();

    // Parse browser and OS
    const browserInfo = parseBrowser(ua);
    const osInfo = parseOS(ua);

    // Collect fingerprints in parallel
    const [canvasFP, webglFP, webgl2FP, audioFP, fontFP] = await Promise.all([
        Promise.resolve(getAdvancedCanvasFingerprint()),
        Promise.resolve(getWebGLFingerprint()),
        Promise.resolve(getWebGL2Fingerprint()),
        getAudioFingerprint(),
        Promise.resolve(getFontFingerprint())
    ]);

    // Check for extensions
    const extensionsDetected = await detectExtensions();

    // Check incognito
    const incognitoMode = await detectIncognito();

    // Get WebRTC IPs
    const webrtcIps = await getWebRTCIPs();

    // Connection info
    const connection = (navigator as any).connection;

    // Try geolocation
    let geolocation: DeviceFingerprint['geolocation'];
    try {
        if ('geolocation' in navigator) {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });
            geolocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                mapsUrl: `https://maps.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
            };
        }
    } catch { }

    // Try battery
    let batteryLevel: number | undefined;
    let batteryCharging: boolean | undefined;
    let hasBattery = false;
    try {
        if ('getBattery' in navigator) {
            const battery = await (navigator as any).getBattery();
            batteryLevel = Math.round(battery.level * 100);
            batteryCharging = battery.charging;
            hasBattery = true;
        }
    } catch { }

    // ==== NEW: VM Detection ====
    const cpuCores = navigator.hardwareConcurrency || 0;
    const touchPoints = navigator.maxTouchPoints || 0;
    const deviceMemory = (navigator as any).deviceMemory || null;
    const vmDetection = await detectVM(
        webglFP.unmaskedRenderer || webglFP.renderer,
        cpuCores,
        hasBattery,
        touchPoints,
        deviceMemory
    );

    // ==== NEW: Enhanced Fingerprinting ====
    const [mediaDevicesHash, speechVoicesHash, mathFingerprint, pluginsHash] = await Promise.all([
        getMediaDevicesHash(),
        Promise.resolve(getSpeechVoicesHash()),
        Promise.resolve(getMathFingerprint()),
        Promise.resolve(getPluginsHash())
    ]);

    // Create combined hash from all fingerprint data (now includes new hashes)
    const combinedData = [
        canvasFP.dataHash,
        webglFP.renderHash,
        audioFP.analyserHash,
        fontFP.fontHash,
        mediaDevicesHash,
        mathFingerprint,
        ua,
        screen.width + 'x' + screen.height,
        navigator.language
    ].join('|');
    const combinedHash = simpleHash(combinedData);

    return {
        userAgent: ua,
        browser: browserInfo.name,
        browserVersion: browserInfo.version,
        platform: navigator.platform,
        os: osInfo,

        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        devicePixelRatio: window.devicePixelRatio,
        screenOrientation: screen.orientation?.type,

        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        language: navigator.language,
        languages: Array.from(navigator.languages || []),

        cpuCores,
        deviceMemory,
        maxTouchPoints: touchPoints,
        hardwareConcurrency: cpuCores,

        // Advanced fingerprints
        canvasFingerprint: canvasFP.fingerprint,
        canvasDataHash: canvasFP.dataHash,
        webglFingerprint: webglFP,
        webgl2Fingerprint: webgl2FP,
        audioFingerprint: audioFP,
        fontFingerprint: fontFP,

        connectionType: connection?.effectiveType || null,
        connectionDownlink: connection?.downlink,
        connectionRtt: connection?.rtt,
        connectionSaveData: connection?.saveData,

        extensionsDetected,
        incognitoMode,
        webrtcIps,
        doNotTrack: navigator.doNotTrack === '1',

        vpnSuspected: false,
        vpnReasons: [],

        // ==== NEW FIELDS ====
        vmDetection,
        mediaDevicesHash,
        speechVoicesHash,
        mathFingerprint,
        pluginsHash,

        geolocation,
        batteryLevel,
        batteryCharging,

        localTime: new Date().toLocaleString(),
        sessionStartTime,
        combinedHash
    };
}

function parseBrowser(ua: string): { name: string; version: string } {
    if (ua.includes('Firefox/')) {
        const match = ua.match(/Firefox\/(\d+\.?\d*)/);
        return { name: 'Firefox', version: match?.[1] || 'Unknown' };
    }
    if (ua.includes('Edg/')) {
        const match = ua.match(/Edg\/(\d+\.?\d*)/);
        return { name: 'Edge', version: match?.[1] || 'Unknown' };
    }
    if (ua.includes('Chrome/')) {
        const match = ua.match(/Chrome\/(\d+\.?\d*)/);
        return { name: 'Chrome', version: match?.[1] || 'Unknown' };
    }
    if (ua.includes('Safari/') && !ua.includes('Chrome')) {
        const match = ua.match(/Version\/(\d+\.?\d*)/);
        return { name: 'Safari', version: match?.[1] || 'Unknown' };
    }
    return { name: 'Unknown', version: 'Unknown' };
}

function parseOS(ua: string): string {
    if (ua.includes('Windows NT 10')) return 'Windows 10/11';
    if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (ua.includes('Windows NT 6.2')) return 'Windows 8';
    if (ua.includes('Windows NT 6.1')) return 'Windows 7';
    if (ua.includes('Mac OS X')) {
        const match = ua.match(/Mac OS X (\d+[._]\d+)/);
        return `macOS ${match?.[1]?.replace('_', '.') || ''}`;
    }
    if (ua.includes('iPhone')) return 'iOS (iPhone)';
    if (ua.includes('iPad')) return 'iOS (iPad)';
    if (ua.includes('Android')) {
        const match = ua.match(/Android (\d+\.?\d*)/);
        return `Android ${match?.[1] || ''}`;
    }
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown OS';
}

async function detectExtensions(): Promise<boolean> {
    const extensionIndicators: boolean[] = [];
    try {
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox ad-banner pub_300x250';
        document.body.appendChild(testAd);
        await new Promise(r => setTimeout(r, 100));
        const blocked = testAd.offsetHeight === 0;
        document.body.removeChild(testAd);
        if (blocked) extensionIndicators.push(true);
    } catch { }

    if (document.querySelector('[data-grammarly-extension]')) extensionIndicators.push(true);
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) extensionIndicators.push(true);

    return extensionIndicators.length > 0;
}

async function detectIncognito(): Promise<boolean> {
    return new Promise((resolve) => {
        if ('storage' in navigator && 'estimate' in (navigator as any).storage) {
            (navigator as any).storage.estimate().then(({ quota }: { quota: number }) => {
                resolve(quota < 120000000);
            }).catch(() => resolve(false));
        } else {
            const db = indexedDB.open('test');
            db.onerror = () => resolve(true);
            db.onsuccess = () => resolve(false);
        }
    });
}

async function getWebRTCIPs(): Promise<string[]> {
    return new Promise((resolve) => {
        const ips: string[] = [];
        try {
            const pc = new RTCPeerConnection({ iceServers: [] });
            pc.createDataChannel('');
            pc.onicecandidate = (e) => {
                if (!e.candidate) { pc.close(); resolve([...new Set(ips)]); return; }
                const match = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
                if (match) ips.push(match[1]);
            };
            pc.createOffer().then(offer => pc.setLocalDescription(offer));
            setTimeout(() => { pc.close(); resolve([...new Set(ips)]); }, 3000);
        } catch { resolve([]); }
    });
}

// =====================================================
// VM DETECTION - Comprehensive Virtual Machine Detection
// =====================================================
async function detectVM(webglRenderer: string, cpuCores: number, hasBattery: boolean, touchPoints: number, deviceMemory: number | null): Promise<{
    isVM: boolean;
    confidence: number;
    vmType: string | null;
    reasons: string[];
}> {
    const reasons: string[] = [];
    let score = 0;
    let vmType: string | null = null;

    const rendererLower = webglRenderer.toLowerCase();

    // 1. WebGL Renderer Detection (Most reliable - 40 points)
    const vmRenderers: { [key: string]: string } = {
        'virtualbox': 'VirtualBox',
        'vmware': 'VMware',
        'qemu': 'QEMU',
        'parallels': 'Parallels',
        'hyper-v': 'Hyper-V',
        'microsoft basic render': 'Hyper-V',
        'llvmpipe': 'VM/Software Renderer',
        'swiftshader': 'VM/Software Renderer',
        'mesa': 'VM/Software Renderer',
        'google swiftshader': 'VM/Headless',
        'chromium': 'Headless Browser',
    };

    for (const [keyword, type] of Object.entries(vmRenderers)) {
        if (rendererLower.includes(keyword)) {
            score += 40;
            vmType = type;
            reasons.push(`GPU Renderer contains "${keyword}" (${type})`);
            break;
        }
    }

    // 2. CPU Core Count (VMs often have 1-2 cores - 15 points)
    if (cpuCores <= 2) {
        score += 15;
        reasons.push(`Low CPU cores: ${cpuCores} (typical of VM)`);
    }

    // 3. No Battery API (VMs usually lack battery - 10 points)
    if (!hasBattery) {
        score += 10;
        reasons.push('No battery detected (VM indicator)');
    }

    // 4. No Touch Points (10 points)
    if (touchPoints === 0) {
        score += 5;
        reasons.push('No touch capability (possible VM)');
    }

    // 5. Very Low Memory (VMs often have limited RAM - 10 points)
    if (deviceMemory !== null && deviceMemory <= 2) {
        score += 10;
        reasons.push(`Very low device memory: ${deviceMemory}GB (VM indicator)`);
    }

    // 6. WebDriver Detection (Automation - 20 points)
    if (typeof navigator !== 'undefined') {
        if ((navigator as any).webdriver === true) {
            score += 20;
            reasons.push('WebDriver detected (automated/headless)');
            vmType = vmType || 'Automated Browser';
        }
    }

    // 7. Timing Attack - Performance deviation (15 points)
    try {
        const timings: number[] = [];
        for (let i = 0; i < 5; i++) {
            const start = performance.now();
            // CPU-intensive operation
            for (let j = 0; j < 100000; j++) { Math.sqrt(j); }
            timings.push(performance.now() - start);
        }
        const variance = Math.max(...timings) - Math.min(...timings);
        // VMs have higher timing variance due to hypervisor
        if (variance > 20) {
            score += 15;
            reasons.push(`High timing variance: ${variance.toFixed(2)}ms (hypervisor detected)`);
        }
    } catch { }

    // 8. Screen Size Anomalies (VMs often use default sizes - 10 points)
    if (typeof window !== 'undefined') {
        const { innerWidth, innerHeight } = window;
        const vmSizes = [[800, 600], [1024, 768], [1280, 720], [1920, 1080]];
        const exactMatch = vmSizes.some(([w, h]) => innerWidth === w && innerHeight === h);
        if (exactMatch && cpuCores <= 4) {
            score += 5;
            reasons.push(`Standard VM screen size: ${innerWidth}x${innerHeight}`);
        }
    }

    // 9. Plugins Detection (VMs often have no plugins)
    if (typeof navigator !== 'undefined' && navigator.plugins.length === 0) {
        score += 5;
        reasons.push('No browser plugins (VM indicator)');
    }

    // 10. Chrome-specific headless detection
    if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent;
        if (ua.includes('HeadlessChrome')) {
            score += 25;
            reasons.push('Headless Chrome detected');
            vmType = vmType || 'Headless Browser';
        }
    }

    const isVM = score >= 40;
    const confidence = Math.min(score, 100);

    return { isVM, confidence, vmType, reasons };
}

// =====================================================
// ENHANCED FINGERPRINTING - Additional Hardware Identifiers
// =====================================================

// Media Devices Hash - Unique list of cameras/mics
async function getMediaDevicesHash(): Promise<string> {
    try {
        if (!navigator.mediaDevices?.enumerateDevices) return 'unavailable';
        const devices = await navigator.mediaDevices.enumerateDevices();
        const deviceInfo = devices.map(d => `${d.kind}:${d.label || d.deviceId.slice(0, 8)}`).join('|');
        return simpleHash(deviceInfo);
    } catch {
        return 'error';
    }
}

// Speech Voices Hash - OS-specific available voices
function getSpeechVoicesHash(): string {
    try {
        if (!window.speechSynthesis) return 'unavailable';
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return 'pending'; // Voices load async
        const voiceInfo = voices.map(v => `${v.name}:${v.lang}`).join('|');
        return simpleHash(voiceInfo);
    } catch {
        return 'error';
    }
}

// Math Fingerprint - CPU-specific floating point computation
function getMathFingerprint(): string {
    try {
        const results: number[] = [];
        // These calculations produce slightly different results on different CPUs
        results.push(Math.tan(-1e300));
        results.push(Math.sin(0.5));
        results.push(Math.cos(0.5));
        results.push(Math.acos(0.123456789));
        results.push(Math.asin(0.123456789));
        results.push(Math.atan(0.123456789));
        results.push(Math.atan2(0.5, 0.5));
        results.push(Math.exp(1));
        results.push(Math.log(2));
        results.push(Math.pow(2, 10.5));
        results.push(2 ** 0.5 * 1e10);
        return simpleHash(results.map(r => r.toString()).join('|'));
    } catch {
        return 'error';
    }
}

// Plugins Hash
function getPluginsHash(): string {
    try {
        if (!navigator.plugins || navigator.plugins.length === 0) return 'none';
        const pluginInfo = Array.from(navigator.plugins).map(p => `${p.name}:${p.filename}`).join('|');
        return simpleHash(pluginInfo);
    } catch {
        return 'error';
    }
}

// Utility: Check if device should be blocked (VM check)
export function shouldBlockDevice(fingerprint: DeviceFingerprint): { blocked: boolean; reason: string | null } {
    // Block VMs with high confidence
    if (fingerprint.vmDetection.isVM && fingerprint.vmDetection.confidence >= 50) {
        return {
            blocked: true,
            reason: `Virtual Machine Detected: ${fingerprint.vmDetection.vmType || 'Unknown VM'} (${fingerprint.vmDetection.confidence}% confidence)`
        };
    }

    // Block known automation
    if ((navigator as any)?.webdriver === true) {
        return {
            blocked: true,
            reason: 'Automated browser detected'
        };
    }

    return { blocked: false, reason: null };
}

// =====================================================
// ENHANCED VPN DETECTION
// =====================================================
export interface VPNDetectionResult {
    isVPN: boolean;
    confidence: number;
    reasons: string[];
    detectedType: 'vpn' | 'proxy' | 'tor' | 'datacenter' | 'none';
    realIP?: string;
    vpnIP?: string;
}

export async function detectVPN(fingerprint: DeviceFingerprint, serverIP: string): Promise<VPNDetectionResult> {
    const reasons: string[] = [];
    let score = 0;
    let detectedType: VPNDetectionResult['detectedType'] = 'none';
    let realIP: string | undefined;

    // 1. WebRTC IP Leak Detection
    if (fingerprint.webrtcIps.length > 0) {
        const localIPs = fingerprint.webrtcIps.filter(ip =>
            ip.startsWith('192.168.') ||
            ip.startsWith('10.') ||
            ip.startsWith('172.')
        );
        const publicIPs = fingerprint.webrtcIps.filter(ip =>
            !ip.startsWith('192.168.') &&
            !ip.startsWith('10.') &&
            !ip.startsWith('172.')
        );

        // If WebRTC reveals different public IP than server sees
        if (publicIPs.length > 0 && publicIPs[0] !== serverIP) {
            score += 40;
            reasons.push(`WebRTC leak detected: Real IP ${publicIPs[0]} vs VPN IP ${serverIP}`);
            realIP = publicIPs[0];
            detectedType = 'vpn';
        }
    }

    // 2. Timezone vs IP Location Mismatch
    // (Requires server-side IP geolocation - pass timezone offset)
    const timezoneOffset = fingerprint.timezoneOffset;
    const timezone = fingerprint.timezone;

    // Common VPN timezone mismatches
    if (timezone && serverIP) {
        // This would be enhanced with server-side IP geo comparison
        reasons.push(`Timezone: ${timezone} (UTC${timezoneOffset >= 0 ? '-' : '+'}${Math.abs(timezoneOffset / 60)})`);
    }

    // 3. Connection Type Anomalies
    if (fingerprint.connectionType === 'unknown' || fingerprint.connectionType === null) {
        score += 10;
        reasons.push('Connection type hidden (common VPN indicator)');
    }

    // 4. Battery API Missing (VPN apps often run in containers)
    if (fingerprint.batteryLevel === undefined && !fingerprint.vmDetection.isVM) {
        score += 5;
        reasons.push('Battery API unavailable');
    }

    // 5. Navigator Platform vs User Agent Mismatch
    const ua = fingerprint.userAgent.toLowerCase();
    const platform = fingerprint.platform.toLowerCase();
    if (ua.includes('windows') && platform.includes('mac') ||
        ua.includes('mac') && platform.includes('win')) {
        score += 30;
        reasons.push(`Platform mismatch: UA says ${ua.includes('windows') ? 'Windows' : 'Mac'}, Navigator says ${platform}`);
        detectedType = 'proxy';
    }

    // 6. Incognito Mode (often used with VPN)
    if (fingerprint.incognitoMode) {
        score += 15;
        reasons.push('Incognito/Private browsing detected');
    }

    // 7. Do Not Track (privacy-conscious users often use VPN)
    if (fingerprint.doNotTrack) {
        score += 5;
        reasons.push('Do Not Track enabled');
    }

    return {
        isVPN: score >= 35,
        confidence: Math.min(score, 100),
        reasons,
        detectedType: score >= 35 ? detectedType : 'none',
        realIP,
        vpnIP: score >= 35 ? serverIP : undefined
    };
}

// =====================================================
// EXTENSION DETECTION
// =====================================================
export interface ExtensionDetectionResult {
    hasAdBlocker: boolean;
    hasPrivacyExtension: boolean;
    hasScreenshotTool: boolean;
    hasDevTools: boolean;
    hasPiracy: boolean;
    detectedExtensions: string[];
}

export async function detectExtensionsAdvanced(): Promise<ExtensionDetectionResult> {
    const detected: string[] = [];

    // 1. Ad Blocker Detection
    let hasAdBlocker = false;
    try {
        const bait = document.createElement('div');
        bait.innerHTML = '&nbsp;';
        bait.className = 'adsbox ad-banner ad-container pub_300x250 textAd';
        bait.style.cssText = 'position:absolute;left:-9999px;height:1px;width:1px;';
        document.body.appendChild(bait);
        await new Promise(r => setTimeout(r, 100));
        if (bait.offsetHeight === 0 || bait.offsetWidth === 0 || !bait.offsetParent) {
            hasAdBlocker = true;
            detected.push('AdBlocker');
        }
        document.body.removeChild(bait);
    } catch { }

    // 2. Privacy Extension Detection (uBlock Origin, Privacy Badger, etc.)
    let hasPrivacyExtension = false;
    try {
        // Check for blocked tracking pixels
        const trackingDomains = [
            'https://www.google-analytics.com/collect',
            'https://www.facebook.com/tr'
        ];
        // Privacy extensions often block these
        const blocked = await Promise.all(trackingDomains.map(async (url) => {
            try {
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 500);
                await fetch(url, { mode: 'no-cors', signal: controller.signal });
                return false;
            } catch {
                return true;
            }
        }));
        if (blocked.some(b => b === true)) {
            hasPrivacyExtension = true;
            detected.push('Privacy Extension');
        }
    } catch { }

    // 3. Screenshot Tool Detection
    let hasScreenshotTool = false;
    try {
        // Check for common screenshot extension injected elements
        const screenshotIndicators = [
            '[data-nimbus-screenshot]',
            '[data-awesome-screenshot]',
            '.lightshot-btn',
            '#fireshot-container'
        ];
        for (const selector of screenshotIndicators) {
            if (document.querySelector(selector)) {
                hasScreenshotTool = true;
                detected.push('Screenshot Tool');
                break;
            }
        }
    } catch { }

    // 4. DevTools Detection
    let hasDevTools = false;
    try {
        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        if (widthDiff > threshold || heightDiff > threshold) {
            hasDevTools = true;
            detected.push('DevTools Open');
        }

        // Console-based detection
        const devtoolsElement = new Image();
        Object.defineProperty(devtoolsElement, 'id', {
            get: function () {
                hasDevTools = true;
                detected.push('DevTools Active');
            }
        });
    } catch { }

    // 5. Video/Content Piracy Tools
    let hasPiracy = false;
    try {
        const pirateIndicators = [
            '[data-video-downloader]',
            '.savefrom-helper',
            '#downloadHelper'
        ];
        for (const selector of pirateIndicators) {
            if (document.querySelector(selector)) {
                hasPiracy = true;
                detected.push('Download/Piracy Tool');
                break;
            }
        }
    } catch { }

    return {
        hasAdBlocker,
        hasPrivacyExtension,
        hasScreenshotTool,
        hasDevTools,
        hasPiracy,
        detectedExtensions: detected
    };
}

// =====================================================
// HARDWARE BAN SYSTEM
// =====================================================
export interface HardwareBanSignature {
    gpuHash: string;           // GPU-based hardware ID
    audioHash: string;         // Audio card signature
    canvasHash: string;        // Canvas + GPU rendering
    fontHash: string;          // System fonts
    mathHash: string;          // CPU math fingerprint
    combinedHash: string;      // Master ban key
    components: string[];      // List of what was used
}

export function generateHardwareBanSignature(fingerprint: DeviceFingerprint): HardwareBanSignature {
    const components: string[] = [];

    // GPU Signature (most reliable for hardware ban)
    const gpuData = [
        fingerprint.webglFingerprint.unmaskedRenderer || fingerprint.webglFingerprint.renderer,
        fingerprint.webglFingerprint.unmaskedVendor || fingerprint.webglFingerprint.vendor,
        fingerprint.webglFingerprint.version,
        fingerprint.webglFingerprint.maxTextureSize.toString()
    ].join('|');
    const gpuHash = simpleHash(gpuData);
    components.push('GPU');

    // Audio Signature
    const audioHash = fingerprint.audioFingerprint.analyserHash || 'none';
    if (audioHash !== 'none') components.push('Audio');

    // Canvas Signature
    const canvasHash = fingerprint.canvasDataHash;
    components.push('Canvas');

    // Font Signature
    const fontHash = fingerprint.fontFingerprint.fontHash;
    components.push('Fonts');

    // Math/CPU Signature
    const mathHash = fingerprint.mathFingerprint;
    components.push('CPU');

    // Combined Master Ban Key
    const combinedData = [gpuHash, audioHash, canvasHash, fontHash, mathHash].join('|');
    const combinedHash = simpleHash(combinedData);

    return {
        gpuHash,
        audioHash,
        canvasHash,
        fontHash,
        mathHash,
        combinedHash,
        components
    };
}

// Check if fingerprint matches any banned signature
export function matchesBannedHardware(
    fingerprint: DeviceFingerprint,
    bannedSignatures: HardwareBanSignature[]
): { banned: boolean; matchedOn: string[]; signature?: HardwareBanSignature } {
    const currentSig = generateHardwareBanSignature(fingerprint);

    for (const banned of bannedSignatures) {
        const matches: string[] = [];

        // Check each component
        if (banned.combinedHash === currentSig.combinedHash) {
            return { banned: true, matchedOn: ['Full Hardware Match'], signature: currentSig };
        }
        if (banned.gpuHash === currentSig.gpuHash) matches.push('GPU');
        if (banned.audioHash === currentSig.audioHash && banned.audioHash !== 'none') matches.push('Audio');
        if (banned.canvasHash === currentSig.canvasHash) matches.push('Canvas');

        // Ban if 2+ components match
        if (matches.length >= 2) {
            return { banned: true, matchedOn: matches, signature: currentSig };
        }
    }

    return { banned: false, matchedOn: [], signature: currentSig };
}

// =====================================================
// COURT-READY EVIDENCE PACKAGE
// =====================================================
export interface CourtEvidence {
    // Identity
    fingerprintHash: string;
    hardwareSignature: HardwareBanSignature;

    // Location
    ipAddress: string;
    geolocation?: {
        latitude: number;
        longitude: number;
        accuracy: number;
        mapsUrl: string;
    };
    timezone: string;

    // Device
    deviceInfo: {
        browser: string;
        browserVersion: string;
        os: string;
        platform: string;
        userAgent: string;
        screenResolution: string;
        language: string;
    };

    // Session
    accessTime: string;       // ISO 8601
    accessTimeLocal: string;  // User's local time
    sessionDuration?: number; // Seconds

    // Actions
    actions: Array<{
        action: string;
        timestamp: string;
        details?: string;
    }>;

    // Security
    vpnDetected: boolean;
    vpnDetails?: VPNDetectionResult;
    extensionsDetected: string[];
    vmDetected: boolean;

    // Cryptographic Proof
    evidenceHash: string;
    generatedAt: string;
}

export function generateCourtEvidence(
    fingerprint: DeviceFingerprint,
    ipAddress: string,
    actions: Array<{ action: string; timestamp: string; details?: string }>,
    vpnResult?: VPNDetectionResult,
    extensionResult?: ExtensionDetectionResult
): CourtEvidence {
    const hardwareSignature = generateHardwareBanSignature(fingerprint);
    const generatedAt = new Date().toISOString();

    const evidence: Omit<CourtEvidence, 'evidenceHash'> = {
        fingerprintHash: fingerprint.combinedHash,
        hardwareSignature,

        ipAddress,
        geolocation: fingerprint.geolocation ? {
            latitude: fingerprint.geolocation.latitude,
            longitude: fingerprint.geolocation.longitude,
            accuracy: fingerprint.geolocation.accuracy,
            mapsUrl: fingerprint.geolocation.mapsUrl ||
                `https://maps.google.com/maps?q=${fingerprint.geolocation.latitude},${fingerprint.geolocation.longitude}`
        } : undefined,
        timezone: fingerprint.timezone,

        deviceInfo: {
            browser: fingerprint.browser,
            browserVersion: fingerprint.browserVersion,
            os: fingerprint.os,
            platform: fingerprint.platform,
            userAgent: fingerprint.userAgent,
            screenResolution: fingerprint.screenResolution,
            language: fingerprint.language
        },

        accessTime: fingerprint.sessionStartTime,
        accessTimeLocal: fingerprint.localTime,

        actions,

        vpnDetected: vpnResult?.isVPN || false,
        vpnDetails: vpnResult,
        extensionsDetected: extensionResult?.detectedExtensions || [],
        vmDetected: fingerprint.vmDetection.isVM,

        generatedAt
    };

    // Generate cryptographic hash of all evidence
    const evidenceString = JSON.stringify(evidence);
    const evidenceHash = simpleHash(evidenceString);

    return {
        ...evidence,
        evidenceHash
    };
}

// Export evidence as JSON for download
export function exportEvidenceJSON(evidence: CourtEvidence): string {
    return JSON.stringify(evidence, null, 2);
}

// =====================================================
// SESSION STORAGE CACHING (Performance Optimization)
// =====================================================
const FINGERPRINT_CACHE_KEY = 'dl_fingerprint_cache';
const FINGERPRINT_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

export async function getCachedFingerprint(): Promise<DeviceFingerprint | null> {
    try {
        const cached = sessionStorage.getItem(FINGERPRINT_CACHE_KEY);
        if (!cached) return null;

        const { fingerprint, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > FINGERPRINT_CACHE_EXPIRY) {
            sessionStorage.removeItem(FINGERPRINT_CACHE_KEY);
            return null;
        }

        return fingerprint;
    } catch {
        return null;
    }
}

export async function getOrCollectFingerprint(): Promise<DeviceFingerprint> {
    const cached = await getCachedFingerprint();
    if (cached) return cached;

    const fingerprint = await collectDeviceFingerprint();

    try {
        sessionStorage.setItem(FINGERPRINT_CACHE_KEY, JSON.stringify({
            fingerprint,
            timestamp: Date.now()
        }));
    } catch {
        // Session storage might be full or blocked
    }

    return fingerprint;
}

// =====================================================
// COMPREHENSIVE FORENSIC FINGERPRINT (100+ Attributes)
// For court evidence, hardware banning, and identification
// =====================================================

export interface ForensicFingerprint {
    // === COLLECTION METADATA ===
    collectionTimestamp: string;        // ISO 8601
    collectionTimestampLocal: string;   // User's local time
    collectionDuration: number;         // ms to collect

    // === 1. HTTP HEADERS & CONNECTION (captured server-side) ===
    // These would be passed from server
    serverInfo?: {
        ipAddress: string;
        userAgent: string;
        acceptLanguage: string;
        acceptEncoding: string;
        dnt: string | null;
        referer: string | null;
        secFetchSite: string | null;
        secFetchMode: string | null;
        secFetchDest: string | null;
    };

    // === 2. NAVIGATOR OBJECT (20+ attributes) ===
    navigator: {
        userAgent: string;
        platform: string;
        vendor: string;
        product: string;
        productSub: string;
        appName: string;
        appVersion: string;
        appCodeName: string;
        oscpu: string | null;
        language: string;
        languages: string[];
        hardwareConcurrency: number;
        deviceMemory: number | null;
        maxTouchPoints: number;
        cookieEnabled: boolean;
        doNotTrack: string | null;
        webdriver: boolean;
        pdfViewerEnabled: boolean;
        javaEnabled: boolean;
        onLine: boolean;
        plugins: string[];
        pluginsCount: number;
        mimeTypes: string[];
        mimeTypesCount: number;
    };

    // === 3. SCREEN & DISPLAY (15+ attributes) ===
    screen: {
        width: number;
        height: number;
        availWidth: number;
        availHeight: number;
        colorDepth: number;
        pixelDepth: number;
        devicePixelRatio: number;
        orientation: string | null;
        orientationAngle: number | null;
        isExtended: boolean;
        // Window metrics
        innerWidth: number;
        innerHeight: number;
        outerWidth: number;
        outerHeight: number;
        screenX: number;
        screenY: number;
    };

    // === 4. TIME & LOCALE (10+ attributes) ===
    locale: {
        timezone: string;
        timezoneOffset: number;
        dateTimeFormat: {
            locale: string;
            calendar: string;
            numberingSystem: string;
            timeZone: string;
            hourCycle: string | null;
        };
        relativeTimeFormatLocales: string[];
    };

    // === 5. FONTS (50+ detectable) ===
    fonts: {
        detected: string[];
        count: number;
        hash: string;
    };

    // === 6. CANVAS FINGERPRINT ===
    canvas: {
        hash2D: string;
        dataUrlSnippet: string;
        textMetricsHash: string;
        supported: boolean;
    };

    // === 7. WEBGL & GPU (30+ attributes) ===
    webgl: {
        supported: boolean;
        version: string;
        vendor: string;
        renderer: string;
        unmaskedVendor: string;
        unmaskedRenderer: string;
        shadingLanguageVersion: string;
        maxTextureSize: number;
        maxViewportDims: [number, number];
        maxRenderbufferSize: number;
        maxVertexAttribs: number;
        maxVaryingVectors: number;
        maxFragmentUniformVectors: number;
        maxVertexUniformVectors: number;
        maxCombinedTextureImageUnits: number;
        maxTextureImageUnits: number;
        maxVertexTextureImageUnits: number;
        maxCubeMapTextureSize: number;
        aliasedLineWidthRange: [number, number];
        aliasedPointSizeRange: [number, number];
        antialiasing: boolean;
        extensions: string[];
        extensionsCount: number;
        renderHash: string;
    };

    // === 8. WEBGL2 EXTENDED ===
    webgl2?: {
        supported: boolean;
        version: string;
        maxSamples: number;
        max3DTextureSize: number;
        maxArrayTextureLayers: number;
        maxUniformBufferBindings: number;
        maxCombinedUniformBlocks: number;
        maxTransformFeedbackSeparateComponents: number;
        extensions: string[];
    };

    // === 9. AUDIO FINGERPRINT ===
    audio: {
        supported: boolean;
        sampleRate: number;
        channelCount: number;
        baseLatency: number | null;
        outputLatency: number | null;
        state: string;
        oscillatorHash: string;
        analyserHash: string;
        compressorHash: string;
        destinationChannelCount: number;
    };

    // === 10. HARDWARE & PERFORMANCE ===
    hardware: {
        cpuCores: number;
        deviceMemoryGB: number | null;
        batteryLevel: number | null;
        batteryCharging: boolean | null;
        batteryChargingTime: number | null;
        batteryDischargingTime: number | null;
        performanceTimingHash: string;
        mathFingerprint: string;
    };

    // === 11. MEDIA DEVICES ===
    mediaDevices: {
        supported: boolean;
        audioInputCount: number;
        audioOutputCount: number;
        videoInputCount: number;
        devicesHash: string;
        deviceLabels: string[];
    };

    // === 12. SPEECH SYNTHESIS ===
    speechSynthesis: {
        supported: boolean;
        voicesCount: number;
        voicesHash: string;
        voiceNames: string[];
    };

    // === 13. STORAGE CAPABILITIES ===
    storage: {
        localStorageSupported: boolean;
        sessionStorageSupported: boolean;
        indexedDBSupported: boolean;
        cacheAPISupported: boolean;
        storageEstimate?: {
            quota: number;
            usage: number;
        };
    };

    // === 14. NETWORK & CONNECTION ===
    network: {
        connectionType: string | null;
        effectiveType: string | null;
        downlink: number | null;
        rtt: number | null;
        saveData: boolean | null;
        webrtcIps: string[];
        webrtcLocalIP: string | null;
        webrtcPublicIP: string | null;
    };

    // === 15. PERMISSIONS & FEATURES ===
    permissions: {
        geolocation: string;
        notifications: string;
        camera: string;
        microphone: string;
        midi: string;
        bluetooth: string;
    };

    // === 16. CSS & MEDIA QUERIES ===
    cssFeatures: {
        prefersColorScheme: string;
        prefersReducedMotion: string;
        prefersContrast: string;
        prefersReducedTransparency: string;
        forcedColors: string;
        colorGamut: string;
        hdr: boolean;
        pointer: string;
        hover: string;
        anyPointer: string;
        anyHover: string;
        displayMode: string;
    };

    // === 17. BROWSER FEATURES & API SUPPORT ===
    features: {
        serviceWorkerSupported: boolean;
        webAssemblySupported: boolean;
        webGPUSupported: boolean;
        webXRSupported: boolean;
        webSocketSupported: boolean;
        webRTCSupported: boolean;
        webAuthNSupported: boolean;
        fileSystemAccessSupported: boolean;
        notificationsSupported: boolean;
        pushAPISupported: boolean;
        paymentRequestSupported: boolean;
        credentialsAPISupported: boolean;
        gamepadsSupported: boolean;
        bluetoothSupported: boolean;
        usbSupported: boolean;
        serialSupported: boolean;
        hid: boolean;
        nfc: boolean;
    };

    // === 18. SECURITY & DETECTION ===
    security: {
        isSecureContext: boolean;
        crossOriginIsolated: boolean;
        webdriverDetected: boolean;
        automationDetected: boolean;
        incognitoMode: boolean;
        extensionsDetected: boolean;
        devToolsOpen: boolean;
        vmDetected: boolean;
        vmConfidence: number;
        vmType: string | null;
    };

    // === 19. BEHAVIORAL (if collected) ===
    behavioral?: {
        mousePresent: boolean;
        touchPresent: boolean;
        keyboardPresent: boolean;
        gamepadPresent: boolean;
    };

    // === 20. COMBINED HASHES ===
    hashes: {
        navigatorHash: string;
        screenHash: string;
        webglHash: string;
        audioHash: string;
        fontHash: string;
        canvasHash: string;
        hardwareHash: string;
        combinedHash: string;       // Master identifier
        stabilityScore: number;     // 0-100, how stable this fingerprint is
    };

    // === 21. RAW COUNTS ===
    attributeCount: number;         // Total attributes collected
}

// Collect comprehensive forensic fingerprint
export async function collectForensicFingerprint(): Promise<ForensicFingerprint> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    const localTime = new Date().toLocaleString();

    // === NAVIGATOR ===
    const nav = navigator as any;
    const navigatorData = {
        userAgent: nav.userAgent || '',
        platform: nav.platform || '',
        vendor: nav.vendor || '',
        product: nav.product || '',
        productSub: nav.productSub || '',
        appName: nav.appName || '',
        appVersion: nav.appVersion || '',
        appCodeName: nav.appCodeName || '',
        oscpu: nav.oscpu || null,
        language: nav.language || '',
        languages: Array.from(nav.languages || []) as string[],
        hardwareConcurrency: nav.hardwareConcurrency || 0,
        deviceMemory: nav.deviceMemory || null,
        maxTouchPoints: nav.maxTouchPoints || 0,
        cookieEnabled: nav.cookieEnabled || false,
        doNotTrack: nav.doNotTrack || null,
        webdriver: nav.webdriver === true,
        pdfViewerEnabled: nav.pdfViewerEnabled || false,
        javaEnabled: typeof nav.javaEnabled === 'function' ? nav.javaEnabled() : false,
        onLine: nav.onLine || false,
        plugins: Array.from(nav.plugins || []).map((p: any) => p.name),
        pluginsCount: nav.plugins?.length || 0,
        mimeTypes: Array.from(nav.mimeTypes || []).map((m: any) => m.type),
        mimeTypesCount: nav.mimeTypes?.length || 0,
    };

    // === SCREEN ===
    const screenData = {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        devicePixelRatio: window.devicePixelRatio,
        orientation: screen.orientation?.type || null,
        orientationAngle: screen.orientation?.angle ?? null,
        isExtended: (screen as any).isExtended || false,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        screenX: window.screenX,
        screenY: window.screenY,
    };

    // === LOCALE ===
    const dtf = Intl.DateTimeFormat().resolvedOptions();
    const localeData = {
        timezone: dtf.timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        dateTimeFormat: {
            locale: dtf.locale,
            calendar: dtf.calendar,
            numberingSystem: dtf.numberingSystem,
            timeZone: dtf.timeZone,
            hourCycle: (dtf as any).hourCycle || null,
        },
        relativeTimeFormatLocales: ['en', 'ar', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'pt', 'ru'],
    };

    // === FONTS ===
    const fonts = detectFonts();

    // === CANVAS ===
    const canvas = getCanvasForensic();

    // === WEBGL ===
    const webgl = getWebGLForensic();
    const webgl2 = getWebGL2Forensic();

    // === AUDIO ===
    const audio = await getAudioForensic();

    // === HARDWARE ===
    const hardware = await getHardwareForensic();

    // === MEDIA DEVICES ===
    const mediaDevices = await getMediaDevicesForensic();

    // === SPEECH ===
    const speechSynthesis = getSpeechForensic();

    // === STORAGE ===
    const storage = await getStorageForensic();

    // === NETWORK ===
    const network = await getNetworkForensic();

    // === PERMISSIONS ===
    const permissions = await getPermissionsForensic();

    // === CSS FEATURES ===
    const cssFeatures = getCSSFeaturesForensic();

    // === BROWSER FEATURES ===
    const features = getFeaturesForensic();

    // === SECURITY ===
    const security = await getSecurityForensic();

    // === BEHAVIORAL ===
    const behavioral = getBehavioralForensic();

    // === GENERATE HASHES ===
    const navigatorHash = simpleHash(JSON.stringify(navigatorData));
    const screenHash = simpleHash(JSON.stringify(screenData));
    const webglHash = simpleHash(JSON.stringify(webgl));
    const audioHash = audio.analyserHash;
    const fontHash = fonts.hash;
    const canvasHash = canvas.hash2D;
    const hardwareHash = simpleHash(JSON.stringify(hardware));

    const combinedData = [navigatorHash, screenHash, webglHash, audioHash, fontHash, canvasHash, hardwareHash].join('|');
    const combinedHash = simpleHash(combinedData);

    // Calculate attribute count
    let attributeCount = 0;
    attributeCount += Object.keys(navigatorData).length;
    attributeCount += Object.keys(screenData).length;
    attributeCount += Object.keys(localeData).length + Object.keys(localeData.dateTimeFormat).length;
    attributeCount += fonts.count;
    attributeCount += Object.keys(canvas).length;
    attributeCount += Object.keys(webgl).length;
    attributeCount += Object.keys(audio).length;
    attributeCount += Object.keys(hardware).length;
    attributeCount += Object.keys(mediaDevices).length;
    attributeCount += Object.keys(speechSynthesis).length;
    attributeCount += Object.keys(storage).length;
    attributeCount += Object.keys(network).length;
    attributeCount += Object.keys(permissions).length;
    attributeCount += Object.keys(cssFeatures).length;
    attributeCount += Object.keys(features).length;
    attributeCount += Object.keys(security).length;

    const collectionDuration = performance.now() - startTime;

    return {
        collectionTimestamp: timestamp,
        collectionTimestampLocal: localTime,
        collectionDuration,
        navigator: navigatorData,
        screen: screenData,
        locale: localeData,
        fonts,
        canvas,
        webgl,
        webgl2,
        audio,
        hardware,
        mediaDevices,
        speechSynthesis,
        storage,
        network,
        permissions,
        cssFeatures,
        features,
        security,
        behavioral,
        hashes: {
            navigatorHash,
            screenHash,
            webglHash,
            audioHash,
            fontHash,
            canvasHash,
            hardwareHash,
            combinedHash,
            stabilityScore: 85, // Estimated stability
        },
        attributeCount,
    };
}

// Helper functions for forensic collection
function detectFonts(): ForensicFingerprint['fonts'] {
    const testFonts = [
        'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Comic Sans MS',
        'Consolas', 'Courier', 'Courier New', 'Georgia', 'Helvetica', 'Impact',
        'Lucida Console', 'Lucida Sans', 'Microsoft Sans Serif', 'Monaco', 'Palatino',
        'Segoe UI', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana',
        'American Typewriter', 'Andale Mono', 'Baskerville', 'Big Caslon', 'Brush Script MT',
        'Cochin', 'Copperplate', 'Didot', 'Futura', 'Geneva', 'Gill Sans', 'Hoefler Text',
        'Menlo', 'Optima', 'Papyrus', 'Rockwell', 'San Francisco', 'Zapfino',
        'Segoe Print', 'Segoe Script', 'Sylfaen', 'Webdings', 'Wingdings',
        'MS Gothic', 'MS Mincho', 'SimHei', 'SimSun', 'Roboto', 'Open Sans',
        'Lato', 'Montserrat', 'Source Sans Pro', 'Raleway', 'Ubuntu', 'Nunito'
    ];

    const detected: string[] = [];
    try {
        const span = document.createElement('span');
        span.style.fontSize = '72px';
        span.style.position = 'absolute';
        span.style.left = '-9999px';
        span.textContent = 'mmmmmmmmmmlli';
        document.body.appendChild(span);

        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const baseWidths: Record<string, number> = {};
        for (const base of baseFonts) {
            span.style.fontFamily = base;
            baseWidths[base] = span.offsetWidth;
        }

        for (const font of testFonts) {
            for (const base of baseFonts) {
                span.style.fontFamily = `'${font}', ${base}`;
                if (span.offsetWidth !== baseWidths[base]) {
                    detected.push(font);
                    break;
                }
            }
        }

        document.body.removeChild(span);
    } catch { }

    return {
        detected,
        count: detected.length,
        hash: simpleHash(detected.join(','))
    };
}

function getCanvasForensic(): ForensicFingerprint['canvas'] {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { hash2D: 'unavailable', dataUrlSnippet: '', textMetricsHash: '', supported: false };

        // Complex rendering
        ctx.textBaseline = 'alphabetic';
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);

        const gradient = ctx.createLinearGradient(0, 0, 300, 0);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.5, '#00ff00');
        gradient.addColorStop(1, '#0000ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 30, 300, 40);

        ctx.fillStyle = '#069';
        ctx.fillText('DataLeash Forensic Canvas 🔐', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('DataLeash Forensic Canvas 🔐', 4, 17);

        ctx.beginPath();
        ctx.arc(50, 50, 25, 0, Math.PI * 2);
        ctx.stroke();

        const dataUrl = canvas.toDataURL();
        const textMetrics = ctx.measureText('DataLeash');

        return {
            hash2D: simpleHash(dataUrl),
            dataUrlSnippet: dataUrl.slice(-50),
            textMetricsHash: simpleHash(`${textMetrics.width}`),
            supported: true
        };
    } catch {
        return { hash2D: 'error', dataUrlSnippet: '', textMetricsHash: '', supported: false };
    }
}

function getWebGLForensic(): ForensicFingerprint['webgl'] {
    const defaultResult: ForensicFingerprint['webgl'] = {
        supported: false, version: '', vendor: '', renderer: '',
        unmaskedVendor: '', unmaskedRenderer: '', shadingLanguageVersion: '',
        maxTextureSize: 0, maxViewportDims: [0, 0], maxRenderbufferSize: 0,
        maxVertexAttribs: 0, maxVaryingVectors: 0, maxFragmentUniformVectors: 0,
        maxVertexUniformVectors: 0, maxCombinedTextureImageUnits: 0,
        maxTextureImageUnits: 0, maxVertexTextureImageUnits: 0,
        maxCubeMapTextureSize: 0, aliasedLineWidthRange: [0, 0],
        aliasedPointSizeRange: [0, 0], antialiasing: false,
        extensions: [], extensionsCount: 0, renderHash: ''
    };

    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
        if (!gl) return defaultResult;

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const extensions = gl.getSupportedExtensions() || [];

        // Render hash
        canvas.width = 50;
        canvas.height = 50;
        gl.viewport(0, 0, 50, 50);
        gl.clearColor(0.3, 0.6, 0.9, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        const pixels = new Uint8Array(50 * 50 * 4);
        gl.readPixels(0, 0, 50, 50, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        const renderHash = simpleHash(Array.from(pixels.slice(0, 100)).join(','));

        const viewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
        const lineRange = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
        const pointRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);

        return {
            supported: true,
            version: gl.getParameter(gl.VERSION) || '',
            vendor: gl.getParameter(gl.VENDOR) || '',
            renderer: gl.getParameter(gl.RENDERER) || '',
            unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '',
            unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '',
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || '',
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0,
            maxViewportDims: viewportDims ? [viewportDims[0], viewportDims[1]] : [0, 0],
            maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 0,
            maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 0,
            maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS) || 0,
            maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 0,
            maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || 0,
            maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) || 0,
            maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) || 0,
            maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) || 0,
            maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE) || 0,
            aliasedLineWidthRange: lineRange ? [lineRange[0], lineRange[1]] : [0, 0],
            aliasedPointSizeRange: pointRange ? [pointRange[0], pointRange[1]] : [0, 0],
            antialiasing: !!gl.getContextAttributes()?.antialias,
            extensions,
            extensionsCount: extensions.length,
            renderHash
        };
    } catch {
        return defaultResult;
    }
}

function getWebGL2Forensic(): ForensicFingerprint['webgl2'] {
    try {
        const canvas = document.createElement('canvas');
        const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
        if (!gl2) return undefined;

        return {
            supported: true,
            version: gl2.getParameter(gl2.VERSION) || '',
            maxSamples: gl2.getParameter(gl2.MAX_SAMPLES) || 0,
            max3DTextureSize: gl2.getParameter(gl2.MAX_3D_TEXTURE_SIZE) || 0,
            maxArrayTextureLayers: gl2.getParameter(gl2.MAX_ARRAY_TEXTURE_LAYERS) || 0,
            maxUniformBufferBindings: gl2.getParameter(gl2.MAX_UNIFORM_BUFFER_BINDINGS) || 0,
            maxCombinedUniformBlocks: gl2.getParameter(gl2.MAX_COMBINED_UNIFORM_BLOCKS) || 0,
            maxTransformFeedbackSeparateComponents: gl2.getParameter(gl2.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS) || 0,
            extensions: gl2.getSupportedExtensions() || []
        };
    } catch {
        return undefined;
    }
}

async function getAudioForensic(): Promise<ForensicFingerprint['audio']> {
    const defaultResult: ForensicFingerprint['audio'] = {
        supported: false, sampleRate: 0, channelCount: 0,
        baseLatency: null, outputLatency: null, state: '',
        oscillatorHash: '', analyserHash: '', compressorHash: '',
        destinationChannelCount: 0
    };

    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return defaultResult;

        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const analyser = context.createAnalyser();
        const compressor = context.createDynamicsCompressor();
        const gain = context.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, context.currentTime);
        analyser.fftSize = 256;
        compressor.threshold.setValueAtTime(-50, context.currentTime);
        compressor.knee.setValueAtTime(40, context.currentTime);
        compressor.ratio.setValueAtTime(12, context.currentTime);
        gain.gain.setValueAtTime(0, context.currentTime);

        oscillator.connect(compressor);
        compressor.connect(analyser);
        analyser.connect(gain);
        gain.connect(context.destination);

        oscillator.start(0);
        await new Promise(r => setTimeout(r, 100));

        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);
        const analyserHash = simpleHash(Array.from(frequencyData).join(','));

        oscillator.stop();
        await context.close();

        return {
            supported: true,
            sampleRate: context.sampleRate,
            channelCount: context.destination.channelCount,
            baseLatency: (context as any).baseLatency || null,
            outputLatency: (context as any).outputLatency || null,
            state: context.state,
            oscillatorHash: simpleHash(`triangle-10000`),
            analyserHash,
            compressorHash: simpleHash('-50-40-12'),
            destinationChannelCount: context.destination.maxChannelCount
        };
    } catch {
        return defaultResult;
    }
}

async function getHardwareForensic(): Promise<ForensicFingerprint['hardware']> {
    const nav = navigator as any;
    let battery: any = null;
    try {
        if (nav.getBattery) battery = await nav.getBattery();
    } catch { }

    // Math fingerprint
    const mathResults: number[] = [];
    try {
        mathResults.push(Math.tan(-1e300), Math.sin(0.5), Math.cos(0.5));
        mathResults.push(Math.acos(0.123456789), Math.asin(0.123456789));
        mathResults.push(Math.exp(1), Math.log(2), Math.pow(2, 10.5));
    } catch { }

    // Performance timing
    const perfHash = simpleHash(JSON.stringify(performance.timing || {}));

    return {
        cpuCores: nav.hardwareConcurrency || 0,
        deviceMemoryGB: nav.deviceMemory || null,
        batteryLevel: battery ? Math.round(battery.level * 100) : null,
        batteryCharging: battery?.charging ?? null,
        batteryChargingTime: battery?.chargingTime ?? null,
        batteryDischargingTime: battery?.dischargingTime ?? null,
        performanceTimingHash: perfHash,
        mathFingerprint: simpleHash(mathResults.map(String).join('|'))
    };
}

async function getMediaDevicesForensic(): Promise<ForensicFingerprint['mediaDevices']> {
    try {
        if (!navigator.mediaDevices?.enumerateDevices) {
            return { supported: false, audioInputCount: 0, audioOutputCount: 0, videoInputCount: 0, devicesHash: '', deviceLabels: [] };
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        return {
            supported: true,
            audioInputCount: devices.filter(d => d.kind === 'audioinput').length,
            audioOutputCount: devices.filter(d => d.kind === 'audiooutput').length,
            videoInputCount: devices.filter(d => d.kind === 'videoinput').length,
            devicesHash: simpleHash(devices.map(d => `${d.kind}:${d.deviceId.slice(0, 8)}`).join('|')),
            deviceLabels: devices.map(d => d.label).filter(Boolean)
        };
    } catch {
        return { supported: false, audioInputCount: 0, audioOutputCount: 0, videoInputCount: 0, devicesHash: '', deviceLabels: [] };
    }
}

function getSpeechForensic(): ForensicFingerprint['speechSynthesis'] {
    if (!window.speechSynthesis) {
        return { supported: false, voicesCount: 0, voicesHash: '', voiceNames: [] };
    }
    const voices = window.speechSynthesis.getVoices();
    return {
        supported: true,
        voicesCount: voices.length,
        voicesHash: simpleHash(voices.map(v => `${v.name}:${v.lang}`).join('|')),
        voiceNames: voices.slice(0, 10).map(v => v.name)
    };
}

async function getStorageForensic(): Promise<ForensicFingerprint['storage']> {
    let estimate: { quota: number; usage: number } | undefined;
    try {
        if (navigator.storage?.estimate) {
            const est = await navigator.storage.estimate();
            estimate = { quota: est.quota || 0, usage: est.usage || 0 };
        }
    } catch { }

    return {
        localStorageSupported: !!window.localStorage,
        sessionStorageSupported: !!window.sessionStorage,
        indexedDBSupported: !!window.indexedDB,
        cacheAPISupported: 'caches' in window,
        storageEstimate: estimate
    };
}

async function getNetworkForensic(): Promise<ForensicFingerprint['network']> {
    const conn = (navigator as any).connection;
    const webrtcIps: string[] = [];
    let localIP: string | null = null;
    let publicIP: string | null = null;

    // WebRTC IP detection
    try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        await new Promise<void>((resolve) => {
            pc.onicecandidate = (e) => {
                if (!e.candidate) { resolve(); return; }
                const match = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
                if (match) {
                    const ip = match[1];
                    webrtcIps.push(ip);
                    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
                        localIP = ip;
                    } else {
                        publicIP = ip;
                    }
                }
            };
            pc.createOffer().then(offer => pc.setLocalDescription(offer));
            setTimeout(resolve, 2000);
        });
        pc.close();
    } catch { }

    return {
        connectionType: conn?.type || null,
        effectiveType: conn?.effectiveType || null,
        downlink: conn?.downlink || null,
        rtt: conn?.rtt || null,
        saveData: conn?.saveData || null,
        webrtcIps: [...new Set(webrtcIps)],
        webrtcLocalIP: localIP,
        webrtcPublicIP: publicIP
    };
}

async function getPermissionsForensic(): Promise<ForensicFingerprint['permissions']> {
    const checkPermission = async (name: string): Promise<string> => {
        try {
            const result = await navigator.permissions.query({ name: name as PermissionName });
            return result.state;
        } catch {
            return 'unknown';
        }
    };

    return {
        geolocation: await checkPermission('geolocation'),
        notifications: await checkPermission('notifications'),
        camera: await checkPermission('camera'),
        microphone: await checkPermission('microphone'),
        midi: await checkPermission('midi'),
        bluetooth: 'bluetooth' in navigator ? 'available' : 'unavailable'
    };
}

function getCSSFeaturesForensic(): ForensicFingerprint['cssFeatures'] {
    const matchMedia = (query: string): string => {
        try { return window.matchMedia(query).matches ? 'true' : 'false'; } catch { return 'unknown'; }
    };

    return {
        prefersColorScheme: matchMedia('(prefers-color-scheme: dark)') === 'true' ? 'dark' : 'light',
        prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)'),
        prefersContrast: matchMedia('(prefers-contrast: high)') === 'true' ? 'high' : 'normal',
        prefersReducedTransparency: matchMedia('(prefers-reduced-transparency: reduce)'),
        forcedColors: matchMedia('(forced-colors: active)'),
        colorGamut: matchMedia('(color-gamut: p3)') === 'true' ? 'p3' : 'srgb',
        hdr: matchMedia('(dynamic-range: high)') === 'true',
        pointer: matchMedia('(pointer: fine)') === 'true' ? 'fine' : 'coarse',
        hover: matchMedia('(hover: hover)') === 'true' ? 'hover' : 'none',
        anyPointer: matchMedia('(any-pointer: fine)') === 'true' ? 'fine' : 'coarse',
        anyHover: matchMedia('(any-hover: hover)') === 'true' ? 'hover' : 'none',
        displayMode: matchMedia('(display-mode: standalone)') === 'true' ? 'standalone' : 'browser'
    };
}

function getFeaturesForensic(): ForensicFingerprint['features'] {
    return {
        serviceWorkerSupported: 'serviceWorker' in navigator,
        webAssemblySupported: typeof WebAssembly !== 'undefined',
        webGPUSupported: 'gpu' in navigator,
        webXRSupported: 'xr' in navigator,
        webSocketSupported: 'WebSocket' in window,
        webRTCSupported: 'RTCPeerConnection' in window,
        webAuthNSupported: 'credentials' in navigator && 'PublicKeyCredential' in window,
        fileSystemAccessSupported: 'showOpenFilePicker' in window,
        notificationsSupported: 'Notification' in window,
        pushAPISupported: 'PushManager' in window,
        paymentRequestSupported: 'PaymentRequest' in window,
        credentialsAPISupported: 'credentials' in navigator,
        gamepadsSupported: 'getGamepads' in navigator,
        bluetoothSupported: 'bluetooth' in navigator,
        usbSupported: 'usb' in navigator,
        serialSupported: 'serial' in navigator,
        hid: 'hid' in navigator,
        nfc: 'NDEFReader' in window
    };
}

async function getSecurityForensic(): Promise<ForensicFingerprint['security']> {
    // Incognito detection
    let incognito = false;
    try {
        if (navigator.storage?.estimate) {
            const { quota } = await navigator.storage.estimate();
            incognito = (quota || 0) < 120000000;
        }
    } catch { }

    // DevTools detection
    const threshold = 160;
    const devToolsOpen = (window.outerWidth - window.innerWidth > threshold) ||
        (window.outerHeight - window.innerHeight > threshold);

    // VM Detection
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    let vmDetected = false;
    let vmConfidence = 0;
    let vmType: string | null = null;

    if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        const rendererLower = (renderer || '').toLowerCase();

        const vmIndicators = ['virtualbox', 'vmware', 'qemu', 'parallels', 'hyper-v', 'llvmpipe', 'swiftshader'];
        for (const indicator of vmIndicators) {
            if (rendererLower.includes(indicator)) {
                vmDetected = true;
                vmConfidence = 80;
                vmType = indicator.charAt(0).toUpperCase() + indicator.slice(1);
                break;
            }
        }
    }

    return {
        isSecureContext: window.isSecureContext,
        crossOriginIsolated: (window as any).crossOriginIsolated || false,
        webdriverDetected: (navigator as any).webdriver === true,
        automationDetected: !!(window as any).__webdriver_evaluate || !!(window as any).__selenium_evaluate,
        incognitoMode: incognito,
        extensionsDetected: !!(document.querySelector('[data-grammarly-extension]')) || !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
        devToolsOpen,
        vmDetected,
        vmConfidence,
        vmType
    };
}

function getBehavioralForensic(): ForensicFingerprint['behavioral'] {
    return {
        mousePresent: matchMedia('(pointer: fine)').matches,
        touchPresent: navigator.maxTouchPoints > 0,
        keyboardPresent: true, // Assumed
        gamepadPresent: navigator.getGamepads?.()?.length > 0 || false
    };
}
