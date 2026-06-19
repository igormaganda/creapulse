'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Brain,
  Save,
  Sparkles,
  Loader2,
  Info,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Shield,
  Download,
  ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/auth-fetch'

// ─── Types ──────────────────────────────────

interface SwotItem {
  id: string
  text: string
}

interface SwotMatrix {
  forces: SwotItem[]
  faiblesses: SwotItem[]
  opportunites: SwotItem[]
  menaces: SwotItem[]
}

type QuadrantKey = keyof SwotMatrix

interface QuadrantConfig {
  key: QuadrantKey
  label: string
  subtitle: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof Brain
  items: SwotItem[]
}

// ─── Helpers ────────────────────────────────

function createSwotItem(text: string): SwotItem {
  return { id: crypto.randomUUID(), text: text.trim() }
}

function InfoPopover({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-emerald-600 hover:bg-emerald-600/10 transition-colors shrink-0">
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

// ─── Quadrant Sub-component ─────────────────

function SwotQuadrant({
  config,
  onAdd,
  onRemove,
}: {
  config: QuadrantConfig
  onAdd: (key: QuadrantKey, text: string) => void
  onRemove: (key: QuadrantKey, id: string) => void
}) {
  const [input, setInput] = useState('')
  const Icon = config.icon

  const handleAdd = () => {
    if (input.trim()) {
      onAdd(config.key, input.trim())
      setInput('')
    }
  }

  return (
    <div className={cn('rounded-xl border-2 p-4 space-y-3 flex flex-col', config.bgColor, config.borderColor)}>
      <div className="flex items-center gap-2">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', config.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className={cn('text-sm font-bold', config.color.replace('bg-', 'text-'))}>{config.label}</p>
          <p className="text-[11px] text-muted-foreground">{config.subtitle}</p>
        </div>
        <Badge variant="outline" className="ml-auto text-[10px]">
          {config.items.length}
        </Badge>
      </div>

      <ul className="space-y-1.5 flex-1 min-h-[60px]">
        {config.items.map((item) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between gap-2 bg-background/60 rounded-lg px-3 py-2"
          >
            <span className="text-sm flex-1">{item.text}</span>
            <button
              type="button"
              onClick={() => onRemove(config.key, item.id)}
              className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.li>
        ))}
        {config.items.length === 0 && (
          <li className="text-xs text-muted-foreground text-center py-4 opacity-50">
            Aucun élément ajouté
          </li>
        )}
      </ul>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Ajouter un élément..."
          className="flex-1 text-sm rounded-lg border border-border bg-background/60 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <Button size="sm" variant="outline" onClick={handleAdd} disabled={!input.trim()} className="shrink-0 h-8 w-8 p-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────

export function SwotModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [matrix, setMatrix] = useState<SwotMatrix>({
    forces: [],
    faiblesses: [],
    opportunites: [],
    menaces: [],
  })

  // ─── Load data on mount ──────────────────
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('creapulse-swot')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.forces || parsed.faiblesses || parsed.opportunites || parsed.menaces) {
            setMatrix({
              forces: parsed.forces || [],
              faiblesses: parsed.faiblesses || [],
              opportunites: parsed.opportunites || [],
              menaces: parsed.menaces || [],
            })
          }
        } catch { /* ignore */ }
      }

      try {
        const res = await authFetch('/api/paa/objectifs', {
          method: 'POST',
          body: JSON.stringify({ action: 'get-swot' }),
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setMatrix({
              forces: json.data.forces || [],
              faiblesses: json.data.faiblesses || [],
              opportunites: json.data.opportunites || [],
              menaces: json.data.menaces || [],
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
      localStorage.setItem('creapulse-swot', JSON.stringify(matrix))
    }
  }, [isLoading, matrix])

  // ─── Matrix helpers ───────────────────────
  const addItem = useCallback((quadrant: QuadrantKey, text: string) => {
    setMatrix(prev => ({
      ...prev,
      [quadrant]: [...prev[quadrant], createSwotItem(text)],
    }))
  }, [])

  const removeItem = useCallback((quadrant: QuadrantKey, id: string) => {
    setMatrix(prev => ({
      ...prev,
      [quadrant]: prev[quadrant].filter(item => item.id !== id),
    }))
  }, [])

  // ─── Quadrant configs ────────────────────
  const quadrants: QuadrantConfig[] = useMemo(() => [
    {
      key: 'forces',
      label: 'Forces',
      subtitle: 'Internal — Strengths',
      color: 'bg-emerald-100 dark:bg-emerald-900/20',
      bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-300 dark:border-emerald-700',
      icon: TrendingUp,
      items: matrix.forces,
    },
    {
      key: 'faiblesses',
      label: 'Faiblesses',
      subtitle: 'Internal — Weaknesses',
      color: 'bg-rose-100 dark:bg-rose-900/20',
      bgColor: 'bg-rose-50/50 dark:bg-rose-950/20',
      borderColor: 'border-rose-300 dark:border-rose-700',
      icon: TrendingDown,
      items: matrix.faiblesses,
    },
    {
      key: 'opportunites',
      label: 'Opportunités',
      subtitle: 'External — Opportunities',
      color: 'bg-blue-100 dark:bg-blue-900/20',
      bgColor: 'bg-blue-50/50 dark:bg-blue-950/20',
      borderColor: 'border-blue-300 dark:border-blue-700',
      icon: ArrowRight,
      items: matrix.opportunites,
    },
    {
      key: 'menaces',
      label: 'Menaces',
      subtitle: 'External — Threats',
      color: 'bg-amber-100 dark:bg-amber-900/20',
      bgColor: 'bg-amber-50/50 dark:bg-amber-950/20',
      borderColor: 'border-amber-300 dark:border-amber-700',
      icon: Shield,
      items: matrix.menaces,
    },
  ], [matrix])

  // ─── Completion ─────────────────────────
  const completion = useMemo(() => {
    let filled = 0
    const total = 4
    if (matrix.forces.length > 0) filled++
    if (matrix.faiblesses.length > 0) filled++
    if (matrix.opportunites.length > 0) filled++
    if (matrix.menaces.length > 0) filled++
    return { filled, total, percent: Math.round((filled / total) * 100) }
  }, [matrix])

  const totalItems = useMemo(() =>
    matrix.forces.length + matrix.faiblesses.length + matrix.opportunites.length + matrix.menaces.length,
    [matrix]
  )

  // ─── Save to API ────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await authFetch('/api/paa/objectifs', {
        method: 'PUT',
        body: JSON.stringify({
          action: 'save-swot',
          matrix,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message || 'Erreur lors de la sauvegarde')
        return
      }
      toast.success('Matrice SWOT sauvegardée')
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }, [matrix])

  // ─── AI Generation ──────────────────────
  const handleAiGenerate = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await authFetch('/api/paa/objectifs', {
        method: 'POST',
        body: JSON.stringify({
          action: 'ai-generate-swot',
          currentMatrix: matrix,
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        if (json.data.forces) setMatrix(prev => ({ ...prev, forces: json.data.forces }))
        if (json.data.faiblesses) setMatrix(prev => ({ ...prev, faiblesses: json.data.faiblesses }))
        if (json.data.opportunites) setMatrix(prev => ({ ...prev, opportunites: json.data.opportunites }))
        if (json.data.menaces) setMatrix(prev => ({ ...prev, menaces: json.data.menaces }))
        toast.success('Analyse SWOT IA générée !')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la génération IA')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setAiLoading(false)
    }
  }, [matrix])

  // ─── Export as image (placeholder — uses native clipboard) ────
  const handleExport = useCallback(async () => {
    try {
      const dataStr = `MATRICE SWOT\n\nFORCES:\n${matrix.forces.map(f => '• ' + f.text).join('\n')}\n\nFAIBLESSES:\n${matrix.faiblesses.map(f => '• ' + f.text).join('\n')}\n\nOPPORTUNITÉS:\n${matrix.opportunites.map(f => '• ' + f.text).join('\n')}\n\nMENACES:\n${matrix.menaces.map(f => '• ' + f.text).join('\n')}`
      await navigator.clipboard.writeText(dataStr)
      toast.success('SWOT copié dans le presse-papier !')
    } catch {
      toast.error('Impossible de copier dans le presse-papier')
    }
  }, [matrix])

  // ─── Loading skeleton ───────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Brain className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Matrice SWOT Interactive</h2>
            <p className="text-xs text-muted-foreground">
              {totalItems} éléments — {completion.filled}/{completion.total} quadrants remplis — {completion.percent}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-muted-foreground/30 text-muted-foreground hover:bg-muted/40"
            onClick={handleExport}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Copier
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-amber-400/40 text-amber-500 hover:bg-amber-400/10"
            onClick={handleAiGenerate}
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Générer avec l&apos;IA
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
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
        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-[11px] text-muted-foreground">Forces</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{matrix.forces.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-3">
            <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="text-[11px] text-muted-foreground">Faiblesses</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{matrix.faiblesses.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
            <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-[11px] text-muted-foreground">Opportunités</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{matrix.opportunites.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-[11px] text-muted-foreground">Menaces</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{matrix.menaces.length}</p>
            </div>
          </div>
        </div>

        {/* ── SWOT Matrix Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quadrants.map((quadrant) => (
            <SwotQuadrant
              key={quadrant.key}
              config={quadrant}
              onAdd={addItem}
              onRemove={removeItem}
            />
          ))}
        </div>

        {/* ── Bottom Save Bar ── */}
        <Card className="bg-gradient-to-r from-emerald-500/5 to-blue-500/5 border-emerald-200 dark:border-emerald-800">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">Forces</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="text-xs text-muted-foreground">Faiblesses</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-muted-foreground">Opportunités</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-xs text-muted-foreground">Menaces</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm text-muted-foreground">{totalItems} éléments total</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-amber-400/40 text-amber-500 hover:bg-amber-400/10"
                  onClick={handleAiGenerate}
                  disabled={aiLoading}
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Générer avec l&apos;IA
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Enregistrer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
