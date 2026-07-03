'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useBureauStore, type BureauSection } from './bureau-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Lightbulb,
  Calculator,
  FileText,
  Target,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FlaskConical,
  Scale,
  Presentation,
  ChevronDown,
  ChevronUp,
  Award,
  Lock,
  Play,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SkeletonPulse } from '@/lib/hooks/use-api-data'
import { scanAllModules, type FullScanResult } from '@/lib/module-scanner'
import { SECTION_META, getModuleDef, MODULE_REGISTRY } from '@/lib/module-registry'

/* ─── Animation variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
} as const

/* ─── Section color map ─── */
const SECTION_COLORS: Record<string, {
  border: string
  bg: string
  iconColor: string
  progressColor: string
  badge: string
}> = {
  parcours: {
    border: 'border-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
    progressColor: '[&>div]:bg-teal-500',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  },
  strategie: {
    border: 'border-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    progressColor: '[&>div]:bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  ecosysteme: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    progressColor: '[&>div]:bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  pilotage: {
    border: 'border-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
    progressColor: '[&>div]:bg-rose-500',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
}

/* ─── Quick Actions config (kept, with module codes for status lookup) ─── */
const QUICK_ACTIONS = [
  {
    label: 'Démarrer un diagnostic',
    description: 'Testez la viabilité de votre projet',
    icon: FlaskConical,
    color: 'bg-teal-50 dark:bg-teal-900/30',
    iconColor: 'text-primary',
    module: 'riasec',
    section: 'parcours' as BureauSection,
  },
  {
    label: 'Simuler mes finances',
    description: 'Estimez charges et rentabilité',
    icon: Calculator,
    color: 'bg-coral-50 dark:bg-coral-900/20',
    iconColor: 'text-coral-500',
    module: 'creasim',
    section: 'strategie' as BureauSection,
  },
  {
    label: 'Rédiger mon Business Plan',
    description: 'Génération assistée par IA',
    icon: FileText,
    color: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-500',
    module: 'business-plan',
    section: 'strategie' as BureauSection,
  },
  {
    label: 'Analyser mon marché',
    description: 'Étude de marché ciblée',
    icon: TrendingUp,
    color: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
    module: 'marche',
    section: 'strategie' as BureauSection,
  },
  {
    label: 'Mon profil juridique',
    description: 'Choisissez votre statut',
    icon: Scale,
    color: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    module: 'juridique',
    section: 'strategie' as BureauSection,
  },
  {
    label: 'Créer mon Pitch Deck',
    description: 'Présentation pour investisseurs',
    icon: Presentation,
    color: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    module: 'pitch-deck',
    section: 'strategie' as BureauSection,
  },
]

/* ─── Helper: format relative time ─── */
function formatRelativeTime(iso: string | null): string {
  if (!iso) return ''
  try {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffH = Math.floor(diffMs / 3600000)
    const diffD = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return "À l'instant"
    if (diffMin < 60) return `Il y a ${diffMin} min`
    if (diffH < 24) return `Il y a ${diffH}h`
    if (diffD < 7) return `Il y a ${diffD}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

/* ─── Dashboard Component ─── */
export function Dashboard() {
  const { userName, setSection, setModule } = useBureauStore()
  const [activityExpanded, setActivityExpanded] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number>(Date.now())

  /* ─── Scan all modules from localStorage (sync, refresh every 60s) ─── */
  const [scan, setScan] = useState<FullScanResult>(() => {
    try { return scanAllModules() } catch {
      return { modules: [], sections: [], totalModules: 38, startedModules: 0, completedModules: 0, globalProgress: 0, lastActivity: null, recommendedNext: [] }
    }
  })

  useEffect(() => {
    const id = setInterval(() => {
      try {
        setScan(scanAllModules())
        setLastRefreshedAt(Date.now())
      } catch { /* ignore */ }
    }, 60000)
    return () => clearInterval(id)
  }, [])

  /* ─── Derived data ─── */
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }, [])

  // Active modules (started or completed), sorted by lastActivity desc
  const activeModules = useMemo(() => {
    return scan.modules
      .filter((m) => m.status !== 'not_started')
      .sort((a, b) => {
        if (a.lastActivity && b.lastActivity) {
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        }
        if (a.lastActivity) return -1
        if (b.lastActivity) return 1
        return b.completionPercent - a.completionPercent
      })
  }, [scan.modules])

  // Build a status lookup map for quick actions
  const moduleStatusMap = useMemo(() => {
    const map: Record<string, 'not_started' | 'in_progress' | 'completed'> = {}
    for (const m of scan.modules) {
      map[m.code] = m.status
    }
    return map
  }, [scan.modules])

  // Section progress lookup
  const sectionProgressMap = useMemo(() => {
    const map: Record<string, { progress: number; started: number; completed: number; total: number }> = {}
    for (const s of scan.sections) {
      map[s.section] = {
        progress: s.progressPercent,
        started: s.startedModules,
        completed: s.completedModules,
        total: s.totalModules,
      }
    }
    return map
  }, [scan.sections])

  // Get section modules for badge display
  const sectionActiveModulesMap = useMemo(() => {
    const map: Record<string, typeof scan.modules> = {}
    for (const s of scan.sections) {
      map[s.section] = s.modules
        .filter((m) => m.status !== 'not_started')
        .sort((a, b) => b.completionPercent - a.completionPercent)
    }
    return map
  }, [scan.sections])

  // Navigate to a module
  const handleNavigate = (section: BureauSection, module: string) => {
    setSection(section)
    setModule(module)
  }

  // Navigate to a section
  const handleSectionClick = (section: BureauSection) => {
    setSection(section)
    setModule(null)
  }

  // First recommended module for the "Reprendre" button
  const firstRecommended = scan.recommendedNext[0]
  const moduleDefForRec = firstRecommended ? getModuleDef(firstRecommended.code) : null

  /* ─── Banner message based on progress ─── */
  const bannerMessage = useMemo(() => {
    if (scan.globalProgress === 0) {
      return 'Bienvenue ! Commencez votre parcours entrepreneurial'
    }
    if (scan.globalProgress >= 100) {
      return 'Félicitations ! Vous avez complété votre parcours'
    }
    return `Vous avez accompli ${scan.globalProgress}% de votre parcours`
  }, [scan.globalProgress])

  /* ─── Pipeline stages (dynamic) ─── */
  const pipelineStages = useMemo(() => {
    const parcours = sectionProgressMap['parcours'] ?? { progress: 0, started: 0, completed: 0, total: 8 }
    const strategie = sectionProgressMap['strategie'] ?? { progress: 0, started: 0, completed: 0, total: 13 }
    const financierModule = scan.modules.find((m) => m.code === 'financier')
    const financierProgress = financierModule?.completionPercent ?? 0
    const pilotage = sectionProgressMap['pilotage'] ?? { progress: 0, started: 0, completed: 0, total: 10 }

    // Determine parcours module names for tasks
    const parcoursTasks = scan.sections
      .find((s) => s.section === 'parcours')
      ?.modules.slice(0, 3).map((m) => m.label) ?? ['Profil créateur', 'Mon projet', 'Vision']

    // Strategie tasks
    const strategieTasks = scan.sections
      .find((s) => s.section === 'strategie')
      ?.modules.slice(0, 3).map((m) => m.label) ?? ['Marché', 'Juridique', 'Vision']

    // Active tasks in strategie (in_progress modules)
    const strategieActive = scan.sections
      .find((s) => s.section === 'strategie')
      ?.modules.filter((m) => m.status === 'in_progress').map((m) => m.label) ?? []

    // Financier tasks
    const financierTasks = ['CreaSim', 'Business Plan', 'Financier']
    const financierActive = financierModule?.status === 'in_progress' ? ['Financier'] : []

    // Pilotage tasks
    const pilotageTasks = ['Tremplin', 'Passeport', 'Certifications']

    return [
      {
        id: 'idee',
        label: 'Idée',
        icon: Lightbulb as LucideIcon,
        status: parcours.progress >= 80 ? 'done' as const : parcours.progress > 0 ? 'active' as const : 'upcoming' as const,
        color: parcours.progress >= 80
          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
          : parcours.progress > 0
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-neutral-200 dark:border-neutral-700',
        iconColor: parcours.progress >= 80
          ? 'text-teal-600 dark:text-teal-400'
          : parcours.progress > 0
            ? 'text-primary'
            : 'text-muted-foreground',
        tasks: parcoursTasks,
        activeTasks: parcours.progress > 0 && parcours.progress < 80 ? [parcoursTasks[0]] : [],
        progress: parcours.progress,
      },
      {
        id: 'structurer',
        label: 'Structurer',
        icon: Target as LucideIcon,
        status: strategie.progress >= 80
          ? 'done' as const
          : strategie.progress > 0 || parcours.progress >= 50
            ? 'active' as const
            : 'locked' as const,
        color: strategie.progress >= 80
          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
          : strategie.progress > 0 || parcours.progress >= 50
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-neutral-200 dark:border-neutral-700',
        iconColor: strategie.progress >= 80
          ? 'text-amber-600 dark:text-amber-400'
          : strategie.progress > 0 || parcours.progress >= 50
            ? 'text-primary'
            : 'text-muted-foreground',
        tasks: strategieTasks,
        activeTasks: strategieActive.length > 0 ? strategieActive : (parcours.progress >= 50 ? [strategieTasks[0]] : []),
        progress: strategie.progress,
      },
      {
        id: 'financer',
        label: 'Financer',
        icon: Calculator as LucideIcon,
        status: financierProgress >= 80
          ? 'done' as const
          : financierProgress > 0 || strategie.progress >= 50
            ? 'active' as const
            : 'locked' as const,
        color: financierProgress >= 80
          ? 'border-coral-500 bg-coral-50 dark:bg-coral-900/20'
          : financierProgress > 0 || strategie.progress >= 50
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-neutral-200 dark:border-neutral-700',
        iconColor: financierProgress >= 80
          ? 'text-coral-500'
          : financierProgress > 0 || strategie.progress >= 50
            ? 'text-primary'
            : 'text-muted-foreground',
        tasks: financierTasks,
        activeTasks: financierActive,
        progress: financierProgress,
      },
      {
        id: 'lancer',
        label: 'Lancer',
        icon: Sparkles as LucideIcon,
        status: pilotage.progress >= 80
          ? 'done' as const
          : strategie.progress >= 30
            ? 'active' as const
            : 'locked' as const,
        color: pilotage.progress >= 80
          ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
          : strategie.progress >= 30
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-neutral-200 dark:border-neutral-700',
        iconColor: pilotage.progress >= 80
          ? 'text-rose-600 dark:text-rose-400'
          : strategie.progress >= 30
            ? 'text-primary'
            : 'text-muted-foreground',
        tasks: pilotageTasks,
        activeTasks: [],
        progress: pilotage.progress,
      },
    ]
  }, [scan, sectionProgressMap])

  // Determine current pipeline step label
  const currentPipelineStep = useMemo(() => {
    const activeStage = pipelineStages.find((s) => s.status === 'active')
    if (activeStage) return activeStage.label
    const firstUpcoming = pipelineStages.find((s) => s.status === 'upcoming')
    return firstUpcoming ? firstUpcoming.label : pipelineStages[0].label
  }, [pipelineStages])

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 p-4 md:p-6 lg:p-8"
      >
        {/* ═══ 1. Welcome Banner ═══ */}
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-2xl gradient-teal p-6 md:p-8 text-white">
            {/* Background decoration */}
            <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold md:text-3xl">
                  {greeting}, {userName} 👋
                </h1>
                <p className="mt-1 text-sm text-white/80 md:text-base">
                  {bannerMessage}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  MAJ : il y a {Math.max(0, Math.floor((Date.now() - lastRefreshedAt) / 1000))}s
                </p>
              </div>
              {firstRecommended && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
                    onClick={() => handleNavigate(
                      firstRecommended.section as BureauSection,
                      firstRecommended.code,
                    )}
                  >
                    {moduleDefForRec && <moduleDefForRec.icon className="mr-2 h-4 w-4" />}
                    Reprendre
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ 2. KPI Cards ═══ */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* KPI 1: Progression globale */}
          <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
                  <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">
                  {scan.globalProgress}
                  <span className="text-sm font-normal text-muted-foreground ml-0.5">%</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Progression globale</p>
              </div>
              <Progress value={scan.globalProgress} className="mt-2 h-1.5 [&>div]:bg-teal-500" />
            </CardContent>
          </Card>

          {/* KPI 2: Modules actifs */}
          <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">
                  {scan.startedModules}
                  <span className="text-sm font-normal text-muted-foreground ml-0.5">/{scan.totalModules}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Modules actifs</p>
              </div>
              <Progress
                value={scan.totalModules > 0 ? Math.round((scan.startedModules / scan.totalModules) * 100) : 0}
                className="mt-2 h-1.5 [&>div]:bg-green-500"
              />
            </CardContent>
          </Card>

          {/* KPI 3: Modules complétés */}
          <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">
                  {scan.completedModules}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Modules complétés</p>
              </div>
              <Progress
                value={scan.totalModules > 0 ? Math.round((scan.completedModules / scan.totalModules) * 100) : 0}
                className="mt-2 h-1.5 [&>div]:bg-amber-500"
              />
            </CardContent>
          </Card>

          {/* KPI 4: Recommandé */}
          <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            onClick={() => {
              if (firstRecommended) {
                handleNavigate(firstRecommended.section as BureauSection, firstRecommended.code)
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm font-bold text-foreground truncate">
                  {firstRecommended ? firstRecommended.label : 'Commencer'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Recommandé</p>
              </div>
              {firstRecommended?.completionPercent != null && firstRecommended.completionPercent > 0 && (
                <Progress value={firstRecommended.completionPercent} className="mt-2 h-1.5" />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ 3. Section Progress Grid ═══ */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-bold text-foreground mb-4">Progression par section</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {scan.sections.map((section) => {
              const colors = SECTION_COLORS[section.section] ?? SECTION_COLORS.parcours
              const meta = SECTION_META[section.section]
              const SectionIcon = meta?.icon ?? Target
              const activeMods = sectionActiveModulesMap[section.section] ?? []
              const visibleMods = activeMods.slice(0, 3)
              const overflowCount = activeMods.length - 3

              return (
                <Tooltip key={section.section}>
                  <TooltipTrigger asChild>
                    <Card
                      className={cn(
                        'cursor-pointer border-l-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
                        colors.border,
                      )}
                      onClick={() => handleSectionClick(section.section as BureauSection)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', colors.bg)}>
                            <SectionIcon className={cn('h-4 w-4', colors.iconColor)} />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{section.label}</span>
                        </div>
                        <Progress
                          value={section.progressPercent}
                          className={cn('h-2 mb-2', colors.progressColor)}
                        />
                        <p className="text-xs text-muted-foreground mb-2">
                          {section.startedModules}/{section.totalModules} modules
                        </p>
                        {visibleMods.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {visibleMods.map((m) => (
                              <span
                                key={m.code}
                                className={cn(
                                  'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                                  colors.badge,
                                )}
                              >
                                {m.status === 'completed' && (
                                  <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                                )}
                                {m.label}
                              </span>
                            ))}
                            {overflowCount > 0 && (
                              <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                +{overflowCount}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{section.completedModules} complété{section.completedModules > 1 ? 's' : ''}, {section.startedModules - section.completedModules} en cours</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </motion.div>

        {/* ═══ 4. Recommended Next Steps ═══ */}
        {scan.recommendedNext.length > 0 && (
          <motion.div variants={itemVariants}>
            <h2 className="text-lg font-bold text-foreground mb-4">Prochaines étapes recommandées</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {scan.recommendedNext.slice(0, 3).map((mod) => {
                const def = getModuleDef(mod.code)
                const ModIcon = def?.icon ?? Lightbulb
                const isInProgress = mod.status === 'in_progress'

                return (
                  <motion.div
                    key={mod.code}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
                      onClick={() => handleNavigate(mod.section as BureauSection, mod.code)}
                    >
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                          def?.color ?? 'bg-primary/10 text-primary',
                        )}>
                          <ModIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-foreground truncate">{mod.label}</p>
                            {isInProgress ? (
                              <Badge variant="secondary" className="text-[10px] shrink-0 bg-primary/10 text-primary">
                                En cours
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                Nouveau
                              </Badge>
                            )}
                          </div>
                          {mod.dataSummary && (
                            <p className="text-xs text-muted-foreground truncate">{mod.dataSummary}</p>
                          )}
                          {mod.completionPercent > 0 && (
                            <Progress value={mod.completionPercent} className="mt-2 h-1" />
                          )}
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-primary hover:text-primary p-0"
                            >
                              {isInProgress ? (
                                <>
                                  <Play className="mr-1 h-3 w-3" />
                                  Continuer
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-1 h-3 w-3" />
                                  Commencer
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 shrink-0 mt-1" />
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ 5. Bottom Grid: Module Activity + Quick Actions ═══ */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left card: Activité des modules */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Activité des modules</CardTitle>
              <CardDescription>Modules en cours et complétés</CardDescription>
            </CardHeader>
            <CardContent>
              {activeModules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Lightbulb className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun module démarré</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Commencez par un diagnostic RIASEC</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="max-h-80">
                    <div className="space-y-3 pr-3">
                      {activeModules.slice(0, activityExpanded ? undefined : 6).map((mod) => {
                        const def = getModuleDef(mod.code)
                        const ModIcon = def?.icon ?? Lightbulb
                        const isCompleted = mod.status === 'completed'

                        return (
                          <div
                            key={mod.code}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => handleNavigate(mod.section as BureauSection, mod.code)}
                          >
                            <div className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                              def?.color ?? 'bg-primary/10 text-primary',
                            )}>
                              <ModIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground truncate">{mod.label}</p>
                                {isCompleted ? (
                                  <Badge variant="secondary" className="text-[10px] shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    Complété
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px] shrink-0 bg-primary/10 text-primary">
                                    En cours
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {mod.dataSummary && (
                                  <span className="text-xs text-muted-foreground truncate">{mod.dataSummary}</span>
                                )}
                              </div>
                              <Progress value={mod.completionPercent} className="mt-1 h-1" />
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                              {formatRelativeTime(mod.lastActivity)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                  {activeModules.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setActivityExpanded((e) => !e)}
                    >
                      {activityExpanded ? (
                        <>
                          <ChevronUp className="mr-1 h-3 w-3" />
                          Voir moins
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-1 h-3 w-3" />
                          Voir tout ({activeModules.length} modules)
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Right card: Actions rapides */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Actions rapides</CardTitle>
              <CardDescription>Accédez directement aux modules clés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => {
                  const modStatus = moduleStatusMap[action.module] ?? 'not_started'
                  const isStarted = modStatus !== 'not_started'
                  const isCompleted = modStatus === 'completed'

                  return (
                    <div
                      key={action.label}
                      className="group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-muted/50"
                      onClick={() => handleNavigate(action.section, action.module)}
                    >
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                        action.color,
                      )}>
                        <action.icon className={cn('h-5 w-5', action.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{action.label}</p>
                          {/* Status indicator */}
                          {isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          ) : isStarted ? (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 shrink-0" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ 6. Pipeline de création ═══ */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Pipeline de création</h2>
            <Badge variant="secondary" className="text-xs">
              Étape {pipelineStages.findIndex((s) => s.status === 'active') + 1 || pipelineStages.findIndex((s) => s.status === 'upcoming') + 1}/4 — {currentPipelineStep}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pipelineStages.map((stage, i) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <Card
                  className={cn(
                    'h-full border-l-4 transition-all duration-200 hover:shadow-md',
                    stage.color,
                    stage.status === 'locked' && 'opacity-60',
                  )}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <stage.icon className={cn('h-4 w-4', stage.iconColor)} />
                        <CardTitle className="text-sm font-semibold">{stage.label}</CardTitle>
                      </div>
                      {stage.status === 'done' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {stage.status === 'active' && (
                        <span className="flex h-2 w-2 relative">
                          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                        </span>
                      )}
                      {stage.status === 'locked' && (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    {/* Mini progress bar for active/done stages */}
                    {(stage.status === 'active' || stage.status === 'done') && stage.progress > 0 && (
                      <Progress value={stage.progress} className="mt-2 h-1" />
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <ul className="space-y-1.5">
                      {stage.tasks.map((task) => {
                        const isActive = stage.activeTasks?.includes(task)
                        const isDone = stage.status === 'done'
                        return (
                          <li key={task} className="flex items-center gap-2 text-xs">
                            {isDone ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                            ) : isActive ? (
                              <div className="h-3 w-3 rounded-full border-2 border-primary shrink-0" />
                            ) : stage.status === 'locked' ? (
                              <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-neutral-300 dark:border-neutral-600 shrink-0" />
                            )}
                            <span className={cn(
                              isDone && 'line-through text-muted-foreground',
                              isActive && 'text-foreground font-medium',
                              !isDone && !isActive && stage.status === 'locked' && 'text-muted-foreground/50',
                              !isDone && !isActive && stage.status !== 'locked' && 'text-muted-foreground',
                            )}>
                              {task}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  )
}