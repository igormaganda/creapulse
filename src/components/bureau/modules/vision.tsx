'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Eye,
  Target,
  Heart,
  Flag,
  Save,
  Loader2,
  CheckCircle2,
  Plus,
  X,
  Download,
  Sparkles,
  Lightbulb,
  Clock,
  Star,
  ArrowRight,
  Milestone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/zustand/store'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface Objective {
  id: string
  title: string
  description: string
  deadline: string
  priority: 'high' | 'medium' | 'low'
}

interface Milestones {
  sixMonths: { goals: string[] }
  oneYear: { goals: string[] }
  threeYears: { goals: string[] }
  fiveYears: { goals: string[] }
}

interface VisionData {
  projectTitle: string
  visionStatement: string
  objectives: Objective[]
  coreValues: string[]
  milestones: Milestones
  motivation: string
  desiredImpact: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const STORAGE_KEY = 'creapulse-vision'

const PREDEFINED_VALUES = [
  { value: 'innovation', label: 'Innovation', icon: '💡' },
  { value: 'impact_social', label: 'Impact social', icon: '🌍' },
  { value: 'excellence', label: 'Excellence', icon: '⭐' },
  { value: 'transparence', label: 'Transparence', icon: '🔍' },
  { value: 'collaboration', label: 'Collaboration', icon: '🤝' },
  { value: 'durabilite', label: 'Durabilité', icon: '🌱' },
  { value: 'liberte', label: 'Liberté', icon: '🕊️' },
  { value: 'autonomie', label: 'Autonomie', icon: '🎯' },
  { value: 'passion', label: 'Passion', icon: '❤️' },
  { value: 'integrite', label: 'Intégrité', icon: '⚖️' },
  { value: 'courage', label: 'Courage', icon: '🦁' },
  { value: 'simplicite', label: 'Simplicité', icon: '✨' },
  { value: 'respect', label: 'Respect', icon: '🙏' },
  { value: 'croissance', label: 'Croissance', icon: '📈' },
  { value: 'creativite', label: 'Créativité', icon: '🎨' },
]

const PRIORITY_CONFIG = {
  high: { label: 'Haute', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  medium: { label: 'Moyenne', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  low: { label: 'Basse', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
}

const MILESTONE_PHASES = [
  { key: 'sixMonths' as const, label: '6 mois', sublabel: 'Lancement', color: '#00838F', icon: '🚀' },
  { key: 'oneYear' as const, label: '1 an', sublabel: 'Croissance', color: '#22C55E', icon: '📈' },
  { key: 'threeYears' as const, label: '3 ans', sublabel: 'Consolidation', color: '#F59E0B', icon: '🏛️' },
  { key: 'fiveYears' as const, label: '5 ans', sublabel: 'Maturité', color: '#A855F7', icon: '🌟' },
]

const DEFAULT_MILESTONES: Milestones = {
  sixMonths: { goals: [] },
  oneYear: { goals: [] },
  threeYears: { goals: [] },
  fiveYears: { goals: [] },
}

const DEFAULT_VISION: VisionData = {
  projectTitle: '',
  visionStatement: '',
  objectives: [],
  coreValues: [],
  milestones: DEFAULT_MILESTONES,
  motivation: '',
  desiredImpact: '',
}

function generateId() {
  return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function calculateCompletion(data: VisionData): number {
  let filled = 0
  let total = 6
  if (data.visionStatement.trim()) filled++
  if (data.objectives.length > 0) filled++
  if (data.coreValues.length > 0) filled++
  const totalGoals = Object.values(data.milestones).reduce((s, m) => s + m.goals.length, 0)
  if (totalGoals > 0) filled++
  if (data.motivation.trim()) filled++
  if (data.desiredImpact.trim()) filled++
  return Math.round((filled / total) * 100)
}

// ────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────

export function VisionModule() {
  const [data, setData] = useState<VisionData>(DEFAULT_VISION)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [hasChanges, setHasChanges] = useState(false)
  const [newGoalPhase, setNewGoalPhase] = useState<keyof Milestones | null>(null)
  const [newGoalText, setNewGoalText] = useState('')
  const token = useAuthStore((s) => s.token)

  // ── Load data ──
  useEffect(() => {
    async function loadVision() {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setData({ ...DEFAULT_VISION, ...parsed })
          setLoading(false)
          fetchFromApi()
          return
        } catch { /* ignore */ }
      }
      fetchFromApi()
    }

    async function fetchFromApi() {
      try {
        const res = await fetch('/api/vision', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          credentials: 'include',
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const apiData = json.data as VisionData
            setData((prev) => ({
              ...prev,
              ...apiData,
              milestones: { ...DEFAULT_MILESTONES, ...(apiData.milestones || {}) },
            }))
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_VISION, ...apiData }))
          }
        }
      } catch { /* silent */ }
      setLoading(false)
    }

    loadVision()
  }, [token])

  // ── Auto-save to localStorage ──
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data, loading])

  // ── Update helpers ──
  const updateField = useCallback(<K extends keyof VisionData>(key: K, value: VisionData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }, [])

  const addObjective = useCallback(() => {
    if (data.objectives.length >= 5) {
      toast.warning('Maximum 5 objectifs autorisés')
      return
    }
    const newObj: Objective = {
      id: generateId(),
      title: '',
      description: '',
      deadline: '',
      priority: 'medium',
    }
    setData((prev) => ({ ...prev, objectives: [...prev.objectives, newObj] }))
    setHasChanges(true)
  }, [data.objectives.length])

  const updateObjective = useCallback((id: string, field: keyof Objective, value: string) => {
    setData((prev) => ({
      ...prev,
      objectives: prev.objectives.map((o) => o.id === id ? { ...o, [field]: value } : o),
    }))
    setHasChanges(true)
  }, [])

  const removeObjective = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      objectives: prev.objectives.filter((o) => o.id !== id),
    }))
    setHasChanges(true)
  }, [])

  const toggleValue = useCallback((value: string) => {
    setData((prev) => ({
      ...prev,
      coreValues: prev.coreValues.includes(value)
        ? prev.coreValues.filter((v) => v !== value)
        : prev.coreValues.length < 5
          ? [...prev.coreValues, value]
          : prev.coreValues,
    }))
    setHasChanges(true)
  }, [])

  const addGoal = useCallback((phase: keyof Milestones) => {
    const trimmed = newGoalText.trim()
    if (!trimmed) return
    setData((prev) => ({
      ...prev,
      milestones: {
        ...prev.milestones,
        [phase]: {
          goals: [...prev.milestones[phase].goals, trimmed],
        },
      },
    }))
    setNewGoalText('')
    setHasChanges(true)
  }, [newGoalText])

  const removeGoal = useCallback((phase: keyof Milestones, index: number) => {
    setData((prev) => ({
      ...prev,
      milestones: {
        ...prev.milestones,
        [phase]: {
          goals: prev.milestones[phase].goals.filter((_, i) => i !== index),
        },
      },
    }))
    setHasChanges(true)
  }, [])

  // ── Save to API ──
  const handleSave = async () => {
    if (!token) {
      setSaveStatus('error')
      toast.error('Vous devez être connecté(e)', { description: 'Session non trouvée. Reconnectez-vous.' })
      return
    }
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/vision', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSaveStatus('saved')
        setHasChanges(false)
        toast.success('Vision sauvegardée avec succès !')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else if (res.status === 401) {
        setSaveStatus('error')
        toast.error('Vous devez être connecté(e) pour sauvegarder', {
          description: 'Votre session a expiré. Veuillez vous reconnecter.',
        })
      } else {
        setSaveStatus('error')
        const json = await res.json().catch(() => null)
        toast.error('Erreur lors de la sauvegarde', {
          description: json?.error?.message || 'Veuillez réessayer.',
        })
      }
    } catch {
      setSaveStatus('error')
      toast.error('Erreur réseau', {
        description: 'Vérifiez votre connexion et réessayez.',
      })
    }
  }

  // ── Export summary ──
  const handleExport = useCallback(() => {
    const lines: string[] = []
    lines.push('═══════════════════════════════════════')
    lines.push('  VISION STRATÉGIQUE — CreaPulse')
    lines.push('═══════════════════════════════════════')
    lines.push('')

    if (data.projectTitle) {
      lines.push(`Projet : ${data.projectTitle}`)
      lines.push('')
    }

    lines.push('── MA VISION À 5 ANS ──')
    lines.push(data.visionStatement || 'Non définie')
    lines.push('')

    if (data.coreValues.length > 0) {
      lines.push('── VALEURS FONDAMENTALES ──')
      data.coreValues.forEach((v) => {
        const found = PREDEFINED_VALUES.find((pv) => pv.value === v)
        lines.push(`  ${found?.icon || '◆'} ${found?.label || v}`)
      })
      lines.push('')
    }

    if (data.objectives.length > 0) {
      lines.push('── OBJECTIFS STRATÉGIQUES ──')
      data.objectives.forEach((obj, i) => {
        const prio = PRIORITY_CONFIG[obj.priority]
        lines.push(`  ${i + 1}. [${prio.label}] ${obj.title || 'Sans titre'}`)
        if (obj.description) lines.push(`     ${obj.description}`)
        if (obj.deadline) lines.push(`     Échéance : ${obj.deadline}`)
        lines.push('')
      })
    }

    const hasGoals = Object.values(data.milestones).some((m) => m.goals.length > 0)
    if (hasGoals) {
      lines.push('── JALONS STRATÉGIQUES ──')
      MILESTONE_PHASES.forEach((phase) => {
        const goals = data.milestones[phase.key].goals
        if (goals.length > 0) {
          lines.push(`  ${phase.icon} ${phase.label} — ${phase.sublabel}`)
          goals.forEach((g) => lines.push(`    • ${g}`))
          lines.push('')
        }
      })
    }

    if (data.motivation) {
      lines.push('── POURQUOI CE PROJET ? ──')
      lines.push(data.motivation)
      lines.push('')
    }

    if (data.desiredImpact) {
      lines.push('── IMPACT SOUHAITÉ ──')
      lines.push(data.desiredImpact)
      lines.push('')
    }

    lines.push('═══════════════════════════════════════')
    lines.push(`  Généré via CreaPulse — ${new Date().toLocaleDateString('fr-FR')}`)
    lines.push('═══════════════════════════════════════')

    const text = lines.join('\n')

    // Create and download file
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vision-strategique-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Résumé exporté avec succès !')
  }, [data])

  const completion = calculateCompletion(data)

  if (loading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto w-full space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto w-full space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            Vision Stratégique
          </h1>
          <p className="mt-1 text-muted-foreground">
            Définissez votre vision à long terme et vos objectifs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} className="gap-2 rounded-full" size="sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || !hasChanges}
            className="gap-2 rounded-full"
            size="sm"
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveStatus === 'saved' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveStatus === 'saving' ? 'Sauvegarde...' : saveStatus === 'saved' ? 'Sauvegardé !' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Completion indicator */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-none shadow-sm bg-muted/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Progression de votre vision
              </p>
              <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full transition-colors',
                    completion >= 80 ? 'bg-green-500' :
                    completion >= 50 ? 'bg-primary' :
                    'bg-amber-500'
                  )}
                />
              </div>
            </div>
            <span className={cn(
              'text-2xl font-bold shrink-0',
              completion >= 80 ? 'text-green-600 dark:text-green-400' :
              completion >= 50 ? 'text-primary' :
              'text-amber-600 dark:text-amber-400'
            )}>
              {completion}%
            </span>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vision Statement */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Ma vision à 5 ans
            </CardTitle>
            <CardDescription>
              Décrivez où vous voyez votre entreprise dans 5 ans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Dans 5 ans, mon entreprise..."
              value={data.visionStatement}
              onChange={(e) => updateField('visionStatement', e.target.value)}
              rows={5}
              className="text-base leading-relaxed resize-none"
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Soyez inspirant(e) et précis(e)
              </p>
              <span className="text-xs text-muted-foreground">
                {data.visionStatement.length} caractères
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Motivation & Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-none shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-coral-500" />
                Pourquoi ce projet ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Qu'est-ce qui vous anime dans ce projet entrepreneurial ?"
                value={data.motivation}
                onChange={(e) => updateField('motivation', e.target.value)}
                rows={5}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-none shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Impact souhaité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Quel impact positif souhaitez-vous avoir sur votre marché, votre communauté, l'environnement ?"
                value={data.desiredImpact}
                onChange={(e) => updateField('desiredImpact', e.target.value)}
                rows={5}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Strategic Objectives */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flag className="h-5 w-5 text-primary" />
                  Objectifs stratégiques
                </CardTitle>
                <CardDescription className="mt-1">
                  Définissez jusqu&apos;à 5 objectifs clés pour votre entreprise
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addObjective}
                disabled={data.objectives.length >= 5}
                className="gap-1.5 rounded-full"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.objectives.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-muted-foreground/20 rounded-xl">
                <Flag className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucun objectif défini. Cliquez sur &quot;Ajouter&quot; pour commencer.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {data.objectives.map((obj, idx) => (
                    <motion.div
                      key={obj.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl border border-border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                            {idx + 1}
                          </span>
                          <Input
                            placeholder="Titre de l'objectif..."
                            value={obj.title}
                            onChange={(e) => updateObjective(obj.id, 'title', e.target.value)}
                            className="font-medium border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-base"
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Select
                            value={obj.priority}
                            onValueChange={(val) => updateObjective(obj.id, 'priority', val)}
                          >
                            <SelectTrigger className="w-[110px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">
                                <span className="flex items-center gap-1.5">
                                  <div className="h-2 w-2 rounded-full bg-red-500" />
                                  Haute
                                </span>
                              </SelectItem>
                              <SelectItem value="medium">
                                <span className="flex items-center gap-1.5">
                                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                                  Moyenne
                                </span>
                              </SelectItem>
                              <SelectItem value="low">
                                <span className="flex items-center gap-1.5">
                                  <div className="h-2 w-2 rounded-full bg-green-500" />
                                  Basse
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeObjective(obj.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
                        <Textarea
                          placeholder="Description de l'objectif..."
                          value={obj.description}
                          onChange={(e) => updateObjective(obj.id, 'description', e.target.value)}
                          rows={2}
                          className="text-sm resize-none"
                        />
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Échéance</Label>
                          <Input
                            type="date"
                            value={obj.deadline}
                            onChange={(e) => updateObjective(obj.id, 'deadline', e.target.value)}
                            className="text-sm h-9"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Core Values */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Valeurs fondamentales
            </CardTitle>
            <CardDescription>
              Sélectionnez jusqu&apos;à 5 valeurs qui guideront votre entreprise
              <Badge variant="secondary" className="ml-2 text-xs">
                {data.coreValues.length}/5
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Selected values */}
            {data.coreValues.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {data.coreValues.map((val) => {
                  const found = PREDEFINED_VALUES.find((p) => p.value === val)
                  return (
                    <Badge
                      key={val}
                      className="gap-1.5 py-1.5 px-3 text-sm border border-primary/20 bg-primary/5"
                    >
                      {found?.icon} {found?.label || val}
                      <button
                        onClick={() => toggleValue(val)}
                        className="ml-1 hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}

            {/* Values grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {PREDEFINED_VALUES.map((pv) => {
                const isSelected = data.coreValues.includes(pv.value)
                const isMaxed = data.coreValues.length >= 5 && !isSelected
                return (
                  <button
                    key={pv.value}
                    onClick={() => !isMaxed && toggleValue(pv.value)}
                    disabled={isMaxed}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : isMaxed
                          ? 'border-transparent bg-muted/30 opacity-50 cursor-not-allowed'
                          : 'border-transparent bg-muted/50 hover:bg-muted hover:border-muted-foreground/20 cursor-pointer'
                    )}
                  >
                    <span className="text-lg">{pv.icon}</span>
                    <span className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}>
                      {pv.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary ml-auto shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Milestones Timeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Milestone className="h-5 w-5 text-primary" />
              Jalons stratégiques
            </CardTitle>
            <CardDescription>
              Définissez vos objectifs pour chaque phase de développement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border hidden sm:block" />

              <div className="space-y-6">
                {MILESTONE_PHASES.map((phase, idx) => {
                  const goals = data.milestones[phase.key].goals
                  return (
                    <motion.div
                      key={phase.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + idx * 0.1 }}
                      className="relative flex gap-4 sm:gap-6"
                    >
                      {/* Timeline dot */}
                      <div className="hidden sm:flex flex-col items-center shrink-0 z-10">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-lg shadow-sm"
                          style={{ backgroundColor: `${phase.color}15`, border: `2px solid ${phase.color}` }}
                        >
                          {phase.icon}
                        </div>
                        {idx < MILESTONE_PHASES.length - 1 && (
                          <div className="flex-1 w-0.5 mt-1" style={{ backgroundColor: `${phase.color}30` }} />
                        )}
                      </div>

                      {/* Phase content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="sm:hidden flex h-8 w-8 items-center justify-center rounded-full text-sm"
                            style={{ backgroundColor: `${phase.color}15` }}
                          >
                            {phase.icon}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              {phase.label}
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5"
                                style={{ backgroundColor: `${phase.color}15`, color: phase.color }}
                              >
                                {phase.sublabel}
                              </Badge>
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {goals.length} objectif{goals.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Goals list */}
                        <div className="space-y-2">
                          {goals.map((goal, gi) => (
                            <motion.div
                              key={gi}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + idx * 0.1 + gi * 0.05 }}
                              className="flex items-start gap-2 group"
                            >
                              <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: phase.color }} />
                              <span className="text-sm text-foreground flex-1">{goal}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeGoal(phase.key, gi)}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>

                        {/* Add goal input */}
                        {newGoalPhase === phase.key ? (
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="Ajouter un objectif..."
                              value={newGoalText}
                              onChange={(e) => setNewGoalText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); addGoal(phase.key) }
                                if (e.key === 'Escape') { setNewGoalPhase(null); setNewGoalText('') }
                              }}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button size="sm" variant="outline" onClick={() => addGoal(phase.key)} disabled={!newGoalText.trim()} className="h-8 shrink-0">
                              OK
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setNewGoalPhase(null); setNewGoalText('') }} className="h-8 shrink-0">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNewGoalPhase(phase.key)}
                            className="mt-2 gap-1 text-xs text-muted-foreground hover:text-primary"
                          >
                            <Plus className="h-3 w-3" />
                            Ajouter un objectif
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom action bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-4"
      >
        <Button
          variant="outline"
          onClick={handleExport}
          className="gap-2 rounded-full"
        >
          <Download className="h-4 w-4" />
          Exporter le résumé
        </Button>
        <Button
          onClick={handleSave}
          disabled={saveStatus === 'saving' || !hasChanges}
          className="gap-2 rounded-full"
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveStatus === 'saved' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveStatus === 'saving' ? 'Sauvegarde...' : saveStatus === 'saved' ? 'Sauvegardé !' : 'Sauvegarder la vision'}
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default VisionModule
