import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Security headers to add to all responses
const SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Legacy Admin Redirect
    if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
    }

    // Add security headers to all responses
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value)
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    // Re-apply security headers after creating new response
                    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
                        response.headers.set(key, value)
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser()

    // Protected routes
    const protectedPaths = ['/dashboard', '/admin', '/api/files', '/api/stats', '/api/settings']
    const isProtectedPath = protectedPaths.some(path =>
        request.nextUrl.pathname.startsWith(path) &&
        !request.nextUrl.pathname.endsWith('/decrypt') && // Allow decrypt to handle its own auth
        !request.nextUrl.pathname.includes('/info') &&    // Allow file info for public viewing
        !request.nextUrl.pathname.includes('/access')     // Allow access check/request routes
    )

    // Auth pages (redirect if already logged in)
    const authPaths = ['/login', '/signup']
    const isAuthPath = authPaths.includes(request.nextUrl.pathname)

    // API routes that require authentication  
    const isProtectedAPI = request.nextUrl.pathname.startsWith('/api/') &&
        !request.nextUrl.pathname.startsWith('/api/auth/') &&
        !request.nextUrl.pathname.startsWith('/api/otp/') &&
        !request.nextUrl.pathname.startsWith('/api/newsletter') &&
        !request.nextUrl.pathname.startsWith('/api/upgrade-request') &&
        !request.nextUrl.pathname.startsWith('/api/chat') &&
        !request.nextUrl.pathname.startsWith('/api/access/') &&  // Access request routes
        !request.nextUrl.pathname.includes('/info') &&  // File info routes (public viewing)
        !request.nextUrl.pathname.includes('/decrypt')

    if ((isProtectedPath || isProtectedAPI) && !user) {
        // For API routes, return 401
        if (request.nextUrl.pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                {
                    status: 401,
                    headers: Object.fromEntries(
                        Object.entries(SECURITY_HEADERS)
                    )
                }
            )
        }
        // Redirect to login if not authenticated
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    if (isAuthPath && user) {
        // Redirect to dashboard if already logged in
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

