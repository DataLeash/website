import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

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
