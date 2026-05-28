'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Line,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  TrendingUp,
  TrendingDown,
  Save,
  Loader2,
  RotateCcw,
  Plus,
  Trash2,
  Info,
  DollarSign,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Gauge,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────

interface FixedCharge {
  id: string
  name: string
  amount: number
}

interface SimulationInputs {
  monthlyRevenue: number
  fixedCharges: FixedCharge[]
  variableChargesRate: number
  averageSellingPrice: number
  unitCost: number
  initialInvestment: number
  targetMarginRate: number
}

interface SimulationResults {
  fixedChargesTotal: number
  variableChargesAmount: number
  totalCharges: number
  grossMarginAmount: number
  grossMarginRate: number
  netMarginAmount: number
  netMarginRate: number
  monthlyBreakeven: number
  breakevenMonths: number
  profitability1Y: number
  profitability2Y: number
  profitability3Y: number
  year1Revenue: number
  year1Expenses: number
  year2Revenue: number
  year2Expenses: number
  year3Revenue: number
  year3Expenses: number
}

interface ChartDataPoint {
  month: string
  ca: number
  charges: number
  resultat: number
}

// ─── Default values ──────────────────────────

const DEFAULT_INPUTS: SimulationInputs = {
  monthlyRevenue: 5000,
  fixedCharges: [
    { id: '1', name: 'Loyer', amount: 800 },
    { id: '2', name: 'Assurances', amount: 150 },
    { id: '3', name: 'Abonnements', amount: 100 },
  ],
  variableChargesRate: 30,
  averageSellingPrice: 100,
  unitCost: 40,
  initialInvestment: 15000,
  targetMarginRate: 40,
}

// ─── Helpers ─────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

function getTrafficLightColor(value: number, thresholds: [number, number]): string {
  if (value >= thresholds[0]) return '#22c55e'
  if (value >= thresholds[1]) return '#f59e0b'
  return '#ef4444'
}

function getTrafficLightBg(value: number, thresholds: [number, number]): string {
  if (value >= thresholds[0]) return 'bg-green-500/10 border-green-500/20'
  if (value >= thresholds[1]) return 'bg-amber-500/10 border-amber-500/20'
  return 'bg-red-500/10 border-red-500/20'
}

function getStatusIcon(value: number, thresholds: [number, number]) {
  if (value >= thresholds[0]) return <CheckCircle2 className="h-4 w-4 text-green-500" />
  if (value >= thresholds[1]) return <AlertTriangle className="h-4 w-4 text-amber-500" />
  return <XCircle className="h-4 w-4 text-red-500" />
}

// ─── Visual Gauge Component ──────────────────

function CircularGauge({ value, max, label, thresholds, unit = '%' }: {
  value: number
  max: number
  label: string
  thresholds: [number, number]
  unit?: string
}) {
  const clamped = Math.max(0, Math.min(max, value))
  const percentage = (clamped / max) * 100
  const color = getTrafficLightColor(value, thresholds)
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>
            {value === Infinity ? '—' : typeof value === 'number' ? (value % 1 !== 0 ? value.toFixed(1) : value) + unit : value}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">{label}</p>
    </div>
  )
}

// ─── Simulator Slider ────────────────────────

function SimSlider({
  icon,
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  color,
}: {
  icon: React.ReactNode
  label: string
  description: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  unit: string
  color: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="shrink-0">
          <Input
            type="number"
            value={value}
            onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
            className="w-28 text-right font-semibold text-sm h-8"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 pl-[42px]">
        <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0">
          {unit === '€' ? `${(min / 1000).toFixed(0)}k` : min}{unit}
        </span>
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={step}
          className="flex-1"
        />
        <span className="text-[10px] text-muted-foreground w-10 shrink-0">
          {unit === '€' ? `${(max / 1000).toFixed(0)}k` : max}{unit}
        </span>
      </div>
    </div>
  )
}

// ─── Calculations ────────────────────────────

function calculateResults(inputs: SimulationInputs): SimulationResults {
  const { monthlyRevenue, fixedCharges, variableChargesRate, initialInvestment } = inputs
  const fixedChargesTotal = fixedCharges.reduce((sum, c) => sum + c.amount, 0)
  const variableChargesAmount = monthlyRevenue * (variableChargesRate / 100)
  const totalCharges = fixedChargesTotal + variableChargesAmount

  const grossMarginAmount = monthlyRevenue - variableChargesAmount
  const grossMarginRate = monthlyRevenue > 0 ? (grossMarginAmount / monthlyRevenue) * 100 : 0

  const netMarginAmount = grossMarginAmount - fixedChargesTotal
  const netMarginRate = monthlyRevenue > 0 ? (netMarginAmount / monthlyRevenue) * 100 : 0

  const coeff = 1 - variableChargesRate / 100
  const monthlyBreakeven = coeff > 0 ? fixedChargesTotal / coeff : Infinity

  const netMarginPerMonth = netMarginAmount
  let breakevenMonths = Infinity
  if (netMarginPerMonth > 0 && initialInvestment > 0) {
    breakevenMonths = Math.ceil(initialInvestment / netMarginPerMonth)
  } else if (initialInvestment === 0 && netMarginPerMonth > 0) {
    breakevenMonths = 0
  } else if (netMarginPerMonth <= 0) {
    breakevenMonths = Infinity
  }

  const growthRate = 1.005

  let y1Rev = 0
  let y1Exp = 0
  for (let m = 0; m < 12; m++) {
    const ca = monthlyRevenue * Math.pow(growthRate, m)
    y1Rev += ca
    y1Exp += fixedChargesTotal + ca * (variableChargesRate / 100)
  }

  const baseA2 = monthlyRevenue * Math.pow(growthRate, 12) * 1.02
  let y2Rev = 0
  let y2Exp = 0
  for (let m = 0; m < 12; m++) {
    const ca = baseA2 * Math.pow(1.002, m)
    y2Rev += ca
    y2Exp += fixedChargesTotal + ca * (variableChargesRate / 100)
  }

  const baseA3 = baseA2 * Math.pow(1.002, 12) * 1.01
  let y3Rev = 0
  let y3Exp = 0
  for (let m = 0; m < 12; m++) {
    const ca = baseA3 * Math.pow(1.001, m)
    y3Rev += ca
    y3Exp += fixedChargesTotal + ca * (variableChargesRate / 100)
  }

  const profitability1Y = (y1Rev - y1Exp) - initialInvestment
  const profitability2Y = profitability1Y + (y2Rev - y2Exp)
  const profitability3Y = profitability2Y + (y3Rev - y3Exp)

  return {
    fixedChargesTotal,
    variableChargesAmount,
    totalCharges,
    grossMarginAmount,
    grossMarginRate,
    netMarginAmount,
    netMarginRate,
    monthlyBreakeven,
    breakevenMonths,
    profitability1Y,
    profitability2Y,
    profitability3Y,
    year1Revenue: y1Rev,
    year1Expenses: y1Exp,
    year2Revenue: y2Rev,
    year2Expenses: y2Exp,
    year3Revenue: y3Rev,
    year3Expenses: y3Exp,
  }
}

// ─── Chart data ──────────────────────────────

function generateChartData(inputs: SimulationInputs): ChartDataPoint[] {
  const { monthlyRevenue, fixedCharges, variableChargesRate } = inputs
  const fixedChargesTotal = fixedCharges.reduce((sum, c) => sum + c.amount, 0)
  const growthRate = 1.005
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

  return months.map((month, i) => {
    const ca = monthlyRevenue * Math.pow(growthRate, i)
    const charges = fixedChargesTotal + ca * (variableChargesRate / 100)
    return {
      month,
      ca: Math.round(ca),
      charges: Math.round(charges),
      resultat: Math.round(ca - charges),
    }
  })
}

// ─── Main Component ──────────────────────────

export function CreaSim() {
  const [inputs, setInputs] = useState<SimulationInputs>(DEFAULT_INPUTS)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [chargesExpanded, setChargesExpanded] = useState(true)
  const [newChargeName, setNewChargeName] = useState('')
  const [newChargeAmount, setNewChargeAmount] = useState('')

  // Load saved simulation on mount
  useEffect(() => {
    async function loadSimulation() {
      try {
        const res = await fetch('/api/creasim')
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const d = json.data
            setInputs({
              monthlyRevenue: d.monthlyRevenue ?? DEFAULT_INPUTS.monthlyRevenue,
              fixedCharges: Array.isArray(d.fixedCharges)
                ? d.fixedCharges.map((c: FixedCharge & { id?: string }) => ({
                    id: c.id || generateId(),
                    name: c.name,
                    amount: c.amount,
                  }))
                : DEFAULT_INPUTS.fixedCharges,
              variableChargesRate: d.variableChargesRate ?? DEFAULT_INPUTS.variableChargesRate,
              averageSellingPrice: d.averageSellingPrice ?? DEFAULT_INPUTS.averageSellingPrice,
              unitCost: d.unitCost ?? DEFAULT_INPUTS.unitCost,
              initialInvestment: d.initialInvestment ?? DEFAULT_INPUTS.initialInvestment,
              targetMarginRate: d.targetMarginRate ?? DEFAULT_INPUTS.targetMarginRate,
            })
          }
        }
      } catch {
        // Silently fail — use defaults
      } finally {
        setIsLoading(false)
      }
    }
    loadSimulation()
  }, [])

  const results = useMemo(() => calculateResults(inputs), [inputs])
  const chartData = useMemo(() => generateChartData(inputs), [inputs])

  // ─── Handlers ─────────────────────────────

  const updateInput = useCallback(<K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }))
  }, [])

  const addCharge = useCallback(() => {
    if (!newChargeName.trim() || !newChargeAmount) return
    const amount = parseFloat(newChargeAmount)
    if (isNaN(amount) || amount <= 0) return
    setInputs(prev => ({
      ...prev,
      fixedCharges: [...prev.fixedCharges, { id: generateId(), name: newChargeName.trim(), amount }],
    }))
    setNewChargeName('')
    setNewChargeAmount('')
  }, [newChargeName, newChargeAmount])

  const removeCharge = useCallback((id: string) => {
    setInputs(prev => ({
      ...prev,
      fixedCharges: prev.fixedCharges.filter(c => c.id !== id),
    }))
  }, [])

  const handleReset = useCallback(() => {
    setInputs(DEFAULT_INPUTS)
    toast.info('Simulation réinitialisée')
  }, [])

  const handleSaveAndSync = useCallback(async () => {
    setIsSaving(true)
    try {
      // 1. Save to creasim API
      const payload = {
        ...inputs,
        ...results,
        monthlyBreakeven: results.monthlyBreakeven === Infinity ? null : results.monthlyBreakeven,
        breakevenMonths: results.breakevenMonths === Infinity ? null : results.breakevenMonths,
      }
      const saveRes = await fetch('/api/creasim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
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
        toast.success('Simulation sauvegardée et synchronisée au Business Plan')
      } else {
        toast.error(saveJson.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }, [inputs, results])

  // ─── Loading skeleton ──────────────────────

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-4 md:p-6 lg:p-8 space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00838F]/10">
                <TrendingUp className="h-5 w-5 text-[#00838F]" />
              </div>
              CreaSim — Simulateur Financier
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajustez les curseurs pour simuler la rentabilité de votre projet en temps réel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* ═══════ GAUGES DASHBOARD ═══════ */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className={cn('border transition-colors', getTrafficLightBg(results.grossMarginRate, [50, 30]))}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Marge brute</span>
                {getStatusIcon(results.grossMarginRate, [50, 30])}
              </div>
              <p className="text-2xl font-bold" style={{ color: getTrafficLightColor(results.grossMarginRate, [50, 30]) }}>
                {formatPercent(results.grossMarginRate)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(results.grossMarginAmount)}/mois
              </p>
            </CardContent>
          </Card>

          <Card className={cn('border transition-colors', getTrafficLightBg(results.netMarginRate, [20, 0]))}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Marge nette</span>
                {getStatusIcon(results.netMarginRate, [20, 0])}
              </div>
              <p className="text-2xl font-bold" style={{ color: getTrafficLightColor(results.netMarginRate, [20, 0]) }}>
                {formatPercent(results.netMarginRate)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(results.netMarginAmount)}/mois
              </p>
            </CardContent>
          </Card>

          <Card className={cn(
            'border transition-colors',
            results.breakevenMonths <= 18 ? 'bg-green-500/10 border-green-500/20'
              : results.breakevenMonths <= 36 ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-red-500/10 border-red-500/20',
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seuil rent.</span>
                {results.breakevenMonths <= 18
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : results.breakevenMonths <= 36
                    ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                    : <XCircle className="h-4 w-4 text-red-500" />}
              </div>
              <p className="text-2xl font-bold text-foreground">
                {results.breakevenMonths === Infinity ? '—' : `${results.breakevenMonths}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {results.breakevenMonths === Infinity ? 'Non atteignable' : 'mois'}
              </p>
            </CardContent>
          </Card>

          <Card className="border bg-[#00838F]/5 border-[#00838F]/15">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CA mensuel</span>
                <DollarSign className="h-4 w-4 text-[#00838F]" />
              </div>
              <p className="text-2xl font-bold text-[#00838F]">{formatCurrency(inputs.monthlyRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Annuel : {formatCurrency(inputs.monthlyRevenue * 12)}
              </p>
            </CardContent>
          </Card>

          <Card className={cn(
            'border transition-colors col-span-2 lg:col-span-1',
            results.profitability1Y >= 0
              ? 'bg-green-500/10 border-green-500/20'
              : 'bg-red-500/10 border-red-500/20',
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rentab. A1</span>
                {results.profitability1Y >= 0
                  ? <TrendingUp className="h-4 w-4 text-green-500" />
                  : <TrendingDown className="h-4 w-4 text-red-500" />}
              </div>
              <p className={cn('text-2xl font-bold', results.profitability1Y >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                {formatCurrency(results.profitability1Y)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Après investissement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ═══════ SIMULATOR SLIDERS ═══════ */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#00838F]" />
              Paramètres du simulateur
            </CardTitle>
            <CardDescription>Modifiez les curseurs pour ajuster votre simulation en temps réel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CA Mensuel */}
            <SimSlider
              icon={<DollarSign className="h-4 w-4 text-[#00838F]" />}
              label="Chiffre d'affaires mensuel"
              description="Revenus mensuels prévisionnels de votre activité"
              value={inputs.monthlyRevenue}
              onChange={v => updateInput('monthlyRevenue', v)}
              min={0}
              max={50000}
              step={100}
              unit="€"
              color="#00838F"
            />

            <Separator />

            {/* Charges fixes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFB74D]/15">
                    <TrendingDown className="h-4 w-4 text-[#FFB74D]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Charges fixes mensuelles</p>
                    <p className="text-xs text-muted-foreground">Total : {formatCurrency(results.fixedChargesTotal)}/mois</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[#FFB74D] bg-[#FFB74D]/10 font-mono">
                  {inputs.fixedCharges.length} postes
                </Badge>
              </div>

              <button
                className="w-full text-left"
                onClick={() => setChargesExpanded(!chargesExpanded)}
              >
                <div className="flex items-center justify-center py-1">
                  {chargesExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {chargesExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pl-[42px]"
                >
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {inputs.fixedCharges.map(charge => (
                      <div key={charge.id} className="flex items-center gap-2 group">
                        <span className="flex-1 text-sm text-foreground truncate">{charge.name}</span>
                        <div className="relative w-28">
                          <Input
                            type="number"
                            value={charge.amount}
                            onChange={e => {
                              const val = Math.max(0, Number(e.target.value))
                              setInputs(prev => ({
                                ...prev,
                                fixedCharges: prev.fixedCharges.map(c =>
                                  c.id === charge.id ? { ...c, amount: val } : c
                                ),
                              }))
                            }}
                            className="pr-8 text-right text-sm h-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                          onClick={() => removeCharge(charge.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nouvelle charge..."
                      value={newChargeName}
                      onChange={e => setNewChargeName(e.target.value)}
                      className="flex-1 h-8 text-sm"
                      onKeyDown={e => e.key === 'Enter' && addCharge()}
                    />
                    <div className="relative w-28">
                      <Input
                        type="number"
                        placeholder="0"
                        value={newChargeAmount}
                        onChange={e => setNewChargeAmount(e.target.value)}
                        className="pr-8 text-right h-8 text-sm"
                        onKeyDown={e => e.key === 'Enter' && addCharge()}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={addCharge}
                      disabled={!newChargeName.trim() || !newChargeAmount}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            <Separator />

            {/* Taux charges variables */}
            <SimSlider
              icon={<TrendingDown className="h-4 w-4 text-[#FF6B35]" />}
              label="Taux de charges variables"
              description="% du CA dédié aux matières premières, transport, commissions..."
              value={inputs.variableChargesRate}
              onChange={v => updateInput('variableChargesRate', v)}
              min={0}
              max={80}
              step={1}
              unit="%"
              color="#FF6B35"
            />

            <Separator />

            {/* Prix de vente unitaire */}
            <SimSlider
              icon={<DollarSign className="h-4 w-4 text-[#00838F]" />}
              label="Prix de vente unitaire"
              description="Prix moyen de vente par unité / prestation"
              value={inputs.averageSellingPrice}
              onChange={v => updateInput('averageSellingPrice', v)}
              min={0}
              max={5000}
              step={10}
              unit="€"
              color="#00838F"
            />

            <Separator />

            {/* Coût unitaire */}
            <SimSlider
              icon={<TrendingDown className="h-4 w-4 text-red-500" />}
              label="Coût de revient unitaire"
              description="Coût de production / achat par unité"
              value={inputs.unitCost}
              onChange={v => updateInput('unitCost', v)}
              min={0}
              max={5000}
              step={10}
              unit="€"
              color="#EF4444"
            />

            <Separator />

            {/* Investissement initial */}
            <SimSlider
              icon={<Target className="h-4 w-4 text-purple-500" />}
              label="Investissement initial"
              description="Capital de départ (matériel, stock, frais de lancement, trésorerie...)"
              value={inputs.initialInvestment}
              onChange={v => updateInput('initialInvestment', v)}
              min={0}
              max={100000}
              step={500}
              unit="€"
              color="#a855f7"
            />

            {/* Unit margin callout */}
            {inputs.averageSellingPrice > 0 && (
              <div className={cn(
                'rounded-lg border p-3 text-center text-sm',
                (inputs.averageSellingPrice - inputs.unitCost) / inputs.averageSellingPrice >= 0.4
                  ? 'bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400'
                  : (inputs.averageSellingPrice - inputs.unitCost) / inputs.averageSellingPrice >= 0
                  ? 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'
                  : 'bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400',
              )}>
                <span className="text-muted-foreground">Marge unitaire : </span>
                <span className="font-semibold">
                  {formatCurrency(inputs.averageSellingPrice - inputs.unitCost)}
                </span>
                <span className="text-muted-foreground ml-1">
                  ({((inputs.averageSellingPrice - inputs.unitCost) / inputs.averageSellingPrice * 100).toFixed(1)}%)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══════ VISUAL GAUGES ═══════ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#00838F]" />
              Jauges de performance
            </CardTitle>
            <CardDescription>Indicateurs clés de rentabilité avec feux tricolores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-around gap-6 py-4">
              <CircularGauge
                value={Math.round(results.grossMarginRate)}
                max={100}
                label="Marge brute"
                thresholds={[50, 30]}
              />
              <CircularGauge
                value={Math.round(results.netMarginRate)}
                max={100}
                label="Marge nette"
                thresholds={[20, 0]}
              />
              <CircularGauge
                value={results.breakevenMonths === Infinity ? 0 : results.breakevenMonths}
                max={48}
                label="Seuil rent. (mois)"
                thresholds={[18, 36]}
                unit=""
              />
              <CircularGauge
                value={inputs.targetMarginRate}
                max={100}
                label="Objectif marge"
                thresholds={[20, 10]}
              />
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span>Bon</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Attention</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span>Critique</span>
              </div>
            </div>

            {/* Target margin progress */}
            <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Progression vers l&apos;objectif ({inputs.targetMarginRate}%)</span>
                {results.netMarginRate >= inputs.targetMarginRate
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <ArrowUpRight className="h-4 w-4 text-[#00838F]" />}
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    results.netMarginRate >= inputs.targetMarginRate ? 'bg-green-500' : 'bg-[#00838F]',
                  )}
                  style={{
                    width: `${Math.min(100, (results.netMarginRate / Math.max(1, inputs.targetMarginRate)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {results.netMarginRate >= inputs.targetMarginRate
                  ? '✅ Objectif de marge atteint !'
                  : `${formatPercent(inputs.targetMarginRate - results.netMarginRate)} d\'écart restant`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ═══════ 12-MONTH CHART ═══════ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#00838F]" />
              Prévisions sur 12 mois
            </CardTitle>
            <CardDescription>Évolution du chiffre d&apos;affaires et des charges (croissance estimée à 0,5%/mois)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00838F" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00838F" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCharges" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [formatCurrency(value), name === 'ca' ? 'Chiffre d\'affaires' : name === 'charges' ? 'Charges' : 'Résultat']}
                  />
                  <Legend
                    formatter={(value: string) => value === 'ca' ? 'Chiffre d\'affaires' : value === 'charges' ? 'Charges totales' : 'Résultat net'}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="ca" stroke="#00838F" strokeWidth={2} fill="url(#colorCA)" />
                  <Area type="monotone" dataKey="charges" stroke="#FF6B35" strokeWidth={2} fill="url(#colorCharges)" />
                  <Line
                    type="monotone"
                    dataKey="resultat"
                    stroke={results.netMarginAmount >= 0 ? '#2E7D32' : '#D32F2F'}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ═══════ 3-YEAR PROFITABILITY ═══════ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#00838F]" />
              Rentabilité projetée sur 3 ans
            </CardTitle>
            <CardDescription>Résultat cumulé après déduction de l&apos;investissement initial</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={cn(
                'rounded-xl border p-4 transition-colors',
                results.profitability1Y >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20',
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {results.profitability1Y >= 0
                    ? <TrendingUp className="h-4 w-4 text-green-500" />
                    : <TrendingDown className="h-4 w-4 text-red-500" />}
                  <span className="text-sm font-medium text-muted-foreground">À 1 an</span>
                </div>
                <p className={cn('text-xl font-bold', results.profitability1Y >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                  {formatCurrency(results.profitability1Y)}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>CA : <span className="text-foreground">{formatCurrency(results.year1Revenue)}</span></span>
                  <span>Charges : <span className="text-foreground">{formatCurrency(results.year1Expenses)}</span></span>
                </div>
              </div>

              <div className={cn(
                'rounded-xl border p-4 transition-colors',
                results.profitability2Y >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20',
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {results.profitability2Y >= 0
                    ? <TrendingUp className="h-4 w-4 text-green-500" />
                    : <TrendingDown className="h-4 w-4 text-red-500" />}
                  <span className="text-sm font-medium text-muted-foreground">À 2 ans</span>
                </div>
                <p className={cn('text-xl font-bold', results.profitability2Y >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                  {formatCurrency(results.profitability2Y)}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>CA : <span className="text-foreground">{formatCurrency(results.year2Revenue)}</span></span>
                  <span>Charges : <span className="text-foreground">{formatCurrency(results.year2Expenses)}</span></span>
                </div>
              </div>

              <div className={cn(
                'rounded-xl border p-4 transition-colors',
                results.profitability3Y >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20',
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {results.profitability3Y >= 0
                    ? <TrendingUp className="h-4 w-4 text-green-500" />
                    : <TrendingDown className="h-4 w-4 text-red-500" />}
                  <span className="text-sm font-medium text-muted-foreground">À 3 ans</span>
                </div>
                <p className={cn('text-xl font-bold', results.profitability3Y >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                  {formatCurrency(results.profitability3Y)}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>CA : <span className="text-foreground">{formatCurrency(results.year3Revenue)}</span></span>
                  <span>Charges : <span className="text-foreground">{formatCurrency(results.year3Expenses)}</span></span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════ SAVE & SYNC BUTTON ═══════ */}
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
            Sauvegarde la simulation et met à jour automatiquement les sections financières du Business Plan
          </p>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  )
}
