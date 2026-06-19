// ============================================
// CreaPulse V3 — Pipeline Engine API
// GET  /api/pipeline-v3  — Full pipeline status + recommendations
// POST /api/pipeline-v3  — Incremental module sync + actions
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import type {
  ModuleId,
  DataSource,
  PipelinePhase,
  ModuleStatus,
  BpSectionProvenance,
  PipelineRecommendation,
  PipelineHealth,
} from '@/lib/pipeline-types'
import { SECTION_WEIGHTS, SECTION_SOURCE_MAP } from '@/lib/pipeline-types'

// ─── Validation ───

const syncModuleSchema = z.object({
  action: z.literal('sync-module'),
  module: z.enum(['marche', 'juridique', 'financier', 'creasim']),
})

const refreshSchema = z.object({
  action: z.literal('refresh'),
})

const pipelineActionSchema = z.discriminatedUnion('action', [syncModuleSchema, refreshSchema])

// ─── Auth helper ───

async function getAuth(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const authHeader = request.headers.get('authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
  if (!token) throw Object.assign(new Error('No session token found'), { code: 'UNAUTHORIZED' })
  return verifyToken(token)
}

// ─── Helper: Check if value is filled ───

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') {
    return Object.values(value).some((v) =>
      typeof v === 'string' && v.trim().length > 0 ||
      typeof v === 'number' && v !== 0 ||
      Array.isArray(v) && v.length > 0
    )
  }
  return false
}

function wordCount(value: unknown): number {
  if (typeof value === 'string') return value.trim().split(/\s+/).filter(Boolean).length
  return 0
}

// ─── Compute module statuses ───

function computeModules(
  marketAnalysis: { sector?: string | null; updatedAt?: Date | null } | null,
  juridiqueAnalysis: { recommendedStatus?: string | null; updatedAt?: Date | null } | null,
  financialForecast: { year1Revenue?: number | null; updatedAt?: Date | null } | null,
  creasimSimulation: { monthlyRevenue?: number | null; updatedAt?: Date | null } | null,
  bmc: { status?: string | null; updatedAt?: Date | null; partenairesCles?: string | null; activitesCles?: string | null; ressourcesCles?: string | null; propositionValeur?: string | null; relationsClients?: string | null; canaux?: string | null; segmentsClients?: string | null; structureCouts?: string | null; sourcesRevenus?: string | null } | null,
  bpSections: Record<string, unknown>,
  bpUpdatedAt: Date | null,
  pitchDeck: { updatedAt?: Date | null; content?: string | null } | null,
): Record<ModuleId, ModuleStatus> {
  const modules: Record<string, ModuleStatus> = {}

  // Marché — check if MarketAnalysis has data
  const marcheHasData = !!(marketAnalysis?.sector)
  const marcheSections = ['etude-marche', 'segmentation', 'concurrence', 'strategie-marketing', 'plan-commercial', 'swot']
  const marcheFilled = marcheSections.filter(s => isFilled(bpSections[s])).length
  modules.marche = {
    id: 'marche', label: 'Analyse de Marché', phase: 'simulateurs',
    completion: marcheSections.length > 0 ? Math.min(100, Math.round((marcheFilled / marcheSections.length) * 100)) : 0,
    hasData: marcheHasData, lastSyncAt: marketAnalysis?.updatedAt?.toISOString() ?? null,
    sectionsFilled: marcheFilled, sectionsTotal: marcheSections.length,
  }

  // Juridique
  const jurHasData = !!juridiqueAnalysis?.recommendedStatus
  const jurFilled = isFilled(bpSections['statut-juridique']) ? 1 : 0
  modules.juridique = {
    id: 'juridique', label: 'Analyse Juridique', phase: 'simulateurs',
    completion: Math.min(100, Math.round((jurFilled / 1) * 100)), hasData: jurHasData,
    lastSyncAt: juridiqueAnalysis?.updatedAt?.toISOString() ?? null,
    sectionsFilled: jurFilled, sectionsTotal: 1,
  }

  // Financier
  const finHasData = financialForecast?.year1Revenue != null && financialForecast.year1Revenue > 0
  const finSections = ['financement', 'compte-resultat', 'tresorerie', 'investissements', 'bilan']
  const finFilled = finSections.filter(s => isFilled(bpSections[s])).length
  modules.financier = {
    id: 'financier', label: 'Prévisions Financières', phase: 'simulateurs',
    completion: finSections.length > 0 ? Math.min(100, Math.round((finFilled / finSections.length) * 100)) : 0,
    hasData: finHasData, lastSyncAt: financialForecast?.updatedAt?.toISOString() ?? null,
    sectionsFilled: finFilled, sectionsTotal: finSections.length,
  }

  // CreaSim
  const csHasData = creasimSimulation?.monthlyRevenue != null && creasimSimulation.monthlyRevenue > 0
  const csFilled = isFilled(bpSections['seuil-rentabilite']) ? 1 : 0
  modules.creasim = {
    id: 'creasim', label: 'CreaSim', phase: 'simulateurs',
    completion: Math.min(100, Math.round((csFilled / 1) * 100)), hasData: csHasData,
    lastSyncAt: creasimSimulation?.updatedAt?.toISOString() ?? null,
    sectionsFilled: csFilled, sectionsTotal: 1,
  }

  // BMC
  const bmcFields = [bmc?.partenairesCles, bmc?.activitesCles, bmc?.ressourcesCles, bmc?.propositionValeur, bmc?.relationsClients, bmc?.canaux, bmc?.segmentsClients, bmc?.structureCouts, bmc?.sourcesRevenus]
  const bmcFilled = bmcFields.filter(f => typeof f === 'string' && f.trim().length > 0).length
  modules.bmc = {
    id: 'bmc', label: 'Business Model Canvas', phase: 'hub',
    completion: Math.min(100, Math.round((bmcFilled / 9) * 100)),
    hasData: bmcFilled > 0, lastSyncAt: bmc?.updatedAt?.toISOString() ?? null,
    sectionsFilled: bmcFilled, sectionsTotal: 9,
  }

  // Business Plan
  const bpAllSections = Object.keys(bpSections)
  const bpFilled = bpAllSections.filter(s => isFilled(bpSections[s])).length
  modules['business-plan'] = {
    id: 'business-plan', label: 'Business Plan', phase: 'hub',
    completion: Math.min(100, Math.round((bpFilled / 24) * 100)),
    hasData: bpFilled > 0, lastSyncAt: bpUpdatedAt?.toISOString() ?? null,
    sectionsFilled: bpFilled, sectionsTotal: 24,
  }

  // Pitch Deck
  let pdFilled = 0
  try {
    const pdContent = pitchDeck?.content ? JSON.parse(pitchDeck.content) : null
    if (pdContent?.slides && Array.isArray(pdContent.slides)) {
      pdFilled = pdContent.slides.filter((s: { content?: string }) => s.content && s.content.trim().length > 30).length
    }
  } catch { /* ignore */ }
  modules['pitch-deck'] = {
    id: 'pitch-deck', label: 'Pitch Deck', phase: 'livrables',
    completion: Math.min(100, Math.round((pdFilled / 8) * 100)),
    hasData: pdFilled > 0, lastSyncAt: pitchDeck?.updatedAt?.toISOString() ?? null,
    sectionsFilled: pdFilled, sectionsTotal: 8,
  }

  return modules as Record<ModuleId, ModuleStatus>
}

// ─── Compute section provenance ───

function computeProvenance(
  bpSections: Record<string, unknown>,
  hasMarche: boolean, hasJuridique: boolean, hasFinancier: boolean, hasCreaSim: boolean,
): BpSectionProvenance[] {
  const provenance: BpSectionProvenance[] = []
  const allSectionIds = Object.keys(SECTION_SOURCE_MAP)

  for (const sectionId of allSectionIds) {
    const content = bpSections[sectionId]
    const filled = isFilled(content)
    const possibleSources = SECTION_SOURCE_MAP[sectionId] || ['manual']

    let source: DataSource = 'empty'
    if (filled) {
      // Heuristic: if the source module has data and this is a mapped section, attribute it
      if (hasMarche && possibleSources.includes('marche')) source = 'marche'
      else if (hasJuridique && possibleSources.includes('juridique')) source = 'juridique'
      else if (hasFinancier && possibleSources.includes('financier')) source = 'financier'
      else if (hasCreaSim && possibleSources.includes('creasim')) source = 'creasim'
      else if (possibleSources.includes('parcours')) source = 'parcours'
      else source = 'manual'
    }

    provenance.push({
      sectionId,
      source,
      filled,
      wordCount: wordCount(content),
      lastModified: null, // Could be added with bpModifiedAt per section in V4
    })
  }

  return provenance
}

// ─── Compute recommendations ───

function computeRecommendations(
  modules: Record<ModuleId, ModuleStatus>,
  hasParcours: boolean,
): PipelineRecommendation[] {
  const recs: PipelineRecommendation[] = []
  let priority = 1

  // Phase 1: Parcours is foundation
  if (!hasParcours) {
    recs.push({
      id: 'rec-parcours-1', priority: priority++, module: 'parcours',
      action: 'Compléter Mon Projet',
      description: 'Remplissez votre fiche projet (Mon Projet + Vision) pour alimenter le Business Plan.',
      impact: 'Alimente 5 sections Présentation + sections Marché + Calendrier du BP',
    })
  }

  // Phase 2: Simulateurs (priority order based on what's missing)
  const simOrder: ModuleId[] = ['marche', 'juridique', 'financier', 'creasim']
  for (const modId of simOrder) {
    const mod = modules[modId]
    if (mod.completion < 80) {
      recs.push({
        id: `rec-${modId}-1`, priority: priority++, module: modId,
        action: `Compléter ${mod.label}`,
        description: mod.hasData
          ? `${mod.label} a des données mais n'est pas fully synchronisé (${mod.completion}%).`
          : `${mod.label} n'a pas encore de données. Utilisez le simulateur pour générer les données.`,
        impact: getModuleImpact(modId),
      })
    }
  }

  // Phase 3: Hub (BMC + BP)
  const bp = modules['business-plan']
  if (bp.completion < 50) {
    recs.push({
      id: 'rec-bp-1', priority: priority++, module: 'business-plan',
      action: 'Générer le Business Plan depuis le Parcours',
      description: 'Utilisez "Générer depuis le Parcours" pour créer la première ébauche de votre BP.',
      impact: 'Génère automatiquement les 5 sections Présentation',
    })
  }

  const bmc = modules.bmc
  if (bmc.completion < 50 && bp.completion >= 30) {
    recs.push({
      id: 'rec-bmc-1', priority: priority++, module: 'bmc',
      action: 'Générer le BMC depuis le Business Plan',
      description: 'Le BMC se génère depuis les données du BP. Complétez d\'abord les sections Marché et Finances.',
      impact: 'Synthétise votre modèle économique en 9 blocs',
    })
  }

  // Phase 4: Livrables
  if (bp.completion >= 70 && bmc.completion >= 70) {
    const pd = modules['pitch-deck']
    if (pd.completion < 50) {
      recs.push({
        id: 'rec-pd-1', priority: priority++, module: 'pitch-deck',
        action: 'Générer le Pitch Deck',
        description: 'Le Pitch Deck se génère depuis le BP + BMC finalisés.',
        impact: 'Crée 8 slides de présentation investisseurs',
      })
    } else {
      recs.push({
        id: 'rec-export-1', priority: priority++, module: 'business-plan',
        action: 'Exporter vos livrables',
        description: 'Tous les modules sont suffisamment complétés. Exportez votre BP, BMC et Pitch Deck.',
        impact: 'PDF du BP, HTML du BMC, PPTX du Pitch Deck',
      })
    }
  }

  return recs
}

function getModuleImpact(moduleId: ModuleId): string {
  switch (moduleId) {
    case 'marche': return 'Alimente 6 sections Marché du BP (étude, segmentation, concurrence, marketing, plan commercial, SWOT)'
    case 'juridique': return 'Alimente la section Statut Juridique du BP'
    case 'financier': return 'Alimente 5 sections Finances du BP (financement, compte résultat, trésorerie, investissements, bilan)'
    case 'creasim': return 'Alimente la section Seuil de Rentabilité du BP avec marges mensuelles'
    default: return 'Alimente les sections correspondantes du Business Plan'
  }
}

// ─── Compute pipeline health ───

function computeHealth(
  modules: Record<ModuleId, ModuleStatus>,
  sectionProvenance: BpSectionProvenance[],
): PipelineHealth {
  const bp = modules['business-plan']
  const rawProgress = bp.completion

  // Weighted progress: sum of (filled_weight / total_weight) * 100
  let weightedSum = 0
  let maxWeight = 0
  for (const prov of sectionProvenance) {
    const weight = SECTION_WEIGHTS[prov.sectionId] || 1
    maxWeight += weight
    if (prov.filled) {
      // Quality bonus: word count > 50 gets full weight, < 50 gets partial
      const qualityFactor = prov.wordCount > 50 ? 1 : prov.wordCount > 20 ? 0.7 : 0.4
      weightedSum += weight * qualityFactor
    }
  }
  const weightedProgress = maxWeight > 0 ? Math.min(100, Math.round((weightedSum / maxWeight) * 100)) : 0

  // Overall score: weighted combination of all modules
  const moduleScores = Object.values(modules)
  const overallScore = Math.round(
    moduleScores.reduce((sum, m) => sum + m.completion * (m.phase === 'hub' ? 0.4 : m.phase === 'simulateurs' ? 0.25 : m.phase === 'livrables' ? 0.2 : 0.15), 0) /
    moduleScores.reduce((sum, m) => sum + (m.phase === 'hub' ? 0.4 : m.phase === 'simulateurs' ? 0.25 : m.phase === 'livrables' ? 0.2 : 0.15), 0)
  )

  // Phase completion
  const phases = ['parcours', 'simulateurs', 'hub', 'livrables'] as PipelinePhase[]
  const phasesComplete = phases.filter(phase => {
    const phaseModules = Object.values(modules).filter(m => m.phase === phase)
    return phaseModules.length > 0 && phaseModules.every(m => m.completion >= 80)
  }).length

  return {
    overallScore,
    weightedProgress,
    rawProgress,
    phasesComplete,
    totalPhases: 4,
  }
}

// ─── Incremental sync: single module → BP ───

async function syncSingleModule(userId: string, module: 'marche' | 'juridique' | 'financier' | 'creasim') {
  const journey = await db.creatorJourney.findUnique({
    where: { userId },
    select: { bpSections: true },
  })
  const existingSections = (journey?.bpSections as Record<string, unknown>) ?? {}
  const merged = { ...existingSections }
  const syncedSections: string[] = []

  function fillIfEmpty(key: string, value: string) {
    const existing = merged[key]
    const isEmpty = existing === null || existing === undefined || (typeof existing === 'string' && existing.trim() === '')
    if (isEmpty && value.trim()) {
      merged[key] = value
      syncedSections.push(key)
    }
  }

  switch (module) {
    case 'marche': {
      const market = await db.marketAnalysis.findUnique({ where: { userId } })
      if (market) {
        const parts: string[] = []
        if (market.sector) parts.push(`**Secteur** : ${market.sector}`)
        if (market.marketSize) parts.push(`**Taille du marché** : ${market.marketSize}`)
        if (market.targetAudience) parts.push(`**Audience cible** : ${market.targetAudience}`)
        if (market.opportunities) parts.push(`**Opportunités** : ${market.opportunities}`)
        if (market.threats) parts.push(`**Menaces** : ${market.threats}`)
        if (market.aiSynthesis) parts.push(`**Synthèse IA** : ${market.aiSynthesis}`)
        const trends = market.trends as unknown[]
        if (Array.isArray(trends) && trends.length > 0) parts.push(`**Tendances** : ${trends.join(', ')}`)
        if (parts.length > 0) fillIfEmpty('etude-marche', `## Étude de marché\n\n${parts.join('\n\n')}`)

        const competitors = market.competitors as unknown[]
        if (Array.isArray(competitors) && competitors.length > 0) {
          const compParts = competitors.map((c: unknown, i: number) => {
            const comp = c as Record<string, string>
            return `### Concurrent ${i + 1}\n${Object.entries(comp).map(([k, v]) => `- **${k}** : ${v}`).join('\n')}`
          })
          fillIfEmpty('concurrence', `## Analyse concurrentielle\n\n${compParts.join('\n\n')}`)
        }
      }
      break
    }
    case 'juridique': {
      const jur = await db.juridiqueAnalysis.findUnique({ where: { userId } })
      if (jur) {
        const parts: string[] = []
        if (jur.recommendedStatus) parts.push(`**Statut recommandé** : ${jur.recommendedStatus}`)
        if (jur.fiscalRegime) parts.push(`**Régime fiscal** : ${jur.fiscalRegime}`)
        if (jur.legalStructure) parts.push(`**Structure juridique** : ${jur.legalStructure}`)
        const charges = jur.socialCharges as unknown[]
        if (Array.isArray(charges) && charges.length > 0) {
          const items = charges.map((c: unknown) => {
            const charge = c as Record<string, string>
            return `- ${charge.name || charge.type || 'Charge'} : ${charge.amount || charge.rate || ''}`
          })
          parts.push(`**Charges sociales** :\n${items.join('\n')}`)
        }
        if (parts.length > 0) fillIfEmpty('statut-juridique', `## Statut juridique\n\n${parts.join('\n\n')}`)
      }
      break
    }
    case 'financier': {
      const fin = await db.financialForecast.findUnique({ where: { userId } })
      if (fin) {
        const fmtEur = (n: number) => n.toLocaleString('fr-FR')
        const parts: string[] = []
        if (fin.year1Revenue) parts.push(`**CA Année 1** : ${fmtEur(fin.year1Revenue)} €`)
        if (fin.year2Revenue) parts.push(`**CA Année 2** : ${fmtEur(fin.year2Revenue)} €`)
        if (fin.year3Revenue) parts.push(`**CA Année 3** : ${fmtEur(fin.year3Revenue)} €`)
        if (fin.year1Expenses) parts.push(`**Charges Année 1** : ${fmtEur(fin.year1Expenses)} €`)
        if (fin.year2Expenses) parts.push(`**Charges Année 2** : ${fmtEur(fin.year2Expenses)} €`)
        if (fin.year3Expenses) parts.push(`**Charges Année 3** : ${fmtEur(fin.year3Expenses)} €`)
        if (fin.breakevenMonth) parts.push(`**Seuil de rentabilité** : Mois ${fin.breakevenMonth}`)
        if (fin.initialInvestment) parts.push(`**Investissement initial** : ${fmtEur(fin.initialInvestment)} €`)
        if (parts.length > 0) fillIfEmpty('financement', `## Plan financier (synthèse)\n\n${parts.join('\n\n')}`)

        const years = [
          { year: 1, rev: fin.year1Revenue, exp: fin.year1Expenses },
          { year: 2, rev: fin.year2Revenue, exp: fin.year2Expenses },
          { year: 3, rev: fin.year3Revenue, exp: fin.year3Expenses },
        ]
        const plParts: string[] = []
        for (const y of years) {
          if (y.rev != null || y.exp != null) {
            const rev = y.rev ?? 0; const exp = y.exp ?? 0; const result = rev - exp
            plParts.push(`### Année ${y.year}\n- CA : ${fmtEur(rev)} €\n- Charges : ${fmtEur(exp)} €\n- **Résultat net** : ${fmtEur(result)} € ${result >= 0 ? '✅' : '⚠️'}`)
          }
        }
        if (plParts.length > 0) fillIfEmpty('compte-resultat', `## Compte de résultat prévisionnel\n\n${plParts.join('\n\n')}`)
      }
      break
    }
    case 'creasim': {
      const cs = await db.creaSimSimulation.findUnique({ where: { userId } })
      if (cs) {
        const fmtEur = (n: number) => n.toLocaleString('fr-FR')
        const fmtPct = (n: number) => `${n.toFixed(1)}%`
        const parts: string[] = []
        if (cs.monthlyRevenue) parts.push(`**CA mensuel** : ${fmtEur(cs.monthlyRevenue)} €`)
        if (cs.grossMarginRate) parts.push(`**Marge brute** : ${fmtPct(cs.grossMarginRate)}`)
        if (cs.netMarginRate) parts.push(`**Marge nette** : ${fmtPct(cs.netMarginRate)}`)
        if (cs.monthlyBreakeven) parts.push(`**Seuil de rentabilité mensuel** : ${fmtEur(cs.monthlyBreakeven)} €`)
        if (cs.breakevenMonths) parts.push(`**Point mort** : ${cs.breakevenMonths.toFixed(1)} mois`)
        if (cs.profitability1Y != null) parts.push(`**Rentabilité A1** : ${fmtEur(cs.profitability1Y)} €`)
        if (cs.profitability2Y != null) parts.push(`**Rentabilité A2** : ${fmtEur(cs.profitability2Y)} €`)
        if (cs.profitability3Y != null) parts.push(`**Rentabilité A3** : ${fmtEur(cs.profitability3Y)} €`)
        if (parts.length > 0) fillIfEmpty('seuil-rentabilite', `## Analyse de rentabilité (CreaSim)\n\n${parts.join('\n\n')}`)
      }
      break
    }
  }

  // Save merged sections if anything changed
  if (syncedSections.length > 0) {
    const filledCount = Object.values(merged).filter(v =>
      typeof v === 'string' && v.trim().length > 0 ||
      typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 0 ||
      Array.isArray(v) && v.length > 0,
    ).length
    const bpScore = Math.min(100, Math.round((filledCount / 24) * 100))

    await db.creatorJourney.upsert({
      where: { userId },
      create: { userId, bpSections: merged as Prisma.InputJsonValue, bpScore, bpGeneratedAt: new Date() },
      update: { bpSections: merged as Prisma.InputJsonValue, bpScore, bpGeneratedAt: new Date() },
    })
  }

  return { syncedSections, module }
}

// ─── Build full pipeline response ───

async function buildPipelineResponse(userId: string) {
  // Fetch all data sources in parallel
  const [
    journey,
    marketAnalysis,
    juridiqueAnalysis,
    financialForecast,
    creasimSimulation,
    bmc,
    pitchDeck,
    parcoursData,
  ] = await Promise.all([
    db.creatorJourney.findUnique({
      where: { userId },
      select: { bpSections: true, bpStatus: true, bpScore: true, projectTitle: true, projectSector: true, updatedAt: true },
    }),
    db.marketAnalysis.findUnique({ where: { userId }, select: { sector: true, targetAudience: true, updatedAt: true } }),
    db.juridiqueAnalysis.findUnique({ where: { userId }, select: { recommendedStatus: true, updatedAt: true } }),
    db.financialForecast.findUnique({ where: { userId }, select: { year1Revenue: true, year1Expenses: true, updatedAt: true } }),
    db.creaSimSimulation.findUnique({ where: { userId }, select: { monthlyRevenue: true, updatedAt: true } }),
    db.businessModelCanvas.findUnique({
      where: { userId },
      select: {
        status: true, updatedAt: true,
        partenairesCles: true, activitesCles: true, ressourcesCles: true,
        propositionValeur: true, relationsClients: true, canaux: true,
        segmentsClients: true, structureCouts: true, sourcesRevenus: true,
      },
    }),
    db.zeroDraft.findFirst({
      where: { userId, projectTitle: { not: null } },
      select: { updatedAt: true, content: true },
      orderBy: { updatedAt: 'desc' },
    }),
    db.creatorJourney.findUnique({
      where: { userId },
      select: { projectTitle: true, visionAnswers: true },
    }),
  ])

  const bpSections = (journey?.bpSections as Record<string, unknown>) ?? {}
  const hasParcours = !!(parcoursData?.projectTitle) || !!(parcoursData?.visionAnswers && typeof parcoursData.visionAnswers === 'object' && Object.keys(parcoursData.visionAnswers).length > 0)
  const hasMarche = !!(marketAnalysis?.sector && marketAnalysis?.targetAudience)
  const hasJuridique = !!juridiqueAnalysis?.recommendedStatus
  const hasFinancier = !!(financialForecast?.year1Revenue != null && financialForecast.year1Revenue > 0)
  const hasCreaSim = !!(creasimSimulation?.monthlyRevenue != null && creasimSimulation.monthlyRevenue > 0)

  // Compute modules
  const modules = computeModules(
    marketAnalysis, juridiqueAnalysis, financialForecast,
    creasimSimulation, bmc, bpSections, journey?.updatedAt ?? null, pitchDeck,
  )

  // Compute provenance
  const sectionProvenance = computeProvenance(bpSections, hasMarche, hasJuridique, hasFinancier, hasCreaSim)

  // Compute health
  const health = computeHealth(modules, sectionProvenance)

  // Compute recommendations
  const recommendations = computeRecommendations(modules, hasParcours)

  return { modules, sectionProvenance, health, recommendations }
}

// ─── GET: Full pipeline status ──────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request)
    const data = await buildPipelineResponse(payload.userId)
    return success(data, 'Pipeline V3 chargé')
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
    const parsed = pipelineActionSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })))
    }

    switch (parsed.data.action) {
      case 'sync-module': {
        const result = await syncSingleModule(payload.userId, parsed.data.module)
        const data = await buildPipelineResponse(payload.userId)
        return success({
          ...data,
          syncResult: result,
        }, `Module ${parsed.data.module} synchronisé : ${result.syncedSections.length} sections mises à jour`)
      }
      case 'refresh': {
        const data = await buildPipelineResponse(payload.userId)
        return success(data, 'Pipeline V3 rafraîchi')
      }
    }
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
