'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Globe,
  Save,
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  BarChart3,
  Shield,
  Check,
  Circle,
  Info,
  Zap,
  ArrowRight,
  AlertTriangle,
  Megaphone,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────

interface SwotData {
  strengths: string
  weaknesses: string
  opportunities: string
  threats: string
}

interface SimulateurData {
  tailleMarche: number
  partDeMarche: number
  concurrents: number
  budgetMarketing: number
  potentielCroissance: number
}

// ─── Helpers ────────────────────────────────

const DEFAULT_SWOT: SwotData = { strengths: '', weaknesses: '', opportunities: '', threats: '' }

const DEFAULT_SIMULATEUR: SimulateurData = {
  tailleMarche: 1_000_000,
  partDeMarche: 5,
  concurrents: 10,
  budgetMarketing: 5_000,
  potentielCroissance: 50,
}

const formatEur = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(v)

// ─── InfoPopover helper ─────────────────────

function InfoPopover({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-[#00838F] hover:bg-[#00838F]/10 transition-colors shrink-0">
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

// ─── Traffic Light Component ────────────────

function TrafficLight({ concurrents }: { concurrents: number }) {
  const level = concurrents < 10 ? 'green' : concurrents <= 30 ? 'yellow' : 'red'
  const label = concurrents < 10 ? 'Peu concurrentiel' : concurrents <= 30 ? 'Modéré' : 'Intense'
  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-amber-400',
    red: 'bg-red-500',
  }
  const textColors = {
    green: 'text-green-600',
    yellow: 'text-amber-600',
    red: 'text-red-600',
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <div className={cn('h-3 w-3 rounded-full', level === 'green' ? 'bg-green-500' : 'bg-muted-foreground/20')} />
        <div className={cn('h-3 w-3 rounded-full', level === 'yellow' ? 'bg-amber-400' : 'bg-muted-foreground/20')} />
        <div className={cn('h-3 w-3 rounded-full', level === 'red' ? 'bg-red-500' : 'bg-muted-foreground/20')} />
      </div>
      <span className={cn('text-sm font-semibold', textColors[level])}>{label}</span>
    </div>
  )
}

// ─── Animated Number ────────────────────────

function AnimatedValue({ value, format }: { value: number; format: (v: number) => string }) {
  const formatted = useMemo(() => format(value), [value, format])
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="font-bold text-lg"
    >
      {formatted}
    </motion.span>
  )
}

// ─── Main Component ─────────────────────────

export function MarcheModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  // Sector (preserved from existing API)
  const [sector, setSector] = useState('')

  // Simulator sliders
  const [sim, setSim] = useState<SimulateurData>(DEFAULT_SIMULATEUR)

  // SWOT
  const [swot, setSwot] = useState<SwotData>(DEFAULT_SWOT)

  // AI Synthesis
  const [aiSynthesis, setAiSynthesis] = useState('')

  // ─── Slider setter helper ────────────────
  const updateSim = useCallback((key: keyof SimulateurData, val: number) => {
    setSim(prev => ({ ...prev, [key]: val }))
  }, [])

  // ─── Load data on mount ──────────────────
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('creapulse-marche')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.sector) setSector(parsed.sector)
          if (parsed.sim) setSim(prev => ({ ...prev, ...parsed.sim }))
          if (parsed.swot) setSwot(parsed.swot)
          if (parsed.aiSynthesis) setAiSynthesis(parsed.aiSynthesis)
        } catch { /* ignore */ }
      }

      try {
        const res = await fetch('/api/marche', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const d = json.data
            if (d.sector) setSector(d.sector)
            if (d.marketSize && !isNaN(d.marketSize)) setSim(prev => ({ ...prev, tailleMarche: d.marketSize }))
            if (d.opportunities || d.threats) {
              setSwot(prev => ({
                ...prev,
                opportunities: d.opportunities || prev.opportunities,
                threats: d.threats || prev.threats,
              }))
            }
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
      localStorage.setItem('creapulse-marche', JSON.stringify({
        sector, sim, swot, aiSynthesis,
      }))
    }
  }, [isLoading, sector, sim, swot, aiSynthesis])

  // ─── Calculated KPIs ────────────────────
  const kpis = useMemo(() => {
    const caPotentiel = (sim.tailleMarche * sim.partDeMarche) / 100
    const coutAcquisitionClient = sim.budgetMarketing > 0 && sim.tailleMarche > 0
      ? Math.round((sim.budgetMarketing * 12) / Math.max(1, (caPotentiel / Math.max(100, sim.tailleMarche * 0.01))))
      : 0
    const coutAcquisitionEstime = sim.budgetMarketing > 0
      ? Math.round((sim.budgetMarketing / Math.max(1, (caPotentiel / 200))) * 100) / 100
      : 0
    const margeConcurrentielle = sim.concurrents < 10 ? 'green' : sim.concurrents <= 30 ? 'yellow' : 'red'
    const scoreAttractivite = Math.round(
      (sim.potentielCroissance * 0.3) +
      ((100 - sim.concurrents * 2) * 0.2) +
      (Math.min(sim.budgetMarketing, 50000) / 50000 * 100 * 0.15) +
      (sim.partDeMarche > 0 ? 20 : 0) +
      (sim.tailleMarche > 5000000 ? 15 : sim.tailleMarche > 1000000 ? 10 : 5)
    )
    return { caPotentiel, coutAcquisitionEstime, margeConcurrentielle, scoreAttractivite }
  }, [sim])

  // ─── Save to API + sync BP ──────────────
  const handleSaveAndSync = useCallback(async () => {
    setIsSaving(true)
    try {
      // Save to /api/marche
      const res = await fetch('/api/marche', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sector,
          marketSize: sim.tailleMarche,
          growthRate: sim.potentielCroissance,
          swot,
          aiSynthesis,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message || 'Erreur lors de la sauvegarde')
        return
      }

      // Sync Business Plan
      try {
        await fetch('/api/business-plan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'sync-simulators' }),
        })
      } catch { /* non-critical */ }

      toast.success('Analyse de marché sauvegardée et BP synchronisé')
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }, [sector, sim, swot, aiSynthesis])

  // ─── AI Analysis ────────────────────────
  const handleAiAnalysis = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/marche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sector,
          marketSize: String(sim.tailleMarche),
          swot,
          action: 'ai-analyze-market',
          simulatorData: sim,
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.synthesis) {
        setAiSynthesis(json.data.synthesis)
        toast.success('Analyse IA du marché générée !')
      } else if (json.success && json.data?.suggestion) {
        setAiSynthesis(typeof json.data.suggestion === 'string' ? json.data.suggestion : JSON.stringify(json.data.suggestion))
        toast.success('Analyse IA du marché générée !')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la génération IA')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setAiLoading(false)
    }
  }, [sector, sim, swot])

  // ─── SWOT update ───────────────────────
  const updateSwot = useCallback((key: keyof SwotData, value: string) => {
    setSwot(prev => ({ ...prev, [key]: value }))
  }, [])

  // ─── Pie chart data ────────────────────
  const pieData = useMemo(() => [
    { name: 'Votre CA', value: Math.round(kpis.caPotentiel), color: '#00838F' },
    { name: 'Reste du marché', value: Math.max(0, Math.round(sim.tailleMarche - kpis.caPotentiel)), color: '#E5E7EB' },
  ], [kpis.caPotentiel, sim.tailleMarche])

  // ─── Completion ─────────────────────────
  const completion = useMemo(() => {
    let filled = 0
    const total = 5
    if (sim.tailleMarche > 0) filled++
    if (sim.partDeMarche > 0) filled++
    if (sim.concurrents > 0) filled++
    if (Object.values(swot).some(v => v.trim().length > 0)) filled++
    if (aiSynthesis) filled++
    return { filled, total, percent: Math.round((filled / total) * 100) }
  }, [sim, swot, aiSynthesis])

  // ─── Loading skeleton ───────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00838F]/10">
            <Globe className="h-5 w-5 text-[#00838F]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Simulateur de Marché</h2>
            <p className="text-xs text-muted-foreground">
              {completion.filled}/{completion.total} paramètres — {completion.percent}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#FFB74D]/40 text-[#FFB74D] hover:bg-[#FFB74D]/10 hover:text-[#FFB74D]"
            onClick={handleAiAnalysis}
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Analyser avec l&apos;IA
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-[#00838F] hover:bg-[#00838F]/90 text-white"
            onClick={handleSaveAndSync}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Enregistrer &amp; synchroniser le BP
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* ── KPI Dashboard ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CA Potentiel */}
          <Card className="border-[#00838F]/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00838F]/10">
                  <TrendingUp className="h-4 w-4 text-[#00838F]" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">CA potentiel</span>
              </div>
              <AnimatedValue value={kpis.caPotentiel} format={formatEur} />
              <p className="text-[11px] text-muted-foreground mt-1">Taille × Part visée</p>
            </CardContent>
          </Card>

          {/* Marge concurrentielle */}
          <Card className="border-[#00838F]/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00838F]/10">
                  <Shield className="h-4 w-4 text-[#00838F]" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Marge concurrentielle</span>
              </div>
              <TrafficLight concurrents={sim.concurrents} />
              <p className="text-[11px] text-muted-foreground mt-1">{sim.concurrents} concurrent(s)</p>
            </CardContent>
          </Card>

          {/* Coût acquisition client */}
          <Card className="border-[#00838F]/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]/10">
                  <Target className="h-4 w-4 text-[#FF6B35]" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Coût acq. client estimé</span>
              </div>
              <AnimatedValue value={kpis.coutAcquisitionEstime} format={(v) => formatEur(v)} />
              <p className="text-[11px] text-muted-foreground mt-1">Basé sur budget marketing</p>
            </CardContent>
          </Card>

          {/* Score attractivité */}
          <Card className="border-[#00838F]/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFB74D]/10">
                  <Zap className="h-4 w-4 text-[#FFB74D]" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Score d&apos;attractivité</span>
              </div>
              <AnimatedValue value={kpis.scoreAttractivite} format={(v) => `${v}/100`} />
              <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', kpis.scoreAttractivite >= 70 ? 'bg-green-500' : kpis.scoreAttractivite >= 40 ? 'bg-amber-400' : 'bg-red-500')}
                  animate={{ width: `${kpis.scoreAttractivite}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Market Share Pie Chart ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#00838F]" />
              Répartition du marché
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-48 w-48 shrink-0" role="img" aria-label="Répartition du marché par segment">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatEur(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-[#00838F]" />
                  <div>
                    <p className="text-sm font-medium">Votre part potentielle</p>
                    <p className="text-lg font-bold text-[#00838F]">{formatEur(kpis.caPotentiel)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-gray-200" />
                  <div>
                    <p className="text-sm font-medium">Reste du marché</p>
                    <p className="text-lg font-bold text-muted-foreground">{formatEur(Math.max(0, sim.tailleMarche - kpis.caPotentiel))}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Simulator Sliders ── */}
        <div className="space-y-6">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-[#FF6B35]" />
            Paramètres du simulateur
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Taille du marché */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#00838F]" />
                      Taille du marché
                    </CardTitle>
                    <InfoPopover text="Le marché total adressable (TAM) représente le chiffre d'affaires total généré par votre secteur en France ou dans votre zone cible." />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">0 €</span>
                  <span className="text-xl font-bold text-[#00838F]">{formatEur(sim.tailleMarche)}</span>
                  <span className="text-xs text-muted-foreground">10 M€</span>
                </div>
                <Slider
                  value={[sim.tailleMarche]}
                  onValueChange={([v]) => updateSim('tailleMarche', v)}
                  min={0}
                  max={10_000_000}
                  step={50_000}
                  className="[&_[role=slider]]:bg-[#00838F] [&_[role=slider]]:border-[#00838F] [&_[data-orientation=horizontal]>.bg-primary]:bg-[#00838F]"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>50 k€</span>
                  <span>Pas : 50 000 €</span>
                  <span>10 M€</span>
                </div>
              </CardContent>
            </Card>

            {/* Part de marché visée */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-[#FF6B35]" />
                      Part de marché visée
                    </CardTitle>
                    <InfoPopover text="La part de marché que vous visez. Attention : viser trop haut sans les moyens est irréaliste. Démarrez petit, grandissez progressivement." />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">0,1 %</span>
                  <span className="text-xl font-bold text-[#FF6B35]">{sim.partDeMarche.toFixed(1)} %</span>
                  <span className="text-xs text-muted-foreground">50 %</span>
                </div>
                <Slider
                  value={[sim.partDeMarche]}
                  onValueChange={([v]) => updateSim('partDeMarche', v)}
                  min={0.1}
                  max={50}
                  step={0.1}
                  className="[&_[role=slider]]:bg-[#FF6B35] [&_[role=slider]]:border-[#FF6B35] [&_[data-orientation=horizontal]>.bg-primary]:bg-[#FF6B35]"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Niche</span>
                  <span>Leader</span>
                </div>
              </CardContent>
            </Card>

            {/* Nombre de concurrents */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#00838F]" />
                      Nombre de concurrents
                    </CardTitle>
                    <InfoPopover text="Le nombre de concurrents directs sur votre marché. Plus il y en a, plus la concurrence est intense et plus il sera difficile de se démarquer." />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={sim.concurrents < 10 ? 'border-green-500 text-green-600' : 'text-muted-foreground'}>Peu</Badge>
                  <span className="text-xl font-bold text-[#00838F]">{sim.concurrents}</span>
                  <Badge variant="outline" className={sim.concurrents > 30 ? 'border-red-500 text-red-600' : 'text-muted-foreground'}>Intense</Badge>
                </div>
                <Slider
                  value={[sim.concurrents]}
                  onValueChange={([v]) => updateSim('concurrents', v)}
                  min={1}
                  max={50}
                  step={1}
                  className="[&_[role=slider]]:bg-[#00838F] [&_[role=slider]]:border-[#00838F] [&_[data-orientation=horizontal]>.bg-primary]:bg-[#00838F]"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Peu (1-10)</span>
                  <span className="text-amber-500 font-medium">Modéré (10-30)</span>
                  <span>Intense (30+)</span>
                </div>
              </CardContent>
            </Card>

            {/* Budget marketing */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-[#FFB74D]" />
                      Budget marketing
                    </CardTitle>
                    <InfoPopover text="Le budget mensuel alloué au marketing et à l'acquisition client. Un budget plus élevé permet une croissance plus rapide mais impacte la rentabilité." />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">0 €/mois</span>
                  <span className="text-xl font-bold text-[#FFB74D]">{formatEur(sim.budgetMarketing)}<span className="text-sm font-normal text-muted-foreground">/mois</span></span>
                  <span className="text-xs text-muted-foreground">50 000 €/mois</span>
                </div>
                <Slider
                  value={[sim.budgetMarketing]}
                  onValueChange={([v]) => updateSim('budgetMarketing', v)}
                  min={0}
                  max={50_000}
                  step={500}
                  className="[&_[role=slider]]:bg-[#FFB74D] [&_[role=slider]]:border-[#FFB74D] [&_[data-orientation=horizontal]>.bg-primary]:bg-[#FFB74D]"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Bootstrapping</span>
                  <span>Aggressif</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Potentiel de croissance (full width gauge) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Potentiel de croissance
                  </CardTitle>
                  <InfoPopover text="Le potentiel de croissance du marché estimé sur les 3 à 5 prochaines années. Prenez en compte les tendances, innovations et évolutions réglementaires." />
                </div>
                <Badge variant="outline" className={cn(
                  sim.potentielCroissance >= 70 ? 'border-green-500 text-green-600' :
                  sim.potentielCroissance >= 40 ? 'border-amber-500 text-amber-600' :
                  'border-red-500 text-red-600',
                )}>
                  {sim.potentielCroissance >= 70 ? 'Élevé' : sim.potentielCroissance >= 40 ? 'Modéré' : 'Faible'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Slider
                    value={[sim.potentielCroissance]}
                    onValueChange={([v]) => updateSim('potentielCroissance', v)}
                    min={0}
                    max={100}
                    step={1}
                    className="[&_[role=slider]]:bg-green-500 [&_[role=slider]]:border-green-500 [&_[data-orientation=horizontal]>.bg-primary]:bg-green-500"
                  />
                </div>
                <div className="flex items-center justify-center h-20 w-20 shrink-0">
                  <svg viewBox="0 0 100 100" className="h-20 w-20 -rotate-90" role="img" aria-label={`Potentiel de croissance : ${Math.round(sim.potentielCroissance)}%`}>
                    {/* Background arc */}
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40 * 0.75} ${2 * Math.PI * 40 * 0.25}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    {/* Value arc */}
                    <motion.circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={sim.potentielCroissance >= 70 ? '#22C55E' : sim.potentielCroissance >= 40 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40 * 0.75}`}
                      strokeDashoffset={2 * Math.PI * 40 * 0.75 * (1 - sim.potentielCroissance / 100)}
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 2 * Math.PI * 40 * 0.75 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 40 * 0.75 * (1 - sim.potentielCroissance / 100) }}
                      transition={{ duration: 0.5 }}
                    />
                    <text
                      x="50" y="50"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-foreground text-xl font-bold"
                      transform="rotate(90, 50, 50)"
                    >
                      {sim.potentielCroissance}%
                    </text>
                  </svg>
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span className="text-red-400">0 % — Déclin</span>
                <span className="text-amber-400">50 % — Stable</span>
                <span className="text-green-500">100 % — Forte croissance</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* ── SWOT Analysis (Visual 4-quadrant) ── */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#00838F]" />
            Analyse SWOT
            <InfoPopover text="L'analyse SWOT vous permet d'identifier vos Forces et Faiblesses internes, ainsi que les Opportunités et Menaces externes de votre marché." />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Forces */}
            <div className="rounded-xl border-2 border-green-500/30 bg-green-50/50 dark:bg-green-900/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                </div>
                <Label className="text-sm font-semibold text-green-700 dark:text-green-400">Forces</Label>
              </div>
              <Textarea
                value={swot.strengths}
                onChange={e => updateSwot('strengths', e.target.value)}
                placeholder="Vos avantages compétitifs, expertise, innovation..."
                className="min-h-[100px] text-sm bg-background/60 border-green-500/20 resize-none"
              />
              {swot.strengths && (
                <div className="flex items-center gap-1">
                  <Circle className="h-2 w-2 text-green-500" />
                  <span className="text-[11px] text-green-600">{swot.strengths.split('\n').filter(Boolean).length} élément(s)</span>
                </div>
              )}
            </div>

            {/* Faiblesses */}
            <div className="rounded-xl border-2 border-red-500/30 bg-red-50/50 dark:bg-red-900/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                </div>
                <Label className="text-sm font-semibold text-red-700 dark:text-red-400">Faiblesses</Label>
              </div>
              <Textarea
                value={swot.weaknesses}
                onChange={e => updateSwot('weaknesses', e.target.value)}
                placeholder="Points à améliorer, manque de moyens, expérience limitée..."
                className="min-h-[100px] text-sm bg-background/60 border-red-500/20 resize-none"
              />
              {swot.weaknesses && (
                <div className="flex items-center gap-1">
                  <Circle className="h-2 w-2 text-red-500" />
                  <span className="text-[11px] text-red-600">{swot.weaknesses.split('\n').filter(Boolean).length} élément(s)</span>
                </div>
              )}
            </div>

            {/* Opportunités */}
            <div className="rounded-xl border-2 border-sky-500/30 bg-sky-50/50 dark:bg-sky-900/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10">
                  <ArrowRight className="h-3.5 w-3.5 text-sky-600" />
                </div>
                <Label className="text-sm font-semibold text-sky-700 dark:text-sky-400">Opportunités</Label>
              </div>
              <Textarea
                value={swot.opportunities}
                onChange={e => updateSwot('opportunities', e.target.value)}
                placeholder="Marché en croissance, besoins non satisfaits, aides..."
                className="min-h-[100px] text-sm bg-background/60 border-sky-500/20 resize-none"
              />
              {swot.opportunities && (
                <div className="flex items-center gap-1">
                  <Circle className="h-2 w-2 text-sky-500" />
                  <span className="text-[11px] text-sky-600">{swot.opportunities.split('\n').filter(Boolean).length} élément(s)</span>
                </div>
              )}
            </div>

            {/* Menaces */}
            <div className="rounded-xl border-2 border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                  <Shield className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <Label className="text-sm font-semibold text-amber-700 dark:text-amber-400">Menaces</Label>
              </div>
              <Textarea
                value={swot.threats}
                onChange={e => updateSwot('threats', e.target.value)}
                placeholder="Concurrence, réglementation, risques économiques..."
                className="min-h-[100px] text-sm bg-background/60 border-amber-500/20 resize-none"
              />
              {swot.threats && (
                <div className="flex items-center gap-1">
                  <Circle className="h-2 w-2 text-amber-500" />
                  <span className="text-[11px] text-amber-600">{swot.threats.split('\n').filter(Boolean).length} élément(s)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── AI Synthesis ── */}
        {aiSynthesis && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-[#FFB74D]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FFB74D]" />
                  Analyse IA du marché
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
        <Card className="bg-gradient-to-r from-[#00838F]/5 to-[#FF6B35]/5 border-[#00838F]/20">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={cn(
                      'h-2 w-2 rounded-full transition-colors',
                      i < completion.filled ? 'bg-[#00838F]' : 'bg-muted',
                    )} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {completion.percent}% complété
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-[#FFB74D]/40 text-[#FFB74D] hover:bg-[#FFB74D]/10 hover:text-[#FFB74D]"
                  onClick={handleAiAnalysis}
                  disabled={aiLoading}
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Analyser avec l&apos;IA
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-[#00838F] hover:bg-[#00838F]/90 text-white"
                  onClick={handleSaveAndSync}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Enregistrer &amp; synchroniser le BP
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
