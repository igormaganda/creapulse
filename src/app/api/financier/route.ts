// ============================================
// CreaPulse V2 — Plan Financier API
// GET  /api/financier  — Retrieve financial plan
// PUT  /api/financier  — Save / update financial plan
// POST /api/financier  — AI-powered financial analysis
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import { z } from 'zod'
import { callZAI, getZAIErrorMessage, aiUnavailableResponse } from '@/lib/zai-helper'

// ─── Validation Schema ───────────────────────

const financierSchema = z.object({
  sector: z.string().optional(),
  revenueItems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      unitPrice: z.number().min(0),
      quantity: z.number().min(0),
      year: z.number().min(1).max(3),
    })
  ).optional(),
  expenseItems: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      label: z.string(),
      amount: z.number().min(0),
      year: z.number().min(1).max(3),
    })
  ).optional(),
  investments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amount: z.number().min(0),
    })
  ).optional(),
  year1Revenue: z.number().optional(),
  year2Revenue: z.number().optional(),
  year3Revenue: z.number().optional(),
  year1Expenses: z.number().optional(),
  year2Expenses: z.number().optional(),
  year3Expenses: z.number().optional(),
  breakevenMonth: z.number().optional(),
  initialInvestment: z.number().optional(),
  aiSynthesis: z.string().optional(),
}).passthrough()

// ─── GET ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return
    const { payload } = auth

    const forecast = await db.financialForecast.findUnique({
      where: { userId: payload.userId },
    })

    if (!forecast) return success(null, 'Aucun plan financier')

    return success(forecast, 'Plan financier chargé')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PUT ────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return
    const { payload } = auth

    const body = await request.json()
    const parsed = financierSchema.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const data = parsed.data

    const forecast = await db.financialForecast.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        sector: data.sector ?? null,
        year1Revenue: data.year1Revenue ?? null,
        year2Revenue: data.year2Revenue ?? null,
        year3Revenue: data.year3Revenue ?? null,
        year1Expenses: data.year1Expenses ?? null,
        year2Expenses: data.year2Expenses ?? null,
        year3Expenses: data.year3Expenses ?? null,
        breakevenMonth: data.breakevenMonth != null ? Math.round(data.breakevenMonth) : null,
        initialInvestment: data.initialInvestment ?? null,
        aiSynthesis: data.aiSynthesis ?? null,
      },
      update: {
        sector: data.sector ?? undefined,
        year1Revenue: data.year1Revenue ?? undefined,
        year2Revenue: data.year2Revenue ?? undefined,
        year3Revenue: data.year3Revenue ?? undefined,
        year1Expenses: data.year1Expenses ?? undefined,
        year2Expenses: data.year2Expenses ?? undefined,
        year3Expenses: data.year3Expenses ?? undefined,
        breakevenMonth: data.breakevenMonth != null ? Math.round(data.breakevenMonth) : undefined,
        initialInvestment: data.initialInvestment ?? undefined,
        aiSynthesis: data.aiSynthesis ?? undefined,
      },
    })

    return success(forecast, 'Plan financier sauvegardé')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Real AI Financial Analysis ────────

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return
    const { payload } = auth

    // 1. Fetch all financial data in parallel
    const [financialForecast, creatorJourney, creaSimData] = await Promise.all([
      db.financialForecast.findUnique({ where: { userId: payload.userId } }),
      db.creatorJourney.findUnique({
        where: { userId: payload.userId },
        select: {
          projectTitle: true,
          projectSector: true,
          projectStage: true,
          projectDescription: true,
          targetAudience: true,
          valueProposition: true,
          creationMotivation: true,
        },
      }),
      db.creaSimSimulation.findUnique({ where: { userId: payload.userId } }),
    ])

    // Check we have at least some financial data to analyze
    const hasFinancialData = financialForecast && (
      financialForecast.year1Revenue || financialForecast.year1Expenses ||
      financialForecast.year2Revenue || financialForecast.year2Expenses ||
      financialForecast.year3Revenue || financialForecast.year3Expenses
    )

    const hasCreaSimData = creaSimData && (
      creaSimData.monthlyRevenue || creaSimData.grossMarginRate ||
      creaSimData.netMarginRate || creaSimData.monthlyBreakeven
    )

    if (!hasFinancialData && !hasCreaSimData) {
      return Errors.validation(
        'Aucune donnée financière à analyser. Remplissez d\'abord vos prévisions financières ou utilisez CreaSim.',
      )
    }

    // 2. Build comprehensive context for the LLM
    const contextParts: string[] = []

    // Project context
    if (creatorJourney) {
      contextParts.push('## CONTEXTE DU PROJET')
      if (creatorJourney.projectTitle) contextParts.push(`- Titre : ${creatorJourney.projectTitle}`)
      if (creatorJourney.projectSector) contextParts.push(`- Secteur : ${creatorJourney.projectSector}`)
      if (creatorJourney.projectStage) contextParts.push(`- Stade : ${creatorJourney.projectStage}`)
      if (creatorJourney.projectDescription) contextParts.push(`- Description : ${creatorJourney.projectDescription}`)
      if (creatorJourney.targetAudience) contextParts.push(`- Clientèle cible : ${creatorJourney.targetAudience}`)
      if (creatorJourney.valueProposition) contextParts.push(`- Proposition de valeur : ${creatorJourney.valueProposition}`)
      if (creatorJourney.creationMotivation) contextParts.push(`- Motivation : ${creatorJourney.creationMotivation}`)
    }

    // Financial Forecast data
    if (financialForecast) {
      const fmtEur = (n: number) => n.toLocaleString('fr-FR')

      contextParts.push('\n## PRÉVISIONS FINANCIÈRES (3 ans)')
      if (financialForecast.sector) contextParts.push(`- Secteur financier : ${financialForecast.sector}`)
      if (financialForecast.initialInvestment) contextParts.push(`- Investissement initial : ${fmtEur(financialForecast.initialInvestment)} €`)
      if (financialForecast.breakevenMonth) contextParts.push(`- Seuil de rentabilité : Mois ${financialForecast.breakevenMonth}`)

      // Year-by-year breakdown
      const years = [
        { y: 1, rev: financialForecast.year1Revenue, exp: financialForecast.year1Expenses },
        { y: 2, rev: financialForecast.year2Revenue, exp: financialForecast.year2Expenses },
        { y: 3, rev: financialForecast.year3Revenue, exp: financialForecast.year3Expenses },
      ]
      contextParts.push('\n### Tableau des résultats prévisionnels')
      for (const yr of years) {
        if (yr.rev != null || yr.exp != null) {
          const rev = yr.rev ?? 0
          const exp = yr.exp ?? 0
          const result = rev - exp
          const margin = rev > 0 ? ((result / rev) * 100).toFixed(1) : 'N/A'
          contextParts.push(`- **Année ${yr.y}** : CA ${fmtEur(rev)} € | Charges ${fmtEur(exp)} € | Résultat ${fmtEur(result)} € | Marge ${margin}%`)
        }
      }
    }

    // CreaSim data for cross-reference
    if (creaSimData) {
      const fmtEur = (n: number) => n.toLocaleString('fr-FR')
      const fmtPct = (n: number) => `${n.toFixed(1)}%`

      contextParts.push('\n## DONNÉES CREASIM (Simulateur financier)')
      if (creaSimData.monthlyRevenue) contextParts.push(`- CA mensuel estimé : ${fmtEur(creaSimData.monthlyRevenue)} €`)
      if (creaSimData.grossMarginRate) contextParts.push(`- Marge brute : ${fmtPct(creaSimData.grossMarginRate)}`)
      if (creaSimData.netMarginRate) contextParts.push(`- Marge nette : ${fmtPct(creaSimData.netMarginRate)}`)
      if (creaSimData.monthlyBreakeven) contextParts.push(`- Seuil de rentabilité mensuel : ${fmtEur(creaSimData.monthlyBreakeven)} €`)
      if (creaSimData.breakevenMonths) contextParts.push(`- Point mort : ${creaSimData.breakevenMonths.toFixed(1)} mois`)
      if (creaSimData.profitability1Y != null) contextParts.push(`- Rentabilité Année 1 : ${fmtEur(creaSimData.profitability1Y)} €`)
      if (creaSimData.profitability2Y != null) contextParts.push(`- Rentabilité Année 2 : ${fmtEur(creaSimData.profitability2Y)} €`)
      if (creaSimData.profitability3Y != null) contextParts.push(`- Rentabilité Année 3 : ${fmtEur(creaSimData.profitability3Y)} €`)
      if (creaSimData.averageSellingPrice) contextParts.push(`- Prix de vente moyen : ${fmtEur(creaSimData.averageSellingPrice)} €`)
      if (creaSimData.unitCost) contextParts.push(`- Coût unitaire : ${fmtEur(creaSimData.unitCost)} €`)
      if (creaSimData.targetMarginRate) contextParts.push(`- Marge cible : ${fmtPct(creaSimData.targetMarginRate)}`)

      // Fixed charges breakdown
      const fixedCharges = creaSimData.fixedCharges as Array<{ name: string; amount: number }> | null
      if (Array.isArray(fixedCharges) && fixedCharges.length > 0) {
        contextParts.push(`- Détail des charges fixes : ${fixedCharges.map(c => `${c.name} (${fmtEur(c.amount)} €)`).join(', ')}`)
      }
      if (creaSimData.variableChargesRate != null) contextParts.push(`- Taux de charges variables : ${fmtPct(creaSimData.variableChargesRate)}`)
    }

    const fullContext = contextParts.join('\n')

    // 3. Build system prompt
    const systemPrompt = `Tu es un expert-comptable et analyste financier spécialisé dans l'accompagnement des créateurs d'entreprise. Tu travailles pour CreaPulse / GIDEF, un réseau d'accompagnement entrepreneurial en Île-de-France.

MISSION : Analyser les projections financières d'un entrepreneur et fournir une synthèse professionnelle, des recommandations concrètes et une évaluation des risques.

RÈGLES :
- Réponds TOUJOURS en français
- Sois professionnel, précis et encourageant
- Utilise des données chiffrées et des pourcentages
- Adapte ton analyse au secteur et au stade du projet
- Formule des recommandations actionnables et concrètes
- Signale clairement les risques et les points de vigilance

STRUCTURE DE TA RÉPONSE (en Markdown) :

## 1. Analyse des tendances de revenus
- Analyse de l'évolution du CA sur 3 ans
- Croissance année par année
- Cohérence des prévisions

## 2. Analyse des marges
- Marge brute et marge nette (si données CreaSim disponibles)
- Évolution des marges dans le temps
- Comparaison avec les objectifs

## 3. Analyse du seuil de rentabilité
- Point mort estimé
- Délai avant atteinte de la rentabilité
- Scénario pessimiste vs optimiste

## 4. Évaluation des risques
- Risques financiers identifiés
- Points de vigilance spécifiques au secteur
- Stress-test (que se passe-t-il si le CA est -20% ?)

## 5. Recommandations
- Actions prioritaires
- Optimisations possibles
- Points à discuter avec le conseiller GIDEF
- Prochaines étapes recommandées`

    const userPrompt = `Voici les données financières complètes du projet :\n\n${fullContext}\n\nAnalyse ces données et fournis une synthèse financière professionnelle comme spécifié dans le format de réponse.`

    // 4. Call LLM via shared ZAI helper (never throws)
    const aiResult = await callZAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.7, max_tokens: 3000 })

    if (!aiResult.success) {
      return aiUnavailableResponse(getZAIErrorMessage(aiResult))
    }

    const aiSynthesis = aiResult.content || 'Désolé, une erreur est survenue lors de la génération de l\'analyse. Veuillez réessayer.'

    // 5. Save the result
    await db.financialForecast.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        aiSynthesis,
      },
      update: {
        aiSynthesis,
      },
    })

    return success({ suggestions: aiSynthesis }, 'Analyse IA générée avec succès')
  } catch (err) {
    return handleApiError(err)
  }
}
