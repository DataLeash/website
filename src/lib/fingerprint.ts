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

