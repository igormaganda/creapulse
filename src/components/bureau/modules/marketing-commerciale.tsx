'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Megaphone,
  Save,
  Plus,
  X,
  User,
  Target,
  TrendingUp,
  DollarSign,
  MapPin,
  Bell,
  BarChart3,
  Trash2,
  GripVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────

interface MarketingMixP {
  produit: string
  prix: string
  place: string
  promotion: string
}

interface Persona {
  id: string
  name: string
  age: string
  genre: string
  localisation: string
  revenus: string
  painPoints: string
  objectifs: string
}

interface Channel {
  id: string
  name: string
  type: 'online' | 'offline'
  priority: 'haute' | 'moyenne' | 'basse'
  budget: number
  notes: string
}

interface KpiItem {
  id: string
  name: string
  target: string
  current: string
  unit: string
}

interface MarketingData {
  mix: MarketingMixP
  personas: Persona[]
  channels: Channel[]
  kpis: KpiItem[]
  totalBudget: number
}

const STORAGE_KEY = 'creapulse-marketing-commerciale'

const defaultData: MarketingData = {
  mix: { produit: '', prix: '', place: '', promotion: '' },
  personas: [],
  channels: [],
  kpis: [],
  totalBudget: 100,
}

const PRIORITY_CONFIG = {
  haute: { label: 'Haute', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  moyenne: { label: 'Moyenne', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  basse: { label: 'Basse', color: 'bg-stone-100 text-stone-600 dark:bg-stone-900/30 dark:text-stone-400 border-stone-200 dark:border-stone-800' },
}

// ─── Helpers ────────────────────────────────

function uid(): string {
  return crypto.randomUUID()
}

// ─── 4P Editor Sub-component ─────────────────

function MixEditor({ label, value, onChange, icon: Icon, color }: {
  label: string
  value: string
  onChange: (v: string) => void
  icon: typeof Megaphone
  color: string
}) {
  return (
    <div className={cn('rounded-xl border p-4 space-y-2', color)}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-bold">{label}</p>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Décrivez votre stratégie ${label.toLowerCase()}...`}
        className="min-h-[80px] text-sm bg-background/60 border-border/50 resize-none"
      />
    </div>
  )
}

// ─── Persona Form ────────────────────────────

function PersonaCard({ persona, onUpdate, onDelete }: {
  persona: Persona
  onUpdate: (p: Persona) => void
  onDelete: (id: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/20 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <Input
            value={persona.name}
            onChange={(e) => onUpdate({ ...persona, name: e.target.value })}
            placeholder="Nom du persona"
            className="h-8 text-sm font-semibold border-0 p-0 focus-visible:ring-0 bg-transparent w-40"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={() => onDelete(persona.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={persona.age}
          onChange={(e) => onUpdate({ ...persona, age: e.target.value })}
          placeholder="Âge"
          className="h-8 text-xs"
        />
        <Input
          value={persona.genre}
          onChange={(e) => onUpdate({ ...persona, genre: e.target.value })}
          placeholder="Genre"
          className="h-8 text-xs"
        />
        <Input
          value={persona.localisation}
          onChange={(e) => onUpdate({ ...persona, localisation: e.target.value })}
          placeholder="Localisation"
          className="h-8 text-xs"
        />
        <Input
          value={persona.revenus}
          onChange={(e) => onUpdate({ ...persona, revenus: e.target.value })}
          placeholder="Revenus"
          className="h-8 text-xs"
        />
      </div>
      <Textarea
        value={persona.painPoints}
        onChange={(e) => onUpdate({ ...persona, painPoints: e.target.value })}
        placeholder="Points de douleur / frustrations..."
        className="min-h-[50px] text-xs bg-background/60 resize-none"
      />
      <Textarea
        value={persona.objectifs}
        onChange={(e) => onUpdate({ ...persona, objectifs: e.target.value })}
        placeholder="Objectifs / attentes..."
        className="min-h-[50px] text-xs bg-background/60 resize-none"
      />
    </motion.div>
  )
}

// ─── Channel Card ────────────────────────────

function ChannelCard({ channel, onUpdate, onDelete, budgetPercent }: {
  channel: Channel
  onUpdate: (c: Channel) => void
  onDelete: (id: string) => void
  budgetPercent: number
}) {
  const prio = PRIORITY_CONFIG[channel.priority]
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/20 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={channel.name}
            onChange={(e) => onUpdate({ ...channel, name: e.target.value })}
            placeholder="Nom du canal"
            className="h-8 text-sm font-semibold border-0 p-0 focus-visible:ring-0 bg-transparent"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={cn('text-[10px] border', prio.color)}>
            {channel.type === 'online' ? '🌐' : '🏪'} {prio.label}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => onDelete(channel.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={cn(
            'cursor-pointer text-[10px] border transition-colors',
            channel.type === 'online'
              ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          )}
          onClick={() => onUpdate({ ...channel, type: channel.type === 'online' ? 'offline' : 'online' })}
        >
          {channel.type === 'online' ? 'En ligne' : 'Physique'}
        </Badge>
        {(['haute', 'moyenne', 'basse'] as const).map((p) => (
          <Badge
            key={p}
            variant="outline"
            className={cn(
              'cursor-pointer text-[10px] border transition-colors',
              channel.priority === p ? PRIORITY_CONFIG[p].color : 'opacity-40 hover:opacity-70'
            )}
            onClick={() => onUpdate({ ...channel, priority: p })}
          >
            {PRIORITY_CONFIG[p].label}
          </Badge>
        ))}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Budget alloué</span>
          <span className="font-mono font-semibold text-foreground">{budgetPercent}%</span>
        </div>
        <Slider
          value={[channel.budget]}
          onValueChange={([v]) => onUpdate({ ...channel, budget: v })}
          max={100}
          step={1}
          className="w-full"
        />
      </div>
      <Textarea
        value={channel.notes}
        onChange={(e) => onUpdate({ ...channel, notes: e.target.value })}
        placeholder="Notes ou actions prévues..."
        className="min-h-[40px] text-xs bg-background/60 resize-none"
      />
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────

export function MarketingCommercialeModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<MarketingData>(defaultData)
  const [activeTab, setActiveTab] = useState('mix')

  // ─── Load from localStorage ──────────────
  useEffect(() => {
    async function load() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.mix) {
            setData({
              mix: parsed.mix ?? defaultData.mix,
              personas: parsed.personas ?? [],
              channels: parsed.channels ?? [],
              kpis: parsed.kpis ?? [],
              totalBudget: parsed.totalBudget ?? 100,
            })
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [isLoading, data])

  // ─── Handlers ─────────────────────────────
  const updateMix = useCallback((key: keyof MarketingMixP, value: string) => {
    setData(prev => ({ ...prev, mix: { ...prev.mix, [key]: value } }))
  }, [])

  const addPersona = useCallback(() => {
    const newPersona: Persona = {
      id: uid(), name: '', age: '', genre: '', localisation: '',
      revenus: '', painPoints: '', objectifs: '',
    }
    setData(prev => ({ ...prev, personas: [...prev.personas, newPersona] }))
    setActiveTab('personas')
  }, [])

  const updatePersona = useCallback((p: Persona) => {
    setData(prev => ({
      ...prev,
      personas: prev.personas.map(x => x.id === p.id ? p : x),
    }))
  }, [])

  const deletePersona = useCallback((id: string) => {
    setData(prev => ({ ...prev, personas: prev.personas.filter(x => x.id !== id) }))
  }, [])

  const addChannel = useCallback(() => {
    const newChannel: Channel = {
      id: uid(), name: '', type: 'online', priority: 'moyenne', budget: 10, notes: '',
    }
    setData(prev => ({ ...prev, channels: [...prev.channels, newChannel] }))
    setActiveTab('channels')
  }, [])

  const updateChannel = useCallback((c: Channel) => {
    setData(prev => ({
      ...prev,
      channels: prev.channels.map(x => x.id === c.id ? c : x),
    }))
  }, [])

  const deleteChannel = useCallback((id: string) => {
    setData(prev => ({ ...prev, channels: prev.channels.filter(x => x.id !== id) }))
  }, [])

  const addKpi = useCallback(() => {
    const newKpi: KpiItem = { id: uid(), name: '', target: '', current: '', unit: '%' }
    setData(prev => ({ ...prev, kpis: [...prev.kpis, newKpi] }))
    setActiveTab('kpis')
  }, [])

  const updateKpi = useCallback((k: KpiItem) => {
    setData(prev => ({
      ...prev,
      kpis: prev.kpis.map(x => x.id === k.id ? k : x),
    }))
  }, [])

  const deleteKpi = useCallback((id: string) => {
    setData(prev => ({ ...prev, kpis: prev.kpis.filter(x => x.id !== id) }))
  }, [])

  const totalChannelBudget = useMemo(() =>
    data.channels.reduce((sum, c) => sum + c.budget, 0),
    [data.channels]
  )

  const handleSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    toast.success('Stratégie marketing sauvegardée')
  }, [data])

  // ─── Loading skeleton ───────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
            <Megaphone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Stratégie Marketing & Commercial</h2>
            <p className="text-xs text-muted-foreground">
              {data.personas.length} persona(s) — {data.channels.length} canal(aux) — {data.kpis.length} KPI(s)
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleSave}>
          <Save className="h-3.5 w-3.5" />
          Enregistrer
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 p-3">
            <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-[11px] text-muted-foreground">Personas</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{data.personas.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 p-3">
            <Bell className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-[11px] text-muted-foreground">Canaux</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{data.channels.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 p-3">
            <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-[11px] text-muted-foreground">KPIs</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{data.kpis.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 p-3">
            <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-[11px] text-muted-foreground">Budget total</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{totalChannelBudget}%</p>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mix" className="text-xs sm:text-sm gap-1.5">
              <Megaphone className="h-3.5 w-3.5 hidden sm:block" />
              Mix 4P
            </TabsTrigger>
            <TabsTrigger value="personas" className="text-xs sm:text-sm gap-1.5">
              <User className="h-3.5 w-3.5 hidden sm:block" />
              Personas
              {data.personas.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{data.personas.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="channels" className="text-xs sm:text-sm gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 hidden sm:block" />
              Canaux
              {data.channels.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{data.channels.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="kpis" className="text-xs sm:text-sm gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 hidden sm:block" />
              KPIs
              {data.kpis.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{data.kpis.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Mix 4P Tab ── */}
          <TabsContent value="mix" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Définissez votre marketing mix selon les 4P : Produit, Prix, Place, Promotion.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MixEditor label="Produit" value={data.mix.produit} onChange={(v) => updateMix('produit', v)} icon={Target} color="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20" />
              <MixEditor label="Prix" value={data.mix.prix} onChange={(v) => updateMix('prix', v)} icon={DollarSign} color="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" />
              <MixEditor label="Place" value={data.mix.place} onChange={(v) => updateMix('place', v)} icon={MapPin} color="border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20" />
              <MixEditor label="Promotion" value={data.mix.promotion} onChange={(v) => updateMix('promotion', v)} icon={Bell} color="border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20" />
            </div>
          </TabsContent>

          {/* ── Personas Tab ── */}
          <TabsContent value="personas" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Définissez vos personas cibles pour mieux comprendre votre marché.
              </p>
              <Button size="sm" variant="outline" className="gap-1.5 border-orange-300 text-orange-600 hover:bg-orange-50" onClick={addPersona}>
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
            {data.personas.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <User className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">Aucun persona défini</p>
                  <p className="text-xs mt-1">Cliquez sur &quot;Ajouter&quot; pour créer votre premier persona cible.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data.personas.map((p) => (
                  <PersonaCard key={p.id} persona={p} onUpdate={updatePersona} onDelete={deletePersona} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Channels Tab ── */}
          <TabsContent value="channels" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Planifiez vos canaux de distribution et communication.
                </p>
                {totalChannelBudget > 100 && (
                  <Badge variant="destructive" className="text-[10px]">
                    Budget {totalChannelBudget}% &gt; 100%
                  </Badge>
                )}
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 border-orange-300 text-orange-600 hover:bg-orange-50" onClick={addChannel}>
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
            {data.channels.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">Aucun canal défini</p>
                  <p className="text-xs mt-1">Ajoutez vos canaux marketing et commerciaux.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {data.channels.map((c) => {
                  const total = Math.max(totalChannelBudget, 1)
                  const pct = Math.round((c.budget / total) * 100)
                  return (
                    <ChannelCard
                      key={c.id}
                      channel={c}
                      onUpdate={updateChannel}
                      onDelete={deleteChannel}
                      budgetPercent={pct}
                    />
                  )
                })}
              </div>
            )}
            {data.channels.length > 0 && (
              <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Répartition du budget</span>
                    <span className={cn('font-bold', totalChannelBudget > 100 ? 'text-red-500' : 'text-orange-600 dark:text-orange-400')}>
                      {totalChannelBudget}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden flex">
                    {data.channels.map((c) => {
                      const total = Math.max(totalChannelBudget, 1)
                      const width = (c.budget / total) * 100
                      return (
                        <div
                          key={c.id}
                          className="h-full bg-orange-500 first:rounded-l-full last:rounded-r-full"
                          style={{ width: `${width}%` }}
                          title={`${c.name || 'Sans nom'}: ${c.budget}%`}
                        />
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── KPIs Tab ── */}
          <TabsContent value="kpis" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Suivez vos indicateurs clés de performance marketing.
              </p>
              <Button size="sm" variant="outline" className="gap-1.5 border-orange-300 text-orange-600 hover:bg-orange-50" onClick={addKpi}>
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
            {data.kpis.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">Aucun KPI défini</p>
                  <p className="text-xs mt-1">Ajoutez vos indicateurs de performance pour suivre vos résultats.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {data.kpis.map((kpi) => (
                  <motion.div
                    key={kpi.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/20 p-4"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 shrink-0">
                      <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <Input
                        value={kpi.name}
                        onChange={(e) => updateKpi({ ...kpi, name: e.target.value })}
                        placeholder="Nom du KPI"
                        className="h-8 text-sm font-medium border-0 p-0 focus-visible:ring-0 bg-transparent"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground shrink-0">Cible:</span>
                        <Input
                          value={kpi.target}
                          onChange={(e) => updateKpi({ ...kpi, target: e.target.value })}
                          placeholder="100"
                          className="h-8 text-xs text-right"
                        />
                        <span className="text-[10px] text-muted-foreground shrink-0">{kpi.unit}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground shrink-0">Actuel:</span>
                        <Input
                          value={kpi.current}
                          onChange={(e) => updateKpi({ ...kpi, current: e.target.value })}
                          placeholder="0"
                          className="h-8 text-xs text-right"
                        />
                        <span className="text-[10px] text-muted-foreground shrink-0">{kpi.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              parseFloat(kpi.current) >= parseFloat(kpi.target) && kpi.target !== ''
                                ? 'bg-emerald-500'
                                : 'bg-orange-500'
                            )}
                            style={{
                              width: `${kpi.target ? Math.min((parseFloat(kpi.current || '0') / parseFloat(kpi.target)) * 100, 100) : 0}%`
                            }}
                          />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteKpi(kpi.id)} className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  )
}