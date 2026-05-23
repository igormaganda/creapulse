'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useBureauStore } from './bureau-store'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Lightbulb,
  Calculator,
  FileText,
  Target,
  TrendingUp,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  FlaskConical,
  Scale,
  Presentation,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApiData, DemoBadge, SkeletonPulse } from '@/lib/hooks/use-api-data'

/* ─── Animation variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

/* ─── KPI Data ─── */
const kpis = [
  {
    label: 'Progression parcours',
    value: '35',
    suffix: '%',
    icon: TrendingUp,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/30',
    progress: 35,
  },
  {
    label: 'Modules complétés',
    value: '7',
    suffix: '/20',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/30',
    progress: 35,
  },
  {
    label: 'Prochain RDV',
    value: 'Demain',
    suffix: '',
    icon: Calendar,
    color: 'text-coral-500',
    bg: 'bg-coral-50 dark:bg-coral-900/20',
    progress: null,
  },
  {
    label: 'Score Business Plan',
    value: '--',
    suffix: '',
    icon: BarChart3,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    progress: null,
  },
]

/* ─── Pipeline stages ─── */
const pipelineStages = [
  {
    id: 'idee',
    label: 'Idée',
    icon: Lightbulb,
    status: 'done' as const,
    color: 'border-teal-500 bg-teal-50 dark:bg-teal-900/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
    tasks: ['Validation idée', 'Profil créateur'],
  },
  {
    id: 'structurer',
    label: 'Structurer',
    icon: Target,
    status: 'active' as const,
    color: 'border-primary bg-primary/5 dark:bg-primary/10',
    iconColor: 'text-primary',
    tasks: ['Marché', 'Juridique', 'Vision'],
    activeTasks: ['Vision'],
  },
  {
    id: 'financer',
    label: 'Financer',
    icon: Calculator,
    status: 'locked' as const,
    color: 'border-neutral-200 dark:border-neutral-700',
    iconColor: 'text-muted-foreground',
    tasks: ['CreaSim', 'Business Plan', 'Pitch Deck'],
  },
  {
    id: 'lancer',
    label: 'Lancer',
    icon: Sparkles,
    status: 'locked' as const,
    color: 'border-neutral-200 dark:border-neutral-700',
    iconColor: 'text-muted-foreground',
    tasks: ['Tremplin', 'Passeport', 'Immatriculation'],
  },
]

/* ─── Quick Actions ─── */
const quickActions = [
  {
    label: 'Démarrer un diagnostic',
    description: 'Testez la viabilité de votre projet',
    icon: FlaskConical,
    color: 'bg-teal-50 dark:bg-teal-900/30',
    iconColor: 'text-primary',
    module: 'riasec',
    section: 'parcours' as const,
  },
  {
    label: 'Simuler mes finances',
    description: 'Estimez charges et rentabilité',
    icon: Calculator,
    color: 'bg-coral-50 dark:bg-coral-900/20',
    iconColor: 'text-coral-500',
    module: 'creasim',
    section: 'strategie' as const,
  },
  {
    label: 'Rédiger mon Business Plan',
    description: 'Génération assistée par IA',
    icon: FileText,
    color: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-500',
    module: 'business-plan',
    section: 'strategie' as const,
  },
  {
    label: 'Analyser mon marché',
    description: 'Étude de marché ciblée',
    icon: TrendingUp,
    color: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
    module: 'marche',
    section: 'strategie' as const,
  },
  {
    label: 'Mon profil juridique',
    description: 'Choisissez votre statut',
    icon: Scale,
    color: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    module: 'juridique',
    section: 'strategie' as const,
  },
  {
    label: 'Créer mon Pitch Deck',
    description: 'Présentation pour investisseurs',
    icon: Presentation,
    color: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    module: 'pitch-deck',
    section: 'strategie' as const,
  },
]

/* ─── Activity feed ─── */
const activities = [
  {
    id: 1,
    action: 'Module RIASEC complété',
    detail: 'Votre profil est disponible dans Parcours > RIASEC',
    time: 'Il y a 2 heures',
    icon: CheckCircle2,
    color: 'text-green-500',
  },
  {
    id: 2,
    action: 'Premier brouillon enregistré',
    detail: 'Mon projet — Boulangerie artisanale',
    time: 'Hier',
    icon: FileText,
    color: 'text-primary',
  },
  {
    id: 3,
    action: 'Rendez-vous planifié',
    detail: 'GIDEF Paris — Mercredi 14h',
    time: 'Il y a 2 jours',
    icon: Calendar,
    color: 'text-coral-500',
  },
]

/* ─── Upcoming appointments ─── */
const appointments = [
  {
    id: 1,
    title: 'RDV Conseiller',
    description: 'Suivi de projet — GIDEF Paris',
    date: 'Mercredi 14:00',
    type: 'Physique',
  },
  {
    id: 2,
    title: 'Atelier Marketing',
    description: 'Webinaire — Stratégie réseaux sociaux',
    date: 'Vendredi 10:00',
    type: 'En ligne',
  },
]

/* ─── Dashboard API types ─── */

interface DashboardKpiData {
  progression: number
  modulesCompleted: number
  modulesTotal: number
  prochainRDV: string | null
  scoreBP: number | null
}

interface DashboardActivity {
  id: string
  action: string
  detail: string
  time: string
  icon?: string // 'check' | 'file' | 'calendar' | 'trending'
  color?: string
}

interface DashboardAppointment {
  id: string
  title: string
  description: string
  date: string
  type: string
}

interface DashboardApiResponse {
  kpis: DashboardKpiData
  activities: DashboardActivity[]
  appointments: DashboardAppointment[]
}

const FALLBACK_DASHBOARD: DashboardApiResponse = {
  kpis: { progression: 35, modulesCompleted: 7, modulesTotal: 20, prochainRDV: 'Demain', scoreBP: null },
  activities: [
    { id: '1', action: 'Module RIASEC complété', detail: 'Votre profil est disponible dans Parcours > RIASEC', time: 'Il y a 2 heures', icon: 'check', color: 'text-green-500' },
    { id: '2', action: 'Premier brouillon enregistré', detail: 'Mon projet — Boulangerie artisanale', time: 'Hier', icon: 'file', color: 'text-primary' },
    { id: '3', action: 'Rendez-vous planifié', detail: 'GIDEF Paris — Mercredi 14h', time: 'Il y a 2 jours', icon: 'calendar', color: 'text-coral-500' },
  ],
  appointments: [
    { id: '1', title: 'RDV Conseiller', description: 'Suivi de projet — GIDEF Paris', date: 'Mercredi 14:00', type: 'Physique' },
    { id: '2', title: 'Atelier Marketing', description: 'Webinaire — Stratégie réseaux sociaux', date: 'Vendredi 10:00', type: 'En ligne' },
  ],
}

const ACTIVITY_ICON_MAP: Record<string, typeof CheckCircle2> = {
  check: CheckCircle2,
  file: FileText,
  calendar: Calendar,
  trending: TrendingUp,
}

function useDashboardData() {
  const { data, loading, isFallback, setData } = useApiData<DashboardApiResponse>({
    url: '/api/dashboard',
    fallback: FALLBACK_DASHBOARD,
  })
  return { data, loading, isFallback, setData }
}

/* ─── Dashboard Component ─── */
export function Dashboard() {
  const { userName, setSection, setModule } = useBureauStore()
  const { data: dashboardData, loading, isFallback } = useDashboardData()

  const handleQuickAction = (section: 'parcours' | 'strategie', module: string) => {
    setSection(section)
    setModule(module)
  }

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }, [])

  // Build dynamic KPIs from API data or fallback
  const dynamicKpis = useMemo(() => {
    const k = dashboardData.kpis
    return [
      { label: 'Progression parcours', value: String(k.progression), suffix: '%', icon: TrendingUp, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/30', progress: k.progression },
      { label: 'Modules complétés', value: String(k.modulesCompleted), suffix: `/${k.modulesTotal}`, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', progress: Math.round((k.modulesCompleted / k.modulesTotal) * 100) },
      { label: 'Prochain RDV', value: k.prochainRDV || '--', suffix: '', icon: Calendar, color: 'text-coral-500', bg: 'bg-coral-50 dark:bg-coral-900/20', progress: null },
      { label: 'Score Business Plan', value: k.scoreBP != null ? String(k.scoreBP) : '--', suffix: k.scoreBP != null ? '%' : '', icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', progress: k.scoreBP },
    ]
  }, [dashboardData.kpis])

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        {/* Skeleton banner */}
        <SkeletonPulse className="h-40 rounded-2xl" />
        {/* Skeleton KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        {/* Skeleton pipeline */}
        <SkeletonPulse className="h-64 rounded-xl" />
        {/* Skeleton actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 md:p-6 lg:p-8"
    >
      {/* Welcome banner */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl gradient-teal p-6 md:p-8 text-white">
          {isFallback && (
            <div className="absolute top-3 right-3 z-10">
              <DemoBadge />
            </div>
          )}
          {/* Background decoration */}
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                {greeting}, {userName} 👋
              </h1>
              <p className="mt-1 text-sm text-white/80 md:text-base">
                Continuez votre parcours entrepreneurial. Vous avez accompli {dashboardData.kpis.progression}% de votre objectif.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
                onClick={() => useBureauStore.getState().setSection('parcours')}
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                Reprendre
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {dynamicKpis.map((kpi) => (
          <Card key={kpi.label} className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', kpi.bg)}>
                  <kpi.icon className={cn('h-5 w-5', kpi.color)} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">
                  {kpi.value}
                  <span className="text-sm font-normal text-muted-foreground ml-0.5">{kpi.suffix}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
              </div>
              {kpi.progress !== null && (
                <Progress value={kpi.progress} className="mt-2 h-1.5" />
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Pipeline Kanban */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Pipeline de création</h2>
          <Badge variant="secondary" className="text-xs">
            Étape 2/4 — Structurer
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
                  stage.status === 'locked' && 'opacity-60'
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
                      <span className="flex h-2 w-2">
                        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                    )}
                    {stage.status === 'locked' && (
                      <span className="text-xs text-muted-foreground">🔒</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ul className="space-y-1.5">
                    {stage.tasks.map((task) => {
                      const isActive = 'activeTasks' in stage && (stage.activeTasks as string[])?.includes(task)
                      const isDone = stage.status === 'done'
                      return (
                        <li key={task} className="flex items-center gap-2 text-xs">
                          {isDone ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                          ) : isActive ? (
                            <div className="h-3 w-3 rounded-full border-2 border-primary shrink-0" />
                          ) : (
                            <div className="h-3 w-3 rounded-full border border-neutral-300 dark:border-neutral-600 shrink-0" />
                          )}
                          <span className={cn(
                            isDone && 'line-through text-muted-foreground',
                            isActive && 'text-foreground font-medium',
                            !isDone && !isActive && 'text-muted-foreground'
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

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Actions rapides</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <motion.div
              key={action.label}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
                onClick={() => handleQuickAction(action.section, action.module)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', action.color)}>
                    <action.icon className={cn('h-5 w-5', action.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom grid: Activity + Appointments */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold">Activité récente</CardTitle>
              {isFallback && <DemoBadge />}
            </div>
            <CardDescription>Vos dernières actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.activities.map((activity) => {
                const ActivityIcon = activity.icon ? (ACTIVITY_ICON_MAP[activity.icon] ?? CheckCircle2) : CheckCircle2
                return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <ActivityIcon className={cn('h-4 w-4', activity.color ?? 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.detail}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming appointments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold">Prochains rendez-vous</CardTitle>
              {isFallback && <DemoBadge />}
            </div>
            <CardDescription>Calendrier à venir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center gap-4 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{appt.title}</p>
                    <p className="text-xs text-muted-foreground">{appt.description}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <Badge variant="secondary" className="text-[10px]">
                      {appt.type}
                    </Badge>
                    <span className="mt-1 text-xs text-muted-foreground">{appt.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
