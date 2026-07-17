import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { getEnrollmentIdFromRequest, buildCompositeKey } from '@/lib/enrollment-context'

// ─── Module definitions for passport ─────────
const PASSPORT_MODULES = [
  { code: 'profil-createur', label: 'Profil Créateur', category: 'Parcours' },
  { code: 'riasec', label: 'Test RIASEC', category: 'Parcours' },
  { code: 'kiviat', label: 'Compétences Kiviat', category: 'Parcours' },
  { code: 'mon-projet', label: 'Mon Projet', category: 'Parcours' },
  { code: 'marche', label: 'Analyse de Marché', category: 'Stratégie' },
  { code: 'juridique', label: 'Analyse Juridique', category: 'Stratégie' },
  { code: 'creasim', label: 'Plan Financier', category: 'Stratégie' },
  { code: 'business-plan', label: 'Business Plan', category: 'Stratégie' },
  { code: 'tremplin', label: 'Tremplin', category: 'Pilotage' },
]

function getCertificationLevel(percent: number): string {
  if (percent >= 100) return 'platine'
  if (percent >= 75) return 'or'
  if (percent >= 50) return 'argent'
  if (percent >= 30) return 'bronze'
  return 'none'
}

// ─── GET /api/export/passeport ───────────────
// Fetch all data needed for Passeport PDF generation
export async function GET(request: NextRequest) {
  try {
    // Auth: try cookie first, then header
    let token = request.cookies.get('session')?.value
    if (!token) {
      token = getTokenFromHeader(request)
    }
    if (!token) return Errors.unauthorized('Non authentifié')

    const payload = await verifyToken(token)
    const userId = payload.userId
    const enrollmentId = getEnrollmentIdFromRequest(request)

    // Fetch user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    })
    if (!user) return Errors.userNotFound()

    // Fetch CreatorJourney
    const journey = await db.creatorJourney.findUnique({
      where: { userId: userId },
    })

    // Fetch all ModuleResults
    const moduleResults = await db.moduleResult.findMany({
      where: { userId },
      orderBy: { completedAt: 'asc' },
    })

    // Fetch RIASEC results
    const riasecResults = await db.riasecResult.findMany({
      where: { userId },
      orderBy: [{ isDominant: 'desc' }, { score: 'desc' }],
    })

    // Fetch Kiviat results
    const kiviatResults = await db.kiviatResult.findMany({
      where: { userId },
      orderBy: { score: 'desc' },
    })

    // Build module status list
    const resultMap = new Map(moduleResults.map((r) => [r.moduleCode, r]))
    const modules = PASSPORT_MODULES.map((mod) => {
      const result = resultMap.get(mod.code)
      return {
        code: mod.code,
        label: mod.label,
        category: mod.category,
        status: result?.completedAt ? 'completed' as const : result ? 'in_progress' as const : 'not_started' as const,
        score: result?.score || 0,
        maxScore: result?.maxScore || 100,
        completedAt: result?.completedAt?.toISOString() || null,
      }
    })

    const completedCount = modules.filter((m) => m.status === 'completed').length
    const progressPercent = Math.round((completedCount / modules.length) * 100)
    const certificationLevel = getCertificationLevel(progressPercent)

    // Build skills list based on completed modules
    const skillsMap: Record<string, string[]> = {
      'profil-createur': ['Connaissance de soi', 'Identité entrepreneuriale'],
      'riasec': ['Profil RIASEC', 'Auto-évaluation des compétences'],
      'kiviat': ['Analyse radar des compétences', 'Identification des forces'],
      'mon-projet': ['Formulation de projet', 'Market fit', 'Business modeling'],
      'marche': ['Analyse de marché', 'Étude concurrentielle', 'Segmentation client'],
      'juridique': ['Droit des sociétés', 'Choix du statut juridique', 'Obligations légales'],
      'creasim': ['Plan financier', 'Gestion prévisionnelle', 'Seuil de rentabilité'],
      'business-plan': ['Rédaction business plan', 'Stratégie commerciale', 'SWOT'],
      'tremplin': ['Pitch professionnel', 'Présentation projet', 'Validation finale'],
    }

    const skillsAcquired: string[] = []
    modules.forEach((m) => {
      if (m.status === 'completed' && skillsMap[m.code]) {
        skillsAcquired.push(...skillsMap[m.code])
      }
    })

    // Build timeline
    const timeline = modules
      .filter((m) => m.completedAt)
      .map((m) => ({
        module: m.label,
        code: m.code,
        date: m.completedAt!,
        score: m.score,
      }))

    // Build attestation list
    const attestations = modules
      .filter((m) => m.status === 'completed')
      .map((m) => ({
        moduleCode: m.code,
        moduleLabel: m.label,
        completedAt: m.completedAt,
        score: m.score,
        referenceId: `GIDEF-${userId.slice(0, 6).toUpperCase()}-${m.code.toUpperCase()}`,
      }))

    // Generate unique reference number for the passport
    const refNumber = `PASS-${userId.slice(0, 8).toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`

    return success({
      entrepreneur: {
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        registeredAt: user.createdAt?.toISOString() || null,
      },
      journey: {
        projectTitle: journey?.projectTitle || '',
        currentPhase: journey?.currentPhase || 'DISCOVERY',
        progressPercent: journey?.progressPercent || 0,
        startedAt: journey?.startedAt?.toISOString() || null,
      },
      modules,
      totalModules: modules.length,
      completedCount,
      progressPercent,
      certificationLevel,
      skillsAcquired,
      timeline,
      attestations,
      riasecProfile: {
        dominant: riasecResults.filter((r) => r.isDominant).map((r) => r.profileType),
        scores: riasecResults.map((r) => ({
          profileType: r.profileType,
          score: r.score,
          isDominant: r.isDominant,
        })),
      },
      kiviatProfile: {
        scores: kiviatResults.map((k) => ({
          category: k.category,
          score: k.score,
          maxScore: k.maxScore,
        })),
      },
      passportReference: refNumber,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
