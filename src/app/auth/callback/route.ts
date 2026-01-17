import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/dashboard'

    if (!code) {
        console.error('Auth callback: No code provided')
        return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
    }

    const supabase = await createClient()

    // Exchange code for session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
        console.error('Auth callback error:', sessionError)
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(sessionError.message)}`, requestUrl.origin))
    }

    if (session?.user) {
        const user = session.user

        // Check if user exists in our users table
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 = no rows returned (user doesn't exist yet)
            console.error('Error checking existing user:', fetchError)
        }

        // If user doesn't exist, create them
        if (!existingUser) {
            // Generate anonymous ID
            const hash = crypto.createHash('sha256').update(user.id + 'dataleash_salt').digest('hex')
            const anonymousId = `DL-${hash.substring(0, 6).toUpperCase()}`

            // Get user metadata from OAuth provider
            const userMetadata = user.user_metadata || {}
            const email = user.email || ''
            const fullName = userMetadata.full_name || userMetadata.name || userMetadata.user_name || ''
            const avatarUrl = userMetadata.avatar_url || userMetadata.picture || ''

            const userProfile = {
                id: user.id,
                email,
                full_name: fullName,
                avatar_url: avatarUrl,
                phone: null,
                qid: null,
                phone_verified: false,
                email_verified: !!user.email_confirmed_at,
                qid_verified: false,
                is_active: true,
                trust_score: 0,
                tier: 'free',
                account_status: 'active',
                anonymous_id: anonymousId,
            }

            const { error: insertError } = await supabase
                .from('users')
                .insert(userProfile)

            if (insertError) {
                console.error('Error creating OAuth user profile:', insertError)
                // Try without optional fields
                const { error: retryError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        email,
                        full_name: fullName,
                        is_active: true,
                        trust_score: 0,
                    })

                if (retryError) {
                    console.error('Retry error creating user profile:', retryError)
                } else {
                    console.log('OAuth user created with basic profile:', user.email)
                }
            } else {
                console.log('OAuth user profile created:', user.email)
            }
        } else {
            // User exists, update last_login_at
            await supabase
                .from('users')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', user.id)
        }
    }

    // Determine the correct redirect URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin
    return NextResponse.redirect(new URL(next, origin))
}
