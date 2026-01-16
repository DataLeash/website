import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Lemon Squeezy API
const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY!;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID!;
const LEMON_SQUEEZY_VARIANT_ID = process.env.LEMON_SQUEEZY_PRO_VARIANT_ID!; // Pro plan variant

export async function POST(request: Request) {
    try {
        const { userId, userEmail, planId } = await request.json();

        if (!userId || !userEmail) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create Lemon Squeezy checkout session
        const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`
            },
            body: JSON.stringify({
                data: {
                    type: 'checkouts',
                    attributes: {
                        checkout_data: {
                            email: userEmail,
                            custom: {
                                user_id: userId,
                                plan_id: planId || 'pro'
                            }
                        },
                        product_options: {
                            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?upgrade=success`,
                        }
                    },
                    relationships: {
                        store: {
                            data: {
                                type: 'stores',
                                id: LEMON_SQUEEZY_STORE_ID
                            }
                        },
                        variant: {
                            data: {
                                type: 'variants',
                                id: LEMON_SQUEEZY_VARIANT_ID
                            }
                        }
                    }
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Lemon Squeezy error:', error);
            return NextResponse.json(
                { error: 'Failed to create checkout session' },
                { status: 500 }
            );
        }

        const data = await response.json();
        const checkoutUrl = data.data.attributes.url;

        return NextResponse.json({
            url: checkoutUrl,
            checkoutId: data.data.id
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
