// ============================================
// CreaPulse V3 — Shared Pipeline Types
// Used by both strategy-store.ts (client) and pipeline-v3 API (server)
// ============================================

export type PipelinePhase = 'parcours' | 'simulateurs' | 'hub' | 'livrables'
export type ModuleId = 'marche' | 'juridique' | 'financier' | 'creasim' | 'bmc' | 'business-plan' | 'pitch-deck'
export type DataSource = 'parcours' | 'marche' | 'juridique' | 'financier' | 'creasim' | 'manual' | 'ai' | 'empty'

export interface ModuleStatus {
  id: ModuleId
  label: string
  phase: PipelinePhase
  completion: number        // 0-100%
  hasData: boolean
  lastSyncAt: string | null // ISO date
  sectionsFilled: number
  sectionsTotal: number
}

export interface BpSectionProvenance {
  sectionId: string
  source: DataSource
  filled: boolean
  wordCount: number
  lastModified: string | null
}

export interface PipelineRecommendation {
  id: string
  priority: number         // 1 = highest
  module: ModuleId | 'parcours'
  action: string
  description: string
  impact: string           // What this step enables downstream
}

export interface PipelineHealth {
  overallScore: number     // 0-100 weighted quality score
  weightedProgress: number // 0-100 weighted by section importance
  rawProgress: number      // Simple filled/total * 100
  phasesComplete: number  // How many phases are complete
  totalPhases: number
}

export interface PipelineV3ApiResponse {
  modules: Record<ModuleId, ModuleStatus>
  sectionProvenance: BpSectionProvenance[]
  health: PipelineHealth
  recommendations: PipelineRecommendation[]
  warnings?: { type: 'warning' | 'info'; sectionId: string; message: string; source: string; suggestion: string }[]
}

// Section weights for quality scoring (shared between client and server)
export const SECTION_WEIGHTS: Record<string, number> = {
  // Présentation (high weight — core narrative)
  resume: 3,
  equipe: 2,
  historique: 2,
  vision: 3,
  valeurs: 2,
  // Marché (high weight — validates the business)
  'etude-marche': 3,
  segmentation: 2,
  concurrence: 3,
  'strategie-marketing': 2,
  'plan-commercial': 2,
  swot: 2,
  // Finances (critical — validates viability)
  financement: 3,
  'compte-resultat': 3,
  tresorerie: 2,
  'seuil-rentabilite': 2,
  investissements: 2,
  bilan: 2,
  // Opérations (important but secondary)
  'statut-juridique': 2,
  localisation: 1,
  organisation: 1,
  production: 1,
  associes: 1,
  cogerants: 1,
  calendrier: 1,
}

// Section → source mapping (used in provenance computation)
export const SECTION_SOURCE_MAP: Record<string, DataSource[]> = {
  resume: ['parcours', 'ai', 'manual'],
  equipe: ['parcours', 'ai', 'manual'],
  historique: ['parcours', 'ai', 'manual'],
  vision: ['parcours', 'ai', 'manual'],
  valeurs: ['parcours', 'ai', 'manual'],
  'etude-marche': ['marche', 'ai', 'manual'],
  segmentation: ['marche', 'ai', 'manual'],
  concurrence: ['marche', 'ai', 'manual'],
  'strategie-marketing': ['marche', 'ai', 'manual'],
  'plan-commercial': ['marche', 'ai', 'manual'],
  swot: ['marche', 'ai', 'manual'],
  financement: ['financier', 'manual'],
  'compte-resultat': ['financier', 'manual'],
  tresorerie: ['financier', 'manual'],
  'seuil-rentabilite': ['creasim', 'ai', 'manual'],
  investissements: ['financier', 'manual'],
  bilan: ['financier', 'manual'],
  'statut-juridique': ['juridique', 'manual'],
  localisation: ['manual', 'ai'],
  organisation: ['manual', 'ai'],
  production: ['manual'],
  associes: ['manual'],
  cogerants: ['manual'],
  calendrier: ['parcours', 'manual'],
}
