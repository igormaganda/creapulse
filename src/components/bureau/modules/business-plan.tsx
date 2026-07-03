'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  FileText,
  Save,
  Eye,
  Download,
  Sparkles,
  Check,
  Circle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  Building2,
  Users,
  Target,
  TrendingUp,
  Calculator,
  BarChart3,
  Shield,
  MapPin,
  CalendarDays,
  Briefcase,
  Lightbulb,
  ArrowUpRight,
  Package,
  UserCheck,
  Crown,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BusinessPlanPdf } from '@/components/bureau/export/business-plan-pdf'

// ─── Section Definitions ─────────────────────

type SectionType = 'textarea' | 'swot' | 'financing-table' | 'result-table' | 'treasury-table' | 'investments-list' | 'bilan-table' | 'select' | 'timeline' | 'products-list' | 'associates-list' | 'cogerants-list'

interface SectionDef {
  id: string
  title: string
  description: string
  type: SectionType
  hasAiSuggestion: boolean
  icon: React.ElementType
  color: string
}

const PRESENTATION_SECTIONS: SectionDef[] = [
  { id: 'resume', title: 'Résumé opérationnel', description: 'Synthèse de votre projet et de ses perspectives', type: 'textarea', hasAiSuggestion: true, icon: FileText, color: 'text-[#00838F] bg-[#00838F]/10' },
  { id: 'equipe', title: "Présentation de l'équipe", description: 'Les membres clés et leurs compétences', type: 'textarea', hasAiSuggestion: true, icon: Users, color: 'text-[#FF6B35] bg-[#FF6B35]/10' },
  { id: 'historique', title: 'Historique et contexte', description: "L'origine du projet et son évolution", type: 'textarea', hasAiSuggestion: true, icon: Briefcase, color: 'text-[#FFB74D] bg-[#FFB74D]/10' },
  { id: 'vision', title: 'Vision et mission', description: 'Votre vision à long terme et votre mission', type: 'textarea', hasAiSuggestion: true, icon: Lightbulb, color: 'text-purple-600 bg-purple-600/10' },
  { id: 'valeurs', title: 'Valeurs et engagements', description: 'Les valeurs fondamentales de votre entreprise', type: 'textarea', hasAiSuggestion: true, icon: Shield, color: 'text-green-600 bg-green-600/10' },
]

const MARCHE_SECTIONS: SectionDef[] = [
  { id: 'etude-marche', title: 'Étude de marché', description: 'Analyse du marché global et des tendances', type: 'textarea', hasAiSuggestion: true, icon: TrendingUp, color: 'text-[#00838F] bg-[#00838F]/10' },
  { id: 'segmentation', title: 'Segmentation client', description: 'Identification et profil de vos segments de clientèle', type: 'textarea', hasAiSuggestion: true, icon: Users, color: 'text-[#FF6B35] bg-[#FF6B35]/10' },
  { id: 'concurrence', title: 'Analyse concurrentielle', description: "Étude de vos concurrents et positionnement", type: 'textarea', hasAiSuggestion: true, icon: BarChart3, color: 'text-[#FFB74D] bg-[#FFB74D]/10' },
  { id: 'strategie-marketing', title: 'Stratégie marketing', description: 'Votre approche marketing et communication', type: 'textarea', hasAiSuggestion: true, icon: Target, color: 'text-purple-600 bg-purple-600/10' },
  { id: 'plan-commercial', title: 'Plan commercial', description: 'Votre stratégie de vente et de distribution', type: 'textarea', hasAiSuggestion: true, icon: ArrowUpRight, color: 'text-green-600 bg-green-600/10' },
  { id: 'swot', title: 'Analyse SWOT', description: 'Forces, faiblesses, opportunités, menaces', type: 'swot', hasAiSuggestion: true, icon: Shield, color: 'text-[#00838F] bg-[#00838F]/10' },
]

const FINANCES_SECTIONS: SectionDef[] = [
  { id: 'financement', title: 'Plan de financement initial', description: "Sources et montants de financement de lancement", type: 'financing-table', hasAiSuggestion: false, icon: Calculator, color: 'text-[#00838F] bg-[#00838F]/10' },
  { id: 'compte-resultat', title: 'Compte de résultat prévisionnel', description: "Prévisions sur 3 ans (CA, charges, résultat)", type: 'result-table', hasAiSuggestion: false, icon: BarChart3, color: 'text-[#FF6B35] bg-[#FF6B35]/10' },
  { id: 'tresorerie', title: 'Plan de trésorerie', description: "Suivi mensuel des encaissements et décaissements", type: 'treasury-table', hasAiSuggestion: false, icon: TrendingUp, color: 'text-[#FFB74D] bg-[#FFB74D]/10' },
  { id: 'seuil-rentabilite', title: 'Seuil de rentabilité', description: 'Calcul automatique du point mort', type: 'textarea', hasAiSuggestion: false, icon: Target, color: 'text-green-600 bg-green-600/10' },
  { id: 'investissements', title: 'Investissements', description: "Liste des investissements prévus", type: 'investments-list', hasAiSuggestion: false, icon: Building2, color: 'text-purple-600 bg-purple-600/10' },
  { id: 'bilan', title: 'Bilan prévisionnel', description: 'Vue simplifiée du bilan prévisionnel', type: 'bilan-table', hasAiSuggestion: false, icon: Calculator, color: 'text-[#00838F] bg-[#00838F]/10' },
]

const OPERATIONS_SECTIONS: SectionDef[] = [
  { id: 'statut-juridique', title: 'Statut juridique', description: 'Forme juridique adaptée à votre projet', type: 'select', hasAiSuggestion: false, icon: Shield, color: 'text-[#00838F] bg-[#00838F]/10' },
  { id: 'localisation', title: 'Localisation et implantation', description: "Choix du lieu et justification stratégique", type: 'textarea', hasAiSuggestion: true, icon: MapPin, color: 'text-[#FF6B35] bg-[#FF6B35]/10' },
  { id: 'organisation', title: 'Organisation et moyens humains', description: "Structure organisationnelle et effectifs", type: 'textarea', hasAiSuggestion: true, icon: Users, color: 'text-[#FFB74D] bg-[#FFB74D]/10' },
  { id: 'production', title: 'Catalogue produits / services', description: 'Produits et services proposés avec prix, quantités et marges', type: 'products-list', hasAiSuggestion: false, icon: Package, color: 'text-purple-600 bg-purple-600/10' },
  { id: 'associes', title: 'Associés et répartition du capital', description: 'Nombre de parts, capital apporté et répartition', type: 'associates-list', hasAiSuggestion: false, icon: Crown, color: 'text-[#00838F] bg-[#00838F]/10' },
  { id: 'cogerants', title: 'Co-gérance', description: 'Co-gérants et répartition des responsabilités', type: 'cogerants-list', hasAiSuggestion: false, icon: UserCheck, color: 'text-[#FF6B35] bg-[#FF6B35]/10' },
  { id: 'calendrier', title: 'Calendrier de réalisation', description: 'Jalons clés et planning de lancement', type: 'timeline', hasAiSuggestion: false, icon: CalendarDays, color: 'text-green-600 bg-green-600/10' },
]

const ALL_SECTIONS = [...PRESENTATION_SECTIONS, ...MARCHE_SECTIONS, ...FINANCES_SECTIONS, ...OPERATIONS_SECTIONS]

const TAB_GROUPS: { id: string; label: string; icon: React.ElementType; sections: SectionDef[] }[] = [
  { id: 'presentation', label: 'Présentation', icon: FileText, sections: PRESENTATION_SECTIONS },
  { id: 'marche', label: 'Marché', icon: TrendingUp, sections: MARCHE_SECTIONS },
  { id: 'finances', label: 'Finances', icon: Calculator, sections: FINANCES_SECTIONS },
  { id: 'operations', label: 'Opérations', icon: Building2, sections: OPERATIONS_SECTIONS },
]

const STATUT_JURIDIQUE_OPTIONS = [
  { value: 'auto-entrepreneur', label: 'Auto-entrepreneur (Micro-entreprise)' },
  { value: 'eurl', label: 'EURL (Entreprise Unipersonnelle à Responsabilité Limitée)' },
  { value: 'sas', label: 'SAS (Société par Actions Simplifiée)' },
  { value: 'sasu', label: 'SASU (SAS Unipersonnelle)' },
  { value: 'sarl', label: 'SARL (Société à Responsabilité Limitée)' },
  { value: 'sa', label: 'SA (Société Anonyme)' },
  { value: 'sei', label: 'SEI (Société d\'Exercice Libéral à Responsabilité Limitée)' },
  { value: 'snc', label: 'SNC (Société en Nom Collectif)' },
  { value: 'association', label: 'Association loi 1901' },
  { value: 'autre', label: 'Autre' },
]

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

// ─── Types ──────────────────────────────────

interface SwotData {
  strengths: string
  weaknesses: string
  opportunities: string
  threats: string
}

interface FinancingRow {
  id: string
  source: string
  montant: number
}

interface TreasuryMonth {
  month: string
  encaissements: number
  decaissements: number
  solde: number
}

interface Investment {
  id: string
  name: string
  amount: number
}

interface Milestone {
  id: string
  title: string
  date: string
  completed: boolean
}

interface BpProduct {
  id: string
  nom: string
  description: string
  prixVente: number
  coutUnitaire: number
  quantiteMensuelle: number
  marge: number
}

interface Associate {
  id: string
  nom: string
  prenom: string
  role: string
  nombreParts: number
  pourcentage: number
  apportCapital: number
}

interface Cogerant {
  id: string
  nom: string
  prenom: string
  fonction: string
  email: string
  telephone: string
}

interface BpSections {
  [key: string]: unknown
}

// ─── Default data ───────────────────────────

function genId(): string {
  return Math.random().toString(36).slice(2, 9)
}

const DEFAULT_SECTIONS: BpSections = {
  resume: '',
  equipe: '',
  historique: '',
  vision: '',
  valeurs: '',
  'etude-marche': '',
  segmentation: '',
  concurrence: '',
  'strategie-marketing': '',
  'plan-commercial': '',
  swot: { strengths: '', weaknesses: '', opportunities: '', threats: '' },
  financement: [],
  'compte-resultat': {
    year1: { ca: 0, charges: 0, resultat: 0 },
    year2: { ca: 0, charges: 0, resultat: 0 },
    year3: { ca: 0, charges: 0, resultat: 0 },
  },
  tresorerie: [],
  'seuil-rentabilite': '',
  investissements: [],
  bilan: {
    actif: { immobilisations: 0, stocks: 0, creances: 0, tresorerie: 0 },
    passif: { capital: 0, emprunts: 0, fournisseurs: 0, autresDettes: 0 },
  },
  'statut-juridique': '',
  localisation: '',
  organisation: '',
  production: [],
  associes: [],
  cogerants: [],
  calendrier: [],
}

// ─── Helpers ────────────────────────────────

function isSectionFilled(key: string, value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return Object.values(obj).some(
      (v) => typeof v === 'string' && v.trim().length > 0 || typeof v === 'number' && v !== 0,
    )
  }
  return false
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── Main Component ─────────────────────────

interface PipelineStatus {
  parcours: boolean
  marche: boolean
  financier: boolean
  juridique: boolean
  creasim: boolean
}

const DEFAULT_PIPELINE: PipelineStatus = {
  parcours: false,
  marche: false,
  financier: false,
  juridique: false,
  creasim: false,
}

export function BusinessPlanModule() {
  const [sections, setSections] = useState<BpSections>(DEFAULT_SECTIONS)
  const [activeTab, setActiveTab] = useState('presentation')
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingParcours, setIsGeneratingParcours] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [exportPdfOpen, setExportPdfOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [projectContext, setProjectContext] = useState<Record<string, string | null> | null>(null)
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>(DEFAULT_PIPELINE)


  // ─── Load data on mount ──────────────────
  useEffect(() => {
    async function load() {
      // Try localStorage first
      const saved = localStorage.getItem('creapulse-bp')
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as BpSections
          setSections(parsed)
        } catch { /* ignore */ }
      }

      // Then try API
      try {
        const res = await fetch('/api/business-plan')
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data?.sections) {
            const apiSections = json.data.sections as BpSections
            // Merge with defaults for any missing keys
            const merged = { ...DEFAULT_SECTIONS, ...apiSections }
            setSections(merged)
            localStorage.setItem('creapulse-bp', JSON.stringify(merged))
          }
          if (json.data?.projectContext) {
            setProjectContext(json.data.projectContext)
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
      localStorage.setItem('creapulse-bp', JSON.stringify(sections))
    }
  }, [sections, isLoading])

  // ─── Completion tracking ────────────────
  const completionInfo = useMemo(() => {
    let filled = 0
    ALL_SECTIONS.forEach((s) => {
      if (isSectionFilled(s.id, sections[s.id])) filled++
    })
    return { filled, total: ALL_SECTIONS.length, percent: Math.round((filled / ALL_SECTIONS.length) * 100) }
  }, [sections])

  // ─── Update section helper ──────────────
  const updateSection = useCallback((key: string, value: unknown) => {
    setSections((prev) => ({ ...prev, [key]: value }))
  }, [])

  // ─── Save to API ────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/business-plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Business plan sauvegardé — ${completionInfo.filled}/${completionInfo.total} sections remplies (${completionInfo.percent}%)`)
      } else {
        toast.error(json.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }, [sections, completionInfo])

  // ─── AI Suggestion ──────────────────────
  const handleAiSuggest = useCallback(async (sectionDef: SectionDef) => {
    setAiLoading(sectionDef.id)
    try {
      const contextStr = projectContext
        ? `${projectContext.projectTitle || ''} ${projectContext.projectSector || ''} ${projectContext.targetAudience || ''}`
        : ''

      const res = await fetch('/api/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai-suggest',
          sectionId: sectionDef.id,
          sectionTitle: sectionDef.title,
          existingContent: typeof sections[sectionDef.id] === 'string' ? (sections[sectionDef.id] as string) : undefined,
          projectContext: contextStr || undefined,
        }),
      })

      const json = await res.json()
      if (json.success && json.data?.suggestion) {
        if (sectionDef.type === 'swot') {
          updateSection(sectionDef.id, {
            ...(sections[sectionDef.id] as SwotData || { strengths: '', weaknesses: '', opportunities: '', threats: '' }),
            strengths: json.data.suggestion,
          })
        } else {
          updateSection(sectionDef.id, json.data.suggestion)
        }
        toast.success('Suggestion IA appliquée ! Modifiez le contenu si nécessaire.')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la génération IA')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setAiLoading(null)
    }
  }, [sections, projectContext, updateSection])

  // ─── Generate from Parcours ─────────────
  const handleGenerateFromParcours = useCallback(async () => {
    setIsGeneratingParcours(true)
    try {
      const res = await fetch('/api/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-from-parcours' }),
      })
      const json = await res.json()
      if (json.success && json.data?.sections) {
        setSections(prev => {
          const merged = { ...DEFAULT_SECTIONS, ...prev, ...json.data.sections }
          localStorage.setItem('creapulse-bp', JSON.stringify(merged))
          return merged
        })
        setPipelineStatus(prev => ({ ...prev, parcours: true }))
        toast.success('Business Plan généré depuis votre parcours entrepreneurial')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la génération depuis le parcours')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsGeneratingParcours(false)
    }
  }, [])

  // ─── Sync Simulators ─────────────────────
  const handleSyncSimulators = useCallback(async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-simulators' }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        if (json.data.sections) {
          setSections(prev => {
            const merged = { ...DEFAULT_SECTIONS, ...prev, ...json.data.sections }
            localStorage.setItem('creapulse-bp', JSON.stringify(merged))
            return merged
          })
        }
        if (json.data.syncedSources) {
          setPipelineStatus(prev => ({
            ...prev,
            ...(json.data.syncedSources.marche && { marche: true }),
            ...(json.data.syncedSources.financier && { financier: true }),
            ...(json.data.syncedSources.juridique && { juridique: true }),
            ...(json.data.syncedSources.creasim && { creasim: true }),
          }))
        }
        const summary = json.data.summary || 'Données synchronisées'
        toast.success(`Simulateurs synchronisés — ${summary}`)
      } else {
        toast.error(json.error?.message || 'Erreur lors de la synchronisation')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsSyncing(false)
    }
  }, [])

  // ─── Export PDF ──────────────────────────
  const handleExportPdf = useCallback(() => {
    setExportPdfOpen(true)
  }, [])

  // ─── Section finder ─────────────────────
  const findSectionDef = useCallback((id: string): SectionDef | undefined => {
    return ALL_SECTIONS.find((s) => s.id === id)
  }, [])

  // ─── Set first section on tab change ────
  useEffect(() => {
    const group = TAB_GROUPS.find((g) => g.id === activeTab)
    if (group && !activeSection) {
      setActiveSection(group.sections[0]?.id || null)
    }
    // Ensure activeSection is within the tab
    if (activeSection) {
      const group2 = TAB_GROUPS.find((g) => g.id === activeTab)
      if (group2 && !group2.sections.some((s) => s.id === activeSection)) {
        setActiveSection(group2.sections[0]?.id || null)
      }
    }
  }, [activeTab, activeSection])

  // ─── Loading skeleton ───────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // ─── Render section content ─────────────
  const renderSectionContent = (sectionDef: SectionDef) => {
    const val = sections[sectionDef.id]

    switch (sectionDef.type) {
      case 'textarea':
        return (
          <div className="space-y-3">
            {sectionDef.hasAiSuggestion && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-[#FFB74D]/40 text-[#FFB74D] hover:bg-[#FFB74D]/10 hover:text-[#FFB74D]"
                onClick={() => handleAiSuggest(sectionDef)}
                disabled={aiLoading === sectionDef.id}
              >
                {aiLoading === sectionDef.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Aide IA
              </Button>
            )}
            <Textarea
              value={(val as string) || ''}
              onChange={(e) => updateSection(sectionDef.id, e.target.value)}
              placeholder={`Rédigez le contenu de la section "${sectionDef.title}"...`}
              className="min-h-[200px] resize-y text-sm leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {(val as string)?.length || 0} caractères
              </span>
              {(val as string)?.length > 0 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Eye className="h-3 w-3" />
                  Aperçu
                </Badge>
              )}
            </div>
            {(val as string)?.length > 0 && (
              <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-muted/30 p-4">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{val as string}</ReactMarkdown>
              </div>
            )}
          </div>
        )

      case 'swot':
        return (
          <div className="space-y-3">
            {sectionDef.hasAiSuggestion && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-[#FFB74D]/40 text-[#FFB74D] hover:bg-[#FFB74D]/10 hover:text-[#FFB74D]"
                onClick={() => handleAiSuggest(sectionDef)}
                disabled={aiLoading === sectionDef.id}
              >
                {aiLoading === sectionDef.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Aide IA
              </Button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'strengths', label: 'Forces', color: 'border-green-500/30 bg-green-50/50 dark:bg-green-900/10', icon: '💪' },
                { key: 'weaknesses', label: 'Faiblesses', color: 'border-red-500/30 bg-red-50/50 dark:bg-red-900/10', icon: '⚠️' },
                { key: 'opportunities', label: 'Opportunités', color: 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10', icon: '🚀' },
                { key: 'threats', label: 'Menaces', color: 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10', icon: '🛡️' },
              ].map((q) => (
                <div key={q.key} className={cn('rounded-lg border p-3', q.color)}>
                  <Label className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                    <span>{q.icon}</span> {q.label}
                  </Label>
                  <Textarea
                    value={((val as SwotData)?.[q.key as keyof SwotData]) || ''}
                    onChange={(e) =>
                      updateSection(sectionDef.id, {
                        ...(val as SwotData || { strengths: '', weaknesses: '', opportunities: '', threats: '' }),
                        [q.key]: e.target.value,
                      })
                    }
                    placeholder={`Listez vos ${q.label.toLowerCase()}...`}
                    className="min-h-[100px] text-sm bg-background/60"
                  />
                </div>
              ))}
            </div>
          </div>
        )

      case 'financing-table':
        return <FinancingTable value={val as FinancingRow[] || []} onChange={(v) => updateSection(sectionDef.id, v)} />

      case 'result-table':
        return <ResultTable value={val as Record<string, Record<string, number>> || {}} onChange={(v) => updateSection(sectionDef.id, v)} />

      case 'treasury-table':
        return <TreasuryTable value={val as TreasuryMonth[] || []} onChange={(v) => updateSection(sectionDef.id, v)} />

      case 'investments-list':
        return <InvestmentsList value={val as Investment[] || []} onChange={(v) => updateSection(sectionDef.id, v)} />

      case 'bilan-table':
        return <BilanTable value={val as Record<string, Record<string, number>> || {}} onChange={(v) => updateSection(sectionDef.id, v)} />

      case 'select':
        return (
          <div className="space-y-3">
            <Select
              value={(val as string) || ''}
              onValueChange={(v) => updateSection(sectionDef.id, v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez votre statut juridique..." />
              </SelectTrigger>
              <SelectContent>
                {STATUT_JURIDIQUE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(val as string) && (
              <p className="text-xs text-muted-foreground">
                Statut sélectionné : <span className="font-medium text-foreground">{STATUT_JURIDIQUE_OPTIONS.find(o => o.value === val)?.label}</span>
              </p>
            )}
          </div>
        )

      case 'timeline':
        return <TimelineView value={val as Milestone[] || []} onChange={(v) => updateSection(sectionDef.id, v)} />

      case 'products-list':
        return <ProductsList value={val as BpProduct[] || []} onChange={(v) => updateSection(sectionDef.id, v)} />

      case 'associates-list':
        return <AssociatesList value={val as Associate[] || []} onChange={(v) => updateSection(sectionDef.id, v)} />

      case 'cogerants-list':
        return <CogerantsList value={val as Cogerant[] || []} onChange={(v) => updateSection(sectionDef.id, v)} />

      default:
        return null
    }
  }

  // ─── Main Render ─────────────────────────
  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex h-full"
      >
        {/* ═══ Left Sidebar ═══ */}
        <div
          className={cn(
            'hidden lg:flex flex-col border-r bg-muted/30 transition-all duration-300 overflow-hidden',
            sidebarCollapsed ? 'w-12' : 'w-72',
          )}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-3 border-b">
            {!sidebarCollapsed && (
              <h3 className="text-sm font-semibold text-foreground truncate">Sections</h3>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Progress */}
          {!sidebarCollapsed && (
            <div className="px-3 py-2 border-b">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Progression</span>
                <span className="text-xs font-semibold text-[#00838F]">{completionInfo.filled}/{completionInfo.total}</span>
              </div>
              <Progress value={completionInfo.percent} className="h-2" />
            </div>
          )}

          {/* Section list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {TAB_GROUPS.map((group) => (
                <div key={group.id} className="mb-1">
                  {!sidebarCollapsed && (
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                  )}
                  {group.sections.map((s) => {
                    const filled = isSectionFilled(s.id, sections[s.id])
                    const isActive = activeSection === s.id
                    const Icon = s.icon
                    return (
                      <Tooltip key={s.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => { setActiveSection(s.id); setActiveTab(group.id) }}
                            className={cn(
                              'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                              sidebarCollapsed ? 'justify-center px-1' : '',
                              isActive
                                ? 'bg-[#00838F]/10 text-[#00838F] font-medium'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                          >
                            {filled ? (
                              <Check className="h-4 w-4 text-green-500 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 opacity-40" />
                            )}
                            {!sidebarCollapsed && <Icon className="h-3.5 w-3.5 shrink-0" />}
                            {!sidebarCollapsed && (
                              <span className="truncate">{s.title}</span>
                            )}
                          </button>
                        </TooltipTrigger>
                        {sidebarCollapsed && (
                          <TooltipContent side="right" className="text-xs">
                            {s.title}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ═══ Main Content Area ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Section Navigation (horizontal scroll) */}
          <div className="lg:hidden border-b bg-muted/30 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 p-2 min-w-max">
              {ALL_SECTIONS.map((s) => {
                const filled = isSectionFilled(s.id, sections[s.id])
                const isActive = activeSection === s.id
                const Icon = s.icon
                return (
                  <Button
                    key={s.id}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-1 h-8 shrink-0 text-xs',
                      isActive ? 'bg-[#00838F] text-white' : '',
                    )}
                    onClick={() => setActiveSection(s.id)}
                  >
                    {filled ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Circle className="h-3 w-3 opacity-40" />
                    )}
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{s.title}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col gap-3 p-4 md:px-6 border-b bg-background">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00838F]/10">
                  <FileText className="h-5 w-5 text-[#00838F]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Business Plan IA</h2>
                  <p className="text-xs text-muted-foreground">
                    {completionInfo.filled}/{completionInfo.total} sections complétées — {completionInfo.percent}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportPdf}>
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Exporter PDF</span>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPreviewOpen(true)}>
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Prévisualiser</span>
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-[#00838F] hover:bg-[#00838F]/90 text-white"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Sauvegarder</span>
                </Button>
              </div>
            </div>

            {/* ── AI Action Buttons ── */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="gap-1.5 bg-[#FFB74D]/20 text-[#FFB74D] hover:bg-[#FFB74D]/30 border border-[#FFB74D]/30"
                onClick={handleGenerateFromParcours}
                disabled={isGeneratingParcours}
              >
                {isGeneratingParcours ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isGeneratingParcours ? 'Génération en cours...' : 'Générer depuis Parcours'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-[#00838F]/30 text-[#00838F] hover:bg-[#00838F]/10 hover:text-[#00838F]"
                onClick={handleSyncSimulators}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5" />
                )}
                {isSyncing ? 'Synchronisation...' : 'Synchroniser les simulateurs'}
              </Button>
            </div>

            {/* ── Pipeline Status Bar ── */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Vue Pipeline :</span>
              {([
                { key: 'parcours' as const, label: 'Parcours', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                { key: 'marche' as const, label: 'Marché', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
                { key: 'financier' as const, label: 'Financier', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                { key: 'juridique' as const, label: 'Juridique', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
                { key: 'creasim' as const, label: 'CreaSim', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
              ]).map(item => (
                <Badge
                  key={item.key}
                  variant="outline"
                  className={cn(
                    'text-[10px] px-1.5 py-0 h-5 font-medium gap-0.5',
                    pipelineStatus[item.key] ? item.color : 'bg-white/5 text-neutral-500 border-white/10'
                  )}
                >
                  {pipelineStatus[item.key] ? (
                    <Check className="h-2.5 w-2.5" />
                  ) : (
                    <Circle className="h-2.5 w-2.5" />
                  )}
                  {item.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Desktop Tabs + Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 space-y-4">
              {/* Tab bar (desktop) */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-muted/80 hidden lg:flex">
                  {TAB_GROUPS.map((g) => {
                    const Icon = g.icon
                    const filled = g.sections.filter((s) => isSectionFilled(s.id, sections[s.id])).length
                    return (
                      <TabsTrigger
                        key={g.id}
                        value={g.id}
                        className="gap-1.5 data-[state=active]:bg-[#00838F] data-[state=active]:text-white"
                      >
                        <Icon className="h-4 w-4" />
                        {g.label}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                          {filled}/{g.sections.length}
                        </Badge>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {TAB_GROUPS.map((group) => (
                  <TabsContent key={group.id} value={group.id} className="mt-0 space-y-4">
                    {/* Active section content */}
                    {activeSection && renderSectionContent(findSectionDef(activeSection) as SectionDef)}

                    {/* Quick navigation to other sections in group */}
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {group.sections.map((s) => {
                        const filled = isSectionFilled(s.id, sections[s.id])
                        const isActive = activeSection === s.id
                        const Icon = s.icon
                        return (
                          <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={cn(
                              'flex items-center gap-2 rounded-lg border p-3 text-left transition-all',
                              isActive ? 'border-[#00838F]/40 bg-[#00838F]/5' : 'hover:border-muted-foreground/20',
                            )}
                          >
                            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{s.description}</p>
                            </div>
                            {filled ? (
                              <Check className="h-4 w-4 text-green-500 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>

        {/* ═══ Preview Dialog ═══ */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#00838F]" />
                Aperçu du Business Plan
              </DialogTitle>
              <DialogDescription>
                Prévisualisation de votre business plan avec {completionInfo.filled} sections remplies sur {completionInfo.total}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-8 pb-8">
                {projectContext?.projectTitle && (
                  <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground">{projectContext.projectTitle}</h1>
                    {projectContext.projectSector && (
                      <p className="mt-2 text-muted-foreground">Secteur : {projectContext.projectSector}</p>
                    )}
                  </div>
                )}
                {TAB_GROUPS.map((group) => (
                  <section key={group.id}>
                    <h2 className="text-xl font-bold text-[#00838F] border-b-2 border-[#00838F]/20 pb-2 mb-4">
                      {group.label}
                    </h2>
                    <div className="space-y-6">
                      {group.sections.map((s) => {
                        const val = sections[s.id]
                        const filled = isSectionFilled(s.id, val)
                        if (!filled) return null
                        return (
                          <div key={s.id}>
                            <h3 className="text-base font-semibold text-foreground mb-2">{s.title}</h3>
                            {s.type === 'textarea' && typeof val === 'string' && (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{val}</ReactMarkdown>
                              </div>
                            )}
                            {s.type === 'swot' && val && typeof val === 'object' ? (
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { key: 'strengths', label: 'Forces', bg: 'bg-green-50 dark:bg-green-900/10' },
                                  { key: 'weaknesses', label: 'Faiblesses', bg: 'bg-red-50 dark:bg-red-900/10' },
                                  { key: 'opportunities', label: 'Opportunités', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                                  { key: 'threats', label: 'Menaces', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                                ].map((q) => (
                                  <div key={q.key} className={cn('rounded-lg p-3', q.bg)}>
                                    <p className="text-sm font-semibold mb-1">{q.label}</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                      {(val as SwotData)[q.key as keyof SwotData] || 'Non rempli'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {s.type === 'select' && (
                              <p className="text-sm text-muted-foreground">
                                {STATUT_JURIDIQUE_OPTIONS.find((o) => o.value === val)?.label || String(val)}
                              </p>
                            )}
                            {s.type === 'financing-table' && Array.isArray(val) && (
                              <div className="overflow-x-auto">
                              <table className="w-full text-sm" aria-label="Plan de financement">
                                <thead>
                                  <tr className="border-b">
                                    <th scope="col" className="text-left py-1 font-medium">Source</th>
                                    <th scope="col" className="text-right py-1 font-medium">Montant</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(val as FinancingRow[]).map((row) => (
                                    <tr key={row.id} className="border-b last:border-0">
                                      <td className="py-1">{row.source}</td>
                                      <td className="py-1 text-right">{formatCurrency(row.montant)}</td>
                                    </tr>
                                  ))}
                                  <tr className="font-semibold">
                                    <td className="py-1">Total</td>
                                    <td className="py-1 text-right">
                                      {formatCurrency((val as FinancingRow[]).reduce((sum, r) => sum + r.montant, 0))}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              </div>
                            )}
                            {s.type === 'investments-list' && Array.isArray(val) && val.length > 0 && (
                              <ul className="text-sm space-y-1">
                                {(val as Investment[]).map((inv) => (
                                  <li key={inv.id} className="flex justify-between">
                                    <span>{inv.name}</span>
                                    <span className="font-medium">{formatCurrency(inv.amount)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {s.type === 'timeline' && Array.isArray(val) && val.length > 0 && (
                              <div className="space-y-2">
                                {(val as Milestone[]).map((m) => (
                                  <div key={m.id} className="flex items-center gap-2 text-sm">
                                    {m.completed ? <Check className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground/40" />}
                                    <span className="font-medium">{m.date}</span>
                                    <span className="text-muted-foreground">{m.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {(s.type === 'result-table' || s.type === 'bilan-table') && typeof val === 'object' && val !== null && !Array.isArray(val) && (
                              <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto">
                                {JSON.stringify(val, null, 2)}
                              </pre>
                            )}
                            {s.type === 'treasury-table' && Array.isArray(val) && (
                              <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto max-h-48">
                                {JSON.stringify(val, null, 2)}
                              </pre>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* ═══ Export PDF Dialog ═══ */}
        <Dialog open={exportPdfOpen} onOpenChange={setExportPdfOpen}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
            <BusinessPlanPdf onClose={() => setExportPdfOpen(false)} />
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  )
}

// ═══════════════════════════════════════════════
// Sub-components for complex section types
// ═══════════════════════════════════════════════

// ─── Products List (Catalogue produits) ───────

function ProductsList({ value, onChange }: { value: BpProduct[]; onChange: (v: BpProduct[]) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', description: '', prixVente: '', coutUnitaire: '', quantiteMensuelle: '' })

  const resetForm = () => setForm({ nom: '', description: '', prixVente: '', coutUnitaire: '', quantiteMensuelle: '' })

  const add = () => {
    if (!form.nom.trim() || !form.prixVente) return
    const prixVente = parseFloat(form.prixVente) || 0
    const coutUnitaire = parseFloat(form.coutUnitaire) || 0
    const quantiteMensuelle = parseInt(form.quantiteMensuelle) || 0
    const marge = prixVente > 0 ? Math.round(((prixVente - coutUnitaire) / prixVente) * 100) : 0
    onChange([...value, {
      id: genId(),
      nom: form.nom.trim(),
      description: form.description.trim(),
      prixVente,
      coutUnitaire,
      quantiteMensuelle,
      marge,
    }])
    resetForm()
    setShowForm(false)
  }

  const remove = (id: string) => onChange(value.filter((p) => p.id !== id))
  const update = (id: string, field: keyof BpProduct, val: string | number) => {
    onChange(value.map((p) => {
      if (p.id !== id) return p
      const updated = { ...p, [field]: val }
      if (field === 'prixVente' || field === 'coutUnitaire') {
        const pv = typeof val === 'number' && field === 'prixVente' ? val : updated.prixVente
        const cu = typeof val === 'number' && field === 'coutUnitaire' ? val : updated.coutUnitaire
        updated.marge = pv > 0 ? Math.round(((pv - cu) / pv) * 100) : 0
      }
      return updated
    }))
  }

  const caMensuel = value.reduce((s, p) => s + (p.prixVente * p.quantiteMensuelle), 0)
  const margeMoyenne = value.length > 0 ? Math.round(value.reduce((s, p) => s + p.marge, 0) / value.length) : 0

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Produits</p>
            <p className="text-xl font-bold text-foreground">{value.length}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">CA mensuel</p>
            <p className="text-xl font-bold text-[#00838F]">{formatCurrency(caMensuel)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 col-span-2 md:col-span-1">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Marge moyenne</p>
            <p className={cn('text-xl font-bold', margeMoyenne >= 50 ? 'text-green-600' : margeMoyenne >= 30 ? 'text-amber-600' : 'text-red-600')}>
              {margeMoyenne}%
            </p>
          </div>
        </div>
      )}

      {/* Products list */}
      {value.length > 0 && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {value.map((prod) => (
            <div key={prod.id} className="rounded-lg border p-4 space-y-3 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    value={prod.nom}
                    onChange={(e) => update(prod.id, 'nom', e.target.value)}
                    className="h-8 text-sm font-semibold border-0 shadow-none focus-visible:ring-0 p-0"
                    placeholder="Nom du produit..."
                  />
                  <Input
                    value={prod.description}
                    onChange={(e) => update(prod.id, 'description', e.target.value)}
                    className="h-6 text-xs text-muted-foreground border-0 shadow-none focus-visible:ring-0 p-0 mt-0.5"
                    placeholder="Description courte..."
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5', prod.marge >= 50 ? 'border-green-500/30 text-green-600 bg-green-50/50' : prod.marge >= 30 ? 'border-amber-500/30 text-amber-600 bg-amber-50/50' : 'border-red-500/30 text-red-600 bg-red-50/50')}>
                    Marge {prod.marge}%
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                    onClick={() => remove(prod.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Prix de vente unitaire</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={prod.prixVente || ''}
                      onChange={(e) => update(prod.id, 'prixVente', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0 text-right pr-7"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Coût unitaire</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={prod.coutUnitaire || ''}
                      onChange={(e) => update(prod.id, 'coutUnitaire', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0 text-right pr-7"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Qté mensuelle</Label>
                  <Input
                    type="number"
                    value={prod.quantiteMensuelle || ''}
                    onChange={(e) => update(prod.id, 'quantiteMensuelle', parseInt(e.target.value) || 0)}
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0 text-right"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                <span>CA produit : <span className="font-medium text-foreground">{formatCurrency(prod.prixVente * prod.quantiteMensuelle)}/mois</span></span>
                <span>Bénéfice unitaire : <span className="font-medium text-green-600">{formatCurrency(prod.prixVente - prod.coutUnitaire)}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add product button / form */}
      {!showForm ? (
        <Button variant="outline" size="sm" className="gap-1.5 w-full border-dashed" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          Ajouter un produit ou service
        </Button>
      ) : (
        <div className="rounded-lg border border-[#00838F]/30 bg-[#00838F]/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Nouveau produit / service</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nom du produit *</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Ex: Formation en ligne..."
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description courte..."
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Prix de vente unitaire (€) *</Label>
              <Input
                type="number"
                value={form.prixVente}
                onChange={(e) => setForm(f => ({ ...f, prixVente: e.target.value }))}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Coût unitaire (€)</Label>
              <Input
                type="number"
                value={form.coutUnitaire}
                onChange={(e) => setForm(f => ({ ...f, coutUnitaire: e.target.value }))}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Quantité vendue par mois</Label>
              <Input
                type="number"
                value={form.quantiteMensuelle}
                onChange={(e) => setForm(f => ({ ...f, quantiteMensuelle: e.target.value }))}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
          </div>
          {form.prixVente && form.coutUnitaire && parseFloat(form.prixVente) > 0 && (
            <p className="text-xs text-muted-foreground">
              Marge estimée : <span className="font-semibold text-foreground">{Math.round(((parseFloat(form.prixVente) - parseFloat(form.coutUnitaire)) / parseFloat(form.prixVente)) * 100)}%</span>
              {' '}&mdash; Bénéfice unitaire : <span className="font-semibold text-green-600">{formatCurrency(parseFloat(form.prixVente) - parseFloat(form.coutUnitaire))}</span>
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-[#00838F] hover:bg-[#00838F]/90 text-white" onClick={add} disabled={!form.nom.trim() || !form.prixVente}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Ajouter
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm() }}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Associates List (Répartition du capital) ──

function AssociatesList({ value, onChange }: { value: Associate[]; onChange: (v: Associate[]) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', role: '', nombreParts: '', pourcentage: '', apportCapital: '' })

  const resetForm = () => setForm({ nom: '', prenom: '', role: '', nombreParts: '', pourcentage: '', apportCapital: '' })

  const totalParts = value.reduce((s, a) => s + a.nombreParts, 0)
  const totalCapital = value.reduce((s, a) => s + a.apportCapital, 0)
  const totalPourcentage = value.reduce((s, a) => s + a.pourcentage, 0)

  const add = () => {
    if (!form.nom.trim() || !form.prenom.trim()) return
    onChange([...value, {
      id: genId(),
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      role: form.role.trim(),
      nombreParts: parseInt(form.nombreParts) || 0,
      pourcentage: parseFloat(form.pourcentage) || 0,
      apportCapital: parseFloat(form.apportCapital) || 0,
    }])
    resetForm()
    setShowForm(false)
  }

  const remove = (id: string) => onChange(value.filter((a) => a.id !== id))
  const update = (id: string, field: keyof Associate, val: string | number) => {
    onChange(value.map((a) => (a.id === id ? { ...a, [field]: val } : a)))
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Associés</p>
            <p className="text-xl font-bold text-foreground">{value.length}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Total parts</p>
            <p className="text-xl font-bold text-[#00838F]">{totalParts.toLocaleString('fr-FR')}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 col-span-2 md:col-span-1">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Capital total</p>
            <p className="text-xl font-bold text-[#00838F]">{formatCurrency(totalCapital)}</p>
          </div>
        </div>
      )}

      {/* Percentage warning */}
      {value.length > 0 && (totalPourcentage !== 100) && (
        <p className={cn('text-xs px-3 py-1.5 rounded-md', totalPourcentage > 100 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200')}>
          {totalPourcentage > 100
            ? `Attention : le total des pourcentages dépasse 100% (${totalPourcentage}%)`
            : `Répartition incomplète : ${totalPourcentage}% attribué sur 100%`}
        </p>
      )}

      {/* Associates list */}
      {value.length > 0 && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {value.map((assoc, idx) => (
            <div key={assoc.id} className="rounded-lg border p-4 space-y-3 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00838F]/10 text-[#00838F] text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={assoc.prenom}
                        onChange={(e) => update(assoc.id, 'prenom', e.target.value)}
                        className="h-7 text-sm font-semibold border-0 shadow-none focus-visible:ring-0 p-0 w-24"
                        placeholder="Prénom..."
                      />
                      <Input
                        value={assoc.nom}
                        onChange={(e) => update(assoc.id, 'nom', e.target.value)}
                        className="h-7 text-sm font-semibold border-0 shadow-none focus-visible:ring-0 p-0 w-32"
                        placeholder="Nom..."
                      />
                    </div>
                    <Input
                      value={assoc.role}
                      onChange={(e) => update(assoc.id, 'role', e.target.value)}
                      className="h-6 text-xs text-muted-foreground border-0 shadow-none focus-visible:ring-0 p-0 mt-0.5"
                      placeholder="Rôle (ex: Gérant, Président...)"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-semibold">
                    {assoc.pourcentage}%
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                    onClick={() => remove(assoc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Nombre de parts</Label>
                  <Input
                    type="number"
                    value={assoc.nombreParts || ''}
                    onChange={(e) => update(assoc.id, 'nombreParts', parseInt(e.target.value) || 0)}
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Pourcentage (%)</Label>
                  <Input
                    type="number"
                    value={assoc.pourcentage || ''}
                    onChange={(e) => update(assoc.id, 'pourcentage', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Apport en capital</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={assoc.apportCapital || ''}
                      onChange={(e) => update(assoc.id, 'apportCapital', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0 text-right pr-7"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add associate button / form */}
      {!showForm ? (
        <Button variant="outline" size="sm" className="gap-1.5 w-full border-dashed" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          Ajouter un associé
        </Button>
      ) : (
        <div className="rounded-lg border border-[#00838F]/30 bg-[#00838F]/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Nouvel associé</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Prénom *</Label>
              <Input
                value={form.prenom}
                onChange={(e) => setForm(f => ({ ...f, prenom: e.target.value }))}
                placeholder="Prénom..."
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs">Nom *</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Nom..."
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Rôle / Fonction</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="Ex: Gérant, Président..."
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Nombre de parts</Label>
              <Input
                type="number"
                value={form.nombreParts}
                onChange={(e) => setForm(f => ({ ...f, nombreParts: e.target.value }))}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Pourcentage (%)</Label>
              <Input
                type="number"
                value={form.pourcentage}
                onChange={(e) => setForm(f => ({ ...f, pourcentage: e.target.value }))}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Apport en capital (€)</Label>
              <Input
                type="number"
                value={form.apportCapital}
                onChange={(e) => setForm(f => ({ ...f, apportCapital: e.target.value }))}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-[#00838F] hover:bg-[#00838F]/90 text-white" onClick={add} disabled={!form.nom.trim() || !form.prenom.trim()}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Ajouter
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm() }}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Co-gérants List ──────────────────────────

function CogerantsList({ value, onChange }: { value: Cogerant[]; onChange: (v: Cogerant[]) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', fonction: '', email: '', telephone: '' })

  const resetForm = () => setForm({ nom: '', prenom: '', fonction: '', email: '', telephone: '' })

  const add = () => {
    if (!form.nom.trim() || !form.prenom.trim()) return
    onChange([...value, {
      id: genId(),
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      fonction: form.fonction.trim(),
      email: form.email.trim(),
      telephone: form.telephone.trim(),
    }])
    resetForm()
    setShowForm(false)
  }

  const remove = (id: string) => onChange(value.filter((c) => c.id !== id))
  const update = (id: string, field: keyof Cogerant, val: string) => {
    onChange(value.map((c) => (c.id === id ? { ...c, [field]: val } : c)))
  }

  return (
    <div className="space-y-4">
      {/* Info banner when no co-gérants */}
      {value.length === 0 && !showForm && (
        <div className="rounded-lg border bg-muted/30 p-4 text-center space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B35]/10 mx-auto">
            <UserCheck className="h-5 w-5 text-[#FF6B35]" />
          </div>
          <p className="text-sm text-muted-foreground">
            Ajoutez les co-gérants de votre entreprise pour définir leurs rôles et responsabilités.
          </p>
        </div>
      )}

      {/* Co-gérants list */}
      {value.length > 0 && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {value.map((cog, idx) => (
            <div key={cog.id} className="rounded-lg border p-4 space-y-3 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={cog.prenom}
                        onChange={(e) => update(cog.id, 'prenom', e.target.value)}
                        className="h-7 text-sm font-semibold border-0 shadow-none focus-visible:ring-0 p-0 w-24"
                        placeholder="Prénom..."
                      />
                      <Input
                        value={cog.nom}
                        onChange={(e) => update(cog.id, 'nom', e.target.value)}
                        className="h-7 text-sm font-semibold border-0 shadow-none focus-visible:ring-0 p-0 w-32"
                        placeholder="Nom..."
                      />
                    </div>
                    <Input
                      value={cog.fonction}
                      onChange={(e) => update(cog.id, 'fonction', e.target.value)}
                      className="h-6 text-xs text-muted-foreground border-0 shadow-none focus-visible:ring-0 p-0 mt-0.5"
                      placeholder="Fonction (ex: Co-gérant, Directeur technique...)"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 shrink-0"
                  onClick={() => remove(cog.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={cog.email}
                    onChange={(e) => update(cog.id, 'email', e.target.value)}
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0"
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Téléphone</Label>
                  <Input
                    type="tel"
                    value={cog.telephone}
                    onChange={(e) => update(cog.id, 'telephone', e.target.value)}
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0"
                    placeholder="06 00 00 00 00"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add co-gérant button / form */}
      {!showForm ? (
        <Button variant="outline" size="sm" className="gap-1.5 w-full border-dashed" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          Ajouter un co-gérant
        </Button>
      ) : (
        <div className="rounded-lg border border-[#FF6B35]/30 bg-[#FF6B35]/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Nouveau co-gérant</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Prénom *</Label>
              <Input
                value={form.prenom}
                onChange={(e) => setForm(f => ({ ...f, prenom: e.target.value }))}
                placeholder="Prénom..."
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs">Nom *</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Nom..."
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Fonction</Label>
              <Input
                value={form.fonction}
                onChange={(e) => setForm(f => ({ ...f, fonction: e.target.value }))}
                placeholder="Ex: Co-gérant, Directeur..."
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@exemple.com"
                className="h-9 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Téléphone</Label>
              <Input
                type="tel"
                value={form.telephone}
                onChange={(e) => setForm(f => ({ ...f, telephone: e.target.value }))}
                placeholder="06 00 00 00 00"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white" onClick={add} disabled={!form.nom.trim() || !form.prenom.trim()}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Ajouter
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm() }}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Financing Table ──────────────────────────

function FinancingTable({ value, onChange }: { value: FinancingRow[]; onChange: (v: FinancingRow[]) => void }) {
  const [newSource, setNewSource] = useState('')
  const [newMontant, setNewMontant] = useState('')

  const addRow = () => {
    if (!newSource.trim() || !newMontant) return
    const montant = parseFloat(newMontant)
    if (isNaN(montant)) return
    onChange([...value, { id: genId(), source: newSource.trim(), montant }])
    setNewSource('')
    setNewMontant('')
  }

  const removeRow = (id: string) => onChange(value.filter((r) => r.id !== id))
  const updateRow = (id: string, field: 'source' | 'montant', val: string | number) => {
    onChange(value.map((r) => (r.id === id ? { ...r, [field]: val } : r)))
  }

  const total = value.reduce((s, r) => s + r.montant, 0)

  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Tableau des sources de financement">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th scope="col" className="text-left py-2 px-3 font-medium">Source de financement</th>
              <th scope="col" className="text-right py-2 px-3 font-medium w-36">Montant (€)</th>
              <th scope="col" className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {value.map((row) => (
              <tr key={row.id} className="border-b last:border-0 group">
                <td className="py-2 px-3">
                  <Input
                    value={row.source}
                    onChange={(e) => updateRow(row.id, 'source', e.target.value)}
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0"
                    placeholder="Ex: Apport personnel..."
                  />
                </td>
                <td className="py-2 px-3">
                  <div className="relative">
                    <Input
                      type="number"
                      value={row.montant || ''}
                      onChange={(e) => updateRow(row.id, 'montant', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0 text-right pr-7"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  </div>
                </td>
                <td className="py-2 px-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                    onClick={() => removeRow(row.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          {value.length > 0 && (
            <tfoot>
              <tr className="bg-muted/50 font-semibold">
                <td className="py-2 px-3">Total</td>
                <td className="py-2 px-3 text-right">{formatCurrency(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Source..."
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          className="flex-1 h-8 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && addRow()}
        />
        <div className="relative w-28">
          <Input
            type="number"
            placeholder="0"
            value={newMontant}
            onChange={(e) => setNewMontant(e.target.value)}
            className="pr-7 h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addRow()}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
        </div>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={addRow} disabled={!newSource.trim() || !newMontant}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Result Table (3-year P&L) ───────────────

function ResultTable({ value, onChange }: {
  value: Record<string, Record<string, number>>
  onChange: (v: Record<string, Record<string, number>>) => void
}) {
  const years = ['year1', 'year2', 'year3']
  const labels: Record<string, string> = { year1: 'Année 1', year2: 'Année 2', year3: 'Année 3' }
  const fields = [
    { key: 'ca', label: 'Chiffre d\'affaires' },
    { key: 'charges', label: 'Charges totales' },
    { key: 'resultat', label: 'Résultat net' },
  ]

  const update = (year: string, field: string, val: number) => {
    onChange({
      ...value,
      [year]: { ...value[year], [field]: val },
    })
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm" aria-label="Compte de résultat prévisionnel">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th scope="col" className="text-left py-2 px-3 font-medium min-w-[140px]"></th>
            {years.map((y) => (
              <th key={y} scope="col" className="text-right py-2 px-3 font-medium min-w-[120px]">{labels[y]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.key} className={cn('border-b last:border-0', f.key === 'resultat' && 'font-semibold bg-muted/30')}>
              <td className="py-2 px-3">{f.label}</td>
              {years.map((y) => (
                <td key={y} className="py-2 px-3">
                  <div className="relative">
                    <Input
                      type="number"
                      value={value[y]?.[f.key] || ''}
                      onChange={(e) => update(y, f.key, parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0 text-right pr-7"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Treasury Table (12 months) ──────────────

function TreasuryTable({ value, onChange }: { value: TreasuryMonth[]; onChange: (v: TreasuryMonth[]) => void }) {
  const updateMonth = (idx: number, field: 'encaissements' | 'decaissements', val: number) => {
    const newVal = [...value]
    newVal[idx] = { ...newVal[idx], [field]: val }
    // Recalculate solde
    newVal[idx].solde = (newVal[idx].encaissements - newVal[idx].decaissements) + (idx > 0 ? newVal[idx - 1].solde : 0)
    // Recalculate subsequent soldes
    for (let i = idx + 1; i < newVal.length; i++) {
      newVal[i].solde = (newVal[i].encaissements - newVal[i].decaissements) + newVal[i - 1].solde
    }
    onChange(newVal)
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm" aria-label="Plan de trésorerie mensuel">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th scope="col" className="text-left py-2 px-3 font-medium sticky left-0 bg-muted/50 z-10 min-w-[50px]">Mois</th>
            <th scope="col" className="text-right py-2 px-3 font-medium min-w-[110px]">Encaissements</th>
            <th scope="col" className="text-right py-2 px-3 font-medium min-w-[110px]">Décaissements</th>
            <th scope="col" className="text-right py-2 px-3 font-medium min-w-[110px]">Solde cumulé</th>
          </tr>
        </thead>
        <tbody>
          {value.map((m, idx) => (
            <tr key={m.month} className={cn('border-b last:border-0', m.solde < 0 && 'bg-red-50/50 dark:bg-red-900/5')}>
              <td className="py-1.5 px-3 font-medium sticky left-0 bg-background z-10">{m.month}</td>
              <td className="py-1.5 px-3">
                <div className="relative">
                  <Input
                    type="number"
                    value={m.encaissements || ''}
                    onChange={(e) => updateMonth(idx, 'encaissements', parseFloat(e.target.value) || 0)}
                    className="h-7 text-sm border-0 shadow-none focus-visible:ring-0 p-0 text-right pr-7"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">€</span>
                </div>
              </td>
              <td className="py-1.5 px-3">
                <div className="relative">
                  <Input
                    type="number"
                    value={m.decaissements || ''}
                    onChange={(e) => updateMonth(idx, 'decaissements', parseFloat(e.target.value) || 0)}
                    className="h-7 text-sm border-0 shadow-none focus-visible:ring-0 p-0 text-right pr-7"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">€</span>
                </div>
              </td>
              <td className={cn('py-1.5 px-3 text-right font-medium', m.solde < 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400')}>
                {formatCurrency(m.solde)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Investments List ────────────────────────

function InvestmentsList({ value, onChange }: { value: Investment[]; onChange: (v: Investment[]) => void }) {
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const add = () => {
    if (!newName.trim() || !newAmount) return
    const amount = parseFloat(newAmount)
    if (isNaN(amount)) return
    onChange([...value, { id: genId(), name: newName.trim(), amount }])
    setNewName('')
    setNewAmount('')
  }

  const remove = (id: string) => onChange(value.filter((i) => i.id !== id))
  const update = (id: string, field: 'name' | 'amount', val: string | number) => {
    onChange(value.map((i) => (i.id === id ? { ...i, [field]: val } : i)))
  }

  const total = value.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {value.map((inv) => (
            <div key={inv.id} className="flex items-center gap-2 group rounded-lg border p-2">
              <Input
                value={inv.name}
                onChange={(e) => update(inv.id, 'name', e.target.value)}
                className="flex-1 h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0"
                placeholder="Nom de l'investissement..."
              />
              <div className="relative w-28">
                <Input
                  type="number"
                  value={inv.amount || ''}
                  onChange={(e) => update(inv.id, 'amount', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0 text-right pr-7"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                onClick={() => remove(inv.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm px-2">
            <span className="text-muted-foreground">Total investissements</span>
            <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nouvel investissement..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 h-8 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <div className="relative w-28">
          <Input
            type="number"
            placeholder="0"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="pr-7 h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
        </div>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={add} disabled={!newName.trim() || !newAmount}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Bilan Table ─────────────────────────────

function BilanTable({ value, onChange }: {
  value: Record<string, Record<string, number>>
  onChange: (v: Record<string, Record<string, number>>) => void
}) {
  const update = (section: string, field: string, val: number) => {
    onChange({
      ...value,
      [section]: { ...value[section], [field]: val },
    })
  }

  const actif = value.actif || {}
  const passif = value.passif || {}
  const totalActif = (actif.immobilisations || 0) + (actif.stocks || 0) + (actif.creances || 0) + (actif.tresorerie || 0)
  const totalPassif = (passif.capital || 0) + (passif.emprunts || 0) + (passif.fournisseurs || 0) + (passif.autresDettes || 0)
  const equilibré = totalActif === totalPassif

  const fields = (section: string, items: { key: string; label: string }[]) => (
    items.map(({ key, label }) => (
      <tr key={key} className="border-b last:border-0">
        <td className="py-1.5 px-3">{label}</td>
        <td className="py-1.5 px-3">
          <div className="relative">
            <Input
              type="number"
              value={value[section]?.[key] || ''}
              onChange={(e) => update(section, key, parseFloat(e.target.value) || 0)}
              className="h-7 text-sm border-0 shadow-none focus-visible:ring-0 p-0 text-right pr-7"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">€</span>
          </div>
        </td>
      </tr>
    ))
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-[#00838F]/10 px-3 py-2 font-semibold text-sm text-[#00838F]">Actif</div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Bilan comptable - Actif">
          <tbody>{fields('actif', [
            { key: 'immobilisations', label: 'Immobilisations' },
            { key: 'stocks', label: 'Stocks' },
            { key: 'creances', label: 'Créances clients' },
            { key: 'tresorerie', label: 'Trésorerie' },
          ])}</tbody>
          <tfoot>
            <tr className="font-semibold bg-muted/50">
              <td className="py-2 px-3">Total actif</td>
              <td className="py-2 px-3 text-right">{formatCurrency(totalActif)}</td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-[#FF6B35]/10 px-3 py-2 font-semibold text-sm text-[#FF6B35]">Passif</div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Bilan comptable - Passif">
          <tbody>{fields('passif', [
            { key: 'capital', label: 'Capital social' },
            { key: 'emprunts', label: 'Emprunts' },
            { key: 'fournisseurs', label: 'Dettes fournisseurs' },
            { key: 'autresDettes', label: 'Autres dettes' },
          ])}</tbody>
          <tfoot>
            <tr className="font-semibold bg-muted/50">
              <td className="py-2 px-3">Total passif</td>
              <td className="py-2 px-3 text-right">{formatCurrency(totalPassif)}</td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>
      {!equilibré && (
        <div className="md:col-span-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3">
          <span>⚠️</span>
          <span>Le bilan n&apos;est pas équilibré. Écart : {formatCurrency(totalActif - totalPassif)}</span>
        </div>
      )}
    </div>
  )
}

// ─── Timeline View ───────────────────────────

function TimelineView({ value, onChange }: { value: Milestone[]; onChange: (v: Milestone[]) => void }) {
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')

  const add = () => {
    if (!newTitle.trim() || !newDate) return
    onChange([...value, { id: genId(), title: newTitle.trim(), date: newDate, completed: false }])
    setNewTitle('')
    setNewDate('')
  }

  const toggle = (id: string) => onChange(value.map((m) => m.id === id ? { ...m, completed: !m.completed } : m))
  const remove = (id: string) => onChange(value.filter((m) => m.id !== id))

  const sorted = [...value].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-4">
      {sorted.length > 0 && (
        <div className="relative">
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-3">
            {sorted.map((m) => (
              <div key={m.id} className="flex items-start gap-3 relative group">
                <button
                  onClick={() => toggle(m.id)}
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors z-10',
                    m.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-background border-muted-foreground/30 hover:border-[#00838F]',
                  )}
                >
                  {m.completed ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />}
                </button>
                <div className="flex-1 min-w-0 rounded-lg border p-3 group-hover:border-[#00838F]/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn('text-sm font-medium', m.completed && 'line-through text-muted-foreground')}>{m.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.date}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 shrink-0"
                      onClick={() => remove(m.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Separator />
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="w-40 h-8 text-sm"
        />
        <Input
          placeholder="Nouveau jalon..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 h-8 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={add} disabled={!newTitle.trim() || !newDate}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
