import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware - просто пропускаем все запросы
 * Всё работает через Next.js
 */

export function middleware(request: NextRequest) {
  // Просто пропускаем всё
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Исключаем статические файлы
    '/((?!_next/static|_next/image|favicon.ico|.*\\.html$|.*\\.css$|.*\\.js$|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.pdf$|img/|css/|js/|files/).*)',
  ],
}
