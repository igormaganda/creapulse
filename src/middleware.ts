// ============================================
// CreaPulse V2 — Next.js Middleware
// Adds security headers to all matched responses.
// Auth is handled per-route (JWT in API handlers)
// and client-side (protected overlays via providers).
// ============================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Security Headers ──────────────────────

const securityHeaders: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
}

export function middleware(_request: NextRequest) {
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
