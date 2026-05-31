// ============================================
// CréaScope — Session Detail API
// GET    /api/creascope/sessions/[id]  — Get session detail
// PATCH  /api/creascope/sessions/[id]  — Update session (advance step, notes, etc.)
// DELETE /api/creascope/sessions/[id]  — Cancel session
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'
import { callZAI, getZAIErrorMessage } from '@/lib/zai-helper'
import { buildFTContext, contextToPrompt } from '@/lib/ft-enrichment'

// ─── Constants ──────────────────────────

const STEP_ORDER = [
  'ACCUEIL',
  'FLASH_SWIPE',
  'ANALYSE_INTERMEDIAIRE',
  'QUESTIONNAIRE',
  'CHALLENGE_SCENARIO',
  'BILAN_IA',
  'PLAN_ACTION',
  'TERMINEE',
] as const

type CreascopeStepType = (typeof STEP_ORDER)[number]

function getNextStep(current: string): CreascopeStepType | null {
  const idx = STEP_ORDER.indexOf(current as CreascopeStepType)
  if (idx === -1 || idx >= STEP_ORDER.length - 1) return null
  return STEP_ORDER[idx + 1]
}

// ─── Validation ─────────────────────────

const PatchBody = z.object({
  action: z.enum(['start', 'advance_step', 'pause', 'resume', 'complete', 'add_notes']),
  step: z.string().optional(),
  notes: z.string().optional(),
  stepNotes: z.string().optional(),
})

// ─── Helper: verify access ──────────────

async function verifyAccess(sessionId: string, userId: string, role: string) {
  const session = await db.creascopeSession.findUnique({
    where: { id: sessionId },
    include: {
      beneficiary: { include: { user: { select: { id: true } } } },
      counselor: { include: { user: { select: { id: true } } } },
    },
  })

  if (!session) return { session: null, error: Errors.notFound('Session CréaScope') }

  const isCounselor = session.counselor.userId === userId
  const isBeneficiary = session.beneficiary.userId === userId
  const isAdmin = role === 'ADMIN'

  if (!isCounselor && !isBeneficiary && !isAdmin) {
    return { session: null, error: Errors.forbidden('Accès non autorisé à cette session') }
  }

  return { session, error: null }
}

// ─── Helper: compute weighted globalScore ──

async function computeGlobalScore(
  beneficiaryUserId: string,
  stepProgress: Record<string, Record<string, unknown>>
): Promise<number> {
  // Step completion (0-100)
  const completedSteps = Object.entries(stepProgress)
    .filter(([, v]) => (v as Record<string, unknown>).completedAt)
    .length
  const totalSteps = STEP_ORDER.length - 1 // exclude TERMINEE
  const stepCompletion = (completedSteps / totalSteps) * 100

  // Kiviat average (0-100)
  const kiviatResults = await db.kiviatResult.findMany({
    where: { userId: beneficiaryUserId },
  })
  const avgKiviat =
    kiviatResults.length > 0
      ? kiviatResults.reduce((sum, k) => sum + (k.score / k.maxScore) * 100, 0) /
        kiviatResults.length
      : 50 // default 50 if no Kiviat data

  // Weighted: 60% step completion + 40% Kiviat
  return Math.round(stepCompletion * 0.6 + avgKiviat * 0.4)
}

// ─── AI insight generation ───────────────

async function generateAIInsights(
  sessionId: string,
  step: string,
  beneficiaryName: string,
  stepProgress: Record<string, unknown>,
  sector?: string,
) {
  // ─── FT enrichment for richer insights ───
  let ftContextStr = ''
  if (sector) {
    try {
      const ftCtx = await buildFTContext({ secteur: sector, region: '11' /* IDF default */ })
      ftContextStr = contextToPrompt(ftCtx)
    } catch (ftErr) {
      console.warn('[FT Enrichment] France Travail enrichment failed in session insights:',
        ftErr instanceof Error ? ftErr.message : ftErr)
    }
  }

  const userContentParts = [
    `Session CréaScope - Étape: ${step}`,
    `Bénéficiaire: ${beneficiaryName}`,
    `Progression des étapes: ${JSON.stringify(stepProgress)}`,
    '',
    'Génère un JSON avec la structure suivante :',
    '{',
    '  "summary": "Résumé de 2-3 phrases des observations",',
    '  "strengths": ["force 1", "force 2", "force 3"],',
    '  "areasToWork": ["point d\'amélioration 1", "point d\'amélioration 2"],',
    '  "recommendations": ["recommandation 1", "recommandation 2"],',
    '  "nextStepFocus": "Conseil pour l\'étape suivante"',
    '}',
  ftContextStr ? `\n${ftContextStr}` : '',
  '\nUtilise les données France Travail ci-dessus pour enrichir tes recommandations si elles sont disponibles.',
  ].filter(Boolean).join('\n')

  const result = await callZAI(
    [
      {
        role: 'system',
        content: `Tu es un conseiller entrepreneurial expert dans l'accompagnement de créateurs d'entreprise au sein du GIDEF.
Tu analyses les résultats des étapes du pipeline CréaScope pour fournir des insights au conseiller.
Réponds en français de manière concise et actionnable.
Si des données France Travail sont fournies, utilise-les pour enrichir tes recommandations (offres, formations, aides, métiers).`,
      },
      {
        role: 'user',
        content: userContentParts,
      },
    ],
    { temperature: 0.6, max_tokens: 800 },
  )

  if (!result.success) return null

  try {
    const jsonStr = result.content
    const match = jsonStr.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : null
  } catch {
    return null
  }
}

// ─── GET: Session detail ────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)
    const { id } = await params

    const { session, error } = await verifyAccess(id, payload.userId, payload.role)
    if (error) return error

    // Get beneficiary data (kiviat, riasec, project)
    const beneficiaryUser = session!.beneficiary.user
    const kiviatResults = await db.kiviatResult.findMany({
      where: { userId: session!.beneficiary.userId },
    })
    const riasecResults = await db.riasecResult.findMany({
      where: { userId: session!.beneficiary.userId },
    })
    const creatorJourney = await db.creatorJourney.findUnique({
      where: { userId: session!.beneficiary.userId },
    })
    const moduleResults = await db.moduleResult.findMany({
      where: { userId: session!.beneficiary.userId },
    })

    return success({
      ...session,
      beneficiaryData: {
        kiviatScores: kiviatResults,
        riasecScores: riasecResults,
        journey: creatorJourney,
        moduleResults,
      },
    })
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}

// ─── PATCH: Update session ───────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)
    const { id } = await params
    const body = await request.json()
    const { action, notes, stepNotes } = PatchBody.parse(body)

    const { session, error } = await verifyAccess(id, payload.userId, payload.role)
    if (error) return error

    // Only counselor can perform session actions
    if (session!.counselor.userId !== payload.userId && payload.role !== 'ADMIN') {
      return Errors.forbidden('Seuls les conseillers peuvent modifier la session')
    }

    const stepProgress = (session!.stepProgress as Record<string, Record<string, unknown>>) || {}
    const now = new Date()

    switch (action) {
      case 'start': {
        if (session!.status !== 'PLANIFIEE') {
          return Errors.validation(null, 'La session doit être planifiée pour démarrer')
        }
        const updatedProgress = {
          ...stepProgress,
          ACCUEIL: {
            startedAt: now.toISOString(),
            completedAt: null,
            durationMinutes: 0,
            notes: '',
          },
        }
        const updated = await db.creascopeSession.update({
          where: { id },
          data: {
            status: 'EN_COURS',
            startedAt: now,
            currentStep: 'ACCUEIL',
            stepProgress: updatedProgress,
          },
        })
        return success(updated, 'Session démarrée')
      }

      case 'advance_step': {
        if (session!.status !== 'EN_COURS') {
          return Errors.validation(null, 'La session doit être en cours')
        }

        const currentStep = session!.currentStep
        const nextStep = getNextStep(currentStep)

        if (!nextStep) {
          return Errors.validation(null, 'La session est déjà à la dernière étape')
        }

        // Record completion of current step
        const currentStepData = stepProgress[currentStep] || {}
        const startedAt = currentStepData.startedAt ? new Date(currentStepData.startedAt as string) : now
        const durationMinutes = Math.round((now.getTime() - startedAt.getTime()) / 60000)

        const updatedProgress = {
          ...stepProgress,
          [currentStep]: {
            ...(currentStepData as Record<string, unknown>),
            completedAt: now.toISOString(),
            durationMinutes,
            ...(stepNotes && { notes: stepNotes }),
          },
          [nextStep]: {
            startedAt: now.toISOString(),
            completedAt: null,
            durationMinutes: 0,
            notes: '',
          },
        }

        const updateData: Record<string, unknown> = {
          currentStep: nextStep,
          stepProgress: updatedProgress,
          ...(stepNotes && { counselorNotes: session!.counselorNotes
            ? `${session!.counselorNotes}\n[${currentStep}] ${stepNotes}`
            : `[${currentStep}] ${stepNotes}`
          }),
        }

        // Auto-generate AI insights for certain steps
        if (nextStep === 'ANALYSE_INTERMEDIAIRE' || nextStep === 'BILAN_IA') {
          const beneficiaryName = session!.beneficiary.user.firstName || ''
          // Fetch sector from CreatorJourney for FT enrichment
          let sector: string | undefined
          try {
            const journey = await db.creatorJourney.findUnique({
              where: { userId: session!.beneficiary.userId },
              select: { projectSector: true },
            })
            sector = journey?.projectSector || undefined
          } catch {
            sector = undefined
          }
          const aiInsights = await generateAIInsights(
            id,
            nextStep,
            beneficiaryName,
            updatedProgress,
            sector
          )
          if (aiInsights) {
            updateData.aiInsights = aiInsights
          }
        }

        // Handle TERMINEE step
        if (nextStep === 'TERMINEE') {
          updateData.status = 'TERMINEE'
          updateData.completedAt = now
          // Compute global score: 60% step completion + 40% Kiviat average
          updateData.globalScore = await computeGlobalScore(
            session!.beneficiary.userId,
            updatedProgress as Record<string, Record<string, unknown>>
          )
        }

        const updated = await db.creascopeSession.update({
          where: { id },
          data: updateData,
        })
        return success(updated, `Étape avancée: ${nextStep}`)
      }

      case 'pause': {
        if (session!.status !== 'EN_COURS') {
          return Errors.validation(null, 'La session doit être en cours pour être mise en pause')
        }
        const updated = await db.creascopeSession.update({
          where: { id },
          data: { status: 'PAUSEE' },
        })
        return success(updated, 'Session mise en pause')
      }

      case 'resume': {
        if (session!.status !== 'PAUSEE') {
          return Errors.validation(null, 'La session doit être en pause pour être reprise')
        }
        const updated = await db.creascopeSession.update({
          where: { id },
          data: { status: 'EN_COURS' },
        })
        return success(updated, 'Session reprise')
      }

      case 'complete': {
        const completedProgress = {
          ...stepProgress,
          [session!.currentStep]: {
            ...(stepProgress[session!.currentStep] || {}),
            completedAt: now.toISOString(),
          },
        }
        // Compute global score: 60% step completion + 40% Kiviat average
        const globalScore = await computeGlobalScore(
          session!.beneficiary.userId,
          completedProgress as Record<string, Record<string, unknown>>
        )
        const updated = await db.creascopeSession.update({
          where: { id },
          data: {
            status: 'TERMINEE',
            completedAt: now,
            currentStep: 'TERMINEE',
            stepProgress: completedProgress,
            globalScore,
          },
        })
        return success(updated, 'Session terminée')
      }

      case 'add_notes': {
        if (!notes) return Errors.validation(null, 'Notes requises')
        const updated = await db.creascopeSession.update({
          where: { id },
          data: {
            counselorNotes: session!.counselorNotes
              ? `${session!.counselorNotes}\n${notes}`
              : notes,
          },
        })
        return success(updated, 'Notes ajoutées')
      }

      default:
        return Errors.validation(null, 'Action non reconnue')
    }
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}

// ─── DELETE: Cancel session ──────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)
    const { id } = await params

    const { session, error } = await verifyAccess(id, payload.userId, payload.role)
    if (error) return error

    if (session!.counselor.userId !== payload.userId && payload.role !== 'ADMIN') {
      return Errors.forbidden('Seuls les conseillers peuvent annuler la session')
    }

    if (session!.status !== 'PLANIFIEE' && session!.status !== 'PAUSEE') {
      return Errors.validation(
        null,
        'Seules les sessions planifiées ou en pause peuvent être annulées'
      )
    }

    const updated = await db.creascopeSession.update({
      where: { id },
      data: { status: 'ANNULEE' },
    })

    return success(updated, 'Session annulée')
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
