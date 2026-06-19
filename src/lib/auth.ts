// ============================================
// CreaPulse V2 — Authentication Utilities (Server-side)
// Uses jose for JWT (edge-compatible) + bcryptjs for password hashing
// Supports access tokens (7d) + refresh tokens (30d) with JTI blocklist
// ============================================

import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import type { UserRole } from '@prisma/client'
import { isRevoked, revokeToken as addToBlocklist } from './token-blocklist'

// ─── Configuration ──────────────────────────

const secret = process.env.NEXTAUTH_SECRET
if (!secret || secret.length < 32) {
  throw new Error('NEXTAUTH_SECRET environment variable is required (min 32 characters)')
}
const JWT_SECRET = new TextEncoder().encode(secret)

const JWT_ALGORITHM = 'HS256'
const ACCESS_TOKEN_EXPIRY = '7d' // 7 days
const REFRESH_TOKEN_EXPIRY = '30d'

// ─── Types ──────────────────────────────────

export type JwtPayload = {
  userId: string
  tenantId: string
  email: string
  role: UserRole
  jti?: string
  type?: 'access' | 'refresh'
  iat?: number
  exp?: number
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
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
 * Create an access token (signed JWT) with JTI for revocation support
 */
export async function createAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'jti' | 'type'>): Promise<string> {
  const secretKey = await getSigningKey()
  const jti = crypto.randomUUID()
  return new SignJWT({ ...payload, jti, type: 'access' } as unknown as JWTPayloadSpec)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secretKey)
}

/**
 * Create a refresh token (signed JWT, 30-day expiry)
 * Includes type: 'refresh' to distinguish from access tokens.
 */
export async function createRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'jti' | 'type'>): Promise<string> {
  const secretKey = await getSigningKey()
  const jti = crypto.randomUUID()
  return new SignJWT({ ...payload, jti, type: 'refresh' } as unknown as JWTPayloadSpec)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(secretKey)
}

/**
 * Verify a refresh token — checks type is 'refresh' and blocklist.
 */
export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const payload = await verifyToken(token)
  if (payload.type !== 'refresh') {
    throw new AuthError('Invalid refresh token', 'INVALID_TOKEN')
  }
  return payload
}

/**
 * Verify and decode a JWT token.
 * Checks blocklist for revoked JTIs.
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
  const secretKey = await getSigningKey()
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [JWT_ALGORITHM],
    })

    const jti = payload.jti as string | undefined

    // Check blocklist if JTI is present
    if (jti && isRevoked(jti)) {
      throw new AuthError('Token has been revoked', 'TOKEN_REVOKED')
    }

    return {
      userId: payload.userId as string,
      tenantId: payload.tenantId as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      jti,
      type: payload.type as 'access' | 'refresh' | undefined,
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch (err) {
    if (err instanceof AuthError) throw err
    throw new AuthError('Invalid or expired token', 'TOKEN_EXPIRED')
  }
}

/**
 * Revoke a token by adding its JTI to the blocklist.
 */
export function revokeAccessToken(jti: string, exp: number): void {
  addToBlocklist(jti, exp)
}

/**
 * Generate a complete auth response (access token + refresh token + user data)
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
  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken({
      userId: userData.id,
      tenantId: userData.tenantId,
      email: userData.email,
      role: userData.role,
    }),
    createRefreshToken({
      userId: userData.id,
      tenantId: userData.tenantId,
      email: userData.email,
      role: userData.role,
    }),
  ])

  // Calculate expiry in seconds (7 days for access, 30 days for refresh)
  const expiresIn = 7 * 24 * 60 * 60
  const refreshExpiresIn = 30 * 24 * 60 * 60

  return {
    accessToken,
    refreshToken,
    expiresIn,
    refreshExpiresIn,
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
 * Create a clear-session cookie header value (clears both session and refresh)
 */
export function createClearSessionCookie(): string {
  return 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0, refresh=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
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
  jti?: string
  type?: 'access' | 'refresh'
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
