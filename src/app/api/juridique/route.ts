// ============================================
// CreaPulse V2 — Analyse Juridique API
// GET  /api/juridique  — Retrieve juridical analysis
// POST /api/juridique  — Save answers + get recommendation / AI suggest / AI autofill
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import { callZAI, parseJSONFromAI, getZAIErrorMessage, aiUnavailableResponse } from '@/lib/zai-helper'

// ─── Validation Schemas ──────────────────────

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

const aiSuggestSchema = z.object({
  action: z.literal('ai-suggest'),
  questionId: z.string().min(1),
  questionTitle: z.string().min(1),
  answers: z.record(z.string(), z.string()).optional(),
})

const aiAutofillSchema = z.object({
  action: z.literal('ai-autofill'),
})

// ─── Auth helper ─────────────────────────────

async function getAuth(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const headerToken = getTokenFromHeader(request)
  const token = cookieToken || headerToken
  if (!token) throw Object.assign(new Error('No session token found'), { code: 'UNAUTHORIZED' })
  return verifyToken(token)
}

// ─── Fetch project context from CreatorJourney ─

async function getProjectContext(userId: string): Promise<string> {
  const journey = await db.creatorJourney.findUnique({
    where: { userId },
    select: {
      projectTitle: true,
      projectSector: true,
      projectStage: true,
      targetAudience: true,
      valueProposition: true,
      projectDescription: true,
      activityType: true,
    },
  })
  if (!journey) return ''
  const parts: string[] = []
  if (journey.projectTitle) parts.push(`Titre du projet: ${journey.projectTitle}`)
  if (journey.projectSector) parts.push(`Secteur: ${journey.projectSector}`)
  if (journey.projectStage) parts.push(`Stade du projet: ${journey.projectStage}`)
  if (journey.targetAudience) parts.push(`Cible visée: ${journey.targetAudience}`)
  if (journey.valueProposition) parts.push(`Proposition de valeur: ${journey.valueProposition}`)
  if (journey.projectDescription) parts.push(`Description: ${journey.projectDescription}`)
  if (journey.activityType) parts.push(`Type d'activité: ${journey.activityType}`)
  return parts.join('\n')
}

// ─── Question help for AI suggestions ────────

const QUESTION_HELP: Record<string, string> = {
  activityType: "type d'activité (service, commerce, artisanat, tech, restauration)",
  associatesCount: "nombre d'associés (solo, 2-5, 6+)",
  initialCapital: "capital initial disponible (aucun, <1000€, 1000-10000€, >10000€)",
  revenueForecast: "chiffre d'affaires prévisionnel année 1 (<30k€, 30-70k€, >70k€)",
  liabilityPreference: "préférence de responsabilité (limitée ou illimitée)",
  socialRegime: "régime social préféré (assimilé salarié, TNS, pas de préférence)",
  vatRegime: "régime de TVA (franchise, simplifié, réel normal)",
  growthPlans: "plans de croissance (stable ou rapide avec levée de fonds)",
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
    const payload = await getAuth(request)

    const analysis = await db.juridiqueAnalysis.findUnique({
      where: { userId: payload.userId },
    })

    if (!analysis) return success(null, 'Aucune analyse juridique')

    return success(analysis, 'Analyse juridique chargée')
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

// ─── POST: Actions ──────────────────────────

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request)

    const body = await request.json()
    const { action } = body

    // ── AI Suggest for a specific question ──
    if (action === 'ai-suggest') {
      const parsed = aiSuggestSchema.safeParse(body)
      if (!parsed.success) {
        return Errors.validation(
          parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        )
      }

      const { questionId, questionTitle, answers: currentAnswers } = parsed.data
      const context = await getProjectContext(payload.userId)

      const systemPrompt = `Tu es un expert en droit des affaires et en création d'entreprise en France. Tu aides les entrepreneurs à choisir le bon statut juridique.

RÈGLES :
- Réponds TOUJOURS en français
- Sois concis (2-4 phrases max)
- Donne une recommandation claire avec une justification
- Adapte tes conseils au contexte du projet

${context ? `CONTEXTE DU PROJET :\n${context}` : 'Aucun contexte de projet fourni.'}

${currentAnswers ? `RÉPONSES DÉJÀ DONNÉES :\n${Object.entries(currentAnswers).map(([k, v]) => `- ${k}: ${v}`).join('\n')}` : ''}`

      const questionHelp = QUESTION_HELP[questionId] || questionTitle
      const userPrompt = `L'utilisateur hésite sur la question : "${questionTitle}" (${questionHelp}). 
Quelle réponse lui recommandes-tu pour son projet ? Donne ta recommandation sous la forme d'une réponse courte et claire, puis une brève justification.`

      const zaiResult = await callZAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], { temperature: 0.7, max_tokens: 400 })

      if (!zaiResult.success) {
        return aiUnavailableResponse(getZAIErrorMessage(zaiResult))
      }

      const suggestion = zaiResult.content || 'Désolé, une erreur est survenue.'

      return success({ questionId, suggestion }, 'Suggestion IA générée')
    }

    // ── AI Autofill all questions ──
    if (action === 'ai-autofill') {
      const context = await getProjectContext(payload.userId)

      const systemPrompt = `Tu es un expert en droit des affaires et en création d'entreprise en France. Tu dois recommander les meilleures réponses pour un questionnaire juridique.

RÈGLES :
- Réponds TOUJOURS en français
- Utilise les valeurs exactes des options disponibles
- Adapte tes recommandations au contexte du projet

${context ? `CONTEXTE DU PROJET :\n${context}` : 'Aucun contexte de projet. Génére des réponses génériques.'}`

      const userPrompt = `Recommande les meilleures réponses pour chaque question d'un questionnaire de création d'entreprise. Renvoie un objet JSON avec les clés suivantes et les valeurs parmi les options disponibles :
- "activityType" : "service" | "commerce" | "artisanat" | "tech" | "restauration"
- "associatesCount" : "solo" | "2-5" | "6+"
- "initialCapital" : "none" | "low" | "medium" | "high"
- "revenueForecast" : "low" | "medium" | "high"
- "liabilityPreference" : "limited" | "unlimited"
- "socialRegime" : "salaried" | "independent" | "no-preference"
- "vatRegime" : "exempt" | "simplified" | "real"
- "growthPlans" : "steady" | "rapid"

Renvoie UNIQUEMENT le JSON, sans backticks ni texte autour.`

      const autofillResult = await callZAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], { temperature: 0.7, max_tokens: 600 })

      if (!autofillResult.success) {
        return aiUnavailableResponse(getZAIErrorMessage(autofillResult))
      }

      const raw = autofillResult.content || ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return success({ suggestion: raw }, 'Suggestion IA générée (format brut)')
      }

      try {
        const result = JSON.parse(jsonMatch[0])
        return success({ suggestion: result }, 'Remplissage automatique IA terminé')
      } catch {
        return success({ suggestion: raw }, 'Suggestion IA générée (format brut)')
      }
    }

    // ── Legacy: Save answers + get recommendation ──
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
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée — veuillez vous reconnecter')
      }
    }
    return handleApiError(err)
  }
}
