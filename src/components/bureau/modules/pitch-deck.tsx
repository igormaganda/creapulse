'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Presentation,
  Save,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  Loader2,
  Plus,
  Trash2,
  User,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  DollarSign,
  Target,
  Users,
  Check,
  Circle,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
}

interface SlideData {
  id: string
  title: string
  content: string
  teamMembers?: TeamMember[]
  fundingAmount?: string
  useOfFunds?: string
}

const SLIDE_DEFINITIONS = [
  { id: 'problem', title: 'Problème', icon: AlertTriangle, color: 'bg-red-500', placeholder: 'Décrivez le problème que vous résolvez. Quel est le point de douleur de votre client cible ? Pourquoi ce problème existe-t-il ?' },
  { id: 'solution', title: 'Solution', icon: Lightbulb, color: 'bg-amber-500', placeholder: 'Présentez votre solution. Comment résout-elle le problème identifié ? En quoi est-elle unique ou supérieure aux alternatives existantes ?' },
  { id: 'market', title: 'Marché', icon: TrendingUp, color: 'bg-[#00838F]', placeholder: 'Décrivez votre marché : taille, croissance, segments. Quelle est votre opportunité de marché ?' },
  { id: 'business-model', title: 'Business Model', icon: DollarSign, color: 'bg-green-500', placeholder: 'Expliquez comment vous gagnez de l\'argent. Quelles sont vos sources de revenus ? Votre modèle de tarification ?' },
  { id: 'traction', title: 'Traction', icon: Target, color: 'bg-purple-500', placeholder: 'Partagez vos accomplissements actuels : clients, CA, partenariats, utilisateurs, indicateurs clés...' },
  { id: 'team', title: 'Équipe', icon: Users, color: 'bg-sky-500', placeholder: '' },
  { id: 'financial', title: 'Financier', icon: DollarSign, color: 'bg-[#FF6B35]', placeholder: 'Résumez vos projections financières : CA, résultat net, marges sur 3 ans.' },
  { id: 'ask', title: 'Ask', icon: Sparkles, color: 'bg-pink-500', placeholder: 'Combien cherchez-vous à lever ? À quoi serviront les fonds ? Quel est votre plan d\'utilisation ?' },
]

// ─── Helpers ────────────────────────────────

// ─── Mapping: frontend slide IDs → backend slide keys ───

const SLIDE_ID_TO_KEY: Record<string, string> = {
  'problem': 'probleme',
  'solution': 'solution',
  'market': 'marche',
  'business-model': 'businessModel',
  'traction': 'traction',
  'team': 'equipe',
  'financial': 'financier',
  'ask': 'ask',
}

function genId(): string {
  return Math.random().toString(36).slice(2, 9)
}

// ─── Main Component ─────────────────────────

export function PitchDeckModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExportingPptx, setIsExportingPptx] = useState(false)
  const [aiLoadingSlide, setAiLoadingSlide] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [projectTitle, setProjectTitle] = useState('Mon Pitch Deck')
  const [slides, setSlides] = useState<SlideData[]>([])

  // ─── Initialize slides ──────────────────
  useEffect(() => {
    const defaultSlides = SLIDE_DEFINITIONS.map(def => ({
      id: def.id,
      title: def.title,
      content: '',
      teamMembers: def.id === 'team' ? [] : undefined,
      fundingAmount: def.id === 'ask' ? '' : undefined,
      useOfFunds: def.id === 'ask' ? '' : undefined,
    }))
    setSlides(defaultSlides)
  }, [])

  // ─── Load saved data ───────────────────
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('creapulse-pitch-deck')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.slides?.length) setSlides(parsed.slides)
          if (parsed.projectTitle) setProjectTitle(parsed.projectTitle)
        } catch { /* ignore */ }
      }

      try {
        const res = await fetch('/api/pitch-deck')
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data?.content) {
            try {
              const parsed = JSON.parse(json.data.content)
              if (parsed.slides?.length) setSlides(parsed.slides)
              if (json.data.projectTitle) setProjectTitle(json.data.projectTitle)
            } catch { /* ignore */ }
          }
        }
      } catch { /* ignore */ }

      setIsLoading(false)
    }
    load()
  }, [])

  // ─── Auto-save to localStorage ──────────
  useEffect(() => {
    if (!isLoading && slides.length > 0) {
      localStorage.setItem('creapulse-pitch-deck', JSON.stringify({
        slides, projectTitle,
      }))
    }
  }, [isLoading, slides, projectTitle])

  // ─── Update slide content ──────────────
  const updateSlideContent = useCallback((slideId: string, content: string) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, content } : s))
  }, [])

  // ─── Team CRUD ─────────────────────────
  const addTeamMember = useCallback(() => {
    setSlides(prev => prev.map(s =>
      s.id === 'team'
        ? { ...s, teamMembers: [...(s.teamMembers || []), { id: genId(), name: '', role: '', bio: '' }] }
        : s
    ))
  }, [])

  const updateTeamMember = useCallback((memberId: string, field: keyof TeamMember, value: string) => {
    setSlides(prev => prev.map(s =>
      s.id === 'team'
        ? {
            ...s,
            teamMembers: (s.teamMembers || []).map(m =>
              m.id === memberId ? { ...m, [field]: value } : m
            ),
          }
        : s
    ))
  }, [])

  const removeTeamMember = useCallback((memberId: string) => {
    setSlides(prev => prev.map(s =>
      s.id === 'team'
        ? { ...s, teamMembers: (s.teamMembers || []).filter(m => m.id !== memberId) }
        : s
    ))
  }, [])

  // ─── Ask fields ────────────────────────
  const updateAskField = useCallback((field: 'fundingAmount' | 'useOfFunds', value: string) => {
    setSlides(prev => prev.map(s =>
      s.id === 'ask' ? { ...s, [field]: value } : s
    ))
  }, [])

  // ─── Completion tracking ────────────────
  const completion = useMemo(() => {
    let filled = 0
    slides.forEach(slide => {
      const def = SLIDE_DEFINITIONS.find(d => d.id === slide.id)
      if (!def) return

      if (slide.id === 'team') {
        if (slide.teamMembers && slide.teamMembers.length > 0 && slide.teamMembers.some(m => m.name)) filled++
      } else if (slide.id === 'ask') {
        if (slide.fundingAmount || slide.content) filled++
      } else {
        if (slide.content && slide.content.trim().length > 0) filled++
      }
    })
    return { filled, total: slides.length, percent: Math.round((filled / slides.length) * 100) }
  }, [slides])

  // ─── Navigation ─────────────────────────
  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1) setCurrentSlide(prev => prev + 1)
  }, [currentSlide, slides.length])

  const goPrev = useCallback(() => {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1)
  }, [currentSlide])

  // ─── Save to API ────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/pitch-deck', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides, projectTitle }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Pitch deck sauvegardé — ${completion.filled}/${completion.total} slides remplies`)
      } else {
        toast.error(json.error?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setIsSaving(false)
    }
  }, [slides, projectTitle, completion])

  // ─── Generate from BP (full pitch deck) ─
  const handleGenerateFromBp = useCallback(async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/pitch-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-from-bp' }),
      })
      const json = await res.json()
      if (json.success && json.data?.slides) {
        setSlides(prev => prev.map(s => {
          const genSlide = json.data.slides.find((gs: { id: string; content: string }) => gs.id === s.id)
          return genSlide ? { ...s, content: genSlide.content || s.content } : s
        }))
        toast.success('Pitch deck généré par l\'IA depuis votre Business Plan')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la génération IA')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // ─── AI suggest for a single slide ──────
  const handleAiSuggestSlide = useCallback(async (slideId: string) => {
    setAiLoadingSlide(slideId)
    try {
      const slide = slides.find(s => s.id === slideId)
      const def = SLIDE_DEFINITIONS.find(d => d.id === slideId)
      const res = await fetch('/api/pitch-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai-suggest-slide',
          slideKey: SLIDE_ID_TO_KEY[slideId],
          existingContent: slide?.content || undefined,
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.suggestion) {
        setSlides(prev => prev.map(s => s.id === slideId ? { ...s, content: json.data.suggestion } : s))
        toast.success(`Slide "${def?.title}" mise à jour par l'IA`)
      } else {
        toast.error(json.error?.message || 'Erreur lors de la suggestion IA')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setAiLoadingSlide(null)
    }
  }, [slides])

  // ─── Export PPTX ──────────────────────
  const handleExportPptx = useCallback(async () => {
    if (completion.filled === 0) {
      toast.error('Renseignez au moins une slide avant d\'exporter')
      return
    }

    setIsExportingPptx(true)
    try {
      const res = await fetch('/api/export/pitch-deck')
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error?.message || 'Erreur lors de l\'export PPTX')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectTitle.replace(/\s+/g, '_')}_pitch_deck.pptx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Pitch deck exporté en PowerPoint')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'export PPTX')
    } finally {
      setIsExportingPptx(false)
    }
  }, [completion.filled, projectTitle])

  // ─── Export (text summary) ─────────────
  const handleExport = useCallback(() => {
    if (completion.filled === 0) {
      toast.error('Renseignez au moins une slide avant d\'exporter')
      return
    }

    let text = `# ${projectTitle}\n\n`

    slides.forEach(slide => {
      const def = SLIDE_DEFINITIONS.find(d => d.id === slide.id)
      if (!def) return

      if (slide.id === 'team' && slide.teamMembers?.length) {
        text += `## ${def.title}\n\n`
        slide.teamMembers.forEach(m => {
          if (m.name) {
            text += `**${m.name}**${m.role ? ` — ${m.role}` : ''}\n`
            if (m.bio) text += `${m.bio}\n\n`
          }
        })
      } else if (slide.id === 'ask') {
        text += `## ${def.title}\n\n`
        if (slide.fundingAmount) text += `**Montant recherché :** ${slide.fundingAmount}\n\n`
        if (slide.useOfFunds) text += `**Utilisation des fonds :**\n${slide.useOfFunds}\n\n`
        if (slide.content) text += `${slide.content}\n\n`
      } else if (slide.content) {
        text += `## ${def.title}\n\n${slide.content}\n\n`
      }
    })

    // Download as text file
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectTitle.replace(/\s+/g, '_')}_pitch_deck.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Pitch deck exporté en fichier texte')
  }, [slides, projectTitle, completion.filled])

  const activeSlide = slides[currentSlide]
  const activeDef = SLIDE_DEFINITIONS[currentSlide]

  // ─── Loading ────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="h-80 bg-muted animate-pulse rounded-xl" />
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
            <Presentation className="h-5 w-5 text-[#00838F]" />
          </div>
          <div>
            <Input
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              className="text-xl font-bold border-0 shadow-none p-0 h-auto focus-visible:ring-0 max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              {completion.filled}/{completion.total} slides remplies — {completion.percent}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#FFB74D]/40 text-[#FFB74D] hover:bg-[#FFB74D]/10 hover:text-[#FFB74D]"
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
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport} disabled={completion.filled === 0}>
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exporter TXT</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#00838F]/40 text-[#00838F] hover:bg-[#00838F]/10 hover:text-[#00838F]"
            onClick={handleExportPptx}
            disabled={completion.filled === 0 || isExportingPptx}
          >
            {isExportingPptx ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{isExportingPptx ? 'Export en cours...' : 'Exporter PPTX'}</span>
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

      {/* Progress bar */}
      <div className="px-4 md:px-6 pt-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00838F] rounded-full transition-all duration-500"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{completion.percent}%</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* ── Slide Preview ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="overflow-hidden">
              {/* Slide header bar */}
              <div className={cn('h-2', activeDef?.color)} />

              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {activeDef && (
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', activeDef.color, 'text-white')}>
                      <activeDef.icon className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-1">Slide {currentSlide + 1}/{slides.length}</Badge>
                    <CardTitle className="text-lg">{activeSlide?.title}</CardTitle>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {activeSlide?.id !== 'team' && activeSlide?.id !== 'ask' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 h-7 text-xs border-[#FFB74D]/40 text-[#FFB74D] hover:bg-[#FFB74D]/10 hover:text-[#FFB74D]"
                        onClick={() => handleAiSuggestSlide(activeSlide.id)}
                        disabled={aiLoadingSlide === activeSlide.id || isGenerating}
                      >
                        {aiLoadingSlide === activeSlide.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        IA
                      </Button>
                    )}
                    {activeSlide?.content || (activeSlide?.id === 'team' && activeSlide.teamMembers?.length) || (activeSlide?.id === 'ask' && activeSlide.fundingAmount) ? (
                      <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                        <Check className="h-3 w-3" /> Rempli
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Circle className="h-3 w-3" /> Vide
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Team slide: member cards */}
                {activeSlide?.id === 'team' ? (
                  <div className="space-y-4">
                    {activeSlide.teamMembers && activeSlide.teamMembers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeSlide.teamMembers.map(member => (
                          <Card key={member.id} className="relative">
                            <CardContent className="pt-3 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/20">
                                    <User className="h-4 w-4 text-sky-600" />
                                  </div>
                                  <div>
                                    <Input
                                      value={member.name}
                                      onChange={e => updateTeamMember(member.id, 'name', e.target.value)}
                                      placeholder="Nom"
                                      className="font-medium text-sm border-0 shadow-none p-0 h-auto focus-visible:ring-0"
                                    />
                                    <Input
                                      value={member.role}
                                      onChange={e => updateTeamMember(member.id, 'role', e.target.value)}
                                      placeholder="Rôle (ex: CEO, CTO)"
                                      className="text-xs text-muted-foreground border-0 shadow-none p-0 h-auto focus-visible:ring-0"
                                    />
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 shrink-0" onClick={() => removeTeamMember(member.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <Textarea
                                value={member.bio}
                                onChange={e => updateTeamMember(member.id, 'bio', e.target.value)}
                                placeholder="Parcours, compétences, expérience..."
                                className="min-h-[60px] text-xs"
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Aucun membre d&apos;équipe ajouté</p>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={addTeamMember}>
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter un membre
                    </Button>
                  </div>
                ) : activeSlide?.id === 'ask' ? (
                  /* Ask slide: funding amount + use of funds */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5" /> Montant recherché
                        </Label>
                        <Input
                          value={activeSlide.fundingAmount || ''}
                          onChange={e => updateAskField('fundingAmount', e.target.value)}
                          placeholder="Ex : 50 000 €, 100 000 €..."
                          className="text-lg font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5" /> Horizon
                        </Label>
                        <Input
                          value={activeSlide.content || ''}
                          onChange={e => updateSlideContent('ask', e.target.value)}
                          placeholder="Ex : 18 mois de trésorerie"
                          className="text-lg font-semibold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Utilisation des fonds</Label>
                      <Textarea
                        value={activeSlide.useOfFunds || ''}
                        onChange={e => updateAskField('useOfFunds', e.target.value)}
                        placeholder="Décrivez comment vous utiliserez les fonds levés : développement produit, marketing, recrutement..."
                        className="min-h-[120px]"
                      />
                    </div>
                  </div>
                ) : (
                  /* Standard text slide */
                  <div className="space-y-2">
                    <Textarea
                      value={activeSlide?.content || ''}
                      onChange={e => activeSlide && updateSlideContent(activeSlide.id, e.target.value)}
                      placeholder={activeDef?.placeholder || 'Contenu de la slide...'}
                      className="min-h-[200px] text-sm leading-relaxed"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {(activeSlide?.content || '').length} caractères
                      </span>
                      {(activeSlide?.content || '').length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          ~{Math.ceil((activeSlide?.content || '').length / 40)} lignes
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* ── Slide Navigation ── */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={goPrev} disabled={currentSlide === 0} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>

          {/* Slide selector dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => {
              const isFilled = (() => {
                const s = slides[i]
                if (!s) return false
                if (s.id === 'team') return s.teamMembers?.some(m => m.name) || false
                if (s.id === 'ask') return !!(s.fundingAmount || s.content)
                return s.content.trim().length > 0
              })()
              return (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    'h-3 rounded-full transition-all',
                    i === currentSlide
                      ? 'w-8 bg-[#00838F]'
                      : isFilled
                        ? 'w-3 bg-[#00838F]/40'
                        : 'w-3 bg-muted',
                  )}
                />
              )
            })}
          </div>

          <Button variant="outline" size="sm" onClick={goNext} disabled={currentSlide === slides.length - 1} className="gap-1.5">
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* ── Slide Thumbnails ── */}
        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-3">Toutes les slides</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {slides.map((slide, i) => {
              const def = SLIDE_DEFINITIONS[i]
              if (!def) return null

              const isFilled = (() => {
                if (slide.id === 'team') return slide.teamMembers?.some(m => m.name) || false
                if (slide.id === 'ask') return !!(slide.fundingAmount || slide.content)
                return slide.content.trim().length > 0
              })()

              const isActive = i === currentSlide
              const Icon = def.icon

              return (
                <motion.button
                  key={slide.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center',
                    isActive ? 'border-[#00838F] bg-[#00838F]/5 ring-1 ring-[#00838F]/20' : 'border-border hover:border-muted-foreground/30',
                  )}
                >
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', def.color, 'text-white')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium leading-tight line-clamp-2">{def.title}</span>
                  {isFilled ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground/30" />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* ── Preview Summary ── */}
        {completion.filled > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Presentation className="h-4 w-4 text-[#00838F]" />
                  Aperçu du pitch deck
                </CardTitle>
                <CardDescription>{projectTitle} — {completion.filled} slides remplies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {slides.map((slide) => {
                  const def = SLIDE_DEFINITIONS.find(d => d.id === slide.id)
                  if (!def) return null

                  const hasContent = (() => {
                    if (slide.id === 'team') return slide.teamMembers?.some(m => m.name) || false
                    if (slide.id === 'ask') return !!(slide.fundingAmount || slide.content)
                    return slide.content.trim().length > 0
                  })()

                  if (!hasContent) return null

                  const Icon = def.icon

                  return (
                    <div key={slide.id} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className={cn('flex h-6 w-6 items-center justify-center rounded-md', def.color, 'text-white')}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <h4 className="text-sm font-semibold">{def.title}</h4>
                      </div>

                      {slide.id === 'team' && slide.teamMembers ? (
                        <div className="ml-8 space-y-1">
                          {slide.teamMembers.filter(m => m.name).map(m => (
                            <div key={m.id}>
                              <span className="text-sm font-medium">{m.name}</span>
                              {m.role && <span className="text-xs text-muted-foreground ml-2">— {m.role}</span>}
                              {m.bio && <p className="text-xs text-muted-foreground">{m.bio}</p>}
                            </div>
                          ))}
                        </div>
                      ) : slide.id === 'ask' ? (
                        <div className="ml-8">
                          {slide.fundingAmount && <p className="text-sm"><strong>Montant :</strong> {slide.fundingAmount}</p>}
                          {slide.content && <p className="text-sm">{slide.content}</p>}
                          {slide.useOfFunds && <p className="text-xs text-muted-foreground mt-1">{slide.useOfFunds}</p>}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground ml-8 line-clamp-3">{slide.content}</p>
                      )}

                      <Separator className="ml-8" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
