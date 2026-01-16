/**
 * DataLeash ClearKey License Server
 * 
 * Implements a ClearKey-compatible license server for EME (Encrypted Media Extensions).
 * ClearKey is a basic DRM system built into all browsers that allows testing
 * the encrypted media pipeline without requiring Widevine/PlayReady registration.
 * 
 * Flow:
 * 1. When a file is uploaded, we generate a unique AES-128 encryption key
 * 2. The key is stored server-side, associated with the file ID
 * 3. When the client requests playback, it sends a license request
 * 4. We validate the session/user, then return the key in ClearKey format
 * 5. The browser's CDM uses this key to decrypt the video stream
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// =====================================================
// KEY STORAGE (In production, use database)
// =====================================================

interface DRMKeyRecord {
    keyId: string;           // 16-byte key ID (hex)
    key: string;             // 16-byte AES key (hex)
    fileId: string;          // Associated file
    createdAt: number;       // Timestamp
    expiresAt: number | null; // Optional expiration
    isRevoked: boolean;      // Revocation status
}

// In-memory storage (replace with Supabase in production)
const keyStore: Map<string, DRMKeyRecord> = new Map();

// =====================================================
// KEY GENERATION
// =====================================================

/**
 * Generate a new DRM key pair for a file
 */
export function generateDRMKey(fileId: string, expiresInHours?: number): DRMKeyRecord {
    // Generate 16-byte (128-bit) key ID and key
    const keyId = randomBytes(16).toString('hex');
    const key = randomBytes(16).toString('hex');

    const record: DRMKeyRecord = {
        keyId,
        key,
        fileId,
        createdAt: Date.now(),
        expiresAt: expiresInHours ? Date.now() + (expiresInHours * 60 * 60 * 1000) : null,
        isRevoked: false
    };

    // Store by file ID for easy lookup
    keyStore.set(fileId, record);

    console.log(`[DRM] Generated key for file ${fileId}: keyId=${keyId.substring(0, 8)}...`);

    return record;
}

/**
 * Get DRM key for a file (if valid)
 */
export function getDRMKey(fileId: string): DRMKeyRecord | null {
    const record = keyStore.get(fileId);

    if (!record) {
        console.log(`[DRM] No key found for file ${fileId}`);
        return null;
    }

    if (record.isRevoked) {
        console.log(`[DRM] Key for file ${fileId} is revoked`);
        return null;
    }

    if (record.expiresAt && Date.now() > record.expiresAt) {
        console.log(`[DRM] Key for file ${fileId} has expired`);
        return null;
    }

    return record;
}

/**
 * Revoke DRM access for a file (instant kill switch)
 */
export function revokeDRMKey(fileId: string): boolean {
    const record = keyStore.get(fileId);

    if (record) {
        record.isRevoked = true;
        console.log(`[DRM] Revoked key for file ${fileId}`);
        return true;
    }

    return false;
}

// =====================================================
// CLEARKEY LICENSE GENERATION
// =====================================================

/**
 * ClearKey license format as per W3C EME specification
 * https://www.w3.org/TR/encrypted-media/#clear-key
 */
interface ClearKeyLicense {
    keys: Array<{
        kty: 'oct';           // Key type: octet sequence (raw bytes)
        k: string;            // Base64url-encoded key
        kid: string;          // Base64url-encoded key ID
    }>;
    type: 'temporary';
}

/**
 * Convert hex string to base64url (ClearKey format)
 */
function hexToBase64url(hex: string): string {
    const bytes = Buffer.from(hex, 'hex');
    return bytes.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Generate ClearKey license response for a file
 * This is what gets returned to the browser's EME subsystem
 */
export function generateClearKeyLicense(fileId: string, sessionId?: string): ClearKeyLicense | null {
    // Validate session if provided
    if (sessionId) {
        // TODO: Validate against active sessions in database
        console.log(`[DRM] Validating session ${sessionId} for file ${fileId}`);
    }

    const keyRecord = getDRMKey(fileId);

    if (!keyRecord) {
        return null;
    }

    const license: ClearKeyLicense = {
        keys: [{
            kty: 'oct',
            k: hexToBase64url(keyRecord.key),
            kid: hexToBase64url(keyRecord.keyId)
        }],
        type: 'temporary'
    };

    console.log(`[DRM] Generated ClearKey license for file ${fileId}`);

    return license;
}

/**
 * Parse ClearKey license request from browser
 * The browser sends this when it encounters encrypted media
 */
export function parseClearKeyRequest(requestData: ArrayBuffer): string[] {
    try {
        const decoder = new TextDecoder();
        const request = JSON.parse(decoder.decode(requestData));

        // ClearKey request format: { "kids": ["base64url_kid1", "base64url_kid2", ...] }
        if (request.kids && Array.isArray(request.kids)) {
            return request.kids;
        }

        return [];
    } catch (error) {
        console.error('[DRM] Failed to parse ClearKey request:', error);
        return [];
    }
}

// =====================================================
// PSSH BOX GENERATION (For encrypted video headers)
// =====================================================

/**
 * Generate PSSH (Protection System Specific Header) box for ClearKey
 * This gets embedded in the MP4 file to tell the browser how to decrypt
 */
export function generateClearKeyPSSH(keyId: string): Buffer {
    const keyIdBytes = Buffer.from(keyId, 'hex');

    // ClearKey System ID: 1077efec-c0b2-4d02-ace3-3c1e52e2fb4b
    const systemId = Buffer.from([
        0x10, 0x77, 0xef, 0xec, 0xc0, 0xb2, 0x4d, 0x02,
        0xac, 0xe3, 0x3c, 0x1e, 0x52, 0xe2, 0xfb, 0x4b
    ]);

    // PSSH box structure:
    // 4 bytes: box size
    // 4 bytes: 'pssh'
    // 1 byte: version (1 for kid list)
    // 3 bytes: flags
    // 16 bytes: system ID
    // 4 bytes: kid count
    // 16 bytes per kid: key IDs
    // 4 bytes: data size
    // N bytes: data (empty for ClearKey)

    const version = 1;
    const kidCount = 1;
    const dataSize = 0;

    const boxSize = 4 + 4 + 1 + 3 + 16 + 4 + (16 * kidCount) + 4 + dataSize;

    const pssh = Buffer.alloc(boxSize);
    let offset = 0;

    // Box size
    pssh.writeUInt32BE(boxSize, offset);
    offset += 4;

    // Box type 'pssh'
    pssh.write('pssh', offset);
    offset += 4;

    // Version and flags
    pssh.writeUInt8(version, offset);
    offset += 1;
    pssh.writeUInt8(0, offset); offset += 1;
    pssh.writeUInt8(0, offset); offset += 1;
    pssh.writeUInt8(0, offset); offset += 1;

    // System ID
    systemId.copy(pssh, offset);
    offset += 16;

    // KID count
    pssh.writeUInt32BE(kidCount, offset);
    offset += 4;

    // Key ID
    keyIdBytes.copy(pssh, offset);
    offset += 16;

    // Data size (0 for ClearKey)
    pssh.writeUInt32BE(dataSize, offset);

    return pssh;
}

// =====================================================
// CONTENT ENCRYPTION (AES-128-CTR for CENC)
// =====================================================

/**
 * Encrypt content using CENC (Common Encryption Scheme)
 * Uses AES-128-CTR mode as specified by ISO/IEC 23001-7
 */
export function encryptContent(
    plaintext: Buffer,
    keyHex: string,
    ivHex?: string
): { ciphertext: Buffer; iv: string } {
    const key = Buffer.from(keyHex, 'hex');
    const iv = ivHex ? Buffer.from(ivHex, 'hex') : randomBytes(16);

    const cipher = createCipheriv('aes-128-ctr', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    return {
        ciphertext,
        iv: iv.toString('hex')
    };
}

/**
 * Decrypt content (for server-side operations)
 */
export function decryptContent(
    ciphertext: Buffer,
    keyHex: string,
    ivHex: string
): Buffer {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = createDecipheriv('aes-128-ctr', key, iv);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// =====================================================
// EXPORTS
// =====================================================

export type { DRMKeyRecord, ClearKeyLicense };
