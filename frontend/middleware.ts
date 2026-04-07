import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // We are creating a minimal supabase client purely to read the auth session cookie
  // @supabase/ssr requires getting/setting cookies for standard next.js middleware auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Enforce Route Protection
  const path = request.nextUrl.pathname

  if (path === '/') {
    return NextResponse.redirect(new URL(user ? '/dashboard' : '/login', request.url))
  }

  // If going to protected routes without a user
  const protectedRoutes = ['/dashboard', '/chat', '/patients', '/tools', '/discover', '/admin']
  const isProtected = protectedRoutes.some(r => path.startsWith(r))
  
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role Validation (Fetching role from profiles table in real app would happen here or rely on user meta)
  // For demo: Let's assume role is stored in user_metadata from signup
  const role = user?.user_metadata?.role || 'patient'

  // Admin Route Protection
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Doctor Only Route Enforcement
  if (path.startsWith('/patients') && role !== 'admin' && role !== 'doctor') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  if (path.startsWith('/tools/referral') && role !== 'admin' && role !== 'doctor') {
     return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Theme enforcement via cookies (if we want to force SSR theme injection)
  // Currently client-side AppLayout handles the body class addition

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
