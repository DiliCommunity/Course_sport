import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Список Next.js страниц, которые должны работать только в Telegram Web App
const NEXTJS_ONLY_PAGES = [
  '/login',
  '/register',
  '/profile',
  '/courses',
]

// HTML версии страниц
const HTML_PAGES: Record<string, string> = {
  '/login': '/login.html',
  '/register': '/register.html',
  '/profile': '/profile.html',
  '/courses': '/courses.html',
}

// Проверка, что мы в Telegram Web App
function isTelegramWebApp(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  
  // Проверяем заголовки Telegram Web App
  const tgWebApp = request.headers.get('x-telegram-web-app') || 
                   request.headers.get('x-telegram-init-data')
  
  // Проверяем User-Agent
  const isTelegramUA = userAgent.includes('Telegram') || 
                       userAgent.includes('TelegramBot')
  
  // Проверяем referer
  const isTelegramReferer = referer.includes('t.me') || 
                            referer.includes('telegram.org')
  
  return !!(tgWebApp || isTelegramUA || isTelegramReferer)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Пропускаем статические файлы, API routes и другие пути
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/img') ||
    pathname.startsWith('/css') ||
    pathname.startsWith('/js') ||
    pathname.startsWith('/fonts') ||
    pathname.endsWith('.html') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }
  
  // Если это Next.js страница, которая должна работать только в Telegram Web App
  if (NEXTJS_ONLY_PAGES.includes(pathname)) {
    const isTelegram = isTelegramWebApp(request)
    
    // Если НЕ в Telegram Web App - редиректим на HTML версию
    if (!isTelegram) {
      const htmlPage = HTML_PAGES[pathname]
      if (htmlPage) {
        return NextResponse.redirect(new URL(htmlPage, request.url))
      }
    }
  }
  
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

