// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail Route Guard
// Shared security utilities for all FT proxy routes
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromHeader, error, ErrorCode } from '@/lib/api-response'
import { verifyToken, type JwtPayload } from '@/lib/auth'
import { z } from 'zod'

// ─── Types ───────────────────────────────────

export type FTAuthContext = {
  userId?: string
  userRole?: string
  isAuthenticated: boolean
}

export type FTHandler<T = unknown> = (
  request: NextRequest,
  ctx: FTAuthContext,
) => Promise<NextResponse<T>>

// ─── Zod Schemas for Common Input Types ──────

export const ftSchemas = {
  codePostal: z
    .string()
    .regex(/^\d{5}$/, 'Le code postal doit être composé de 5 chiffres')
    .optional()
    .or(z.literal('')),

  departement: z
    .string()
    .regex(/^\d{2,3}$/, 'Le département doit être composé de 2 ou 3 chiffres')
    .optional()
    .or(z.literal('')),

  region: z
    .string()
    .regex(/^\d{2}$/, 'La région doit être composée de 2 chiffres')
    .optional()
    .or(z.literal('')),

  motsCles: z
    .string()
    .max(200, 'Les mots-clés ne doivent pas dépasser 200 caractères')
    .optional()
    .or(z.literal('')),

  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(150).optional().default(20),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),

  // Offres-specific
  typeContrat: z.string().max(50).optional().or(z.literal('')),
  experienceExige: z.string().max(50).optional().or(z.literal('')),
  range: z.string().max(100).optional().or(z.literal('')),
  sort: z.coerce.number().int().min(0).max(1).optional().default(1),

  // Formations-specific
  domaine: z.string().max(100).optional().or(z.literal('')),
  niveau: z.string().max(50).optional().or(z.literal('')),
  certification: z.string().max(50).optional().or(z.literal('')),

  // Entreprises-specific
  siret: z.string().regex(/^\d{14}$/, 'Le SIRET doit être composé de 14 chiffres').optional().or(z.literal('')),
  siren: z.string().regex(/^\d{9}$/, 'Le SIREN doit être composé de 9 chiffres').optional().or(z.literal('')),
  nom: z.string().max(200).optional().or(z.literal('')),

  // Événements-specific
  typeEvenement: z.string().max(50).optional().or(z.literal('')),
  dateDebut: z.string().max(30).optional().or(z.literal('')),
  dateFin: z.string().max(30).optional().or(z.literal('')),

  // Statistiques-specific
  codeRegion: z.string().regex(/^\d{2}$/, 'Le code région doit être composé de 2 chiffres').optional().or(z.literal('')),
  codeDepartement: z.string().regex(/^\d{2,3}$/, 'Le code département doit être composé de 2 ou 3 chiffres').optional().or(z.literal('')),
  codeCommune: z.string().max(10).optional().or(z.literal('')),
  codeRome: z.string().max(10).optional().or(z.literal('')),
  typeStat: z.string().max(50).optional().or(z.literal('')),
  date: z.string().max(30).optional().or(z.literal('')),

  // Agences-specific
  commune: z.string().max(100).optional().or(z.literal('')),
  horaires: z.string().max(20).optional().or(z.literal('')),

  // LBB-specific
  rome: z.string().max(10).optional().or(z.literal('')),

  // ROME-specific
  code: z.string().max(10).optional().or(z.literal('')),

  // Aides-specific
  typeAide: z.string().max(50).optional().or(z.literal('')),
} as const

// ─── Rate Limiter ────────────────────────────

interface RateLimitEntry {
  count: number
  resetAt: number
}

const ANON_RATE_LIMIT = 30 // requests per minute
const AUTH_RATE_LIMIT = 120 // requests per minute
const RATE_WINDOW_MS = 60_000 // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60_000 // cleanup every 5 minutes

const rateLimitStore = new Map<string, RateLimitEntry>()
let lastCleanup = Date.now()

/**
 * In-memory per-IP rate limiter with TTL cleanup.
 * Authenticated users get higher limits.
 */
export const ftRateLimiter = {
  check(ip: string, isAuthenticated: boolean): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()

    // Periodic cleanup of expired entries
    if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
      for (const [key, entry] of rateLimitStore) {
        if (entry.resetAt <= now) {
          rateLimitStore.delete(key)
        }
      }
      lastCleanup = now
    }

    const limit = isAuthenticated ? AUTH_RATE_LIMIT : ANON_RATE_LIMIT
    const entry = rateLimitStore.get(ip)

    if (!entry || entry.resetAt <= now) {
      // Start a new window
      const resetAt = now + RATE_WINDOW_MS
      rateLimitStore.set(ip, { count: 1, resetAt })
      return { allowed: true, remaining: limit - 1, resetAt }
    }

    if (entry.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt }
    }

    entry.count++
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
  },
}

// ─── Pagination Validator ────────────────────

export type PaginationParams = {
  page: number
  per_page?: number
  limit?: number
}

/**
 * Validate and cap pagination parameters.
 * - page: minimum 1
 * - per_page: maximum 150
 * - limit: maximum 100
 */
export function validateFTPagination(params: {
  page?: unknown
  per_page?: unknown
  limit?: unknown
}): PaginationParams {
  let page = 1
  let per_page: number | undefined
  let limit: number | undefined

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    const parsed = Number(params.page)
    if (!isNaN(parsed) && parsed >= 1) {
      page = Math.floor(parsed)
    }
  }

  if (params.per_page !== undefined && params.per_page !== null && params.per_page !== '') {
    const parsed = Number(params.per_page)
    if (!isNaN(parsed) && parsed >= 1) {
      per_page = Math.min(Math.floor(parsed), 150)
    }
  }

  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    const parsed = Number(params.limit)
    if (!isNaN(parsed) && parsed >= 1) {
      limit = Math.min(Math.floor(parsed), 100)
    }
  }

  return { page, per_page, limit }
}

// ─── Auth Wrapper ────────────────────────────

/**
 * Extract client IP from request headers (handles proxies).
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

/**
 * Wrap a France Travail route handler with optional JWT auth, rate limiting,
 * and standardized error handling.
 *
 * - If a JWT token is provided: verify it and pass userId in context.
 * - If no token: allow anonymous access but with stricter rate limits.
 * - Rate limiting is per-IP.
 * - Content-Type validation for POST requests.
 * - Zod validation errors are returned as 422.
 * - All catch blocks sanitize errors server-side.
 */
export function withFTAuth<T = unknown>(handler: FTHandler<T>, httpMethod: 'GET' | 'POST' = 'GET') {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    // 1. Rate limiting
    const ip = getClientIp(request)
    const rawToken = getTokenFromHeader(request)
    const isAuthenticated = !!rawToken

    const rateCheck = ftRateLimiter.check(ip, isAuthenticated)
    if (!rateCheck.allowed) {
      return error(
        ErrorCode.RATE_LIMITED,
        'Trop de requêtes. Veuillez réessayer dans un instant.',
        429,
        { resetAt: rateCheck.resetAt },
      ) as NextResponse<T>
    }

    // 2. Content-Type check for POST
    if (httpMethod === 'POST') {
      const contentType = request.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return error(
          ErrorCode.VALIDATION_ERROR,
          'Le contenu doit être au format JSON.',
          415,
        ) as NextResponse<T>
      }
    }

    // 3. Optional JWT verification
    let ctx: FTAuthContext = { isAuthenticated: false }

    if (rawToken) {
      try {
        const payload: JwtPayload = await verifyToken(rawToken)
        ctx = {
          userId: payload.userId,
          userRole: payload.role,
          isAuthenticated: true,
        }
      } catch {
        // Invalid/expired token — proceed as anonymous with stricter limits
        ctx = { isAuthenticated: false }
      }
    }

    // 4. Execute handler
    try {
      return await handler(request, ctx)
    } catch (err) {
      // Log full error server-side
      const errMsg = err instanceof Error ? err.message : String(err)
      const errStack = err instanceof Error ? err.stack : undefined
      console.error(`[FT Guard] Unhandled error: ${errMsg}`)
      if (errStack && process.env.NODE_ENV === 'development') {
        console.error(`[FT Guard] Stack: ${errStack}`)
      }

      // Zod errors → 422
      if (err && typeof err === 'object' && 'issues' in err) {
        const zodErr = err as z.ZodError
        return error(
          ErrorCode.VALIDATION_ERROR,
          'Paramètres de recherche invalides.',
          422,
          zodErr.issues.map((i) => ({
            champ: i.path.join('.'),
            message: i.message,
          })),
        ) as NextResponse<T>
      }

      // Generic: sanitized French message
      return error(
        ErrorCode.INTERNAL_ERROR,
        'Service temporairement indisponible. Veuillez réessayer plus tard.',
        503,
      ) as NextResponse<T>
    }
  }
}
