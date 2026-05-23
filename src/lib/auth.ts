// ============================================
// CreaPulse V2 — Authentication Utilities (Server-side)
// Uses jose for JWT (edge-compatible) + bcryptjs for password hashing
// ============================================

import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import type { UserRole } from '@prisma/client'

// ─── Configuration ──────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'creapulse-v2-secret-key-change-in-production-min-32-chars',
)

const JWT_ALGORITHM = 'HS256'
const ACCESS_TOKEN_EXPIRY = '7d' // 7 days
const REFRESH_TOKEN_EXPIRY = '30d'

// ─── Types ──────────────────────────────────

export type JwtPayload = {
  userId: string
  tenantId: string
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

export type AuthTokens = {
  accessToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: UserRole
    avatarUrl: string | null
  }
}

// ─── Password Hashing ───────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ─── JWT Token Management ───────────────────

/**
 * Create an access token (signed JWT)
 */
export async function createAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  const secretKey = await getSigningKey()
  return new SignJWT(payload as unknown as JWTPayloadSpec)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secretKey)
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
  const secretKey = await getSigningKey()
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [JWT_ALGORITHM],
    })
    return {
      userId: payload.userId as string,
      tenantId: payload.tenantId as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch {
    throw new AuthError('Invalid or expired token', 'TOKEN_EXPIRED')
  }
}

/**
 * Generate a complete auth response (token + user data)
 */
export async function generateAuthResponse(userData: {
  id: string
  tenantId: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  avatarUrl: string | null
}): Promise<AuthTokens> {
  const token = await createAccessToken({
    userId: userData.id,
    tenantId: userData.tenantId,
    email: userData.email,
    role: userData.role,
  })

  // Calculate expiry in seconds (7 days)
  const expiresIn = 7 * 24 * 60 * 60

  return {
    accessToken: token,
    expiresIn,
    user: {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      avatarUrl: userData.avatarUrl,
    },
  }
}

// ─── Session Helpers ────────────────────────

/**
 * Create a session cookie header value
 */
export function createSessionCookie(token: string): string {
  return `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
}

/**
 * Create a clear-session cookie header value
 */
export function createClearSessionCookie(): string {
  return 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
}

// ─── Role-Based Access Control ──────────────

export type RoleCheckResult =
  | { authorized: true }
  | { authorized: false; reason: string }

/**
 * Check if a user's role is allowed to access a resource
 */
export function checkRole(userRole: UserRole, allowedRoles: UserRole[]): RoleCheckResult {
  if (allowedRoles.includes(userRole)) {
    return { authorized: true }
  }
  return {
    authorized: false,
    reason: `Role '${userRole}' is not authorized. Required: ${allowedRoles.join(', ')}`,
  }
}

/**
 * Role hierarchy for admin access
 * ADMIN > COUNSELOR > BENEFICIARY
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 3,
  COUNSELOR: 2,
  BENEFICIARY: 1,
}

/**
 * Check if a user has at least the minimum required role level
 */
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

// ─── Auth Error Class ───────────────────────

export class AuthError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string = 'UNAUTHORIZED', statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.statusCode = statusCode
  }
}

// ─── Internal Helpers ───────────────────────

interface JWTPayloadSpec {
  userId: string
  tenantId: string
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

let cachedSigningKey: Uint8Array | null = null

async function getSigningKey(): Promise<Uint8Array> {
  if (!cachedSigningKey) {
    cachedSigningKey = JWT_SECRET
  }
  return cachedSigningKey
}
