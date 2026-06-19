// ============================================
// CreaPulse V2 — Next.js Middleware
// Adds security headers to all matched responses.
// Enforces JWT auth on protected routes.
// ============================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// ─── Security Headers ──────────────────────

const securityHeaders: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
}

// ─── Protected Paths ───────────────────────

const PROTECTED_PREFIXES = ['/bureau', '/conseiller', '/admin-centre', '/admin-plateforme']

// ─── JWT Verification ───────────────────────

async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

// ─── Middleware ────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is a protected route
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix + '/') || pathname === prefix)

  // ─── Auth check for protected paths ───────
  if (isProtected) {
    const sessionToken = request.cookies.get('session')?.value

    // No cookie at all → redirect to login
    if (!sessionToken) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('login', '1')
      return NextResponse.redirect(loginUrl)
    }

    // Cookie exists but invalid/expired → redirect with expired flag
    const isValid = await verifySessionToken(sessionToken)
    if (!isValid) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('login', '1')
      loginUrl.searchParams.set('expired', '1')
      return NextResponse.redirect(loginUrl)
    }
  }

  // ─── Security headers on all matched paths ─
  const response = NextResponse.next()

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value)
  }

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
