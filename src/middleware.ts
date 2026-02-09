import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = await supabaseServer() // 👈 AQUI ESTAVA O ERRO

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = req.nextUrl.pathname.startsWith('/login')

  // ❌ Não logado tentando acessar app
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(
      new URL('/login', req.url)
    )
  }

  // ✅ Logado tentando acessar login
  if (user && isAuthRoute) {
    return NextResponse.redirect(
      new URL('/', req.url)
    )
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}