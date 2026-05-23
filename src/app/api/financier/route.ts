// ============================================
// CreaPulse V2 — Plan Financier API
// GET  /api/financier  — Retrieve financial plan
// PUT  /api/financier  — Save / update financial plan
// POST /api/financier  — AI suggestions (mock)
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

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

// ─── Auth helper ─────────────────────────────

async function authenticate(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const authHeader = request.headers.get('authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
  if (!token) return null
  try { return await verifyToken(token) } catch { return null }
}

// ─── GET ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

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
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

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

// ─── POST: AI Suggestions (mock) ────────────

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

    const body = await request.json()
    const { year1Revenue, year1Expenses, year2Revenue, year2Expenses } = body

    const y1Result = (year1Revenue || 0) - (year1Expenses || 0)
    const y2Result = (year2Revenue || 0) - (year2Expenses || 0)
    const y1Margin = year1Revenue ? ((y1Result / year1Revenue) * 100).toFixed(1) : 0

    const suggestions = `## Suggestions IA — Optimisation financière

### Analyse rapide
- **Résultat Année 1** : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(y1Result)}
- **Marge nette Année 1** : ${y1Margin}%
- ${y2Result > y1Result ? '**Croissance positive entre A1 et A2** — bon signal !' : '**Attention** : le résultat diminue entre A1 et A2.'}

### Recommandations
${y1Result < 0 ? '1. **Urgence** : Votre résultat Année 1 est négatif. Révisez vos charges à la baisse ou votre CA à la hausse.\n' : ''}1. **Diversification des revenus** : Explorez de nouvelles sources de revenus pour réduire la dépendance à un seul produit/service.
2. **Optimisation des charges** : Identifiez les charges fixes que vous pouvez réduire ou transformer en charges variables.
3. **Trésorerie** : Maintenez un fonds de roulement suffisant pour couvrir au moins 3 mois de charges.
4. **Suivi mensuel** : Mettez en place un tableau de bord mensuel pour suivre l\'évolution réelle vs prévisions.
5. **Scénarios** : Préparez un scénario pessimiste et un scénario optimiste en plus du scénario principal.

*Conseil : Discutez de ces projections avec votre conseiller GIDEF pour affiner votre plan.*

*Nouvelle analyse effectuée automatiquement — consultez votre conseiller pour un avis personnalisé.*`

    await db.financialForecast.upsert({
      where: { userId: payload.userId },
      create: { userId: payload.userId, aiSynthesis: suggestions },
      update: { aiSynthesis: suggestions },
    })

    return success({ suggestions }, 'Suggestions IA générées')
  } catch (err) {
    return handleApiError(err)
  }
}
