// ============================================
// CreaPulse V2 — Pipeline Status API
// GET /api/pipeline-status — Returns BP section sources (simulateur vs manual)
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'

// ─── Types ───────────────────────────────────

type SectionSource = 'marche' | 'juridique' | 'financier' | 'creasim' | 'parcours' | 'manual' | 'empty'

interface SectionStatus {
  filled: boolean
  source: SectionSource
}

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

// ─── Section → simulateur mapping ────────────

// Sections that can be auto-populated from simulateur data
const MARCHE_SECTIONS = ['etude-marche', 'segmentation', 'concurrence', 'strategie-marketing', 'plan-commercial', 'swot']
const JURIDIQUE_SECTIONS = ['statut-juridique']
const FINANCIER_SECTIONS = ['financement', 'compte-resultat', 'tresorerie', 'investissements', 'bilan']
const CREASIM_SECTIONS = ['seuil-rentabilite']

// Sections typically generated from Parcours data (project context)
const PARCOURS_SECTIONS = ['resume', 'equipe', 'historique', 'vision', 'valeurs']

// Sections that are typically manually filled
const MANUAL_SECTIONS = ['localisation', 'organisation', 'production', 'calendrier']

/**
 * Check if a section value is considered "filled" (non-empty content)
 */
function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'object') {
    // For tables (arrays), check if there are items with data
    if (Array.isArray(value)) {
      return value.length > 0
    }
    // For objects (SWOT, milestones, etc.), check if any key has content
    return Object.values(value).some((v) => {
      if (typeof v === 'string') return v.trim().length > 0
      if (Array.isArray(v)) return v.length > 0
      return v !== null && v !== undefined
    })
  }
  return false
}

// ─── GET: Compute pipeline status ────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized()
    }

    const userId = payload.userId

    // Fetch BP sections + simulateur data in parallel
    const [
      journey,
      marketAnalysis,
      juridiqueAnalysis,
      financialForecast,
      creasimSimulation,
    ] = await Promise.all([
      db.creatorJourney.findUnique({
        where: { userId },
        select: { bpSections: true },
      }),
      db.marketAnalysis.findUnique({
        where: { userId },
        select: { sector: true, targetAudience: true },
      }),
      db.juridiqueAnalysis.findUnique({
        where: { userId },
        select: { recommendedStatus: true },
      }),
      db.financialForecast.findUnique({
        where: { userId },
        select: { year1Revenue: true, year1Expenses: true },
      }),
      db.creaSimSimulation.findUnique({
        where: { userId },
        select: { monthlyRevenue: true },
      }),
    ])

    // Check which simulateurs have data
    const hasMarcheData = !!(marketAnalysis?.sector && marketAnalysis?.targetAudience)
    const hasJuridiqueData = !!juridiqueAnalysis?.recommendedStatus
    const hasFinancierData = !!(
      financialForecast?.year1Revenue !== null &&
      financialForecast?.year1Expenses !== null
    )
    const hasCreaSimData = !!(creasimSimulation?.monthlyRevenue != null && creasimSimulation.monthlyRevenue > 0)

    // Parse bpSections from journey (it's a JSON object: { sectionId: content })
    const bpSections = (journey?.bpSections as Record<string, unknown>) || {}

    const statuses: Record<string, SectionStatus> = {}

    // Process all known BP sections
    const allSections = [
      ...MARCHE_SECTIONS,
      ...JURIDIQUE_SECTIONS,
      ...FINANCIER_SECTIONS,
      ...CREASIM_SECTIONS,
      ...PARCOURS_SECTIONS,
      ...MANUAL_SECTIONS,
    ]

    for (const sectionId of allSections) {
      const content = bpSections[sectionId]
      const filled = isFilled(content)

      // Determine source based on section category + simulateur data availability
      let source: SectionSource = 'empty'

      if (filled) {
        if (MARCHE_SECTIONS.includes(sectionId) && hasMarcheData) {
          source = 'marche'
        } else if (JURIDIQUE_SECTIONS.includes(sectionId) && hasJuridiqueData) {
          source = 'juridique'
        } else if (FINANCIER_SECTIONS.includes(sectionId) && hasFinancierData) {
          source = 'financier'
        } else if (CREASIM_SECTIONS.includes(sectionId) && hasCreaSimData) {
          source = 'creasim'
        } else if (PARCOURS_SECTIONS.includes(sectionId)) {
          source = 'parcours'
        } else {
          source = 'manual'
        }
      }

      statuses[sectionId] = { filled, source }
    }

    // Also include any unknown sections from bpSections
    for (const sectionId of Object.keys(bpSections)) {
      if (!(sectionId in statuses)) {
        const content = bpSections[sectionId]
        const filled = isFilled(content)
        statuses[sectionId] = {
          filled,
          source: filled ? 'manual' : 'empty',
        }
      }
    }

    // Summary counts
    const filledCount = Object.values(statuses).filter((s) => s.filled).length
    const totalCount = Object.keys(statuses).length

    return success({
      sections: statuses,
      summary: {
        total: totalCount,
        filled: filledCount,
        empty: totalCount - filledCount,
        sources: {
          marche: Object.values(statuses).filter((s) => s.source === 'marche').length,
          juridique: Object.values(statuses).filter((s) => s.source === 'juridique').length,
          financier: Object.values(statuses).filter((s) => s.source === 'financier').length,
          creasim: Object.values(statuses).filter((s) => s.source === 'creasim').length,
          parcours: Object.values(statuses).filter((s) => s.source === 'parcours').length,
          manual: Object.values(statuses).filter((s) => s.source === 'manual').length,
        },
      },
    }, 'Statut du pipeline calculé')
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
