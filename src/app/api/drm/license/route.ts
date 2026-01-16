import { NextRequest, NextResponse } from 'next/server';
import { generateClearKeyLicense, getDRMKey, generateDRMKey } from '@/lib/drm/clear-key-server';

/**
 * DRM License Server API
 * 
 * This endpoint handles license requests from the browser's EME subsystem.
 * When a video element encounters encrypted content, it sends a license request here.
 * We validate the session, then return the decryption key in ClearKey format.
 * 
 * Flow:
 * 1. Browser detects encrypted content (via PSSH box in video)
 * 2. Browser's CDM sends license request to this endpoint
 * 3. We validate the session/user has access
 * 4. We return the AES key in ClearKey JSON format
 * 5. Browser CDM uses key to decrypt video in hardware-secure path
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fileId, sessionId, licenseRequest } = body;

        if (!fileId) {
            return NextResponse.json(
                { error: 'Missing fileId' },
                { status: 400 }
            );
        }

        console.log(`[DRM API] License request for file: ${fileId}, session: ${sessionId}`);

        // TODO: Validate session against database
        // For now, we'll just check if a valid DRM key exists
        let keyRecord = getDRMKey(fileId);

        // If no key exists, generate one (for demo purposes)
        // In production, keys should be generated during upload
        if (!keyRecord) {
            console.log(`[DRM API] No key found, generating new key for ${fileId}`);
            keyRecord = generateDRMKey(fileId);
        }

        // Generate ClearKey license response
        const license = generateClearKeyLicense(fileId, sessionId);

        if (!license) {
            console.log(`[DRM API] License denied for file: ${fileId}`);
            return NextResponse.json(
                { error: 'License denied - access revoked or expired' },
                { status: 403 }
            );
        }

        console.log(`[DRM API] License issued for file: ${fileId}`);

        // Return license in ClearKey format
        return NextResponse.json(license);

    } catch (error) {
        console.error('[DRM API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint to check DRM status for a file
 */
export async function GET(request: NextRequest) {
    const fileId = request.nextUrl.searchParams.get('fileId');

    if (!fileId) {
        return NextResponse.json(
            { error: 'Missing fileId parameter' },
            { status: 400 }
        );
    }

    const keyRecord = getDRMKey(fileId);

    return NextResponse.json({
        fileId,
        hasDRMKey: !!keyRecord,
        isRevoked: keyRecord?.isRevoked ?? false,
        expiresAt: keyRecord?.expiresAt ?? null,
    });
}
