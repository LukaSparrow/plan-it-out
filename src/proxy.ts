import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// W Next.js 16 używamy wyeksportowanej funkcji 'proxy' zamiast 'middleware'
export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value

  // 1. Optymistyczne odrzucenie: Chce wejść na dashboard, a nie ma nawet ciastka?
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 2. Ma ciastko, a idzie na logowanie? Skieruj od razu do aplikacji.
  if ((request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/register')) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Konfigurujemy, których ścieżek ten plik ma pilnować
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/auth/:path*'
  ],
}