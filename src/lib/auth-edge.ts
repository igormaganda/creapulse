// ============================================
// CreaPulse V2 — Edge-Compatible Auth (Middleware)
// Uses jose for JWT verification (Edge Runtime safe)
// No Node.js APIs — safe for Next.js middleware
// ============================================

import { jwtVerify } from 'jose'
import type { UserRole } from '@prisma/client'

// ─── Configuration ──────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'creapulse-v2-secret-key-change-in-production-min-32-chars',
)

const JWT_ALGORITHM = 'HS256'

// ─── Types ──────────────────────────────────

export type SessionPayload = {
  userId: string
  tenantId: string
  email: string
  role: UserRole
}

export type EdgeSession = {
  valid: true
  payload: SessionPayload
} | {
  valid: false
  reason: string
}

// ─── JWT Verification (Edge-safe) ───────────

/**
 * Verify a JWT token using jose (Edge Runtime compatible)
 */
export async function verifyEdgeToken(token: string): Promise<EdgeSession> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    })

    const sessionPayload: SessionPayload = {
      userId: payload.userId as string,
      tenantId: payload.tenantId as string,
      email: payload.email as string,
      role: payload.role as UserRole,
    }

    // Validate required fields
    if (!sessionPayload.userId || !sessionPayload.tenantId || !sessionPayload.email || !sessionPayload.role) {
      return { valid: false, reason: 'Malformed token payload' }
    }

    return { valid: true, payload: sessionPayload }
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'ERR_JWT_EXPIRED') {
      return { valid: false, reason: 'Token expired' }
    }
    return { valid: false, reason: 'Invalid token' }
  }
}

// ─── Cookie Extraction ──────────────────────

/**
 * Extract session token from request cookies
 */
export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = parseCookies(cookieHeader)
  return cookies['session'] || null
}

/**
 * Parse cookie header string into an object
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  const pairs = cookieHeader.split(';')

  for (const pair of pairs) {
    const trimmed = pair.trim()
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const name = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    cookies[name] = value
  }

  return cookies
}

// ─── Route Protection Helpers ───────────────

/**
 * Check if a path requires authentication
 */
export function isProtectedPath(pathname: string): boolean {
  const protectedPrefixes = ['/bureau', '/conseiller', '/admin']
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
}

/**
 * Check if a path requires a specific role
 */
export function getRequiredRole(pathname: string): UserRole[] | null {
  if (pathname.startsWith('/admin')) return ['ADMIN']
  if (pathname.startsWith('/conseiller')) return ['ADMIN', 'COUNSELOR']
  if (pathname.startsWith('/bureau')) return ['ADMIN', 'COUNSELOR', 'BENEFICIARY']
  return null
}

/**
 * Check if the user's role is authorized for a given path
 */
export function isAuthorizedForPath(role: UserRole, pathname: string): boolean {
  const requiredRoles = getRequiredRole(pathname)
  if (!requiredRoles) return true
  return requiredRoles.includes(role)
}

/**
 * Get redirect URL based on user role after login
 */
export function getHomePathForRole(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'COUNSELOR':
      return '/conseiller'
    case 'BENEFICIARY':
      return '/bureau'
    default:
      return '/bureau'
  }
}
