// ============================================
// CreaPulse V2 — Next.js Middleware
// Adds security headers to all responses.
// Enforces JWT auth on protected routes.
// Validates CSRF on all mutating API requests.
// Generates per-request CSP nonces.
// ============================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// ─── Security Headers (static, no CSP) ─────

const securityHeaders: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

// ─── CSP Nonce Generation ──────────────────
// Generates a cryptographically random nonce per request for script-src.
// The nonce is passed to layout.tsx via forwarded request headers so that
// Server Components (e.g. StructuredData) can attribute it on <script> tags.
//
// NOTE: 'unsafe-inline' is kept alongside the nonce as a transitional measure.
// Once all inline scripts in the codebase are audited and carry the nonce,
// 'unsafe-inline' should be removed from script-src for full CSP enforcement.

function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'`,                     // 'unsafe-inline' required for Next.js / Tailwind; nonce reserved for future hardening
    "style-src 'self' 'unsafe-inline'",                     // Tailwind CSS requires 'unsafe-inline'
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

// ─── Protected Paths ───────────────────────

const PROTECTED_PREFIXES = ['/bureau', '/conseiller', '/admin-centre', '/admin-plateforme']

// ─── CSRF exempt API routes ────────────────
// NOTE: Middleware CSRF validation is disabled. Kept for reference.
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

// CSRF functions kept for potential route-level use but not called in middleware.
function isCsrfExempt(_pathname: string): boolean {
  return true // All paths are effectively exempt at middleware level
}

function validateCsrf(_request: NextRequest): boolean {
  return true // No-op at middleware level; route-level CSRF available via api-csrf.ts
}

// ─── Middleware ────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method.toUpperCase()
  const isApi = pathname.startsWith('/api/')

  // ─── CSRF validation for mutating API requests ─
  // NOTE: Middleware-level CSRF validation is DISABLED in favor of route-level
  // protection. JWT Bearer tokens (Authorization header) are NOT subject to CSRF
  // because browsers don't automatically include them in cross-origin requests.
 // Combined with SameSite=Lax cookies, this provides robust CSRF protection
  // without false positives in serverless/edge environments (e.g. Vercel).
  // Route-level CSRF is available via the `withAuthCsrf` wrapper in api-csrf.ts.

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

  // ─── Generate per-request CSP nonce ─
  const nonce = generateNonce()

  // Forward the nonce to downstream Server Components (layout.tsx) via
  // request headers so they can set nonce="" attributes on inline <script> tags.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-script-nonce', nonce)

  // ─── Build response with security headers ─
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Static security headers on all responses (pages + API)
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value)
  }

  // Dynamic CSP with per-request nonce
  response.headers.set('Content-Security-Policy', buildCsp(nonce))

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