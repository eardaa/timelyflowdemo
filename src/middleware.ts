import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isLoginRoute = request.nextUrl.pathname === '/login'

  // Korumalı bir rotaya (örn. /dashboard) gidiliyorsa ve kullanıcı giriş yapmamışsa /login'e at.
  if (isDashboardRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Eğer kullanıcı varsa rolünü user_roles'den alalım
  if (user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = roleData?.role

    // Giriş yapmış kullanıcı /login'e gitmeye çalışırsa dashboard'a at
    if (isLoginRoute) {
      if (role === 'admin') return NextResponse.redirect(new URL('/dashboard/admin', request.url))
      if (role === 'doktor') return NextResponse.redirect(new URL('/dashboard/doktor', request.url))
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Yetki kontrolü (admin sayfası <-> doktor sayfası)
    if (isDashboardRoute) {
      if (request.nextUrl.pathname.startsWith('/dashboard/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard/doktor', request.url))
      }
      
      if (request.nextUrl.pathname.startsWith('/dashboard/doktor') && role !== 'doktor') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url))
      }

      // Sadece /dashboard'a girilirse yönlendirme
      if (request.nextUrl.pathname === '/dashboard') {
        if (role === 'admin') return NextResponse.redirect(new URL('/dashboard/admin', request.url))
        if (role === 'doktor') return NextResponse.redirect(new URL('/dashboard/doktor', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, etc...
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
