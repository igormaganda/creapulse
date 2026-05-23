// ============================================
// CreaPulse V2 — Projet API (Mon Projet Module)
// GET /api/projet  — Retrieve user's CreatorJourney
// PUT /api/projet  — Upsert CreatorJourney
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

// ─── Validation Schema ────────────────────────

const projetUpdateSchema = z.object({
  projectTitle: z.string().optional(),
  projectSector: z.string().optional(),
  projectDescription: z.string().optional(),
  projectStage: z.string().optional(),
  targetAudience: z.string().optional(),
  valueProposition: z.string().optional(),
  estimatedInvestment: z.string().optional(),
  creationMotivation: z.string().optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  extraData: z.record(z.unknown()).optional(),
})

type ProjetUpdateBody = z.infer<typeof projetUpdateSchema>

// ─── GET: Retrieve project ────────────────────

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('session')?.value
    const headerToken = getTokenFromHeader(request)
    const token = cookieToken || headerToken

    if (!token) {
      return Errors.unauthorized('No session token found')
    }

    const payload = await verifyToken(token)

    const journey = await db.creatorJourney.findUnique({
      where: { userId: payload.userId },
    })

    if (!journey) {
      return success({
        projectTitle: null,
        projectDescription: null,
        projectSector: null,
        projectStage: null,
        targetAudience: null,
        valueProposition: null,
        estimatedInvestment: null,
        creationMotivation: null,
        progressPercent: 0,
        currentPhase: 'DISCOVERY',
        extraData: null,
      }, 'Aucun projet enregistré')
    }

    return success({
      projectTitle: journey.projectTitle,
      projectDescription: journey.projectDescription,
      projectSector: journey.projectSector,
      projectStage: journey.projectStage,
      targetAudience: journey.targetAudience,
      valueProposition: journey.valueProposition,
      estimatedInvestment: journey.estimatedInvestment,
      creationMotivation: journey.creationMotivation,
      progressPercent: journey.progressPercent,
      currentPhase: journey.currentPhase,
      extraData: journey.visionAnswers,
    }, 'Projet chargé')
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée — veuillez vous reconnecter')
      }
    }
    return handleApiError(err)
  }
}

// ─── PUT: Upsert project ──────────────────────

export async function PUT(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('session')?.value
    const headerToken = getTokenFromHeader(request)
    const token = cookieToken || headerToken

    if (!token) {
      return Errors.unauthorized('No session token found')
    }

    const payload = await verifyToken(token)

    const body = await request.json()
    const parsed = projetUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      )
    }

    const data: ProjetUpdateBody = parsed.data

    // Determine phase based on progress
    const progress = data.progressPercent ?? 0
    let currentPhase = 'DISCOVERY'
    if (progress >= 80) currentPhase = 'LAUNCH'
    else if (progress >= 60) currentPhase = 'STRATEGY'
    else if (progress >= 40) currentPhase = 'MODELING'
    else if (progress >= 20) currentPhase = 'PROFILING'

    // Upsert the CreatorJourney
    const journey = await db.creatorJourney.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        currentPhase: currentPhase as 'DISCOVERY' | 'PROFILING' | 'MODELING' | 'STRATEGY' | 'LAUNCH',
        progressPercent: progress,
        projectTitle: data.projectTitle || null,
        projectDescription: data.projectDescription || null,
        projectSector: data.projectSector || null,
        projectStage: data.projectStage || null,
        targetAudience: data.targetAudience || null,
        valueProposition: data.valueProposition || null,
        estimatedInvestment: data.estimatedInvestment || null,
        creationMotivation: data.creationMotivation || null,
        visionAnswers: data.extraData || {},
      },
      update: {
        currentPhase: currentPhase as 'DISCOVERY' | 'PROFILING' | 'MODELING' | 'STRATEGY' | 'LAUNCH',
        progressPercent: progress,
        ...(data.projectTitle !== undefined && { projectTitle: data.projectTitle || null }),
        ...(data.projectDescription !== undefined && { projectDescription: data.projectDescription || null }),
        ...(data.projectSector !== undefined && { projectSector: data.projectSector || null }),
        ...(data.projectStage !== undefined && { projectStage: data.projectStage || null }),
        ...(data.targetAudience !== undefined && { targetAudience: data.targetAudience || null }),
        ...(data.valueProposition !== undefined && { valueProposition: data.valueProposition || null }),
        ...(data.estimatedInvestment !== undefined && { estimatedInvestment: data.estimatedInvestment || null }),
        ...(data.creationMotivation !== undefined && { creationMotivation: data.creationMotivation || null }),
        ...(data.extraData !== undefined && { visionAnswers: data.extraData }),
      },
    })

    return success({
      id: journey.id,
      progressPercent: journey.progressPercent,
      currentPhase: journey.currentPhase,
    }, 'Projet sauvegardé avec succès')
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée — veuillez vous reconnecter')
      }
    }
    return handleApiError(err)
  }
}
