import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
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

// Verify webhook signature (optional but recommended)
async function verifyWebhookSignature(
    headers: Headers,
    body: string,
    webhookId: string
): Promise<boolean> {
    try {
        const accessToken = await getPayPalAccessToken();

        const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                auth_algo: headers.get('paypal-auth-algo'),
                cert_url: headers.get('paypal-cert-url'),
                transmission_id: headers.get('paypal-transmission-id'),
                transmission_sig: headers.get('paypal-transmission-sig'),
                transmission_time: headers.get('paypal-transmission-time'),
                webhook_id: webhookId,
                webhook_event: JSON.parse(body),
            }),
        });

        const result = await response.json();
        return result.verification_status === 'SUCCESS';
    } catch (error) {
        console.error('Webhook verification error:', error);
        return false;
    }
}

export async function POST(request: Request) {
    const body = await request.text();
    const event = JSON.parse(body);
    const eventType = event.event_type;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('PayPal webhook received:', eventType);

    try {
        switch (eventType) {
            case 'BILLING.SUBSCRIPTION.ACTIVATED': {
                // Subscription was activated - upgrade user
                const subscription = event.resource;
                const customId = subscription.custom_id; // This is our user_id

                if (customId) {
                    // Calculate expiry date (next billing date)
                    const nextBillingTime = subscription.billing_info?.next_billing_time;
                    const expiresAt = nextBillingTime
                        ? new Date(nextBillingTime).toISOString()
                        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                    // Upgrade user to Pro
                    await supabase
                        .from('users')
                        .update({
                            tier: 'pro',
                            tier_started_at: new Date().toISOString(),
                            tier_expires_at: expiresAt,
                            paypal_subscription_id: subscription.id
                        })
                        .eq('id', customId);

                    // Record payment
                    await supabase
                        .from('payments')
                        .insert({
                            user_id: customId,
                            stripe_subscription_id: subscription.id, // Using this field for PayPal subscription ID
                            plan_id: 'pro',
                            amount: 29,
                            currency: 'USD',
                            status: 'completed',
                            provider: 'paypal'
                        });

                    console.log(`User ${customId} upgraded to Pro via PayPal`);
                }
                break;
            }

            case 'BILLING.SUBSCRIPTION.CANCELLED':
            case 'BILLING.SUBSCRIPTION.SUSPENDED':
            case 'BILLING.SUBSCRIPTION.EXPIRED': {
                // Subscription cancelled/suspended - downgrade user
                const subscription = event.resource;
                const customId = subscription.custom_id;

                if (customId) {
                    // Downgrade to free tier
                    await supabase
                        .from('users')
                        .update({
                            tier: 'free',
                            tier_expires_at: null,
                            paypal_subscription_id: null
                        })
                        .eq('id', customId);

                    console.log(`User ${customId} subscription cancelled`);
                }
                break;
            }

            case 'PAYMENT.SALE.COMPLETED': {
                // Recurring payment completed - extend subscription
                const sale = event.resource;
                const subscriptionId = sale.billing_agreement_id;

                if (subscriptionId) {
                    // Find user by subscription ID
                    const { data: user } = await supabase
                        .from('users')
                        .select('id')
                        .eq('paypal_subscription_id', subscriptionId)
                        .single();

                    if (user) {
                        // Extend expiry by 30 days
                        const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                        await supabase
                            .from('users')
                            .update({
                                tier_expires_at: newExpiry
                            })
                            .eq('id', user.id);

                        // Record payment
                        await supabase
                            .from('payments')
                            .insert({
                                user_id: user.id,
                                stripe_subscription_id: subscriptionId,
                                plan_id: 'pro',
                                amount: parseFloat(sale.amount.total),
                                currency: sale.amount.currency,
                                status: 'completed',
                                provider: 'paypal'
                            });

                        console.log(`Recurring payment processed for user ${user.id}`);
                    }
                }
                break;
            }

            case 'PAYMENT.SALE.DENIED':
            case 'PAYMENT.SALE.REFUNDED': {
                // Payment failed or refunded
                const sale = event.resource;
                const subscriptionId = sale.billing_agreement_id;

                if (subscriptionId) {
                    const { data: user } = await supabase
                        .from('users')
                        .select('id')
                        .eq('paypal_subscription_id', subscriptionId)
                        .single();

                    if (user) {
                        await supabase
                            .from('payments')
                            .insert({
                                user_id: user.id,
                                stripe_subscription_id: subscriptionId,
                                plan_id: 'pro',
                                amount: parseFloat(sale.amount?.total || '0'),
                                currency: sale.amount?.currency || 'USD',
                                status: eventType === 'PAYMENT.SALE.REFUNDED' ? 'refunded' : 'failed',
                                provider: 'paypal'
                            });

                        console.log(`Payment ${eventType} for user ${user.id}`);
                    }
                }
                break;
            }

            default:
                console.log(`Unhandled PayPal event: ${eventType}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
