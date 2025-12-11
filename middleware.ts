import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Пропускаем статические файлы и API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return response
  }

  // Добавляем заголовки безопасности только для страниц
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Разрешаем встраивание в Telegram
  const userAgent = request.headers.get('user-agent') || ''
  if (userAgent.includes('Telegram')) {
    // Telegram может встраивать
  } else {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match only page routes, exclude:
     * - api routes
     * - _next routes
     * - static files
     */
    '/((?!_next/static|_next/image|api|favicon.ico|.*\\..*).*)',
  ],
}

