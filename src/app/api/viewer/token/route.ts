import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
    try {
        const { email, fileId, userId } = await request.json();

        if (!email || !fileId) {
            return NextResponse.json(
                { error: 'Email and fileId are required' },
                { status: 400 }
            );
        }

        // Create a service role client
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verify the file exists
        const { data: file, error: fileError } = await supabase
            .from('files')
            .select('id, owner_id, is_destroyed')
            .eq('id', fileId)
            .single();

        if (fileError || !file) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        if (file.is_destroyed) {
            return NextResponse.json(
                { error: 'This file has been permanently destroyed' },
                { status: 410 }
            );
        }

        // Generate a secure access token for this viewer session
        const accessToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store the access token (using the existing access_tokens table if it exists)
        try {
            await supabase
                .from('access_tokens')
                .insert({
                    token: accessToken,
                    file_id: fileId,
                    viewer_email: email,
                    viewer_id: userId || null,
                    expires_at: expiresAt.toISOString(),
                    is_valid: true
                });
        } catch (tokenError) {
            // If table doesn't exist or insert fails, just log and continue
            console.log('Access token storage skipped:', tokenError);
        }

        return NextResponse.json({
            success: true,
            accessToken
        });

    } catch (error) {
        console.error('Viewer token error:', error);
        return NextResponse.json(
            { error: 'Failed to generate access token' },
            { status: 500 }
        );
    }
}
