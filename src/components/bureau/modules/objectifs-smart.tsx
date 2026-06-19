'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Target,
  Save,
  Sparkles,
  Loader2,
  Info,
  Plus,
  Check,
  Trash2,
  CalendarDays,
  Award,
  TrendingUp,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/auth-fetch'

// ─── Types ──────────────────────────────────

type ObjectiveStatus = 'en_cours' | 'atteint' | 'abandonne'

interface SmartObjective {
  id: string
  titre: string
  specifique: string
  mesurable: string
  atteignable: string
  pertinent: string
  temporel: string
  progress: number
  status: ObjectiveStatus
  createdAt: string
  updatedAt: string
}

// ─── Default empty objective ────────────────

function createObjective(): SmartObjective {
  return {
    id: crypto.randomUUID(),
    titre: '',
    specifique: '',
    mesurable: '',
    atteignable: '',
    pertinent: '',
    temporel: '',
    progress: 0,
    status: 'en_cours',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ─── Helpers ────────────────────────────────

function InfoPopover({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-amber-600 hover:bg-amber-600/10 transition-colors shrink-0">
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

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

// ─── Main Component ─────────────────────────

export function ObjectifsSmartModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [objectives, setObjectives] = useState<SmartObjective[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<SmartObjective>(createObjective())

  // ─── Load data on mount ──────────────────
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('creapulse-objectifs-smart')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) setObjectives(parsed)
        } catch { /* ignore */ }
      }

      try {
        const res = await authFetch('/api/paa/objectifs', {
          method: 'POST',
          body: JSON.stringify({ action: 'get-all' }),
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.data)) {
            setObjectives(json.data)
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
      localStorage.setItem('creapulse-objectifs-smart', JSON.stringify(objectives))
    }
  }, [isLoading, objectives])

  // ─── Form helpers ───────────────────────
  const resetForm = useCallback(() => {
    setFormData(createObjective())
    setEditingId(null)
    setShowForm(false)
  }, [])

  const startEdit = useCallback((obj: SmartObjective) => {
    setFormData({ ...obj })
    setEditingId(obj.id)
    setShowForm(true)
  }, [])

  // ─── CRUD operations ────────────────────
  const handleSaveObjective = useCallback(async () => {
    if (!formData.titre.trim()) {
      toast.error('Veuillez saisir un titre pour l\'objectif')
      return
    }

    const isEditing = !!editingId
    const now = new Date().toISOString()
    const updatedObj = { ...formData, updatedAt: now }

    if (isEditing) {
      setObjectives(prev => prev.map(o => o.id === editingId ? updatedObj : o))
    } else {
      setObjectives(prev => [...prev, updatedObj])
    }

    // Save to API
    try {
      const res = await authFetch('/api/paa/objectifs', {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify({
          action: isEditing ? 'update' : 'create',
          objective: updatedObj,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        // Rollback on error
        if (!isEditing) {
          setObjectives(prev => prev.filter(o => o.id !== updatedObj.id))
        }
        toast.error(json.error?.message || 'Erreur lors de la sauvegarde')
        return
      }
      toast.success(isEditing ? 'Objectif mis à jour' : 'Objectif créé')
    } catch {
      toast.error('Erreur de connexion au serveur')
    }

    resetForm()
  }, [formData, editingId, resetForm])

  const handleDeleteObjective = useCallback(async (id: string) => {
    setObjectives(prev => prev.filter(o => o.id !== id))
    try {
      await authFetch('/api/paa/objectifs', {
        method: 'DELETE',
        body: JSON.stringify({ action: 'delete', id }),
      })
    } catch { /* non-critical */ }
    toast.success('Objectif supprimé')
  }, [])

  const handleUpdateProgress = useCallback(async (id: string, progress: number) => {
    const clampedProgress = Math.min(100, Math.max(0, progress))
    const newStatus: ObjectiveStatus = clampedProgress >= 100 ? 'atteint' : clampedProgress <= 0 ? 'en_cours' : 'en_cours'

    setObjectives(prev => prev.map(o => {
      if (o.id === id) {
        const autoMarked = o.progress < 100 && clampedProgress >= 100
        if (autoMarked) {
          toast.success('🎉 Objectif atteint ! Félicitations !')
        }
        return { ...o, progress: clampedProgress, status: newStatus, updatedAt: new Date().toISOString() }
      }
      return o
    }))

    try {
      await authFetch('/api/paa/objectifs', {
        method: 'PUT',
        body: JSON.stringify({ action: 'update-progress', id, progress: clampedProgress }),
      })
    } catch { /* non-critical */ }
  }, [])

  // ─── Computed stats ─────────────────────
  const stats = useMemo(() => {
    const total = objectives.length
    const atteints = objectives.filter(o => o.status === 'atteint').length
    const enCours = objectives.filter(o => o.status === 'en_cours').length
    const abandonnes = objectives.filter(o => o.status === 'abandonne').length
    const avgProgress = total > 0
      ? Math.round(objectives.reduce((s, o) => s + o.progress, 0) / total)
      : 0
    return { total, atteints, enCours, abandonnes, avgProgress }
  }, [objectives])

  // ─── Loading skeleton ───────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-48 bg-muted animate-pulse rounded-xl" />
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Target className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Objectifs SMART</h2>
            <p className="text-xs text-muted-foreground">
              {stats.total} objectifs — Progression globale : {stats.avgProgress}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => { resetForm(); setShowForm(true) }}
          >
            <Plus className="h-3.5 w-3.5" />
            Nouvel objectif
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* ── Stats Dashboard ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <Target className="h-4 w-4 text-amber-500" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold text-amber-500">{stats.total}</p>
              <p className="text-[11px] text-muted-foreground">objectifs définis</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                  <Award className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Atteints</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.atteints}</p>
              <p className="text-[11px] text-muted-foreground">{stats.total > 0 ? Math.round(stats.atteints / stats.total * 100) : 0}% du total</p>
            </CardContent>
          </Card>
          <Card className="border-sky-200 dark:border-sky-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                  <TrendingUp className="h-4 w-4 text-sky-500" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">En cours</span>
              </div>
              <p className="text-2xl font-bold text-sky-600">{stats.enCours}</p>
              <p className="text-[11px] text-muted-foreground">objectifs actifs</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Progression</span>
              </div>
              <p className="text-2xl font-bold text-amber-500">{stats.avgProgress}%</p>
              <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-amber-500"
                  animate={{ width: `${stats.avgProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Overall progress bar ── */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression globale</span>
              <span className="text-sm font-bold text-amber-500">{stats.avgProgress}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  stats.avgProgress >= 75 ? 'bg-green-500' :
                  stats.avgProgress >= 40 ? 'bg-amber-500' : 'bg-red-500'
                )}
                animate={{ width: `${stats.avgProgress}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Creation / Edit Form ── */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {editingId ? '✏️ Modifier l\'objectif' : '➕ Nouvel objectif SMART'}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 w-7 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Définissez un objectif Spécifique, Mesurable, Atteignable, Pertinent et Temporel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Titre de l&apos;objectif
                    <InfoPopover text="Donnez un nom court et clair à votre objectif. Ex: Atteindre 5000€ de CA mensuel" />
                  </label>
                  <input
                    type="text"
                    value={formData.titre}
                    onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                    placeholder="Ex: Atteindre 5 000 € de CA mensuel d'ici décembre"
                    className="w-full text-sm rounded-lg border border-border bg-background/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* SMART criteria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Spécifique */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      S — Spécifique
                      <InfoPopover text="Quel est l'objectif précis ? Que voulez-vous accomplir exactement ?" />
                    </label>
                    <Textarea
                      value={formData.specifique}
                      onChange={(e) => setFormData(prev => ({ ...prev, specifique: e.target.value }))}
                      placeholder="Décrivez précisément ce que vous voulez atteindre..."
                      className="min-h-[80px] text-sm resize-none"
                    />
                  </div>

                  {/* Mesurable */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      M — Mesurable
                      <InfoPopover text="Comment allez-vous mesurer le succès ? Quels sont les indicateurs quantifiables ?" />
                    </label>
                    <Textarea
                      value={formData.mesurable}
                      onChange={(e) => setFormData(prev => ({ ...prev, mesurable: e.target.value }))}
                      placeholder="Indicateurs de mesure : nombre de clients, CA, etc."
                      className="min-h-[80px] text-sm resize-none"
                    />
                  </div>

                  {/* Atteignable */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      A — Atteignable
                      <InfoPopover text="L'objectif est-il réaliste avec vos ressources actuelles ? Quels moyens allez-vous mobiliser ?" />
                    </label>
                    <Textarea
                      value={formData.atteignable}
                      onChange={(e) => setFormData(prev => ({ ...prev, atteignable: e.target.value }))}
                      placeholder="Ressources disponibles, compétences, contraintes..."
                      className="min-h-[80px] text-sm resize-none"
                    />
                  </div>

                  {/* Pertinent */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      R — Pertinent (Relevant)
                      <InfoPopover text="Pourquoi cet objectif est-il important pour votre projet ? Comment contribue-t-il à votre vision ?" />
                    </label>
                    <Textarea
                      value={formData.pertinent}
                      onChange={(e) => setFormData(prev => ({ ...prev, pertinent: e.target.value }))}
                      placeholder="Alignement avec la vision, impact sur le projet..."
                      className="min-h-[80px] text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Temporel */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    T — Temporel
                    <InfoPopover text="Quelle est l'échéance ? Définissez une date limite claire pour rester motivé." />
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
                      <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <input
                      type="date"
                      value={formData.temporel}
                      onChange={(e) => setFormData(prev => ({ ...prev, temporel: e.target.value }))}
                      className="flex-1 text-sm rounded-lg border border-border bg-background/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={handleSaveObjective}
                  >
                    <Save className="h-3.5 w-3.5" />
                    {editingId ? 'Mettre à jour' : 'Créer l\'objectif'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Separator />

        {/* ── Objectives List ── */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-500" />
            Mes objectifs
            {stats.total > 0 && (
              <Badge variant="outline" className="text-xs">{stats.total}</Badge>
            )}
          </h3>

          {objectives.length === 0 && !showForm && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Aucun objectif défini pour le moment.</p>
                <p className="text-xs text-muted-foreground mt-1">Commencez par créer votre premier objectif SMART.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-1.5"
                  onClick={() => { resetForm(); setShowForm(true) }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Créer un objectif
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {objectives.map((obj) => (
              <motion.div
                key={obj.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={cn(
                  'transition-all',
                  obj.status === 'atteint' && 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-950/10',
                  obj.status === 'abandonne' && 'border-muted opacity-60',
                  obj.status === 'en_cours' && 'border-border'
                )}>
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Status badge + Title */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {obj.status === 'atteint' && (
                            <Badge className="bg-green-500 text-white text-[10px] gap-1">
                              <Award className="h-3 w-3" />
                              Atteint
                            </Badge>
                          )}
                          {obj.status === 'en_cours' && (
                            <Badge variant="outline" className="text-sky-600 border-sky-300 dark:border-sky-700 text-[10px]">
                              En cours
                            </Badge>
                          )}
                          {obj.status === 'abandonne' && (
                            <Badge variant="outline" className="text-muted-foreground text-[10px]">
                              Abandonné
                            </Badge>
                          )}
                          <h4 className={cn(
                            'text-sm font-semibold',
                            obj.status === 'atteint' && 'text-green-700 dark:text-green-400',
                            obj.status === 'abandonne' && 'line-through text-muted-foreground'
                          )}>
                            {obj.titre || 'Objectif sans titre'}
                          </h4>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={cn(
                                'h-full rounded-full',
                                obj.progress >= 100 ? 'bg-green-500' :
                                obj.progress >= 50 ? 'bg-amber-500' : 'bg-sky-500'
                              )}
                              animate={{ width: `${obj.progress}%` }}
                              transition={{ duration: 0.4 }}
                            />
                          </div>
                          <span className="text-xs font-bold text-muted-foreground w-10 text-right">
                            {obj.progress}%
                          </span>
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-3 mt-2">
                          {obj.temporel && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(obj.temporel)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Progress slider */}
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={obj.progress}
                            onChange={(e) => handleUpdateProgress(obj.id, parseInt(e.target.value))}
                            className="w-20 h-1.5 appearance-none bg-muted rounded-full cursor-pointer accent-amber-500"
                          />
                          <span className="text-xs font-mono w-8 text-right">{obj.progress}%</span>
                        </div>

                        <Separator orientation="vertical" className="h-6" />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(obj)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-500"
                        >
                          ✏️
                        </Button>
                        {obj.status === 'atteint' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateProgress(obj.id, 0)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-sky-500"
                            title="Réinitialiser"
                          >
                            🔄
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteObjective(obj.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Bottom Summary ── */}
        {objectives.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-500/5 to-amber-300/5 border-amber-200 dark:border-amber-800">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-500">{stats.total}</p>
                    <p className="text-[11px] text-muted-foreground">Total</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.atteints}</p>
                    <p className="text-[11px] text-muted-foreground">Atteints</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-sky-600">{stats.enCours}</p>
                    <p className="text-[11px] text-muted-foreground">En cours</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => { resetForm(); setShowForm(true) }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nouvel objectif
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  )
}
