'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  AlertTriangle,
  Save,
  Sparkles,
  Loader2,
  Info,
  Shield,
  Activity,
  TrendingDown,
  Heart,
  Lightbulb,
  Eye,
  Users,
  DollarSign,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/auth-fetch'

// ─── Types ──────────────────────────────────

interface Risk {
  id: string
  description: string
  probability: 'faible' | 'moyenne' | 'haute'
  impact: 'mineur' | 'modéré' | 'majeur'
  mitigation: string
}

interface Indicateur {
  id: string
  label: string
  unit: string
  seuilAlerte: string
}

interface ResilienceTip {
  title: string
  description: string
  icon: typeof AlertTriangle
}

interface GestionCriseData {
  risques: Risk[]
  indicateurs: Indicateur[]
}

// ─── Constants ──────────────────────────────

const DEFAULT_INDICATEURS: Indicateur[] = [
  { id: 'tresorerie', label: 'Trésorerie en jours', unit: 'jours', seuilAlerte: '< 30 jours' },
  { id: 'clients', label: 'Nombre de clients actifs', unit: 'clients', seuilAlerte: '< 3 clients' },
  { id: 'ca-mensuel', label: 'CA mensuel', unit: '€', seuilAlerte: '< 2 000 €' },
  { id: 'taux-marge', label: 'Taux de marge', unit: '%', seuilAlerte: '< 20%' },
  { id: 'dettes', label: 'Dettes fournisseurs', unit: '€', seuilAlerte: '> 5 000 €' },
]

const RESILIENCE_TIPS: ResilienceTip[] = [
  {
    title: 'Diversification des revenus',
    description: 'Ne dépendez pas d\'un seul client ou produit. Développez 2-3 sources de revenus complémentaires pour réduire la vulnérabilité.',
    icon: DollarSign,
  },
  {
    title: 'Réseau professionnel actif',
    description: 'Entretenez un réseau solide avant la crise. Les recommandations et opportunités viennent souvent du réseau en période difficile.',
    icon: Users,
  },
  {
    title: 'Formation continue',
    description: 'Investissez dans vos compétences. Un créateur adaptable et formé rebondit plus vite et attire de nouvelles opportunités.',
    icon: Lightbulb,
  },
  {
    title: 'Épargne de précaution',
    description: 'Constituez une réserve de 3 à 6 mois de charges fixes. C\'est votre filet de sécurité pour traverser les périodes difficiles.',
    icon: Shield,
  },
  {
    title: 'Suivi régulier des KPIs',
    description: 'Surveillez vos indicateurs clés chaque semaine. Détectez les signaux faibles avant qu\'ils ne deviennent des crises.',
    icon: BarChart3,
  },
  {
    title: 'Plan B documenté',
    description: 'Préparez un plan d\'action alternatif pour chaque risque identifié. En cas de crise, vous gagnerez un temps précieux.',
    icon: Eye,
  },
]

function createRisk(): Risk {
  return {
    id: crypto.randomUUID(),
    description: '',
    probability: 'moyenne',
    impact: 'modéré',
    mitigation: '',
  }
}

const PROBABILITY_COLORS = {
  faible: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300',
  moyenne: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300',
  haute: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300',
}

const IMPACT_COLORS = {
  mineur: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-300',
  modéré: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300',
  majeur: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300',
}

// ─── Helpers ────────────────────────────────

function InfoPopover({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-rose-600 hover:bg-rose-600/10 transition-colors shrink-0">
          <Info className="h-3.5 w-3.5" />
          <span className="sr-only">Aide</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-sm text-sm bg-popover border-border shadow-lg">
        <p className="text-muted-foreground leading-relaxed">{text}</p>
      </PopoverContent>
    </Popover>
  )
}

// ─── Main Component ─────────────────────────

export function GestionCriseModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [risques, setRisques] = useState<Risk[]>([createRisk()])
  const [indicateurs] = useState<Indicateur[]>(DEFAULT_INDICATEURS)
  const [aiSynthesis, setAiSynthesis] = useState('')

  // ─── Load data on mount ──────────────────
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('creapulse-gestion-crise')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.risques?.length) setRisques(parsed.risques)
          if (parsed.aiSynthesis) setAiSynthesis(parsed.aiSynthesis)
        } catch { /* ignore */ }
      }

      try {
        const res = await authFetch('/api/paa/ateliers', {
          method: 'POST',
          body: JSON.stringify({ action: 'get', atelierCode: 'gestion-crise' }),
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const d = json.data
            if (d.risques?.length) setRisques(d.risques)
            if (d.aiSynthesis) setAiSynthesis(d.aiSynthesis)
          }
        }
      } catch { /* ignore */ }

      setIsLoading(false)
    }
    load()
  }, [])

  // ─── Auto-save to localStorage ──────────
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('creapulse-gestion-crise', JSON.stringify({ risques, aiSynthesis }))
    }
  }, [isLoading, risques, aiSynthesis])

  // ─── Risk helpers ───────────────────────
  const addRisk = useCallback(() => {
    setRisques(prev => [...prev, createRisk()])
  }, [])

  const removeRisk = useCallback((id: string) => {
    setRisques(prev => prev.filter(r => r.id !== id))
  }, [])

  const updateRisk = useCallback((id: string, field: keyof Risk, value: string) => {
    setRisques(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }, [])

  // ─── Completion ─────────────────────────
  const completion = useMemo(() => {
    let filled = 0
    const total = 3
    const validRisks = risques.filter(r => r.description.trim())
    if (validRisks.length > 0) filled++
    const withMitigation = validRisks.filter(r => r.mitigation.trim())
    if (withMitigation.length > 0) filled++
    if (aiSynthesis) filled++
    return { filled, total, percent: Math.round((filled / total) * 100) }
  }, [risques, aiSynthesis])

  // ─── Save to API ────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await authFetch('/api/paa/ateliers', {
        method: 'PUT',
        body: JSON.stringify({
          atelierCode: 'gestion-crise',
          risques,
          indicateurs,
          aiSynthesis,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message || 'Erreur lors de la sauvegarde')
        return
      }
      toast.success('Atelier Gestion de Crise sauvegardé')
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }, [risques, indicateurs, aiSynthesis])

  // ─── AI Analysis ────────────────────────
  const handleAiAnalysis = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await authFetch('/api/paa/ateliers', {
        method: 'POST',
        body: JSON.stringify({
          action: 'ai-analyze',
          atelierCode: 'gestion-crise',
          risques,
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.suggestion) {
        setAiSynthesis(typeof json.data.suggestion === 'string' ? json.data.suggestion : JSON.stringify(json.data.suggestion))
        toast.success('Analyse IA de résilience générée !')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la génération IA')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setAiLoading(false)
    }
  }, [risques])

  // ─── Risk score calculation ──────────────
  const riskScore = useMemo(() => {
    const probMap = { faible: 1, moyenne: 2, haute: 3 }
    const impactMap = { mineur: 1, modéré: 2, majeur: 3 }
    return risques.reduce((score, r) => {
      if (!r.description.trim()) return score
      return score + (probMap[r.probability] * impactMap[r.impact])
    }, 0)
  }, [risques])

  const riskLevel = useMemo(() => {
    if (riskScore <= 3) return { label: 'Faible', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' }
    if (riskScore <= 9) return { label: 'Modéré', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' }
    return { label: 'Élevé', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' }
  }, [riskScore])

  // ─── Loading skeleton ───────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="h-48 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  // ─── Main Render ─────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:px-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Gestion de Crise &amp; Résilience</h2>
              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 text-[10px] px-1.5">Atelier 8</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {completion.filled}/{completion.total} sections — {completion.percent}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-amber-400/40 text-amber-500 hover:bg-amber-400/10"
            onClick={handleAiAnalysis}
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Analyse IA
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* ── Risk Score Dashboard ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-rose-200 dark:border-rose-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Niveau de risque</span>
              </div>
              <p className={cn('text-2xl font-bold', riskLevel.color)}>{riskLevel.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Score : {riskScore}</p>
            </CardContent>
          </Card>
          <Card className="border-rose-200 dark:border-rose-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                  <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Risques identifiés</span>
              </div>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{risques.filter(r => r.description.trim()).length}</p>
              <p className="text-[11px] text-muted-foreground mt-1">dont {risques.filter(r => r.mitigation.trim()).length} avec plan d&apos;action</p>
            </CardContent>
          </Card>
          <Card className="border-rose-200 dark:border-rose-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                  <Activity className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Indicateurs surveillés</span>
              </div>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{indicateurs.length}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Seuils d&apos;alerte configurés</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Identification des risques ── */}
        <Card className="border-rose-200 dark:border-rose-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  Identification des risques &amp; plan d&apos;action
                </CardTitle>
                <InfoPopover text="Identifiez les risques potentiels pour votre entreprise. Pour chaque risque, évaluez la probabilité, l'impact et définissez des actions de mitigation concrètes." />
              </div>
              <Button variant="outline" size="sm" onClick={addRisk} className="gap-1 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Ajouter un risque
              </Button>
            </div>
            <CardDescription>Listez les crises potentielles : cash flow, perte de client, santé, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {risques.map((risk, index) => (
                <div key={risk.id} className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">Risque #{index + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRisk(risk.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                    >
                      ×
                    </Button>
                  </div>
                  <Textarea
                    value={risk.description}
                    onChange={(e) => updateRisk(risk.id, 'description', e.target.value)}
                    placeholder="Décrivez le risque : ex. Perte du client principal représentant 60% du CA"
                    className="min-h-[60px] text-sm resize-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Probabilité</p>
                      <div className="flex gap-2">
                        {(['faible', 'moyenne', 'haute'] as const).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateRisk(risk.id, 'probability', level)}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                              risk.probability === level ? PROBABILITY_COLORS[level] : 'border-border text-muted-foreground hover:bg-muted/40'
                            )}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Impact</p>
                      <div className="flex gap-2">
                        {(['mineur', 'modéré', 'majeur'] as const).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateRisk(risk.id, 'impact', level)}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                              risk.impact === level ? IMPACT_COLORS[level] : 'border-border text-muted-foreground hover:bg-muted/40'
                            )}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Actions de mitigation</p>
                    <Textarea
                      value={risk.mitigation}
                      onChange={(e) => updateRisk(risk.id, 'mitigation', e.target.value)}
                      placeholder="Plan d'action : ex. Diversifier la base clients, constituer une épargne de précaution de 6 mois"
                      className="min-h-[60px] text-sm resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* ── Indicateurs d'alerte ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                Indicateurs d&apos;alerte
              </CardTitle>
              <InfoPopover text="Surveillez ces indicateurs clés régulièrement. Si un indicateur atteint son seuil d'alerte, déclenchez votre plan de crise." />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {indicateurs.map((ind) => (
                <div key={ind.id} className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/20">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">
                    <Activity className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{ind.label}</p>
                    <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">Alerte : {ind.seuilAlerte}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Boîte à outils résilience ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              Boîte à outils résilience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RESILIENCE_TIPS.map((tip, i) => {
                const TipIcon = tip.icon
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/20">
                      <TipIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tip.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tip.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── AI Synthesis ── */}
        {aiSynthesis && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-amber-300 dark:border-amber-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Analyse IA — Résilience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                  {aiSynthesis}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Bottom Save Bar ── */}
        <Card className="bg-gradient-to-r from-rose-500/5 to-rose-300/5 border-rose-200 dark:border-rose-800">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn('text-sm', riskLevel.color, riskLevel.bg, 'border-current')}>
                  Risque {riskLevel.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {completion.percent}% complété
                </span>
              </div>
              <Button
                size="sm"
                className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
