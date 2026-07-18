'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  Circle,
  Pencil,
  Users,
  Target,
  DollarSign,
  Rocket,
  FileCheck,
  Loader2,
  Briefcase,
  TrendingUp,
  Heart,
  Award,
  Sparkles,
} from 'lucide-react'
import { useAuthStore } from '@/lib/zustand/store'
import { AudioControls } from '@/components/audio/audio-controls'

// ─── Types ────────────────────────────────────

interface ProjectFormData {
  // Step 1: Identité du Projet
  projectTitle: string
  projectSector: string
  projectDescription: string
  projectStage: string
  // Step 2: Marché & Clientèle
  primaryTarget: string
  secondaryTarget: string
  problemSolved: string
  competitiveAdvantage: string
  marketSize: string
  // Step 3: Modèle Économique
  revenueSources: string[]
  revenueYear1: string
  revenueYear2: string
  revenueYear3: string
  initialInvestment: string
  financingNeed: string
  // Step 4: Équipe & Motivation
  teamType: string
  associateCount: string
  motivation: string
  keyCompetencies: string[]
}

interface StepErrors {
  [field: string]: string
}

// ─── Constants ────────────────────────────────

const STORAGE_KEY = 'creapulse-mon-projet'

const STEPS = [
  { id: 1, label: 'Identité', icon: Briefcase },
  { id: 2, label: 'Marché', icon: Target },
  { id: 3, label: 'Économie', icon: DollarSign },
  { id: 4, label: 'Équipe', icon: Users },
  { id: 5, label: 'Résumé', icon: FileCheck },
]

const SECTORS = [
  'Commerce',
  'Artisanat',
  'Services',
  'Tech',
  'Restauration',
  'Santé',
  'Éducation',
  'Autre',
]

const STAGES = ['Idée', 'Étude de marché', 'Structuration', 'Lancement imminent']

const MARKET_SIZES = ['Local', 'Régional', 'National', 'International']

const REVENUE_SOURCES = [
  'Vente produits',
  'Prestations services',
  'Abonnement',
  'Commission',
  'Publicité',
  'Autre',
]

const FINANCING_OPTIONS = ['Aucun', '< 10K€', '10-50K€', '50-100K€', '> 100K€']

const MOTIVATIONS = [
  'Indépendance',
  'Passion',
  'Opportunité',
  'Revenu',
  'Impact social',
  'Autre',
]

const COMPETENCIES = [
  'Commercial',
  'Technique',
  'Gestion',
  'Marketing',
  'Juridique',
  'Design',
  'Autre',
]

const EMPTY_FORM: ProjectFormData = {
  projectTitle: '',
  projectSector: '',
  projectDescription: '',
  projectStage: '',
  primaryTarget: '',
  secondaryTarget: '',
  problemSolved: '',
  competitiveAdvantage: '',
  marketSize: '',
  revenueSources: [],
  revenueYear1: '',
  revenueYear2: '',
  revenueYear3: '',
  initialInvestment: '',
  financingNeed: '',
  teamType: '',
  associateCount: '',
  motivation: '',
  keyCompetencies: [],
}

// ─── Helpers ──────────────────────────────────

function loadFromStorage(): ProjectFormData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveToStorage(data: ProjectFormData) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage may be full
  }
}

function clearStorage() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function calculateMaturityScore(data: ProjectFormData): number {
  const fields: (string | string[])[] = [
    data.projectTitle,
    data.projectSector,
    data.projectDescription,
    data.projectStage,
    data.primaryTarget,
    data.secondaryTarget,
    data.problemSolved,
    data.competitiveAdvantage,
    data.marketSize,
    ...data.revenueSources,
    data.revenueYear1,
    data.revenueYear2,
    data.revenueYear3,
    data.initialInvestment,
    data.financingNeed,
    data.teamType,
    data.associateCount,
    data.motivation,
    ...data.keyCompetencies,
  ]

  const filled = fields.filter(
    (f) => (typeof f === 'string' ? f.trim().length > 0 : f.length > 0),
  ).length
  return Math.round((filled / fields.length) * 100)
}

function getScoreColor(score: number): string {
  if (score < 30) return 'text-red-500'
  if (score < 70) return 'text-amber-500'
  return 'text-green-600 dark:text-green-400'
}

function getScoreBgColor(score: number): string {
  if (score < 30) return 'bg-red-500'
  if (score < 70) return 'bg-amber-500'
  return 'bg-green-600 dark:bg-green-500'
}

function getScoreLabel(score: number): string {
  if (score < 30) return 'Débutant'
  if (score < 50) return 'En construction'
  if (score < 70) return 'Avancé'
  if (score < 90) return 'Mature'
  return 'Complet'
}

function getScoreProgressColor(score: number): string {
  if (score < 30) return '[&>div]:bg-red-500'
  if (score < 70) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-green-600 dark:[&>div]:bg-green-500'
}

function formatCurrency(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num) || num === 0) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num)
}

function getSectorLabel(value: string): string {
  return value || 'Non défini'
}

function getStageLabel(value: string): string {
  return value || 'Non défini'
}

// ─── Validation ───────────────────────────────

function validateStep(step: number, data: ProjectFormData): StepErrors {
  const errors: StepErrors = {}

  switch (step) {
    case 1:
      if (!data.projectTitle.trim()) errors.projectTitle = 'Le nom du projet est requis'
      if (!data.projectSector) errors.projectSector = 'Le secteur d\'activité est requis'
      if (data.projectDescription.trim().length < 50)
        errors.projectDescription = `Minimum 50 caractères (${data.projectDescription.trim().length}/50)`
      if (!data.projectStage) errors.projectStage = 'Le stade actuel est requis'
      break
    case 2:
      if (!data.primaryTarget.trim()) errors.primaryTarget = 'Le client cible principal est requis'
      if (!data.problemSolved.trim()) errors.problemSolved = 'Décrivez le problème résolu par votre projet'
      break
    case 3:
      // All optional
      break
    case 4:
      if (!data.teamType) errors.teamType = 'Indiquez si la création est individuelle ou en équipe'
      if (!data.motivation) errors.motivation = 'La motivation principale est requise'
      break
  }

  return errors
}

// ─── Step Indicator ───────────────────────────

function StepIndicator({ currentStep, completedSteps, onStepClick }: {
  currentStep: number
  completedSteps: Set<number>
  onStepClick: (step: number) => void
}) {
  return (
    <div className="mb-6 md:mb-8">
      {/* Desktop step labels */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step) => {
          const Icon = step.icon
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = step.id === currentStep
          const isPast = step.id < currentStep

          return (
            <button
              key={step.id}
              onClick={() => {
                if (isPast || isCompleted) onStepClick(step.id)
              }}
              className={cn(
                'relative z-10 flex flex-col items-center gap-1.5 group cursor-pointer',
                (!isPast && !isCompleted) && 'cursor-not-allowed'
              )}
              disabled={!isPast && !isCompleted}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && !isCompleted && 'border-primary bg-background text-primary shadow-md shadow-primary/20',
                  !isCurrent && !isCompleted && 'border-muted-foreground/30 bg-background text-muted-foreground/50',
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors',
                  isCurrent && 'text-primary',
                  isCompleted && 'text-primary/80',
                  !isCurrent && !isCompleted && 'text-muted-foreground/50',
                )}
              >
                {step.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mobile step dots */}
      <div className="flex md:hidden items-center justify-center gap-2">
        {STEPS.map((step) => {
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = step.id === currentStep
          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                isCompleted && 'bg-primary text-primary-foreground',
                isCurrent && !isCompleted && 'border-2 border-primary text-primary',
                !isCurrent && !isCompleted && 'border border-muted-foreground/30 text-muted-foreground/40',
              )}
            >
              {step.id}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 1: Identité du Projet ───────────────

function StepIdentite({ data, errors, onChange }: {
  data: ProjectFormData
  errors: StepErrors
  onChange: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Identité du Projet
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Décrivez les informations de base de votre projet de création d&apos;entreprise.
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Nom du projet */}
        <div className="space-y-2">
          <Label htmlFor="projectTitle" className="text-sm font-medium">
            Nom du projet <span className="text-red-500">*</span>
          </Label>
          <Input
            id="projectTitle"
            placeholder="Ex: Ma Belle Boutique"
            value={data.projectTitle}
            onChange={(e) => onChange('projectTitle', e.target.value)}
            className={cn(errors.projectTitle && 'border-red-500 focus-visible:ring-red-500')}
          />
          {errors.projectTitle && (
            <p className="text-xs text-red-500">{errors.projectTitle}</p>
          )}
        </div>

        {/* Secteur d'activité */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Secteur d&apos;activité <span className="text-red-500">*</span>
          </Label>
          <Select value={data.projectSector} onValueChange={(v) => onChange('projectSector', v)}>
            <SelectTrigger className={cn(errors.projectSector && 'border-red-500 focus:ring-red-500')}>
              <SelectValue placeholder="Sélectionnez un secteur" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[250]">
              {SECTORS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projectSector && (
            <p className="text-xs text-red-500">{errors.projectSector}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="projectDescription" className="text-sm font-medium">
          Description du projet <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="projectDescription"
          placeholder="Décrivez votre projet en détail : concept, activités, valeur ajoutée..."
          rows={4}
          value={data.projectDescription}
          onChange={(e) => onChange('projectDescription', e.target.value)}
          className={cn(
            errors.projectDescription && 'border-red-500 focus-visible:ring-red-500',
            'resize-none'
          )}
        />
        <div className="flex justify-between items-center">
          {errors.projectDescription ? (
            <p className="text-xs text-red-500">{errors.projectDescription}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Minimum 50 caractères</p>
          )}
          <p className={cn(
            'text-xs tabular-nums',
            data.projectDescription.trim().length < 50 ? 'text-muted-foreground' : 'text-green-600'
          )}>
            {data.projectDescription.trim().length}/50
          </p>
        </div>
      </div>

      {/* Stade actuel */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Stade actuel du projet <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={data.projectStage}
          onValueChange={(v) => onChange('projectStage', v)}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {STAGES.map((stage) => (
            <label
              key={stage}
              htmlFor={`stage-${stage}`}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all',
                data.projectStage === stage
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50',
                errors.projectStage && !data.projectStage && 'border-red-300'
              )}
            >
              <RadioGroupItem value={stage} id={`stage-${stage}`} />
              <div>
                <span className="text-sm font-medium">{stage}</span>
              </div>
            </label>
          ))}
        </RadioGroup>
        {errors.projectStage && (
          <p className="text-xs text-red-500">{errors.projectStage}</p>
        )}
      </div>
    </div>
  )
}

// ─── Step 2: Marché & Clientèle ───────────────

function StepMarche({ data, errors, onChange }: {
  data: ProjectFormData
  errors: StepErrors
  onChange: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void
}) {
  const token = useAuthStore((s) => s.token)

  const [suggestions, setSuggestions] = useState<{
    clients: string[]
    problems: string[]
    advantages: string[]
  }>({ clients: [], problems: [], advantages: [] })

  // Fetch AI suggestions when sector changes
  useEffect(() => {
    let cancelled = false
    if (data.projectSector) {
      fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ sector: data.projectSector, activity: data.projectTitle, useAI: true }),
      })
        .then((r) => r.json())
        .then((json) => {
          if (!cancelled && json.success && json.data) setSuggestions(json.data)
        })
        .catch(() => {})
    }
    return () => { cancelled = true }
  }, [data.projectSector, data.projectTitle, token])

  // Handler: replace value for single-line, append for multi-line
  const applySuggestion = (
    field: 'primaryTarget' | 'problemSolved' | 'competitiveAdvantage',
    value: string,
  ) => {
    if (field === 'primaryTarget') {
      onChange(field, value)
    } else {
      const current = data[field]
      onChange(field, current.trim() ? `${current.trim()}\n${value}` : value)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Marché &amp; Clientèle
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Définissez votre marché cible et votre positionnement concurrentiel.
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Client cible principal */}
        <div className="space-y-2">
          <Label htmlFor="primaryTarget" className="text-sm font-medium">
            Client cible principal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="primaryTarget"
            placeholder="Ex: Entreprises PME du secteur tech"
            value={data.primaryTarget}
            onChange={(e) => onChange('primaryTarget', e.target.value)}
            className={cn(errors.primaryTarget && 'border-red-500 focus-visible:ring-red-500')}
          />
          {errors.primaryTarget && (
            <p className="text-xs text-red-500">{errors.primaryTarget}</p>
          )}
          {/* AI Suggestion chips — clients */}
          {suggestions.clients.length > 0 && (
            <div className="mt-1">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                <Sparkles className="h-3 w-3 text-primary" />
                Suggestions IA
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.clients.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11px] text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => applySuggestion('primaryTarget', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Qui sont vos principaux clients ?</p>
        </div>

        {/* Client cible secondaire */}
        <div className="space-y-2">
          <Label htmlFor="secondaryTarget" className="text-sm font-medium">
            Client cible secondaire
            <span className="text-xs text-muted-foreground ml-1">(optionnel)</span>
          </Label>
          <Input
            id="secondaryTarget"
            placeholder="Ex: Particuliers passionnés de tech"
            value={data.secondaryTarget}
            onChange={(e) => onChange('secondaryTarget', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Un second segment de clientèle éventuel</p>
        </div>
      </div>

      {/* Problème résolu */}
      <div className="space-y-2">
        <Label htmlFor="problemSolved" className="text-sm font-medium">
          Problème résolu <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="problemSolved"
          placeholder="Quelle problématique ou quel besoin votre projet adresse-t-il ?"
          rows={3}
          value={data.problemSolved}
          onChange={(e) => onChange('problemSolved', e.target.value)}
          className={cn(errors.problemSolved && 'border-red-500 focus-visible:ring-red-500', 'resize-none')}
        />
        {errors.problemSolved && (
          <p className="text-xs text-red-500">{errors.problemSolved}</p>
        )}
        {/* AI Suggestion chips — problems */}
        {suggestions.problems.length > 0 && (
          <div className="mt-1">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Suggestions IA
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.problems.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11px] text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => applySuggestion('problemSolved', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Avantage concurrentiel */}
      <div className="space-y-2">
        <Label htmlFor="competitiveAdvantage" className="text-sm font-medium">
          Avantage concurrentiel
          <span className="text-xs text-muted-foreground ml-1">(optionnel)</span>
        </Label>
        <Textarea
          id="competitiveAdvantage"
          placeholder="Qu'est-ce qui différencie votre projet de la concurrence ?"
          rows={3}
          value={data.competitiveAdvantage}
          onChange={(e) => onChange('competitiveAdvantage', e.target.value)}
          className="resize-none"
        />
        {/* AI Suggestion chips — advantages */}
        {suggestions.advantages.length > 0 && (
          <div className="mt-1">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Suggestions IA
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.advantages.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11px] text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => applySuggestion('competitiveAdvantage', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Taille du marché */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Taille du marché estimée</Label>
        <Select value={data.marketSize} onValueChange={(v) => onChange('marketSize', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez la portée" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[250]">
            {MARKET_SIZES.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ─── Step 3: Modèle Économique ────────────────

function StepEconomie({ data, onChange }: {
  data: ProjectFormData
  errors: StepErrors
  onChange: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void
}) {
  const toggleRevenueSource = (source: string) => {
    const updated = data.revenueSources.includes(source)
      ? data.revenueSources.filter((s) => s !== source)
      : [...data.revenueSources, source]
    onChange('revenueSources', updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Modèle Économique
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Structurez vos sources de revenus et vos prévisions financières.
        </p>
      </div>

      <Separator />

      {/* Sources de revenus */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Sources de revenus</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {REVENUE_SOURCES.map((source) => (
            <label
              key={source}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all',
                data.revenueSources.includes(source)
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50',
              )}
            >
              <Checkbox
                checked={data.revenueSources.includes(source)}
                onCheckedChange={() => toggleRevenueSource(source)}
              />
              <span className="text-sm">{source}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Revenus estimés */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Revenus estimés</Label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Année 1', field: 'revenueYear1' as const },
            { label: 'Année 2', field: 'revenueYear2' as const },
            { label: 'Année 3', field: 'revenueYear3' as const },
          ].map(({ label, field }) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field} className="text-xs text-muted-foreground">
                {label} (€)
              </Label>
              <div className="relative">
                <Input
                  id={field}
                  type="number"
                  placeholder="0"
                  value={data[field]}
                  onChange={(e) => onChange(field, e.target.value)}
                  className="pl-7"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  €
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Investissement initial */}
      <div className="space-y-2">
        <Label htmlFor="initialInvestment" className="text-sm font-medium">
          Investissement initial estimé (€)
        </Label>
        <div className="relative max-w-sm">
          <Input
            id="initialInvestment"
            type="number"
            placeholder="0"
            value={data.initialInvestment}
            onChange={(e) => onChange('initialInvestment', e.target.value)}
            className="pl-7"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            €
          </span>
        </div>
      </div>

      {/* Besoin en financement */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Besoin en financement</Label>
        <Select value={data.financingNeed} onValueChange={(v) => onChange('financingNeed', v)}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Sélectionnez une tranche" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[250]">
            {FINANCING_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ─── Step 4: Équipe & Motivation ──────────────

function StepEquipe({ data, errors, onChange }: {
  data: ProjectFormData
  errors: StepErrors
  onChange: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void
}) {
  const toggleCompetency = (comp: string) => {
    const updated = data.keyCompetencies.includes(comp)
      ? data.keyCompetencies.filter((c) => c !== comp)
      : [...data.keyCompetencies, comp]
    onChange('keyCompetencies', updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Équipe &amp; Motivation
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Décrivez votre équipe et ce qui vous motive dans cette aventure.
        </p>
      </div>

      <Separator />

      {/* Type de création */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Type de création <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={data.teamType}
          onValueChange={(v) => {
            onChange('teamType', v)
            if (v !== 'Équipe') onChange('associateCount', '')
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {['Individuelle', 'En équipe'].map((type) => (
            <label
              key={type}
              htmlFor={`team-${type}`}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all',
                data.teamType === type
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50',
                errors.teamType && !data.teamType && 'border-red-300',
              )}
            >
              <RadioGroupItem value={type} id={`team-${type}`} />
              <div className="flex items-center gap-2">
                {type === 'Individuelle' ? (
                  <Rocket className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Users className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{type === 'Individuelle' ? 'Création individuelle' : 'Création en équipe'}</span>
              </div>
            </label>
          ))}
        </RadioGroup>
        {errors.teamType && (
          <p className="text-xs text-red-500">{errors.teamType}</p>
        )}
      </div>

      {/* Nombre d'associés */}
      <AnimatePresence>
        {data.teamType === 'En équipe' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-2 overflow-hidden"
          >
            <Label htmlFor="associateCount" className="text-sm font-medium">
              Nombre d&apos;associés
            </Label>
            <Input
              id="associateCount"
              type="number"
              min={1}
              max={20}
              placeholder="Ex: 2"
              value={data.associateCount}
              onChange={(e) => onChange('associateCount', e.target.value)}
              className="max-w-[200px]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Motivation principale */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Motivation principale <span className="text-red-500">*</span>
        </Label>
        <Select value={data.motivation} onValueChange={(v) => onChange('motivation', v)}>
          <SelectTrigger className={cn(errors.motivation && 'border-red-500 focus:ring-red-500')}>
            <SelectValue placeholder="Sélectionnez votre motivation" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[250]">
            {MOTIVATIONS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.motivation && (
          <p className="text-xs text-red-500">{errors.motivation}</p>
        )}
      </div>

      {/* Compétences clés */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Compétences clés</Label>
        <p className="text-xs text-muted-foreground">Sélectionnez les compétences que vous ou votre équipe possédez</p>
        <div className="flex flex-wrap gap-2">
          {COMPETENCIES.map((comp) => (
            <button
              key={comp}
              type="button"
              onClick={() => toggleCompetency(comp)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                data.keyCompetencies.includes(comp)
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50',
              )}
            >
              {data.keyCompetencies.includes(comp) && <CheckCircle2 className="h-3.5 w-3.5" />}
              {comp}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 5: Résumé & Validation ──────────────

function StepResume({ data, score, onGoToStep }: {
  data: ProjectFormData
  score: number
  onGoToStep: (step: number) => void
}) {
  const summarySections = [
    {
      step: 1,
      title: 'Identité du Projet',
      icon: Briefcase,
      fields: [
        { label: 'Nom du projet', value: data.projectTitle || 'Non renseigné' },
        { label: 'Secteur d\'activité', value: getSectorLabel(data.projectSector) },
        { label: 'Stade actuel', value: getStageLabel(data.projectStage) },
        { label: 'Description', value: data.projectDescription || 'Non renseignée', className: 'col-span-full' },
      ],
    },
    {
      step: 2,
      title: 'Marché & Clientèle',
      icon: Target,
      fields: [
        { label: 'Client cible principal', value: data.primaryTarget || 'Non renseigné' },
        { label: 'Client cible secondaire', value: data.secondaryTarget || 'Aucun' },
        { label: 'Problème résolu', value: data.problemSolved || 'Non renseigné', className: 'col-span-full' },
        { label: 'Avantage concurrentiel', value: data.competitiveAdvantage || 'Non renseigné', className: 'col-span-full' },
        { label: 'Taille du marché', value: data.marketSize || 'Non définie' },
      ],
    },
    {
      step: 3,
      title: 'Modèle Économique',
      icon: DollarSign,
      fields: [
        { label: 'Sources de revenus', value: data.revenueSources.length > 0 ? data.revenueSources.join(', ') : 'Aucune', className: 'col-span-full' },
        { label: 'Revenus Année 1', value: formatCurrency(data.revenueYear1) },
        { label: 'Revenus Année 2', value: formatCurrency(data.revenueYear2) },
        { label: 'Revenus Année 3', value: formatCurrency(data.revenueYear3) },
        { label: 'Investissement initial', value: formatCurrency(data.initialInvestment) },
        { label: 'Besoin en financement', value: data.financingNeed || 'Non défini' },
      ],
    },
    {
      step: 4,
      title: 'Équipe & Motivation',
      icon: Users,
      fields: [
        { label: 'Type de création', value: data.teamType ? (data.teamType === 'Individuelle' ? 'Création individuelle' : 'Création en équipe') : 'Non renseigné' },
        { label: 'Nombre d\'associés', value: data.teamType === 'En équipe' ? (data.associateCount || 'Non renseigné') : '—' },
        { label: 'Motivation principale', value: data.motivation || 'Non renseignée' },
        { label: 'Compétences clés', value: data.keyCompetencies.length > 0 ? data.keyCompetencies.join(', ') : 'Aucune', className: 'col-span-full' },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Résumé du Projet
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Vérifiez les informations avant de sauvegarder votre projet.
        </p>
      </div>

      <Separator />

      {/* Maturity Score */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score circle */}
            <div className="relative flex items-center justify-center">
              <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Complétude du projet : ${score}%`}>
                <title>Complétude : {score}%</title>
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/50"
                />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 326.7} 326.7`}
                  transform="rotate(-90 60 60)"
                  className={cn(
                    score < 30 ? 'text-red-500' : score < 70 ? 'text-amber-500' : 'text-green-600 dark:text-green-500'
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-3xl font-bold tabular-nums', getScoreColor(score))}>
                  {score}%
                </span>
                <span className="text-xs text-muted-foreground">complétude</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <h4 className="text-lg font-semibold text-foreground">
                Score de maturité du projet
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn(
                    'text-sm font-medium',
                    score < 30
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : score < 70
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  )}
                >
                  {getScoreLabel(score)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {score < 30
                  ? 'Votre projet est à ses débuts. Continuez à le préciser en remplissant les étapes précédentes.'
                  : score < 70
                    ? 'Votre projet prend forme ! Complétez les sections manquantes pour améliorer votre score.'
                    : 'Votre projet est bien défini. Vous êtes prêt pour les prochaines étapes !'}
              </p>
              <Progress value={score} className={cn('h-2 mt-2', getScoreProgressColor(score))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary sections */}
      <div className="space-y-4">
        {summarySections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.step} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {section.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onGoToStep(section.step)}
                    className="text-primary hover:text-primary/80 hover:bg-primary/5"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Modifier
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {section.fields.map((field) => (
                    <div key={field.label} className={cn('space-y-0.5', field.className)}>
                      <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                      <p className={cn(
                        'text-sm',
                        field.value === 'Non renseigné' || field.value === 'Non renseignée' || field.value === 'Non défini' || field.value === 'Non définie' || field.value === 'Aucune' || field.value === 'Aucun'
                          ? 'text-muted-foreground italic'
                          : 'text-foreground',
                      )}>
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────

export function MonProjet() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProjectFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<StepErrors>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [isLoaded, setIsLoaded] = useState(false)

  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)

  const maturityScore = useMemo(() => calculateMaturityScore(formData), [formData])

  // Load from localStorage or API on mount
  useEffect(() => {
    const saved = loadFromStorage()
    if (saved) {
      setFormData(saved)
    } else {
      // Try loading from API
      fetchProjectData()
    }
    setIsLoaded(true)
  }, [])

  const fetchProjectData = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/projet', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          const d = json.data
          const loaded: ProjectFormData = {
            projectTitle: d.projectTitle || '',
            projectSector: d.projectSector || '',
            projectDescription: d.projectDescription || '',
            projectStage: d.projectStage || '',
            primaryTarget: d.targetAudience || '',
            secondaryTarget: d.extraData?.secondaryTarget || '',
            problemSolved: d.valueProposition || '',
            competitiveAdvantage: d.extraData?.competitiveAdvantage || '',
            marketSize: d.extraData?.marketSize || '',
            revenueSources: d.extraData?.revenueSources || [],
            revenueYear1: d.extraData?.revenueYear1 || '',
            revenueYear2: d.extraData?.revenueYear2 || '',
            revenueYear3: d.extraData?.revenueYear3 || '',
            initialInvestment: d.estimatedInvestment || '',
            financingNeed: d.extraData?.financingNeed || '',
            teamType: d.extraData?.teamType || '',
            associateCount: d.extraData?.associateCount || '',
            motivation: d.creationMotivation || '',
            keyCompetencies: d.extraData?.keyCompetencies || [],
          }
          setFormData(loaded)
        }
      }
    } catch {
      // Silently fail — user can fill the form manually
    }
  }

  // Auto-save to localStorage on form change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(formData)
    }
  }, [formData, isLoaded])

  const handleChange = useCallback(<K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error on change
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const goToStep = useCallback((step: number) => {
    // Allow navigating to completed steps, previous steps, or next step only if current is validated
    if (step > currentStep) {
      // Validate current step first
      const stepErrors = validateStep(currentStep, formData)
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors)
        toast.error('Veuillez corriger les erreurs avant de continuer')
        return
      }
      setCompletedSteps((prev) => new Set([...prev, currentStep]))
    }

    setDirection(step > currentStep ? 'forward' : 'backward')
    setCurrentStep(step)
    setErrors({})
  }, [currentStep, formData])

  const goNext = useCallback(() => {
    const stepErrors = validateStep(currentStep, formData)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      toast.error('Veuillez corriger les erreurs avant de continuer')
      return
    }
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    setDirection('forward')
    setCurrentStep((prev) => Math.min(prev + 1, 5))
    setErrors({})
  }, [currentStep, formData])

  const goPrev = useCallback(() => {
    setDirection('backward')
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    setErrors({})
  }, [])

  const handleSave = useCallback(async () => {
    if (!token) {
      toast.error('Vous devez être connecté(e)', { description: 'Session non trouvée. Reconnectez-vous.' })
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        projectTitle: formData.projectTitle,
        projectSector: formData.projectSector,
        projectDescription: formData.projectDescription,
        projectStage: formData.projectStage,
        targetAudience: formData.primaryTarget,
        valueProposition: formData.problemSolved,
        estimatedInvestment: formData.initialInvestment,
        creationMotivation: formData.motivation,
        progressPercent: maturityScore,
        extraData: {
          secondaryTarget: formData.secondaryTarget,
          competitiveAdvantage: formData.competitiveAdvantage,
          marketSize: formData.marketSize,
          revenueSources: formData.revenueSources,
          revenueYear1: formData.revenueYear1,
          revenueYear2: formData.revenueYear2,
          revenueYear3: formData.revenueYear3,
          financingNeed: formData.financingNeed,
          teamType: formData.teamType,
          associateCount: formData.associateCount,
          keyCompetencies: formData.keyCompetencies,
        },
      }

      const res = await fetch('/api/projet', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          clearStorage()
          // Mark all steps as completed
          setCompletedSteps(new Set([1, 2, 3, 4, 5]))
          toast.success('Projet sauvegardé avec succès !', {
            description: 'Vos informations ont été enregistrées.',
          })
        } else {
          toast.error('Erreur lors de la sauvegarde', {
            description: json.error?.message || 'Veuillez réessayer.',
          })
        }
      } else if (res.status === 401) {
        toast.error('Vous devez être connecté(e) pour sauvegarder', {
          description: 'Votre session a expiré. Veuillez vous reconnecter.',
        })
      } else {
        const text = await res.text().catch(() => '')
        console.error('[MonProjet Save] Error:', res.status, text)
        let json = null
        try { json = JSON.parse(text) } catch {}
        toast.error('Erreur serveur', {
          description: json?.error?.message || `Erreur ${res.status}. Veuillez réessayer.`,
        })
      }
    } catch {
      toast.error('Erreur réseau', {
        description: 'Vérifiez votre connexion et réessayez.',
      })
    } finally {
      setIsSaving(false)
    }
  }, [formData, token, maturityScore])

  // Slide variants for framer-motion
  const slideVariants = {
    enter: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? 60 : -60,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? -60 : 60,
      opacity: 0,
    }),
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepIdentite data={formData} errors={errors} onChange={handleChange} />
      case 2:
        return <StepMarche data={formData} errors={errors} onChange={handleChange} />
      case 3:
        return <StepEconomie data={formData} errors={errors} onChange={handleChange} />
      case 4:
        return <StepEquipe data={formData} errors={errors} onChange={handleChange} />
      case 5:
        return <StepResume data={formData} score={maturityScore} onGoToStep={goToStep} />
      default:
        return null
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 lg:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-amber-500" />
            Mon Projet
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Décrivez votre projet de création d&apos;entreprise étape par étape.
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="w-fit">
              <Heart className="h-3 w-3 mr-1 text-coral-500" />
              {user.firstName || user.email}
            </Badge>
            <AudioControls
              readText={`Mon projet, étape ${currentStep} sur 5: ${STEPS[currentStep - 1]?.label || ''}. ${currentStep === 1 ? 'Identité du projet. ' : currentStep === 2 ? 'Marché et clientèle. ' : currentStep === 3 ? 'Modèle économique. ' : currentStep === 4 ? 'Équipe et motivation. ' : 'Résumé du projet. '}${formData.projectTitle ? 'Projet: ' + formData.projectTitle + '.' : ''}`}
              compact
            />
          </div>
        )}
      </div>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={goToStep}
      />

      {/* Step Content */}
      <Card>
        <CardContent className="p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStep === 1}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </Button>

        <div className="text-sm text-muted-foreground">
          Étape {currentStep} sur {STEPS.length}
        </div>

        {currentStep < 5 ? (
          <Button onClick={goNext} className="gap-1.5">
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1.5 gradient-teal hover:opacity-90"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Sauvegarder le projet
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  )
}
