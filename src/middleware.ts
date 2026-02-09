import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname.startsWith('/login')

  // 🔒 Não autenticado → login
  if (!user && !isLoginPage) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    )
  }

  // ✅ Autenticado → fora do login
  if (user && isLoginPage) {
    return NextResponse.redirect(
      new URL('/', request.url)
    )
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/accounts/:path*',
    '/categories/:path*',
    '/transactions/:path*',
    '/login',
  ],
}