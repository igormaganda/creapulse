// ============================================
// CreaPulse V2 — Enhanced API Auth with CSRF
// Wraps withAuth to also validate CSRF on mutating requests.
// GET/HEAD/OPTIONS are exempt from CSRF checks.
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthResult } from './api-auth'
import { validateCsrf } from './csrf'

type Role = 'ADMIN' | 'COUNSELOR' | 'BENEFICIARY'

interface WithAuthCsrfOptions {
  roles?: Role[]
}

/**
 * Enhanced auth wrapper with CSRF protection.
 *
 * For GET/HEAD/OPTIONS: Same as withAuth (no CSRF check needed).
 * For POST/PUT/PATCH/DELETE: Also validates the X-CSRF-Token header
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

  // CSRF check for state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!validateCsrf(request)) {
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
