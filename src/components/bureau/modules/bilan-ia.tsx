'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  User,
  Lightbulb,
  Eye,
  FlaskConical,
  Pentagon,
  ArrowRight,
  Download,
  Shield,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/zustand/store'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface BilanData {
  parcours: {
    profil: {
      firstName: string | null
      lastName: string | null
      email: string
      employmentStatus: string | null
      educationLevel: string | null
      skills: string[]
      creationMotivation: string | null
      previousExperience: boolean | null
      availableTimePerWeek: number | null
      rqthStatus: boolean
      supportNeeds: string[]
      completionPercent: number
    }
    projet: {
      projectTitle: string | null
      projectSector: string | null
      projectStage: string | null
      targetAudience: string | null
      valueProposition: string | null
      completionPercent: number
    }
    vision: {
      visionStatement: string | null
      objectivesCount: number
      coreValues: string[]
      milestonesCount: number
      motivation: string | null
      completionPercent: number
    }
    riasec: {
      completed: boolean
      scores: Record<string, { score: number; isDominant: boolean }>
      dominantTypes: string[]
      totalScore: number
      moduleScore: number
    }
    kiviat: {
      completed: boolean
      scores: Record<string, number>
      average: number
      strengths: string[]
      weaknesses: string[]
      moduleScore: number
    }
    bilanSaved: boolean
  }
  bilan: {
    synthesis: string
    coherenceAnalysis: string
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    priorityActions: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }>
    globalScore: number
    globalScoreLabel: string
  } | null
  localScore: number
  localScoreLabel: string
  generatedAt: string | null
}

type GenerateStatus = 'idle' | 'loading' | 'done' | 'error'

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const RIASEC_LABELS: Record<string, string> = {
  R: 'Réaliste',
  I: 'Investigateur',
  A: 'Artistique',
  S: 'Social',
  E: 'Entreprenant',
  C: 'Conventionnel',
}

const KIVIAT_LABELS: Record<string, string> = {
  creativite: 'Créativité',
  leadership: 'Leadership',
  gestion_financiere: 'Gestion fin.',
  communication: 'Communication',
  resolution_problemes: 'Résolution pb.',
  perseverance: 'Persévérance',
  adaptabilite: 'Adaptabilité',
  organisation: 'Organisation',
}

const PRIORITY_CONFIG = {
  high: { label: 'Haute', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  medium: { label: 'Moyenne', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  low: { label: 'Basse', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
}

// ────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────

export function BilanIA() {
  const [data, setData] = useState<BilanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generateStatus, setGenerateStatus] = useState<GenerateStatus>('idle')
  const [activeSection, setActiveSection] = useState<'overview' | 'synthesis' | 'details'>('overview')
  const token = useAuthStore((s) => s.token)

  // ── Load data ──
  useEffect(() => {
    async function loadBilan() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch('/api/bilan', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setData(json.data)
            if (json.data.bilan) {
              setGenerateStatus('done')
            }
          }
        }
      } catch { /* silent */ }
      setLoading(false)
    }
    loadBilan()
  }, [token])

  // ── Generate bilan ──
  const handleGenerate = useCallback(async () => {
    if (!token) {
      toast.error('Vous devez être connecté(e) pour générer votre bilan')
      return
    }
    setGenerateStatus('loading')
    try {
      const res = await fetch('/api/bilan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
          setGenerateStatus('done')
          setActiveSection('synthesis')
          toast.success('Bilan IA généré avec succès !')
        } else {
          const errData = json.error
          toast.error(errData?.message || 'Erreur lors de la génération')
          setGenerateStatus('error')
        }
      } else {
        setGenerateStatus('error')
        toast.error('Erreur lors de la génération du bilan')
      }
    } catch {
      setGenerateStatus('error')
      toast.error('Erreur réseau')
    }
  }, [token])

  // ── Export bilan ──
  const handleExport = useCallback(() => {
    if (!data?.bilan) return
    const lines: string[] = []
    lines.push('═══════════════════════════════════════')
    lines.push('  BILAN IA — CreaPulse / GIDEF')
    lines.push(`  Généré le ${new Date().toLocaleDateString('fr-FR')}`)
    lines.push('═══════════════════════════════════════')
    lines.push('')
    lines.push(`Score global : ${data.bilan.globalScore}/100 — ${data.bilan.globalScoreLabel}`)
    lines.push('')
    lines.push('── SYNTHÈSE ──')
    lines.push(data.bilan.synthesis)
    lines.push('')

    if (data.bilan.coherenceAnalysis) {
      lines.push('── COHÉRENCE PROFIL / PROJET ──')
      lines.push(data.bilan.coherenceAnalysis)
      lines.push('')
    }

    lines.push('── POINTS FORTS ──')
    data.bilan.strengths.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`))
    lines.push('')

    lines.push('── AXES D\'AMÉLIORATION ──')
    data.bilan.weaknesses.forEach((w, i) => lines.push(`  ${i + 1}. ${w}`))
    lines.push('')

    lines.push('── RECOMMANDATIONS ──')
    data.bilan.recommendations.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`))
    lines.push('')

    lines.push('── ACTIONS PRIORITAIRES ──')
    data.bilan.priorityActions.forEach((a) => {
      const prio = PRIORITY_CONFIG[a.priority]
      lines.push(`  [${prio.label}] ${a.title}`)
      lines.push(`    ${a.description}`)
      lines.push('')
    })

    lines.push('═══════════════════════════════════════')

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bilan-ia-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Bilan exporté !')
  }, [data])

  // ── Compute ──
  const globalScore = data?.bilan?.globalScore || data?.localScore || 0
  const globalLabel = data?.bilan?.globalScoreLabel || data?.localScoreLabel || 'Profil Émergent'

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto w-full space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto w-full space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-600 shadow-md">
              <Brain className="h-5 w-5 text-white" />
            </div>
            Bilan IA
          </h1>
          <p className="mt-1 text-muted-foreground">
            Synthèse intelligente de votre parcours entrepreneurial
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.bilan && (
            <Button variant="outline" onClick={handleExport} className="gap-2 rounded-full" size="sm">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generateStatus === 'loading'}
            className={cn(
              'gap-2 rounded-full',
              !data?.bilan && 'shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30'
            )}
            size="sm"
          >
            {generateStatus === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : data?.bilan ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generateStatus === 'loading'
              ? 'Analyse en cours...'
              : data?.bilan
                ? 'Régénérer'
                : 'Générer mon bilan IA'}
          </Button>
        </div>
      </div>

      {/* Module completion overview */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-none shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Avancement du parcours</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Profil', icon: User, pct: data?.parcours.profil.completionPercent || 0 },
                { label: 'Projet', icon: Lightbulb, pct: data?.parcours.projet.completionPercent || 0 },
                { label: 'Vision', icon: Eye, pct: data?.parcours.vision.completionPercent || 0 },
                { label: 'RIASEC', icon: FlaskConical, pct: data?.parcours.riasec.completed ? 100 : 0 },
                { label: 'Kiviat', icon: Pentagon, pct: data?.parcours.kiviat.completed ? 100 : 0 },
              ].map((mod) => (
                <div key={mod.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <mod.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{mod.label}</span>
                    </div>
                    <span className={cn(
                      'text-xs font-bold',
                      mod.pct >= 80 ? 'text-green-600' : mod.pct >= 40 ? 'text-amber-600' : 'text-muted-foreground'
                    )}>
                      {mod.pct}%
                    </span>
                  </div>
                  <Progress value={mod.pct} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Global Score Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-none shadow-md overflow-hidden">
          <div className={cn(
            'h-1.5',
            globalScore >= 70 ? 'bg-gradient-to-r from-green-500 to-teal-500' :
            globalScore >= 40 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
            'bg-gradient-to-r from-red-400 to-amber-500'
          )} />
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Score circle */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg width="130" height="130" viewBox="0 0 130 130">
                  <circle
                    cx="65" cy="65" r="55"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-muted/50"
                  />
                  <circle
                    cx="65" cy="65" r="55"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(globalScore / 100) * 345.6} 345.6`}
                    transform="rotate(-90 65 65)"
                    className={cn(
                      globalScore >= 70 ? 'text-teal-500' :
                      globalScore >= 40 ? 'text-amber-500' :
                      'text-red-500'
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn(
                    'text-3xl font-bold tabular-nums',
                    globalScore >= 70 ? 'text-teal-600 dark:text-teal-400' :
                    globalScore >= 40 ? 'text-amber-600 dark:text-amber-400' :
                    'text-red-600 dark:text-red-400'
                  )}>
                    {globalScore}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <h3 className="text-xl font-bold text-foreground">{globalLabel}</h3>
                <p className="text-sm text-muted-foreground">
                  {data?.bilan
                    ? 'Votre bilan personnalisé est prêt. Explorez la synthèse et les recommandations.'
                    : 'Complétez les modules de votre parcours puis générez votre bilan IA pour obtenir une synthèse personnalisée.'}
                </p>
                {!data?.bilan && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {(data?.parcours.riasec.completed ? [] : [{ l: 'Passer le RIASEC', p: 'high' }]).concat(
                      data?.parcours.kiviat.completed ? [] : [{ l: 'Passer le Kiviat', p: 'medium' }]
                    ).map((item, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {item.l}
                      </Badge>
                    ))}
                  </div>
                )}
                {data?.generatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Dernière génération : {new Date(data.generatedAt).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* No bilan state */}
      {!data?.bilan && generateStatus !== 'loading' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-none shadow-sm">
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Prêt pour votre bilan personnalisé ?
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                L&apos;IA CreaPulse analysera votre profil créateur, votre projet, votre vision et les résultats de vos tests RIASEC et Kiviat pour produire une synthèse sur mesure.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {[
                  { label: 'Profil', done: (data?.parcours.profil.completionPercent || 0) >= 50 },
                  { label: 'Projet', done: (data?.parcours.projet.completionPercent || 0) >= 50 },
                  { label: 'RIASEC', done: data?.parcours.riasec.completed },
                  { label: 'Kiviat', done: data?.parcours.kiviat.completed },
                ].map((mod) => (
                  <div key={mod.label} className="flex items-center gap-1.5">
                    {mod.done ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span className={cn('text-sm', mod.done ? 'text-foreground' : 'text-muted-foreground')}>
                      {mod.label}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generateStatus === 'loading'}
                className="gap-2 rounded-full shadow-md shadow-primary/20 mt-2"
                size="lg"
              >
                <Sparkles className="h-5 w-5" />
                Générer mon bilan IA
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading state */}
      {generateStatus === 'loading' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 space-y-4"
        >
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-primary/20 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground">Analyse en cours...</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            L&apos;IA analyse vos données de parcours pour générer votre bilan personnalisé. Cela peut prendre quelques secondes.
          </p>
        </motion.div>
      )}

      {/* Bilan Content */}
      <AnimatePresence mode="wait">
        {data?.bilan && generateStatus !== 'loading' && (
          <motion.div
            key="bilan-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Tab navigation */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
              {[
                { id: 'overview' as const, label: 'Vue d\'ensemble', icon: BarChart3 },
                { id: 'synthesis' as const, label: 'Synthèse IA', icon: Sparkles },
                { id: 'details' as const, label: 'Détails & Tests', icon: Target },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    activeSection === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Synthesis */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Synthèse
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{data.bilan.synthesis}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Coherence Analysis */}
                {data.bilan.coherenceAnalysis && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                        Cohérence profil / projet
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">{data.bilan.coherenceAnalysis}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Strengths / Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="border-none shadow-sm h-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Points forts ({data.bilan.strengths.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        {data.bilan.strengths.map((s, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-sm text-foreground">{s}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="border-none shadow-sm h-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Axes d&apos;amélioration ({data.bilan.weaknesses.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        {data.bilan.weaknesses.map((w, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="h-4 w-4 rounded-full bg-amber-200 dark:bg-amber-800 mt-0.5 shrink-0" />
                            <span className="text-sm text-foreground">{w}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Priority Actions */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Actions prioritaires
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {data.bilan.priorityActions.map((action, idx) => {
                        const prio = PRIORITY_CONFIG[action.priority]
                        return (
                          <div
                            key={idx}
                            className={cn(
                              'flex items-start gap-4 p-4 rounded-xl border-2',
                              prio.border,
                              'bg-background'
                            )}
                          >
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold shrink-0',
                              action.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              action.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            )}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-foreground">{action.title}</h4>
                                <Badge className={cn('text-[10px] px-1.5', prio.color)} variant="secondary">
                                  {prio.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Synthesis Tab */}
            {activeSection === 'synthesis' && (
              <div className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Analyse complète
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Synthèse</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-4">
                          {data.bilan.synthesis}
                        </p>
                      </div>

                      {data.bilan.coherenceAnalysis && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">Cohérence profil / projet</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-4">
                            {data.bilan.coherenceAnalysis}
                          </p>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          Recommandations personnalisées
                        </h4>
                        <div className="space-y-2">
                          {data.bilan.recommendations.map((r, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                              <Badge variant="outline" className="shrink-0 mt-0.5 text-xs font-bold">
                                {i + 1}
                              </Badge>
                              <span className="text-sm text-foreground">{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Details Tab */}
            {activeSection === 'details' && (
              <div className="space-y-6">
                {/* RIASEC Details */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FlaskConical className="h-5 w-5 text-purple-500" />
                          Résultats RIASEC
                        </CardTitle>
                        <Badge variant={data.parcours.riasec.completed ? 'default' : 'outline'}>
                          {data.parcours.riasec.completed ? 'Complété' : 'Non complété'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {data.parcours.riasec.completed ? (
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2 mb-4">
                            {data.parcours.riasec.dominantTypes.map((t) => (
                              <Badge key={t} className="text-sm" variant="secondary">
                                {RIASEC_LABELS[t] || t} ★
                              </Badge>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* RIASEC Radar */}
                            <div className="aspect-square max-w-[300px] mx-auto">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart
                                  data={Object.entries(data.parcours.riasec.scores).map(([k, v]) => ({
                                    dimension: RIASEC_LABELS[k] || k,
                                    score: v.score,
                                    fullMark: 25,
                                  }))}
                                  cx="50%" cy="50%" outerRadius="70%"
                                >
                                  <PolarGrid stroke="hsl(var(--border))" />
                                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                  <PolarRadiusAxis angle={90} domain={[0, 25]} tick={{ fontSize: 9 }} tickCount={6} />
                                  <Radar dataKey="score" stroke="#A855F7" fill="#A855F7" fillOpacity={0.15} strokeWidth={2} />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                            {/* Score bars */}
                            <div className="space-y-3">
                              {Object.entries(data.parcours.riasec.scores)
                                .sort(([, a], [, b]) => b.score - a.score)
                                .map(([type, val]) => (
                                  <div key={type} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className={cn('text-sm', val.isDominant && 'font-semibold text-foreground')}>
                                        {RIASEC_LABELS[type] || type}
                                        {val.isDominant && ' ★'}
                                      </span>
                                      <span className="text-sm font-bold text-muted-foreground">{val.score}/25</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(val.score / 25) * 100}%` }}
                                        transition={{ duration: 0.8 }}
                                        className="h-full rounded-full bg-purple-500"
                                      />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Passez le test RIASEC pour voir vos résultats détaillés ici.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Kiviat Details */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Pentagon className="h-5 w-5 text-teal-500" />
                          Résultats Kiviat
                        </CardTitle>
                        <Badge variant={data.parcours.kiviat.completed ? 'default' : 'outline'}>
                          {data.parcours.kiviat.completed ? 'Complété' : 'Non complété'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {data.parcours.kiviat.completed ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">Score moyen :</span>
                            <span className="text-lg font-bold text-primary">{data.parcours.kiviat.average}/10</span>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Kiviat Radar */}
                            <div className="aspect-square max-w-[300px] mx-auto">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart
                                  data={Object.entries(data.parcours.kiviat.scores).map(([k, v]) => ({
                                    dimension: KIVIAT_LABELS[k] || k,
                                    score: v,
                                    fullMark: 10,
                                  }))}
                                  cx="50%" cy="50%" outerRadius="70%"
                                >
                                  <PolarGrid stroke="hsl(var(--border))" />
                                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 8 }} tickCount={6} />
                                  <Radar dataKey="score" stroke="#00838F" fill="#00838F" fillOpacity={0.15} strokeWidth={2} />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                            {/* Score bars */}
                            <div className="space-y-3">
                              {Object.entries(data.parcours.kiviat.scores)
                                .sort(([, a], [, b]) => b - a)
                                .map(([cat, score]) => (
                                  <div key={cat} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm">{KIVIAT_LABELS[cat] || cat}</span>
                                      <span className={cn(
                                        'text-sm font-bold',
                                        score >= 7 ? 'text-green-600' : score >= 4 ? 'text-amber-600' : 'text-red-600'
                                      )}>{score}/10</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${score * 10}%` }}
                                        transition={{ duration: 0.8 }}
                                        className={cn(
                                          'h-full rounded-full',
                                          score >= 7 ? 'bg-green-500' : score >= 4 ? 'bg-amber-500' : 'bg-red-500'
                                        )}
                                      />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Passez le test Kiviat pour voir vos résultats détaillés ici.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Profil & Project Summary */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Profil summary */}
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Profil Créateur
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nom</span>
                          <span className="font-medium">{data.parcours.profil.firstName} {data.parcours.profil.lastName || ''}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Statut</span>
                          <span className="font-medium">{data.parcours.profil.employmentStatus || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Disponibilité</span>
                          <span className="font-medium">{data.parcours.profil.availableTimePerWeek || '?'}h/sem</span>
                        </div>
                        {data.parcours.profil.skills.length > 0 && (
                          <div className="pt-2">
                            <span className="text-muted-foreground">Compétences :</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {data.parcours.profil.skills.map((s) => (
                                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Project summary */}
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          Mon Projet
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Titre</span>
                          <span className="font-medium text-right max-w-[60%] truncate">{data.parcours.projet.projectTitle || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Secteur</span>
                          <span className="font-medium">{data.parcours.projet.projectSector || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stade</span>
                          <span className="font-medium">{data.parcours.projet.projectStage || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cible</span>
                          <span className="font-medium text-right max-w-[60%] truncate">{data.parcours.projet.targetAudience || '—'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Bottom actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-4"
            >
              <Button variant="outline" onClick={handleExport} className="gap-2 rounded-full">
                <Download className="h-4 w-4" />
                Exporter le bilan
              </Button>
              <Button onClick={handleGenerate} disabled={generateStatus === 'loading'} className="gap-2 rounded-full" variant="outline">
                <RefreshCw className={cn('h-4 w-4', generateStatus === 'loading' && 'animate-spin')} />
                Régénérer le bilan
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default BilanIA
