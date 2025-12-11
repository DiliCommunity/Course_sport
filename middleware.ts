import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Минимальные заголовки безопасности
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match only page routes
     */
    '/((?!_next/static|_next/image|api|favicon.ico|.*\\..*).*)',
  ],
}
