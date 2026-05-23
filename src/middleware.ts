// ============================================
// CreaPulse V2 — Next.js Middleware
// Protects /bureau, /conseiller, /admin routes
// Verifies JWT session cookie via jose (Edge-safe)
// ============================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getSessionToken,
  verifyEdgeToken,
  isProtectedPath,
  isAuthorizedForPath,
  getHomePathForRole,
} from '@/lib/auth-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip non-protected paths and static assets
  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  // Skip API routes (handled by individual route handlers)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // Get session token from cookies
  const token = getSessionToken(request)

  if (!token) {
    // No token — redirect to landing page
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const session = await verifyEdgeToken(token)

  if (!session.valid) {
    // Token invalid/expired — redirect to landing page
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    loginUrl.searchParams.set('reason', session.reason)
    return NextResponse.redirect(loginUrl)
  }

  // Check role authorization for path
  if (!isAuthorizedForPath(session.payload.role, pathname)) {
    // User doesn't have the right role — redirect to their home
    const homePath = getHomePathForRole(session.payload.role)
    return NextResponse.redirect(new URL(homePath, request.url))
  }

  // User is authenticated and authorized — allow through
  const response = NextResponse.next()

  // Add helpful headers for downstream usage
  response.headers.set('x-user-id', session.payload.userId)
  response.headers.set('x-user-role', session.payload.role)
  response.headers.set('x-tenant-id', session.payload.tenantId)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - / (landing page)
     * - /api (API routes have own auth)
     * - /_next (Next.js internals)
     * - /images, /favicon.ico, etc. (static files)
     */
    '/((?!$|api|_next|images|favicon\\.ico|logo\\.svg|robots\\.txt|sitemap\\.xml).*)',
  ],
}
