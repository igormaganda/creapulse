'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Calculator,
  Save,
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts'
import { toast } from 'sonner'

// ─── Helpers ──────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

// ─── Custom Gauge Component ───────────────────

function ProfitabilityGauge({ value, label }: { value: number; label: string }) {
  // value is margin percentage, 0-100
  const clamped = Math.max(0, Math.min(100, value))
  const color = clamped >= 20 ? '#22c55e' : clamped >= 0 ? '#f59e0b' : '#ef4444'
  const bgColor = clamped >= 20 ? 'rgba(34,197,94,0.1)' : clamped >= 0 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'

  const gaugeData = [
    {
      name: label,
      value: clamped,
      fill: color,
    },
  ]

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full h-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="100%"
            innerRadius="60%"
            outerRadius="90%"
            startAngle={180}
            endAngle={0}
            barSize={14}
            data={gaugeData}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={7}
              background={{ fill: 'hsl(var(--muted))' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-lg font-bold" style={{ color }}>
            {value.toFixed(1)}%
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

// ─── Simulator Slider Row ─────────────────────

function SimulatorSlider({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  color = '#00838F',
  prefix = '',
}: {
  label: string
  description: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  unit: string
  color?: string
  prefix?: string
}) {
  const percentage = ((value - min) / (max - min)) * 100
  const displayValue = prefix + new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + unit

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="font-mono text-sm px-3 py-1 min-w-[120px] justify-center"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {displayValue}
          </Badge>
        </div>
      </div>
      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{prefix}{min.toLocaleString('fr-FR')}{unit}</span>
          <span className="text-[10px] text-muted-foreground">{prefix}{max.toLocaleString('fr-FR')}{unit}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────

export function FinancierModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  // ─── Simulator State ─────────────────────
  const [year1Revenue, setYear1Revenue] = useState(100000)
  const [growthRate, setGrowthRate] = useState(15)
  const [year1Expenses, setYear1Expenses] = useState(70000)
  const [initialInvestment, setInitialInvestment] = useState(30000)

  // ─── Computed Values ─────────────────────
  const year2Revenue = useMemo(() => year1Revenue * (1 + growthRate / 100), [year1Revenue, growthRate])
  const year3Revenue = useMemo(() => year2Revenue * (1 + growthRate / 100), [year2Revenue, growthRate])
  // Expenses grow at half the revenue growth rate
  const expenseGrowth = growthRate / 200
  const year2Expenses = useMemo(() => year1Expenses * (1 + expenseGrowth), [year1Expenses, expenseGrowth])
  const year3Expenses = useMemo(() => year2Expenses * (1 + expenseGrowth), [year2Expenses, expenseGrowth])

  const margin1 = useMemo(() => year1Revenue > 0 ? ((year1Revenue - year1Expenses) / year1Revenue) * 100 : 0, [year1Revenue, year1Expenses])
  const margin2 = useMemo(() => year2Revenue > 0 ? ((year2Revenue - year2Expenses) / year2Revenue) * 100 : 0, [year2Revenue, year2Expenses])
  const margin3 = useMemo(() => year3Revenue > 0 ? ((year3Revenue - year3Expenses) / year3Revenue) * 100 : 0, [year3Revenue, year3Expenses])

  const result1 = useMemo(() => year1Revenue - year1Expenses, [year1Revenue, year1Expenses])
  const result2 = useMemo(() => year2Revenue - year2Expenses, [year2Revenue, year2Expenses])
  const result3 = useMemo(() => year3Revenue - year3Expenses, [year3Revenue, year3Expenses])

  // Breakeven month (investment / monthly net profit)
  const monthlyProfit1 = result1 / 12
  const breakevenMonth = useMemo(() => {
    if (monthlyProfit1 <= 0 || initialInvestment <= 0) return null
    return Math.ceil(initialInvestment / monthlyProfit1)
  }, [monthlyProfit1, initialInvestment])

  // Total 3-year cumulative profit
  const cumulative3Y = result1 + result2 + result3 - initialInvestment

  // Chart data
  const chartData = useMemo(() => [
    { name: 'Année 1', Revenus: year1Revenue, Charges: year1Expenses, Résultat: result1 },
    { name: 'Année 2', Revenus: year2Revenue, Charges: year2Expenses, Résultat: result2 },
    { name: 'Année 3', Revenus: year3Revenue, Charges: year3Expenses, Résultat: result3 },
  ], [year1Revenue, year1Expenses, result1, year2Revenue, year2Expenses, result2, year3Revenue, year3Expenses, result3])

  // Monthly cashflow chart data (12 months year 1)
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    const monthlyRev = year1Revenue / 12
    const monthlyExp = year1Expenses / 12
    return months.map((month, i) => ({
      month,
      ca: Math.round(monthlyRev * (1 + (growthRate / 1200) * i)),
      charges: Math.round(monthlyExp * (1 + (expenseGrowth / 12) * i)),
      cumul: Math.round(
        months.slice(0, i + 1).reduce((sum, _, j) => {
          const r = monthlyRev * (1 + (growthRate / 1200) * j)
          const e = monthlyExp * (1 + (expenseGrowth / 12) * j)
          return sum + (r - e)
        }, 0) - (i === 11 ? initialInvestment : 0)
      ),
    }))
  }, [year1Revenue, year1Expenses, growthRate, expenseGrowth, initialInvestment])

  // ─── Load data on mount ──────────────────
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('creapulse-financier-sim')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (typeof parsed.year1Revenue === 'number') setYear1Revenue(parsed.year1Revenue)
          if (typeof parsed.growthRate === 'number') setGrowthRate(parsed.growthRate)
          if (typeof parsed.year1Expenses === 'number') setYear1Expenses(parsed.year1Expenses)
          if (typeof parsed.initialInvestment === 'number') setInitialInvestment(parsed.initialInvestment)
        } catch { /* ignore */ }
      }

      try {
        const res = await fetch('/api/financier', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const d = json.data
            if (d.year1Revenue) setYear1Revenue(d.year1Revenue)
            if (d.year1Expenses) setYear1Expenses(d.year1Expenses)
            if (d.initialInvestment) setInitialInvestment(d.initialInvestment)
            // Derive growth rate from year2 revenue if available
            if (d.year2Revenue && d.year1Revenue) {
              const derived = Math.round(((d.year2Revenue / d.year1Revenue) - 1) * 100)
              if (derived >= 0 && derived <= 50) setGrowthRate(derived)
            }
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
      localStorage.setItem('creapulse-financier-sim', JSON.stringify({
        year1Revenue, growthRate, year1Expenses, initialInvestment,
      }))
    }
  }, [isLoading, year1Revenue, growthRate, year1Expenses, initialInvestment])

  // ─── Save & Sync ─────────────────────────
  const handleSaveAndSync = useCallback(async () => {
    setIsSaving(true)
    setIsSyncing(true)
    try {
      // 1. Save to financier API
      const saveRes = await fetch('/api/financier', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          year1Revenue,
          year2Revenue: Math.round(year2Revenue),
          year3Revenue: Math.round(year3Revenue),
          year1Expenses,
          year2Expenses: Math.round(year2Expenses),
          year3Expenses: Math.round(year3Expenses),
          breakevenMonth,
          initialInvestment,
        }),
      })
      const saveJson = await saveRes.json()

      // 2. Sync to business plan
      let syncSuccess = false
      try {
        const syncRes = await fetch('/api/business-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'sync-simulators' }),
        })
        const syncJson = await syncRes.json()
        syncSuccess = syncJson.success
      } catch {
        // Sync failure is non-critical
      }

      if (saveJson.success) {
        toast.success('Plan financier sauvegardé et synchronisé au Business Plan')
      } else {
        toast.error(saveJson.error?.message || 'Erreur de sauvegarde')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setIsSaving(false)
      setIsSyncing(false)
    }
  }, [year1Revenue, year2Revenue, year3Revenue, year1Expenses, year2Expenses, year3Expenses, breakevenMonth, initialInvestment])

  // ─── AI Suggestions ─────────────────────
  const handleAiSuggest = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/financier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          year1Revenue,
          year1Expenses,
          year2Revenue: Math.round(year2Revenue),
          year2Expenses: Math.round(year2Expenses),
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.suggestions) {
        toast.success('Suggestions IA générées !')
      } else {
        toast.error(json.error?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setAiLoading(false)
    }
  }, [year1Revenue, year1Expenses, year2Revenue, year2Expenses])

  // ─── Loading ────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // ─── Main Render ────────────────────────
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
            <Calculator className="h-5 w-5 text-[#00838F]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Simulateur Financier</h2>
            <p className="text-xs text-muted-foreground">Projections sur 3 ans — Ajustez les curseurs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#FFB74D]/40 text-[#FFB74D] hover:bg-[#FFB74D]/10 hover:text-[#FFB74D]"
            onClick={handleAiSuggest}
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Analyse IA
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* ── KPI Dashboard ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="border-transparent bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">CA Année 1</span>
              </div>
              <p className="text-sm font-bold text-green-700 dark:text-green-400">{formatCurrency(year1Revenue)}</p>
              <p className="text-[10px] text-green-600/60 dark:text-green-400/60">A2 : {formatCurrency(year2Revenue)}</p>
            </CardContent>
          </Card>

          <Card className="border-transparent bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">Charges A1</span>
              </div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">{formatCurrency(year1Expenses)}</p>
              <p className="text-[10px] text-red-600/60 dark:text-red-400/60">A2 : {formatCurrency(year2Expenses)}</p>
            </CardContent>
          </Card>

          <Card className={cn(
            'border-transparent',
            result1 >= 0
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
              : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10',
          )}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg',
                  result1 >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
                )}>
                  <DollarSign className={cn('h-3.5 w-3.5', result1 >= 0 ? 'text-green-600' : 'text-red-600')} />
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">Résultat A1</span>
              </div>
              <p className={cn('text-sm font-bold', result1 >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>
                {formatCurrency(result1)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-transparent bg-gradient-to-br from-[#00838F]/5 to-[#00838F]/10 dark:from-[#00838F]/5 dark:to-[#00838F]/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00838F]/10">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#00838F]" />
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">Investissement</span>
              </div>
              <p className="text-sm font-bold text-[#00838F]">{formatCurrency(initialInvestment)}</p>
              <p className="text-[10px] text-[#00838F]/60">
                {breakevenMonth ? `Rentable : mois ${breakevenMonth}` : 'Non rentable'}
              </p>
            </CardContent>
          </Card>

          <Card className={cn(
            'border-transparent col-span-2 lg:col-span-1',
            cumulative3Y >= 0
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
              : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10',
          )}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg',
                  cumulative3Y >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
                )}>
                  <Target className={cn('h-3.5 w-3.5', cumulative3Y >= 0 ? 'text-green-600' : 'text-red-600')} />
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">Cumulé 3 ans</span>
              </div>
              <p className={cn('text-sm font-bold', cumulative3Y >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>
                {formatCurrency(cumulative3Y)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Simulator Sliders ── */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#00838F]" />
              Paramètres du simulateur
            </CardTitle>
            <CardDescription>Ajustez les curseurs pour modifier vos prévisions en temps réel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CA Année 1 */}
            <SimulatorSlider
              label="Chiffre d'affaires — Année 1"
              description="Revenus totaux estimés pour la première année d'activité"
              value={year1Revenue}
              onChange={setYear1Revenue}
              min={0}
              max={500000}
              step={1000}
              unit="€"
              color="#10B981"
            />

            <Separator />

            {/* Croissance annuelle */}
            <SimulatorSlider
              label="Croissance annuelle"
              description="Taux de croissance appliqué aux revenus pour les années 2 et 3"
              value={growthRate}
              onChange={setGrowthRate}
              min={0}
              max={50}
              step={1}
              unit="%"
              color="#00838F"
            />

            <Separator />

            {/* Charges Année 1 */}
            <SimulatorSlider
              label="Total charges — Année 1"
              description="Ensemble des charges (fixes + variables) pour la première année"
              value={year1Expenses}
              onChange={setYear1Expenses}
              min={0}
              max={400000}
              step={1000}
              unit="€"
              color="#EF4444"
            />

            <Separator />

            {/* Investissement */}
            <SimulatorSlider
              label="Investissement initial"
              description="Capital de départ (matériel, stock, frais de lancement, trésorerie...)"
              value={initialInvestment}
              onChange={setInitialInvestment}
              min={0}
              max={200000}
              step={1000}
              unit="€"
              color="#FF6B35"
            />

            {/* Live calculation summary */}
            <div className="rounded-xl bg-muted/40 border p-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Calculs en temps réel</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Marge nette A1</p>
                  <p className={cn(
                    'text-xl font-bold',
                    margin1 >= 20 ? 'text-green-600 dark:text-green-400' : margin1 >= 0 ? 'text-amber-500' : 'text-red-500',
                  )}>
                    {margin1.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Marge nette A3</p>
                  <p className={cn(
                    'text-xl font-bold',
                    margin3 >= 20 ? 'text-green-600 dark:text-green-400' : margin3 >= 0 ? 'text-amber-500' : 'text-red-500',
                  )}>
                    {margin3.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Seuil de rentabilité</p>
                  <p className={cn(
                    'text-xl font-bold',
                    breakevenMonth && breakevenMonth <= 12 ? 'text-green-600 dark:text-green-400' : breakevenMonth && breakevenMonth <= 24 ? 'text-amber-500' : 'text-red-500',
                  )}>
                    {breakevenMonth ? `Mois ${breakevenMonth}` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Gauges & Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profitability Gauges */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#FFB74D]" />
                Jauges de rentabilité
              </CardTitle>
              <CardDescription>Marge nette par année</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <ProfitabilityGauge value={margin1} label="Année 1" />
                <ProfitabilityGauge value={margin2} label="Année 2" />
                <ProfitabilityGauge value={margin3} label="Année 3" />
              </div>
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-1.5 text-xs">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">≥ 20%</span>
                  <div className="h-2 w-2 rounded-full bg-amber-500 ml-2" />
                  <span className="text-muted-foreground">0–20%</span>
                  <div className="h-2 w-2 rounded-full bg-red-500 ml-2" />
                  <span className="text-muted-foreground">&lt; 0%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3-Year Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#00838F]" />
                Revenus vs Charges — 3 ans
              </CardTitle>
              <CardDescription>Projection annuelle avec résultat net</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value)]} />
                    <Legend />
                    <Bar dataKey="Revenus" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Charges" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Résultat" fill="#00838F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 3-Year Table ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-[#00838F]" />
              Tableau de synthèse 3 ans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground"></th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Année 1</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Année 2</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Année 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2.5 pr-4 font-medium">Chiffre d&apos;affaires</td>
                    <td className="text-right py-2.5 px-3 text-green-600 dark:text-green-400">{formatCurrency(year1Revenue)}</td>
                    <td className="text-right py-2.5 px-3 text-green-600 dark:text-green-400">{formatCurrency(year2Revenue)}</td>
                    <td className="text-right py-2.5 px-3 text-green-600 dark:text-green-400">{formatCurrency(year3Revenue)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2.5 pr-4 font-medium">Charges</td>
                    <td className="text-right py-2.5 px-3 text-red-600 dark:text-red-400">{formatCurrency(year1Expenses)}</td>
                    <td className="text-right py-2.5 px-3 text-red-600 dark:text-red-400">{formatCurrency(year2Expenses)}</td>
                    <td className="text-right py-2.5 px-3 text-red-600 dark:text-red-400">{formatCurrency(year3Expenses)}</td>
                  </tr>
                  <tr className="bg-muted/30 font-semibold">
                    <td className="py-2.5 pr-4">Résultat net</td>
                    <td className={cn('text-right py-2.5 px-3', result1 >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                      {formatCurrency(result1)}
                    </td>
                    <td className={cn('text-right py-2.5 px-3', result2 >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                      {formatCurrency(result2)}
                    </td>
                    <td className={cn('text-right py-2.5 px-3', result3 >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                      {formatCurrency(result3)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium">Marge nette</td>
                    <td className={cn('text-right py-2.5 px-3', margin1 >= 20 ? 'text-green-600' : margin1 >= 0 ? 'text-amber-500' : 'text-red-500')}>
                      {margin1.toFixed(1)}%
                    </td>
                    <td className={cn('text-right py-2.5 px-3', margin2 >= 20 ? 'text-green-600' : margin2 >= 0 ? 'text-amber-500' : 'text-red-500')}>
                      {margin2.toFixed(1)}%
                    </td>
                    <td className={cn('text-right py-2.5 px-3', margin3 >= 20 ? 'text-green-600' : margin3 >= 0 ? 'text-amber-500' : 'text-red-500')}>
                      {margin3.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Save & Sync Button ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="lg"
            className={cn(
              'w-full gap-2 text-base font-semibold py-6',
              'bg-gradient-to-r from-[#00838F] to-[#00838F]/90 hover:from-[#00838F]/90 hover:to-[#00838F]/80',
              'text-white shadow-lg shadow-[#00838F]/20 hover:shadow-[#00838F]/30',
              'transition-all duration-300',
            )}
            onClick={handleSaveAndSync}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {isSaving ? 'Enregistrement en cours...' : 'Enregistrer & synchroniser le Business Plan'}
            {!isSaving && (
              <ArrowUpRight className="h-4 w-4 opacity-70" />
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Sauvegarde vos prévisions et met à jour automatiquement les sections financières du Business Plan
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
