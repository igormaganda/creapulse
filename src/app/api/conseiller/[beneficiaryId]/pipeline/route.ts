// ============================================
// CreaPulse V2 — Conseiller Pipeline API
// GET /api/conseiller/[beneficiaryId]/pipeline
// Returns the beneficiary's pipeline V3 status
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { MODULE_REGISTRY } from '@/lib/module-registry'

// ─── Modules that store data in their own dedicated tables ───
const TABLE_MODULE_MAP: Record<string, string> = {
  marche: 'marketAnalysis',
  juridique: 'juridiqueAnalysis',
  financier: 'financialForecast',
  creasim: 'creasimSimulation',
  bmc: 'businessModelCanvas',
}

// ─── GET: Pipeline status for a beneficiary ───

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ beneficiaryId: string }> },
) {
  try {
    // 1. Auth: COUNSELOR or ADMIN only
    const authResult = await withAuth(request, { roles: ['COUNSELOR', 'ADMIN'] })
    if (authResult instanceof NextResponse) return authResult
    const { tenantId } = authResult

    const { beneficiaryId } = await params

    // 2. Verify beneficiary exists and belongs to same tenant
    const beneficiary = await db.user.findUnique({
      where: { id: beneficiaryId },
      select: { id: true, tenantId: true, role: true },
    })

    if (!beneficiary) {
      return Errors.notFound('Bénéficiaire')
    }

    if (beneficiary.tenantId !== tenantId) {
      return Errors.forbidden('Ce bénéficiaire n\'appartient pas à votre organisation.')
    }

    // 3. Fetch all data sources in parallel
    const [
      journey,
      moduleResults,
      marketAnalysis,
      juridiqueAnalysis,
      financialForecast,
      creasimSimulation,
      bmc,
    ] = await Promise.all([
      db.creatorJourney.findUnique({
        where: { userId: beneficiaryId },
        select: {
          bpSections: true,
          bpSectionMeta: true,
          bpStatus: true,
          bpScore: true,
          progressPercent: true,
          projectTitle: true,
          visionAnswers: true,
          updatedAt: true,
        },
      }),
      db.moduleResult.findMany({
        where: { userId: beneficiaryId },
        select: {
          moduleCode: true,
          score: true,
          maxScore: true,
          completedAt: true,
          createdAt: true,
        },
      }),
      db.marketAnalysis.findUnique({
        where: { userId: beneficiaryId },
        select: { updatedAt: true, sector: true },
      }),
      db.juridiqueAnalysis.findUnique({
        where: { userId: beneficiaryId },
        select: { updatedAt: true, recommendedStatus: true },
      }),
      db.financialForecast.findUnique({
        where: { userId: beneficiaryId },
        select: { updatedAt: true, year1Revenue: true },
      }),
      db.creaSimSimulation.findUnique({
        where: { userId: beneficiaryId },
        select: { updatedAt: true, monthlyRevenue: true },
      }),
      db.businessModelCanvas.findUnique({
        where: { userId: beneficiaryId },
        select: { updatedAt: true, status: true },
      }),
    ])

    // 4. Build module results lookup
    const moduleResultMap = new Map(
      moduleResults.map((mr) => [mr.moduleCode, mr]),
    )

    // Dedicated table lookups
    const tableData: Record<string, { updatedAt: Date | null; hasData: boolean }> = {
      marche: {
        updatedAt: marketAnalysis?.updatedAt ?? null,
        hasData: !!(marketAnalysis?.sector),
      },
      juridique: {
        updatedAt: juridiqueAnalysis?.updatedAt ?? null,
        hasData: !!(juridiqueAnalysis?.recommendedStatus),
      },
      financier: {
        updatedAt: financialForecast?.updatedAt ?? null,
        hasData: financialForecast?.year1Revenue != null && financialForecast.year1Revenue > 0,
      },
      creasim: {
        updatedAt: creasimSimulation?.updatedAt ?? null,
        hasData: creasimSimulation?.monthlyRevenue != null && creasimSimulation?.monthlyRevenue > 0,
      },
      bmc: {
        updatedAt: bmc?.updatedAt ?? null,
        hasData: bmc?.status === 'GENERATED' || bmc?.status === 'REFINED',
      },
    }

    // 5. Build modules array using registry
    const modules: Array<{
      code: string
      label: string
      status: 'not_started' | 'in_progress' | 'completed'
      score: number | null
      lastActivity: string | null
    }> = []

    let pipelineWarnings = 0
    let mostRecentActivity: Date | null = null

    for (const modDef of MODULE_REGISTRY) {
      // Skip ecosystem/pilotage utility modules that don't have pipeline-relevant data
      // but still check ModuleResult for diagnostic/strategy modules
      const mr = moduleResultMap.get(modDef.code)
      const td = TABLE_MODULE_MAP[modDef.code] ? tableData[TABLE_MODULE_MAP[modDef.code]] : null

      let status: 'not_started' | 'in_progress' | 'completed' = 'not_started'
      let score: number | null = null
      let lastActivity: string | null = null

      // Determine status
      // Priority 1: ModuleResult (for diagnostic modules like riasec, kiviat, pepites, etc.)
      if (mr) {
        if (mr.completedAt) {
          status = 'completed'
          score = mr.maxScore > 0 ? Math.round((mr.score / mr.maxScore) * 100) : mr.score
        } else {
          status = 'in_progress'
          score = mr.maxScore > 0 ? Math.round((mr.score / mr.maxScore) * 100) : mr.score
        }
        lastActivity = (mr.completedAt ?? mr.createdAt).toISOString()

        // Warning: completed with low score
        if (status === 'completed' && score !== null && score < 30) {
          pipelineWarnings++
        }
      }

      // Priority 2: Dedicated table data (for strategy modules)
      if (td?.hasData && status === 'not_started') {
        status = 'in_progress'
        lastActivity = td.updatedAt?.toISOString() ?? null
      }
      if (td?.hasData && td?.updatedAt) {
        // If ModuleResult says completed but table has no data, that's a warning
        if (status === 'completed' && !td.hasData) {
          pipelineWarnings++
        }
        // Update lastActivity from table if more recent
        if (td.updatedAt) {
          const tdDate = td.updatedAt instanceof Date ? td.updatedAt : new Date(td.updatedAt)
          const currentLast = lastActivity ? new Date(lastActivity) : null
          if (!currentLast || tdDate > currentLast) {
            lastActivity = tdDate.toISOString()
          }
        }
      }

      // For vision/mon-projet: check CreatorJourney
      if (modDef.code === 'vision' && journey?.visionAnswers) {
        const answers = journey.visionAnswers as Record<string, unknown> | null
        const hasAnswers = answers && typeof answers === 'object' && Object.keys(answers).length > 0
        if (hasAnswers) {
          status = status === 'not_started' ? 'in_progress' : status
          lastActivity = journey.updatedAt?.toISOString() ?? lastActivity
        }
      }

      if (modDef.code === 'mon-projet' && journey?.projectTitle) {
        status = status === 'not_started' ? 'in_progress' : status
        lastActivity = journey.updatedAt?.toISOString() ?? lastActivity
      }

      // Track most recent activity
      if (lastActivity) {
        const actDate = new Date(lastActivity)
        if (!mostRecentActivity || actDate > mostRecentActivity) {
          mostRecentActivity = actDate
        }
      }

      modules.push({
        code: modDef.code,
        label: modDef.label,
        status,
        score,
        lastActivity,
      })
    }

    // 6. Additional pipeline warnings:
    // - Modules in_progress for > 30 days with no score improvement
    // - BP has data (bpScore > 0) but core strategy modules not started
    const bpScore = journey?.bpScore ?? null
    const bpStatus = journey?.bpStatus ?? 'NOT_STARTED'

    if (bpScore && bpScore > 0) {
      const coreStrategyCodes = ['marche', 'juridique', 'financier']
      const coreNotStarted = modules
        .filter((m) => coreStrategyCodes.includes(m.code) && m.status === 'not_started')
      if (coreNotStarted.length > 0) {
        pipelineWarnings += coreNotStarted.length
      }
    }

    // 7. Build response
    const responseData = {
      beneficiaryId,
      projectTitle: journey?.projectTitle ?? null,
      globalProgress: journey?.progressPercent ?? 0,
      bpStatus,
      bpScore,
      modules,
      pipelineWarnings,
      lastActiveAt: mostRecentActivity?.toISOString() ?? null,
    }

    return success(responseData, 'Pipeline chargé')
  } catch (err) {
    return handleApiError(err)
  }
}