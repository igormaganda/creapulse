// ============================================
// CreaPulse V2 — Analyse de Marché API
// GET  /api/marche  — Retrieve market analysis
// PUT  /api/marche  — Save / update market analysis
// POST /api/marche  — Generate AI synthesis
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ─── Validation Schema ───────────────────────

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

// ─── GET: Retrieve market analysis ──────────

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

    const analysis = await db.marketAnalysis.findUnique({
      where: { userId: payload.userId },
    })

    if (!analysis) return success(null, 'Aucune analyse de marché sauvegardée')

    return success(analysis, 'Analyse de marché chargée')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PUT: Save / Update ─────────────────────

export async function PUT(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

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
    return handleApiError(err)
  }
}

// ─── POST: AI Synthesis (mock) ──────────────

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

    const body = await request.json()
    const { sector, marketSize, targetAudience, trends, competitors, swot } = body

    // Mock AI synthesis — in production, call LLM here
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
    return handleApiError(err)
  }
}
