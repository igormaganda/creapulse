'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { authFetch } from '@/lib/auth-fetch'
import {
  Wallet, Plus, Save, Loader2, Sparkles, TrendingUp, TrendingDown,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Calendar, Euro,
  BarChart3, X, Search, Filter, PiggyBank, Receipt, CreditCard, Shield,
} from 'lucide-react'

// ─── Types ──────────────────────────────────

type TxType = 'entree' | 'sortie'
type TxCategory = 'ventes' | 'fournisseurs' | 'salaires' | 'loyer' | 'charges_sociales' | 'impots' | 'subventions' | 'autre'

interface Transaction {
  id: string
  date: string
  type: TxType
  category: TxCategory
  montant: number
  description: string
  tiers: string
}

interface ScenarioLine {
  id: string
  label: string
  type: 'entree' | 'sortie'
  montant: number
  recurrent: boolean
}

interface Scenario {
  id: string
  name: string
  lines: ScenarioLine[]
}

interface TresorerieData {
  transactions: Transaction[]
  scenarios: Scenario[]
  monthlyEstimates: Record<string, { revenus: number; charges: number }>
}

const CAT_LABELS: Record<TxCategory, string> = {
  ventes: 'Ventes', fournisseurs: 'Fournisseurs', salaires: 'Salaires',
  loyer: 'Loyer', charges_sociales: 'Charges sociales', impots: 'Impôts',
  subventions: 'Subventions', autre: 'Autre',
}

const CAT_ICONS: Record<TxCategory, string> = {
  ventes: '🛒', fournisseurs: '📦', salaires: '👥', loyer: '🏠',
  charges_sociales: '🏥', impots: '🏛️', subventions: '🎁', autre: '📌',
}

const STORAGE_KEY = 'creapulse-tresorerie'
const DEFAULT_DATA: TresorerieData = { transactions: [], scenarios: [], monthlyEstimates: {} }

// ─── Helpers ────────────────────────────────

function loadData(): TresorerieData {
  try { const s = localStorage.getItem(STORAGE_KEY); if (s) return { ...DEFAULT_DATA, ...JSON.parse(s) } } catch { /* */ }
  return DEFAULT_DATA
}

function fmt(n: number) { return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) }

function getMonthKey(date: string) { return date.slice(0, 7) }

function getLast6Months() {
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

// ─── Transaction Form Dialog ────────────────

function TxFormDialog({ open, onOpenChange, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (tx: Omit<Transaction, 'id'>) => void
}) {
  const getInitialForm = () => ({ date: new Date().toISOString().split('T')[0], type: 'entree' as TxType, category: 'ventes' as TxCategory, montant: '', description: '', tiers: '' })
  const [form, setForm] = useState(getInitialForm)
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setForm(getInitialForm())
  }

  const submit = () => {
    if (!form.montant || isNaN(Number(form.montant)) || Number(form.montant) <= 0) { toast.error('Montant invalide'); return }
    onSave({ ...form, montant: Number(form.montant) })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nouvelle transaction</DialogTitle><DialogDescription>Ajoutez une entrée ou une sortie de trésorerie.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Type *</p>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as TxType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entree">💰 Encaissement</SelectItem>
                  <SelectItem value="sortie">💸 Décaissement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Date *</p>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Catégorie *</p>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as TxCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{CAT_ICONS[k as TxCategory]} {v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Montant (€) *</p>
              <Input type="number" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))} placeholder="1500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Description</p>
            <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Prestation de conseil" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Client / Fournisseur</p>
            <Input value={form.tiers} onChange={e => setForm(p => ({ ...p, tiers: e.target.value }))} placeholder="Entreprise ABC" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={submit}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Mini Bar Chart (pure CSS, no Recharts dependency issues) ──

function MiniBarChart({ data }: { data: { label: string; value: number; positive: boolean }[] }) {
  const max = Math.max(...data.map(d => Math.abs(d.value)), 1)
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground">{d.value > 0 ? '+' : ''}{d.value.toLocaleString('fr-FR')}</span>
          <div className="w-full relative" style={{ height: '80px' }}>
            <div
              className={cn('absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[40px] rounded-t-sm transition-all duration-500', d.positive ? 'bg-teal-500' : 'bg-rose-500')}
              style={{ height: `${Math.max((Math.abs(d.value) / max) * 100, 4)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ─────────────────────────

export function TresorerieModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [data, setData] = useState<TresorerieData>(DEFAULT_DATA)
  const [txDialogOpen, setTxDialogOpen] = useState(false)
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => { setData(loadData()); setIsLoading(false) }, [])
  useEffect(() => { if (!isLoading) localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }, [isLoading, data])

  // ─── Transaction CRUD ─────────────────────
  const addTx = useCallback((tx: Omit<Transaction, 'id'>) => {
    setData(p => ({ ...p, transactions: [{ ...tx, id: crypto.randomUUID() }, ...p.transactions].sort((a, b) => b.date.localeCompare(a.date)) }))
    toast.success(tx.type === 'entree' ? 'Encaissement ajouté' : 'Décaissement ajouté')
  }, [])

  const deleteTx = useCallback((id: string) => {
    setData(p => ({ ...p, transactions: p.transactions.filter(t => t.id !== id) }))
    toast.success('Transaction supprimée')
  }, [])

  // ─── KPIs ─────────────────────────────────
  const kpis = useMemo(() => {
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonth = now.getMonth() === 0 ? `${now.getFullYear() - 1}-12` : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

    const txThisMonth = data.transactions.filter(t => getMonthKey(t.date) === thisMonth)
    const txLastMonth = data.transactions.filter(t => getMonthKey(t.date) === lastMonth)

    const entreesThis = txThisMonth.filter(t => t.type === 'entree').reduce((s, t) => s + t.montant, 0)
    const sortiesThis = txThisMonth.filter(t => t.type === 'sortie').reduce((s, t) => s + t.montant, 0)
    const entreesLast = txLastMonth.filter(t => t.type === 'entree').reduce((s, t) => s + t.montant, 0)

    const solde = data.transactions.reduce((s, t) => s + (t.type === 'entree' ? t.montant : -t.montant), 0)
    const chargesMensuelles = sortiesThis || (data.transactions.filter(t => t.type === 'sortie').reduce((s, t) => s + t.montant, 0) / Math.max(getLast6Months().length, 1))
    const joursCouverture = chargesMensuelles > 0 ? Math.round(solde / (chargesMensuelles / 30)) : 999

    const entreesTrend = entreesLast > 0 ? Math.round(((entreesThis - entreesLast) / entreesLast) * 100) : 0

    return { solde, entreesThis, sortiesThis, joursCouverture, entreesTrend, netThis: entreesThis - sortiesThis }
  }, [data.transactions])

  // ─── Monthly chart data ───────────────────
  const chartData = useMemo(() => {
    return getLast6Months().map(mk => {
      const txs = data.transactions.filter(t => getMonthKey(t.date) === mk)
      const entrees = txs.filter(t => t.type === 'entree').reduce((s, t) => s + t.montant, 0)
      const sorties = txs.filter(t => t.type === 'sortie').reduce((s, t) => s + t.montant, 0)
      const [y, m] = mk.split('-').map(Number)
      return { label: `${MONTH_NAMES[m - 1]}`, value: entrees - sorties, positive: entrees - sorties >= 0 }
    })
  }, [data.transactions])

  // ─── Filtered transactions ────────────────
  const filteredTx = useMemo(() => {
    let result = data.transactions
    if (monthFilter !== 'all') result = result.filter(t => getMonthKey(t.date) === monthFilter)
    if (typeFilter !== 'all') result = result.filter(t => t.type === typeFilter)
    return result
  }, [data.transactions, monthFilter, typeFilter])

  // ─── Scenarios ────────────────────────────
  const addScenario = useCallback((name: string) => {
    setData(p => ({ ...p, scenarios: [...p.scenarios, { id: crypto.randomUUID(), name, lines: [] }] }))
  }, [])

  const updateScenario = useCallback((id: string, lines: ScenarioLine[]) => {
    setData(p => ({ ...p, scenarios: p.scenarios.map(s => s.id === id ? { ...s, lines } : s) }))
  }, [])

  const deleteScenario = useCallback((id: string) => {
    setData(p => ({ ...p, scenarios: p.scenarios.filter(s => s.id !== id) }))
    toast.success('Scénario supprimé')
  }, [])

  // ─── Preset scenarios ────────────────────
  const addPresetScenario = useCallback((type: string) => {
    const presets: Record<string, { name: string; lines: ScenarioLine[] }> = {
      'perte-client': {
        name: 'Perte d\'un client majeur (-40% CA)',
        lines: [
          { id: crypto.randomUUID(), label: 'Chute CA client principal', type: 'sortie', montant: Math.round(kpis.entreesThis * 0.4), recurrent: true },
          { id: crypto.randomUUID(), label: 'Effort commercial supplétoire', type: 'sortie', montant: 500, recurrent: true },
        ],
      },
      'embauche': {
        name: 'Embauche d\'un collaborateur',
        lines: [
          { id: crypto.randomUUID(), label: 'Salaire brut', type: 'sortie', montant: 2500, recurrent: true },
          { id: crypto.randomUUID(), label: 'Charges patronales (~42%)', type: 'sortie', montant: 1050, recurrent: true },
          { id: crypto.randomUUID(), label: 'Gain de productivité estimé', type: 'entree', montant: 2000, recurrent: true },
        ],
      },
      'investissement': {
        name: 'Investissement matériel',
        lines: [
          { id: crypto.randomUUID(), label: 'Achat équipement', type: 'sortie', montant: 8000, recurrent: false },
          { id: crypto.randomUUID(), label: 'Amortissement mensuel (3 ans)', type: 'sortie', montant: 222, recurrent: true },
          { id: crypto.randomUUID(), label: 'Gain d\'efficacité', type: 'entree', montant: 500, recurrent: true },
        ],
      },
    }
    const preset = presets[type]
    if (preset) {
      setData(p => ({ ...p, scenarios: [...p.scenarios, { id: crypto.randomUUID(), ...preset }] }))
      toast.success(`Scénario "${preset.name}" ajouté`)
    }
  }, [kpis.entreesThis])

  // ─── Scenario impact calculation ──────────
  const getScenarioImpact = useCallback((scenario: Scenario) => {
    const monthlyImpact = scenario.lines.filter(l => l.recurrent).reduce((s, l) => s + (l.type === 'entree' ? l.montant : -l.montant), 0)
    const oneTimeImpact = scenario.lines.filter(l => !l.recurrent).reduce((s, l) => s + (l.type === 'entree' ? l.montant : -l.montant), 0)
    const newSolde = kpis.solde + oneTimeImpact
    const newMonthly = kpis.netThis + monthlyImpact
    const newJours = kpis.sortiesThis > 0 ? Math.round(newSolde / ((kpis.sortiesThis - monthlyImpact + newMonthly) / 30)) : 999
    return { monthlyImpact, oneTimeImpact, newSolde, newMonthly, newJours }
  }, [kpis])

  // ─── AI Analysis ─────────────────────────
  const handleAiAnalysis = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await authFetch('/api/tresorerie', {
        method: 'POST',
        body: JSON.stringify({ action: 'ai-analyze', solde: kpis.solde, entreesThis: kpis.entreesThis, sortiesThis: kpis.sortiesThis, joursCouverture: kpis.joursCouverture }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data?.suggestion) toast.success(json.data.suggestion)
      }
    } catch { toast.error('Erreur serveur') }
    finally { setAiLoading(false) }
  }, [kpis])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try { await authFetch('/api/tresorerie', { method: 'PUT', body: JSON.stringify(data) }); toast.success('Trésorerie sauvegardée') }
    catch { toast.error('Erreur de sauvegarde') }
    finally { setIsSaving(false) }
  }, [data])

  // ─── Available months for filter ──────────
  const availableMonths = useMemo(() => {
    const months = new Set(data.transactions.map(t => getMonthKey(t.date)))
    return [...months].sort().reverse()
  }, [data.transactions])

  // ─── Loading ─────────────────────────────
  if (isLoading) {
    return (<div className="p-4 md:p-6 lg:p-8 space-y-6"><div className="h-8 w-64 bg-muted animate-pulse rounded" /><div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div></div>)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:px-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
            <Wallet className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Trésorerie & Cash Flow</h2>
              <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 text-[10px] px-1.5">Nouveau</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Solde : {fmt(kpis.solde)} · {kpis.joursCouverture} jours de couverture</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 border-amber-400/40 text-amber-500 hover:bg-amber-400/10" onClick={handleAiAnalysis} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Aide IA
          </Button>
          <Button size="sm" className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Enregistrer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="flex-1">
        <div className="border-b px-4 md:px-6">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger value="dashboard" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Tableau de bord</TabsTrigger>
            <TabsTrigger value="transactions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Entrées/Sorties</TabsTrigger>
            <TabsTrigger value="previsions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Prévisions</TabsTrigger>
            <TabsTrigger value="scenarios" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Scénarios</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Dashboard ── */}
        <TabsContent value="dashboard" className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={cn('border-2', kpis.solde < 0 ? 'border-rose-300 dark:border-rose-800' : 'border-teal-200 dark:border-teal-800')}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10"><Wallet className="h-4 w-4 text-teal-600" /></div>
                  <span className="text-xs text-muted-foreground">Solde actuel</span>
                </div>
                <p className={cn('text-2xl font-bold', kpis.solde < 0 ? 'text-rose-600' : 'text-teal-600')}>{fmt(kpis.solde)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{kpis.joursCouverture} jours de couverture</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10"><ArrowUpRight className="h-4 w-4 text-emerald-600" /></div>
                  <span className="text-xs text-muted-foreground">Encaissements</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{fmt(kpis.entreesThis)}</p>
                <p className={cn('text-[11px] mt-1 flex items-center gap-1', kpis.entreesTrend >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                  {kpis.entreesTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {kpis.entreesTrend >= 0 ? '+' : ''}{kpis.entreesTrend}% vs mois dernier
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10"><ArrowDownRight className="h-4 w-4 text-rose-600" /></div>
                  <span className="text-xs text-muted-foreground">Décaissements</span>
                </div>
                <p className="text-2xl font-bold text-rose-600">{fmt(kpis.sortiesThis)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">ce mois</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10"><BarChart3 className="h-4 w-4 text-teal-600" /></div>
                  <span className="text-xs text-muted-foreground">Résultat net</span>
                </div>
                <p className={cn('text-2xl font-bold', kpis.netThis >= 0 ? 'text-teal-600' : 'text-rose-600')}>{fmt(kpis.netThis)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">ce mois</p>
              </CardContent>
            </Card>
          </div>

          {kpis.joursCouverture < 30 && (
            <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="flex items-center gap-3 py-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">Votre trésorerie couvre moins de 30 jours de charges. Action urgente recommandée.</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Cash Flow mensuel (6 derniers mois)</CardTitle></CardHeader>
            <CardContent>{chartData.every(d => d.value === 0) ? <p className="text-sm text-muted-foreground text-center py-8">Ajoutez des transactions pour voir le graphique.</p> : <MiniBarChart data={chartData} />}</CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setTxDialogOpen(true) }}><Plus className="h-4 w-4" /> Encaissement</Button>
            <Button variant="outline" className="gap-2 border-rose-300 text-rose-600 hover:bg-rose-50" onClick={() => setTxDialogOpen(true)}><Plus className="h-4 w-4" /> Décaissement</Button>
          </div>
        </TabsContent>

        {/* ── Transactions ── */}
        <TabsContent value="transactions" className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-3">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Mois" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les mois</SelectItem>
                  {availableMonths.map(m => { const [y, mo] = m.split('-'); return <SelectItem key={m} value={m}>{MONTH_NAMES[Number(mo) - 1]} {y}</SelectItem> })}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="entree">Encaissements</SelectItem>
                  <SelectItem value="sortie">Décaissements</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setTxDialogOpen(true)}><Plus className="h-4 w-4" /> Ajouter</Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-lg font-bold text-emerald-600">{fmt(filteredTx.filter(t => t.type === 'entree').reduce((s, t) => s + t.montant, 0))}</p><p className="text-xs text-muted-foreground">Entrées</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-lg font-bold text-rose-600">{fmt(filteredTx.filter(t => t.type === 'sortie').reduce((s, t) => s + t.montant, 0))}</p><p className="text-xs text-muted-foreground">Sorties</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-lg font-bold">{fmt(filteredTx.reduce((s, t) => s + (t.type === 'entree' ? t.montant : -t.montant), 0))}</p><p className="text-xs text-muted-foreground">Solde net</p></CardContent></Card>
          </div>

          {filteredTx.length === 0 ? (
            <Card className="p-8 text-center"><Wallet className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm font-medium">Aucune transaction</p><p className="text-xs text-muted-foreground mt-1">Ajoutez votre première entrée ou sortie.</p></Card>
          ) : (
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
              {filteredTx.slice(0, 50).map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base', tx.type === 'entree' ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-rose-100 dark:bg-rose-900/20')}>
                    {CAT_ICONS[tx.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description || CAT_LABELS[tx.category]}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString('fr-FR')}{tx.tiers ? ` · ${tx.tiers}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn('text-xs', tx.type === 'entree' ? 'text-emerald-600 border-emerald-300' : 'text-rose-600 border-rose-300')}>
                      {tx.type === 'entree' ? '+' : '-'}{fmt(tx.montant)}
                    </Badge>
                    <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity" onClick={() => deleteTx(tx.id)}><X className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Prévisions ── */}
        <TabsContent value="previsions" className="p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Prévisions sur 3 mois</CardTitle><CardDescription>Estimez vos revenus et charges mensuels pour visualiser votre trajectoire.</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['month1', 'month2', 'month3'].map((key, idx) => {
                  const now = new Date()
                  const mDate = new Date(now.getFullYear(), now.getMonth() + idx + 1, 1)
                  const label = `${MONTH_NAMES[mDate.getMonth()]} ${mDate.getFullYear()}`
                  const est = data.monthlyEstimates[key] || { revenus: 0, charges: 0 }
                  return (
                    <div key={key} className="grid grid-cols-3 gap-3 items-center">
                      <p className="text-sm font-medium">{label}</p>
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" />
                        <Input type="number" value={est.revenus || ''} onChange={e => setData(p => ({ ...p, monthlyEstimates: { ...p.monthlyEstimates, [key]: { ...est, revenus: Number(e.target.value) || 0 } } }))} placeholder="Revenus" className="h-9" />
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowDownRight className="h-4 w-4 text-rose-500 shrink-0" />
                        <Input type="number" value={est.charges || ''} onChange={e => setData(p => ({ ...p, monthlyEstimates: { ...p.monthlyEstimates, [key]: { ...est, charges: Number(e.target.value) || 0 } } }))} placeholder="Charges" className="h-9" />
                      </div>
                    </div>
                  )
                })}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Résumé prévisionnel</h4>
                {['month1', 'month2', 'month3'].map((key, idx) => {
                  const est = data.monthlyEstimates[key] || { revenus: 0, charges: 0 }
                  const net = est.revenus - est.charges
                  const now = new Date()
                  const mDate = new Date(now.getFullYear(), now.getMonth() + idx + 1, 1)
                  return (
                    <div key={key} className="flex items-center justify-between text-sm py-1">
                      <span className="text-muted-foreground">{MONTH_NAMES[mDate.getMonth()]} {mDate.getFullYear()}</span>
                      <span className={cn('font-medium', net >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{fmt(net)}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><PiggyBank className="h-4 w-4 text-teal-600" />Seuil de rentabilité</CardTitle></CardHeader>
            <CardContent>
              {(() => {
                const avgCharges = (data.monthlyEstimates.month1?.charges || kpis.sortiesThis)
                const seuil = avgCharges > 0 ? avgCharges : 0
                return (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Charges mensuelles estimées : <strong className="text-foreground">{fmt(seuil)}</strong></p>
                    <p className="text-sm text-muted-foreground">Seuil de rentabilité mensuel : <strong className="text-teal-600">{fmt(seuil)}</strong></p>
                    <p className="text-sm text-muted-foreground">Si vous facturez en moyenne <strong className="text-foreground">150 €/prestation</strong>, vous avez besoin de <strong className="text-foreground">{seuil > 0 ? Math.ceil(seuil / 150) : 0} prestations/mois</strong> pour couvrir vos charges.</p>
                    <Progress value={kpis.entreesThis > 0 && seuil > 0 ? Math.min((kpis.entreesThis / seuil) * 100, 100) : 0} className="h-3" />
                    <p className="text-xs text-muted-foreground text-right">{kpis.entreesThis > 0 && seuil > 0 ? Math.round((kpis.entreesThis / seuil) * 100) : 0}% du seuil atteint ce mois</p>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Scénarios ── */}
        <TabsContent value="scenarios" className="p-4 md:p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <p className="text-sm text-muted-foreground self-center mr-2">Scénarios prédéfinis :</p>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => addPresetScenario('perte-client')}><TrendingDown className="h-3.5 w-3.5" /> Perte client</Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => addPresetScenario('embauche')}><Receipt className="h-3.5 w-3.5" /> Embauche</Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => addPresetScenario('investissement')}><CreditCard className="h-3.5 w-3.5" /> Investissement</Button>
          </div>

          {data.scenarios.length === 0 ? (
            <Card className="p-8 text-center"><Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm font-medium">Aucun scénario</p><p className="text-xs text-muted-foreground mt-1">Ajoutez un scénario prédéfini ou créez le vôtre.</p></Card>
          ) : (
            <div className="space-y-4">
              {data.scenarios.map(scenario => {
                const impact = getScenarioImpact(scenario)
                return (
                  <Card key={scenario.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{scenario.name}</CardTitle>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => deleteScenario(scenario.id)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {scenario.lines.map(line => (
                        <div key={line.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {line.type === 'entree' ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> : <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />}
                            <span>{line.label}</span>
                            {line.recurrent && <Badge variant="outline" className="text-[10px]">/mois</Badge>}
                          </div>
                          <span className={cn('font-medium', line.type === 'entree' ? 'text-emerald-600' : 'text-rose-600')}>{line.type === 'entree' ? '+' : '-'}{fmt(line.montant)}</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-xs text-muted-foreground">Impact mensuel</p><p className={cn('text-sm font-bold', impact.monthlyImpact >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{fmt(impact.monthlyImpact)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Nouveau solde</p><p className={cn('text-sm font-bold', impact.newSolde >= 0 ? 'text-teal-600' : 'text-rose-600')}>{fmt(impact.newSolde)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Jours de couverture</p><p className={cn('text-sm font-bold', impact.newJours < 30 ? 'text-rose-600' : 'text-teal-600')}>{impact.newJours} jours</p></div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TxFormDialog open={txDialogOpen} onOpenChange={setTxDialogOpen} onSave={addTx} />
    </motion.div>
  )
}