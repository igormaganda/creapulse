// ============================================
// CreaPulse V2 — PAA Satisfaction API
// GET  /api/paa/satisfaction  — Get satisfaction feedback
// POST /api/paa/satisfaction  — Submit satisfaction feedback
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'

// ─── Validation schemas ────────────────────

const FeedbackTypeValues = [
  'PROGRAM_GLOBAL',
  'ATELIER',
  'MILESTONE',
  'CONSEILLER',
  'GENERAL',
] as const

const CreateFeedbackBody = z.object({
  type: z.enum(FeedbackTypeValues),
  referenceId: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(5000).optional().default(''),
  nps: z.number().min(0).max(10).optional(),
})

// ─── GET: Get satisfaction feedback ───────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const program = await db.paaProgram.findFirst({
      where: {
        userId: payload.userId,
        tenantId: payload.tenantId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!program) {
      return Errors.notFound('Programme PAA')
    }

    const feedbacks = await db.satisfactionFeedback.findMany({
      where: { programId: program.id },
      orderBy: { createdAt: 'desc' },
    })

    // Compute aggregate stats
    const ratings = feedbacks.filter((f) => f.rating !== null).map((f) => f.rating)
    const npsScores = feedbacks.filter((f) => f.nps !== null).map((f) => f.nps!)
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
        : null
    const avgNps =
      npsScores.length > 0
        ? Math.round((npsScores.reduce((sum, n) => sum + n, 0) / npsScores.length) * 10) / 10
        : null

    return success({
      feedbacks,
      count: feedbacks.length,
      avgRating,
      avgNps,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Submit satisfaction feedback ──

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const body = await request.json()
    const data = CreateFeedbackBody.parse(body)

    const program = await db.paaProgram.findFirst({
      where: {
        userId: payload.userId,
        tenantId: payload.tenantId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!program) {
      return Errors.notFound('Programme PAA')
    }

    const feedback = await db.satisfactionFeedback.create({
      data: {
        programId: program.id,
        userId: payload.userId,
        type: data.type,
        referenceId: data.referenceId ?? null,
        rating: data.rating,
        comment: data.comment,
        nps: data.nps ?? null,
      },
    })

    return success(feedback, 'Retour satisfaction enregistré', 201)
  } catch (err) {
    return handleApiError(err)
  }
}
