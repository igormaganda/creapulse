// ============================================
// CreaPulse V2 — Analyse Juridique API
// GET  /api/juridique  — Retrieve juridical analysis
// POST /api/juridique  — Save answers + get recommendation
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

// ─── Validation Schema ───────────────────────

const juridiqueSchema = z.object({
  answers: z.record(z.string(), z.string()).optional(),
  recommendedStatus: z.string().optional(),
  fiscalRegime: z.string().optional(),
  legalStructure: z.string().optional(),
  socialCharges: z.object({
    micro: z.number().optional(),
    eurl: z.number().optional(),
    sarl: z.number().optional(),
    sasu: z.number().optional(),
  }).optional(),
}).passthrough()

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

// ─── Recommendation Engine ───────────────────

interface QuestionAnswer {
  activityType: string
  associatesCount: string
  initialCapital: string
  revenueForecast: string
  liabilityPreference: string
  socialRegime: string
  vatRegime: string
  growthPlans: string
}

function getRecommendation(answers: QuestionAnswer) {
  const scores: Record<string, number> = {
    'Micro-entreprise': 0,
    'EURL': 0,
    'SARL': 0,
    'SASU': 0,
    'SAS': 0,
  }

  // Activity type
  if (['service', 'artisanat'].includes(answers.activityType)) {
    scores['Micro-entreprise'] += 3
    scores['EURL'] += 1
  }
  if (answers.activityType === 'commerce') {
    scores['SARL'] += 2
    scores['SAS'] += 2
  }
  if (answers.activityType === 'tech' || answers.activityType === 'innovation') {
    scores['SASU'] += 3
    scores['SAS'] += 2
  }

  // Associates count
  if (answers.associatesCount === 'solo') {
    scores['Micro-entreprise'] += 3
    scores['EURL'] += 3
    scores['SASU'] += 3
  } else if (answers.associatesCount === '2-5') {
    scores['SARL'] += 3
    scores['SAS'] += 3
    scores['Micro-entreprise'] -= 10
  } else {
    scores['SAS'] += 3
    scores['SARL'] += 2
    scores['Micro-entreprise'] -= 10
    scores['EURL'] -= 10
    scores['SASU'] -= 10
  }

  // Initial capital
  if (answers.initialCapital === 'none' || answers.initialCapital === 'low') {
    scores['Micro-entreprise'] += 2
  }
  if (answers.initialCapital === 'medium' || answers.initialCapital === 'high') {
    scores['SAS'] += 2
    scores['SARL'] += 2
  }

  // Revenue forecast
  if (answers.revenueForecast === 'low') {
    scores['Micro-entreprise'] += 3
  }
  if (answers.revenueForecast === 'medium') {
    scores['EURL'] += 1
    scores['SARL'] += 1
    scores['SASU'] += 1
  }
  if (answers.revenueForecast === 'high') {
    scores['SAS'] += 3
    scores['SARL'] += 2
    scores['Micro-entreprise'] -= 5
  }

  // Liability preference
  if (answers.liabilityPreference === 'limited') {
    scores['EURL'] += 2
    scores['SARL'] += 2
    scores['SASU'] += 2
    scores['SAS'] += 2
  }
  if (answers.liabilityPreference === 'unlimited') {
    scores['Micro-entreprise'] += 1
  }

  // Social regime
  if (answers.socialRegime === 'salaried') {
    scores['SASU'] += 3
    scores['SAS'] += 2
  }
  if (answers.socialRegime === 'independent') {
    scores['Micro-entreprise'] += 2
    scores['EURL'] += 2
    scores['SARL'] += 1
  }

  // VAT regime
  if (answers.vatRegime === 'exempt') {
    scores['Micro-entreprise'] += 2
  }

  // Growth plans
  if (answers.growthPlans === 'rapid') {
    scores['SAS'] += 3
    scores['SASU'] += 2
    scores['Micro-entreprise'] -= 3
  }
  if (answers.growthPlans === 'steady') {
    scores['SARL'] += 1
    scores['EURL'] += 1
  }

  // Sort by score
  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)

  const recommended = sorted[0]?.[0] || 'Micro-entreprise'

  // Determine fiscal regime
  let fiscalRegime = 'IR'
  if (['SAS', 'SASU'].includes(recommended) && answers.revenueForecast === 'high') {
    fiscalRegime = 'IS'
  }
  if (answers.revenueForecast === 'low' && recommended === 'Micro-entreprise') {
    fiscalRegime = 'Micro-BIC / Micro-BNC'
  }

  // Social charges comparison
  const baseRevenue = parseFloat(answers.revenueForecast === 'high' ? '80000' : answers.revenueForecast === 'medium' ? '45000' : '20000')
  const socialCharges = {
    micro: Math.round(baseRevenue * 0.212),
    eurl: Math.round(baseRevenue * 0.45),
    sarl: Math.round(baseRevenue * 0.45),
    sasu: Math.round(baseRevenue * 0.65),
  }

  return {
    recommended,
    scores: Object.fromEntries(sorted),
    fiscalRegime,
    socialCharges,
  }
}

// ─── GET: Retrieve analysis ─────────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

    const analysis = await db.juridiqueAnalysis.findUnique({
      where: { userId: payload.userId },
    })

    if (!analysis) return success(null, 'Aucune analyse juridique')

    return success(analysis, 'Analyse juridique chargée')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Save answers + get recommendation ─

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

    const body = await request.json()
    const parsed = juridiqueSchema.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const answers = body.answers || {}
    const recommendation = getRecommendation(answers as QuestionAnswer)

    const legalStructure = JSON.stringify({
      recommended: recommendation.recommended,
      scores: recommendation.scores,
      answers,
    })

    const analysis = await db.juridiqueAnalysis.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        recommendedStatus: recommendation.recommended,
        fiscalRegime: recommendation.fiscalRegime,
        legalStructure,
        socialCharges: recommendation.socialCharges,
      },
      update: {
        recommendedStatus: recommendation.recommended,
        fiscalRegime: recommendation.fiscalRegime,
        legalStructure,
        socialCharges: recommendation.socialCharges,
      },
    })

    return success({
      ...analysis,
      recommendation,
    }, 'Recommandation générée')
  } catch (err) {
    return handleApiError(err)
  }
}
