// ============================================
// CreaPulse V2 — Dispositif Registry
// Default dispositif configurations & module mappings
// ============================================

export type DispositifTypeCode = 'BASE' | 'DIAGNOSTIC' | 'ACCOMPAGNEMENT' | 'CUSTOM'

export interface DispositifDefinition {
  code: string
  name: string
  description: string
  type: DispositifTypeCode
  color: string
  icon: string
  coreModules: string[]
  modules: string[]
}

// ─── Core Modules (always shown regardless of dispositif) ───

export const CORE_MODULES: string[] = [
  'vie-privee',
  'messages',
  'telechargements',
]

// ─── Full module list for the BASE parcours ───

const BASE_MODULES: string[] = [
  'profil-createur',
  'mon-projet',
  'vision',
  'pepites',
  'riasec',
  'kiviat',
  'bilan-ia',
  'creascope',
  'marche',
  'juridique',
  'financier',
  'creasim',
  'bmc',
  'business-plan',
  'pitch-deck',
  'swot',
  'gestion-temps',
  'gestion-crise',
  'marketing-commerciale',
  'mind-map',
  'tresorerie',
  'annuaire',
  'forum',
  'messages',
  'mentorat',
  'crm',
  'tremplin',
  'passeport',
  'certifications',
  'telechargements',
  'objectifs-smart',
  'cloture-rebond',
  'satisfaction-feedback',
  'gamification',
  'e-learning',
  'vie-privee',
]

// ─── Dispositif Definitions ───

export const DISPOSITIF_DEFAULTS: DispositifDefinition[] = [
  {
    code: 'creapulse',
    name: 'Parcours Créateur',
    description: 'Le parcours complet CréaPulse — tous les modules de la création à la mise en marché.',
    type: 'BASE',
    color: '#00838F',
    icon: 'Briefcase',
    coreModules: CORE_MODULES,
    modules: BASE_MODULES,
  },
  {
    code: 'creascope',
    name: 'CréaScope',
    description: 'Pipeline de diagnostic créatif — profilage, analyse et évaluation du potentiel entrepreneurial.',
    type: 'DIAGNOSTIC',
    color: '#6A1B9A',
    icon: 'Search',
    coreModules: CORE_MODULES,
    modules: [
      'profil-createur',
      'mon-projet',
      'creascope',
      'kiviat',
      'riasec',
      'pepites',
      'bilan-ia',
      'marche',
      'financier',
      'mind-map',
      'telechargements',
      'vie-privee',
    ],
  },
  {
    code: 'activ-crea',
    name: "Activ'Créa",
    description: "Programme d'accompagnement structuré de type PAA — de l'idée au lancement.",
    type: 'ACCOMPAGNEMENT',
    color: '#E65100',
    icon: 'Rocket',
    coreModules: CORE_MODULES,
    modules: [
      'profil-createur',
      'mon-projet',
      'marche',
      'juridique',
      'financier',
      'creasim',
      'bmc',
      'business-plan',
      'swot',
      'objectifs-smart',
      'gestion-temps',
      'gestion-crise',
      'marketing-commerciale',
      'mind-map',
      'tremplin',
      'telechargements',
      'messages',
      'vie-privee',
    ],
  },
]

// ─── Helpers ───

/**
 * Return the full module list for a dispositif by its code.
 * Merges the dispositif-specific modules with core modules (deduped).
 * Falls back to BASE modules if the code is not found.
 */
export function getDispositifModules(code: string): string[] {
  const def = DISPOSITIF_DEFAULTS.find((d) => d.code === code)
  const modules = def ? def.modules : BASE_MODULES
  const core = def ? def.coreModules : CORE_MODULES

  // Dedupe: core modules are always included but don't duplicate
  const set = new Set([...core, ...modules])
  return Array.from(set)
}