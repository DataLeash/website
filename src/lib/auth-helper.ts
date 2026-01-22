import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { createClient as createServerClient } from './supabase-server'

// Helper to get authenticated Supabase client
// Supports both cookie-based auth (web) and Bearer token auth (iOS)
export async function getAuthenticatedClient() {
    const headersList = await headers()
    const authHeader = headersList.get('authorization')

    // Check for Bearer token (iOS app)
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)

        // Create client with the token
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        )

        // Verify the token by getting user
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
            return { supabase: null, user: null, error: 'Invalid or expired token' }
        }

        return { supabase, user, error: null }
    }

    // Fall back to cookie-based auth (web)
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return { supabase: null, user: null, error: 'Not authenticated' }
    }

    return { supabase, user, error: null }
}
