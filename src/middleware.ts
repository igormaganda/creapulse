// ============================================
// CreaPulse V2 — Next.js Middleware
// Adds security headers to all responses.
// Enforces JWT auth on protected routes.
// Validates CSRF on all mutating API requests.
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
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
}

// ─── Protected Paths ───────────────────────

const PROTECTED_PREFIXES = ['/bureau', '/conseiller', '/admin-centre', '/admin-plateforme']

// ─── CSRF exempt API routes ────────────────
// These endpoints are called by external services or non-browser clients
// and legitimately don't send CSRF tokens.
const CSRF_EXEMPT_PREFIXES = [
  '/api/auth/',          // Login/register/refresh — no session yet
  '/api/health',         // Health checks (monitoring)
  '/api/monitoring/',    // Monitoring endpoints
  '/api/export/demo/',   // Public demo exports
  '/api/geo/',           // Public geo API proxy
  '/api/france-travail/', // FT API proxy (external callbacks)
]

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

// ─── JWT Verification ───────────────────────

async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    await jwtVerify(token, secret)
    return true
  }
  catch {
    return false
  }
}

// ─── CSRF Validation ───────────────────────

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function validateCsrf(request: NextRequest): boolean {
  const cookieToken = request.cookies.get('csrf_token')?.value
  const headerToken = request.headers.get('X-CSRF-Token')

  if (!cookieToken || !headerToken) return false
  if (cookieToken.length !== headerToken.length) return false

  // Timing-safe comparison
  let result = 0
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i)
  }
  return result === 0
}

// ─── Middleware ────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method.toUpperCase()
  const isApi = pathname.startsWith('/api/')

  // ─── CSRF validation for mutating API requests ─
  if (isApi && MUTATING_METHODS.includes(method) && !isCsrfExempt(pathname)) {
    if (!validateCsrf(request)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_INVALID',
            message: 'Jeton CSRF invalide. Veuillez recharger la page.',
          },
        },
        { status: 403 },
      )
    }
  }

  // ─── Auth check for protected page routes ─
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname.startsWith(prefix + '/') || pathname === prefix,
  )

  if (isProtected) {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('login', '1')
      return NextResponse.redirect(loginUrl)
    }

    const isValid = await verifySessionToken(sessionToken)
    if (!isValid) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('login', '1')
      loginUrl.searchParams.set('expired', '1')
      return NextResponse.redirect(loginUrl)
    }
  }

  // ─── Build response with security headers ─
  const response = NextResponse.next()

  // Security headers on all responses (pages + API)
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value)
  }

  // ─── CSRF token cookie on safe requests ─
  // Generate a csrf_token cookie on GET/HEAD/OPTIONS if not already present.
  // Non-httpOnly so JavaScript can read it and send as X-CSRF-Token header.
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    const existingCsrf = request.cookies.get('csrf_token')?.value
    if (!existingCsrf) {
      const csrfToken = crypto.randomUUID()
      response.cookies.set('csrf_token', csrfToken, {
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
      })
      response.headers.set('X-CSRF-Token', csrfToken)
    }
    else {
      response.headers.set('X-CSRF-Token', existingCsrf)
    }
  }

  return response
}

// Match ALL paths (pages + API) so CSRF and security headers apply everywhere.
// Static files and Next.js internals are excluded.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|logo\\.svg|robots\\.txt|sitemap\\.xml).*)',
  ],
}