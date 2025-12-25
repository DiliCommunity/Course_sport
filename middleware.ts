import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware - ПОЛНОЕ РАЗДЕЛЕНИЕ:
 * - Браузер → HTML файлы
 * - Telegram → Next.js
 * 
 * Определяем Telegram по заголовкам и User-Agent
 */

// Маппинг Next.js путей на HTML файлы
const HTML_PAGES: Record<string, string> = {
  '/': '/index.html',
  '/login': '/login.html',
  '/register': '/register.html',
  '/profile': '/profile.html',
  '/courses': '/courses.html',
  '/keto-food': '/keto-food.html',
  '/about': '/about.html',
  '/payment': '/payment.html',
}

function isTelegramRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  
  // Telegram WebApp добавляет специфические заголовки и User-Agent
  // Telegram Desktop: TelegramBot или Telegram
  // Telegram Mobile WebView: часто содержит Telegram
  const isTelegramUA = userAgent.toLowerCase().includes('telegram')
  
  // Проверяем referer - если пришли из t.me
  const referer = request.headers.get('referer') || ''
  const isTelegramReferer = referer.includes('t.me') || referer.includes('telegram.org')
  
  // Проверяем специальный заголовок от Telegram WebApp
  const hasTelegramHeader = request.headers.has('x-telegram-web-app-init-data')
  
  return isTelegramUA || isTelegramReferer || hasTelegramHeader
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Пропускаем API routes, статические файлы и уже HTML файлы
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') || // любые файлы с расширением (.html, .css, .js, etc)
    pathname.startsWith('/img') ||
    pathname.startsWith('/css') ||
    pathname.startsWith('/js') ||
    pathname.startsWith('/files')
  ) {
    return NextResponse.next()
  }

  // Проверяем, это Telegram или браузер
  const isTelegram = isTelegramRequest(request)

  // Если это обычный браузер (НЕ Telegram) - редирект на HTML версию
  if (!isTelegram) {
    const htmlPage = HTML_PAGES[pathname]
    if (htmlPage) {
      return NextResponse.redirect(new URL(htmlPage, request.url))
    }
    // Для неизвестных путей - на главную HTML
    return NextResponse.redirect(new URL('/index.html', request.url))
  }

  // Telegram - пропускаем в Next.js
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
