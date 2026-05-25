// ============================================
// CreaPulse V2 — Business Model Canvas (BMC) API
// GET    /api/bmc  — Retrieve BMC for user
// PUT    /api/bmc  — Save / update BMC blocks
// POST   /api/bmc  — AI generation (generate-from-bp, ai-suggest-block)
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import ZAI from 'z-ai-web-dev-sdk'

// ─── Validation Schemas ──────────────────────

const bmcBlocks = [
  'partenairesCles',
  'activitesCles',
  'ressourcesCles',
  'propositionValeur',
  'relationsClients',
  'canaux',
  'segmentsClients',
  'structureCouts',
  'sourcesRevenus',
] as const

type BmcBlockKey = (typeof bmcBlocks)[number]

const saveBmcSchema = z.object({
  ...Object.fromEntries(bmcBlocks.map(key => [key, z.string().optional()])),
  status: z.string().optional(),
})

const generateFromBpSchema = z.object({
  action: z.literal('generate-from-bp'),
})

const aiSuggestBlockSchema = z.object({
  action: z.literal('ai-suggest-block'),
  blockKey: z.enum(bmcBlocks),
  existingContent: z.string().optional(),
})

// ─── Auth helper ─────────────────────────────

async function authenticate(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const authHeader = request.headers.get('authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)

  if (!token) {
    return null
  }

  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}

// ─── Helper: Fetch all BP context data ───────

async function fetchBpContext(userId: string): Promise<string> {
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
      bpStatus: true,
    },
  })
  if (journey) {
    if (journey.projectTitle) parts.push(`### Projet\n${journey.projectTitle}`)
    if (journey.projectDescription) parts.push(`### Description du projet\n${journey.projectDescription}`)
    if (journey.projectSector) parts.push(`### Secteur\n${journey.projectSector}`)
    if (journey.projectStage) parts.push(`### Stade du projet\n${journey.projectStage}`)
    if (journey.targetAudience) parts.push(`### Cible client\n${journey.targetAudience}`)
    if (journey.valueProposition) parts.push(`### Proposition de valeur\n${journey.valueProposition}`)
    if (journey.creationMotivation) parts.push(`### Motivation\n${journey.creationMotivation}`)
    if (journey.estimatedRevenue) parts.push(`### Revenus estimés\n${journey.estimatedRevenue}`)
    if (journey.estimatedInvestment) parts.push(`### Investissement estimé\n${journey.estimatedInvestment}`)

    // BP sections (if any filled)
    if (journey.bpSections && typeof journey.bpSections === 'object') {
      const sections = journey.bpSections as Record<string, unknown>
      const filledSections = Object.entries(sections).filter(
        ([, v]) => typeof v === 'string' && v.trim().length > 0
      )
      if (filledSections.length > 0) {
        parts.push(`### Sections du Business Plan\n${filledSections.map(([k, v]) => `- **${k}**: ${v as string}`).join('\n')}`)
      }
    }
  }

  // 2. Market Analysis
  const market = await db.marketAnalysis.findUnique({
    where: { userId },
    select: {
      sector: true,
      marketSize: true,
      targetAudience: true,
      trends: true,
      competitors: true,
      opportunities: true,
      threats: true,
      aiSynthesis: true,
    },
  })
  if (market) {
    if (market.sector) parts.push(`### Analyse de marché — Secteur\n${market.sector}`)
    if (market.marketSize) parts.push(`### Taille du marché\n${market.marketSize}`)
    if (market.targetAudience) parts.push(`### Segmentation client (marché)\n${market.targetAudience}`)
    if (market.aiSynthesis) parts.push(`### Synthèse IA — Marché\n${market.aiSynthesis}`)
    if (market.trends && typeof market.trends === 'object') parts.push(`### Tendances\n${JSON.stringify(market.trends)}`)
    if (market.competitors && typeof market.competitors === 'object') parts.push(`### Concurrence\n${JSON.stringify(market.competitors)}`)
  }

  // 3. Financial Forecast (Financier module)
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
    if (forecast.initialInvestment) finLines.push(`Investissement initial: ${forecast.initialInvestment}€`)
    if (forecast.year1Revenue) finLines.push(`CA Année 1: ${forecast.year1Revenue}€`)
    if (forecast.year1Expenses) finLines.push(`Charges Année 1: ${forecast.year1Expenses}€`)
    if (forecast.year2Revenue) finLines.push(`CA Année 2: ${forecast.year2Revenue}€`)
    if (forecast.year2Expenses) finLines.push(`Charges Année 2: ${forecast.year2Expenses}€`)
    if (forecast.year3Revenue) finLines.push(`CA Année 3: ${forecast.year3Revenue}€`)
    if (forecast.year3Expenses) finLines.push(`Charges Année 3: ${forecast.year3Expenses}€`)
    if (forecast.breakevenMonth) finLines.push(`Seuil de rentabilité: mois ${forecast.breakevenMonth}`)
    if (finLines.length > 0) parts.push(`### Prévisions financières (Financier)\n${finLines.join('\n')}`)
    if (forecast.aiSynthesis) parts.push(`### Synthèse IA — Finances\n${forecast.aiSynthesis}`)
  }

  // 4. CreaSim Simulation
  const creasim = await db.creaSimSimulation.findUnique({
    where: { userId },
    select: {
      monthlyRevenue: true,
      fixedCharges: true,
      variableChargesRate: true,
      averageSellingPrice: true,
      unitCost: true,
      targetMarginRate: true,
      initialInvestment: true,
      grossMarginRate: true,
      netMarginRate: true,
      monthlyBreakeven: true,
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
    if (creasim.fixedCharges) csLines.push(`Charges fixes: ${JSON.stringify(creasim.fixedCharges)}`)
    if (creasim.variableChargesRate) csLines.push(`Taux charges variables: ${creasim.variableChargesRate}%`)
    if (creasim.averageSellingPrice) csLines.push(`Prix de vente moyen: ${creasim.averageSellingPrice}€`)
    if (creasim.unitCost) csLines.push(`Coût unitaire: ${creasim.unitCost}€`)
    if (creasim.targetMarginRate) csLines.push(`Marge cible: ${creasim.targetMarginRate}%`)
    if (creasim.initialInvestment) csLines.push(`Investissement initial: ${creasim.initialInvestment}€`)
    if (creasim.grossMarginRate) csLines.push(`Marge brute: ${creasim.grossMarginRate}%`)
    if (creasim.netMarginRate) csLines.push(`Marge nette: ${creasim.netMarginRate}%`)
    if (creasim.breakevenMonths) csLines.push(`Seuil de rentabilité: ${creasim.breakevenMonths} mois`)
    if (creasim.profitability1Y != null) csLines.push(`Rentabilité Année 1: ${creasim.profitability1Y}€`)
    if (creasim.profitability2Y != null) csLines.push(`Rentabilité Année 2: ${creasim.profitability2Y}€`)
    if (creasim.profitability3Y != null) csLines.push(`Rentabilité Année 3: ${creasim.profitability3Y}€`)
    if (csLines.length > 0) parts.push(`### Simulation CreaSim\n${csLines.join('\n')}`)
    if (creasim.aiAnalysis) parts.push(`### Analyse IA — CreaSim\n${creasim.aiAnalysis}`)
  }

  // 5. Juridique Analysis
  const juridique = await db.juridiqueAnalysis.findUnique({
    where: { userId },
    select: {
      recommendedStatus: true,
      fiscalRegime: true,
      legalStructure: true,
      socialCharges: true,
    },
  })
  if (juridique) {
    const jLines: string[] = []
    if (juridique.recommendedStatus) jLines.push(`Statut recommandé: ${juridique.recommendedStatus}`)
    if (juridique.legalStructure) jLines.push(`Structure juridique: ${juridique.legalStructure}`)
    if (juridique.fiscalRegime) jLines.push(`Régime fiscal: ${juridique.fiscalRegime}`)
    if (juridique.socialCharges && typeof juridique.socialCharges === 'object') jLines.push(`Charges sociales: ${JSON.stringify(juridique.socialCharges)}`)
    if (jLines.length > 0) parts.push(`### Analyse juridique\n${jLines.join('\n')}`)
  }

  return parts.join('\n\n')
}

// ─── BMC Block Labels (French) ──────────────

const bmcBlockLabels: Record<BmcBlockKey, string> = {
  partenairesCles: 'Partenaires clés',
  activitesCles: 'Activités clés',
  ressourcesCles: 'Ressources clés',
  propositionValeur: 'Proposition de valeur',
  relationsClients: 'Relations clients',
  canaux: 'Canaux de distribution',
  segmentsClients: 'Segments de clientèle',
  structureCouts: 'Structure des coûts',
  sourcesRevenus: 'Sources de revenus',
}

// ─── GET: Retrieve BMC ───────────────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized()
    }

    const bmc = await db.businessModelCanvas.findUnique({
      where: { userId: payload.userId },
    })

    if (!bmc) {
      return success(null, 'Aucun Business Model Canvas')
    }

    return success(bmc, 'Business Model Canvas chargé')
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

// ─── PUT: Save / Update BMC blocks ───────────

export async function PUT(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized()
    }

    const body = await request.json()
    const parsed = saveBmcSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        }))
      )
    }

    const { status, ...blocks } = parsed.data

    // Build update data — only include blocks that were provided
    const updateData: Record<string, string | undefined> = {}
    for (const key of bmcBlocks) {
      const val = blocks[key]
      if (val !== undefined) {
        updateData[key] = val
      }
    }

    const bmc = await db.businessModelCanvas.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        partenairesCles: updateData.partenairesCles ?? '',
        activitesCles: updateData.activitesCles ?? '',
        ressourcesCles: updateData.ressourcesCles ?? '',
        propositionValeur: updateData.propositionValeur ?? '',
        relationsClients: updateData.relationsClients ?? '',
        canaux: updateData.canaux ?? '',
        segmentsClients: updateData.segmentsClients ?? '',
        structureCouts: updateData.structureCouts ?? '',
        sourcesRevenus: updateData.sourcesRevenus ?? '',
        status: status ?? 'DRAFT',
        generatedAt: new Date(),
      },
      update: {
        ...updateData,
        ...(status && { status }),
        updatedAt: new Date(),
      },
    })

    return success(bmc, 'Business Model Canvas sauvegardé')
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

// ─── POST: AI Generation ─────────────────────

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized()
    }

    const body = await request.json()
    const { action } = body as { action: string }

    if (action === 'generate-from-bp') {
      // ── Full BMC generation from BP context ──
      const context = await fetchBpContext(payload.userId)

      const systemPrompt = `Tu es un expert en Business Model Canvas et en stratégie d'entreprise. Tu aides des entrepreneurs francophones à construire un BMC complet et cohérent.

RÈGLES IMPORTANTES :
- Réponds TOUJOURS en français
- Génére du contenu structuré et professionnel pour chaque bloc
- Sois concis mais précis (3-5 phrases par bloc, format bullet points quand pertinent)
- Assure la cohérence entre tous les blocs du BMC
- Adapte les contenus au contexte du projet fourni
- Utilise des termes professionnels du domaine entrepreneurial

Tu dois générer les 9 blocs suivants du Business Model Canvas :
1. partenairesCles — Partenaires clés (fournisseurs, alliances stratégiques, partenaires de co-création)
2. activitesCles — Activités clés (production, résolution de problèmes, gestion de plateforme)
3. ressourcesCles — Ressources clés (physiques, intellectuelles, humaines, financières)
4. propositionValeur — Proposition de valeur (bénéfices uniques, problème résolu, innovation)
5. relationsClients — Relations clients (assistance personnelle, communautés, automatisées)
6. canaux — Canaux de distribution (direct, indirect, numérique, physique)
7. segmentsClients — Segments de clientèle (cibles principales, secondaires, niches)
8. structureCouts — Structure des coûts (coûts fixes, variables, économies d'échelle)
9. sourcesRevenus — Sources de revenus (ventes, abonnements, commissions, freemium)

Réponds UNIQUEMENT en JSON valide avec les 9 clés exactes ci-dessus. Pas de texte avant ou après le JSON.`

      const userPrompt = `Génère les 9 blocs du Business Model Canvas pour ce projet entrepreneurial.

${context ? `CONTEXTE DU PROJET :\n${context}` : 'Aucun contexte détaillé fourni. Génére un BMC générique adaptable.'}

Réponds en JSON avec exactement ces 9 clés :
{
  "partenairesCles": "...",
  "activitesCles": "...",
  "ressourcesCles": "...",
  "propositionValeur": "...",
  "relationsClients": "...",
  "canaux": "...",
  "segmentsClients": "...",
  "structureCouts": "...",
  "sourcesRevenus": "..."
}`

      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        model: 'claude-sonnet-4-20250514',
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

      let generatedBlocks: Partial<Record<BmcBlockKey, string>>
      try {
        generatedBlocks = JSON.parse(jsonStr)
      } catch {
        return Errors.internal('Erreur de parsing de la réponse IA. Veuillez réessayer.')
      }

      // Save to database
      const bmc = await db.businessModelCanvas.upsert({
        where: { userId: payload.userId },
        create: {
          userId: payload.userId,
          partenairesCles: generatedBlocks.partenairesCles || '',
          activitesCles: generatedBlocks.activitesCles || '',
          ressourcesCles: generatedBlocks.ressourcesCles || '',
          propositionValeur: generatedBlocks.propositionValeur || '',
          relationsClients: generatedBlocks.relationsClients || '',
          canaux: generatedBlocks.canaux || '',
          segmentsClients: generatedBlocks.segmentsClients || '',
          structureCouts: generatedBlocks.structureCouts || '',
          sourcesRevenus: generatedBlocks.sourcesRevenus || '',
          status: 'GENERATED',
          generatedFromBp: true,
          generatedAt: new Date(),
        },
        update: {
          partenairesCles: generatedBlocks.partenairesCles ?? undefined,
          activitesCles: generatedBlocks.activitesCles ?? undefined,
          ressourcesCles: generatedBlocks.ressourcesCles ?? undefined,
          propositionValeur: generatedBlocks.propositionValeur ?? undefined,
          relationsClients: generatedBlocks.relationsClients ?? undefined,
          canaux: generatedBlocks.canaux ?? undefined,
          segmentsClients: generatedBlocks.segmentsClients ?? undefined,
          structureCouts: generatedBlocks.structureCouts ?? undefined,
          sourcesRevenus: generatedBlocks.sourcesRevenus ?? undefined,
          status: 'GENERATED',
          generatedFromBp: true,
          generatedAt: new Date(),
        },
      })

      return success(bmc, 'Business Model Canvas généré par IA')

    } else if (action === 'ai-suggest-block') {
      // ── Single block suggestion ──
      const parsed = aiSuggestBlockSchema.safeParse(body)
      if (!parsed.success) {
        return Errors.validation(
          parsed.error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message,
          }))
        )
      }

      const { blockKey, existingContent } = parsed.data
      const blockLabel = bmcBlockLabels[blockKey]

      // Fetch context
      const context = await fetchBpContext(payload.userId)

      // Fetch existing BMC to provide current state
      const existingBmc = await db.businessModelCanvas.findUnique({
        where: { userId: payload.userId },
        select: Object.fromEntries(bmcBlocks.map(k => [k, true])),
      })

      const systemPrompt = `Tu es un expert en Business Model Canvas et en stratégie d'entreprise. Tu aides des entrepreneurs francophones à construire un BMC complet et cohérent.

RÈGLES IMPORTANTES :
- Réponds TOUJOURS en français
- Génère du contenu structuré et professionnel
- Sois concis mais précis (3-5 phrases, format bullet points quand pertinent)
- Assure la cohérence avec les autres blocs du BMC
- Adapte les contenus au contexte du projet fourni
- Si du contenu existe déjà, améliore-le et complète-le
- Utilise des termes professionnels du domaine entrepreneurial`

      const otherBlocks = bmcBlocks
        .filter(k => k !== blockKey && existingBmc && (existingBmc as Record<string, unknown>)[k])
        .map(k => `- **${bmcBlockLabels[k]}**: ${(existingBmc as Record<string, string>)[k]}`)
        .join('\n')

      let userPrompt = `Génère le contenu pour le bloc "${blockLabel}" du Business Model Canvas.`

      if (existingContent && existingContent.trim()) {
        userPrompt += `\n\nContenu actuel :\n"${existingContent}"\n\nAméliore et complète ce contenu.`
      } else {
        userPrompt += `\n\nRédige un contenu complet pour ce bloc.`
      }

      if (context) {
        userPrompt += `\n\nCONTEXTE DU PROJET :\n${context}`
      }

      if (otherBlocks) {
        userPrompt += `\n\nAUTRES BLOCS DÉJÀ REMPLIS (pour cohérence) :\n${otherBlocks}`
      }

      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        model: 'claude-sonnet-4-20250514',
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
          blockKey,
          blockLabel,
          suggestion,
        },
        'Suggestion IA générée avec succès',
      )

    } else {
      return Errors.validation(
        { field: 'action', message: `Action invalide: ${action}. Utilisez 'generate-from-bp' ou 'ai-suggest-block'.` }
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
