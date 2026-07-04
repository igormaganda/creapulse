/**
 * ═══════════════════════════════════════════
 * CreaPulse V2 — Module Registry
 * Single source of truth for ALL platform modules
 * ═══════════════════════════════════════════
 *
 * Every module in the platform is defined here with:
 * - code: unique identifier (matches AppModule.code in DB)
 * - label: display name
 * - description: tooltip / overview text
 * - section: which sidebar group (parcours, strategie, ecosysteme, pilotage)
 * - category: ModuleCategory enum value (DIAGNOSTIC, MODELING, STRATEGY, ECOSYSTEM, PILOTAGE, TOOL)
 * - phase: JourneyPhase enum value
 * - icon: lucide icon name (string, resolved at runtime)
 * - badge: optional sidebar badge text
 * - badgeVariant: badge color variant
 * - color: Tailwind classes for module card/icon
 * - sortOrder: default sort position
 * - core: if true, cannot be fully disabled (always shown but can be hidden)
 */

import type { LucideIcon } from 'lucide-react'
import {
  User, Lightbulb, Eye, FlaskConical, Pentagon, Sparkles,
  Zap, Rocket, Target, Scale, Calculator, TrendingUp,
  FileText, Presentation, Globe, MessageSquare, MessageCircle,
  GraduationCap, Stamp, BadgeCheck, Download, Shield,
  LayoutGrid, Brain,
  Clock, AlertTriangle, RotateCcw,
  Megaphone, Star, GitBranch, Trophy,
  Briefcase, BookOpen, Wallet,
} from 'lucide-react'

/* ─── Types ─── */
export interface ModuleDefinition {
  code: string
  label: string
  description: string
  section: 'parcours' | 'strategie' | 'ecosysteme' | 'pilotage'
  category: 'DIAGNOSTIC' | 'MODELING' | 'STRATEGY' | 'ECOSYSTEM' | 'PILOTAGE' | 'TOOL'
  phase: string
  icon: LucideIcon
  iconName: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  color: string
  sortOrder: number
  core: boolean // Core modules are always available, can be hidden but not removed
}

/* ─── Complete Module Definitions (38 modules) ─── */
export const MODULE_REGISTRY: ModuleDefinition[] = [
  // ═══ PARCOURS (8 modules) ═══
  {
    code: 'profil-createur',
    label: 'Profil créateur',
    description: 'Définissez votre profil entrepreneurial pour un accompagnement personnalisé.',
    section: 'parcours',
    category: 'DIAGNOSTIC',
    phase: 'DISCOVERY',
    icon: User,
    iconName: 'User',
    color: 'text-primary bg-primary/10',
    sortOrder: 1,
    core: true,
  },
  {
    code: 'mon-projet',
    label: 'Mon projet',
    description: "Décrivez votre projet de création d'entreprise étape par étape.",
    section: 'parcours',
    category: 'MODELING',
    phase: 'DISCOVERY',
    icon: Lightbulb,
    iconName: 'Lightbulb',
    badge: 'Nouveau',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    sortOrder: 2,
    core: true,
  },
  {
    code: 'vision',
    label: 'Vision',
    description: 'Structurez votre vision à long terme et vos objectifs stratégiques.',
    section: 'parcours',
    category: 'MODELING',
    phase: 'DISCOVERY',
    icon: Eye,
    iconName: 'Eye',
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30',
    sortOrder: 3,
    core: true,
  },
  {
    code: 'pepites',
    label: 'Pépites Game',
    description: 'Identifiez vos compétences entrepreneuriales à travers 4 modes de jeu interactifs.',
    section: 'parcours',
    category: 'DIAGNOSTIC',
    phase: 'PROFILING',
    icon: Zap,
    iconName: 'Zap',
    badge: 'Nouveau',
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
    sortOrder: 4,
    core: false,
  },
  {
    code: 'riasec',
    label: 'RIASEC',
    description: 'Découvrez votre profil entrepreneurial grâce au test RIASEC.',
    section: 'parcours',
    category: 'DIAGNOSTIC',
    phase: 'PROFILING',
    icon: FlaskConical,
    iconName: 'FlaskConical',
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    sortOrder: 5,
    core: false,
  },
  {
    code: 'kiviat',
    label: 'Kiviat',
    description: 'Évaluez vos compétences clés avec le radar Kiviat.',
    section: 'parcours',
    category: 'DIAGNOSTIC',
    phase: 'PROFILING',
    icon: Pentagon,
    iconName: 'Pentagon',
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
    sortOrder: 6,
    core: false,
  },
  {
    code: 'bilan-ia',
    label: 'Bilan IA',
    description: "Synthèse intelligente de votre parcours entrepreneurial grâce à l'IA.",
    section: 'parcours',
    category: 'DIAGNOSTIC',
    phase: 'PROFILING',
    icon: Sparkles,
    iconName: 'Sparkles',
    badge: 'IA',
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20',
    sortOrder: 7,
    core: false,
  },
  {
    code: 'creascope',
    label: 'CréaScope',
    description: 'Pipeline de session diagnostique 3-4h pour un accompagnement personnalisé.',
    section: 'parcours',
    category: 'DIAGNOSTIC',
    phase: 'PROFILING',
    icon: Rocket,
    iconName: 'Rocket',
    badge: 'Pipeline',
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20',
    sortOrder: 8,
    core: false,
  },

  // ═══ STRATÉGIE (12 modules) ═══
  {
    code: 'marche',
    label: 'Marché',
    description: 'Étudiez votre marché cible, concurrents et positionnement.',
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: Globe,
    iconName: 'Globe',
    color: 'text-primary bg-primary/10',
    sortOrder: 10,
    core: false,
  },
  {
    code: 'juridique',
    label: 'Juridique',
    description: 'Choisissez le statut juridique adapté à votre projet.',
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: Scale,
    iconName: 'Scale',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    sortOrder: 11,
    core: false,
  },
  {
    code: 'financier',
    label: 'Financier',
    description: 'Structurez votre plan financier prévisionnel.',
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: Calculator,
    iconName: 'Calculator',
    color: 'text-coral-500 bg-coral-50 dark:bg-coral-900/20',
    sortOrder: 12,
    core: false,
  },
  {
    code: 'creasim',
    label: 'CreaSim',
    description: "Simulateur financier interactif pour estimer votre rentabilité.",
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: TrendingUp,
    iconName: 'TrendingUp',
    badge: 'IA',
    color: 'text-primary bg-primary/10',
    sortOrder: 13,
    core: false,
  },
  {
    code: 'bmc',
    label: 'Business Model Canvas',
    description: "Construisez votre modèle d'affaires avec le canevas BMC interactif.",
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: LayoutGrid,
    iconName: 'LayoutGrid',
    badge: 'Nouveau',
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20',
    sortOrder: 14,
    core: false,
  },
  {
    code: 'business-plan',
    label: 'Business Plan',
    description: 'Rédigez votre business plan avec l\'assistance de l\'IA.',
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: FileText,
    iconName: 'FileText',
    color: 'text-coral-500 bg-coral-50 dark:bg-coral-900/20',
    sortOrder: 15,
    core: false,
  },
  {
    code: 'pitch-deck',
    label: 'Pitch Deck',
    description: 'Créez votre présentation pour convaincre investisseurs et partenaires.',
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: Presentation,
    iconName: 'Presentation',
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30',
    sortOrder: 16,
    core: false,
  },
  {
    code: 'swot',
    label: 'Matrice SWOT',
    description: 'Analysez vos forces, faiblesses, opportunités et menaces de manière interactive.',
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: Brain,
    iconName: 'Brain',
    badge: 'PAA',
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
    sortOrder: 17,
    core: false,
  },
  {
    code: 'gestion-temps',
    label: 'Gestion du Temps',
    description: 'Optimisez votre organisation et votre productivité entrepreneuriale.',
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: Clock,
    iconName: 'Clock',
    badge: 'PAA',
    color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20',
    sortOrder: 18,
    core: false,
  },
  {
    code: 'gestion-crise',
    label: 'Gestion de Crise',
    description: 'Identifiez les risques et préparez un plan de résilience pour votre entreprise.',
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: AlertTriangle,
    iconName: 'AlertTriangle',
    badge: 'PAA',
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
    sortOrder: 19,
    core: false,
  },

  {
    code: 'marketing-commerciale',
    label: 'Stratégie Marketing',
    description: 'Planification marketing et commerciale : mix 4P, personas, canaux et KPIs.',
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: Megaphone,
    iconName: 'Megaphone',
    badge: 'PAA',
    color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
    sortOrder: 20,
    core: false,
  },
  {
    code: 'mind-map',
    label: 'Carte Mentale',
    description: 'Organisation visuelle de vos idées avec une carte mentale interactive.',
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: GitBranch,
    iconName: 'GitBranch',
    badge: 'PAA',
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20',
    sortOrder: 21,
    core: false,
  },

  // ═══ STRATÉGIE — Suite (2 modules) ═══
  {
    code: 'tresorerie',
    label: 'Trésorerie',
    description: 'Suivi de vos flux de trésorerie, prévisions et solde en temps réel.',
    section: 'strategie',
    category: 'STRATEGY',
    phase: 'STRATEGY',
    icon: Wallet,
    iconName: 'Wallet',
    badge: 'Nouveau',
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20',
    sortOrder: 22,
    core: false,
  },

  // ═══ ÉCOSYSTÈME (5 modules) ═══
  {
    code: 'annuaire',
    label: 'Annuaire',
    description: "Explorez le réseau GIDEF et les acteurs de l'écosystème entrepreneurial.",
    section: 'ecosysteme',
    category: 'ECOSYSTEM',
    phase: 'ECOSYSTEM',
    icon: Globe,
    iconName: 'Globe',
    color: 'text-primary bg-primary/10',
    sortOrder: 20,
    core: false,
  },
  {
    code: 'forum',
    label: 'Forum',
    description: 'Échangez avec d\'autres créateurs d\'entreprise.',
    section: 'ecosysteme',
    category: 'ECOSYSTEM',
    phase: 'ECOSYSTEM',
    icon: MessageSquare,
    iconName: 'MessageSquare',
    color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    sortOrder: 21,
    core: false,
  },
  {
    code: 'messages',
    label: 'Messages',
    description: 'Communiquez avec votre conseiller et les autres créateurs.',
    section: 'ecosysteme',
    category: 'ECOSYSTEM',
    phase: 'ECOSYSTEM',
    icon: MessageCircle,
    iconName: 'MessageCircle',
    badge: 'Nouveau',
    color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20',
    sortOrder: 22,
    core: false,
  },
  {
    code: 'mentorat',
    label: 'Mentorat',
    description: 'Trouvez un mentor pour vous accompagner dans votre parcours.',
    section: 'ecosysteme',
    category: 'ECOSYSTEM',
    phase: 'ECOSYSTEM',
    icon: GraduationCap,
    iconName: 'GraduationCap',
    badge: undefined,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    sortOrder: 23,
    core: false,
  },
  {
    code: 'crm',
    label: 'CRM',
    description: 'Gérez vos contacts, pipeline commercial et opportunités d\'affaires.',
    section: 'ecosysteme',
    category: 'ECOSYSTEM',
    phase: 'ECOSYSTEM',
    icon: Briefcase,
    iconName: 'Briefcase',
    badge: 'Nouveau',
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
    sortOrder: 24,
    core: false,
  },

  // ═══ PILOTAGE (10 modules) ═══
  {
    code: 'tremplin',
    label: 'Tremplin',
    description: 'Accédez aux dispositifs d\'aide pour lancer votre activité.',
    section: 'pilotage',
    category: 'PILOTAGE',
    phase: 'LAUNCH',
    icon: Rocket,
    iconName: 'Rocket',
    color: 'text-primary bg-primary/10',
    sortOrder: 30,
    core: false,
  },
  {
    code: 'passeport',
    label: 'Passeport',
    description: 'Certifiez votre parcours et valorisez vos compétences.',
    section: 'pilotage',
    category: 'PILOTAGE',
    phase: 'LAUNCH',
    icon: Stamp,
    iconName: 'Stamp',
    badge: 'Nouveau',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    sortOrder: 31,
    core: false,
  },
  {
    code: 'certifications',
    label: 'Certifications',
    description: 'Consultez et gérez vos certifications obtenues.',
    section: 'pilotage',
    category: 'PILOTAGE',
    phase: 'LAUNCH',
    icon: BadgeCheck,
    iconName: 'BadgeCheck',
    color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    sortOrder: 32,
    core: false,
  },
  {
    code: 'telechargements',
    label: 'Téléchargements',
    description: 'Téléchargez tous vos documents de suivi et PDF structurés.',
    section: 'pilotage',
    category: 'PILOTAGE',
    phase: 'LAUNCH',
    icon: Download,
    iconName: 'Download',
    badge: 'PDF',
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20',
    sortOrder: 33,
    core: false,
  },
  {
    code: 'objectifs-smart',
    label: 'Objectifs SMART',
    description: 'Définissez et suivez des objectifs Spécifiques, Mesurables, Atteignables, Pertinents et Temporels.',
    section: 'pilotage',
    category: 'PILOTAGE',
    phase: 'LAUNCH',
    icon: Target,
    iconName: 'Target',
    badge: 'PAA',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    sortOrder: 35,
    core: false,
  },
  {
    code: 'cloture-rebond',
    label: 'Clôture & Rebond',
    description: "Formalités de fermeture d'entreprise et parcours de rebond professionnel.",
    section: 'pilotage',
    category: 'PILOTAGE',
    phase: 'LAUNCH',
    icon: RotateCcw,
    iconName: 'RotateCcw',
    badge: 'PAA',
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    sortOrder: 36,
    core: false,
  },
  {
    code: 'satisfaction-feedback',
    label: 'Satisfaction & Feedback',
    description: 'Enquêtes de satisfaction NPS et retours sur le programme PAA.',
    section: 'pilotage',
    category: 'PILOTAGE',
    phase: 'LAUNCH',
    icon: Star,
    iconName: 'Star',
    badge: 'PAA',
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
    sortOrder: 37,
    core: false,
  },
  {
    code: 'gamification',
    label: 'Gamification',
    description: 'Progression, classements et défis pour valoriser votre parcours entrepreneurial.',
    section: 'pilotage',
    category: 'PILOTAGE',
    phase: 'LAUNCH',
    icon: Trophy,
    iconName: 'Trophy',
    badge: 'Nouveau',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    sortOrder: 38,
    core: false,
  },
  {
    code: 'e-learning',
    label: 'E-Learning',
    description: 'Formations interactives et parcours d\'apprentissage entrepreneurial.',
    section: 'pilotage',
    category: 'PILOTAGE',
    phase: 'LAUNCH',
    icon: BookOpen,
    iconName: 'BookOpen',
    badge: 'Nouveau',
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20',
    sortOrder: 39,
    core: false,
  },
  {
    code: 'vie-privee',
    label: 'Vie Privée',
    description: 'Gérez vos consentements RGPD, exportez ou supprimez vos données.',
    section: 'pilotage',
    category: 'PILOTAGE',
    phase: 'LAUNCH',
    icon: Shield,
    iconName: 'Shield',
    badge: 'RGPD',
    color: 'text-primary bg-primary/10',
    sortOrder: 34,
    core: true, // RGPD is mandatory
  },
]

/* ─── Helpers ─── */

/** Get a module definition by code */
export function getModuleDef(code: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.code === code)
}

/** Get all modules for a given section */
export function getModulesBySection(section: string): ModuleDefinition[] {
  return MODULE_REGISTRY.filter((m) => m.section === section).sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Get all module codes */
export function getAllModuleCodes(): string[] {
  return MODULE_REGISTRY.map((m) => m.code)
}

/** Get section metadata */
export const SECTION_META: Record<string, { label: string; icon: LucideIcon }> = {
  parcours: { label: 'Parcours', icon: User },
  strategie: { label: 'Stratégie', icon: Target },
  ecosysteme: { label: 'Écosystème', icon: Globe },
  pilotage: { label: 'Pilotage', icon: Rocket },
}

/** Get module label by code */
export const MODULE_LABELS: Record<string, string> = Object.fromEntries(
  MODULE_REGISTRY.map((m) => [m.code, m.label])
)

/** Get section labels */
export const SECTION_LABELS: Record<string, string> = {
  parcours: 'Parcours',
  strategie: 'Stratégie',
  ecosysteme: 'Écosystème',
  pilotage: 'Pilotage',
}
