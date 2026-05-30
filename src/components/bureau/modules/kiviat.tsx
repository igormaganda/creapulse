'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Pentagon,
  Save,
  Loader2,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  Target,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Zap,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/zustand/store'
import { useBureauStore } from '../bureau-store'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type DimensionKey =
  | 'creativite'
  | 'leadership'
  | 'gestion_financiere'
  | 'communication'
  | 'resolution_problemes'
  | 'perseverance'
  | 'adaptabilite'
  | 'organisation'

interface DimensionDef {
  key: DimensionKey
  label: string
  icon: string
  color: string
  bgLight: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const STORAGE_KEY = 'creapulse-kiviat'

const DIMENSIONS: DimensionDef[] = [
  { key: 'creativite', label: 'Créativité', icon: '💡', color: '#FF6B35', bgLight: 'bg-orange-50 dark:bg-orange-900/20' },
  { key: 'leadership', label: 'Leadership', icon: '👑', color: '#00838F', bgLight: 'bg-teal-50 dark:bg-teal-900/20' },
  { key: 'gestion_financiere', label: 'Gestion financière', icon: '💰', color: '#22C55E', bgLight: 'bg-green-50 dark:bg-green-900/20' },
  { key: 'communication', label: 'Communication', icon: '🗣️', color: '#3B82F6', bgLight: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'resolution_problemes', label: 'Résolution problèmes', icon: '🧩', color: '#A855F7', bgLight: 'bg-purple-50 dark:bg-purple-900/20' },
  { key: 'perseverance', label: 'Persévérance', icon: '🔥', color: '#EF4444', bgLight: 'bg-red-50 dark:bg-red-900/20' },
  { key: 'adaptabilite', label: 'Adaptabilité', icon: '🔄', color: '#F59E0B', bgLight: 'bg-amber-50 dark:bg-amber-900/20' },
  { key: 'organisation', label: 'Organisation', icon: '📋', color: '#6366F1', bgLight: 'bg-indigo-50 dark:bg-indigo-900/20' },
]

const DEFAULT_SCORES: Record<DimensionKey, number> = {
  creativite: 5,
  leadership: 5,
  gestion_financiere: 5,
  communication: 5,
  resolution_problemes: 5,
  perseverance: 5,
  adaptabilite: 5,
  organisation: 5,
}

// ────────────────────────────────────────────
// Profile interpretation logic
// ────────────────────────────────────────────

function getProfileInterpretation(scores: Record<DimensionKey, number>): {
  label: string
  description: string
  color: string
  strengths: string[]
  areas: string[]
} {
  const entries = Object.entries(scores) as [DimensionKey, number][]
  const sorted = [...entries].sort(([, a], [, b]) => b - a)
  const top = sorted[0]
  const bottom = sorted[sorted.length - 1]
  const avg = entries.reduce((s, [, v]) => s + v, 0) / entries.length

  const dimMap: Record<DimensionKey, {
    label: string
    high: string
    low: string
  }> = {
    creativite: {
      label: 'Créatif',
      high: 'Votre esprit créatif est un atout majeur pour innover et vous différencier sur votre marché.',
      low: 'Développer votre créativité vous aidera à trouver des solutions originales.',
    },
    leadership: {
      label: 'Leader',
      high: 'Vos capacités de leadership vous permettent de mobiliser et inspirer votre équipe.',
      low: 'Renforcer votre leadership facilitera la prise de décision et la gestion d\'équipe.',
    },
    gestion_financiere: {
      label: 'Gestionnaire',
      high: 'Votre sens de la gestion financière est un pilier solide pour la pérennité de votre entreprise.',
      low: 'Améliorer votre gestion financière est essentiel pour la survie de votre entreprise.',
    },
    communication: {
      label: 'Communicant',
      high: 'Votre aisance en communication vous aide à convaincre et fédérer autour de votre projet.',
      low: 'Renforcer votre communication vous permettra de mieux vendre votre projet.',
    },
    resolution_problemes: {
      label: 'Stratège',
      high: 'Votre capacité à résoudre les problèmes vous rend résilient face aux défis entrepreneuriaux.',
      low: 'Développer cette compétence vous aidera à surmonter les obstacles avec plus d\'aisance.',
    },
    perseverance: {
      label: 'Persévérant',
      high: 'Votre persévérance est la clé de votre réussite entrepreneuriale.',
      low: 'Cultiver la persévérance vous aidera à traverser les moments difficiles.',
    },
    adaptabilite: {
      label: 'Adaptable',
      high: 'Votre adaptabilité vous permet de pivoter rapidement face aux changements du marché.',
      low: 'L\'adaptabilité est cruciale dans un environnement entrepreneurial en constante évolution.',
    },
    organisation: {
      label: 'Organisateur',
      high: 'Votre sens de l\'organisation garantit une exécution méthodique et efficace.',
      low: 'Mieux vous organiser vous fera gagner en productivité et en sérénité.',
    },
  }

  const topInfo = dimMap[top[0]]
  const bottomInfo = dimMap[bottom[0]]

  const strengths: string[] = []
  const areas: string[] = []

  sorted.forEach(([key, val]) => {
    const info = dimMap[key]
    if (val >= 7) {
      strengths.push(`${info.label} (${val}/10)`)
    } else if (val <= 4) {
      areas.push(`${info.label} (${val}/10)`)
    }
  })

  let label: string
  let color: string
  let description: string

  if (avg >= 8) {
    label = 'Profil Entrepreneurial Complet'
    color = 'text-green-600 dark:text-green-400'
    description = 'Vous possédez un ensemble de compétences exceptionnellement équilibré. Vous êtes prêt(e) à relever tous les défis de la création d\'entreprise.'
  } else if (avg >= 6) {
    label = 'Profil Prometteur'
    color = 'text-primary'
    description = `Votre profil entrepreneurial est solide avec des points forts en ${topInfo.label.toLowerCase()}. ${bottomInfo.low}`
  } else if (avg >= 4) {
    label = 'Profil en Développement'
    color = 'text-amber-600 dark:text-amber-400'
    description = `Vous avez un bon potentiel, particulièrement en ${topInfo.label.toLowerCase()}. Concentrez-vous sur le développement de ${bottomInfo.label.toLowerCase()} pour renforcer votre profil.`
  } else {
    label = 'Profil Émergent'
    color = 'text-red-600 dark:text-red-400'
    description = 'Vous êtes en début de parcours entrepreneurial. Chaque compétence peut se développer avec de la formation et de la pratique.'
  }

  if (top[1] >= 7 && topInfo) {
    description += ` Votre double force en ${topInfo.label.toLowerCase()} et ${dimMap[sorted[1][0]].label.toLowerCase()} est un excellent point de départ.`
  }

  return { label, description, color, strengths, areas }
}

// ────────────────────────────────────────────
// Custom Tooltip for RadarChart
// ────────────────────────────────────────────

function CustomRadarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fullMark: number } }> }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0]
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{d.name}</p>
      <p className="text-xs text-muted-foreground">{d.value} / {d.payload.fullMark}</p>
    </div>
  )
}

// ────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────

export function KiviatModule() {
  const [scores, setScores] = useState<Record<DimensionKey, number>>(DEFAULT_SCORES)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [hasLoaded, setHasLoaded] = useState(false)
  const token = useAuthStore((s) => s.token)

  // ── Load saved data ──
  useEffect(() => {
    async function loadKiviat() {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.scores) {
            setScores(parsed.scores)
            setLoading(false)
            if (token) fetchFromApi()
            return
          }
        } catch { /* ignore */ }
      }
      if (token) {
        await fetchFromApi()
      } else {
        setLoading(false)
      }
    }

    async function fetchFromApi() {
      try {
        const res = await fetch('/api/kiviat', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data && json.data.length > 0) {
            const loaded: Record<string, number> = {}
            json.data.forEach((r: { category: string; score: number }) => {
              loaded[r.category] = r.score
            })
            const merged = { ...DEFAULT_SCORES }
            for (const key of Object.keys(DEFAULT_SCORES) as DimensionKey[]) {
              if (loaded[key]) merged[key] = loaded[key]
            }
            setScores(merged)
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ scores: merged }))
            setHasLoaded(true)
          }
        }
      } catch { /* silent */ }
      setLoading(false)
    }

    loadKiviat()
  }, [token])

  // ── Auto-save to localStorage ──
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ scores }))
    }
  }, [scores, loading])

  // ── Update score ──
  const updateScore = useCallback((key: DimensionKey, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }))
  }, [])

  // ── Save to API ──
  const handleSave = async () => {
    if (!token) {
      toast.error('Vous devez être connecté(e) pour sauvegarder')
      return
    }
    setSaveStatus('saving')
    try {
      const results = DIMENSIONS.map((d) => ({
        category: d.key,
        score: scores[d.key],
      }))
      const res = await fetch('/api/kiviat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ results }),
      })
      if (res.ok) {
        setSaveStatus('saved')
        toast.success('Résultats Kiviat sauvegardés !')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
        toast.error('Erreur lors de la sauvegarde')
      }
    } catch {
      setSaveStatus('error')
      toast.error('Erreur réseau')
    }
  }

  // ── Computed values ──
  const globalAverage = useMemo(() => {
    const vals = Object.values(scores)
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
  }, [scores])

  const interpretation = useMemo(() => getProfileInterpretation(scores), [scores])

  const chartData = useMemo(() =>
    DIMENSIONS.map((d) => ({
      dimension: d.label,
      score: scores[d.key],
      fullMark: 10,
      key: d.key,
    })),
    [scores]
  )

  const sortedDimensions = useMemo(() =>
    [...DIMENSIONS].sort((a, b) => scores[b.key] - scores[a.key]),
    [scores]
  )

  if (loading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto w-full space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto w-full space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Pentagon className="h-5 w-5 text-primary" />
            </div>
            Test Kiviat
          </h1>
          <p className="mt-1 text-muted-foreground">
            Évaluez vos compétences entrepreneuriales sur 8 dimensions
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="gap-2 rounded-full"
          size="sm"
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveStatus === 'saved' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveStatus === 'saving' ? 'Sauvegarde...' : saveStatus === 'saved' ? 'Sauvegardé !' : 'Sauvegarder'}
        </Button>
      </div>

      {/* Global Average */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-none shadow-sm bg-muted/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Score global moyen</p>
              <p className="text-xs text-muted-foreground">
                Moyenne des 8 dimensions
              </p>
            </div>
            <div className="text-right">
              <span className={cn(
                'text-2xl font-bold',
                globalAverage >= 7 ? 'text-green-600 dark:text-green-400' :
                globalAverage >= 5 ? 'text-primary' :
                'text-amber-600 dark:text-amber-400'
              )}>
                {globalAverage}
              </span>
              <span className="text-sm text-muted-foreground"> / 10</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Radar Chart + Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Radar des compétences
              </CardTitle>
              <CardDescription>Ajustez les curseurs pour évaluer chaque dimension</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="w-full aspect-square max-w-[350px] mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 10]}
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                      tickCount={6}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#00838F"
                      fill="#00838F"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Tooltip content={<CustomRadarTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sliders */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-none shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Évaluation par dimension</CardTitle>
              <CardDescription>Scorez-vous de 1 (faible) à 10 (excellent)</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-5 max-h-[500px] overflow-y-auto pr-1">
              {DIMENSIONS.map((dim, idx) => (
                <motion.div
                  key={dim.key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + idx * 0.05 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{dim.icon}</span>
                      <span className="text-sm font-medium text-foreground">{dim.label}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs font-bold min-w-[3rem] justify-center',
                        scores[dim.key] >= 7 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        scores[dim.key] >= 4 ? 'bg-primary/10 text-primary' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      )}
                    >
                      {scores[dim.key]}/10
                    </Badge>
                  </div>
                  <Slider
                    value={[scores[dim.key]]}
                    onValueChange={(val) => updateScore(dim.key, val[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Profile Interpretation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Interprétation du profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Profile label */}
            <div className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl',
              'bg-muted/50'
            )}>
              <Lightbulb className={cn('h-5 w-5', interpretation.color)} />
              <span className={cn('font-semibold', interpretation.color)}>
                {interpretation.label}
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {interpretation.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Points forts
                </h4>
                {interpretation.strengths.length > 0 ? (
                  <div className="space-y-1.5">
                    {interpretation.strengths.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Continuez à développer vos compétences pour identifier vos points forts.
                  </p>
                )}
              </div>

              {/* Areas to improve */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Axes d&apos;amélioration
                </h4>
                {interpretation.areas.length > 0 ? (
                  <div className="space-y-1.5">
                    {interpretation.areas.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">{a}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucune compétence faible détectée. Excellent équilibre !
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Score breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Classement des dimensions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {sortedDimensions.map((dim, idx) => (
              <div key={dim.key} className="flex items-center gap-3">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0',
                  idx < 3 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {idx + 1}
                </div>
                <span className="text-base shrink-0">{dim.icon}</span>
                <span className="text-sm font-medium text-foreground min-w-[130px]">{dim.label}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(scores[dim.key] / 10) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.7 + idx * 0.05, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: dim.color }}
                  />
                </div>
                <span className="text-sm font-bold text-muted-foreground min-w-[2.5rem] text-right">
                  {scores[dim.key]}/10
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Loaded indicator */}
      {hasLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Badge variant="secondary" className="text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Résultats précédents chargés
          </Badge>
        </motion.div>
      )}

      {/* Pépites Game CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-none shadow-sm bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/10 dark:to-amber-800/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 shrink-0">
              <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Pépites Game — CréaScope</p>
              <p className="text-xs text-muted-foreground">
                Identifiez vos soft skills avec le jeu de cartes interactif et alimentez automatiquement ce radar.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0 rounded-full"
              onClick={() => {
                const store = useBureauStore.getState()
                store.setSection('parcours')
                store.setModule('pepites')
              }}
            >
              <Layers className="h-4 w-4" />
              Jouer
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default KiviatModule
