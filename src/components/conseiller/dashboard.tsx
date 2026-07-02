'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { authFetch } from '@/lib/auth-fetch'
import { useConseillerStore } from './conseiller-store'
import { Beneficiaire360Sheet } from './beneficiaire-360'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  MessageSquare,
  FileText,
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Eye,
  Sparkles,
  BarChart3,
  Target,
  RefreshCw,
  BookOpen,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

/* ─── Types ─── */

interface Kpis {
  beneficiairesActifs: number
  entretiensCeMois: number
  entretiensPrevus: number
  livrablesEnAttente: number
  progressionMoyenne: number
  nouveauxCeMois: number
}

interface ActivityItem {
  id: string
  type: 'entretien' | 'livrable' | 'alerte' | 'inscription'
  message: string
  time: string
}

interface UpcomingRdv {
  id: string
  beneficiary: string
  type: string
  date: string
  time: string
}

interface StatsData {
  kpis: Kpis
  activiteRecente: ActivityItem[]
  prochainsRdv: UpcomingRdv[]
  beneficiairesParPhase: Array<{ phase: string; count: number }>
  repartitionTypeEntretiens: Array<{ type: string; count: number; color: string }>
  repartitionStatut: Array<{ statut: string; count: number }>
}

/* ─── Helpers ─── */

const formatDate = (d: Date) =>
  d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function activityIcon(type: string) {
  switch (type) {
    case 'entretien': return { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' }
    case 'livrable': return { icon: FileText, color: 'text-primary bg-primary/10' }
    case 'alerte': return { icon: AlertCircle, color: 'text-amber-500 bg-amber-50' }
    case 'inscription': return { icon: UserPlus, color: 'text-primary bg-primary/10' }
    default: return { icon: Clock, color: 'text-muted-foreground bg-muted' }
  }
}

function appointmentTypeColor(type: string) {
  switch (type) {
    case 'Suivi': return 'bg-primary'
    case 'Bilan': return 'bg-coral-500'
    case 'Atelier': return 'bg-amber-500'
    default: return 'bg-muted-foreground'
  }
}

/* ─── KPI Card Skeleton ─── */

function KpiSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Activity Skeleton ─── */

function ActivitySkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-start gap-3 py-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          {i < 3 && <Separator />}
        </div>
      ))}
    </div>
  )
}

/* ─── PAA PROGRAM OVERVIEW (CSS bar chart) ─── */

function PAAOverview({
  beneficiairesParPhase,
  avgProgress,
  atelierRate,
  satisfaction,
}: {
  beneficiairesParPhase: Array<{ phase: string; count: number }>
  avgProgress: number
  atelierRate: number
  satisfaction: number
}) {
  const maxCount = Math.max(...beneficiairesParPhase.map((p) => p.count), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Programme PAA — Vue d&apos;ensemble
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {beneficiairesParPhase.reduce((s, p) => s + p.count, 0)} bénéficiaires
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mini KPIs row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-2xl font-bold text-primary">{avgProgress}%</p>
              <p className="text-xs text-muted-foreground mt-1">Progression moy.</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-2xl font-bold text-emerald-600">{atelierRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">Taux ateliers</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-2xl font-bold text-amber-600">{satisfaction}/5</p>
              <p className="text-xs text-muted-foreground mt-1">Satisfaction</p>
            </div>
          </div>

          {/* Bar chart: beneficiaries per phase */}
          {beneficiairesParPhase.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Répartition par phase</p>
              <div className="space-y-2">
                {beneficiairesParPhase.map((phase, i) => {
                  const width = Math.max(4, (phase.count / maxCount) * 100)
                  const barColors = [
                    'bg-amber-500', 'bg-primary', 'bg-primary',
                    'bg-coral-500', 'bg-emerald-500', 'bg-emerald-500', 'bg-purple-500',
                  ]
                  return (
                    <div key={phase.phase} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 text-right shrink-0 truncate">
                        {phase.phase}
                      </span>
                      <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ duration: 0.6, delay: 0.1 * i, ease: 'easeOut' }}
                          className={`h-full rounded-md ${barColors[i % barColors.length]}`}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground w-6 text-right shrink-0">
                        {phase.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée disponible</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ─── Dashboard Component ─── */

export function ConseillerDashboard() {
  const { conseillerName, setTab } = useConseillerStore()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vue360Open, setVue360Open] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/conseiller/stats')
      const json = await res.json()
      if (json.success) {
        setStats(json.data)
      } else {
        setError(json.error?.message || 'Erreur de chargement')
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const greetingHour = new Date().getHours()
  const greeting =
    greetingHour < 12 ? 'Bonjour' : greetingHour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const kpiCards = stats
    ? [
        {
          label: 'Bénéficiaires actifs',
          value: stats.kpis.beneficiairesActifs,
          icon: Users,
          color: 'text-primary',
          bg: 'bg-primary/10',
          change: `+${stats.kpis.nouveauxCeMois} ce mois`,
        },
        {
          label: 'Entretiens cette semaine',
          value: stats.kpis.entretiensPrevus,
          icon: MessageSquare,
          color: 'text-coral-500',
          bg: 'bg-coral-50',
          change: `${stats.kpis.entretiensCeMois} ce mois`,
        },
        {
          label: 'Livrables en attente',
          value: stats.kpis.livrablesEnAttente,
          icon: FileText,
          color: 'text-amber-500',
          bg: 'bg-amber-50',
          change: stats.kpis.livrablesEnAttente > 0 ? 'À reviewer' : 'Tout à jour',
        },
        {
          label: 'Progression moy. PAA',
          value: stats.kpis.progressionMoyenne,
          suffix: '%',
          icon: TrendingUp,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          change: stats.kpis.progressionMoyenne >= 50 ? 'Bonne progression' : 'À accélérer',
        },
        {
          label: 'Alertes inactivité',
          value: 0,
          icon: AlertTriangle,
          color: 'text-coral-500',
          bg: 'bg-coral-50',
          change: 'Aucune alerte',
          hidden: true,
        },
      ].filter((k) => !k.hidden)
    : []

  return (
    <div className="space-y-6">
      {/* Greeting banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-gradient-to-r from-[#1A1A2E] to-[#16213E] p-6 md:p-8 text-white"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {greeting}, {(conseillerName || '').split(' ')[0] || ''}
            </h1>
            <p className="mt-1 text-white/60 text-sm md:text-base">
              {formatDate(new Date())} — Voici un aperçu de votre activité
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/15 border-0 gap-1.5"
              onClick={() => setVue360Open(true)}
            >
              <Eye className="h-4 w-4" />
              Vue 360°
            </Button>
            <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/15 border-0">
              GIDEF Paris
            </Badge>
            <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/15 border-0">
              Conseiller Senior
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg border border-coral-200 bg-coral-50 p-4"
        >
          <AlertCircle className="h-5 w-5 text-coral-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-coral-800">Erreur de chargement</p>
            <p className="text-xs text-coral-600">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats} className="shrink-0">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Réessayer
          </Button>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <KpiSkeleton />
              </motion.div>
            ))
          : kpiCards.map((kpi, i) => {
              const Icon = kpi.icon
              return (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{kpi.label}</p>
                          <p className="mt-2 text-3xl font-bold text-foreground">
                            {kpi.value}
                            {'suffix' in kpi && kpi.suffix && (
                              <span className="text-xl text-muted-foreground">{kpi.suffix}</span>
                            )}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{kpi.change}</p>
                        </div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg}`}>
                          <Icon className={`h-5 w-5 ${kpi.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
      </div>

      {/* Two-column: Recent activity + Upcoming appointments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent Activity — 3 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-3"
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Activité récente</CardTitle>
                {stats && (
                  <Badge variant="secondary" className="text-xs">
                    {stats.activiteRecente.length} événements
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              {loading ? (
                <ActivitySkeleton />
              ) : stats && stats.activiteRecente.length > 0 ? (
                stats.activiteRecente.map((activity, i) => {
                  const { icon: ActivityIcon, color } = activityIcon(activity.type)
                  return (
                    <div key={activity.id}>
                      <div className="flex items-start gap-3 py-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                          <ActivityIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-snug">{activity.message}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.time}
                          </p>
                        </div>
                      </div>
                      {i < stats.activiteRecente.length - 1 && <Separator />}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="mt-2 text-sm text-muted-foreground">Aucune activité récente</p>
                </div>
              )}
            </CardContent>
            {!loading && stats && stats.activiteRecente.length > 0 && (
              <div className="px-6 pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-primary"
                  onClick={() => setTab('entretiens')}
                >
                  Voir tout
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Upcoming Appointments — 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Prochains RDV</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary"
                  onClick={() => setTab('planning')}
                >
                  Voir tout
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              {loading ? (
                <div className="space-y-0">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-3 py-3">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <div className="text-right space-y-1.5">
                          <Skeleton className="h-3 w-20 ml-auto" />
                          <Skeleton className="h-3 w-14 ml-auto" />
                        </div>
                      </div>
                      {i < 2 && <Separator />}
                    </div>
                  ))}
                </div>
              ) : stats && stats.prochainsRdv.length > 0 ? (
                stats.prochainsRdv.map((apt, i) => {
                  const initials = apt.beneficiary
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                  const colorClass = appointmentTypeColor(apt.type)
                  return (
                    <button
                      key={apt.id}
                      className="w-full text-left"
                      onClick={() => setTab('planning')}
                    >
                      <div className="flex items-center gap-3 py-3 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className={`${colorClass} text-white text-xs font-bold`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{apt.beneficiary}</p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              apt.type === 'Suivi'
                                ? 'border-primary/20 bg-primary/5 text-primary'
                                : apt.type === 'Bilan'
                                  ? 'border-coral-200 bg-coral-50 text-coral-600'
                                  : 'border-amber-200 bg-amber-50 text-amber-600'
                            }`}
                          >
                            {apt.type}
                          </Badge>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-foreground">{apt.date}</p>
                          <p className="text-xs text-muted-foreground">{apt.time}</p>
                        </div>
                      </div>
                      {i < stats.prochainsRdv.length - 1 && <Separator />}
                    </button>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="mt-2 text-sm text-muted-foreground">Aucun rendez-vous à venir</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-auto flex items-center gap-3 p-4 justify-start hover:bg-primary/5 hover:border-primary/30 transition-colors"
                onClick={() => setTab('entretiens')}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Planifier un entretien</p>
                  <p className="text-xs text-muted-foreground">Nouveau rendez-vous</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex items-center gap-3 p-4 justify-start hover:bg-coral-50 hover:border-coral-200 transition-colors"
                onClick={() => setTab('livrables')}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-50 shrink-0">
                  <FileText className="h-5 w-5 text-coral-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Voir les livrables</p>
                  <p className="text-xs text-muted-foreground">
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin inline" />
                    ) : stats ? (
                      `${stats.kpis.livrablesEnAttente} en attente`
                    ) : '—'}
                  </p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex items-center gap-3 p-4 justify-start hover:bg-amber-50 hover:border-amber-200 transition-colors"
                onClick={() => setTab('rapports')}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 shrink-0">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Rapport mensuel</p>
                  <p className="text-xs text-muted-foreground">Générer un rapport</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex items-center gap-3 p-4 justify-start hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                onClick={() => setVue360Open(true)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
                  <Eye className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Vue 360° Bénéficiaire</p>
                  <p className="text-xs text-muted-foreground">Parcours complet</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* PAA Program Overview */}
      {loading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-60" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 flex-1 rounded-md" />
                  <Skeleton className="h-4 w-6" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : stats ? (
        <PAAOverview
          beneficiairesParPhase={stats.beneficiairesParPhase}
          avgProgress={stats.kpis.progressionMoyenne}
          atelierRate={
            stats.repartitionTypeEntretiens.length > 0
              ? Math.round(
                  (stats.repartitionTypeEntretiens.find((t) => t.type === 'Atelier')?.count || 0) /
                    Math.max(stats.kpis.entretiensCeMois, 1) *
                    100
                )
              : 0
          }
          satisfaction={4.2}
        />
      ) : null}

      {/* 360° Beneficiary Sheet */}
      <Beneficiaire360Sheet
        open={vue360Open}
        onOpenChange={setVue360Open}
      />
    </div>
  )
}