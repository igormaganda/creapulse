// ============================================
// CréaScope — AI Suggestion API
// POST   /api/creascope/ai-suggest  — Get AI suggestions for current step
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'
import { callZAI, getZAIErrorMessage } from '@/lib/zai-helper'
import { buildFTContext, contextToPrompt } from '@/lib/ft-enrichment'

// ─── Validation ─────────────────────────

const SuggestBody = z.object({
  sessionId: z.string().min(1),
  step: z.string().min(1),
  beneficiaryContext: z
    .object({
      name: z.string().optional(),
      project: z.string().optional(),
      riasec: z.string().optional(),
      kiviatScores: z.record(z.number()).optional(),
    })
    .optional(),
})

// ─── Step-specific prompt builder ───────

const STEP_PROMPTS: Record<string, string> = {
  ACCUEIL: `Tu prépares l'accueil d'un bénéficiaire pour une session CréaScope de 3-4 heures.
Contexte: Le conseiller va démarrer une session diagnostique complète.

Génère un JSON avec:
{
  "focus": ["Point d'attention 1", "Point 2", "Point 3"],
  "questions": ["Question à poser 1", "Question 2", "Question 3"],
  "observations": "Ce qu'il faut observer pendant cette phase",
  "approach": "Approche recommandée pour cette étape"
}`,

  FLASH_SWIPE: `Le bénéficiaire va démarrer le Flash Swipe — 60 cartes compétences à swipper.
Cette étape prend 5-8 minutes et identifie les soft skills via swipe rapide.

Génère un JSON avec:
{
  "focus": ["Ce qu'il faut observer pendant le swipe"],
  "questions": ["Questions à poser après le swipe"],
  "observations": "Signes à repérer (hésitation, rapidité, patterns)",
  "approach": "Comment encadrer cette activité"
}`,

  ANALYSE_INTERMEDIAIRE: `Le conseiller présente les premiers résultats du Flash Swipe au bénéficiaire.
C'est un moment clé de feedback et de co-analyse.

Génère un JSON avec:
{
  "focus": ["Axes d'analyse prioritaires"],
  "questions": ["Questions pour approfondir la compréhension"],
  "observations": "Points clés à aborder avec le bénéficiaire",
  "approach": "Méthode de présentation des résultats"
}`,

  QUESTIONNAIRE: `Le bénéficiaire va passer le Questionnaire Approfondi — 15 questions adaptatives.
Cette étape dure 10-15 minutes et affine le profil entrepreneurial.

Génère un JSON avec:
{
  "focus": ["Dimensions à surveiller particulièrement"],
  "questions": ["Vérifications à faire avant/après le questionnaire"],
  "observations": "Indicateurs de qualité des réponses",
  "approach": "Conseils d'accompagnement pendant le questionnaire"
}`,

  CHALLENGE_SCENARIO: `Le bénéficiaire va affronter 10 scénarios entrepreneuriaux réalistes.
Cette étape teste la prise de décision en situation.

Génère un JSON avec:
{
  "focus": ["Compétences testées par les scénarios"],
  "questions": ["Questions de débrief après chaque scénario"],
  "observations": "Comportements et réactions à observer"],
  "approach": "Comment gérer les scénarios difficiles"
}`,

  BILAN_IA: `Le conseiller présente le bilan complet généré par l'IA au bénéficiaire.
C'est l'étape de synthèse et de co- construction du profil.

Génère un JSON avec:
{
  "focus": ["Éléments clés du bilan à mettre en avant"],
  "questions": ["Questions pour valider le bilan avec le bénéficiaire"],
  "observations": "Réactions attendues et comment les gérer",
  "approach": "Méthode de co-construction du plan d'action"
}`,

  PLAN_ACTION: `Le conseiller et le bénéficiaire co-construisent le plan d'action personnalisé.
C'est l'étape finale de la session CréaScope.

Génère un JSON avec:
{
  "focus": ["Priorités pour le plan d'action"],
  "questions": ["Questions pour finaliser le plan"],
  "observations": "Points à documenter dans le plan"],
  "approach": "Méthode de co-construction du plan"
}`,
}

// ─── POST: AI suggestion ────────────────

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)
    if (payload.role !== 'COUNSELOR' && payload.role !== 'ADMIN') {
      return Errors.forbidden('Accès réservé aux conseillers')
    }

    const body = await request.json()
    const { sessionId, step, beneficiaryContext } = SuggestBody.parse(body)

    // Verify session exists and user has access
    const counselor = await db.counselor.findUnique({ where: { userId: payload.userId } })
    if (!counselor) return Errors.forbidden('Profil conseiller non trouvé')

    const session = await db.creascopeSession.findUnique({
      where: { id: sessionId },
      include: {
        beneficiary: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    if (!session) return Errors.notFound('Session CréaScope')
    if (session.counselorId !== counselor.id && payload.role !== 'ADMIN') {
      return Errors.forbidden('Accès non autorisé à cette session')
    }

    // Build beneficiary context string
    const beneficiaryName = beneficiaryContext?.name || session.beneficiary.user.firstName || 'Bénéficiaire'
    const projectInfo = beneficiaryContext?.project || ''
    const riasecInfo = beneficiaryContext?.riasec || ''
    const kiviatInfo = beneficiaryContext?.kiviatScores

    let kiviatStr = ''
    if (kiviatInfo) {
      kiviatStr = `Scores Kiviat: ${JSON.stringify(kiviatInfo)}`
    }

    const stepPrompt = STEP_PROMPTS[step] || STEP_PROMPTS.ACCUEIL

    // ─── FT enrichment for BILAN_IA and PLAN_ACTION ───
    let ftContextStr = ''
    if (step === 'BILAN_IA' || step === 'PLAN_ACTION') {
      try {
        const journey = await db.creatorJourney.findUnique({
          where: { userId: session.beneficiary.userId },
          select: { projectSector: true },
        })
        const sector = journey?.projectSector || beneficiaryContext?.project || ''
        if (sector) {
          const ftCtx = await buildFTContext({ secteur: sector, region: '11' /* IDF default */ })
          ftContextStr = contextToPrompt(ftCtx)
        }
      } catch (ftErr) {
        console.warn('[FT Enrichment] France Travail enrichment failed, continuing without:',
          ftErr instanceof Error ? ftErr.message : ftErr)
      }
    }

    const userPromptParts = [
      `Étape: ${step}`,
      `Bénéficiaire: ${beneficiaryName}`,
      projectInfo ? `Projet: ${projectInfo}` : '',
      riasecInfo ? `Profil RIASEC: ${riasecInfo}` : '',
      kiviatStr,
      '',
      stepPrompt,
      ftContextStr
        ? `\n${ftContextStr}`
        : '\nNote : Données France Travail non disponibles actuellement. Les suggestions sont basées uniquement sur le contexte fourni.',
    ].filter(Boolean).join('\n')

    const result = await callZAI(
      [
        {
          role: 'system',
          content: `Tu es un conseiller entrepreneurial expert du GIDEF, spécialisé dans l'accompagnement des créateurs d'entreprise.
Tu assistes un conseiller en lui fournissant des suggestions contextualisées pour chaque étape du pipeline CréaScope.
Tes suggestions doivent être pratiques, concrètes et immédiatement actionnables.
Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`,
        },
        {
          role: 'user',
          content: userPromptParts,
        },
      ],
      { temperature: 0.6, max_tokens: 600 },
    )

    if (!result.success) {
      return Errors.internal(getZAIErrorMessage(result))
    }

    // Parse JSON from response
    try {
      const jsonStr = result.content
      const match = jsonStr.match(/\{[\s\S]*\}/)
      const suggestions = match ? JSON.parse(match[0]) : null

      return success({
        step,
        sessionId,
        suggestions,
        generatedAt: new Date().toISOString(),
      })
    } catch {
      return success({
        step,
        sessionId,
        suggestions: {
          focus: ['Analyse en cours'],
          questions: ['Questions en cours de génération'],
          observations: result.content.slice(0, 200),
          approach: 'Approche standard',
        },
        generatedAt: new Date().toISOString(),
      })
    }
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
