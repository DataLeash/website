import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { loginSchema, formatZodErrors } from '@/lib/validations'
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
    try {
        // Rate limit check - 10 login attempts per 15 min
        const clientIP = getClientIdentifier(request.headers)
        const rateLimit = checkRateLimit(`login:${clientIP}`, RATE_LIMIT_CONFIGS.auth)

        if (rateLimit.limited) {
            return NextResponse.json(
                { error: `Too many login attempts. Try again in ${rateLimit.retryAfter} seconds.` },
                { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
            )
        }

        const body = await request.json()

        // Validate input with Zod
        const validation = loginSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: formatZodErrors(validation.error) },
                { status: 400 }
            )
        }

        const { email, password } = validation.data

        const supabase = await createClient()

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            )
        }

        // Fetch user profile
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()

        // Log device access
        const userAgent = request.headers.get('user-agent') || ''
        const ip = request.headers.get('x-forwarded-for') || 'unknown'

        await supabase.from('access_logs').insert({
            user_id: data.user.id,
            action: 'login',
            ip_address: ip,
            timestamp: new Date().toISOString(),
        })

        return NextResponse.json({
            message: 'Login successful',
            user: data.user,
            profile,
            session: data.session,
        })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
