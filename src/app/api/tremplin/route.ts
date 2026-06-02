// ============================================
// CreaPulse V2 — Tremplin Readiness Assessment API
// GET  /api/tremplin  — Retrieve saved tremplin data
// POST /api/tremplin  — Save/update tremplin responses & results
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'

// ─── Validation schemas ────────────────────

const SaveTremplinBody = z.object({
  currentStep: z.number().min(0).max(7),
  responses: z.record(z.unknown()).optional(),
  isCompleted: z.boolean().optional(),
  score: z.number().min(0).max(100).optional(),
  decision: z.enum(['GO', 'GO_CONDITIONAL', 'NO_GO']).optional(),
  summary: z.string().optional(),
  recommendations: z.array(z.string()).optional(),
})

// ─── GET: Retrieve saved tremplin data ──────

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)
    }

    const payload = await verifyToken(token)

    const tremplin = await db.tremplin.findUnique({
      where: { userId: payload.userId },
    })

    if (!tremplin) {
      return success(null, 'No tremplin data found')
    }

    return success({
      currentStep: tremplin.currentStep,
      responses: tremplin.responses,
      isCompleted: tremplin.isCompleted,
      score: tremplin.score,
      decision: tremplin.decision,
      summary: tremplin.summary,
      recommendations: tremplin.recommendations,
      completedAt: tremplin.completedAt,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}

// ─── POST: Save/update tremplin ────────────

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)
    }

    const payload = await verifyToken(token)

    const body = await request.json()
    const parsed = SaveTremplinBody.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })))
    }
    const data = parsed.data

    // Upsert tremplin data
    const tremplin = await db.tremplin.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        currentStep: data.currentStep,
        responses: data.responses ?? {},
        isCompleted: data.isCompleted ?? false,
        score: data.score,
        decision: data.decision,
        summary: data.summary,
        recommendations: data.recommendations ?? [],
        ...(data.isCompleted ? { completedAt: new Date() } : {}),
      },
      update: {
        currentStep: data.currentStep,
        responses: data.responses,
        isCompleted: data.isCompleted,
        score: data.score,
        decision: data.decision,
        summary: data.summary,
        recommendations: data.recommendations,
        ...(data.isCompleted && !data.completedAt ? { completedAt: new Date() } : {}),
      },
    })

    // If completed, also update CreatorJourney tremplinStatus
    if (data.isCompleted && data.score !== undefined && data.decision) {
      await db.creatorJourney.upsert({
        where: { userId: payload.userId },
        create: {
          userId: payload.userId,
          tremplinStatus: data.decision === 'GO' ? 'GO' : data.decision === 'NO_GO' ? 'NO_GO' : 'COMPLETED',
          tremplinScore: data.score,
        },
        update: {
          tremplinStatus: data.decision === 'GO' ? 'GO' : data.decision === 'NO_GO' ? 'NO_GO' : 'COMPLETED',
          tremplinScore: data.score,
        },
      })

      // Update ModuleResult
      await db.moduleResult.upsert({
        where: {
          userId_moduleCode: {
            userId: payload.userId,
            moduleCode: 'tremplin',
          },
        },
        create: {
          userId: payload.userId,
          moduleCode: 'tremplin',
          score: data.score,
          maxScore: 100,
          completedAt: new Date(),
        },
        update: {
          score: data.score,
          completedAt: new Date(),
        },
      })
    }

    return success(
      { id: tremplin.id, currentStep: tremplin.currentStep },
      'Tremplin saved successfully'
    )
  } catch (err) {
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}
