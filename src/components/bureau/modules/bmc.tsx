'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutGrid,
  Sparkles,
  Loader2,
  RotateCcw,
  Save,
  Download,
  Handshake,
  Cog,
  Package,
  Lightbulb,
  HeartHandshake,
  Megaphone,
  Users,
  Wallet,
  Banknote,
  Check,
  Circle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────

type BmcStatus = 'DRAFT' | 'GENERATED' | 'REFINED'

interface BmcBlockData {
  id: string
  title: string
  icon: React.ElementType
  placeholder: string
  content: string
  color: string
}

// ─── BMC Block Definitions (standard 9-block) ─────────

const BMC_BLOCKS: BmcBlockData[] = [
  { id: 'partenaires-cles', title: 'Partenaires Clés', icon: Handshake, placeholder: 'Qui sont vos partenaires et fournisseurs clés ? Quelles ressources obtenez-vous d\'eux ?', content: '', color: 'text-teal-400 bg-teal-500/20 border-teal-500/30' },
  { id: 'activites-cles', title: 'Activités Clés', icon: Cog, placeholder: 'Quelles sont les activités principales pour créer votre proposition de valeur ? Production, résolution de problèmes, gestion de plateforme...', content: '', color: 'text-teal-400 bg-teal-500/20 border-teal-500/30' },
  { id: 'ressources-cles', title: 'Ressources Clés', icon: Package, placeholder: 'Quelles ressources sont nécessaires ? Physiques, intellectuelles, humaines, financières...', content: '', color: 'text-teal-400 bg-teal-500/20 border-teal-500/30' },
  { id: 'proposition-valeur', title: 'Proposition de Valeur', icon: Lightbulb, placeholder: 'Quelle valeur unique apportez-vous à vos clients ? Quel problème résolvez-vous ? Pourquoi vous choisir ?', content: '', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  { id: 'relations-clients', title: 'Relations Clients', icon: HeartHandshake, placeholder: 'Quel type de relation entretenez-vous avec vos clients ? Assistance personnelle, communautaire, automatisée...', content: '', color: 'text-teal-400 bg-teal-500/20 border-teal-500/30' },
  { id: 'canaux', title: 'Canaux', icon: Megaphone, placeholder: 'Comment atteignez-vous vos clients ? Canaux de distribution, communication, vente...', content: '', color: 'text-teal-400 bg-teal-500/20 border-teal-500/30' },
  { id: 'segments-clients', title: 'Segments Clients', icon: Users, placeholder: 'Pour qui créez-vous de la valeur ? Quels sont vos segments de clientèle ?', content: '', color: 'text-teal-400 bg-teal-500/20 border-teal-500/30' },
  { id: 'structure-couts', title: 'Structure des Coûts', icon: Wallet, placeholder: 'Quels sont les coûts les plus importants ? Coûts fixes, variables, économies d\'échelle...', content: '', color: 'text-coral-400 bg-coral-500/20 border-coral-500/30' },
  { id: 'sources-revenus', title: 'Sources de Revenus', icon: Banknote, placeholder: 'Comment générez-vous des revenus ? Ventes directes, abonnements, commissions, licensing...', content: '', color: 'text-coral-400 bg-coral-500/20 border-coral-500/30' },
]

// ─── Default data ───────────────────────────

function getDefaults(): BmcBlockData[] {
  return BMC_BLOCKS.map(b => ({ ...b, content: '' }))
}

// ─── Main Component ─────────────────────────

export function BusinessModelCanvasModule() {
  const [blocks, setBlocks] = useState<BmcBlockData[]>(getDefaults)
  const [status, setStatus] = useState<BmcStatus>('DRAFT')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiLoadingBlock, setAiLoadingBlock] = useState<string | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Load data on mount ──────────────────
  useEffect(() => {
    async function load() {
      // Try localStorage first
      const saved = localStorage.getItem('creapulse-bmc')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.blocks?.length) {
            setBlocks(prev => prev.map(b => {
              const savedBlock = parsed.blocks.find((s: BmcBlockData) => s.id === b.id)
              return savedBlock ? { ...b, content: savedBlock.content || '' } : b
            }))
          }
          if (parsed.status) setStatus(parsed.status)
        } catch { /* ignore */ }
      }

      // Then try API
      try {
        const res = await fetch('/api/bmc')
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data?.blocks) {
            setBlocks(prev => prev.map(b => {
              const apiBlock = json.data.blocks.find((s: BmcBlockData) => s.id === b.id)
              return apiBlock ? { ...b, content: apiBlock.content || '' } : b
            }))
            if (json.data.status) setStatus(json.data.status)
          }
        }
      } catch { /* ignore */ }

      setIsLoading(false)
    }
    load()
  }, [])

  // ─── Cleanup debounce on unmount ────────
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  // ─── Update a block's content ───────────
  const updateBlock = useCallback((blockId: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content } : b))
  }, [])

  // ─── Auto-save on blur (debounced) ──────
  const handleBlur = useCallback((blockId: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      const currentBlocks = blocks.map(b => ({ id: b.id, content: b.content }))
      localStorage.setItem('creapulse-bmc', JSON.stringify({ blocks: currentBlocks, status }))

      setIsSaving(true)
      try {
        const res = await fetch('/api/bmc', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocks: currentBlocks, status }),
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success) {
            toast.success('BMC sauvegardé automatiquement')
          }
        }
      } catch {
        // Silent fail for auto-save
      } finally {
        setIsSaving(false)
      }
    }, 1500)
  }, [blocks, status])

  // ─── Full save ──────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    const currentBlocks = blocks.map(b => ({ id: b.id, content: b.content }))
    localStorage.setItem('creapulse-bmc', JSON.stringify({ blocks: currentBlocks, status }))
    try {
      const res = await fetch('/api/bmc', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: currentBlocks, status }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Business Model Canvas sauvegardé')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }, [blocks, status])

  // ─── Generate from BP (full canvas) ─────
  const handleGenerateFromBp = useCallback(async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/bmc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-from-bp' }),
      })
      const json = await res.json()
      if (json.success && json.data?.blocks) {
        setBlocks(prev => prev.map(b => {
          const genBlock = json.data.blocks.find((s: { id: string; content: string }) => s.id === b.id)
          return genBlock ? { ...b, content: genBlock.content || '' } : b
        }))
        setStatus('GENERATED')
        localStorage.setItem('creapulse-bmc', JSON.stringify({ blocks: json.data.blocks, status: 'GENERATED' }))
        toast.success('Business Model Canvas généré par l\'IA depuis votre Business Plan')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la génération IA')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // ─── AI suggest for a single block ──────
  const handleAiBlock = useCallback(async (block: BmcBlockData) => {
    setAiLoadingBlock(block.id)
    try {
      const res = await fetch('/api/bmc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai-suggest-block',
          blockId: block.id,
          blockTitle: block.title,
          existingContent: block.content || undefined,
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.suggestion) {
        updateBlock(block.id, json.data.suggestion)
        setStatus('REFINED')
        toast.success(`"${block.title}" mis à jour par l'IA`)
      } else {
        toast.error(json.error?.message || 'Erreur lors de la suggestion IA')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setAiLoadingBlock(null)
    }
  }, [updateBlock])

  // ─── Export PDF ─────────────────────────
  const handleExportPdf = useCallback(() => {
    if (filledCount === 0) {
      toast.error('Remplissez au moins un bloc avant d\'exporter')
      return
    }
    window.open('/api/export/bmc', '_blank')
    toast.success('BMC ouvert pour impression PDF')
  }, [filledCount])

  // ─── Reset canvas ───────────────────────
  const handleReset = useCallback(() => {
    setBlocks(getDefaults())
    setStatus('DRAFT')
    localStorage.removeItem('creapulse-bmc')
    toast.success('Business Model Canvas réinitialisé')
  }, [])

  // ─── Completion ─────────────────────────
  const filledCount = blocks.filter(b => b.content.trim().length > 0).length
  const totalCount = blocks.length
  const percent = Math.round((filledCount / totalCount) * 100)

  // ─── Loading skeleton ───────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // ─── BMC Grid Layout ────────────────────
  // Standard BMC layout: 3 cols, special sizing
  // Row 1: Partenaires (1col) | Activités (1col) | Ressources (1col)
  // Row 2: Proposition (full 3 cols)
  // Row 3: Relations (1col) | Canaux (1col) | Segments (1col)
  // Row 4: Coûts (1.5col) | Revenus (1.5col)

  const renderBlock = (block: BmcBlockData) => {
    const Icon = block.icon
    const isAiLoading = aiLoadingBlock === block.id
    const charCount = block.content.length

    return (
      <Card className={cn('h-full flex flex-col bg-white/5 border-white/10 hover:border-white/20 transition-colors group')}>
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', block.color.split(' ').slice(1).join(' '))}>
                <Icon className={cn('h-3.5 w-3.5', block.color.split(' ')[0])} />
              </div>
              <CardTitle className="text-xs font-semibold text-neutral-200 truncate">{block.title}</CardTitle>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                      isAiLoading && 'opacity-100'
                    )}
                    onClick={() => handleAiBlock(block)}
                    disabled={isAiLoading || isGenerating}
                  >
                    {isAiLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-amber-400" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Générer avec l&apos;IA
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="flex-1 px-3 pb-3">
          <Textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            onBlur={() => handleBlur(block.id)}
            placeholder={block.placeholder}
            className="min-h-[80px] lg:min-h-[100px] text-xs leading-relaxed resize-none bg-white/5 border-white/10 text-neutral-300 placeholder:text-neutral-500 focus-visible:ring-teal-500/30 focus-visible:border-teal-500/30"
          />
          <div className="flex items-center justify-between mt-1.5">
            {charCount > 0 ? (
              <span className="text-[10px] text-teal-400 font-medium">{charCount} car.</span>
            ) : (
              <span />
            )}
            {block.content.trim().length > 0 ? (
              <Check className="h-3 w-3 text-green-400" />
            ) : (
              <Circle className="h-3 w-3 text-neutral-600" />
            )}
          </div>
        </CardContent>
      </Card>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:px-6 border-b bg-[#1A1A2E]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20">
            <LayoutGrid className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Business Model Canvas</h2>
            <p className="text-xs text-neutral-400">
              {filledCount}/{totalCount} blocs remplis — {percent}%
            </p>
          </div>
          <Badge
            className={cn(
              'text-[10px] px-2 py-0.5 font-semibold',
              status === 'DRAFT' && 'bg-white/10 text-neutral-400 border-white/10',
              status === 'GENERATED' && 'bg-teal-500/20 text-teal-400 border-teal-500/30',
              status === 'REFINED' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            )}
          >
            {status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-white/10 text-neutral-300 hover:bg-white/5 hover:text-white"
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-white/10 text-neutral-300 hover:bg-white/5 hover:text-white"
            onClick={handleExportPdf}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exporter PDF</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-teal-500/30 text-teal-400 hover:bg-teal-500/20 hover:text-teal-400"
            onClick={handleGenerateFromBp}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{isGenerating ? 'Génération en cours...' : 'Générer avec l\'IA'}</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/30"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Generating overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-8"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-2 border-teal-500/30" />
                <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-teal-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">Génération en cours...</p>
                <p className="text-xs text-neutral-400">L&apos;IA analyse votre Business Plan et remplit les 9 blocs</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BMC Grid */}
      <div className="p-4 md:p-6 space-y-3">
        {/* Row 1: Partenaires | Activités | Ressources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {renderBlock(blocks[0])}
          {renderBlock(blocks[1])}
          {renderBlock(blocks[2])}
        </div>

        {/* Row 2: Proposition de Valeur (full width) */}
        <div>
          {renderBlock(blocks[3])}
        </div>

        {/* Row 3: Relations | Canaux | Segments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {renderBlock(blocks[4])}
          {renderBlock(blocks[5])}
          {renderBlock(blocks[6])}
        </div>

        {/* Row 4: Structure des Coûts | Sources de Revenus */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {renderBlock(blocks[7])}
          {renderBlock(blocks[8])}
        </div>
      </div>
    </motion.div>
  )
}
