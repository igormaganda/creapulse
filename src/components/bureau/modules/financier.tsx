'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Calculator,
  Save,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
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
} from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────

interface RevenueItem {
  id: string
  name: string
  unitPrice: number
  quantity: number
  year: number
}

interface ExpenseItem {
  id: string
  category: string
  label: string
  amount: number
  year: number
}

interface Investment {
  id: string
  name: string
  amount: number
}

// ─── Helpers ────────────────────────────────

function genId(): string {
  return Math.random().toString(36).slice(2, 9)
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

const EXPENSE_CATEGORIES = ['Personnel', 'Local', 'Marketing', 'Fournisseurs', 'Assurances', 'Transport', 'Autres']

const INVESTMENT_PRESETS = [
  'Matériel informatique',
  'Mobilier',
  'Outillage professionnel',
  'Stock initial',
  'Fond de commerce',
  'Aménagement local',
  'Site internet',
  'Logiciels / Licences',
  'Véhicule',
  'Autre',
]

// ─── Main Component ─────────────────────────

export function FinancierModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSynthesis, setAiSynthesis] = useState('')

  // VAT regime
  const [vatRegime, setVatRegime] = useState('')

  // Active year tab
  const [activeYear, setActiveYear] = useState(1)

  // Revenue items (all years)
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([])
  // Expense items (all years)
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  // Investments
  const [investments, setInvestments] = useState<Investment[]>([])

  // ─── Load data on mount ──────────────────
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('creapulse-financier')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.revenueItems?.length) setRevenueItems(parsed.revenueItems)
          if (parsed.expenseItems?.length) setExpenseItems(parsed.expenseItems)
          if (parsed.investments?.length) setInvestments(parsed.investments)
          if (parsed.aiSynthesis) setAiSynthesis(parsed.aiSynthesis)
          if (parsed.vatRegime) setVatRegime(parsed.vatRegime)
        } catch { /* ignore */ }
      }

      try {
        const res = await fetch('/api/financier', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data?.aiSynthesis) {
            setAiSynthesis(json.data.aiSynthesis)
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
      localStorage.setItem('creapulse-financier', JSON.stringify({
        revenueItems, expenseItems, investments, aiSynthesis, vatRegime,
      }))
    }
  }, [isLoading, revenueItems, expenseItems, investments, aiSynthesis, vatRegime])

  // ─── Computed values ─────────────────────
  const yearRevenue = useCallback((year: number) => {
    return revenueItems
      .filter(item => item.year === year)
      .reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  }, [revenueItems])

  const yearExpenses = useCallback((year: number) => {
    return expenseItems
      .filter(item => item.year === year)
      .reduce((sum, item) => sum + item.amount, 0)
  }, [expenseItems])

  const totalInvestment = useMemo(() => {
    return investments.reduce((sum, inv) => sum + inv.amount, 0)
  }, [investments])

  const yearResults = useMemo(() => {
    return [1, 2, 3].map(year => ({
      year,
      revenue: yearRevenue(year),
      expenses: yearExpenses(year),
      result: yearRevenue(year) - yearExpenses(year),
      margin: yearRevenue(year) > 0 ? ((yearRevenue(year) - yearExpenses(year)) / yearRevenue(year) * 100) : 0,
    }))
  }, [yearRevenue, yearExpenses])

  const y1Revenue = yearResults[0].revenue
  const y1Expenses = yearResults[0].expenses
  const y1MonthlyRevenue = y1Revenue / 12
  const y1MonthlyExpenses = y1Expenses / 12

  const breakevenMonth = useMemo(() => {
    if (y1MonthlyExpenses <= 0) return null
    if (y1MonthlyRevenue <= y1MonthlyExpenses) return null
    const months = totalInvestment / (y1MonthlyRevenue - y1MonthlyExpenses)
    return Math.ceil(months)
  }, [y1MonthlyRevenue, y1MonthlyExpenses, totalInvestment])

  // Chart data
  const chartData = useMemo(() => {
    return [
      { name: 'Année 1', Revenus: yearResults[0].revenue, Charges: yearResults[0].expenses },
      { name: 'Année 2', Revenus: yearResults[1].revenue, Charges: yearResults[1].expenses },
      { name: 'Année 3', Revenus: yearResults[2].revenue, Charges: yearResults[2].expenses },
    ]
  }, [yearResults])

  // ─── Revenue CRUD ───────────────────────
  const addRevenueItem = useCallback(() => {
    setRevenueItems(prev => [...prev, { id: genId(), name: '', unitPrice: 0, quantity: 0, year: activeYear }])
  }, [activeYear])

  const updateRevenueItem = useCallback((id: string, field: keyof RevenueItem, value: string | number) => {
    setRevenueItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }, [])

  const removeRevenueItem = useCallback((id: string) => {
    setRevenueItems(prev => prev.filter(item => item.id !== id))
  }, [])

  // ─── Expense CRUD ───────────────────────
  const addExpenseItem = useCallback(() => {
    setExpenseItems(prev => [...prev, { id: genId(), category: 'Personnel', label: '', amount: 0, year: activeYear }])
  }, [activeYear])

  const updateExpenseItem = useCallback((id: string, field: keyof ExpenseItem, value: string | number) => {
    setExpenseItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }, [])

  const removeExpenseItem = useCallback((id: string) => {
    setExpenseItems(prev => prev.filter(item => item.id !== id))
  }, [])

  // ─── Investment CRUD ────────────────────
  const addInvestment = useCallback((name?: string) => {
    setInvestments(prev => [...prev, { id: genId(), name: name || '', amount: 0 }])
  }, [])

  const updateInvestment = useCallback((id: string, field: keyof Investment, value: string | number) => {
    setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, [field]: value } : inv))
  }, [])

  const removeInvestment = useCallback((id: string) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id))
  }, [])

  // ─── Save to API ────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/financier', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          year1Revenue: yearResults[0].revenue,
          year2Revenue: yearResults[1].revenue,
          year3Revenue: yearResults[2].revenue,
          year1Expenses: yearResults[0].expenses,
          year2Expenses: yearResults[1].expenses,
          year3Expenses: yearResults[2].expenses,
          breakevenMonth,
          initialInvestment: totalInvestment,
          aiSynthesis,
          vatRegime,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Plan financier sauvegardé')
      } else {
        toast.error(json.error?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setIsSaving(false)
    }
  }, [yearResults, breakevenMonth, totalInvestment, aiSynthesis])

  // ─── AI Suggestions ─────────────────────
  const handleAiSuggest = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/financier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          year1Revenue: yearResults[0].revenue,
          year1Expenses: yearResults[0].expenses,
          year2Revenue: yearResults[1].revenue,
          year2Expenses: yearResults[1].expenses,
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.suggestions) {
        setAiSynthesis(json.data.suggestions)
        toast.success('Suggestions IA générées !')
      } else {
        toast.error(json.error?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setAiLoading(false)
    }
  }, [yearResults])

  // ─── Active year items ──────────────────
  const activeRevenueItems = revenueItems.filter(item => item.year === activeYear)
  const activeExpenseItems = expenseItems.filter(item => item.year === activeYear)
  const activeYearData = yearResults[activeYear - 1]

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
            <h2 className="text-xl font-bold text-foreground">Plan Financier</h2>
            <p className="text-xs text-muted-foreground">Projections sur 3 ans</p>
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
            Suggestions IA
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-[#00838F] hover:bg-[#00838F]/90 text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Revenus A1', value: activeYearData.revenue, icon: TrendingUp, color: 'text-green-600 bg-green-50 dark:bg-green-900/10' },
            { label: 'Total Charges A1', value: activeYearData.expenses, icon: TrendingDown, color: 'text-red-600 bg-red-50 dark:bg-red-900/10' },
            { label: 'Résultat net A1', value: activeYearData.result, icon: DollarSign, color: activeYearData.result >= 0 ? 'text-green-600 bg-green-50 dark:bg-green-900/10' : 'text-red-600 bg-red-50 dark:bg-red-900/10' },
            { label: 'Marge nette', value: `${activeYearData.margin.toFixed(1)}%`, icon: Target, color: 'text-[#00838F] bg-[#00838F]/10', isText: true },
            { label: 'Point mort', value: breakevenMonth ? `Mois ${breakevenMonth}` : 'N/A', icon: BarChart3, color: 'text-[#FF6B35] bg-[#FF6B35]/10', isText: true },
          ].map(kpi => {
            const Icon = kpi.icon
            return (
              <Card key={kpi.label}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', kpi.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</span>
                  </div>
                  <p className={cn(
                    'text-sm font-bold',
                    typeof kpi.value === 'number' && kpi.value < 0 ? 'text-red-600' : '',
                  )}>
                    {kpi.isText ? String(kpi.value) : formatCurrency(typeof kpi.value === 'number' ? kpi.value : 0)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* ── Chart ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revenus vs Charges — 3 ans</CardTitle>
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
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ── Tabs: Year projections ── */}
        <Tabs value={String(activeYear)} onValueChange={v => setActiveYear(parseInt(v))}>
          <TabsList className="bg-muted/80">
            {[1, 2, 3].map(y => (
              <TabsTrigger
                key={y}
                value={String(y)}
                className="gap-1.5 data-[state=active]:bg-[#00838F] data-[state=active]:text-white"
              >
                Année {y}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1 data-[state=active]:bg-white/20">
                  {formatCurrency(yearRevenue(y))}
                </Badge>
              </TabsTrigger>
            ))}
            <TabsTrigger value="invest" className="gap-1.5 data-[state=active]:bg-[#00838F] data-[state=active]:text-white">
              Investissements
            </TabsTrigger>
            <TabsTrigger value="fiscalite" className="gap-1.5 data-[state=active]:bg-[#00838F] data-[state=active]:text-white">
              Fiscalité
            </TabsTrigger>
          </TabsList>

          {/* Year tabs */}
          {[1, 2, 3].map(y => (
            <TabsContent key={y} value={String(y)} className="space-y-6 mt-4">
              {/* Revenue */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Revenus — Année {y}</CardTitle>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                      setRevenueItems(prev => [...prev, { id: genId(), name: '', unitPrice: 0, quantity: 0, year: y }])
                    }}>
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {revenueItems.filter(item => item.year === y).length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Aucun produit/service ajouté. Cliquez sur &quot;Ajouter&quot; pour commencer.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-48">Produit / Service</TableHead>
                            <TableHead className="w-32">Prix unitaire</TableHead>
                            <TableHead className="w-24">Quantité</TableHead>
                            <TableHead className="w-32">Total</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {revenueItems.filter(item => item.year === y).map(item => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Input
                                  value={item.name}
                                  onChange={e => updateRevenueItem(item.id, 'name', e.target.value)}
                                  placeholder="Nom du produit"
                                  className="border-0 shadow-none p-0 h-auto focus-visible:ring-0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.unitPrice || ''}
                                  onChange={e => updateRevenueItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 w-28"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.quantity || ''}
                                  onChange={e => updateRevenueItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 w-20"
                                />
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => removeRevenueItem(item.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-semibold">
                            <TableCell>Total</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-green-600">{formatCurrency(yearRevenue(y))}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expenses */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Charges — Année {y}</CardTitle>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                      setExpenseItems(prev => [...prev, { id: genId(), category: 'Personnel', label: '', amount: 0, year: y }])
                    }}>
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {expenseItems.filter(item => item.year === y).length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Aucune charge ajoutée. Cliquez sur &quot;Ajouter&quot; pour commencer.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-36">Catégorie</TableHead>
                            <TableHead>Libellé</TableHead>
                            <TableHead className="w-32">Montant</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expenseItems.filter(item => item.year === y).map(item => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Select value={item.category} onValueChange={v => updateExpenseItem(item.id, 'category', v)}>
                                  <SelectTrigger className="border-0 shadow-none p-0 h-auto focus:ring-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {EXPENSE_CATEGORIES.map(cat => (
                                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.label}
                                  onChange={e => updateExpenseItem(item.id, 'label', e.target.value)}
                                  placeholder="Description"
                                  className="border-0 shadow-none p-0 h-auto focus-visible:ring-0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.amount || ''}
                                  onChange={e => updateExpenseItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 w-28"
                                />
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => removeExpenseItem(item.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-semibold">
                            <TableCell>Total charges</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-red-600">{formatCurrency(yearExpenses(y))}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Year summary */}
              <Card className={cn(
                'border',
                activeYearData.result >= 0 ? 'border-green-500/30 bg-green-50/30 dark:bg-green-900/10' : 'border-red-500/30 bg-red-50/30 dark:bg-red-900/10',
              )}>
                <CardContent className="pt-4 pb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Revenus</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(activeYearData.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Charges</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(activeYearData.expenses)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Résultat net</p>
                      <p className={cn('text-lg font-bold', activeYearData.result >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {formatCurrency(activeYearData.result)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          {/* Investments tab */}
          <TabsContent value="invest" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Investissement initial</h3>
              <div className="flex items-center gap-2">
                <Select onValueChange={v => addInvestment(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Ajouter un investissement..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_PRESETS.map(preset => (
                      <SelectItem key={preset} value={preset}>{preset}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => addInvestment()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="pt-4">
                {investments.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Aucun investissement ajouté.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Investissement</TableHead>
                          <TableHead className="w-32">Montant</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {investments.map(inv => (
                          <TableRow key={inv.id}>
                            <TableCell>
                              <Input
                                value={inv.name}
                                onChange={e => updateInvestment(inv.id, 'name', e.target.value)}
                                placeholder="Nom de l'investissement"
                                className="border-0 shadow-none p-0 h-auto focus-visible:ring-0"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={inv.amount || ''}
                                onChange={e => updateInvestment(inv.id, 'amount', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 w-28"
                              />
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => removeInvestment(inv.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell>Total investissement</TableCell>
                          <TableCell className="text-[#FF6B35]">{formatCurrency(totalInvestment)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fiscalité tab */}
          <TabsContent value="fiscalite" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Régime fiscal / TVA</CardTitle>
                    <Badge variant="secondary" className={cn(
                      'text-xs',
                      vatRegime && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    )}>
                      {vatRegime ? 'Sélectionné' : 'Non défini'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Le régime de TVA dépend de votre chiffre d&apos;affaires et de la nature de votre activité. Choisissez le régime qui correspond à votre situation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Franchise de TVA */}
                  <button
                    type="button"
                    onClick={() => setVatRegime('exempt')}
                    className={cn(
                      'text-left rounded-xl border-2 p-4 transition-all hover:shadow-md',
                      vatRegime === 'exempt'
                        ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10 ring-1 ring-green-500/20'
                        : 'border-border hover:border-green-500/30',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        vatRegime === 'exempt' ? 'border-green-500 bg-green-500' : 'border-muted-foreground/30',
                      )}>
                        {vatRegime === 'exempt' && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-green-700 dark:text-green-400">Franchise de TVA</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pas de TVA facturée à vos clients. Simple et adapté aux petites activités.
                    </p>
                    <Badge variant="secondary" className="mt-2 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Plafond : 85 800 € (services)
                    </Badge>
                  </button>

                  {/* Régime simplifié */}
                  <button
                    type="button"
                    onClick={() => setVatRegime('simplified')}
                    className={cn(
                      'text-left rounded-xl border-2 p-4 transition-all hover:shadow-md',
                      vatRegime === 'simplified'
                        ? 'border-[#00838F] bg-[#00838F]/5 ring-1 ring-[#00838F]/20'
                        : 'border-border hover:border-[#00838F]/30',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        vatRegime === 'simplified' ? 'border-[#00838F] bg-[#00838F]' : 'border-muted-foreground/30',
                      )}>
                        {vatRegime === 'simplified' && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-[#00838F]">Régime simplifié</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Déclarations annuelles. TVA déductible sur vos achats.
                    </p>
                    <Badge variant="secondary" className="mt-2 text-xs bg-[#00838F]/10 text-[#00838F]">
                      CA &lt; 85 800 € (ventes)
                    </Badge>
                  </button>

                  {/* Régime réel normal */}
                  <button
                    type="button"
                    onClick={() => setVatRegime('real')}
                    className={cn(
                      'text-left rounded-xl border-2 p-4 transition-all hover:shadow-md',
                      vatRegime === 'real'
                        ? 'border-[#FF6B35] bg-[#FF6B35]/5 ring-1 ring-[#FF6B35]/20'
                        : 'border-border hover:border-[#FF6B35]/30',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        vatRegime === 'real' ? 'border-[#FF6B35] bg-[#FF6B35]' : 'border-muted-foreground/30',
                      )}>
                        {vatRegime === 'real' && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-[#FF6B35]">Régime réel normal</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Déclarations mensuelles. Adapté aux gros volumes de CA.
                    </p>
                    <Badge variant="secondary" className="mt-2 text-xs bg-[#FF6B35]/10 text-[#FF6B35]">
                      Obligatoire au-delà des plafonds
                    </Badge>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── 3-year overview ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vue d&apos;ensemble 3 ans</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead className="text-center">Année 1</TableHead>
                    <TableHead className="text-center">Année 2</TableHead>
                    <TableHead className="text-center">Année 3</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Revenus</TableCell>
                    {yearResults.map(yr => (
                      <TableCell key={yr.year} className="text-center text-green-600">{formatCurrency(yr.revenue)}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Charges</TableCell>
                    {yearResults.map(yr => (
                      <TableCell key={yr.year} className="text-center text-red-600">{formatCurrency(yr.expenses)}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell>Résultat net</TableCell>
                    {yearResults.map(yr => (
                      <TableCell key={yr.year} className={cn('text-center', yr.result >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {formatCurrency(yr.result)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Marge nette</TableCell>
                    {yearResults.map(yr => (
                      <TableCell key={yr.year} className="text-center">{yr.margin.toFixed(1)}%</TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ── AI Synthesis ── */}
        {aiSynthesis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-[#FFB74D]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FFB74D]" />
                  Suggestions IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                  {aiSynthesis}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
