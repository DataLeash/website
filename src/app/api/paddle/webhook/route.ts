import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET!;

// Verify webhook signature from Paddle
function verifySignature(payload: string, signature: string, secret: string): boolean {
    if (!secret) return true; // Skip verification if no secret set (for testing)

    try {
        // Paddle uses ts;h1=signature format
        const parts = signature.split(';');
        const signaturePart = parts.find(p => p.startsWith('h1='));
        if (!signaturePart) return false;

        const expectedSignature = signaturePart.replace('h1=', '');
        const hmac = crypto.createHmac('sha256', secret);
        const digest = hmac.update(payload).digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(digest)
        );
    } catch {
        return false;
    }
}

export async function POST(request: Request) {
    const body = await request.text();
    const signature = request.headers.get('paddle-signature') || '';

    // Verify webhook signature
    if (PADDLE_WEBHOOK_SECRET && !verifySignature(body, signature, PADDLE_WEBHOOK_SECRET)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event_type;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Paddle webhook received:', eventType);

    try {
        switch (eventType) {
            case 'subscription.created':
            case 'subscription.activated':
            case 'subscription.updated': {
                const subscription = event.data;
                const customData = subscription.custom_data || {};
                const userId = customData.user_id;

                if (userId) {
                    const status = subscription.status;

                    if (status === 'active' || status === 'trialing') {
                        // Calculate expiry date
                        const currentPeriodEnd = subscription.current_billing_period?.ends_at;
                        const expiresAt = currentPeriodEnd
                            ? new Date(currentPeriodEnd).toISOString()
                            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                        // Upgrade user to Pro
                        await supabase
                            .from('users')
                            .update({
                                tier: 'pro',
                                tier_started_at: new Date().toISOString(),
                                tier_expires_at: expiresAt
                            })
                            .eq('id', userId);

                        // Record payment
                        const items = subscription.items || [];
                        const amount = items[0]?.price?.unit_price?.amount || 2900;

                        await supabase
                            .from('payments')
                            .insert({
                                user_id: userId,
                                stripe_subscription_id: subscription.id, // Using this field for Paddle subscription ID
                                plan_id: 'pro',
                                amount: parseInt(amount) / 100,
                                currency: subscription.currency_code || 'USD',
                                status: 'completed',
                                provider: 'paddle'
                            });

                        console.log(`User ${userId} upgraded to Pro via Paddle`);
                    }
                }
                break;
            }

            case 'subscription.canceled':
            case 'subscription.paused': {
                const subscription = event.data;
                const customData = subscription.custom_data || {};
                const userId = customData.user_id;

                if (userId) {
                    // Downgrade to free tier when subscription ends
                    const scheduledChangeAt = subscription.scheduled_change?.effective_at;

                    if (scheduledChangeAt) {
                        // Set expiry to when subscription actually ends
                        await supabase
                            .from('users')
                            .update({
                                tier_expires_at: new Date(scheduledChangeAt).toISOString()
                            })
                            .eq('id', userId);
                    } else {
                        // Immediate cancellation
                        await supabase
                            .from('users')
                            .update({
                                tier: 'free',
                                tier_expires_at: null
                            })
                            .eq('id', userId);
                    }

                    console.log(`User ${userId} subscription cancelled`);
                }
                break;
            }

            case 'subscription.past_due':
            case 'subscription.payment_failed': {
                const subscription = event.data;
                const customData = subscription.custom_data || {};
                const userId = customData.user_id;

                if (userId) {
                    // Record failed payment
                    await supabase
                        .from('payments')
                        .insert({
                            user_id: userId,
                            stripe_subscription_id: subscription.id,
                            plan_id: 'pro',
                            amount: 0,
                            currency: subscription.currency_code || 'USD',
                            status: 'failed',
                            provider: 'paddle'
                        });

                    console.log(`Payment failed for user ${userId}`);
                }
                break;
            }

            case 'transaction.completed': {
                // One-time payment or subscription payment completed
                const transaction = event.data;
                const customData = transaction.custom_data || {};
                const userId = customData.user_id;

                if (userId && !transaction.subscription_id) {
                    // One-time payment - could be used for lifetime deals
                    console.log(`Transaction completed for user ${userId}`);
                }
                break;
            }

            default:
                console.log(`Unhandled Paddle event: ${eventType}`);
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
