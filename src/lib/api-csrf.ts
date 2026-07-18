// ============================================
// CreaPulse V2 — Enhanced API Auth with CSRF
// Wraps withAuth to also validate CSRF on mutating requests.
// GET/HEAD/OPTIONS are exempt from CSRF checks.
//
// IMPORTANT: CSRF validation is SKIPPED when a Bearer token is present
// in the Authorization header, because browsers do not automatically
// include custom headers in cross-origin requests. This provides
// inherent CSRF protection without the double-submit cookie pattern,
// which is prone to false positives in serverless/edge environments.
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthResult } from './api-auth'
import { validateCsrf } from './csrf'

type Role = 'ADMIN' | 'COUNSELOR' | 'BENEFICIARY'

interface WithAuthCsrfOptions {
  roles?: Role[]
}

/**
 * Check if the request carries a Bearer token in the Authorization header.
 * Bearer tokens are NOT automatically sent by browsers, so their presence
 * provides inherent CSRF protection.
 */
function hasBearerToken(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')
  return !!auth && auth.toLowerCase().startsWith('bearer ')
}

/**
 * Enhanced auth wrapper with CSRF protection.
 *
 * For GET/HEAD/OPTIONS: Same as withAuth (no CSRF check needed).
 * For POST/PUT/PATCH/DELETE with Bearer token: Skip CSRF (Bearer provides protection).
 * For POST/PUT/PATCH/DELETE without Bearer token: Validate X-CSRF-Token header
 * against the csrf_token cookie (double-submit pattern).
 *
 * Usage:
 *   const auth = await withAuthCsrf(request, { roles: ['ADMIN'] })
 *   if (!auth) return // response already sent (401/403/403 CSRF)
 *   const { payload, request: req } = auth
 */
export async function withAuthCsrf(
  request: NextRequest,
  options?: WithAuthCsrfOptions,
): Promise<AuthResult | NextResponse> {
  const method = request.method.toUpperCase()

  // CSRF check only for state-changing methods WITHOUT Bearer token
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!hasBearerToken(request) && !validateCsrf(request)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_INVALID',
            message: 'Jeton CSRF invalide. Veuillez recharger la page.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 },
      )
    }
  }

  // Delegate to standard withAuth
  return withAuth(request, options)
}