// ============================================
// CreaPulse V2 — Shared API Auth Wrapper
// Standardizes authentication across all API routes
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromHeader, Errors } from './api-response'
import { verifyToken, type JwtPayload } from './auth'

type Role = 'ADMIN' | 'COUNSELOR' | 'BENEFICIARY'

export interface AuthResult {
  payload: JwtPayload
  request: NextRequest
  userId: string
  tenantId: string
  role: string
}

interface WithAuthOptions {
  roles?: Role[]
}

/**
 * Shared auth wrapper for API routes.
 * Extracts JWT from cookie or header, verifies it, checks role if specified.
 * Usage in a GET/POST handler:
 *   const auth = await withAuth(request, { roles: ['COUNSELOR', 'ADMIN'] })
 *   if (!auth) return // response already sent (401/403)
 *   const { payload, request: req } = auth
 */
export async function withAuth(
  request: NextRequest,
  options?: WithAuthOptions,
): Promise<AuthResult | NextResponse> {
  // 1. Extract token from cookie first, then header
  const cookieToken = request.cookies.get('session')?.value
  const headerToken = getTokenFromHeader(request)
  const token = cookieToken || headerToken

  if (!token) {
    return Errors.unauthorized('Session requise. Veuillez vous connecter.')
  }

  // 2. Verify token
  let payload: JwtPayload
  try {
    payload = await verifyToken(token)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'TOKEN_EXPIRED') {
      return Errors.unauthorized('Session expirée. Veuillez vous reconnecter.')
    }
    return Errors.unauthorized('Token invalide. Veuillez vous reconnecter.')
  }

  // 3. Role check (if specified)
  if (options?.roles && options.roles.length > 0) {
    if (!options.roles.includes(payload.role as Role)) {
      return Errors.forbidden('Accès refusé. Rôle insuffisant.')
    }
  }

  return { payload, request, userId: payload.userId, tenantId: payload.tenantId, role: payload.role }
}

/**
 * Convenience wrapper: requires ADMIN role.
 * Shorthand for withAuth(request, { roles: ['ADMIN'] }).
 */
export async function withAdminAuth(
  request: NextRequest,
): Promise<AuthResult | NextResponse> {
  return withAuth(request, { roles: ['ADMIN'] })
}
