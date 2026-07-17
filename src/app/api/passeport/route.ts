// ============================================
// CreaPulse V2 — Passeport Entrepreneurial API
// GET /api/passeport — Retrieve passport summary data
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'
import { getEnrollmentIdFromRequest, buildCompositeKey } from '@/lib/enrollment-context'

// ─── Module codes tracked by passeport ────

const PASSEPORT_MODULES = [
  { code: 'profil', label: 'Profil Créateur', category: 'Parcours' },
  { code: 'riasec', label: 'Test RIASEC', category: 'Parcours' },
  { code: 'kiviat', label: 'Test Kiviat', category: 'Parcours' },
  { code: 'mon-projet', label: 'Mon Projet', category: 'Parcours' },
  { code: 'marche', label: 'Analyse de Marché', category: 'Stratégie' },
  { code: 'juridique', label: 'Analyse Juridique', category: 'Stratégie' },
  { code: 'financier', label: 'Plan Financier', category: 'Stratégie' },
  { code: 'business-plan', label: 'Business Plan', category: 'Stratégie' },
  { code: 'tremplin', label: 'Tremplin', category: 'Pilotage' },
]

// ─── GET: Retrieve passport summary ────────

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)
    }

    const payload = await verifyToken(token)
    const enrollmentId = getEnrollmentIdFromRequest(request)

    // Fetch CreatorJourney
    const journey = await db.creatorJourney.findUnique({
      where: { userId: payload.userId },
    })

    // Fetch all module results
    const moduleResults = await db.moduleResult.findMany({
      where: { userId: payload.userId },
    })

    // Build module statuses
    const moduleStatuses = PASSEPORT_MODULES.map((mod) => {
      const result = moduleResults.find((r) => r.moduleCode === mod.code)
      return {
        code: mod.code,
        label: mod.label,
        category: mod.category,
        status: result?.completedAt ? 'completed' as const : 'not_started' as const,
        score: result?.score ?? 0,
        maxScore: result?.maxScore ?? 100,
        completedAt: result?.completedAt ?? null,
      }
    })

    const completedCount = moduleStatuses.filter((m) => m.status === 'completed').length
    const progressPercent = Math.round((completedCount / PASSEPORT_MODULES.length) * 100)

    // Determine certification level
    let certificationLevel: 'none' | 'bronze' | 'argent' | 'or' | 'platine' = 'none'
    if (progressPercent >= 100) certificationLevel = 'platine'
    else if (progressPercent >= 75) certificationLevel = 'or'
    else if (progressPercent >= 50) certificationLevel = 'argent'
    else if (progressPercent >= 30) certificationLevel = 'bronze'

    // Skills acquired based on completed modules
    const skillsMap: Record<string, string[]> = {
      'profil': ['Connaissance de soi', 'Identité entrepreneuriale'],
      'riasec': ['Profil RIASEC', 'Compréhension des dimensions entrepreneuriales'],
      'kiviat': ['Auto-évaluation des compétences', 'Analyse radar'],
      'mon-projet': ['Formulation de projet', 'Market fit'],
      'marche': ['Analyse de marché', 'Étude concurrentielle', 'Segmentation'],
      'juridique': ['Droit des sociétés', 'Statut juridique', 'Fiscalité'],
      'financier': ['Planification financière', 'Gestion de trésorerie'],
      'business-plan': ['Rédaction de business plan', 'Stratégie commerciale', 'Prévisionnel'],
      'tremplin': ['Évaluation de préparation', 'Analyse de risques'],
    }

    const skillsAcquired = moduleStatuses
      .filter((m) => m.status === 'completed')
      .flatMap((m) => skillsMap[m.code] || [])

    // Build timeline from completed modules
    const timeline = moduleStatuses
      .filter((m) => m.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
      .map((m) => ({
        module: m.label,
        code: m.code,
        date: m.completedAt,
        score: m.score,
      }))

    return success({
      modules: moduleStatuses,
      totalModules: PASSEPORT_MODULES.length,
      completedCount,
      progressPercent,
      certificationLevel,
      skillsAcquired,
      timeline,
      passportGeneratedAt: journey?.passportGeneratedAt ?? null,
      attestationIds: journey?.passportAttestations as string[] | null ?? [],
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}
