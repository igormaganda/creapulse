'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Globe,
  Save,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  BarChart3,
  Shield,
  Check,
  Circle,
  Info,
  Wand2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────

interface Trend {
  id: string
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
}

interface Competitor {
  id: string
  name: string
  strengths: string
  weaknesses: string
  marketShare: number
}

interface SwotData {
  strengths: string
  weaknesses: string
  opportunities: string
  threats: string
}

// ─── Helpers ────────────────────────────────

function genId(): string {
  return Math.random().toString(36).slice(2, 9)
}

const CATEGORIES = ['Commerce', 'Services', 'Tech', 'Artisanat', 'Restauration', 'Autre']

const DEFAULT_SWOT: SwotData = { strengths: '', weaknesses: '', opportunities: '', threats: '' }

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

// ─── AI Section Button ──────────────────────

function AiSectionButton({
  section,
  existingContent,
  onResult,
}: {
  section: string
  existingContent?: string
  onResult: (suggestion: unknown) => void
}) {
  const [loading, setLoading] = useState(false)

  const handleClick = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai-suggest-section',
          section,
          existingContent: existingContent || undefined,
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.suggestion !== undefined) {
        onResult(json.data.suggestion)
        toast.success('Suggestion IA chargée')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la suggestion IA')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }, [section, existingContent, onResult])

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-1.5 text-[#FFB74D] hover:text-[#FFB74D] hover:bg-[#FFB74D]/10 h-7 px-2 shrink-0"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      <span className="text-xs">Aide IA</span>
    </Button>
  )
}

// ─── Main Component ─────────────────────────

export function MarcheModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [autofillLoading, setAutofillLoading] = useState(false)

  // Section-level AI loading states
  const [sectionAiLoading, setSectionAiLoading] = useState<Record<string, boolean>>({})

  // Sector
  const [sector, setSector] = useState('')
  const [category, setCategory] = useState('')

  // Market size
  const [marketSize, setMarketSize] = useState<string>('')
  const [growthRate, setGrowthRate] = useState<number>(5)

  // Target audience
  const [targetAudience, setTargetAudience] = useState('')
  const [targetAgeRange, setTargetAgeRange] = useState('')
  const [targetLocation, setTargetLocation] = useState('')
  const [targetRevenue, setTargetRevenue] = useState('')

  // Trends & Competitors
  const [trends, setTrends] = useState<Trend[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])

  // SWOT
  const [swot, setSwot] = useState<SwotData>(DEFAULT_SWOT)

  // AI Synthesis
  const [aiSynthesis, setAiSynthesis] = useState('')

  const [activeTab, setActiveTab] = useState('marche')

  // ─── Load data on mount ──────────────────
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('creapulse-marche')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.sector) setSector(parsed.sector)
          if (parsed.category) setCategory(parsed.category)
          if (parsed.marketSize) setMarketSize(parsed.marketSize)
          if (parsed.growthRate != null) setGrowthRate(parsed.growthRate)
          if (parsed.targetAudience) setTargetAudience(parsed.targetAudience)
          if (parsed.targetAgeRange) setTargetAgeRange(parsed.targetAgeRange)
          if (parsed.targetLocation) setTargetLocation(parsed.targetLocation)
          if (parsed.targetRevenue) setTargetRevenue(parsed.targetRevenue)
          if (parsed.trends?.length) setTrends(parsed.trends)
          if (parsed.competitors?.length) setCompetitors(parsed.competitors)
          if (parsed.swot) setSwot(parsed.swot)
          if (parsed.aiSynthesis) setAiSynthesis(parsed.aiSynthesis)
        } catch { /* ignore */ }
      }

      try {
        const res = await fetch('/api/marche')
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const d = json.data
            if (d.sector) setSector(d.sector)
            if (d.aiSynthesis) setAiSynthesis(d.aiSynthesis)
            if (d.trends?.length) setTrends(d.trends)
            if (d.competitors?.length) setCompetitors(d.competitors)
            if (d.opportunities || d.threats) {
              setSwot(prev => ({
                ...prev,
                opportunities: d.opportunities || prev.opportunities,
                threats: d.threats || prev.threats,
              }))
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
      localStorage.setItem('creapulse-marche', JSON.stringify({
        sector, category, marketSize, growthRate,
        targetAudience, targetAgeRange, targetLocation, targetRevenue,
        trends, competitors, swot, aiSynthesis,
      }))
    }
  }, [isLoading, sector, category, marketSize, growthRate, targetAudience, targetAgeRange, targetLocation, targetRevenue, trends, competitors, swot, aiSynthesis])

  // ─── Save to API ────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/marche', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector, category, marketSize: parseFloat(marketSize) || 0, growthRate,
          targetAudience, targetAgeRange, targetLocation, targetRevenue,
          trends, competitors, swot, aiSynthesis,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Analyse de marché sauvegardée')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }, [sector, category, marketSize, growthRate, targetAudience, targetAgeRange, targetLocation, targetRevenue, trends, competitors, swot, aiSynthesis])

  // ─── AI Synthesis (legacy) ──────────────
  const handleAiSynthesis = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/marche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector, marketSize, targetAudience, trends, competitors, swot }),
      })
      const json = await res.json()
      if (json.success && json.data?.synthesis) {
        setAiSynthesis(json.data.synthesis)
        toast.success('Synthèse IA générée !')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la génération IA')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setAiLoading(false)
    }
  }, [sector, marketSize, targetAudience, trends, competitors, swot])

  // ─── AI Autofill ────────────────────────
  const handleAutofill = useCallback(async () => {
    setAutofillLoading(true)
    try {
      const res = await fetch('/api/marche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai-autofill' }),
      })
      const json = await res.json()
      if (json.success && json.data?.suggestion) {
        const s = json.data.suggestion
        if (s.sector) setSector(s.sector)
        if (s.category) setCategory(s.category)
        if (s.marketSize) setMarketSize(String(s.marketSize))
        if (s.growthRate != null) setGrowthRate(s.growthRate)
        if (s.targetAudience) setTargetAudience(s.targetAudience)
        if (s.targetAgeRange) setTargetAgeRange(s.targetAgeRange)
        if (s.targetLocation) setTargetLocation(s.targetLocation)
        if (s.targetRevenue) setTargetRevenue(s.targetRevenue)
        if (Array.isArray(s.trends)) setTrends(s.trends)
        if (Array.isArray(s.competitors)) setCompetitors(s.competitors)
        setSwot(prev => ({
          strengths: s.strengths || prev.strengths,
          weaknesses: s.weaknesses || prev.weaknesses,
          opportunities: s.opportunities || prev.opportunities,
          threats: s.threats || prev.threats,
        }))
        toast.success('Toutes les sections ont été remplies par l\'IA')
      } else {
        toast.error(json.error?.message || 'Erreur lors du remplissage automatique')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setAutofillLoading(false)
    }
  }, [])

  // ─── AI Section Suggest ─────────────────
  const handleAiSection = useCallback((sectionKey: string, setter: (val: string) => void, existingContent?: string) => {
    return async () => {
      setSectionAiLoading(prev => ({ ...prev, [sectionKey]: true }))
      try {
        const res = await fetch('/api/marche', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ai-suggest-section',
            section: sectionKey,
            existingContent: existingContent || undefined,
          }),
        })
        const json = await res.json()
        if (json.success && json.data?.suggestion !== undefined) {
          setter(json.data.suggestion)
          toast.success('Suggestion IA chargée')
        } else {
          toast.error(json.error?.message || 'Erreur lors de la suggestion IA')
        }
      } catch {
        toast.error('Erreur de connexion au serveur')
      } finally {
        setSectionAiLoading(prev => ({ ...prev, [sectionKey]: false }))
      }
    }
  }, [])

  // ─── Trend CRUD ─────────────────────────
  const addTrend = useCallback(() => {
    setTrends(prev => [...prev, { id: genId(), title: '', description: '', impact: 'neutral' }])
  }, [])

  const updateTrend = useCallback((id: string, field: keyof Trend, value: string) => {
    setTrends(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }, [])

  const removeTrend = useCallback((id: string) => {
    setTrends(prev => prev.filter(t => t.id !== id))
  }, [])

  // ─── Competitor CRUD ────────────────────
  const addCompetitor = useCallback(() => {
    setCompetitors(prev => [...prev, { id: genId(), name: '', strengths: '', weaknesses: '', marketShare: 0 }])
  }, [])

  const updateCompetitor = useCallback((id: string, field: keyof Competitor, value: string | number) => {
    setCompetitors(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }, [])

  const removeCompetitor = useCallback((id: string) => {
    setCompetitors(prev => prev.filter(c => c.id !== id))
  }, [])

  // ─── SWOT update ───────────────────────
  const updateSwot = useCallback((key: keyof SwotData, value: string) => {
    setSwot(prev => ({ ...prev, [key]: value }))
  }, [])

  // ─── AI Generate Trends ────────────────
  const handleAiTrends = useCallback(async () => {
    setSectionAiLoading(prev => ({ ...prev, trends: true }))
    try {
      const res = await fetch('/api/marche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai-suggest-section',
          section: 'trends',
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.suggestion) {
        if (Array.isArray(json.data.suggestion)) {
          setTrends(json.data.suggestion)
        } else {
          toast.error('Format de réponse inattendu')
        }
        toast.success('Tendances IA chargées')
      } else {
        toast.error(json.error?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setSectionAiLoading(prev => ({ ...prev, trends: false }))
    }
  }, [])

  // ─── AI Generate Competitors ────────────
  const handleAiCompetitors = useCallback(async () => {
    setSectionAiLoading(prev => ({ ...prev, competitors: true }))
    try {
      const res = await fetch('/api/marche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai-suggest-section',
          section: 'competitors',
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.suggestion) {
        if (Array.isArray(json.data.suggestion)) {
          setCompetitors(json.data.suggestion)
        } else {
          toast.error('Format de réponse inattendu')
        }
        toast.success('Concurrents IA chargés')
      } else {
        toast.error(json.error?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setSectionAiLoading(prev => ({ ...prev, competitors: false }))
    }
  }, [])

  // ─── Completion ─────────────────────────
  const completion = useMemo(() => {
    let filled = 0
    let total = 6
    if (sector) filled++
    if (marketSize) filled++
    if (targetAudience) filled++
    if (trends.length > 0 && trends.some(t => t.title)) filled++
    if (competitors.length > 0 && competitors.some(c => c.name)) filled++
    if (Object.values(swot).some(v => v.trim().length > 0)) filled++
    return { filled, total, percent: Math.round((filled / total) * 100) }
  }, [sector, marketSize, targetAudience, trends, competitors, swot])

  // ─── Loading skeleton ───────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
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
            <h2 className="text-xl font-bold text-foreground">Analyse de Marché</h2>
            <p className="text-xs text-muted-foreground">
              {completion.filled}/{completion.total} sections — {completion.percent}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Autofill button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#FFB74D]/40 text-[#FFB74D] hover:bg-[#FFB74D]/10 hover:text-[#FFB74D]"
            onClick={handleAutofill}
            disabled={autofillLoading}
          >
            {autofillLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Remplir avec l&apos;IA
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#FFB74D]/40 text-[#FFB74D] hover:bg-[#FFB74D]/10 hover:text-[#FFB74D]"
            onClick={handleAiSynthesis}
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Synthèse IA
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/80 flex-wrap">
            <TabsTrigger value="marche" className="gap-1.5 data-[state=active]:bg-[#00838F] data-[state=active]:text-white">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Marché</span>
            </TabsTrigger>
            <TabsTrigger value="cible" className="gap-1.5 data-[state=active]:bg-[#00838F] data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Client cible</span>
            </TabsTrigger>
            <TabsTrigger value="tendances" className="gap-1.5 data-[state=active]:bg-[#00838F] data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Tendances</span>
            </TabsTrigger>
            <TabsTrigger value="concurrents" className="gap-1.5 data-[state=active]:bg-[#00838F] data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Concurrents</span>
            </TabsTrigger>
            <TabsTrigger value="swot" className="gap-1.5 data-[state=active]:bg-[#00838F] data-[state=active]:text-white">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">SWOT</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Marché ── */}
          <TabsContent value="marche" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Secteur d&apos;activité</CardTitle>
                      <InfoPopover text="Définissez le secteur principal dans lequel votre entreprise évolue. Cela permet d'identifier les tendances, concurrents et opportunités spécifiques à votre domaine." />
                    </div>
                    <AiSectionButton section="sector" existingContent={sector} onResult={(val: unknown) => setSector(String(val))} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom du secteur</Label>
                    <Input
                      value={sector}
                      onChange={e => setSector(e.target.value)}
                      placeholder="Ex : Restauration rapide, E-commerce, Conseil..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {category && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3 text-green-500" />
                      {category}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Taille du marché</CardTitle>
                      <InfoPopover text="La taille du marché représente le chiffre d'affaires total généré par votre secteur en France. Des sources comme INSEE, Xerfi ou les fédérations professionnelles peuvent vous aider." />
                    </div>
                    <AiSectionButton section="marketSize" existingContent={marketSize} onResult={(val: unknown) => setMarketSize(String(val))} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Estimation (en €)</Label>
                    <Input
                      type="number"
                      value={marketSize}
                      onChange={e => setMarketSize(e.target.value)}
                      placeholder="Ex : 15000000"
                    />
                    {marketSize && (
                      <p className="text-xs text-muted-foreground">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(parseFloat(marketSize))}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Taux de croissance annuel</Label>
                      <span className="text-sm font-semibold text-[#00838F]">{growthRate}%</span>
                    </div>
                    <input
                      type="range"
                      min={-20}
                      max={50}
                      value={growthRate}
                      onChange={e => setGrowthRate(parseInt(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#00838F]"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>-20%</span>
                      <span>50%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab: Client cible ── */}
          <TabsContent value="cible" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#FF6B35]" />
                      Client cible
                    </CardTitle>
                    <InfoPopover text="Définir précisément votre client idéal est essentiel pour adapter votre offre, votre communication et votre stratégie commerciale. Pensez à ses besoins, ses habitudes et ses motivations." />
                  </div>
                  <AiSectionButton section="targetAudience" existingContent={targetAudience} onResult={(val: unknown) => setTargetAudience(String(val))} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Description de votre client idéal</Label>
                  <Textarea
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                    placeholder="Décrivez votre client type : ses besoins, ses habitudes, ses motivations..."
                    className="min-h-[120px]"
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5" /> Tranche d&apos;âge
                      </Label>
                      <InfoPopover text="L'âge de votre client cible influence vos canaux de communication et votre offre. Par exemple, les 18-25 ans sont plus sensibles aux réseaux sociaux." />
                    </div>
                    <div className="flex gap-1">
                      <Input
                        value={targetAgeRange}
                        onChange={e => setTargetAgeRange(e.target.value)}
                        placeholder="Ex : 25-45 ans"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[#FFB74D] hover:text-[#FFB74D] hover:bg-[#FFB74D]/10 shrink-0 h-auto px-2"
                        onClick={handleAiSection('targetAgeRange', setTargetAgeRange, targetAgeRange)}
                        disabled={sectionAiLoading['targetAgeRange']}
                      >
                        {sectionAiLoading['targetAgeRange'] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" /> Localisation
                      </Label>
                      <InfoPopover text="La zone géographique détermine où vous chercherez vos clients. Une activité locale visera une ville ou région, tandis qu'une activité en ligne peut viser la France entière." />
                    </div>
                    <div className="flex gap-1">
                      <Input
                        value={targetLocation}
                        onChange={e => setTargetLocation(e.target.value)}
                        placeholder="Ex : Île-de-France"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[#FFB74D] hover:text-[#FFB74D] hover:bg-[#FFB74D]/10 shrink-0 h-auto px-2"
                        onClick={handleAiSection('targetLocation', setTargetLocation, targetLocation)}
                        disabled={sectionAiLoading['targetLocation']}
                      >
                        {sectionAiLoading['targetLocation'] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5" /> Revenu moyen
                      </Label>
                      <InfoPopover text="Le revenu moyen de votre cible aide à calibrer votre pricing. Un revenu élevé permet des prix premium, un revenu modéré demande une offre plus accessible." />
                    </div>
                    <div className="flex gap-1">
                      <Input
                        value={targetRevenue}
                        onChange={e => setTargetRevenue(e.target.value)}
                        placeholder="Ex : 30 000 - 50 000 €/an"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[#FFB74D] hover:text-[#FFB74D] hover:bg-[#FFB74D]/10 shrink-0 h-auto px-2"
                        onClick={handleAiSection('targetRevenue', setTargetRevenue, targetRevenue)}
                        disabled={sectionAiLoading['targetRevenue']}
                      >
                        {sectionAiLoading['targetRevenue'] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Tendances ── */}
          <TabsContent value="tendances" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">Tendances du marché</h3>
                <InfoPopover text="Les tendances de marché sont les évolutions majeures qui impactent votre secteur. Les identifier permet d'anticiper les opportunités et les menaces pour votre activité." />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-[#FFB74D]/40 text-[#FFB74D] hover:bg-[#FFB74D]/10 hover:text-[#FFB74D]"
                  onClick={handleAiTrends}
                  disabled={sectionAiLoading['trends']}
                >
                  {sectionAiLoading['trends'] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Aide IA
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={addTrend} disabled={trends.length >= 10}>
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </Button>
              </div>
            </div>
            {trends.length === 0 ? (
              <Card className="p-8 text-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-3">
                  Aucune tendance ajoutée. Cliquez sur &quot;Aide IA&quot; pour générer automatiquement ou sur &quot;Ajouter&quot; pour saisir manuellement.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trends.map((trend) => (
                  <Card key={trend.id} className="relative">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {trend.impact === 'positive' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {trend.impact === 'negative' && <TrendingDown className="h-4 w-4 text-red-500" />}
                          {trend.impact === 'neutral' && <Minus className="h-4 w-4 text-amber-500" />}
                          <Input
                            value={trend.title}
                            onChange={e => updateTrend(trend.id, 'title', e.target.value)}
                            placeholder="Titre de la tendance"
                            className="font-medium border-0 shadow-none p-0 h-auto focus-visible:ring-0"
                          />
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0 text-red-400 hover:text-red-600" onClick={() => removeTrend(trend.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Textarea
                        value={trend.description}
                        onChange={e => updateTrend(trend.id, 'description', e.target.value)}
                        placeholder="Décrivez cette tendance..."
                        className="min-h-[60px] text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Impact :</span>
                        {(['positive', 'neutral', 'negative'] as const).map(imp => (
                          <Badge
                            key={imp}
                            variant={trend.impact === imp ? 'default' : 'outline'}
                            className={cn(
                              'cursor-pointer text-xs transition-all',
                              trend.impact === imp && imp === 'positive' && 'bg-green-500 hover:bg-green-600',
                              trend.impact === imp && imp === 'neutral' && 'bg-amber-500 hover:bg-amber-600',
                              trend.impact === imp && imp === 'negative' && 'bg-red-500 hover:bg-red-600',
                            )}
                            onClick={() => updateTrend(trend.id, 'impact', imp)}
                          >
                            {imp === 'positive' ? '✅ Positif' : imp === 'negative' ? '❌ Négatif' : '➖ Neutre'}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Concurrents ── */}
          <TabsContent value="concurrents" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">Analyse concurrentielle</h3>
                <InfoPopover text="L'analyse concurrentielle vous permet de comprendre votre positionnement par rapport aux acteurs existants. Identifiez leurs forces, faiblesses et parts de marché pour trouver votre avantage compétitif." />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-[#FFB74D]/40 text-[#FFB74D] hover:bg-[#FFB74D]/10 hover:text-[#FFB74D]"
                  onClick={handleAiCompetitors}
                  disabled={sectionAiLoading['competitors']}
                >
                  {sectionAiLoading['competitors'] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Aide IA
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={addCompetitor} disabled={competitors.length >= 10}>
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter ({competitors.length}/10)
                </Button>
              </div>
            </div>
            {competitors.length === 0 ? (
              <Card className="p-8 text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-3">
                  Aucun concurrent ajouté. Cliquez sur &quot;Aide IA&quot; pour identifier les concurrents principaux ou sur &quot;Ajouter&quot; pour saisir manuellement.
                </p>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-40">Nom</TableHead>
                          <TableHead>Forces</TableHead>
                          <TableHead>Faiblesses</TableHead>
                          <TableHead className="w-28">Part de marché</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {competitors.map(c => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <Input
                                value={c.name}
                                onChange={e => updateCompetitor(c.id, 'name', e.target.value)}
                                placeholder="Nom du concurrent"
                                className="border-0 shadow-none p-0 h-auto focus-visible:ring-0"
                              />
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={c.strengths}
                                onChange={e => updateCompetitor(c.id, 'strengths', e.target.value)}
                                placeholder="Forces..."
                                className="min-h-[40px] text-sm border-0 shadow-none p-0 focus-visible:ring-0 resize-none"
                              />
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={c.weaknesses}
                                onChange={e => updateCompetitor(c.id, 'weaknesses', e.target.value)}
                                placeholder="Faiblesses..."
                                className="min-h-[40px] text-sm border-0 shadow-none p-0 focus-visible:ring-0 resize-none"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min={0}
                                  max={50}
                                  value={c.marketShare}
                                  onChange={e => updateCompetitor(c.id, 'marketShare', parseInt(e.target.value))}
                                  className="w-16 accent-[#00838F]"
                                />
                                <span className="text-xs font-medium w-10">{c.marketShare}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => removeCompetitor(c.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Tab: SWOT ── */}
          <TabsContent value="swot" className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Analyse SWOT simplifiée</h3>
              <InfoPopover text="L'analyse SWOT (Strengths, Weaknesses, Opportunities, Threats) est un outil stratégique qui vous aide à identifier vos forces internes, faiblesses internes, opportunités externes et menaces externes." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'strengths' as keyof SwotData, label: 'Forces', icon: '💪', color: 'border-green-500/30 bg-green-50/50 dark:bg-green-900/10', help: 'Vos forces sont les avantages internes de votre projet : compétences uniques, innovation, réseau, expérience, ressources...' },
                { key: 'weaknesses' as keyof SwotData, label: 'Faiblesses', icon: '⚠️', color: 'border-red-500/30 bg-red-50/50 dark:bg-red-900/10', help: 'Vos faiblesses sont les points internes à améliorer : manque de financement, expérience limitée, absence de réseau, charge de travail...' },
                { key: 'opportunities' as keyof SwotData, label: 'Opportunités', icon: '🚀', color: 'border-sky-500/30 bg-sky-50/50 dark:bg-sky-900/10', help: 'Les opportunités sont des facteurs externes favorables : marché en croissance, besoins non satisfaits, aides publiques, nouvelles technologies...' },
                { key: 'threats' as keyof SwotData, label: 'Menaces', icon: '🛡️', color: 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10', help: 'Les menaces sont des facteurs externes défavorables : concurrence accrue, réglementation, évolution technologique, crise économique...' },
              ].map(q => (
                <div key={q.key} className={cn('rounded-xl border p-4', q.color)}>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <span>{q.icon}</span> {q.label}
                      <InfoPopover text={q.help} />
                    </Label>
                    <AiSectionButton section={q.key} existingContent={swot[q.key]} onResult={(val: unknown) => updateSwot(q.key, String(val))} />
                  </div>
                  <Textarea
                    value={swot[q.key]}
                    onChange={e => updateSwot(q.key, e.target.value)}
                    placeholder={`Listez vos ${q.label.toLowerCase()}...`}
                    className="min-h-[100px] text-sm bg-background/60"
                  />
                  {swot[q.key] && (
                    <div className="mt-2 flex items-center gap-1">
                      <Circle className="h-2 w-2 text-green-500" />
                      <span className="text-xs text-muted-foreground">{swot[q.key].split('\n').filter(Boolean).length} élément(s)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

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
                  Synthèse IA
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

        {/* ── Completion indicator ── */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00838F] rounded-full transition-all duration-500"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {completion.percent}% complété
          </span>
        </div>
      </div>
    </motion.div>
  )
}
