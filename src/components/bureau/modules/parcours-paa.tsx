'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useBureauStore } from '@/components/bureau/bureau-store'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

import {
  CheckCircle2,
  Circle,
  Clock,
  Star,
  Target,
  ArrowRight,
  Rocket,
  Calendar,
  BookOpen,
  Users,
  BarChart3,
  RefreshCw,
  Play,
  Sparkles,
  Trophy,
  Timer,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────

type MilestoneStatus = 'done' | 'in_progress' | 'upcoming' | 'overdue'

interface Milestone {
  day: string
  label: string
  description: string
  status: MilestoneStatus
  completedAt?: string
  plannedDate?: string
}

interface AtelierSession {
  id: string
  title: string
  description: string
  completed: boolean
  completedAt?: string
  category: string
}

interface PAAProgram {
  id: string
  startDate: string
  status: 'active' | 'completed' | 'not_started'
  milestones: Milestone[]
  ateliers: AtelierSession[]
  objectifsCount: number
  objectifsAvgProgress: number
  satisfactionScore: number | null
  overallProgress: number
  daysRemaining: number
  daysElapsed: number
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
  label,
}: {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
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
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold text-foreground">{value}%</span>
        {label && (
          <span className="text-[9px] text-muted-foreground leading-tight">{label}</span>
        )}
      </div>
    </div>
  )
}

// ─── Loading Skeleton ──────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Milestone Status Helpers ──────────────────────────────

function getMilestoneIcon(status: MilestoneStatus) {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    case 'in_progress':
      return <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
    case 'overdue':
      return <Circle className="w-5 h-5 text-rose-400" />
    default:
      return <Circle className="w-5 h-5 text-muted-foreground/40" />
  }
}

function getMilestoneBadge(status: MilestoneStatus) {
  const config = {
    done: { label: 'Terminé', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    in_progress: { label: 'En cours', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    overdue: { label: 'En retard', className: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
    upcoming: { label: 'À venir', className: 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30' },
  }
  const c = config[status]
  return <Badge className={cn('text-[10px] px-2 py-0 border', c.className)}>{c.label}</Badge>
}

function getMilestoneLineClass(status: MilestoneStatus, isLast: boolean) {
  if (isLast) return ''
  if (status === 'done') return 'bg-emerald-500/40'
  if (status === 'in_progress') return 'bg-gradient-to-b from-amber-500/40 to-muted/20'
  return 'bg-muted/20'
}

// ─── Atelier Category Colors ──────────────────────────────

const ATELIER_CATEGORIES: Record<string, { color: string; icon: typeof BookOpen }> = {
  identite: { color: 'bg-purple-500/15 text-purple-400', icon: Users },
  marche: { color: 'bg-teal-500/15 text-teal-400', icon: BarChart3 },
  finance: { color: 'bg-amber-500/15 text-amber-400', icon: Target },
  operationnel: { color: 'bg-sky-500/15 text-sky-400', icon: Rocket },
  communication: { color: 'bg-rose-500/15 text-rose-400', icon: Sparkles },
  juridique: { color: 'bg-indigo-500/15 text-indigo-400', icon: BookOpen },
}

function getAtelierCategoryStyle(category: string) {
  return ATELIER_CATEGORIES[category] || ATELIER_CATEGORIES.identite
}

// ─── Default Program (when API returns no data) ──────────────

const DEFAULT_MILESTONES: Milestone[] = [
  { day: 'J0', label: 'Prise de contact', description: 'Démarrage du programme PAA', status: 'upcoming' },
  { day: 'J10', label: 'Entretien Diagnostic', description: 'Diagnostic entrepreneurial approfondi', status: 'upcoming' },
  { day: 'J10-J60', label: 'Ateliers thématiques', description: 'Minimum 3 ateliers parmi les 9 proposés', status: 'upcoming' },
  { day: 'J30', label: 'Entretien de Suivi', description: 'Point de progression à mi-parcours', status: 'upcoming' },
  { day: 'J60', label: 'Entretien de Conclusion', description: 'Bilan final du programme', status: 'upcoming' },
  { day: 'J90', label: 'Suivi post-programme', description: 'Accompagnement après la fin du programme', status: 'upcoming' },
]

const DEFAULT_ATELIERS: AtelierSession[] = [
  { id: 'a1', title: 'Identité entrepreneuriale', description: 'Clarifier votre vision et valeurs', completed: false, category: 'identite' },
  { id: 'a2', title: 'Étude de marché', description: 'Analyser votre environnement concurrentiel', completed: false, category: 'marche' },
  { id: 'a3', title: 'Business Model', description: 'Structurer votre modèle économique', completed: false, category: 'marche' },
  { id: 'a4', title: 'Plan financier', description: 'Construire vos prévisions financières', completed: false, category: 'finance' },
  { id: 'a5', title: 'Marketing digital', description: 'Définir votre stratégie de communication', completed: false, category: 'communication' },
  { id: 'a6', title: 'Juridique & Statuts', description: 'Choisir le bon statut juridique', completed: false, category: 'juridique' },
  { id: 'a7', title: 'Gestion opérationnelle', description: 'Organiser votre activité au quotidien', completed: false, category: 'operationnel' },
  { id: 'a8', title: 'Financement & Aides', description: 'Identifier les dispositifs de financement', completed: false, category: 'finance' },
  { id: 'a9', title: 'Pitch & Réseau', description: 'Préparer votre discours et développer votre réseau', completed: false, category: 'communication' },
]

// ─── Main Component ──────────────────────────────────────

export function ParcoursPaaModule() {
  const [program, setProgram] = useState<PAAProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const setModule = useBureauStore((s) => s.setModule)

  // Fetch program data on mount
  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const res = await fetch('/api/paa/program', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setProgram(json.data)
          }
        }
      } catch {
        // Silently fail — will show "start program" state
      } finally {
        setLoading(false)
      }
    }
    fetchProgram()
  }, [])

  // Derived data
  const milestones = program?.milestones || DEFAULT_MILESTONES
  const ateliers = program?.ateliers || DEFAULT_ATELIERS
  const overallProgress = program?.overallProgress || 0
  const daysRemaining = program?.daysRemaining ?? 60
  const objectifsCount = program?.objectifsCount || 0
  const objectifsAvgProgress = program?.objectifsAvgProgress || 0
  const satisfactionScore = program?.satisfactionScore
  const completedAteliers = ateliers.filter((a) => a.completed).length
  const hasProgram = program && program.status !== 'not_started'

  // Handle start program
  const handleStartProgram = async () => {
    setStarting(true)
    try {
      const res = await fetch('/api/paa/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setProgram(json.data)
          toast.success('Programme PAA démarré !', {
            description: 'Votre parcours de 60 jours commence maintenant.',
          })
        }
      }
    } catch {
      toast.error('Erreur', {
        description: 'Impossible de démarrer le programme. Réessayez plus tard.',
      })
    } finally {
      setStarting(false)
    }
  }

  // Navigation handlers
  const handleNavigateObjectifs = () => setModule('objectifs-smart')
  const handleNavigateSwot = () => setModule('swot')

  // Loading state
  if (loading) return <LoadingSkeleton />

  // No program state — show start button
  if (!hasProgram) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 md:p-6 space-y-6"
      >
        <motion.div variants={itemVariants}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">
                    Parcours PAA — Programme d&apos;Accompagnement à l&apos;Amorçage
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Programme structuré de 60 jours pour lancer votre projet entrepreneurial
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-teal-500/20 bg-teal-500/5">
            <CardContent className="flex flex-col items-center gap-6 py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-500/15">
                <Play className="h-10 w-10 text-teal-400" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Prêt à démarrer votre parcours PAA ?
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Le Programme d&apos;Accompagnement à l&apos;Amorçage vous guide sur 60 jours à travers
                  des entretiens, ateliers thématiques et suivis personnalisés.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-teal-400">6</p>
                  <p className="text-xs text-muted-foreground">Jalons clés</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-400">9</p>
                  <p className="text-xs text-muted-foreground">Ateliers thématiques</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-400">60</p>
                  <p className="text-xs text-muted-foreground">Jours de programme</p>
                </div>
              </div>
              <Button
                onClick={handleStartProgram}
                disabled={starting}
                size="lg"
                className="gap-2 bg-teal-600 hover:bg-teal-700"
              >
                {starting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                Démarrer mon programme PAA
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  // Active program view
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 space-y-6"
    >
      {/* ─── Header ─── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row items-start md:items-center gap-6"
      >
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  Parcours PAA — Programme d&apos;Accompagnement à l&apos;Amorçage
                </h1>
                {daysRemaining > 0 && (
                  <Badge className="bg-teal-500/15 text-teal-400 border-teal-500/30 text-[10px]">
                    <Timer className="w-3 h-3 mr-1" />
                    {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}
                  </Badge>
                )}
                {program?.status === 'completed' && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                    <Trophy className="w-3 h-3 mr-1" />
                    Terminé
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {program?.startDate
                  ? `Démarré le ${new Date(program.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Programme d\'accompagnement entrepreneurial structuré'}
                {' · '}
                {completedAteliers} atelier{completedAteliers > 1 ? 's' : ''} terminé{completedAteliers > 1 ? 's' : ''} sur {ateliers.length}
              </p>
            </div>
          </div>
        </div>

        <CircularProgress
          value={overallProgress}
          size={96}
          strokeWidth={7}
          label="Progression"
        />
      </motion.div>

      {/* ─── Quick Stats Row ─── */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15">
                <Calendar className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jours écoulés</p>
                <p className="text-xl font-bold text-foreground">{program?.daysElapsed || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15">
                <BookOpen className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ateliers</p>
                <p className="text-xl font-bold text-foreground">{completedAteliers}/{ateliers.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                <Target className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Objectifs SMART</p>
                <p className="text-xl font-bold text-foreground">{objectifsCount} ({objectifsAvgProgress}%)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15">
                <Star className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Satisfaction</p>
                <p className="text-xl font-bold text-foreground">
                  {satisfactionScore !== null ? `${satisfactionScore}/5` : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <Separator className="opacity-40" />

      {/* ─── Timeline Visualization ─── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-teal-400" />
              <CardTitle className="text-sm font-semibold">Jalons du Programme</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {milestones.map((milestone, index) => {
                const isLast = index === milestones.length - 1
                return (
                  <div key={milestone.day} className="flex gap-4">
                    {/* Left: timeline line + dot */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card z-10">
                        {getMilestoneIcon(milestone.status)}
                      </div>
                      {!isLast && (
                        <div className={cn('w-0.5 flex-1 min-h-[40px]', getMilestoneLineClass(milestone.status, isLast))} />
                      )}
                    </div>

                    {/* Right: content */}
                    <div className={cn('pb-6 flex-1', isLast && 'pb-0')}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-2 py-0 font-mono">
                          {milestone.day}
                        </Badge>
                        <p className="text-sm font-semibold text-foreground">{milestone.label}</p>
                        {getMilestoneBadge(milestone.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                      {milestone.completedAt && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Terminé le {new Date(milestone.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator className="opacity-40" />

      {/* ─── Ateliers Grid ─── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-foreground">Ateliers Thématiques</h3>
            <Badge
              className={cn(
                'text-[10px] px-2 py-0 border',
                completedAteliers >= 3
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              )}
            >
              {completedAteliers >= 3 ? 'Minimum atteint ✓' : `${completedAteliers}/3 minimum`}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ateliers.map((atelier) => {
            const catStyle = getAtelierCategoryStyle(atelier.category)
            const CatIcon = catStyle.icon
            return (
              <motion.div
                key={atelier.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={cn(
                    'h-full transition-all duration-200 hover:shadow-md',
                    atelier.completed
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-border'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        catStyle.color
                      )}>
                        <CatIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            'text-xs font-semibold truncate',
                            atelier.completed ? 'text-emerald-300' : 'text-foreground'
                          )}>
                            {atelier.title}
                          </p>
                          {atelier.completed && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {atelier.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      <Separator className="opacity-40" />

      {/* ─── Objectifs SMART Summary ─── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                  <Target className="h-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Objectifs SMART</p>
                  <p className="text-xs text-muted-foreground">
                    {objectifsCount} objectif{objectifsCount > 1 ? 's' : ''} défini{objectifsCount > 1 ? 's' : ''}
                    {objectifsCount > 0 && ` · Progression moyenne : ${objectifsAvgProgress}%`}
                  </p>
                </div>
              </div>
              {objectifsCount > 0 && (
                <div className="w-32">
                  <Progress value={objectifsAvgProgress} className="h-2" />
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleNavigateObjectifs}
              >
                Voir mes Objectifs SMART
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Satisfaction Score ─── */}
      {satisfactionScore !== null && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15">
                    <Star className="h-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Satisfaction</p>
                    <p className="text-xs text-muted-foreground">
                      Note moyenne des retours sur le programme
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-5 h-5',
                        i < Math.round(satisfactionScore)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-muted/30'
                      )}
                    />
                  ))}
                  <span className="text-lg font-bold text-foreground ml-2">{satisfactionScore}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── SWOT Action ─── */}
      <motion.div variants={itemVariants}>
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
                  <BarChart3 className="h-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Matrice SWOT</p>
                  <p className="text-xs text-muted-foreground">
                    Analysez vos forces, faiblesses, opportunités et menaces
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                onClick={handleNavigateSwot}
              >
                Voir ma Matrice SWOT
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Footer Info ─── */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center gap-2 py-4"
      >
        <p className="text-[11px] text-muted-foreground/60">
          Programme d&apos;Accompagnement à l&apos;Amorçage · 60 jours · Minimum 3 ateliers requis
        </p>
      </motion.div>
    </motion.div>
  )
}