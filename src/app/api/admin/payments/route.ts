import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdminUser, adminOnlyError } from '@/lib/tier-middleware'

function getSupabaseAdmin() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// GET /api/admin/payments - List all payment logs
// ADMIN ONLY
export async function GET(request: NextRequest) {
    try {
        // Check admin access
        const auth = await getAuthenticatedUser()

        if (!auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!isAdminUser(auth)) {
            return NextResponse.json(adminOnlyError(), { status: 403 })
        }

        const adminClient = getSupabaseAdmin()

        // Parse query params
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') // 'completed', 'pending', 'all'
        const source = searchParams.get('source') // 'kofi', 'manual', 'all'
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Build query
        let query = adminClient
            .from('payment_logs')
            .select('*', { count: 'exact' })

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }
        if (source && source !== 'all') {
            query = query.eq('payment_source', source)
        }

        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        const { data: payments, error, count } = await query

        if (error) {
            console.error('Payment logs query error:', error)
            return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
        }

        // Get stats
        const { data: allPayments } = await adminClient
            .from('payment_logs')
            .select('amount, status, payment_source')

        const stats = {
            total: count || 0,
            totalAmount: allPayments?.reduce((sum, p) => sum + (p.status === 'completed' ? parseFloat(p.amount) : 0), 0) || 0,
            bySource: {
                kofi: allPayments?.filter(p => p.payment_source === 'kofi').length || 0,
                manual: allPayments?.filter(p => p.payment_source === 'manual').length || 0,
                stripe: allPayments?.filter(p => p.payment_source === 'stripe').length || 0
            },
            byStatus: {
                completed: allPayments?.filter(p => p.status === 'completed').length || 0,
                pending: allPayments?.filter(p => p.status === 'pending').length || 0,
                refunded: allPayments?.filter(p => p.status === 'refunded').length || 0
            }
        }

        return NextResponse.json({
            payments: payments || [],
            stats,
            pagination: {
                total: count || 0,
                limit,
                offset,
                hasMore: (count || 0) > offset + limit
            }
        })

    } catch (error) {
        console.error('Admin payments error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/admin/payments - Record a manual payment
// ADMIN ONLY
export async function POST(request: NextRequest) {
    try {
        // Check admin access
        const auth = await getAuthenticatedUser()

        if (!auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!isAdminUser(auth)) {
            return NextResponse.json(adminOnlyError(), { status: 403 })
        }

        const adminClient = getSupabaseAdmin()
        const body = await request.json()

        const {
            user_email,
            amount,
            tier_duration_days = 30,
            reason,
            transaction_id
        } = body

        if (!user_email || !amount) {
            return NextResponse.json({ error: 'user_email and amount required' }, { status: 400 })
        }

        // Find user
        const { data: user, error: userError } = await adminClient
            .from('users')
            .select('id, email, tier, tier_expires_at')
            .eq('email', user_email.toLowerCase())
            .single()

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Calculate new expiration
        const currentExpiry = user.tier_expires_at
            ? new Date(user.tier_expires_at)
            : new Date()
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date()
        const newExpiry = new Date(baseDate.getTime() + tier_duration_days * 24 * 60 * 60 * 1000)

        // Update user tier
        await adminClient
            .from('users')
            .update({
                tier: 'pro',
                tier_started_at: user.tier !== 'pro' ? new Date().toISOString() : undefined,
                tier_expires_at: newExpiry.toISOString(),
                payment_source: 'manual'
            })
            .eq('id', user.id)

        // Log payment
        const { data: paymentLog, error: logError } = await adminClient
            .from('payment_logs')
            .insert({
                user_id: user.id,
                user_email: user.email,
                amount: parseFloat(amount),
                currency: 'USD',
                payment_source: 'manual',
                transaction_id: transaction_id || `manual_${Date.now()}`,
                is_subscription: false,
                status: 'completed',
                tier_granted: 'pro',
                tier_duration_days,
                tier_expires_at: newExpiry.toISOString(),
                auto_activated: true,
                admin_notes: reason,
                reviewed_by: auth.user.email,
                reviewed_at: new Date().toISOString()
            })
            .select()
            .single()

        if (logError) {
            console.error('Payment log error:', logError)
        }

        // Log admin action
        const { error: actionLogError } = await adminClient.from('admin_actions').insert({
            admin_id: auth.user.id,
            admin_email: auth.user.email,
            action_type: 'payment_manual',
            target_user_id: user.id,
            target_user_email: user.email,
            new_value: { amount, tier_duration_days, tier_expires_at: newExpiry.toISOString() },
            reason
        })
        if (actionLogError) console.error('Failed to log admin action:', actionLogError)

        return NextResponse.json({
            message: 'Manual payment recorded and tier upgraded',
            user_id: user.id,
            new_expiry: newExpiry.toISOString(),
            payment_id: paymentLog?.id
        })

    } catch (error) {
        console.error('Admin manual payment error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
