import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Admin emails from environment (fallback)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
        throw new Error('Missing Supabase configuration')
    }

    return createAdminClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

/**
 * GET /api/admin/verify
 * Server-side admin verification that bypasses RLS
 * Returns admin status, permissions, and user details
 */
export async function GET() {
    try {
        // Get authenticated user from session
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({
                authenticated: false,
                isAdmin: false,
                error: 'Not authenticated'
            }, { status: 401 })
        }

        // Use admin client to bypass RLS and check admin status
        const adminClient = getSupabaseAdmin()

        const { data: userData, error: userError } = await adminClient
            .from('users')
            .select('id, email, full_name, is_admin, tier, account_status, created_at')
            .eq('id', user.id)
            .single()

        if (userError) {
            console.error('Admin verify - user lookup error:', userError)
            return NextResponse.json({
                authenticated: true,
                isAdmin: false,
                error: 'Failed to verify admin status'
            }, { status: 500 })
        }

        // Check admin status from both DB and env
        const isAdminFromDB = userData?.is_admin === true
        const isAdminFromEnv = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')
        const isAdmin = isAdminFromDB || isAdminFromEnv

        // If user is admin via env but not in DB, update DB
        if (isAdminFromEnv && !isAdminFromDB) {
            await adminClient
                .from('users')
                .update({ is_admin: true })
                .eq('id', user.id)
        }

        // Get quick stats for admin dashboard
        let systemStats = null
        if (isAdmin) {
            // Count from auth.users for accurate total (includes OAuth users)
            const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 })

            // Get public.users data for tier counts
            const [filesCount, publicUsersData] = await Promise.all([
                adminClient.from('files').select('id', { count: 'exact', head: true }).eq('is_destroyed', false),
                adminClient.from('users').select('id, tier')
            ])

            const proUsers = publicUsersData.data?.filter(u => u.tier === 'pro' || u.tier === 'enterprise').length || 0

            systemStats = {
                totalUsers: authUsers?.users?.length || 0,
                totalFiles: filesCount.count || 0,
                proUsers: proUsers
            }
        }

        return NextResponse.json({
            authenticated: true,
            isAdmin,
            user: isAdmin ? {
                id: userData.id,
                email: userData.email,
                fullName: userData.full_name,
                tier: userData.tier,
                accountStatus: userData.account_status,
                createdAt: userData.created_at
            } : null,
            systemStats,
            permissions: isAdmin ? {
                canManageUsers: true,
                canViewLogs: true,
                canManagePayments: true,
                canModifySettings: true,
                canDeleteFiles: true
            } : null
        })

    } catch (error) {
        console.error('Admin verify error:', error)
        return NextResponse.json({
            authenticated: false,
            isAdmin: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}
