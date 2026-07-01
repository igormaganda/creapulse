/**
 * ═══════════════════════════════════════════════════════════════
 * CreaPulse V2 — Module Scanner
 * CLIENT-SIDE ONLY — Scans localStorage to determine
 * started/completed status for all 38 platform modules.
 * ═══════════════════════════════════════════════════════════════
 *
 * Usage:
 *   import { scanAllModules, scanModule, getSectionProgress } from '@/lib/module-scanner'
 *   const scan = scanAllModules()
 */

import {
  MODULE_REGISTRY,
  SECTION_LABELS,
  getModuleDef,
  getModulesBySection,
} from '@/lib/module-registry'

/* ─── Types ─── */

export interface ModuleScanResult {
  code: string
  label: string
  section: 'parcours' | 'strategie' | 'ecosysteme' | 'pilotage'
  status: 'not_started' | 'in_progress' | 'completed'
  hasData: boolean
  completionPercent: number // 0–100
  lastActivity: string | null // ISO date if available
  dataSummary?: string // brief one-line summary
}

export interface SectionScanResult {
  section: string
  label: string
  modules: ModuleScanResult[]
  totalModules: number
  startedModules: number
  completedModules: number
  progressPercent: number
}

export interface FullScanResult {
  modules: ModuleScanResult[]
  sections: SectionScanResult[]
  totalModules: number
  startedModules: number
  completedModules: number
  globalProgress: number
  lastActivity: string | null
  recommendedNext: ModuleScanResult[]
}

/* ─── Storage map: module code → localStorage key + status checks ─── */

interface StorageCheck {
  key: string
  checkStarted: (data: unknown) => boolean
  checkCompleted: (data: unknown) => boolean | null // null = cannot determine completion
  extractSummary: (data: unknown) => string
  extractLastActivity: (data: unknown) => string | null
  estimateCompletion: (data: unknown) => number
}

const MODULE_STORAGE_MAP: Record<string, StorageCheck> = {
  'profil-createur': {
    key: 'creapulse-profil',
    checkStarted: (d) => !!d,
    checkCompleted: (d) => calculateProfilCompletion(d) === 100,
    extractSummary: (d: any) => {
      const parts: string[] = []
      if (d?.firstName) parts.push(`Prénom: ${d.firstName}`)
      if (d?.projectSector) parts.push(`Secteur: ${d.projectSector}`)
      if (d?.employmentStatus) parts.push(`Statut: ${d.employmentStatus}`)
      return parts.length > 0 ? parts.join(', ') : 'Profil partiel'
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? d?.createdAt ?? null,
    estimateCompletion: (d) => calculateProfilCompletion(d),
  },
  'mon-projet': {
    key: 'creapulse-mon-projet',
    checkStarted: (d) => !!d,
    checkCompleted: (d) => calculateProjetCompletion(d) === 100,
    extractSummary: (d: any) => {
      const parts: string[] = []
      if (d?.projectTitle) parts.push(d.projectTitle)
      if (d?.projectStage) parts.push(`Phase: ${d.projectStage}`)
      return parts.length > 0 ? `${parts.join(' — ')}` : 'Projet non nommé'
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? d?.createdAt ?? null,
    estimateCompletion: (d) => calculateProjetCompletion(d),
  },
  vision: {
    key: 'creapulse-vision',
    checkStarted: (d) => !!d,
    checkCompleted: (d) => calculateVisionCompletion(d) === 100,
    extractSummary: (d: any) => {
      const parts: string[] = []
      if (d?.objectives?.length > 0) parts.push(`${d.objectives.length} objectif${d.objectives.length > 1 ? 's' : ''}`)
      if (d?.coreValues?.length > 0) parts.push(`${d.coreValues.length} valeur${d.coreValues.length > 1 ? 's' : ''} définie${d.coreValues.length > 1 ? 's' : ''}`)
      return parts.length > 0 ? parts.join(', ') : 'Vision en cours'
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? d?.createdAt ?? null,
    estimateCompletion: (d) => calculateVisionCompletion(d),
  },
  riasec: {
    key: 'creapulse-riasec-progress',
    checkStarted: (d) => !!(d && typeof d === 'object' && 'answers' in d && Object.keys((d as any).answers).length > 0),
    checkCompleted: (d) => !!(d && typeof d === 'object' && 'answers' in d && Object.keys((d as any).answers).length >= 42),
    extractSummary: (d: any) => {
      const count = d?.answers ? Object.keys(d.answers).length : 0
      if (count === 0) return 'Non commencé'
      const profile = d?.dominantProfile ? `Profil ${d.dominantProfile}` : `${count}/42 questions`
      return profile
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? d?.completedAt ?? null,
    estimateCompletion: (d: any) => {
      const count = d?.answers ? Object.keys(d.answers).length : 0
      return Math.round((count / 42) * 100)
    },
  },
  kiviat: {
    key: 'creapulse-kiviat',
    checkStarted: (d) => !!(d && typeof d === 'object' && 'scores' in d && Object.values((d as any).scores).some((v: any) => v > 0)),
    checkCompleted: (d) => !!(d && typeof d === 'object' && 'scores' in d && Object.values((d as any).scores).every((v: any) => v > 0)),
    extractSummary: (d: any) => {
      if (!d?.scores) return 'Non évalué'
      const filled = Object.values(d.scores).filter((v: any) => v > 0).length
      const total = Object.keys(d.scores).length
      return `${filled}/${total} compétences évaluées`
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (!d?.scores) return 0
      const total = Object.keys(d.scores).length
      const filled = Object.values(d.scores).filter((v: any) => v > 0).length
      return total > 0 ? Math.round((filled / total) * 100) : 0
    },
  },
  marche: {
    key: 'creapulse-marche',
    checkStarted: (d) => !!(d && (typeof d === 'object') && ((d as any).sector || (d as any).aiSynthesis)),
    checkCompleted: null,
    extractSummary: (d: any) => {
      if (d?.aiSynthesis) return 'Synthèse IA générée'
      if (d?.sector) return `Secteur: ${d.sector}`
      return 'En exploration'
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (!d) return 0
      let score = 0
      if (d.sector) score += 25
      if (d.targetAudience) score += 25
      if (d.competitors) score += 25
      if (d.aiSynthesis) score += 25
      return score
    },
  },
  juridique: {
    key: 'creapulse-juridique',
    checkStarted: (d) => !!(d && typeof d === 'object' && (d as any).sim),
    checkCompleted: null,
    extractSummary: (d: any) => {
      if (d?.sim?.statutJuridique) return `Statut: ${d.sim.statutJuridique}`
      if (d?.sim) return 'Simulation en cours'
      return 'Non démarré'
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (!d?.sim) return 0
      const sim = d.sim
      let score = 0
      if (sim.statutJuridique) score += 33
      if (sim.capitalSocial) score += 33
      if (sim.regimeSocial) score += 34
      return score
    },
  },
  financier: {
    key: 'creapulse-financier-sim',
    checkStarted: (d) => !!(d && typeof d === 'object' && ((d as any).year1Revenue > 0 || (d as any).year1Expenses > 0)),
    checkCompleted: null,
    extractSummary: (d: any) => {
      if (!d) return 'Non démarré'
      const parts: string[] = []
      if (d.year1Revenue) parts.push(`CA An1: ${d.year1Revenue.toLocaleString('fr-FR')}€`)
      if (d.year1Expenses) parts.push(`Charges An1: ${d.year1Expenses.toLocaleString('fr-FR')}€`)
      return parts.length > 0 ? parts.join(', ') : 'Simulation vide'
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (!d) return 0
      let score = 0
      if (d.year1Revenue || d.year1Expenses) score += 33
      if (d.year2Revenue || d.year2Expenses) score += 33
      if (d.year3Revenue || d.year3Expenses) score += 34
      return score
    },
  },
  bmc: {
    key: 'creapulse-bmc',
    checkStarted: (d) => !!(d && typeof d === 'object' && 'blocks' in d && (d as any).blocks?.length > 0),
    checkCompleted: (d) => {
      if (!d || !d.blocks) return false
      return (d as any).blocks?.every((b: any) => b.content?.trim()) || (d as any).status === 'GENERATED'
    },
    extractSummary: (d: any) => {
      if (!d?.blocks) return 'Aucun bloc rempli'
      const filled = d.blocks.filter((b: any) => b.content?.trim()).length
      const total = d.blocks.length
      return `${filled}/${total} blocs remplis`
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (!d?.blocks) return 0
      const filled = d.blocks.filter((b: any) => b.content?.trim()).length
      return Math.round((filled / d.blocks.length) * 100)
    },
  },
  'business-plan': {
    key: 'creapulse-bp',
    checkStarted: (d) => !!d,
    checkCompleted: (d) => !!(d && typeof d === 'object' && (d as any).completionInfo?.percent === 100),
    extractSummary: (d: any) => {
      const pct = d?.completionInfo?.percent ?? 0
      const totalSections = d?.sections?.length ?? 0
      return totalSections > 0
        ? `${pct}% (${totalSections} sections)`
        : `Completion: ${pct}%`
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? d?.completionInfo?.lastUpdate ?? null,
    estimateCompletion: (d: any) => {
      if (!d) return 0
      if (d.completionInfo?.percent != null) return d.completionInfo.percent
      const totalSections = d.sections?.length ?? 0
      if (totalSections === 0) return 0
      const filledSections = d.sections.filter((s: any) => s.content?.trim()).length
      return Math.round((filledSections / totalSections) * 100)
    },
  },
  'pitch-deck': {
    key: 'creapulse-pitch-deck',
    checkStarted: (d) => !!(d && typeof d === 'object' && 'slides' in d && (d as any).slides?.length > 0),
    checkCompleted: (d) => !!(d && typeof d === 'object' && 'slides' in d && (d as any).slides?.every((s: any) => s.content?.trim())),
    extractSummary: (d: any) => {
      if (!d?.slides) return 'Aucune slide'
      const filled = d.slides.filter((s: any) => s.content?.trim()).length
      const total = d.slides.length
      return `${filled}/${total} slides remplies`
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (!d?.slides) return 0
      const filled = d.slides.filter((s: any) => s.content?.trim()).length
      return Math.round((filled / d.slides.length) * 100)
    },
  },
  swot: {
    key: 'creapulse-swot',
    checkStarted: (d) => {
      if (!d || typeof d !== 'object') return false
      return (
        ((d as any).forces?.length > 0 ||
        (d as any).faiblesses?.length > 0 ||
        (d as any).opportunites?.length > 0 ||
        (d as any).menaces?.length > 0)
      )
    },
    checkCompleted: (d) => {
      if (!d || typeof d !== 'object') return false
      return (
        (d as any).forces?.length > 0 &&
        (d as any).faiblesses?.length > 0 &&
        (d as any).opportunites?.length > 0 &&
        (d as any).menaces?.length > 0
      )
    },
    extractSummary: (d: any) => {
      const parts: string[] = []
      if (d?.forces?.length > 0) parts.push(`${d.forces.length} forces`)
      if (d?.faiblesses?.length > 0) parts.push(`${d.faiblesses.length} faiblesses`)
      if (d?.opportunites?.length > 0) parts.push(`${d.opportunites.length} opportunités`)
      if (d?.menaces?.length > 0) parts.push(`${d.menaces.length} menaces`)
      return parts.length > 0 ? parts.join(', ') : 'Analyse vide'
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (!d) return 0
      let count = 0
      if ((d as any).forces?.length > 0) count++
      if ((d as any).faiblesses?.length > 0) count++
      if ((d as any).opportunites?.length > 0) count++
      if ((d as any).menaces?.length > 0) count++
      return Math.round((count / 4) * 100)
    },
  },
  'gestion-temps': {
    key: 'creapulse-gestion-temps',
    checkStarted: (d) => !!(d && typeof d === 'object' && ((d as any).diagnostic?.trim() || (d as any).eisenhower?.urgentImportant?.length > 0)),
    checkCompleted: (d) => !!(d && typeof d === 'object' && (d as any).completion?.percent === 100),
    extractSummary: (d: any) => {
      if (d?.completion?.percent != null) return `Completion: ${d.completion.percent}%`
      if (d?.diagnostic) return 'Diagnostic renseigné'
      return 'En cours'
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (!d) return 0
      if (d.completion?.percent != null) return d.completion.percent
      let score = 0
      if (d.diagnostic?.trim()) score += 40
      if (d.eisenhower) score += 30
      if (d.routine) score += 30
      return score
    },
  },
  'gestion-crise': {
    key: 'creapulse-gestion-crise',
    checkStarted: (d) => !!(d && typeof d === 'object' && (d as any).risques?.length > 0),
    checkCompleted: (d) => !!(d && typeof d === 'object' && (d as any).risques?.some((r: any) => r.mitigation?.trim()) && (d as any).aiSynthesis),
    extractSummary: (d: any) => {
      if (!d?.risques) return 'Aucun risque identifié'
      const total = d.risques.length
      const mitigated = d.risques.filter((r: any) => r.mitigation?.trim()).length
      return `${mitigated}/${total} risques mitigés`
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (!d?.risques) return 0
      const total = d.risques.length
      const mitigated = d.risques.filter((r: any) => r.mitigation?.trim()).length
      let score = total > 0 ? Math.round((mitigated / total) * 70) : 0
      if (d.aiSynthesis) score += 30
      return score
    },
  },
  'marketing-commerciale': {
    key: 'creapulse-marketing-commerciale',
    checkStarted: (d) => !!(d && typeof d === 'object' && (d as any).mix),
    checkCompleted: null,
    extractSummary: (d: any) => {
      if (d?.mix?.product) return `Mix 4P: ${d.mix.product.substring(0, 30)}…`
      if (d?.mix) return 'Mix marketing défini'
      return 'En exploration'
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (!d?.mix) return 0
      const mix = d.mix
      let score = 0
      if (mix.product) score += 25
      if (mix.price) score += 25
      if (mix.place) score += 25
      if (mix.promotion) score += 25
      return score
    },
  },
  'mind-map': {
    key: 'creapulse-mindmap',
    checkStarted: (d) => Array.isArray(d) && d.length > 1,
    checkCompleted: null,
    extractSummary: (d: any) => {
      if (!Array.isArray(d)) return 'Vide'
      return `${d.length} nœuds`
    },
    extractLastActivity: (d: any) => {
      if (!Array.isArray(d) || d.length === 0) return null
      // Use the most recent node's updatedAt if available
      const dates = d.map((n: any) => n.updatedAt ?? n.createdAt).filter(Boolean) as string[]
      return dates.length > 0 ? dates.sort().pop() ?? null : null
    },
    estimateCompletion: (d: any) => {
      if (!Array.isArray(d) || d.length <= 1) return 0
      // Estimate based on depth/branches — no strict completion criteria
      return Math.min(100, Math.round((d.length / 10) * 100))
    },
  },
  tresorerie: {
    key: 'creapulse-tresorerie',
    checkStarted: (d) => !!(d && typeof d === 'object' && (d as any).transactions?.length > 0),
    checkCompleted: null,
    extractSummary: (d: any) => {
      if (!d?.transactions) return 'Aucune transaction'
      const count = d.transactions.length
      return `${count} transaction${count > 1 ? 's' : ''} enregistrée${count > 1 ? 's' : ''}`
    },
    extractLastActivity: (d: any) => {
      if (!d?.transactions?.length) return null
      const dates = d.transactions.map((t: any) => t.date).filter(Boolean).sort()
      return dates.length > 0 ? (dates[dates.length - 1] as string) : null
    },
    estimateCompletion: (d: any) => {
      // Treasury is ongoing; presence of data = at least started
      return d?.transactions?.length > 0 ? 50 : 0
    },
  },
  annuaire: {
    key: 'annuaire-favorites',
    checkStarted: (d) => Array.isArray(d) && d.length > 0,
    checkCompleted: null,
    extractSummary: (d: any) => {
      if (!Array.isArray(d)) return 'Aucun favori'
      return `${d.length} favori${d.length > 1 ? 's' : ''} sauvegardé${d.length > 1 ? 's' : ''}`
    },
    extractLastActivity: (d: any) => {
      if (!Array.isArray(d) || d.length === 0) return null
      const dates = d.map((f: any) => f.addedAt ?? f.savedAt).filter(Boolean).sort()
      return dates.length > 0 ? (dates[dates.length - 1] as string) : null
    },
    estimateCompletion: (d: any) => Array.isArray(d) && d.length > 0 ? 50 : 0,
  },
  crm: {
    key: 'creapulse-crm',
    checkStarted: (d) => !!(d && typeof d === 'object' && ((d as any).contacts?.length > 0 || (d as any).deals?.length > 0)),
    checkCompleted: null,
    extractSummary: (d: any) => {
      const parts: string[] = []
      if (d?.contacts?.length) parts.push(`${d.contacts.length} contacts`)
      if (d?.deals?.length) parts.push(`${d.deals.length} deals`)
      return parts.length > 0 ? parts.join(', ') : 'Aucune donnée'
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (!d) return 0
      let score = 0
      if (d.contacts?.length > 0) score += 50
      if (d.deals?.length > 0) score += 50
      return score
    },
  },
  tremplin: {
    key: 'creapulse-tremplin',
    checkStarted: (d) => !!(d && typeof d === 'object' && (d as any).responses && Object.keys((d as any).responses).length > 0),
    checkCompleted: (d) => !!(d && typeof d === 'object' && (d as any).isCompleted === true),
    extractSummary: (d: any) => {
      const total = d?.responses ? Object.keys(d.responses).length : 0
      if (d?.isCompleted) return `${total} réponses — Complété`
      if (total > 0) return `${total} réponse${total > 1 ? 's' : ''}`
      return 'Non commencé'
    },
    extractLastActivity: (d: any) => d?.completedAt ?? d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (d?.isCompleted) return 100
      const total = d?.responses ? Object.keys(d.responses).length : 0
      // Assume ~8-10 questions typical
      return Math.min(100, Math.round((total / 10) * 100))
    },
  },
  'objectifs-smart': {
    key: 'creapulse-objectifs-smart',
    checkStarted: (d) => Array.isArray(d) && d.length > 0,
    checkCompleted: (d) => Array.isArray(d) && d.some((o: any) => o.status === 'termine'),
    extractSummary: (d: any) => {
      if (!Array.isArray(d) || d.length === 0) return 'Aucun objectif'
      const completed = d.filter((o: any) => o.status === 'termine').length
      return `${d.length} objectif${d.length > 1 ? 's' : ''} (${completed} terminé${completed > 1 ? 's' : ''})`
    },
    extractLastActivity: (d: any) => {
      if (!Array.isArray(d) || d.length === 0) return null
      const dates = d.map((o: any) => o.updatedAt ?? o.createdAt).filter(Boolean).sort()
      return dates.length > 0 ? (dates[dates.length - 1] as string) : null
    },
    estimateCompletion: (d: any) => {
      if (!Array.isArray(d) || d.length === 0) return 0
      const completed = d.filter((o: any) => o.status === 'termine').length
      return Math.round((completed / d.length) * 100)
    },
  },
  'cloture-rebond': {
    key: 'creapulse-cloture-rebond',
    checkStarted: (d) => !!(d && typeof d === 'object' && ((d as any).bilan?.trim() || (d as any).competences?.length > 0)),
    checkCompleted: (d) => !!(d && typeof d === 'object' && (d as any).completion?.percent === 100),
    extractSummary: (d: any) => {
      if (d?.completion?.percent != null) return `Completion: ${d.completion.percent}%`
      if (d?.bilan) return 'Bilan renseigné'
      if (d?.competences?.length > 0) return `${d.competences.length} compétences`
      return 'En cours'
    },
    extractLastActivity: (d: any) => d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      if (!d) return 0
      if (d.completion?.percent != null) return d.completion.percent
      let score = 0
      if (d.bilan?.trim()) score += 40
      if (d.competences?.length > 0) score += 30
      if (d.rebondPlan) score += 30
      return score
    },
  },
  'e-learning': {
    key: 'creapulse-e-learning',
    checkStarted: (d) => !!(d && typeof d === 'object' && (d as any).formations && Object.keys((d as any).formations).length > 0),
    checkCompleted: (d) => !!(d && typeof d === 'object' && (d as any).formations && Object.values((d as any).formations).some((f: any) => f.completedAt)),
    extractSummary: (d: any) => {
      if (!d?.formations) return 'Aucune formation'
      const total = Object.keys(d.formations).length
      const completed = Object.values(d.formations).filter((f: any) => f.completedAt).length
      return `${completed}/${total} formation${total > 1 ? 's' : ''} terminée${completed > 1 ? 's' : (completed === 1 ? 'e' : 's')}`
    },
    extractLastActivity: (d: any) => {
      if (!d?.formations) return null
      const dates = Object.values(d.formations)
        .map((f: any) => f.completedAt ?? f.lastAccessedAt)
        .filter(Boolean) as string[]
      return dates.length > 0 ? dates.sort().pop() ?? null : null
    },
    estimateCompletion: (d: any) => {
      if (!d?.formations) return 0
      const total = Object.keys(d.formations).length
      const completed = Object.values(d.formations).filter((f: any) => f.completedAt).length
      return total > 0 ? Math.round((completed / total) * 100) : 0
    },
  },
  gamification: {
    key: 'creapulse-gamification',
    checkStarted: (d) => !!(d && typeof d === 'object' && (d as any).xp > 0),
    checkCompleted: null,
    extractSummary: (d: any) => {
      if (!d || d.xp <= 0) return 'Aucun XP'
      const parts: string[] = []
      if (d.level) parts.push(`Niveau ${d.level}`)
      parts.push(`${d.xp} XP`)
      if (d.badges?.length) parts.push(`${d.badges.length} badges`)
      return parts.join(' — ')
    },
    extractLastActivity: (d: any) => d?.lastActivityAt ?? d?.updatedAt ?? null,
    estimateCompletion: (d: any) => {
      // Gamification has no real "completion" — use XP as proxy for engagement
      if (!d || d.xp <= 0) return 0
      // At 500 XP we consider solid engagement
      return Math.min(100, Math.round((d.xp / 500) * 100))
    },
  },
}

/**
 * Modules that have NO localStorage persistence at all (API-only, in-memory, or no data).
 * These will always return not_started when scanned.
 */
const MODULES_NO_STORAGE: Set<string> = new Set([
  'pepites',           // in-memory game
  'bilan-ia',          // reads from API
  'creasim',           // in-memory simulator
  'forum',             // API-only
  'messages',          // API-only
  'mentorat',          // API-only
  'passeport',         // API-only
  'certifications',    // API-only
  'telechargements',   // API-only
  'satisfaction-feedback', // API-only
  'creascope',         // API / no persistence
  'parcours-paa',      // API
  'pipeline-v3-overview', // API
  'privacy-dashboard', // API
  'vie-privee',        // API
])

/* ─── Completion calculators ─── */

/**
 * Calculate profile completion as a percentage (0–100).
 * Key fields: firstName, lastName, birthdate, phone, employmentStatus,
 *             educationLevel, skills, creationMotivation
 */
export function calculateProfilCompletion(data: any): number {
  if (!data || typeof data !== 'object') return 0

  const keyFields = [
    'firstName',
    'lastName',
    'birthdate',
    'phone',
    'employmentStatus',
    'educationLevel',
    'skills',
    'creationMotivation',
  ]

  const filled = keyFields.filter((field) => {
    const val = data[field]
    if (val == null) return false
    if (typeof val === 'string') return val.trim().length > 0
    if (Array.isArray(val)) return val.length > 0
    return true
  })

  return Math.round((filled.length / keyFields.length) * 100)
}

/**
 * Calculate project completion as a percentage (0–100).
 * Key fields: projectTitle, projectSector, projectDescription, projectStage,
 *             primaryTarget, problemSolved, competitiveAdvantage, revenueSources,
 *             teamType, motivation
 */
export function calculateProjetCompletion(data: any): number {
  if (!data || typeof data !== 'object') return 0

  const keyFields = [
    'projectTitle',
    'projectSector',
    'projectDescription',
    'projectStage',
    'primaryTarget',
    'problemSolved',
    'competitiveAdvantage',
    'revenueSources',
    'teamType',
    'motivation',
  ]

  const filled = keyFields.filter((field) => {
    const val = data[field]
    if (val == null) return false
    if (typeof val === 'string') return val.trim().length > 0
    if (Array.isArray(val)) return val.length > 0
    return true
  })

  return Math.round((filled.length / keyFields.length) * 100)
}

/**
 * Calculate vision completion as a percentage (0–100).
 * Checks: visionStatement, objectives (length > 0), coreValues (length > 0),
 *         motivation, desiredImpact
 */
export function calculateVisionCompletion(data: any): number {
  if (!data || typeof data !== 'object') return 0

  let filled = 0
  const total = 5

  if (typeof data.visionStatement === 'string' && data.visionStatement.trim()) filled++
  if (Array.isArray(data.objectives) && data.objectives.length > 0) filled++
  if (Array.isArray(data.coreValues) && data.coreValues.length > 0) filled++
  if (typeof data.motivation === 'string' && data.motivation.trim()) filled++
  if (typeof data.desiredImpact === 'string' && data.desiredImpact.trim()) filled++

  return Math.round((filled / total) * 100)
}

/* ─── localStorage helper ─── */

/**
 * Safely read and parse a value from localStorage.
 * Returns null if not found, not in browser, or parse error.
 */
function safeGetStorage(key: string): unknown {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(key)
    if (raw == null) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/* ─── Scan functions ─── */

/**
 * Scan a single module by its code.
 * Returns null if the module code is not recognized in the registry.
 */
export function scanModule(code: string): ModuleScanResult | null {
  const def = getModuleDef(code)
  if (!def) return null

  // Modules with no storage — always not_started
  if (MODULES_NO_STORAGE.has(code)) {
    return {
      code,
      label: def.label,
      section: def.section,
      status: 'not_started',
      hasData: false,
      completionPercent: 0,
      lastActivity: null,
      dataSummary: undefined,
    }
  }

  const storageCheck = MODULE_STORAGE_MAP[code]
  if (!storageCheck) {
    // Module exists in registry but no storage check defined — treat as not_started
    return {
      code,
      label: def.label,
      section: def.section,
      status: 'not_started',
      hasData: false,
      completionPercent: 0,
      lastActivity: null,
      dataSummary: undefined,
    }
  }

  const data = safeGetStorage(storageCheck.key)
  const hasData = data != null
  const isStarted = hasData && storageCheck.checkStarted(data)
  const isCompleted = isStarted && storageCheck.checkCompleted?.(data) === true
  const completion = hasData ? storageCheck.estimateCompletion(data) : 0

  let status: ModuleScanResult['status'] = 'not_started'
  if (isCompleted) status = 'completed'
  else if (isStarted) status = 'in_progress'

  return {
    code,
    label: def.label,
    section: def.section,
    status,
    hasData,
    completionPercent: completion,
    lastActivity: hasData ? storageCheck.extractLastActivity(data) : null,
    dataSummary: hasData ? storageCheck.extractSummary(data) : undefined,
  }
}

/**
 * Scan all modules and return a comprehensive result grouped by section.
 */
export function scanAllModules(): FullScanResult {
  const modules: ModuleScanResult[] = []

  // Scan all registered modules
  for (const def of MODULE_REGISTRY) {
    const result = scanModule(def.code)
    if (result) modules.push(result)
  }

  // Sort modules by section + sortOrder
  modules.sort((a, b) => {
    const sectionOrder = ['parcours', 'strategie', 'ecosysteme', 'pilotage']
    const sDiff = sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section)
    if (sDiff !== 0) return sDiff
    const aDef = getModuleDef(a.code)
    const bDef = getModuleDef(b.code)
    return (aDef?.sortOrder ?? 99) - (bDef?.sortOrder ?? 99)
  })

  // Build sections
  const sectionMap = new Map<string, ModuleScanResult[]>()
  for (const m of modules) {
    if (!sectionMap.has(m.section)) sectionMap.set(m.section, [])
    sectionMap.get(m.section)!.push(m)
  }

  const sectionOrder = ['parcours', 'strategie', 'ecosysteme', 'pilotage'] as const
  const sections: SectionScanResult[] = sectionOrder
    .filter((s) => sectionMap.has(s))
    .map((s) => {
      const sectionModules = sectionMap.get(s)!
      const started = sectionModules.filter((m) => m.status !== 'not_started').length
      const completed = sectionModules.filter((m) => m.status === 'completed').length
      const progress =
        sectionModules.length > 0
          ? Math.round((sectionModules.reduce((acc, m) => acc + m.completionPercent, 0) / sectionModules.length))
          : 0

      return {
        section: s,
        label: SECTION_LABELS[s] ?? s,
        modules: sectionModules,
        totalModules: sectionModules.length,
        startedModules: started,
        completedModules: completed,
        progressPercent: progress,
      }
    })

  // Global stats
  const totalModules = modules.length
  const startedModules = modules.filter((m) => m.status !== 'not_started').length
  const completedModules = modules.filter((m) => m.status === 'completed').length
  const globalProgress =
    totalModules > 0
      ? Math.round(modules.reduce((acc, m) => acc + m.completionPercent, 0) / totalModules)
      : 0

  // Latest activity across all modules
  const allDates = modules
    .map((m) => m.lastActivity)
    .filter((d): d is string => d != null)
    .sort()
  const lastActivity = allDates.length > 0 ? allDates[allDates.length - 1] : null

  // Recommended next modules
  const recommendedNext = getRecommendedNextModulesFromResults(modules, sections)

  return {
    modules,
    sections,
    totalModules,
    startedModules,
    completedModules,
    globalProgress,
    lastActivity,
    recommendedNext,
  }
}

/**
 * Get progress for a specific section.
 */
export function getSectionProgress(section: string): SectionScanResult {
  const defs = getModulesBySection(section)
  const modules: ModuleScanResult[] = []

  for (const def of defs) {
    const result = scanModule(def.code)
    if (result) modules.push(result)
  }

  const started = modules.filter((m) => m.status !== 'not_started').length
  const completed = modules.filter((m) => m.status === 'completed').length
  const progress =
    modules.length > 0
      ? Math.round(modules.reduce((acc, m) => acc + m.completionPercent, 0) / modules.length)
      : 0

  return {
    section,
    label: SECTION_LABELS[section] ?? section,
    modules,
    totalModules: modules.length,
    startedModules: started,
    completedModules: completed,
    progressPercent: progress,
  }
}

/**
 * Get smart recommendations: within each section, find the first
 * not-started or in-progress module. Returns up to `limit` results.
 */
export function getRecommendedNextModules(
  scan: FullScanResult,
  limit: number = 3,
): ModuleScanResult[] {
  return getRecommendedNextModulesFromResults(scan.modules, scan.sections, limit)
}

/**
 * Internal implementation of recommendations (works with pre-computed or fresh modules).
 * Returns the next modules the user should work on, ordered by section priority
 * then by sort order within each section.
 */
function getRecommendedNextModulesFromResults(
  modules: ModuleScanResult[],
  _sections: SectionScanResult[],
  limit: number = 3,
): ModuleScanResult[] {
  const candidates = modules.filter(
    (m) => m.status === 'not_started' || m.status === 'in_progress',
  )

  // Already sorted by section order + sort order from scanAllModules
  // Prioritize in_progress > not_started within the same section
  candidates.sort((a, b) => {
    const sectionOrder = ['parcours', 'strategie', 'ecosysteme', 'pilotage']
    const sDiff = sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section)
    if (sDiff !== 0) return sDiff

    const aDef = getModuleDef(a.code)
    const bDef = getModuleDef(b.code)
    const orderDiff = (aDef?.sortOrder ?? 99) - (bDef?.sortOrder ?? 99)
    if (orderDiff !== 0) return orderDiff

    // Within same position, prioritize in_progress (user has momentum)
    const statusOrder: Record<string, number> = { in_progress: 0, not_started: 1 }
    return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
  })

  return candidates.slice(0, limit)
}
