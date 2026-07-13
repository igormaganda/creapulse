import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { getEnrollmentIdFromRequest, buildCompositeKey } from '@/lib/enrollment-context'

// ─── GET /api/export/business-plan ───────────
// Fetch all data needed for Business Plan PDF generation
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
      },
    })
    if (!user) return Errors.userNotFound()

    // Fetch CreatorJourney with BP sections
    const journey = await db.creatorJourney.findUnique({
      where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) },
    })

    // Fetch ModuleResults
    const moduleResults = await db.moduleResult.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    })

    // Fetch RIASEC results
    const riasecResults = await db.riasecResult.findMany({
      where: { userId },
      orderBy: [{ isDominant: 'desc' }, { score: 'desc' }],
    })

    // Fetch Financial Forecast
    const financialForecast = await db.financialForecast.findUnique({
      where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) },
    })

    // Parse BP sections from journey
    const bpSections = (journey?.bpSections as Record<string, unknown>) || {}

    return success({
      entrepreneur: {
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      project: {
        title: journey?.projectTitle || '',
        description: journey?.projectDescription || '',
        sector: journey?.projectSector || '',
        stage: journey?.projectStage || '',
        targetAudience: journey?.targetAudience || '',
        motivation: journey?.creationMotivation || '',
        valueProposition: journey?.valueProposition || '',
      },
      sections: bpSections,
      bpScore: journey?.bpScore || 0,
      bpStatus: journey?.bpStatus || 'NOT_STARTED',
      moduleResults: moduleResults.map((m) => ({
        moduleCode: m.moduleCode,
        score: m.score,
        maxScore: m.maxScore,
        completedAt: m.completedAt,
      })),
      riasecResults: riasecResults.map((r) => ({
        profileType: r.profileType,
        score: r.score,
        isDominant: r.isDominant,
      })),
      financialForecast: financialForecast
        ? {
            year1Revenue: financialForecast.year1Revenue,
            year1Expenses: financialForecast.year1Expenses,
            year2Revenue: financialForecast.year2Revenue,
            year2Expenses: financialForecast.year2Expenses,
            year3Revenue: financialForecast.year3Revenue,
            year3Expenses: financialForecast.year3Expenses,
            breakevenMonth: financialForecast.breakevenMonth,
            initialInvestment: financialForecast.initialInvestment,
            grossMarginRate: financialForecast.grossMarginRate,
            netMarginRate: financialForecast.netMarginRate,
          }
        : null,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
