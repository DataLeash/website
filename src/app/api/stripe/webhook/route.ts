import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const LEMON_SQUEEZY_WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!;

// Verify webhook signature from Lemon Squeezy
function verifySignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request: Request) {
    const body = await request.text();
    const signature = request.headers.get('x-signature') || '';

    // Verify webhook signature
    if (LEMON_SQUEEZY_WEBHOOK_SECRET && !verifySignature(body, signature, LEMON_SQUEEZY_WEBHOOK_SECRET)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventName = event.meta?.event_name;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        switch (eventName) {
            case 'subscription_created':
            case 'subscription_updated': {
                const customData = event.meta?.custom_data || {};
                const userId = customData.user_id;
                const planId = customData.plan_id || 'pro';

                if (userId) {
                    const subscriptionData = event.data?.attributes;
                    const status = subscriptionData?.status;

                    if (status === 'active' || status === 'on_trial') {
                        // Upgrade user to Pro
                        const endsAt = subscriptionData?.ends_at || subscriptionData?.renews_at;

                        await supabase
                            .from('users')
                            .update({
                                tier: planId,
                                tier_started_at: new Date().toISOString(),
                                tier_expires_at: endsAt ? new Date(endsAt).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                            })
                            .eq('id', userId);

                        // Record payment
                        await supabase
                            .from('payments')
                            .insert({
                                user_id: userId,
                                stripe_subscription_id: String(event.data?.id), // Using this field for LS subscription ID
                                plan_id: planId,
                                amount: subscriptionData?.first_subscription_item?.price || 2900,
                                status: 'succeeded',
                                payment_method: 'lemonsqueezy'
                            });

                        console.log(`User ${userId} upgraded to ${planId} via Lemon Squeezy`);
                    }
                }
                break;
            }

            case 'subscription_cancelled':
            case 'subscription_expired': {
                const customData = event.meta?.custom_data || {};
                const userId = customData.user_id;

                if (userId) {
                    // Downgrade user to free tier
                    await supabase
                        .from('users')
                        .update({
                            tier: 'free',
                            tier_expires_at: null
                        })
                        .eq('id', userId);

                    console.log(`User ${userId} downgraded to free tier`);
                }
                break;
            }

            case 'subscription_payment_failed': {
                const customData = event.meta?.custom_data || {};
                const userId = customData.user_id;

                if (userId) {
                    await supabase
                        .from('payments')
                        .insert({
                            user_id: userId,
                            stripe_subscription_id: String(event.data?.id),
                            amount: 0,
                            status: 'failed',
                            payment_method: 'lemonsqueezy'
                        });

                    console.log(`Payment failed for user ${userId}`);
                }
                break;
            }

            case 'order_created': {
                // One-time payment or first subscription payment
                const customData = event.meta?.custom_data || {};
                const userId = customData.user_id;
                const planId = customData.plan_id || 'pro';

                if (userId) {
                    const orderData = event.data?.attributes;

                    await supabase
                        .from('users')
                        .update({
                            tier: planId,
                            tier_started_at: new Date().toISOString(),
                            tier_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                        })
                        .eq('id', userId);

                    await supabase
                        .from('payments')
                        .insert({
                            user_id: userId,
                            stripe_payment_id: String(event.data?.id),
                            plan_id: planId,
                            amount: orderData?.total || 2900,
                            status: 'succeeded',
                            payment_method: 'lemonsqueezy',
                            receipt_url: orderData?.urls?.receipt
                        });

                    console.log(`Order completed for user ${userId}`);
                }
                break;
            }

            default:
                console.log(`Unhandled Lemon Squeezy event: ${eventName}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
