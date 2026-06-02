'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { usePipelineV3, useStrategyStore } from '@/lib/stores/strategy-store'
import type { PipelinePhase, DataSource, ModuleId } from '@/lib/stores/strategy-store'
import { useBureauStore } from '@/components/bureau/bureau-store'
import { cn } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'

import {
  User,
  FlaskConical,
  Target,
  Download,
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowRightLeft,
  Lightbulb,
  Eye,
  Globe,
  Scale,
  Calculator,
  TrendingUp,
  LayoutGrid,
  FileText,
  Presentation,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Zap,
  Play,
} from 'lucide-react'

// ─── Constants ──────────────────────────────────────────────

const PHASE_CONFIG: {
  id: PipelinePhase
  label: string
  icon: typeof User
  description: string
}[] = [
  {
    id: 'parcours',
    label: 'Parcours',
    icon: User,
    description: 'Votre identité et vision de projet',
  },
  {
    id: 'simulateurs',
    label: 'Simulateurs',
    icon: FlaskConical,
    description: 'Analyses et simulations de marché',
  },
  {
    id: 'hub',
    label: 'Hub Central',
    icon: Target,
    description: 'Business Model Canvas et Business Plan',
  },
  {
    id: 'livrables',
    label: 'Livrables',
    icon: Download,
    description: 'Pitch Deck et exports',
  },
]

const BP_SECTION_LABELS: Record<string, string> = {
  resume: 'Résumé',
  equipe: 'Équipe',
  historique: 'Historique',
  vision: 'Vision',
  valeurs: 'Valeurs',
  'etude-marche': 'Étude de marché',
  segmentation: 'Segmentation',
  concurrence: 'Concurrence',
  'strategie-marketing': 'Stratégie marketing',
  'plan-commercial': 'Plan commercial',
  swot: 'SWOT',
  financement: 'Financement',
  'compte-resultat': 'Compte résultat',
  tresorerie: 'Trésorerie',
  'seuil-rentabilite': 'Seuil de rentabilité',
  investissements: 'Investissements',
  bilan: 'Bilan',
  'statut-juridique': 'Statut juridique',
  localisation: 'Localisation',
  organisation: 'Organisation',
  production: 'Production',
  associes: 'Associés',
  cogerants: 'Co-gérants',
  calendrier: 'Calendrier',
}

const SOURCE_COLORS: Record<DataSource, string> = {
  parcours: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  marche: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  juridique: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  financier: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  creasim: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  manual: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
  ai: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  empty: 'bg-neutral-800/40 text-neutral-600 border-neutral-700/30',
}

const SOURCE_LABELS: Record<DataSource, string> = {
  parcours: 'Parcours',
  marche: 'Marché',
  juridique: 'Juridique',
  financier: 'Financier',
  creasim: 'CreaSim',
  manual: 'Manuel',
  ai: 'IA',
  empty: 'Vide',
}

const MODULE_ICONS: Record<string, typeof User> = {
  marche: Globe,
  juridique: Scale,
  financier: Calculator,
  creasim: TrendingUp,
  bmc: LayoutGrid,
  'business-plan': FileText,
  'pitch-deck': Presentation,
}

// ─── Animation Variants ─────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

// ─── Helper: Circular Progress ──────────────────────────────

function CircularProgress({
  value,
  size = 100,
  strokeWidth = 8,
  className,
}: {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const getColor = (v: number) => {
    if (v >= 80) return 'text-emerald-400'
    if (v >= 40) return 'text-amber-400'
    return 'text-neutral-400'
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(getColor(value), 'transition-all duration-1000 ease-out')}
        />
      </svg>
      <span className="absolute text-lg font-bold text-foreground">
        {value}%
      </span>
    </div>
  )
}

// ─── Helper: Completion Color ────────────────────────────────

function getCompletionColor(value: number): string {
  if (value >= 80) return 'bg-emerald-500'
  if (value >= 30) return 'bg-amber-500'
  return 'bg-neutral-500'
}

function getCompletionBadgeClass(value: number): string {
  if (value >= 80) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  if (value >= 30) return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  return 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30'
}

function getPhaseStatusColor(progress: number, isComplete: boolean): string {
  if (isComplete) return 'border-emerald-500/40 bg-emerald-500/5'
  if (progress >= 30) return 'border-amber-500/40 bg-amber-500/5'
  return 'border-border bg-card'
}

// ─── Loading Skeleton ──────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>

      {/* Phase indicators skeleton */}
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 flex-1 rounded-xl" />
        ))}
      </div>

      {/* Phase cards skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>

      {/* Recommendations skeleton */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

// ─── Pipeline Flow Diagram ──────────────────────────────────

function PipelineFlowDiagram({
  phaseProgress,
  isPhaseComplete,
}: {
  phaseProgress: Record<PipelinePhase, number>
  isPhaseComplete: Record<PipelinePhase, boolean>
}) {
  const nodes = PHASE_CONFIG.map((phase) => {
    const progress = phaseProgress[phase.id]
    const complete = isPhaseComplete[phase.id]
    return { ...phase, progress, complete }
  })

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 py-4">
      {nodes.map((node, index) => (
        <div key={node.id} className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.08, y: -2 }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 px-3 py-2.5 md:px-5 md:py-3 rounded-xl border cursor-pointer transition-colors',
                    node.complete
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : node.progress > 0
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : 'border-border bg-muted/40 hover:bg-muted/60'
                  )}
                >
                  <node.icon
                    className={cn(
                      'w-5 h-5',
                      node.complete
                        ? 'text-emerald-400'
                        : node.progress > 0
                          ? 'text-amber-400'
                          : 'text-muted-foreground'
                    )}
                  />
                  <span className="text-xs font-medium text-foreground whitespace-nowrap">
                    {node.label}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold',
                      node.complete
                        ? 'text-emerald-400'
                        : node.progress > 0
                          ? 'text-amber-400'
                          : 'text-muted-foreground'
                    )}
                  >
                    {node.progress}%
                  </span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {node.label} — {node.progress}% {node.complete ? '(terminé)' : 'en cours'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {index < nodes.length - 1 && (
            <div className="flex items-center px-1">
              <ArrowRight
                className={cn(
                  'w-4 h-4 transition-colors',
                  node.complete ? 'text-emerald-400' : 'text-muted-foreground/40'
                )}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Phase Card ──────────────────────────────────────────────

function PhaseCard({
  phase,
  progress,
  isComplete,
  modules,
  onNavigate,
  onSyncModule,
  syncingModule,
}: {
  phase: (typeof PHASE_CONFIG)[number]
  progress: number
  isComplete: boolean
  modules: { id: string; label: string; completion: number; sectionsFilled: number; sectionsTotal: number; hasData: boolean; canSync?: boolean }[]
  onNavigate: (module: string) => void
  onSyncModule?: (moduleId: string) => void
  syncingModule?: string | null
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2 }}
      className="transition-shadow duration-200"
    >
      <Card
        className={cn(
          'h-full transition-all duration-300 hover:shadow-lg',
          getPhaseStatusColor(progress, isComplete)
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-lg',
                  isComplete
                    ? 'bg-emerald-500/15'
                    : progress > 0
                      ? 'bg-amber-500/15'
                      : 'bg-muted'
                )}
              >
                <phase.icon
                  className={cn(
                    'w-5 h-5',
                    isComplete
                      ? 'text-emerald-400'
                      : progress > 0
                        ? 'text-amber-400'
                        : 'text-muted-foreground'
                  )}
                />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">{phase.label}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>
              </div>
            </div>
            <Badge
              className={cn(
                'text-[11px] px-2 py-0.5 font-semibold border',
                getCompletionBadgeClass(progress)
              )}
            >
              {progress}%
            </Badge>
          </div>
          <Progress
            value={progress}
            className="h-1.5 mt-3"
          />
        </CardHeader>

        <CardContent className="pt-0 space-y-2">
          {modules.length > 0 ? (
            <div className="space-y-1.5">
              {modules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => onNavigate(mod.id)}
                  className="w-full group"
                >
                  <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted/60">
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const IconComp = MODULE_ICONS[mod.id]
                          return IconComp ? (
                            <IconComp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          ) : null
                        })()}
                        <span className="text-xs font-medium text-foreground truncate">
                          {mod.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                          {mod.sectionsFilled}/{mod.sectionsTotal}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={cn('h-full rounded-full', getCompletionColor(mod.completion))}
                            initial={{ width: 0 }}
                            animate={{ width: `${mod.completion}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                        {mod.completion >= 80 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : mod.completion > 0 ? (
                          <Circle className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400/30" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {mod.canSync && onSyncModule && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn(
                            'h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
                            syncingModule === mod.id && 'animate-pulse'
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            onSyncModule(mod.id)
                          }}
                          disabled={syncingModule === mod.id}
                          title={`Synchroniser ${mod.label} vers le Business Plan`}
                        >
                          <Play className="w-3 h-3 text-teal-400" />
                        </Button>
                      )}
                      <ChevronRight className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-3 italic">
              Aucun module dans cette phase
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Recommendations Panel ─────────────────────────────────

function RecommendationsPanel({
  recommendations,
  onNavigate,
}: {
  recommendations: { id: string; priority: number; module: string; action: string; description: string; impact: string }[]
  onNavigate: (module: string) => void
}) {
  if (recommendations.length === 0) {
    return (
      <motion.div variants={itemVariants}>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex flex-col items-center gap-2 py-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-300">Tout est à jour !</p>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Votre pipeline est complet. Vous pouvez exporter vos livrables ou peaufiner les détails.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const topRecs = recommendations.slice(0, 3)

  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <CardTitle className="text-sm font-semibold">Recommandations</CardTitle>
            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
              {recommendations.length} action{recommendations.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {topRecs.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      'text-[10px] px-1.5 py-0 h-5 font-bold border',
                      rec.priority === 1
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : rec.priority === 2
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                    )}
                  >
                    P{rec.priority}
                  </Badge>
                  <span className="text-xs font-semibold text-foreground">{rec.action}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{rec.impact}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] px-3 gap-1"
                  onClick={() => onNavigate(rec.module)}
                >
                  Suivre
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Section Provenance Grid ─────────────────────────────────

function SectionProvenanceGrid({
  provenance,
}: {
  provenance: { sectionId: string; source: DataSource; filled: boolean; wordCount: number }[]
}) {
  const columns = {
    default: 2,
    sm: 3,
    md: 4,
    lg: 6,
  }

  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              <CardTitle className="text-sm font-semibold">Provenance des Sections BP</CardTitle>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['parcours', 'marche', 'juridique', 'financier', 'creasim', 'manual'] as DataSource[]).map(
                (source) => (
                  <Badge
                    key={source}
                    className={cn('text-[9px] px-1.5 py-0 h-4 border', SOURCE_COLORS[source])}
                  >
                    {SOURCE_LABELS[source]}
                  </Badge>
                )
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(140px, 1fr))` }}>
            {provenance.map((prov) => (
              <TooltipProvider key={prov.sectionId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors hover:bg-muted/40 cursor-default',
                        SOURCE_COLORS[prov.source]
                      )}
                    >
                      {prov.filled ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className="text-[11px] font-medium truncate">
                        {BP_SECTION_LABELS[prov.sectionId] || prov.sectionId}
                      </span>
                      {prov.filled && prov.wordCount > 0 && (
                        <span className="text-[9px] opacity-60 ml-auto shrink-0">
                          {prov.wordCount}m
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">
                      {BP_SECTION_LABELS[prov.sectionId] || prov.sectionId}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Source : {SOURCE_LABELS[prov.source]} •{' '}
                      {prov.filled ? `${prov.wordCount} mots` : 'Non rempli'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function PipelineV3Overview() {
  const {
    modules,
    sectionProvenance,
    health,
    recommendations,
    isLoading,
    isSyncing,
    lastFullSync,
    fetchPipelineData,
    syncModule,
    getPhaseProgress,
    isPhaseComplete,
  } = usePipelineV3()

  const setModule = useBureauStore((s) => s.setModule)

  // Fetch pipeline data on mount
  useEffect(() => {
    fetchPipelineData()
  }, [fetchPipelineData])

  // Build phase module lists — parcours is mocked (no store module with phase='parcours')
  const phaseModules = useMemo(() => {
    const result = {} as Record<PipelinePhase, typeof modules[ModuleId][]>

    // Parcours: derived from other modules' data as proxy indicators
    const parcoursCompletion = modules.marche.hasData || modules.juridique.hasData
      ? 100
      : modules.business-plan.sectionsFilled > 0
        ? 60
        : 0
    result.parcours = [
      {
        id: 'mon-projet',
        label: 'Mon Projet',
        completion: parcoursCompletion,
        sectionsFilled: parcoursCompletion >= 100 ? 1 : 0,
        sectionsTotal: 1,
        hasData: parcoursCompletion >= 60,
        canSync: false,
      },
      {
        id: 'vision',
        label: 'Vision',
        completion: modules.business-plan.sectionsFilled > 0 ? 100 : 0,
        sectionsFilled: modules.business-plan.sectionsFilled > 0 ? 1 : 0,
        sectionsTotal: 1,
        hasData: modules.business-plan.sectionsFilled > 0,
        canSync: false,
      },
    ]

    // Simulateurs can be synced to BP
    result.simulateurs = [
      { ...modules.marche, canSync: true },
      { ...modules.juridique, canSync: true },
      { ...modules.financier, canSync: true },
      { ...modules.creasim, canSync: true },
    ]
    result.hub = [modules.bmc, modules['business-plan']]
    result.livrables = [modules['pitch-deck']]

    return result
  }, [modules])

  // Compute phase progress — parcours from phaseModules, others from store
  const phaseProgress = useMemo(() => {
    const phases: PipelinePhase[] = ['parcours', 'simulateurs', 'hub', 'livrables']
    const result = {} as Record<PipelinePhase, number>
    for (const phase of phases) {
      if (phase === 'parcours') {
        // Parcours has no store modules — compute from phaseModules mock
        const mods = phaseModules.parcours
        result[phase] = mods.length > 0
          ? Math.round(mods.reduce((sum, m) => sum + m.completion, 0) / mods.length)
          : 0
      } else {
        result[phase] = getPhaseProgress(phase)
      }
    }
    return result
  }, [modules, phaseModules, getPhaseProgress])

  const phaseComplete = useMemo(() => {
    const phases: PipelinePhase[] = ['parcours', 'simulateurs', 'hub', 'livrables']
    const result = {} as Record<PipelinePhase, boolean>
    for (const phase of phases) {
      if (phase === 'parcours') {
        // Parcours complete when both mon-projet and vision are done
        const mods = phaseModules.parcours
        result[phase] = mods.length > 0 && mods.every(m => m.completion >= 80)
      } else {
        result[phase] = isPhaseComplete(phase)
      }
    }
    return result
  }, [modules, phaseModules, isPhaseComplete])

  // Navigation handler — handles both module IDs and special section IDs like 'parcours'
  const handleNavigate = (moduleId: string) => {
    // Special case: 'parcours' is a section, not a module — navigate to section + default module
    if (moduleId === 'parcours') {
      useBureauStore.getState().setSection('parcours')
      useBureauStore.getState().setModule('mon-projet')
      return
    }
    setModule(moduleId)
  }

  // Sync handler
  const handleSyncModule = async (moduleId: ModuleId) => {
    const result = await syncModule(moduleId)
    if (result) {
      toast.success('Synchronisation réussie', {
        description: `Les données de ${modules[moduleId]?.label || moduleId} ont été mises à jour dans le Business Plan.`,
      })
    } else {
      toast.error('Erreur de synchronisation', {
        description: `Impossible de synchroniser ${modules[moduleId]?.label || moduleId}. Réessayez plus tard.`,
      })
    }
  }

  // Handle refresh — returns success/failure
  const handleRefresh = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/pipeline-v3', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          useStrategyStore.getState().hydrateFromAPI(json.data)
          toast.success('Pipeline rafraîchi', {
            description: 'Les données du pipeline ont été mises à jour.',
          })
          return true
        }
      }
      toast.error('Erreur de rafraîchissement', {
        description: 'Impossible de charger les données du pipeline.',
      })
      return false
    } catch {
      toast.error('Erreur réseau', {
        description: 'Vérifiez votre connexion et réessayez.',
      })
      return false
    }
  }

  // Sync state for tracking which module is syncing
  const [syncingModule, setSyncingModule] = useState<string | null>(null)

  // Handle per-module sync from pipeline overview
  const handleSyncFromOverview = async (moduleId: string) => {
    setSyncingModule(moduleId)
    const ok = await syncModule(moduleId as ModuleId)
    setSyncingModule(null)
    if (ok) {
      toast.success('Synchronisation réussie', {
        description: `Les données de ${modules[moduleId as ModuleId]?.label || moduleId} ont été injectées dans le Business Plan.`,
      })
    } else {
      toast.error('Erreur de synchronisation', {
        description: `Impossible de synchroniser ${modules[moduleId as ModuleId]?.label || moduleId}. Réessayez plus tard.`,
      })
    }
  }

  // Loading state
  if (isLoading && health.overallScore === 0 && Object.values(modules).every((m) => m.completion === 0)) {
    return <LoadingSkeleton />
  }

  return (
    <TooltipProvider>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 md:p-6 space-y-6"
      >
        {/* ─── Header Section ─── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row items-start md:items-center gap-6"
        >
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                Pipeline Stratégie V3
              </h1>
              <Badge className="bg-teal-500/15 text-teal-400 border-teal-500/30 text-[10px]">
                <Sparkles className="w-3 h-3 mr-1" />
                IA Active
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {health.phasesComplete}/{health.totalPhases} phases terminées •{' '}
              Score pondéré : <span className="font-semibold text-foreground">{health.weightedProgress}%</span> •{' '}
              Progression brute : {health.rawProgress}%
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] gap-1.5"
                onClick={handleRefresh}
                disabled={isSyncing}
              >
                <RefreshCw className={cn('w-3 h-3', isSyncing && 'animate-spin')} />
                Rafraîchir
              </Button>
              {isSyncing && (
                <span className="text-[11px] text-muted-foreground">Synchronisation en cours…</span>
              )}
            </div>
          </div>

          <CircularProgress value={health.overallScore} size={96} strokeWidth={7} />
        </motion.div>

        {/* ─── Phase Progress Indicators ─── */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PHASE_CONFIG.map((phase) => (
              <motion.div
                key={phase.id}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  'rounded-xl border p-3 flex items-center gap-3 transition-colors',
                  phaseComplete[phase.id]
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : phaseProgress[phase.id] > 0
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-border bg-muted/20'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg',
                    phaseComplete[phase.id]
                      ? 'bg-emerald-500/15'
                      : phaseProgress[phase.id] > 0
                        ? 'bg-amber-500/15'
                        : 'bg-muted/50'
                  )}
                >
                  <phase.icon
                    className={cn(
                      'w-5 h-5',
                      phaseComplete[phase.id]
                        ? 'text-emerald-400'
                        : phaseProgress[phase.id] > 0
                          ? 'text-amber-400'
                          : 'text-muted-foreground'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{phase.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {phaseComplete[phase.id] ? 'Terminé ✓' : `${phaseProgress[phase.id]}%`}
                  </p>
                </div>
                {phaseComplete[phase.id] && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <Separator className="opacity-40" />

        {/* ─── Pipeline Flow Visualization ─── */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/40">
            <CardContent className="py-3 px-4 md:px-6">
              <PipelineFlowDiagram
                phaseProgress={phaseProgress}
                isPhaseComplete={phaseComplete}
              />
            </CardContent>
          </Card>
        </motion.div>

        <Separator className="opacity-40" />

        {/* ─── 4 Pipeline Phase Cards (2×2 Grid) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PHASE_CONFIG.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              progress={phaseProgress[phase.id]}
              isComplete={phaseComplete[phase.id]}
              modules={phaseModules[phase.id]}
              onNavigate={handleNavigate}
              onSyncModule={handleSyncFromOverview}
              syncingModule={syncingModule}
            />
          ))}
        </div>

        <Separator className="opacity-40" />

        {/* ─── Recommendations Panel ─── */}
        <RecommendationsPanel recommendations={recommendations} onNavigate={handleNavigate} />

        <Separator className="opacity-40" />

        {/* ─── Section Provenance Grid ─── */}
        <SectionProvenanceGrid provenance={sectionProvenance} />

        {/* ─── Footer info ─── */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-2 py-4"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground/50" />
          <p className="text-[11px] text-muted-foreground/60">
            Données synchronisées automatiquement • Dernière mise à jour :{' '}
            {lastFullSync
              ? new Date(lastFullSync).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : 'jamais'}
          </p>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  )
}
