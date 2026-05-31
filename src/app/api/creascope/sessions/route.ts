// ============================================
// CréaScope — Sessions API
// GET    /api/creascope/sessions  — List sessions (counselor: all, beneficiary: own)
// POST   /api/creascope/sessions  — Create session (counselor only)
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'

// ─── Validation schemas ────────────────────

const CreateSessionBody = z.object({
  beneficiaryId: z.string().min(1),
  scheduledAt: z.string().optional(), // ISO date string
  estimatedMinutes: z.number().min(30).max(480).optional(),
})

// ─── Helper: get counselor/beneficiary profile from userId ───

async function getCounselorByUserId(userId: string) {
  return db.counselor.findUnique({ where: { userId } })
}

async function getBeneficiaryByUserId(userId: string) {
  return db.beneficiary.findUnique({ where: { userId } })
}

// ─── GET: List sessions ────────────────────

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') as string | null
    const beneficiaryIdFilter = searchParams.get('beneficiaryId') as string | null

    // Build where clause based on role
    let where: Record<string, unknown> = {}

    if (payload.role === 'COUNSELOR') {
      const counselor = await getCounselorByUserId(payload.userId)
      if (!counselor) return Errors.forbidden('Profil conseiller non trouvé')

      where.counselorId = counselor.id
      if (beneficiaryIdFilter) where.beneficiaryId = beneficiaryIdFilter
      if (statusFilter) where.status = statusFilter
    } else if (payload.role === 'BENEFICIARY') {
      const beneficiary = await getBeneficiaryByUserId(payload.userId)
      if (!beneficiary) return Errors.forbidden('Profil bénéficiaire non trouvé')

      where.beneficiaryId = beneficiary.id
      if (statusFilter) where.status = statusFilter
    } else {
      return Errors.forbidden('Rôle non autorisé')
    }

    const sessions = await db.creascopeSession.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        beneficiary: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
        },
        counselor: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    })

    return success(sessions)
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}

// ─── POST: Create session ──────────────────

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)
    if (payload.role !== 'COUNSELOR' && payload.role !== 'ADMIN') {
      return Errors.forbidden('Seuls les conseillers peuvent créer des sessions CréaScope')
    }

    const body = await request.json()
    const { beneficiaryId, scheduledAt, estimatedMinutes } = CreateSessionBody.parse(body)

    // Get counselor profile
    const counselor = await getCounselorByUserId(payload.userId)
    if (!counselor) return Errors.forbidden('Profil conseiller non trouvé')

    // Verify beneficiary exists
    const beneficiary = await db.beneficiary.findUnique({
      where: { id: beneficiaryId },
      include: { user: { select: { firstName: true, lastName: true } } },
    })
    if (!beneficiary) return Errors.notFound('Bénéficiaire')

    // Check for existing active sessions for this beneficiary
    const existingActive = await db.creascopeSession.findFirst({
      where: {
        beneficiaryId,
        status: { in: ['PLANIFIEE', 'EN_COURS', 'PAUSEE'] },
      },
    })
    if (existingActive) {
      return Errors.validation(
        { existingSessionId: existingActive.id },
        'Une session CréaScope est déjà active pour ce bénéficiaire'
      )
    }

    const session = await db.creascopeSession.create({
      data: {
        beneficiaryId,
        counselorId: counselor.id,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        estimatedMinutes: estimatedMinutes ?? 240,
      },
      include: {
        beneficiary: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        counselor: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    })

    return success(session, 'Session CréaScope créée avec succès', 201)
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
