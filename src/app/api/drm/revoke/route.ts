import { NextRequest, NextResponse } from 'next/server';
import { revokeDRMKey, getDRMKey } from '@/lib/drm/clear-key-server';

/**
 * DRM Revocation API
 * 
 * Instantly revokes DRM access for a file.
 * After revocation, all future license requests will be denied,
 * and any currently playing content will stop working on next key refresh.
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fileId } = body;

        if (!fileId) {
            return NextResponse.json(
                { error: 'Missing fileId' },
                { status: 400 }
            );
        }

        console.log(`[DRM Revoke] Revoking access for file: ${fileId}`);

        const success = revokeDRMKey(fileId);

        if (success) {
            return NextResponse.json({
                success: true,
                message: `DRM access revoked for file ${fileId}`,
                timestamp: new Date().toISOString()
            });
        } else {
            return NextResponse.json({
                success: false,
                message: `No DRM key found for file ${fileId}`
            });
        }

    } catch (error) {
        console.error('[DRM Revoke] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint to check revocation status
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
        isRevoked: keyRecord?.isRevoked ?? true, // If no record, treat as revoked
        revokedAt: keyRecord?.isRevoked ? new Date().toISOString() : null
    });
}
