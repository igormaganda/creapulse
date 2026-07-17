// ============================================
// CreaPulse V2 — Production Business Plan PDF Export
// POST /api/export/business-plan/pdf
// Authenticated endpoint — generates and returns a PDF binary
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { getEnrollmentIdFromRequest } from '@/lib/enrollment-context'
import { buildBusinessPlanPdf, type BusinessPlanPdfData } from '@/lib/pdf/business-plan-pdf'

export async function POST(request: NextRequest) {
  try {
    // ── Auth: cookie first, then Authorization header ──
    let token = request.cookies.get('session')?.value
    if (!token) {
      token = getTokenFromHeader(request)
    }
    if (!token) return Errors.unauthorized('Non authentifié')

    const payload = await verifyToken(token)
    const userId = payload.userId
    const enrollmentId = getEnrollmentIdFromRequest(request)

    // ── Fetch user ──
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

    // ── Fetch CreatorJourney ──
    const journey = await db.creatorJourney.findFirst({
      where: { userId },
    })

    // ── Fetch FinancialForecast ──
    const financialForecast = await db.financialForecast.findFirst({
      where: { userId },
    })

    // ── Fetch JuridiqueAnalysis ──
    const juridiqueAnalysis = await db.juridiqueAnalysis.findFirst({
      where: { userId },
    })

    // ── Fetch MarketAnalysis ──
    const marketAnalysis = await db.marketAnalysis.findFirst({
      where: { userId },
    })

    // ── Parse BP sections ──
    const bpSections = (journey?.bpSections as Record<string, unknown>) || {}

    // ── Build PDF data ──
    const pdfData: BusinessPlanPdfData = {
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
          }
        : null,
      juridiqueAnalysis: juridiqueAnalysis
        ? {
            recommendedStatus: juridiqueAnalysis.recommendedStatus,
            fiscalRegime: juridiqueAnalysis.fiscalRegime,
            legalStructure: juridiqueAnalysis.legalStructure,
            socialCharges: juridiqueAnalysis.socialCharges as unknown,
          }
        : null,
      marketAnalysis: marketAnalysis
        ? {
            sector: marketAnalysis.sector,
            marketSize: marketAnalysis.marketSize,
            targetAudience: marketAnalysis.targetAudience,
            trends: marketAnalysis.trends as unknown,
            competitors: marketAnalysis.competitors as unknown,
            opportunities: marketAnalysis.opportunities,
            threats: marketAnalysis.threats,
            aiSynthesis: marketAnalysis.aiSynthesis,
          }
        : null,
    }

    // ── Generate PDF ──
    console.log(`[BP-PDF] Generating PDF for user ${userId} (enrollment: ${enrollmentId || 'default'})`)
    const pdfBuffer = await buildBusinessPlanPdf(pdfData)

    // ── Build filename ──
    const slug = pdfData.project.title
      .toLowerCase()
      .replace(/[^a-z0-9àâäéèêëïîôùûüÿçœæ\s-]/gi, '')
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'business-plan'

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="business-plan-${slug}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[BP-PDF] Generation failed: ${message}`)

    // If it's an AuthError, let it propagate
    if (err && typeof err === 'object' && 'statusCode' in err) {
      const authErr = err as { statusCode: number; message: string; code: string }
      return Errors.unauthorized(authErr.message)
    }

    return handleApiError(err)
  }
}