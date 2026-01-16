import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_PLAN_ID = process.env.PAYPAL_PLAN_ID!;
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return data.access_token;
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { returnUrl, cancelUrl } = await request.json();

        // Get PayPal access token
        const accessToken = await getPayPalAccessToken();

        // Create subscription
        const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'PayPal-Request-Id': `dataleash-${user.id}-${Date.now()}`,
            },
            body: JSON.stringify({
                plan_id: PAYPAL_PLAN_ID,
                custom_id: user.id, // Store user_id to identify them in webhook
                subscriber: {
                    email_address: user.email,
                },
                application_context: {
                    brand_name: 'DataLeash',
                    locale: 'en-US',
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'SUBSCRIBE_NOW',
                    return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
                    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?cancelled=true`,
                },
            }),
        });

        const subscription = await response.json();

        if (!response.ok) {
            console.error('PayPal subscription error:', subscription);
            return NextResponse.json(
                { error: subscription.message || 'Failed to create subscription' },
                { status: response.status }
            );
        }

        // Find the approval URL
        const approvalUrl = subscription.links?.find(
            (link: { rel: string; href: string }) => link.rel === 'approve'
        )?.href;

        return NextResponse.json({
            subscriptionId: subscription.id,
            approvalUrl,
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json(
            { error: 'Failed to create subscription' },
            { status: 500 }
        );
    }
}
