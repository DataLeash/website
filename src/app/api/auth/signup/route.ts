import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const { email, password, full_name, phone, qid } = await request.json()

        // Validate required fields
        if (!email || !password || !full_name || !phone || !qid) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            )
        }

        // Validate password strength
        if (password.length < 12) {
            return NextResponse.json(
                { error: 'Password must be at least 12 characters' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name,
                    phone,
                    qid,
                },
            },
        })

        if (authError) {
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            )
        }

        // Create profile in users table
        if (authData.user) {
            // Generate anonymous ID
            const hash = crypto.createHash('sha256').update(authData.user.id + 'dataleash_salt').digest('hex')
            const anonymousId = `DL-${hash.substring(0, 6).toUpperCase()}`

            const baseProfile = {
                id: authData.user.id,
                email,
                phone,
                full_name,
                qid,
                phone_verified: false,
                email_verified: false,
                qid_verified: false,
                is_active: true,
                trust_score: 0,
            }

            // Try inserting WITH anonymous_id first
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    ...baseProfile,
                    anonymous_id: anonymousId,
                })

            if (profileError) {
                console.warn('Profile creation with anonymous_id failed, retrying without it:', profileError.message)

                // Retry WITHOUT anonymous_id (in case migration hasn't run yet)
                const { error: retryError } = await supabase
                    .from('users')
                    .insert(baseProfile)

                if (retryError) {
                    console.error('Profile creation retry failed:', retryError)
                }
            }
        }

        return NextResponse.json({
            message: 'Account created! Check your email for verification.',
            user: authData.user,
        })
    } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
