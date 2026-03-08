import { NextResponse } from "next/server"

// Middleware intentionally kept minimal.
// Authentication and redirects are handled in `src/app/(app)/layout.tsx`
// using Supabase on the server side. This avoids common session issues
// when calling Supabase from the Edge middleware.

export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}