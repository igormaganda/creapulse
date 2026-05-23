// ============================================
// CreaPulse V2 — Pitch Deck API
// GET    /api/pitch-deck  — Retrieve pitch deck data
// PUT    /api/pitch-deck  — Save / update pitch deck data
// POST   /api/pitch-deck  — AI generation (generate-from-bp, ai-suggest-slide)
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import ZAI from 'z-ai-web-dev-sdk'

// ─── Validation Schemas ───────────────────────

const pitchDeckSchema = z.object({
  slides: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string().optional(),
      extraData: z.unknown().optional(),
    })
  ).optional(),
}).passthrough()

const slideKeys = [
  'probleme',
  'solution',
  'marche',
  'businessModel',
  'traction',
  'equipe',
  'financier',
  'ask',
] as const

type SlideKey = (typeof slideKeys)[number]

const slideLabels: Record<SlideKey, string> = {
  probleme: 'Problème',
  solution: 'Solution',
  marche: 'Marché',
  businessModel: 'Business Model',
  traction: 'Traction',
  equipe: 'Équipe',
  financier: 'Financier',
  ask: 'Ask',
}

const aiSuggestSlideSchema = z.object({
  action: z.literal('ai-suggest-slide'),
  slideKey: z.enum(slideKeys),
  existingContent: z.string().optional(),
})

// ─── Auth helper ─────────────────────────────

async function authenticate(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const authHeader = request.headers.get('authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
  if (!token) return null
  try { return await verifyToken(token) } catch { return null }
}

// ─── Helper: Fetch all pitch context data ───

async function fetchPitchContext(userId: string): Promise<string> {
  const parts: string[] = []

  // 1. CreatorJourney (project info + BP sections)
  const journey = await db.creatorJourney.findUnique({
    where: { userId },
    select: {
      projectTitle: true,
      projectDescription: true,
      projectSector: true,
      projectStage: true,
      targetAudience: true,
      valueProposition: true,
      creationMotivation: true,
      estimatedRevenue: true,
      estimatedInvestment: true,
      bpSections: true,
    },
  })
  if (journey) {
    if (journey.projectTitle) parts.push(`### Projet\n${journey.projectTitle}`)
    if (journey.projectDescription) parts.push(`### Description\n${journey.projectDescription}`)
    if (journey.projectSector) parts.push(`### Secteur\n${journey.projectSector}`)
    if (journey.projectStage) parts.push(`### Stade\n${journey.projectStage}`)
    if (journey.targetAudience) parts.push(`### Cible\n${journey.targetAudience}`)
    if (journey.valueProposition) parts.push(`### Proposition de valeur\n${journey.valueProposition}`)
    if (journey.creationMotivation) parts.push(`### Motivation\n${journey.creationMotivation}`)
    if (journey.estimatedRevenue) parts.push(`### Revenus estimés\n${journey.estimatedRevenue}`)
    if (journey.estimatedInvestment) parts.push(`### Investissement\n${journey.estimatedInvestment}`)

    if (journey.bpSections && typeof journey.bpSections === 'object') {
      const sections = journey.bpSections as Record<string, unknown>
      const filledSections = Object.entries(sections).filter(
        ([, v]) => typeof v === 'string' && v.trim().length > 0
      )
      if (filledSections.length > 0) {
        parts.push(`### Business Plan\n${filledSections.map(([k, v]) => `- **${k}**: ${v as string}`).join('\n')}`)
      }
    }
  }

  // 2. BMC
  const bmc = await db.businessModelCanvas.findUnique({
    where: { userId },
    select: {
      partenairesCles: true,
      activitesCles: true,
      ressourcesCles: true,
      propositionValeur: true,
      relationsClients: true,
      canaux: true,
      segmentsClients: true,
      structureCouts: true,
      sourcesRevenus: true,
    },
  })
  if (bmc) {
    const bmcLines: string[] = []
    if (bmc.propositionValeur) bmcLines.push(`Proposition de valeur: ${bmc.propositionValeur}`)
    if (bmc.segmentsClients) bmcLines.push(`Segments clients: ${bmc.segmentsClients}`)
    if (bmc.sourcesRevenus) bmcLines.push(`Sources de revenus: ${bmc.sourcesRevenus}`)
    if (bmc.structureCouts) bmcLines.push(`Structure des coûts: ${bmc.structureCouts}`)
    if (bmc.canaux) bmcLines.push(`Canaux: ${bmc.canaux}`)
    if (bmc.relationsClients) bmcLines.push(`Relations clients: ${bmc.relationsClients}`)
    if (bmc.activitesCles) bmcLines.push(`Activités clés: ${bmc.activitesCles}`)
    if (bmc.ressourcesCles) bmcLines.push(`Ressources clés: ${bmc.ressourcesCles}`)
    if (bmc.partenairesCles) bmcLines.push(`Partenaires clés: ${bmc.partenairesCles}`)
    if (bmcLines.length > 0) parts.push(`### Business Model Canvas\n${bmcLines.join('\n')}`)
  }

  // 3. Financial data (Financier + CreaSim)
  const forecast = await db.financialForecast.findUnique({
    where: { userId },
    select: {
      year1Revenue: true,
      year1Expenses: true,
      year2Revenue: true,
      year2Expenses: true,
      year3Revenue: true,
      year3Expenses: true,
      breakevenMonth: true,
      initialInvestment: true,
      aiSynthesis: true,
    },
  })
  if (forecast) {
    const finLines: string[] = []
    if (forecast.initialInvestment) finLines.push(`Investissement: ${forecast.initialInvestment}€`)
    if (forecast.year1Revenue) finLines.push(`CA A1: ${forecast.year1Revenue}€`)
    if (forecast.year2Revenue) finLines.push(`CA A2: ${forecast.year2Revenue}€`)
    if (forecast.year3Revenue) finLines.push(`CA A3: ${forecast.year3Revenue}€`)
    if (forecast.breakevenMonth) finLines.push(`Point mort: mois ${forecast.breakevenMonth}`)
    if (finLines.length > 0) parts.push(`### Prévisions financières\n${finLines.join('\n')}`)
    if (forecast.aiSynthesis) parts.push(`### Synthèse financière\n${forecast.aiSynthesis}`)
  }

  const creasim = await db.creaSimSimulation.findUnique({
    where: { userId },
    select: {
      monthlyRevenue: true,
      grossMarginRate: true,
      netMarginRate: true,
      breakevenMonths: true,
      profitability1Y: true,
      profitability2Y: true,
      profitability3Y: true,
      aiAnalysis: true,
    },
  })
  if (creasim) {
    const csLines: string[] = []
    if (creasim.monthlyRevenue) csLines.push(`CA mensuel: ${creasim.monthlyRevenue}€`)
    if (creasim.grossMarginRate) csLines.push(`Marge brute: ${creasim.grossMarginRate}%`)
    if (creasim.netMarginRate) csLines.push(`Marge nette: ${creasim.netMarginRate}%`)
    if (creasim.breakevenMonths) csLines.push(`Rentabilité: ${creasim.breakevenMonths} mois`)
    if (csLines.length > 0) parts.push(`### Simulation CreaSim\n${csLines.join('\n')}`)
    if (creasim.aiAnalysis) parts.push(`### Analyse IA — CreaSim\n${creasim.aiAnalysis}`)
  }

  // 4. Market Analysis
  const market = await db.marketAnalysis.findUnique({
    where: { userId },
    select: {
      sector: true,
      marketSize: true,
      targetAudience: true,
      trends: true,
      competitors: true,
      aiSynthesis: true,
    },
  })
  if (market) {
    const mLines: string[] = []
    if (market.sector) mLines.push(`Secteur: ${market.sector}`)
    if (market.marketSize) mLines.push(`Taille du marché: ${market.marketSize}`)
    if (market.aiSynthesis) mLines.push(`Synthèse: ${market.aiSynthesis}`)
    if (mLines.length > 0) parts.push(`### Analyse de marché\n${mLines.join('\n')}`)
  }

  // 5. Juridique Analysis
  const juridique = await db.juridiqueAnalysis.findUnique({
    where: { userId },
    select: {
      recommendedStatus: true,
      legalStructure: true,
      fiscalRegime: true,
    },
  })
  if (juridique) {
    const jLines: string[] = []
    if (juridique.recommendedStatus) jLines.push(`Statut: ${juridique.recommendedStatus}`)
    if (juridique.legalStructure) jLines.push(`Structure: ${juridique.legalStructure}`)
    if (juridique.fiscalRegime) jLines.push(`Fiscalité: ${juridique.fiscalRegime}`)
    if (jLines.length > 0) parts.push(`### Juridique\n${jLines.join('\n')}`)
  }

  return parts.join('\n\n')
}

// ─── GET ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

    // Try to get from ZeroDraft (reused for pitch deck persistence)
    const draft = await db.zeroDraft.findUnique({
      where: { userId: payload.userId },
    })

    if (!draft) return success(null, 'Aucun pitch deck')

    return success(draft, 'Pitch deck chargé')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PUT ────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

    const body = await request.json()
    const parsed = pitchDeckSchema.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const { slides, projectTitle } = body

    // Store slides as content in ZeroDraft (JSON stringify)
    const content = JSON.stringify({ slides })
    const wordCount = content.split(/\s+/).filter(Boolean).length

    const draft = await db.zeroDraft.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        projectTitle: projectTitle || 'Mon Pitch Deck',
        content,
        wordCount,
        status: 'DRAFT',
      },
      update: {
        projectTitle: projectTitle || undefined,
        content,
        wordCount,
      },
    })

    return success(draft, 'Pitch deck sauvegardé')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: AI Generation ─────────────────────

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

    const body = await request.json()
    const { action } = body as { action: string }

    if (action === 'generate-from-bp') {
      // ── Full pitch deck generation from BP context ──
      const context = await fetchPitchContext(payload.userId)

      const systemPrompt = `Tu es un expert en pitch decks pour startups et entrepreneurs. Tu aides des entrepreneurs francophones à créer des pitch decks percutants pour lever des fonds ou convaincre des partenaires.

RÈGLES IMPORTANTES :
- Réponds TOUJOURS en français
- Chaque slide doit être concise et impactante (3-5 phrases maximum)
- Utilise un ton convaincant et professionnel
- Chaque slide doit pouvoir être lue en 30 secondes maximum
- Privilégie les chiffres concrets et les faits marquants
- Adapte le contenu au contexte du projet fourni

Tu dois générer le contenu pour les 8 slides suivantes :
1. probleme — Le problème que le projet résout (douleur client, marché mal desservi)
2. solution — La solution proposée (produit/service, innovation, différenciation)
3. marche — Le marché visé (taille, croissance, tendances, opportunités)
4. businessModel — Le modèle économique (revenus, coûts, marges, BMC)
5. traction — Les réalisations et validations (chiffres clés, clients, partenariats)
6. equipe — L'équipe fondatrice (compétences, expérience, complémentarité)
7. financier — Les projections financières (investissement, CA 3 ans, rentabilité)
8. ask — La demande (montant recherché, utilisation des fonds, objectifs)

Réponds UNIQUEMENT en JSON valide avec les 8 clés exactes ci-dessus. Pas de texte avant ou après le JSON.`

      const userPrompt = `Génère le contenu pour les 8 slides du pitch deck de ce projet entrepreneurial.

${context ? `CONTEXTE COMPLET DU PROJET :\n${context}` : 'Aucun contexte détaillé fourni. Génére un pitch deck générique adaptable.'}

Réponds en JSON avec exactement ces 8 clés :
{
  "probleme": "...",
  "solution": "...",
  "marche": "...",
  "businessModel": "...",
  "traction": "...",
  "equipe": "...",
  "financier": "...",
  "ask": "..."
}`

      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      })

      const raw = completion.choices?.[0]?.message?.content || ''
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = raw.trim()
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      }

      let generatedSlides: Partial<Record<SlideKey, string>>
      try {
        generatedSlides = JSON.parse(jsonStr)
      } catch {
        return Errors.internal('Erreur de parsing de la réponse IA. Veuillez réessayer.')
      }

      // Build slides array for persistence
      const slides = slideKeys.map(key => ({
        id: key,
        title: slideLabels[key],
        content: generatedSlides[key] || '',
      }))

      // Save to ZeroDraft
      const content = JSON.stringify({ slides })
      const wordCount = content.split(/\s+/).filter(Boolean).length

      const draft = await db.zeroDraft.upsert({
        where: { userId: payload.userId },
        create: {
          userId: payload.userId,
          projectTitle: 'Mon Pitch Deck',
          content,
          wordCount,
          status: 'READY',
        },
        update: {
          content,
          wordCount,
          status: 'READY',
        },
      })

      return success(
        {
          slides: generatedSlides,
          draft,
        },
        'Pitch deck généré par IA',
      )

    } else if (action === 'ai-suggest-slide') {
      // ── Single slide suggestion ──
      const parsed = aiSuggestSlideSchema.safeParse(body)
      if (!parsed.success) {
        return Errors.validation(
          parsed.error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message,
          }))
        )
      }

      const { slideKey, existingContent } = parsed.data
      const label = slideLabels[slideKey]

      // Fetch context
      const context = await fetchPitchContext(payload.userId)

      // Fetch existing pitch deck for context on other slides
      const existingDraft = await db.zeroDraft.findUnique({
        where: { userId: payload.userId },
      })

      let existingSlidesText = ''
      if (existingDraft?.content) {
        try {
          const parsedContent = JSON.parse(existingDraft.content) as { slides?: Array<{ id: string; content?: string }> }
          if (parsedContent.slides) {
            const otherSlides = parsedContent.slides
              .filter(s => s.id !== slideKey && s.content)
              .map(s => `- **${slideLabels[s.id as SlideKey] || s.id}**: ${s.content}`)
              .join('\n')
            if (otherSlides) {
              existingSlidesText = `\n\nAUTRES SLIDES EXISTANTES (pour cohérence) :\n${otherSlides}`
            }
          }
        } catch {
          // Ignore parse errors
        }
      }

      const systemPrompt = `Tu es un expert en pitch decks pour startups et entrepreneurs. Tu aides des entrepreneurs francophones à créer des slides de pitch deck percutantes.

RÈGLES IMPORTANTES :
- Réponds TOUJOURS en français
- La slide doit être concise et impactante (3-5 phrases maximum)
- Utilise un ton convaincant et professionnel
- Privilégie les chiffres concrets et les faits marquants
- Assure la cohérence avec les autres slides du pitch deck
- Si du contenu existe déjà, améliore-le sans tout remplacer`

      let userPrompt = `Génère le contenu pour la slide "${label}" du pitch deck.`

      if (existingContent && existingContent.trim()) {
        userPrompt += `\n\nContenu actuel :\n"${existingContent}"\n\nAméliore et complète ce contenu. Garde les informations importantes.`
      } else {
        userPrompt += `\n\nRédige un contenu complet et percutant pour cette slide.`
      }

      if (context) {
        userPrompt += `\n\nCONTEXTE DU PROJET :\n${context}`
      }

      userPrompt += existingSlidesText

      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      })

      const suggestion = completion.choices?.[0]?.message?.content || 'Désolé, une erreur est survenue lors de la génération. Veuillez réessayer.'

      return success(
        {
          slideKey,
          slideLabel: label,
          suggestion,
        },
        'Suggestion IA générée avec succès',
      )

    } else {
      return Errors.validation(
        { field: 'action', message: `Action invalide: ${action}. Utilisez 'generate-from-bp' ou 'ai-suggest-slide'.` }
      )
    }
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
