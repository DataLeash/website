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

// GET /api/admin/logs - List system logs (access + admin actions)
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
        const type = searchParams.get('type') // 'access', 'admin', 'all'
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        let logs = []
        let count = 0

        if (type === 'admin' || type === 'all') {
            const { data: adminLogs, error: adminError, count: adminCount } = await adminClient
                .from('admin_actions')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)

            if (adminLogs) {
                logs.push(...adminLogs.map(l => ({ ...l, type: 'admin_action', timestamp: l.created_at })))
                count += adminCount || 0
            }
        }

        if (type === 'access' || type === 'all') {
            const { data: accessLogs, error: accessError, count: accessCount } = await adminClient
                .from('access_logs')
                .select('*', { count: 'exact' })
                .order('timestamp', { ascending: false })
                .range(offset, offset + limit - 1)

            if (accessLogs) {
                logs.push(...accessLogs.map(l => ({ ...l, type: 'access_log', timestamp: l.timestamp })))
                count += accessCount || 0
            }
        }

        // Sort combined logs
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        // Slice to limit (since we fetched limit for each)
        logs = logs.slice(0, limit)

        return NextResponse.json({
            logs,
            pagination: {
                total: count,
                limit,
                offset
            }
        })

    } catch (error) {
        console.error('Admin logs error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
