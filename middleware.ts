import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match only page routes
     */
    '/((?!api|_next|favicon|.*\\.).*)',
  ],
}
