// ============================================
// CreaPulse V2 — Conseiller Auth Helper
// Shared utility for conseiller API routes
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'

export type CounselorContext = {
  counselor: {
    id: string
    userId: string
    organizationId: string
    name: string
    specialities: string[]
    certifications: string[]
    maxBeneficiaries: number
    isAvailable: boolean
  }
  userId: string
  tenantId: string
}

/**
 * Authenticate and resolve the counselor for an API request.
 * Checks JWT from cookie first, then Authorization header.
 * Verifies role is COUNSELOR and fetches the Counselor profile.
 */
export async function getCounselor(request: NextRequest): Promise<CounselorContext> {
  // Try cookie first, then Authorization header
  const cookieToken = request.cookies.get('session')?.value
  const headerToken = getTokenFromHeader(request)
  const token = cookieToken || headerToken

  if (!token) {
    throw new AuthRequiredError('Aucun jeton d\'authentification trouvé')
  }

  const payload = await verifyToken(token)

  if (payload.role !== 'COUNSELOR') {
    throw new AuthForbiddenError('Accès réservé aux conseillers')
  }

  const counselor = await db.counselor.findUnique({
    where: { userId: payload.userId },
    select: {
      id: true,
      userId: true,
      organizationId: true,
      name: true,
      specialities: true,
      certifications: true,
      maxBeneficiaries: true,
      isAvailable: true,
    },
  })

  if (!counselor) {
    throw new AuthNotFoundError('Profil conseiller introuvable')
  }

  return { counselor, userId: payload.userId, tenantId: payload.tenantId }
}

// ─── Custom error classes ─────────────────────

export class AuthRequiredError extends Error {
  code = 'UNAUTHORIZED'
  statusCode = 401
}

export class AuthForbiddenError extends Error {
  code = 'FORBIDDEN'
  statusCode = 403
}

export class AuthNotFoundError extends Error {
  code = 'NOT_FOUND'
  statusCode = 404
}
