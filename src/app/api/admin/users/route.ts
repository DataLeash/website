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

// GET /api/admin/users - List all users with tier info
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

        // Parse query params for filtering
        const { searchParams } = new URL(request.url)
        const tier = searchParams.get('tier') // 'free', 'pro', 'all'
        const search = searchParams.get('search') // email search
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Build query
        let query = adminClient
            .from('users')
            .select(`
                id,
                email,
                full_name,
                tier,
                tier_started_at,
                tier_expires_at,
                kofi_subscription_id,
                kofi_email,
                payment_source,
                is_admin,
                account_status,
                last_login_at,
                created_at
            `, { count: 'exact' })

        // Apply filters
        if (tier && tier !== 'all') {
            query = query.eq('tier', tier)
        }
        if (search) {
            query = query.ilike('email', `%${search}%`)
        }

        // Pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        const { data: users, error, count } = await query

        if (error) {
            console.error('Admin users query error:', error)
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
        }

        // Get file counts for each user
        const userIds = users?.map(u => u.id) || []

        const { data: fileCounts } = await adminClient
            .from('files')
            .select('owner_id')
            .in('owner_id', userIds)
            .eq('is_destroyed', false)

        // Count files per user
        const fileCountMap: Record<string, number> = {}
        fileCounts?.forEach(f => {
            fileCountMap[f.owner_id] = (fileCountMap[f.owner_id] || 0) + 1
        })

        // Enrich users with file counts and status
        const enrichedUsers = users?.map(user => ({
            ...user,
            file_count: fileCountMap[user.id] || 0,
            is_expired: user.tier_expires_at ? new Date(user.tier_expires_at) < new Date() : false,
            effective_tier: user.tier_expires_at && new Date(user.tier_expires_at) < new Date()
                ? 'free'
                : user.tier
        })) || []

        // Get tier stats
        const { data: tierStats } = await adminClient
            .from('users')
            .select('tier')

        const stats = {
            total: count || 0,
            free: tierStats?.filter(u => u.tier === 'free' || !u.tier).length || 0,
            pro: tierStats?.filter(u => u.tier === 'pro').length || 0,
            enterprise: tierStats?.filter(u => u.tier === 'enterprise').length || 0
        }

        return NextResponse.json({
            users: enrichedUsers,
            stats,
            pagination: {
                total: count || 0,
                limit,
                offset,
                hasMore: (count || 0) > offset + limit
            }
        })

    } catch (error) {
        console.error('Admin users error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH /api/admin/users - Update user tier or status
// ADMIN ONLY
export async function PATCH(request: NextRequest) {
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

        const { user_id, action, tier, tier_expires_at, reason, account_status } = body

        if (!user_id || !action) {
            return NextResponse.json({ error: 'user_id and action required' }, { status: 400 })
        }

        // Get current user data
        const { data: targetUser, error: fetchError } = await adminClient
            .from('users')
            .select('*')
            .eq('id', user_id)
            .single()

        if (fetchError || !targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const oldValues = {
            tier: targetUser.tier,
            tier_expires_at: targetUser.tier_expires_at,
            account_status: targetUser.account_status
        }

        let updateData: Record<string, unknown> = {}
        let actionType = ''

        switch (action) {
            case 'upgrade_pro':
                updateData = {
                    tier: 'pro',
                    tier_started_at: new Date().toISOString(),
                    tier_expires_at: tier_expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    payment_source: 'manual'
                }
                actionType = 'tier_upgrade'
                break

            case 'downgrade_free':
                updateData = {
                    tier: 'free',
                    tier_expires_at: null,
                    kofi_subscription_id: null
                }
                actionType = 'tier_downgrade'
                break

            case 'extend_pro':
                const currentExpiry = targetUser.tier_expires_at
                    ? new Date(targetUser.tier_expires_at)
                    : new Date()
                const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000)
                updateData = {
                    tier: 'pro',
                    tier_expires_at: newExpiry.toISOString()
                }
                actionType = 'tier_upgrade'
                break

            case 'suspend':
                updateData = { account_status: 'suspended' }
                actionType = 'user_suspend'
                break

            case 'activate':
                updateData = { account_status: 'active' }
                actionType = 'user_activate'
                break

            case 'ban':
                updateData = { account_status: 'banned' }
                actionType = 'user_ban'
                break

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        // Update user
        const { error: updateError } = await adminClient
            .from('users')
            .update(updateData)
            .eq('id', user_id)

        if (updateError) {
            console.error('Admin update error:', updateError)
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
        }

        // Log admin action
        const { error: actionLogError } = await adminClient.from('admin_actions').insert({
            admin_id: auth.user.id,
            admin_email: auth.user.email,
            action_type: actionType,
            target_user_id: user_id,
            target_user_email: targetUser.email,
            old_value: oldValues,
            new_value: updateData,
            reason
        })
        if (actionLogError) console.error('Failed to log admin action:', actionLogError)

        return NextResponse.json({
            message: 'User updated successfully',
            action,
            user_id
        })

    } catch (error) {
        console.error('Admin users patch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
