// ============================================
// CreaPulse V4 — AI Quality Assessment
// POST /api/business-plan/quality — Assess BP section quality via LLM
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { aiRateLimit } from '@/lib/rate-limit'
import { callZAI, parseJSONFromAI, getZAIErrorMessage, aiUnavailableResponse } from '@/lib/zai-helper'
import { z } from 'zod'

// ─── Validation ───

const qualitySchema = z.object({
  sectionId: z.string().min(1),
  content: z.string().min(10),
  sectionType: z.string().optional().default('general'),
})

// ─── Quality assessment types ───

interface QualityScores {
  pertinence: number  // 1-10
  profondeur: number  // 1-10
  coherence: number   // 1-10
}

interface QualityAssessment {
  scores: QualityScores
  scoreGlobal: number  // weighted average
  recommandations: string[]
}

// ─── System prompt ───

const QUALITY_SYSTEM_PROMPT = `Tu es un expert en rédaction de business plans. Évalue la qualité de cette section sur 3 critères : pertinence (1-10), profondeur (1-10), cohérence (1-10). Retourne un JSON avec { scores: { pertinence, profondeur, coherence }, scoreGlobal: number, recommandations: string[] }

RÈGLES :
- Réponds TOUJOURS en français
- pertinence : la section traite-t-elle le sujet attendu de manière pertinente pour un business plan ?
- profondeur : le contenu est-il suffisamment détaillé avec des exemples concrets, des chiffres, une analyse argumentée ?
- cohérence : le contenu est-il logiquement structuré, sans contradiction, avec une progression claire ?
- scoreGlobal : moyenne pondérée (pertinence × 0.4 + profondeur × 0.35 + cohérence × 0.25), arrondie à 1 décimale
- recommandations : 2-4 suggestions concrètes et actionables pour améliorer la section (en français)
- Si le contenu est très court (< 50 mots), les scores doivent être bas (≤ 3) et les recommandations doivent suggérer de développer le contenu
- Retourne UNIQUEMENT le JSON, pas de markdown, pas de commentaires`

// ─── POST: Assess quality ──────────────────

export async function POST(request: NextRequest) {
  const auth = await withAuth(request)
  if (!('userId' in auth)) return auth

  try {
    // Rate limit
    const rl = aiRateLimit.check(auth.userId)
    if (!rl.allowed) {
      return Errors.tooManyRequests(`Trop de requêtes IA. Réessayez dans ${Math.ceil((rl.resetAt - Date.now()) / 1000)}s.`)
    }

    const body = await request.json()
    const parsed = qualitySchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
      )
    }

    const { sectionId, content, sectionType } = parsed.data

    const userPrompt = `Évalue la qualité de la section "${sectionId}" (type: ${sectionType}) d'un business plan.

Contenu de la section :
---
${content}
---

Retourne le JSON d'évaluation.`

    const result = await callZAI(
      [
        { role: 'system', content: QUALITY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, max_tokens: 800 },
    )

    if (!result.success) {
      return aiUnavailableResponse(getZAIErrorMessage(result))
    }

    const assessment = parseJSONFromAI<QualityAssessment>(result.content)

    if (!assessment || !assessment.scores || typeof assessment.scoreGlobal !== 'number') {
      return Errors.unprocessableEntity("La réponse IA n'a pas pu être interprétée comme une évaluation de qualité. Veuillez réessayer.")
    }

    // Validate score ranges
    const { pertinence, profondeur, coherence } = assessment.scores
    if (
      typeof pertinence !== 'number' || typeof profondeur !== 'number' || typeof coherence !== 'number' ||
      pertinence < 1 || pertinence > 10 || profondeur < 1 || profondeur > 10 || coherence < 1 || coherence > 10
    ) {
      return Errors.unprocessableEntity('Les scores doivent être entre 1 et 10.')
    }

    // Ensure recommandations is an array
    if (!Array.isArray(assessment.recommandations)) {
      assessment.recommandations = []
    }

    return success(
      {
        sectionId,
        assessment: {
          scores: assessment.scores,
          scoreGlobal: Math.round(assessment.scoreGlobal * 10) / 10,
          recommandations: assessment.recommandations,
        },
      },
      `Évaluation de qualité : ${assessment.scoreGlobal}/10`,
    )
  } catch (err) {
    return handleApiError(err)
  }
}