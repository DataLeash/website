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
// ADMIN ONLY - Now fetches from auth.users to show ALL users
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

        // Fetch ALL users from auth.users (this includes OAuth users!)
        const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({
            perPage: 1000 // Get all users
        })

        if (authError) {
            console.error('Auth users fetch error:', authError)
            return NextResponse.json({ error: 'Failed to fetch users', details: authError.message }, { status: 500 })
        }

        const authUsers = authData?.users || []

        // Get all public.users data for tier info
        const { data: publicUsers } = await adminClient
            .from('users')
            .select('*')

        const publicUsersMap = new Map((publicUsers || []).map(u => [u.id, u]))

        // Get file counts for each user
        const userIds = authUsers.map(u => u.id)
        let fileCountMap: Record<string, number> = {}

        if (userIds.length > 0) {
            const { data: fileCounts } = await adminClient
                .from('files')
                .select('owner_id')
                .in('owner_id', userIds)
                .eq('is_destroyed', false)

            fileCounts?.forEach(f => {
                fileCountMap[f.owner_id] = (fileCountMap[f.owner_id] || 0) + 1
            })
        }

        // Build enriched users list combining auth.users + public.users data
        let enrichedUsers = authUsers.map(authUser => {
            const publicUser = publicUsersMap.get(authUser.id) || {}

            // Extract provider info from auth user
            const providers = authUser.app_metadata?.providers || []
            const provider = authUser.app_metadata?.provider || 'email'
            const allProviders = providers.length > 0 ? providers : [provider]

            // Get display-friendly provider names
            const providerDisplay = allProviders.map((p: string) => {
                switch (p.toLowerCase()) {
                    case 'google': return 'Google'
                    case 'github': return 'GitHub'
                    case 'discord': return 'Discord'
                    case 'email': return 'Email'
                    default: return p.charAt(0).toUpperCase() + p.slice(1)
                }
            }).join(', ')

            const tier = publicUser.tier || 'free'
            const tierExpiresAt = publicUser.tier_expires_at
            const isExpired = tierExpiresAt ? new Date(tierExpiresAt) < new Date() : false

            return {
                id: authUser.id,
                email: authUser.email || 'Unknown',
                full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || publicUser.full_name || null,
                avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
                tier: tier,
                tier_started_at: publicUser.tier_started_at || null,
                tier_expires_at: tierExpiresAt || null,
                kofi_subscription_id: publicUser.kofi_subscription_id || null,
                kofi_email: publicUser.kofi_email || null,
                payment_source: publicUser.payment_source || null,
                is_admin: publicUser.is_admin || false,
                account_status: publicUser.account_status || 'active',
                last_login_at: authUser.last_sign_in_at || publicUser.last_login_at || null,
                created_at: authUser.created_at || publicUser.created_at,
                file_count: fileCountMap[authUser.id] || 0,
                is_expired: isExpired,
                effective_tier: isExpired ? 'free' : tier,
                // NEW: Auth provider info
                auth_provider: providerDisplay,
                auth_providers: allProviders,
                email_confirmed: !!authUser.email_confirmed_at,
                phone: authUser.phone || publicUser.phone || null,
                // Indicates if user exists in public.users table
                in_users_table: !!publicUsersMap.get(authUser.id)
            }
        })

        // Apply filters
        if (tier && tier !== 'all') {
            enrichedUsers = enrichedUsers.filter(u => u.effective_tier === tier)
        }
        if (search) {
            const searchLower = search.toLowerCase()
            enrichedUsers = enrichedUsers.filter(u =>
                u.email.toLowerCase().includes(searchLower) ||
                (u.full_name && u.full_name.toLowerCase().includes(searchLower))
            )
        }

        // Sort by created_at descending
        enrichedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        const total = enrichedUsers.length

        // Apply pagination
        const paginatedUsers = enrichedUsers.slice(offset, offset + limit)

        // Get tier stats
        const stats = {
            total: total,
            free: enrichedUsers.filter(u => u.effective_tier === 'free' || !u.tier).length,
            pro: enrichedUsers.filter(u => u.effective_tier === 'pro').length,
            enterprise: enrichedUsers.filter(u => u.effective_tier === 'enterprise').length
        }

        return NextResponse.json({
            users: paginatedUsers,
            stats,
            pagination: {
                total,
                limit,
                offset,
                hasMore: total > offset + limit
            }
        })

    } catch (error) {
        console.error('Admin users error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH /api/admin/users - Update user tier or status
// ADMIN ONLY - Enhanced with more actions
export async function PATCH(request: NextRequest) {
    try {
        const auth = await getAuthenticatedUser()

        if (!auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!isAdminUser(auth)) {
            return NextResponse.json(adminOnlyError(), { status: 403 })
        }

        const adminClient = getSupabaseAdmin()
        const body = await request.json()

        const { user_id, action, tier_expires_at, reason, custom_days } = body

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
            console.error('User fetch error:', fetchError)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const oldValues = {
            tier: targetUser.tier || 'free',
            tier_expires_at: targetUser.tier_expires_at || null,
            account_status: targetUser.account_status || 'active',
            is_admin: targetUser.is_admin || false
        }

        let updateData: Record<string, unknown> = {}
        let actionType = ''
        let successMessage = ''

        switch (action) {
            case 'upgrade_pro':
                const proExpiry = tier_expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                updateData = {
                    tier: 'pro',
                    tier_started_at: new Date().toISOString(),
                    tier_expires_at: proExpiry,
                    payment_source: 'manual'
                }
                actionType = 'tier_upgrade'
                successMessage = `Upgraded to Pro until ${new Date(proExpiry).toLocaleDateString()}`
                break

            case 'upgrade_enterprise':
                const entExpiry = tier_expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                updateData = {
                    tier: 'enterprise',
                    tier_started_at: new Date().toISOString(),
                    tier_expires_at: entExpiry,
                    payment_source: 'manual'
                }
                actionType = 'tier_upgrade'
                successMessage = `Upgraded to Enterprise until ${new Date(entExpiry).toLocaleDateString()}`
                break

            case 'downgrade_free':
                updateData = {
                    tier: 'free',
                    tier_expires_at: null,
                    kofi_subscription_id: null,
                    payment_source: null
                }
                actionType = 'tier_downgrade'
                successMessage = 'Downgraded to Free tier'
                break

            case 'extend_pro':
                const days = custom_days || 30
                const currentExpiry = targetUser.tier_expires_at
                    ? new Date(targetUser.tier_expires_at)
                    : new Date()
                const baseDate = currentExpiry > new Date() ? currentExpiry : new Date()
                const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)
                updateData = {
                    tier: targetUser.tier || 'pro',
                    tier_expires_at: newExpiry.toISOString()
                }
                actionType = 'tier_extend'
                successMessage = `Extended ${days} days until ${newExpiry.toLocaleDateString()}`
                break

            case 'set_lifetime':
                updateData = {
                    tier: 'pro',
                    tier_expires_at: new Date('2099-12-31').toISOString(),
                    payment_source: 'lifetime'
                }
                actionType = 'tier_lifetime'
                successMessage = 'Granted lifetime Pro access'
                break

            case 'suspend':
                updateData = { account_status: 'suspended' }
                actionType = 'user_suspend'
                successMessage = 'User suspended'
                break

            case 'activate':
                updateData = { account_status: 'active' }
                actionType = 'user_activate'
                successMessage = 'User activated'
                break

            case 'ban':
                updateData = { account_status: 'banned' }
                actionType = 'user_ban'
                successMessage = 'User banned'
                break

            case 'make_admin':
                updateData = { is_admin: true }
                actionType = 'make_admin'
                successMessage = 'Admin privileges granted'
                break

            case 'remove_admin':
                updateData = { is_admin: false }
                actionType = 'remove_admin'
                successMessage = 'Admin privileges revoked'
                break

            case 'reset_password':
                // Note: This triggers a password reset email via Supabase
                try {
                    await adminClient.auth.admin.generateLink({
                        type: 'recovery',
                        email: targetUser.email
                    })
                    successMessage = 'Password reset email sent'
                    actionType = 'password_reset'
                } catch (e) {
                    console.error('Password reset error:', e)
                    return NextResponse.json({ error: 'Failed to send password reset' }, { status: 500 })
                }
                break

            case 'delete_all_files':
                // Soft delete all user files
                const { error: deleteError } = await adminClient
                    .from('files')
                    .update({ is_destroyed: true, destroyed_at: new Date().toISOString() })
                    .eq('owner_id', user_id)

                if (deleteError) {
                    console.error('Delete files error:', deleteError)
                    return NextResponse.json({ error: 'Failed to delete files' }, { status: 500 })
                }
                actionType = 'files_deleted'
                successMessage = 'All user files deleted'
                break

            default:
                return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 })
        }

        // Update user if there's data to update
        if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await adminClient
                .from('users')
                .update(updateData)
                .eq('id', user_id)

            if (updateError) {
                console.error('Admin update error:', updateError)
                return NextResponse.json({
                    error: 'Failed to update user',
                    details: updateError.message
                }, { status: 500 })
            }
        }

        // Log admin action (don't fail if logging fails)
        try {
            await adminClient.from('admin_actions').insert({
                admin_id: auth.user.id,
                admin_email: auth.user.email,
                action_type: actionType,
                target_user_id: user_id,
                target_user_email: targetUser.email,
                old_value: oldValues,
                new_value: updateData,
                reason
            })
        } catch (logError) {
            console.error('Failed to log admin action:', logError)
            // Don't fail the request just because logging failed
        }

        return NextResponse.json({
            success: true,
            message: successMessage,
            action,
            user_id
        })

    } catch (error) {
        console.error('Admin users patch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/admin/users - Delete a user account
// ADMIN ONLY
export async function DELETE(request: NextRequest) {
    try {
        const auth = await getAuthenticatedUser()

        if (!auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!isAdminUser(auth)) {
            return NextResponse.json(adminOnlyError(), { status: 403 })
        }

        const adminClient = getSupabaseAdmin()
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('user_id')

        if (!userId) {
            return NextResponse.json({ error: 'user_id required' }, { status: 400 })
        }

        // Prevent self-deletion
        if (userId === auth.user.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
        }

        // Get user info before deletion
        const { data: targetUser } = await adminClient
            .from('users')
            .select('email')
            .eq('id', userId)
            .single()

        // Delete from auth (this will cascade to public.users due to FK)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

        if (deleteError) {
            console.error('User delete error:', deleteError)
            return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
        }

        // Log admin action
        try {
            await adminClient.from('admin_actions').insert({
                admin_id: auth.user.id,
                admin_email: auth.user.email,
                action_type: 'user_delete',
                target_user_id: userId,
                target_user_email: targetUser?.email || 'unknown',
                old_value: null,
                new_value: null,
                reason: 'Account deleted by admin'
            })
        } catch (logError) {
            console.error('Failed to log admin action:', logError)
        }

        return NextResponse.json({
            success: true,
            message: 'User account deleted'
        })

    } catch (error) {
        console.error('Admin users delete error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
