// ============================================
// CreaPulse V2 — Conseiller Entretiens
// GET  /api/conseiller/entretiens — List interviews
// POST /api/conseiller/entretiens — Create interview
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { getCounselor, AuthRequiredError, AuthForbiddenError, AuthNotFoundError } from '../_lib/auth'
import { z } from 'zod'

// ─── Zod schemas ─────────────────────────────

const createInterviewSchema = z.object({
  beneficiaryId: z.string().min(1, 'L\'identifiant du bénéficiaire est requis'),
  type: z.enum(['bilan', 'suivi', 'atelier', 'autre'], {
    errorMap: () => ({ message: 'Type invalide (bilan, suivi, atelier, autre)' }),
  }),
  scheduledAt: z.string().min(1, 'La date planifiée est requise'),
  notes: z.string().optional(),
})

// ─── GET ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { counselor } = await getCounselor(request)

    // Parse query params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    // Build where clause
    const where: Record<string, unknown> = {
      counselorId: counselor.id,
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.beneficiary = {
        user: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        },
      }
    }

    const [total, interviews] = await Promise.all([
      db.interviewSession.count({ where }),
      db.interviewSession.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          beneficiary: {
            include: {
              user: {
                select: { firstName: true, lastName: true, avatarUrl: true },
              },
            },
          },
        },
      }),
    ])

    const statusLabels: Record<string, string> = {
      scheduled: 'planifié',
      in_progress: 'en cours',
      completed: 'terminé',
      cancelled: 'annulé',
    }

    const typeLabels: Record<string, string> = {
      bilan: 'Bilan',
      suivi: 'Suivi',
      atelier: 'Atelier',
      autre: 'Autre',
    }

    const formattedInterviews = interviews.map((i) => ({
      id: i.id,
      date: i.scheduledAt.toISOString().split('T')[0],
      time: i.scheduledAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      beneficiaryId: i.beneficiaryId,
      beneficiaryName: `${i.beneficiary.user.firstName || ''} ${i.beneficiary.user.lastName || ''}`.trim(),
      beneficiaryInitials: `${(i.beneficiary.user.firstName || '')[0] || ''}${(i.beneficiary.user.lastName || '')[0] || ''}`.toUpperCase(),
      type: i.type,
      typeLabel: typeLabels[i.type] || i.type,
      status: i.status,
      statusLabel: statusLabels[i.status] || i.status,
      notes: i.synthesis || '',
      synthesis: i.synthesis,
      phase: i.phase,
      completedAt: i.completedAt?.toISOString() || null,
    }))

    return success({
      entretiens: formattedInterviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, 'Liste des entretiens du conseiller')
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}

// ─── POST ────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { counselor } = await getCounselor(request)

    const body = await request.json()
    const parsed = createInterviewSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      )
    }

    const { beneficiaryId, type, scheduledAt, notes } = parsed.data

    // Verify beneficiary is assigned to this counselor
    const assignment = await db.counselorAssignment.findFirst({
      where: {
        counselorId: counselor.id,
        beneficiaryId,
        status: 'ACTIVE',
      },
    })

    if (!assignment) {
      return Errors.notFound('Affectation bénéficiaire')
    }

    // Create interview session
    const interview = await db.interviewSession.create({
      data: {
        counselorId: counselor.id,
        beneficiaryId,
        type,
        scheduledAt: new Date(scheduledAt),
        status: 'scheduled',
        synthesis: notes || null,
      },
      include: {
        beneficiary: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    // Create initial note if notes provided
    if (notes) {
      await db.interviewNote.create({
        data: {
          interviewId: interview.id,
          phase: 'general',
          category: 'observation',
          content: notes,
        },
      })
    }

    return success(
      {
        id: interview.id,
        beneficiaryId: interview.beneficiaryId,
        beneficiaryName: `${interview.beneficiary.user.firstName || ''} ${interview.beneficiary.user.lastName || ''}`.trim(),
        type: interview.type,
        status: interview.status,
        scheduledAt: interview.scheduledAt.toISOString(),
      },
      'Entretien créé avec succès',
      201,
    )
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}
