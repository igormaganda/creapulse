'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  UserCheck,
  User,
  Mail,
  Phone,
  Star,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/auth-fetch'
import { toast } from 'sonner'

/* ─── Types ─── */
interface ConseillerInfo {
  name: string
  email: string
  phone: string
  specialty: string
  photoUrl?: string
}

interface Entretien {
  id: string
  date: string
  type: 'Entretien individuel' | 'Suivi PAA' | 'Point trimestriel'
  notes: string
  status: 'À venir' | 'Réalisé' | 'Annulé'
}

interface ProgressionData {
  engagement: number
  avancementParcours: number
  qualiteLivrables: number
  participationAteliers: number
  scoreGlobal: number
  trend: 'up' | 'down' | 'stable'
}

interface Conseiller360Data {
  conseiller: ConseillerInfo | null
  entretiens: Entretien[]
  progression: ProgressionData
}

/* ─── Mock data ─── */
const MOCK_DATA: Conseiller360Data = {
  conseiller: {
    name: 'Marie Dupont',
    email: 'marie.dupont@gidef.fr',
    phone: '06 12 34 56 78',
    specialty: 'Accompagnement à la création',
    photoUrl: undefined,
  },
  entretiens: [
    {
      id: '1',
      date: '2025-07-10T14:00:00',
      type: 'Entretien individuel',
      notes: 'Premier contact — présentation du parcours et objectifs du bénéficiaire.',
      status: 'Réalisé',
    },
    {
      id: '2',
      date: '2025-07-25T10:00:00',
      type: 'Suivi PAA',
      notes: 'Validation de l\'idée de projet et orientation vers les modules diagnostic.',
      status: 'Réalisé',
    },
    {
      id: '3',
      date: '2025-08-15T09:30:00',
      type: 'Point trimestriel',
      notes: 'Bilan des 3 premiers mois — avancement satisfaisant sur le business model.',
      status: 'Réalisé',
    },
    {
      id: '4',
      date: '2025-09-05T14:00:00',
      type: 'Suivi PAA',
      notes: 'Revue du business plan et préparation du pitch aux financeurs.',
      status: 'À venir',
    },
    {
      id: '5',
      date: '2025-09-20T11:00:00',
      type: 'Entretien individuel',
      notes: 'Point sur les démarches juridiques et statut social.',
      status: 'À venir',
    },
    {
      id: '6',
      date: '2025-06-01T10:00:00',
      type: 'Entretien individuel',
      notes: 'Entretien annulé à la demande du bénéficiaire.',
      status: 'Annulé',
    },
  ],
  progression: {
    engagement: 78,
    avancementParcours: 62,
    qualiteLivrables: 85,
    participationAteliers: 70,
    scoreGlobal: 74,
    trend: 'up',
  },
}

/* ─── Helpers ─── */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'À venir':
      return { icon: Clock, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' }
    case 'Réalisé':
      return { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' }
    case 'Annulé':
      return { icon: XCircle, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' }
    default:
      return { icon: AlertCircle, color: 'text-muted-foreground bg-muted border-border' }
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'Entretien individuel':
      return User
    case 'Suivi PAA':
      return Star
    case 'Point trimestriel':
      return Calendar
    default:
      return MessageSquare
  }
}

/* ─── Circular Progress ─── */
function CircularProgress({ value, trend, size = 120 }: { value: number; trend: string; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-amber-500'
  const trendLabel = trend === 'up' ? '+5 pts' : trend === 'down' ? '-3 pts' : 'stable'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-emerald-100 dark:text-emerald-900/40"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className={cn('flex items-center gap-1', trendColor)}>
        <TrendIcon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{trendLabel}</span>
      </div>
    </div>
  )
}

/* ─── Radar Chart Data ─── */
function getRadarData(progression: ProgressionData) {
  return [
    { dimension: 'Engagement', value: progression.engagement, fullMark: 100 },
    { dimension: 'Avancement', value: progression.avancementParcours, fullMark: 100 },
    { dimension: 'Livrables', value: progression.qualiteLivrables, fullMark: 100 },
    { dimension: 'Ateliers', value: progression.participationAteliers, fullMark: 100 },
    { dimension: 'Score global', value: progression.scoreGlobal, fullMark: 100 },
  ]
}

/* ─── Loading skeleton ─── */
function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )
}

/* ─── Main Component ─── */
export function Conseiller360Module() {
  const [data, setData] = useState<Conseiller360Data | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Try localStorage first
      const localRaw = localStorage.getItem('creapulse-conseiller-360')
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw)
          setData(parsed)
          setLoading(false)
        } catch {
          // fall through to API / mock
        }
      }

      // Try API
      try {
        const res = await authFetch('/api/conseiller/beneficiaires')
        if (res.ok) {
          const json = await res.json()
          if (json) {
            setData(json)
            localStorage.setItem('creapulse-conseiller-360', JSON.stringify(json))
            setLoading(false)
            return
          }
        }
      } catch {
        // API not available, use mock/local
      }

      // Use mock data if nothing else
      const finalData = data || MOCK_DATA
      setData(finalData)
      localStorage.setItem('creapulse-conseiller-360', JSON.stringify(finalData))
    } catch (err) {
      console.error('Conseiller360: Failed to load data', err)
      setData(MOCK_DATA)
    } finally {
      setLoading(false)
    }
  }, [data])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return <LoadingSkeleton />
  if (!data) return null

  const radarData = getRadarData(data.progression)

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
          <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Mon Conseiller &amp; Suivi</h1>
          <p className="text-sm text-muted-foreground">Suivez votre relation avec votre conseiller et vos entretiens</p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 ml-auto shrink-0">
          Nouveau
        </Badge>
      </motion.div>

      {/* Top row: Conseiller info + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Section 1: Mon Conseiller ─── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Mon Conseiller
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.conseiller ? (
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Photo placeholder */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
                    {data.conseiller.photoUrl ? (
                      <img
                        src={data.conseiller.photoUrl}
                        alt={data.conseiller.name}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {data.conseiller.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-foreground">{data.conseiller.name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                      {data.conseiller.specialty}
                    </p>
                  </div>

                  <Separator />

                  <div className="w-full space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">{data.conseiller.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">{data.conseiller.phone}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                    onClick={() => {
                      if (data.conseiller?.email) {
                        window.open(`mailto:${data.conseiller.email}`, '_blank')
                      }
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contacter
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <UserCheck className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Aucun conseiller assigné</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Contactez votre centre pour être mis en relation.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Section 2: Historique des entretiens ─── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Historique des entretiens
              </CardTitle>
              <CardDescription>Vos rencontres passées et à venir avec votre conseiller</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto pr-1 space-y-0">
                {data.entretiens.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Calendar className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun entretien planifié</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-emerald-200 dark:bg-emerald-800" />

                    {data.entretiens.map((entretien, i) => {
                      const statusConfig = getStatusConfig(entretien.status)
                      const StatusIcon = statusConfig.icon
                      const TypeIcon = getTypeIcon(entretien.type)
                      const isFuture = new Date(entretien.date) > new Date()

                      return (
                        <motion.div
                          key={entretien.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * i }}
                          className="relative flex gap-4 pb-4 last:pb-0"
                        >
                          {/* Timeline dot */}
                          <div className="relative z-10 mt-1">
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full border-2',
                              statusConfig.color
                            )}>
                              <StatusIcon className="h-3.5 w-3.5" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">
                                {entretien.type}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn('text-[10px] px-1.5 py-0 border', statusConfig.color)}
                              >
                                {entretien.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                {formatDate(entretien.date)} à {formatTime(entretien.date)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {entretien.notes}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Section 3: Mes Progressions ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Mes Progressions
            </CardTitle>
            <CardDescription>
              Vue d&apos;ensemble de votre progression sur les 5 dimensions clés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Radar Chart */}
              <div className="md:col-span-2">
                <div className="w-full aspect-square max-w-md mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        tickCount={5}
                      />
                      <Radar
                        name="Progression"
                        dataKey="value"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Score summary */}
              <div className="flex flex-col items-center gap-6">
                <CircularProgress
                  value={data.progression.scoreGlobal}
                  trend={data.progression.trend}
                  size={130}
                />

                <div className="w-full space-y-3">
                  {[
                    { label: 'Engagement', value: data.progression.engagement },
                    { label: 'Avancement parcours', value: data.progression.avancementParcours },
                    { label: 'Qualité livrables', value: data.progression.qualiteLivrables },
                    { label: 'Participation ateliers', value: data.progression.participationAteliers },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-semibold text-foreground">{item.value}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}