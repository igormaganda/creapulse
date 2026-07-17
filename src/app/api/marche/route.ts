// ============================================
// CreaPulse V2 — Analyse de Marché API
// GET  /api/marche  — Retrieve market analysis
// PUT  /api/marche  — Save / update market analysis
// POST /api/marche  — AI actions (ai-suggest-section, ai-autofill, synthesis)
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error, ErrorCode, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { callZAI as sharedCallZAI, getZAIErrorMessage, aiUnavailableResponse } from '@/lib/zai-helper'
import { getEnrollmentIdFromRequest, buildCompositeKey } from '@/lib/enrollment-context'

// ─── Validation Schemas ──────────────────────

const marcheSchema = z.object({
  sector: z.string().optional(),
  category: z.string().optional(),
  marketSize: z.number().min(0).optional(),
  growthRate: z.number().min(-100).max(200).optional(),
  targetAudience: z.string().optional(),
  targetAgeRange: z.string().optional(),
  targetLocation: z.string().optional(),
  targetRevenue: z.string().optional(),
  trends: z.array(
    z.object({
      id: z.string(),
      title: z.string().min(1),
      description: z.string(),
      impact: z.enum(['positive', 'negative', 'neutral']),
    })
  ).optional(),
  competitors: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      strengths: z.string(),
      weaknesses: z.string(),
      marketShare: z.number().min(0).max(100),
    })
  ).max(10).optional(),
  swot: z.object({
    strengths: z.string().optional(),
    weaknesses: z.string().optional(),
    opportunities: z.string().optional(),
    threats: z.string().optional(),
  }).optional(),
  aiSynthesis: z.string().optional(),
}).passthrough()

const aiSuggestSectionSchema = z.object({
  action: z.literal('ai-suggest-section'),
  section: z.string().min(1),
  existingContent: z.string().optional(),
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

async function getProjectContext(userId: string, enrollmentId: string | null): Promise<string> {
  const journey = await db.creatorJourney.findUnique({
    where: { userId: userId },
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

// ─── Section prompts ─────────────────────────

const SECTION_PROMPTS: Record<string, string> = {
  sector: `Génère une description de secteur d'activité pour le projet. Donne le nom du secteur et une brève description (2-3 phrases). Format attendu : une seule chaîne de texte avec le nom du secteur.`,
  category: `Détermine la catégorie la plus adaptée parmi : Commerce, Services, Tech, Artisanat, Restauration, Autre. Réponds uniquement par le nom de la catégorie.`,
  marketSize: `Estime la taille du marché en euros pour ce secteur d'activité en France. Donne un chiffre réaliste. Réponds uniquement par un nombre entier (pas de texte, pas d'espaces).`,
  targetAudience: `Décris le client idéal pour ce projet en 4-6 phrases. Inclus : profil type, besoins principaux, habitudes de consommation, motivations d'achat.`,
  targetAgeRange: `Indique la tranche d'âge principale de la clientèle cible pour ce projet. Format attendu : "X-Y ans". Réponds de manière concise.`,
  targetLocation: `Indique la zone géographique principale de la clientèle cible. Format attendu : une région ou zone (ex: "Île-de-France", "France entière", "Grand Sud-Ouest").`,
  targetRevenue: `Estime le revenu annuel moyen de la clientèle cible. Format attendu : une fourchette en euros (ex: "30 000 - 50 000 €/an").`,
  trends: `Génère 3 tendances de marché pertinentes pour ce secteur. Format attendu : JSON array avec des objets contenant "title" (string), "description" (string, 1-2 phrases), "impact" ("positive", "negative" ou "neutral"). Renvoie UNIQUEMENT le JSON, sans backticks ni texte autour.`,
  competitors: `Identifie 3 concurrents principaux pour ce secteur en France. Format attendu : JSON array avec des objets contenant "name" (string), "strengths" (string, 2-3 forces), "weaknesses" (string, 2-3 faiblesses), "marketShare" (number entre 1 et 30). Renvoie UNIQUEMENT le JSON, sans backticks ni texte autour.`,
  strengths: `Liste 4-5 forces (Strengths) pour ce projet dans le cadre d'une analyse SWOT. Sois spécifique au secteur et au projet. Format : une liste à puces avec tirets.`,
  weaknesses: `Liste 4-5 faiblesses (Weaknesses) pour ce projet dans le cadre d'une analyse SWOT. Sois réaliste et spécifique. Format : une liste à puces avec tirets.`,
  opportunities: `Liste 4-5 opportunités (Opportunities) pour ce projet dans le cadre d'une analyse SWOT. Format : une liste à puces avec tirets.`,
  threats: `Liste 4-5 menaces (Threats) pour ce projet dans le cadre d'une analyse SWOT. Format : une liste à puces avec tirets.`,
}

// ─── ZAI helper with fallback (delegates to shared helper) ────────

async function callZAI(messages: Array<{ role: string; content: string }>, options?: { temperature?: number; max_tokens?: number }): Promise<string | null> {
  const result = await sharedCallZAI(messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, options)
  if (!result.success) {
    console.error('[Marché IA] ZAI call failed:', result.reason)
    return null
  }
  return result.content || ''
}

// ─── GET: Retrieve market analysis ──────────

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request)
    const enrollmentId = getEnrollmentIdFromRequest(request)
    const analysis = await db.marketAnalysis.findUnique({
      where: { userId: payload.userId },
    })

    if (!analysis) return success(null, 'Aucune analyse de marché sauvegardée')

    return success(analysis, 'Analyse de marché chargée')
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

// ─── PUT: Save / Update ─────────────────────

export async function PUT(request: NextRequest) {
  try {
    const payload = await getAuth(request)
    const enrollmentId = getEnrollmentIdFromRequest(request)

    const body = await request.json()
    const parsed = marcheSchema.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const data = parsed.data

    const analysis = await db.marketAnalysis.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        sector: data.sector ?? null,
        marketSize: data.marketSize != null ? String(data.marketSize) : null,
        targetAudience: data.targetAudience ?? null,
        trends: data.trends ?? [],
        competitors: data.competitors ?? [],
        opportunities: data.swot?.opportunities ?? null,
        threats: data.swot?.threats ?? null,
        aiSynthesis: data.aiSynthesis ?? null,
      },
      update: {
        sector: data.sector ?? undefined,
        marketSize: data.marketSize != null ? String(data.marketSize) : undefined,
        targetAudience: data.targetAudience ?? undefined,
        trends: data.trends ?? undefined,
        competitors: data.competitors ?? undefined,
        opportunities: data.swot?.opportunities ?? undefined,
        threats: data.swot?.threats ?? undefined,
        aiSynthesis: data.aiSynthesis ?? undefined,
      },
    })

    return success(analysis, 'Analyse de marché sauvegardée')
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

// ─── POST: AI Actions ──────────────────────

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request)
    const enrollmentId = getEnrollmentIdFromRequest(request)
    const body = await request.json()

    const { action } = body

    // ── AI Suggest Section ──
    if (action === 'ai-suggest-section') {
      const parsed = aiSuggestSectionSchema.safeParse(body)
      if (!parsed.success) {
        return Errors.validation(
          parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        )
      }

      const { section, existingContent } = parsed.data
      const context = await getProjectContext(payload.userId, enrollmentId)
      const sectionPrompt = SECTION_PROMPTS[section] || `Génère un contenu pour la section "${section}" d'une analyse de marché.`

      const systemPrompt = `Tu es un expert en analyse de marché et en création d'entreprise. Tu aides des entrepreneurs francophones à analyser leur marché.

RÈGLES :
- Réponds TOUJOURS en français
- Sois concis mais professionnel
- Utilise des données réalistes pour le marché français
- Adapte tes réponses au contexte du projet fourni

${context ? `CONTEXTE DU PROJET :\n${context}` : 'Aucun contexte de projet fourni. Génére un contenu générique.'}`

      let userPrompt = sectionPrompt
      if (existingContent && existingContent.trim()) {
        userPrompt += `\n\nContenu actuel de l'utilisateur :\n"${existingContent}"\n\nAméliore et complète ce contenu si nécessaire.`
      }

      const raw = await callZAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], { temperature: 0.7, max_tokens: 800 })

      if (!raw) {
        return error(ErrorCode.SERVICE_UNAVAILABLE, 'Service IA temporairement indisponible. Veuillez réessayer.', 503)
      }

      let suggestion = raw

      // Clean JSON responses
      if ((section === 'trends' || section === 'competitors') && suggestion) {
        const jsonMatch = suggestion.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          try {
            suggestion = JSON.parse(jsonMatch[0])
          } catch {
            // keep raw text
          }
        }
      }

      return success({ section, suggestion }, 'Suggestion IA chargée')
    }

    // ── AI Autofill ──
    if (action === 'ai-autofill') {
      const context = await getProjectContext(payload.userId, enrollmentId)

      const systemPrompt = `Tu es un expert en analyse de marché. Tu dois remplir TOUS les champs d'une analyse de marché complète pour un projet entrepreneurial français.

RÈGLES :
- Réponds TOUJOURS en français
- Sois professionnel et utilise des données réalistes pour le marché français
- Adapte tout au contexte du projet fourni
- Réponds en JSON strictement formaté comme indiqué

${context ? `CONTEXTE DU PROJET :\n${context}` : 'Aucun contexte de projet. Génére un exemple générique.'}`

      const userPrompt = `Génère une analyse de marché complète pour ce projet. Renvoie un objet JSON avec les clés suivantes :
- "sector" : string (nom du secteur)
- "category" : string parmi ["Commerce", "Services", "Tech", "Artisanat", "Restauration", "Autre"]
- "marketSize" : number (taille du marché en euros)
- "growthRate" : number (taux de croissance entre -20 et 50)
- "targetAudience" : string (description du client idéal, 3-5 phrases)
- "targetAgeRange" : string (ex: "25-45 ans")
- "targetLocation" : string (zone géographique)
- "targetRevenue" : string (revenu moyen de la cible)
- "trends" : array d'objets [{id, title, description, impact: "positive"|"negative"|"neutral"}] (3 éléments)
- "competitors" : array d'objets [{id, name, strengths, weaknesses, marketShare}] (3 éléments)
- "strengths" : string (liste à puces des forces)
- "weaknesses" : string (liste à puces des faiblesses)
- "opportunities" : string (liste à puces des opportunités)
- "threats" : string (liste à puces des menaces)

Renvoie UNIQUEMENT le JSON, sans backticks ni texte autour.`

      const raw = await callZAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], { temperature: 0.7, max_tokens: 2000 })

      if (!raw) {
        return error(ErrorCode.SERVICE_UNAVAILABLE, 'Service IA temporairement indisponible. Veuillez réessayer.', 503)
      }

      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return success({ suggestion: raw }, 'Suggestion IA générée (format brut)')
      }

      let result: Record<string, unknown>
      try {
        result = JSON.parse(jsonMatch[0])
      } catch {
        return error(ErrorCode.INTERNAL_ERROR, "Erreur lors de l'analyse de la réponse IA. Veuillez réessayer.", 500)
      }

      // Add IDs to trends and competitors if missing
      if (Array.isArray(result.trends)) {
        result.trends = result.trends.map((t: Record<string, string>, i: number) => ({
          id: t.id || `trend-${i}`,
          ...t,
        }))
      }
      if (Array.isArray(result.competitors)) {
        result.competitors = result.competitors.map((c: Record<string, string | number>, i: number) => ({
          id: c.id || `comp-${i}`,
          ...c,
        }))
      }

      return success({ suggestion: result }, 'Remplissage automatique IA terminé')
    }

    // ── Legacy AI Synthesis (backward compatible) ──
    const { sector, marketSize, targetAudience, trends, competitors, swot } = body

    const synthesis = `## Synthèse IA — Analyse de Marché

**Secteur** : ${sector || 'Non défini'}
**Taille du marché** : ${marketSize ? `${marketSize} €` : 'Non défini'}
**Client cible** : ${targetAudience || 'Non défini'}

### Tendances identifiées
${Array.isArray(trends) && trends.length > 0
      ? trends.map((t: { title: string; impact: string }) => `- **${t.title}** (impact ${t.impact})`).join('\n')
      : 'Aucune tendance définie.'}

### Positionnement concurrentiel
${Array.isArray(competitors) && competitors.length > 0
      ? `${competitors.length} concurrent(s) analysé(s). Analysez les forces et faiblesses pour identifier votre avantage compétitif.`
      : 'Aucun concurrent défini. Ajoutez des concurrents pour une analyse complète.'}

### Recommandations stratégiques
1. **Différenciation** : Identifiez un positionnement unique sur votre marché cible
2. **Veille** : Suivez les tendances du secteur pour anticiper les évolutions
3. **Client cible** : Affinez votre segmentation pour mieux répondre aux besoins
4. **Croissance** : Exploitez les opportunités de marché identifiées dans le SWOT
5. **Risques** : Anticipez les menaces et préparez des plans de contingence

*Synthèse générée automatiquement — à compléter avec votre conseiller GIDEF.*`

    // Save synthesis
    await db.marketAnalysis.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        aiSynthesis: synthesis,
      },
      update: {
        aiSynthesis: synthesis,
      },
    })

    return success({ synthesis }, 'Synthèse IA générée')
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
