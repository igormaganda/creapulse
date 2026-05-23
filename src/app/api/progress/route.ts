// ============================================
// CreaPulse V2 — Progress API
// GET /api/progress — Compute real module completion progress
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'

// ─── Auth helper ─────────────────────────────

async function authenticate(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const authHeader = request.headers.get('authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)

  if (!token) return null

  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}

// ─── Progress types ──────────────────────────

interface SectionProgress {
  progress: number
  modules: Record<string, boolean>
}

interface ProgressData {
  parcours: SectionProgress
  strategie: SectionProgress
  global: number
}

// ─── GET: Compute progress ───────────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized()
    }

    const userId = payload.userId

    // Fetch all data in parallel for performance
    const [
      journey,
      riasecCount,
      kiviatCount,
      moduleResults,
      marketAnalysis,
      juridiqueAnalysis,
      financialForecast,
      creasimSimulation,
      businessModelCanvas,
      zeroDraft,
    ] = await Promise.all([
      // Parcours: CreatorJourney for project data + BP status
      db.creatorJourney.findUnique({
        where: { userId },
        select: {
          projectTitle: true,
          projectDescription: true,
          projectSector: true,
          visionAnswers: true,
          bpStatus: true,
          bpScore: true,
        },
      }),

      // RIASEC: completed if >= 6 dimension results
      db.riasecResult.count({ where: { userId } }),

      // Kiviat: completed if >= 8 category results
      db.kiviatResult.count({ where: { userId } }),

      // Module results for bilan-ia check
      db.moduleResult.findMany({
        where: { userId },
        select: { moduleCode: true, completedAt: true },
      }),

      // Marché: completed if sector + targetAudience filled
      db.marketAnalysis.findUnique({
        where: { userId },
        select: { sector: true, targetAudience: true },
      }),

      // Juridique: completed if recommendedStatus filled
      db.juridiqueAnalysis.findUnique({
        where: { userId },
        select: { recommendedStatus: true },
      }),

      // Financier: completed if year1Revenue + year1Expenses filled
      db.financialForecast.findUnique({
        where: { userId },
        select: { year1Revenue: true, year1Expenses: true },
      }),

      // CreaSim: completed if monthlyRevenue filled
      db.creaSimSimulation.findUnique({
        where: { userId },
        select: { monthlyRevenue: true },
      }),

      // BMC: completed if at least 5 of 9 blocks filled
      db.businessModelCanvas.findUnique({
        where: { userId },
        select: {
          partenairesCles: true,
          activitesCles: true,
          ressourcesCles: true,
          propositionValeur: true,
          relationsClients: true,
          canaux: true,
          segmentsClients: true,
          structureCouts: true,
          sourcesRevenus: true,
        },
      }),

      // Pitch Deck (ZeroDraft): completed if content has 8 slides
      db.zeroDraft.findUnique({
        where: { userId },
        select: { content: true },
      }),
    ])

    // ─── Parcours modules (6 total) ───────────

    const profilCreateur = true // Always considered done (auto-filled at registration)

    const monProjet = !!(
      journey?.projectTitle ||
      journey?.projectDescription ||
      journey?.projectSector
    )

    // Vision: completed if visionAnswers JSON has meaningful content
    const visionAnswers = journey?.visionAnswers as Record<string, unknown> | null
    const vision = !!(visionAnswers && Object.keys(visionAnswers).length > 0)

    const riasec = riasecCount >= 6
    const kiviat = kiviatCount >= 8

    // Bilan IA: completed if bilan-ia module result exists
    const bilanIaResult = moduleResults.find(
      (m) => m.moduleCode === 'bilan-ia' && m.completedAt !== null
    )
    const bilanIa = !!bilanIaResult

    const parcoursModules = {
      'profil-createur': profilCreateur,
      'mon-projet': monProjet,
      vision,
      riasec,
      kiviat,
      'bilan-ia': bilanIa,
    }

    const parcoursCompleted = Object.values(parcoursModules).filter(Boolean).length
    const parcoursProgress = Math.round((parcoursCompleted / 6) * 100)

    // ─── Stratégie modules (7 total) ─────────

    const marche = !!(marketAnalysis?.sector && marketAnalysis?.targetAudience)
    const juridique = !!juridiqueAnalysis?.recommendedStatus
    const financier = !!(
      financialForecast?.year1Revenue !== null &&
      financialForecast?.year1Expenses !== null
    )
    const creasim = creasimSimulation?.monthlyRevenue != null && creasimSimulation.monthlyRevenue > 0

    // BMC: at least 5 of 9 blocks have non-empty content
    const bmcBlocks = businessModelCanvas
      ? [
          businessModelCanvas.partenairesCles,
          businessModelCanvas.activitesCles,
          businessModelCanvas.ressourcesCles,
          businessModelCanvas.propositionValeur,
          businessModelCanvas.relationsClients,
          businessModelCanvas.canaux,
          businessModelCanvas.segmentsClients,
          businessModelCanvas.structureCouts,
          businessModelCanvas.sourcesRevenus,
        ]
      : []
    const bmcFilledCount = bmcBlocks.filter(
      (block) => block !== null && block !== undefined && String(block).trim().length > 0
    ).length
    const bmc = bmcFilledCount >= 5

    // Business Plan: completed if status is DRAFT or above and score > 50
    const bpStatusValues = ['DRAFT', 'REVIEW', 'VALIDATED', 'EXPORTED']
    const businessPlan = !!(
      journey?.bpStatus &&
      bpStatusValues.includes(journey.bpStatus) &&
      (journey.bpScore ?? 0) > 50
    )

    // Pitch Deck (ZeroDraft): completed if content has at least 8 slide markers
    // Slides are typically separated by "---" or "## Slide X" markers
    const pitchDeck = !!(zeroDraft?.content && zeroDraft.content.split('---').length >= 8)

    const strategieModules = {
      marche,
      juridique,
      financier,
      creasim,
      bmc,
      'business-plan': businessPlan,
      'pitch-deck': pitchDeck,
    }

    const strategieCompleted = Object.values(strategieModules).filter(Boolean).length
    const strategieProgress = Math.round((strategieCompleted / 7) * 100)

    // ─── Global progress ──────────────────────
    // Weighted average: Parcours (40%) + Stratégie (60%)
    // Écosystème and Pilotage are not counted in global progress
    const global = Math.round(parcoursProgress * 0.4 + strategieProgress * 0.6)

    const data: ProgressData = {
      parcours: {
        progress: parcoursProgress,
        modules: parcoursModules,
      },
      strategie: {
        progress: strategieProgress,
        modules: strategieModules,
      },
      global,
    }

    return success(data, 'Progression calculée')
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée')
      }
    }
    return handleApiError(err)
  }
}
