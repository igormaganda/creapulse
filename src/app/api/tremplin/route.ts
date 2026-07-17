// ============================================
// CreaPulse V2 — Tremplin Readiness Assessment API
// GET  /api/tremplin  — Retrieve saved tremplin data
// POST /api/tremplin  — Save/update tremplin responses & results
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import { getEnrollmentIdFromRequest, buildCompositeKey } from '@/lib/enrollment-context'

// ─── Validation schemas ────────────────────

// Beneficiaries can only save their responses and step progress
const SaveTremplinBodyBeneficiary = z.object({
  currentStep: z.number().min(0).max(7, 'Étape invalide'),
  responses: z.record(z.string(), z.unknown()).optional(),
  isCompleted: z.boolean().optional(),
})

// Counselors/Admins can also set assessment results
const SaveTremplinBodyCounselor = z.object({
  currentStep: z.number().min(0).max(7, 'Étape invalide'),
  responses: z.record(z.string(), z.unknown()).optional(),
  isCompleted: z.boolean().optional(),
  score: z.number().min(0).max(100).optional(),
  decision: z.enum(['GO', 'GO_CONDITIONAL', 'NO_GO']).optional(),
  summary: z.string().max(5000).optional(),
  recommendations: z.array(z.string().max(500, 'Recommandation trop longue')).max(20, 'Maximum 20 recommandations').optional(),
})

// ─── GET: Retrieve saved tremplin data ──────

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)
    }

    const payload = await verifyToken(token)
    const enrollmentId = getEnrollmentIdFromRequest(request)

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
    const enrollmentId = getEnrollmentIdFromRequest(request)

    const body = await request.json()

    // Only COUNSELOR/ADMIN can set score, decision, summary, recommendations
    const canAssess = payload.role === 'COUNSELOR' || payload.role === 'ADMIN'
    const parsed = canAssess
      ? SaveTremplinBodyCounselor.safeParse(body)
      : SaveTremplinBodyBeneficiary.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })))
    }
    const data = parsed.data
    // Extract assessment fields (only present for COUNSELOR/ADMIN)
    const assessmentFields = canAssess
      ? {
          score: (data as typeof SaveTremplinBodyCounselor._output).score,
          decision: (data as typeof SaveTremplinBodyCounselor._output).decision,
          summary: (data as typeof SaveTremplinBodyCounselor._output).summary,
          recommendations: (data as typeof SaveTremplinBodyCounselor._output).recommendations,
        }
      : { score: undefined, decision: undefined, summary: undefined, recommendations: undefined }

    // Upsert tremplin data
    const tremplin = await db.tremplin.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        currentStep: data.currentStep,
        responses: (data.responses ?? {}) as Prisma.InputJsonValue,
        isCompleted: data.isCompleted ?? false,
        score: assessmentFields.score,
        decision: assessmentFields.decision,
        summary: assessmentFields.summary,
        recommendations: assessmentFields.recommendations ?? [],
        ...(data.isCompleted ? { completedAt: new Date() } : {}),
      },
      update: {
        currentStep: data.currentStep,
        responses: data.responses ? (data.responses as Prisma.InputJsonValue) : undefined,
        isCompleted: data.isCompleted,
        score: assessmentFields.score,
        decision: assessmentFields.decision,
        summary: assessmentFields.summary,
        recommendations: assessmentFields.recommendations,
      },
    })

    // If completed with assessment, also update CreatorJourney tremplinStatus
    if (data.isCompleted && assessmentFields.score !== undefined && assessmentFields.decision) {
      await db.creatorJourney.upsert({
        where: { userId: payload.userId },
        create: {
          userId: payload.userId,
          tremplinStatus: assessmentFields.decision === 'GO' ? 'GO' : assessmentFields.decision === 'NO_GO' ? 'NO_GO' : 'COMPLETED',
          tremplinScore: assessmentFields.score,
        },
        update: {
          tremplinStatus: assessmentFields.decision === 'GO' ? 'GO' : assessmentFields.decision === 'NO_GO' ? 'NO_GO' : 'COMPLETED',
          tremplinScore: assessmentFields.score,
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
          score: assessmentFields.score,
          maxScore: 100,
          completedAt: new Date(),
        },
        update: {
          score: assessmentFields.score,
          completedAt: new Date(),
        },
      })

      // Fire-and-forget: notify beneficiary on assessment completion
      createNotification({
        userId: payload.userId,
        title: 'Module complété',
        content: 'Félicitations ! Vous avez complété le module Tremplin',
        type: 'SUCCESS',
        link: '/bureau/tremplin',
      }).catch(() => {})
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
