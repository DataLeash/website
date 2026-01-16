import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Ko-fi webhook verification token (optional - Ko-fi doesn't require signature verification)
const KOFI_VERIFICATION_TOKEN = process.env.KOFI_VERIFICATION_TOKEN;

interface KofiWebhookData {
    verification_token: string;
    message_id: string;
    timestamp: string;
    type: 'Donation' | 'Subscription' | 'Commission' | 'Shop Order';
    is_public: boolean;
    from_name: string;
    message: string;
    amount: string;
    url: string;
    email: string;
    currency: string;
    is_subscription_payment: boolean;
    is_first_subscription_payment: boolean;
    kofi_transaction_id: string;
    shop_items: any[] | null;
    tier_name: string | null;
    shipping: any | null;
}

export async function POST(request: Request) {
    try {
        // Ko-fi sends data as form-urlencoded with a 'data' field containing JSON
        const formData = await request.formData();
        const dataString = formData.get('data') as string;

        if (!dataString) {
            console.error('No data in Ko-fi webhook');
            return NextResponse.json({ error: 'No data provided' }, { status: 400 });
        }

        const data: KofiWebhookData = JSON.parse(dataString);

        console.log('Ko-fi webhook received:', {
            type: data.type,
            email: data.email,
            amount: data.amount,
            tier_name: data.tier_name,
            is_subscription: data.is_subscription_payment,
            is_first: data.is_first_subscription_payment
        });

        // Optional: Verify token if set
        if (KOFI_VERIFICATION_TOKEN && data.verification_token !== KOFI_VERIFICATION_TOKEN) {
            console.error('Invalid Ko-fi verification token');
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Handle subscription payments
        if (data.type === 'Subscription' || data.is_subscription_payment) {
            const email = data.email?.toLowerCase();

            if (!email) {
                console.error('No email in subscription payment');
                return NextResponse.json({ error: 'No email provided' }, { status: 400 });
            }

            // Find user by email
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('id, email, tier')
                .ilike('email', email);

            if (userError) {
                console.error('Error finding user:', userError);
            }

            const user = users?.[0];

            if (user) {
                // Calculate subscription expiry (30 days from now)
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                // Upgrade user to Pro
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        tier: 'pro',
                        tier_started_at: data.is_first_subscription_payment
                            ? new Date().toISOString()
                            : undefined,
                        tier_expires_at: expiresAt.toISOString(),
                        kofi_subscription_id: data.kofi_transaction_id,
                    })
                    .eq('id', user.id);

                if (updateError) {
                    console.error('Error upgrading user:', updateError);
                } else {
                    console.log(`✅ User ${email} upgraded to Pro via Ko-fi subscription`);
                }

                // Record payment
                await supabase.from('payments').insert({
                    user_id: user.id,
                    stripe_subscription_id: data.kofi_transaction_id,
                    plan_id: 'pro',
                    amount: parseFloat(data.amount),
                    currency: data.currency,
                    status: 'completed',
                    provider: 'kofi'
                });

                // Send email notification to admin
                await sendAdminNotification(data, user.email);
            } else {
                // User not found - store for manual matching
                console.log(`⚠️ No user found with email ${email} - payment recorded for manual review`);

                await supabase.from('pending_subscriptions').insert({
                    email: email,
                    kofi_transaction_id: data.kofi_transaction_id,
                    amount: parseFloat(data.amount),
                    currency: data.currency,
                    tier_name: data.tier_name,
                    from_name: data.from_name,
                    message: data.message,
                    created_at: new Date().toISOString()
                }).catch(() => {
                    // Table might not exist, that's ok
                    console.log('Note: pending_subscriptions table does not exist');
                });

                // Still notify admin
                await sendAdminNotification(data, null);
            }
        }

        // Handle one-time donations (optional - treat as tips)
        if (data.type === 'Donation' && !data.is_subscription_payment) {
            console.log(`Donation received from ${data.from_name}: $${data.amount}`);
            await sendAdminNotification(data, null);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Ko-fi webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

// Send email notification to admin
async function sendAdminNotification(data: KofiWebhookData, matchedEmail: string | null) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const ADMIN_EMAIL = 'dataleashowner@gmail.com';

    if (!RESEND_API_KEY) {
        console.log('No Resend API key - skipping email notification');
        return;
    }

    const subject = matchedEmail
        ? `✅ New Pro Subscription: ${matchedEmail}`
        : `⚠️ New Payment (Manual Review Needed)`;

    const body = `
        <h2>Ko-fi Payment Received</h2>
        <table style="border-collapse: collapse; width: 100%;">
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${data.type}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>From</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${data.from_name}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${data.email || 'Not provided'}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">$${data.amount} ${data.currency}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tier</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${data.tier_name || 'N/A'}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Message</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${data.message || 'None'}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Transaction ID</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${data.kofi_transaction_id}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Subscription</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${data.is_subscription_payment ? 'Yes' : 'No'} ${data.is_first_subscription_payment ? '(First Payment)' : ''}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Auto-Activated</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${matchedEmail ? '✅ Yes' : '❌ No (User not found)'}</td>
            </tr>
        </table>
        ${!matchedEmail ? '<p style="color: red;"><strong>Action Required:</strong> Please manually upgrade this user in Supabase if they contact you.</p>' : ''}
    `;

    try {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL || 'DataLeash <onboarding@resend.dev>',
                to: ADMIN_EMAIL,
                subject: subject,
                html: body,
            }),
        });
        console.log('Admin notification email sent');
    } catch (error) {
        console.error('Failed to send admin notification:', error);
    }
}
