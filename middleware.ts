import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware для Next.js приложения
 * 
 * Логика разделения Telegram/Browser теперь на клиенте (TelegramGate)
 * Middleware просто пропускает запросы и не делает редиректы
 */

export function middleware(request: NextRequest) {
  // Просто пропускаем все запросы
  // Проверка Telegram происходит на клиенте через TelegramGate
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static files (.html, .css, .js, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.html$|.*\\.css$|.*\\.js$|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.pdf$).*)',
  ],
}
