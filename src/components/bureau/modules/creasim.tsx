'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

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

function getStatusColor(value: number, thresholds: [number, number]): string {
  if (value >= thresholds[0]) return 'text-green-600 dark:text-green-400'
  if (value >= thresholds[1]) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

function getStatusBg(value: number, thresholds: [number, number]): string {
  if (value >= thresholds[0]) return 'bg-green-500/10 border-green-500/20'
  if (value >= thresholds[1]) return 'bg-amber-500/10 border-amber-500/20'
  return 'bg-red-500/10 border-red-500/20'
}

function getStatusBadge(value: number, thresholds: [number, number]): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (value >= thresholds[0]) return { label: 'Bon', variant: 'default' }
  if (value >= thresholds[1]) return { label: 'Attention', variant: 'secondary' }
  return { label: 'Critique', variant: 'destructive' }
}

function getStatusIcon(value: number, thresholds: [number, number]) {
  if (value >= thresholds[0]) return <CheckCircle2 className="h-4 w-4 text-green-500" />
  if (value >= thresholds[1]) return <AlertTriangle className="h-4 w-4 text-amber-500" />
  return <XCircle className="h-4 w-4 text-red-500" />
}

// ─── Calculations ────────────────────────────

function calculateResults(inputs: SimulationInputs): SimulationResults {
  const { monthlyRevenue, fixedCharges, variableChargesRate, initialInvestment } = inputs
  const fixedChargesTotal = fixedCharges.reduce((sum, c) => sum + c.amount, 0)
  const variableChargesAmount = monthlyRevenue * (variableChargesRate / 100)
  const totalCharges = fixedChargesTotal + variableChargesAmount

  // Marge brute = CA - charges variables
  const grossMarginAmount = monthlyRevenue - variableChargesAmount
  const grossMarginRate = monthlyRevenue > 0 ? (grossMarginAmount / monthlyRevenue) * 100 : 0

  // Marge nette = marge brute - charges fixes
  const netMarginAmount = grossMarginAmount - fixedChargesTotal
  const netMarginRate = monthlyRevenue > 0 ? (netMarginAmount / monthlyRevenue) * 100 : 0

  // Point mort = charges fixes / (1 - taux charges variables)
  const coeff = 1 - variableChargesRate / 100
  const monthlyBreakeven = coeff > 0 ? fixedChargesTotal / coeff : Infinity

  // Seuil de rentabilité en mois
  const netMarginPerMonth = netMarginAmount
  let breakevenMonths = Infinity
  if (netMarginPerMonth > 0 && initialInvestment > 0) {
    breakevenMonths = Math.ceil(initialInvestment / netMarginPerMonth)
  } else if (initialInvestment === 0 && netMarginPerMonth > 0) {
    breakevenMonths = 0
  } else if (netMarginPerMonth <= 0) {
    breakevenMonths = Infinity
  }

  // Croissance estimée : +5% par mois (conservateur)
  const growthRate = 1.005

  // Année 1
  let y1Rev = 0
  let y1Exp = 0
  for (let m = 0; m < 12; m++) {
    const ca = monthlyRevenue * Math.pow(growthRate, m)
    y1Rev += ca
    y1Exp += fixedChargesTotal + ca * (variableChargesRate / 100)
  }

  // Année 2 (+2% par mois par rapport à fin A1)
  const baseA2 = monthlyRevenue * Math.pow(growthRate, 12) * 1.02
  let y2Rev = 0
  let y2Exp = 0
  for (let m = 0; m < 12; m++) {
    const ca = baseA2 * Math.pow(1.002, m)
    y2Rev += ca
    y2Exp += fixedChargesTotal + ca * (variableChargesRate / 100)
  }

  // Année 3 (+1% par mois par rapport à fin A2)
  const baseA3 = baseA2 * Math.pow(1.002, 12) * 1.01
  let y3Rev = 0
  let y3Exp = 0
  for (let m = 0; m < 12; m++) {
    const ca = baseA3 * Math.pow(1.001, m)
    y3Rev += ca
    y3Exp += fixedChargesTotal + ca * (variableChargesRate / 100)
  }

  // Rentabilité cumulée
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

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const payload = {
        ...inputs,
        ...results,
        // JSON.stringify converts Infinity to null; explicitly convert for clarity
        monthlyBreakeven: results.monthlyBreakeven === Infinity ? null : results.monthlyBreakeven,
        breakevenMonths: results.breakevenMonths === Infinity ? null : results.breakevenMonths,
      }
      const res = await fetch('/api/creasim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Simulation sauvegardée avec succès')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }, [inputs, results])

  const profitStatus = results.netMarginRate >= 20 ? 'positive' : results.netMarginRate >= 0 ? 'neutral' : 'negative'

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
              Estimez la rentabilité de votre projet et visualisez vos prévisions sur 3 ans.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 bg-[#00838F] hover:bg-[#00838F]/90 text-white">
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="parametres" className="space-y-6">
          <TabsList className="bg-muted/80">
            <TabsTrigger value="parametres" className="gap-1.5 data-[state=active]:bg-[#00838F] data-[state=active]:text-white">
              <DollarSign className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
            <TabsTrigger value="resultats" className="gap-1.5 data-[state=active]:bg-[#00838F] data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              Résultats
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════ TAB: PARAMÈTRES ═══════════════ */}
          <TabsContent value="parametres" className="space-y-6">
            {/* Revenue */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#00838F]" />
                  Chiffre d&apos;affaires prévisionnel
                </CardTitle>
                <CardDescription>Revenus mensuels estimés de votre activité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Slider
                    value={[inputs.monthlyRevenue]}
                    onValueChange={([v]) => updateInput('monthlyRevenue', v)}
                    min={0}
                    max={100000}
                    step={100}
                    className="flex-1"
                  />
                  <div className="relative w-36">
                    <Input
                      type="number"
                      value={inputs.monthlyRevenue}
                      onChange={e => updateInput('monthlyRevenue', Math.max(0, Number(e.target.value)))}
                      className="pr-8 text-right font-medium"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  CA annuel estimé : <span className="font-medium text-foreground">{formatCurrency(inputs.monthlyRevenue * 12)}</span>
                </p>
              </CardContent>
            </Card>

            {/* Fixed charges */}
            <Card>
              <CardHeader className="pb-4">
                <button
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                  onClick={() => setChargesExpanded(!chargesExpanded)}
                >
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[#FFB74D]" />
                      Charges fixes mensuelles
                      <Badge variant="secondary" className="ml-1 text-xs">{inputs.fixedCharges.length}</Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">Loyer, salaires, assurances, abonnements...</CardDescription>
                  </div>
                  {chargesExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </CardHeader>
              {chargesExpanded && (
                <CardContent className="space-y-3">
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
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
                  <p className="text-xs text-muted-foreground">
                    Total charges fixes : <span className="font-semibold text-foreground">{formatCurrency(results.fixedChargesTotal)}/mois</span>
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Variable charges + Selling price + Unit cost */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#FF6B35]" />
                    Charges variables
                  </CardTitle>
                  <CardDescription>Pourcentage du CA (matières, transport, commissions...)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[inputs.variableChargesRate]}
                      onValueChange={([v]) => updateInput('variableChargesRate', v)}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <div className="relative w-20">
                      <Input
                        type="number"
                        value={inputs.variableChargesRate}
                        onChange={e => updateInput('variableChargesRate', Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="pr-6 text-right font-medium"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Soit <span className="font-medium text-foreground">{formatCurrency(results.variableChargesAmount)}/mois</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#00838F]" />
                    Prix de revient unitaire
                  </CardTitle>
                  <CardDescription>Comparaison prix de vente / coût de production</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Prix de vente moyen</Label>
                      <div className="relative mt-1">
                        <Input
                          type="number"
                          value={inputs.averageSellingPrice}
                          onChange={e => updateInput('averageSellingPrice', Math.max(0, Number(e.target.value)))}
                          className="pr-8 text-right"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Coût de revient unitaire</Label>
                      <div className="relative mt-1">
                        <Input
                          type="number"
                          value={inputs.unitCost}
                          onChange={e => updateInput('unitCost', Math.max(0, Number(e.target.value)))}
                          className="pr-8 text-right"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                      </div>
                    </div>
                  </div>
                  {inputs.averageSellingPrice > 0 && (
                    <p className="text-xs">
                      <span className="text-muted-foreground">Marge unitaire :</span>{' '}
                      <span className={getStatusColor(
                        inputs.averageSellingPrice - inputs.unitCost,
                        [inputs.averageSellingPrice * 0.4, 0]
                      )}>
                        <span className="font-medium">
                          {formatCurrency(inputs.averageSellingPrice - inputs.unitCost)}
                        </span>
                        {' '}({((inputs.averageSellingPrice - inputs.unitCost) / inputs.averageSellingPrice * 100).toFixed(1)}%)
                      </span>
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Investment + Target margin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    Investissement initial
                  </CardTitle>
                  <CardDescription>Capital de départ nécessaire (matériel, stock, frais de lancement...)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Input
                      type="number"
                      value={inputs.initialInvestment}
                      onChange={e => updateInput('initialInvestment', Math.max(0, Number(e.target.value)))}
                      className="pr-8 text-right text-lg font-medium"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Taux de marge cible
                  </CardTitle>
                  <CardDescription>Objectif de marge nette à atteindre</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[inputs.targetMarginRate]}
                      onValueChange={([v]) => updateInput('targetMarginRate', v)}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <div className="relative w-20">
                      <Input
                        type="number"
                        value={inputs.targetMarginRate}
                        onChange={e => updateInput('targetMarginRate', Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="pr-6 text-right font-medium"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                  {results.netMarginRate < inputs.targetMarginRate && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-500">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      La marge actuelle ({formatPercent(results.netMarginRate)}) est inférieure à votre objectif ({formatPercent(inputs.targetMarginRate)})
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══════════════ TAB: RÉSULTATS ═══════════════ */}
          <TabsContent value="resultats" className="space-y-6">
            {/* Summary KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Marge brute */}
              <Card className={`border ${getStatusBg(results.grossMarginRate, [50, 30])} transition-colors`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Marge brute</span>
                    {getStatusIcon(results.grossMarginRate, [50, 30])}
                  </div>
                  <p className={`text-2xl font-bold ${getStatusColor(results.grossMarginRate, [50, 30])}`}>
                    {formatPercent(results.grossMarginRate)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(results.grossMarginAmount)}/mois
                  </p>
                </CardContent>
              </Card>

              {/* Marge nette */}
              <Card className={`border ${getStatusBg(results.netMarginRate, [20, 0])} transition-colors`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Marge nette</span>
                    {getStatusIcon(results.netMarginRate, [20, 0])}
                  </div>
                  <p className={`text-2xl font-bold ${getStatusColor(results.netMarginRate, [20, 0])}`}>
                    {formatPercent(results.netMarginRate)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(results.netMarginAmount)}/mois
                  </p>
                </CardContent>
              </Card>

              {/* Point mort */}
              <Card className={`border ${results.breakevenMonths <= 18 ? 'bg-green-500/10 border-green-500/20' : results.breakevenMonths <= 36 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seuil de rent.</span>
                    {results.breakevenMonths <= 18
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                      : results.breakevenMonths <= 36
                        ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                        : <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {results.breakevenMonths === Infinity ? '—' : `${results.breakevenMonths} mois`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Point mort : {results.monthlyBreakeven === Infinity ? '—' : formatCurrency(results.monthlyBreakeven)}/mois
                  </p>
                </CardContent>
              </Card>

              {/* Objectif marge */}
              <Card className="border bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Objectif marge</span>
                    <Target className="h-4 w-4 text-[#00838F]" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatPercent(inputs.targetMarginRate)}
                  </p>
                  <div className="mt-1.5">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          results.netMarginRate >= inputs.targetMarginRate ? 'bg-green-500' : 'bg-[#00838F]'
                        }`}
                        style={{
                          width: `${Math.min(100, (results.netMarginRate / inputs.targetMarginRate) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {results.netMarginRate >= inputs.targetMarginRate
                        ? 'Objectif atteint !'
                        : `${formatPercent(inputs.targetMarginRate - results.netMarginRate)} d'écart`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
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

            {/* 3-year profitability */}
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
                  {/* Year 1 */}
                  <div className={`rounded-xl border p-4 transition-colors ${
                    results.profitability1Y >= 0
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {results.profitability1Y >= 0
                        ? <TrendingUp className="h-4 w-4 text-green-500" />
                        : <TrendingDown className="h-4 w-4 text-red-500" />}
                      <span className="text-sm font-medium text-muted-foreground">À 1 an</span>
                    </div>
                    <p className={`text-xl font-bold ${results.profitability1Y >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {formatCurrency(results.profitability1Y)}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>CA : <span className="text-foreground">{formatCurrency(results.year1Revenue)}</span></span>
                      <span>Charges : <span className="text-foreground">{formatCurrency(results.year1Expenses)}</span></span>
                    </div>
                  </div>

                  {/* Year 2 */}
                  <div className={`rounded-xl border p-4 transition-colors ${
                    results.profitability2Y >= 0
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {results.profitability2Y >= 0
                        ? <TrendingUp className="h-4 w-4 text-green-500" />
                        : <TrendingDown className="h-4 w-4 text-red-500" />}
                      <span className="text-sm font-medium text-muted-foreground">À 2 ans</span>
                    </div>
                    <p className={`text-xl font-bold ${results.profitability2Y >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {formatCurrency(results.profitability2Y)}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>CA : <span className="text-foreground">{formatCurrency(results.year2Revenue)}</span></span>
                      <span>Charges : <span className="text-foreground">{formatCurrency(results.year2Expenses)}</span></span>
                    </div>
                  </div>

                  {/* Year 3 */}
                  <div className={`rounded-xl border p-4 transition-colors ${
                    results.profitability3Y >= 0
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {results.profitability3Y >= 0
                        ? <TrendingUp className="h-4 w-4 text-green-500" />
                        : <TrendingDown className="h-4 w-4 text-red-500" />}
                      <span className="text-sm font-medium text-muted-foreground">À 3 ans</span>
                    </div>
                    <p className={`text-xl font-bold ${results.profitability3Y >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
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

            {/* Detailed charges breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4 text-[#00838F]" />
                  Détail des charges mensuelles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Total charges */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total des charges</span>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(results.totalCharges)}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                    {results.totalCharges > 0 && (
                      <>
                        <div
                          className="h-full bg-[#FFB74D] transition-all duration-500"
                          style={{ width: `${(results.fixedChargesTotal / results.totalCharges) * 100}%` }}
                        />
                        <div
                          className="h-full bg-[#FF6B35] transition-all duration-500"
                          style={{ width: `${(results.variableChargesAmount / results.totalCharges) * 100}%` }}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FFB74D]" />
                      Fixes : {formatCurrency(results.fixedChargesTotal)} ({results.totalCharges > 0 ? ((results.fixedChargesTotal / results.totalCharges) * 100).toFixed(1) : 0}%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B35]" />
                      Variables : {formatCurrency(results.variableChargesAmount)} ({results.totalCharges > 0 ? ((results.variableChargesAmount / results.totalCharges) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>

                  <Separator />

                  {/* Individual fixed charges */}
                  {inputs.fixedCharges.length > 0 && (
                    <div className="space-y-1.5">
                      {inputs.fixedCharges.map(charge => (
                        <div key={charge.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{charge.name}</span>
                          <span className="font-medium">{formatCurrency(charge.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Marge brute</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(results.grossMarginAmount)}</p>
                      <p className="text-xs text-muted-foreground">({formatPercent(results.grossMarginRate)})</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Marge nette</p>
                      <p className={`text-lg font-bold ${results.netMarginAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        {formatCurrency(results.netMarginAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">({formatPercent(results.netMarginRate)})</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bottom save bar (mobile-friendly) */}
            <div className="flex items-center gap-2 justify-end sm:hidden">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 bg-[#00838F] hover:bg-[#00838F]/90 text-white">
                <Save className="h-3.5 w-3.5" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </TooltipProvider>
  )
}
