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
  RotateCcw,
  Save,
  Sparkles,
  Loader2,
  Check,
  Info,
  FileCheck,
  Briefcase,
  GraduationCap,
  Building2,
  Users,
  Heart,
  ArrowRight,
  Minus,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/auth-fetch'

// ─── Types ──────────────────────────────────

interface CompetenceItem {
  id: string
  name: string
}

interface ClotureChecklist {
  declarationCessation: boolean
  urssaf: boolean
  impots: boolean
  rcs: boolean
  banque: boolean
  clients: boolean
  employes: boolean
  assurance: boolean
  bail: boolean
  comptable: boolean
}

interface RebondOption {
  id: string
  title: string
  icon: typeof Briefcase
  avantages: string[]
  inconvenients: string[]
}

interface ClotureRebondData {
  bilan: string
  competences: CompetenceItem[]
  checklist: ClotureChecklist
  rebondPrefere: string | null
}

// ─── Constants ──────────────────────────────

const REBOND_OPTIONS: RebondOption[] = [
  {
    id: 'salariat',
    title: 'Reprise du salariat',
    icon: Briefcase,
    avantages: ['Revenus stables et réguliers', 'Protection sociale complète', 'Formation par l\'entreprise', 'Moins de stress financier'],
    inconvenients: ['Moins d\'autonomie', 'Plafond de revenus', 'Dépendance hiérarchique', 'Décalage créatif possible'],
  },
  {
    id: 'nouvelle-creation',
    title: 'Nouvelle création d\'entreprise',
    icon: Building2,
    avantages: ['Expérience acquise valorisable', 'Réseau professionnel existant', 'Meilleure connaissance du marché', 'Éligibilité ARE/ACRE'],
    inconvenients: ['Risque de répéter les erreurs', 'Fatigue entrepreneuriale', 'Nécessite du financement', 'Temps de montage'],
  },
  {
    id: 'formation',
    title: 'Formation ou reconversion',
    icon: GraduationCap,
    avantages: ['Montée en compétences', 'Certification valorisable', 'Réorientation possible', 'Financement CPF possible'],
    inconvenients: ['Pas de revenus pendant la période', 'Durée variable (6-24 mois)', 'Pas de garantie d\'emploi', 'Adaptation au rythme scolaire'],
  },
  {
    id: 'freelance',
    title: 'Freelance / Portage salarial',
    icon: Users,
    avantages: ['Autonomie avec filet de sécurité', 'Rapidité de démarrage', 'Flexibilité des missions', 'Gestion admin simplifiée'],
    inconvenients: ['Prélèvements élevés (~10%)', 'Engagement minimum', 'Pression commerciale', 'Moins de crédibilité qu\'une entreprise'],
  },
  {
    id: 'conge-entrepreneurs',
    title: 'Congé pour création d\'entreprise',
    icon: Heart,
    avantages: ['Poste salarié conservé', 'Test à moindre risque', 'Retour possible si échec', 'Indemnisation chômage préservée'],
    inconvenients: ['Durée limitée (1-2 ans)', 'Pas possible si CDI < 24 mois dans certains cas', 'Accord de l\'employeur', 'Double activité difficile'],
  },
]

const CHECKLIST_ITEMS: { key: keyof ClotureChecklist; label: string; detail: string }[] = [
  { key: 'declarationCessation', label: 'Déclaration de cessation', detail: 'Déclarer la cessation d\'activité au CFE (Centre de Formalités des Entreprises)' },
  { key: 'urssaf', label: 'URSSAF / Sécurité sociale', detail: 'Régulariser les cotisations sociales et clôturer le compte Urssaf' },
  { key: 'impots', label: 'Impôts (SIE)', detail: 'Déclarer les résultats de la dernière période et régulariser la TVA' },
  { key: 'rcs', label: 'RCS / Greffe du tribunal', detail: 'Inscrire la radiation au Registre du Commerce et des Sociétés' },
  { key: 'banque', label: 'Compte bancaire professionnel', detail: 'Clôturer le compte bancaire dédié à l\'activité' },
  { key: 'clients', label: 'Clients & fournisseurs', detail: 'Informer les clients, facturer les prestations restantes, payer les fournisseurs' },
  { key: 'employes', label: 'Employés (si applicable)', detail: 'Procéder aux formalités de licenciement ou transfert' },
  { key: 'assurance', label: 'Assurances', detail: 'Résilier les contrats d\'assurance professionnelle' },
  { key: 'bail', label: 'Bail commercial', detail: 'Résilier le bail commercial ou prévoir la cession' },
  { key: 'comptable', label: 'Comptable / Expert-comptable', detail: 'Obtenir les bilans de clôture et le certificat de radiation' },
]

function createCompetence(name: string): CompetenceItem {
  return { id: crypto.randomUUID(), name: name.trim() }
}

// ─── Helpers ────────────────────────────────

function InfoPopover({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-purple-600 hover:bg-purple-600/10 transition-colors shrink-0">
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

// ─── Main Component ─────────────────────────

export function ClotureRebondModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const [bilan, setBilan] = useState('')
  const [competences, setCompetences] = useState<CompetenceItem[]>([])
  const [newCompetence, setNewCompetence] = useState('')
  const [checklist, setChecklist] = useState<ClotureChecklist>({
    declarationCessation: false,
    urssaf: false,
    impots: false,
    rcs: false,
    banque: false,
    clients: false,
    employes: false,
    assurance: false,
    bail: false,
    comptable: false,
  })
  const [rebondPrefere, setRebondPrefere] = useState<string | null>(null)
  const [aiOrientation, setAiOrientation] = useState('')

  // ─── Load data on mount ──────────────────
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('creapulse-cloture-rebond')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.bilan) setBilan(parsed.bilan)
          if (parsed.competences?.length) setCompetences(parsed.competences)
          if (parsed.checklist) setChecklist(prev => ({ ...prev, ...parsed.checklist }))
          if (parsed.rebondPrefere) setRebondPrefere(parsed.rebondPrefere)
          if (parsed.aiOrientation) setAiOrientation(parsed.aiOrientation)
        } catch { /* ignore */ }
      }

      try {
        const res = await authFetch('/api/paa/ateliers', {
          method: 'POST',
          body: JSON.stringify({ action: 'get', atelierCode: 'cloture-rebond' }),
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const d = json.data
            if (d.bilan) setBilan(d.bilan)
            if (d.competences?.length) setCompetences(d.competences)
            if (d.checklist) setChecklist(prev => ({ ...prev, ...d.checklist }))
            if (d.rebondPrefere) setRebondPrefere(d.rebondPrefere)
            if (d.aiOrientation) setAiOrientation(d.aiOrientation)
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
      localStorage.setItem('creapulse-cloture-rebond', JSON.stringify({
        bilan, competences, checklist, rebondPrefere, aiOrientation,
      }))
    }
  }, [isLoading, bilan, competences, checklist, rebondPrefere, aiOrientation])

  // ─── Competence helpers ─────────────────
  const addCompetence = useCallback(() => {
    if (newCompetence.trim()) {
      setCompetences(prev => [...prev, createCompetence(newCompetence)])
      setNewCompetence('')
    }
  }, [newCompetence])

  const removeCompetence = useCallback((id: string) => {
    setCompetences(prev => prev.filter(c => c.id !== id))
  }, [])

  // ─── Checklist helper ────────────────────
  const toggleChecklist = useCallback((key: keyof ClotureChecklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // ─── Completion ─────────────────────────
  const completion = useMemo(() => {
    let filled = 0
    const total = 4
    if (bilan.trim()) filled++
    if (competences.length > 0) filled++
    const checked = Object.values(checklist).filter(Boolean).length
    if (checked >= 5) filled++
    if (rebondPrefere) filled++
    return { filled, total, percent: Math.round((filled / total) * 100) }
  }, [bilan, competences, checklist, rebondPrefere])

  const checklistProgress = useMemo(() => {
    const checked = Object.values(checklist).filter(Boolean).length
    return { checked, total: CHECKLIST_ITEMS.length, percent: Math.round((checked / CHECKLIST_ITEMS.length) * 100) }
  }, [checklist])

  // ─── Save to API ────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await authFetch('/api/paa/ateliers', {
        method: 'PUT',
        body: JSON.stringify({
          atelierCode: 'cloture-rebond',
          bilan,
          competences,
          checklist,
          rebondPrefere,
          aiOrientation,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message || 'Erreur lors de la sauvegarde')
        return
      }
      toast.success('Atelier Clôture & Rebond sauvegardé')
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }, [bilan, competences, checklist, rebondPrefere, aiOrientation])

  // ─── AI Orientation ──────────────────────
  const handleAiOrientation = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await authFetch('/api/paa/ateliers', {
        method: 'POST',
        body: JSON.stringify({
          action: 'ai-analyze',
          atelierCode: 'cloture-rebond',
          bilan,
          competences: competences.map(c => c.name),
          rebondPrefere,
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.suggestion) {
        setAiOrientation(typeof json.data.suggestion === 'string' ? json.data.suggestion : JSON.stringify(json.data.suggestion))
        toast.success('Orientation IA générée !')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la génération IA')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setAiLoading(false)
    }
  }, [bilan, competences, rebondPrefere])

  // ─── Loading skeleton ───────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
            <RotateCcw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Clôture &amp; Rebond Professionnel</h2>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] px-1.5">Atelier 9</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {completion.filled}/{completion.total} sections — {completion.percent}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-amber-400/40 text-amber-500 hover:bg-amber-400/10"
            onClick={handleAiOrientation}
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Orientation IA
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
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
        {/* ── Bilan de l'expérience ── */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Bilan de l&apos;expérience
              </CardTitle>
              <InfoPopover text="Réfléchissez à ce que vous avez appris, ce qui a fonctionné et ce qui n'a pas fonctionné. Ce bilan est précieux pour votre parcours futur." />
            </div>
            <CardDescription>Atelier 9 — Synthèse de votre parcours entrepreneurial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1.5">Ce qui a fonctionné</p>
                <Textarea
                  value={bilan}
                  onChange={(e) => setBilan(e.target.value)}
                  placeholder={"- J'ai développé un réseau solide de 20+ contacts\n- J'ai acquis des compétences en gestion de projet\n- J'ai compris les besoins de mon marché cible\n- J'ai appris à gérer un budget prévisionnel"}
                  className="min-h-[120px] text-sm resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Compétences transférables ── */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Compétences transférables
              </CardTitle>
              <InfoPopover text="Listez les compétences que vous avez acquises et qui sont valorisables dans d'autres contextes professionnels." />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCompetence}
                onChange={(e) => setNewCompetence(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCompetence()}
                placeholder="Ex: Gestion de projet, Vente B2B, Community management..."
                className="flex-1 text-sm rounded-lg border border-border bg-background/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
              <Button size="sm" variant="outline" onClick={addCompetence} disabled={!newCompetence.trim()} className="gap-1 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400">
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
            {competences.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {competences.map((comp) => (
                  <Badge
                    key={comp.id}
                    variant="outline"
                    className="gap-1.5 px-3 py-1.5 text-sm border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                  >
                    <GraduationCap className="h-3 w-3" />
                    {comp.name}
                    <button
                      type="button"
                      onClick={() => removeCompetence(comp.id)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {competences.length === 0 && (
              <p className="text-xs text-muted-foreground">Aucune compétence ajoutée. Utilisez le champ ci-dessus.</p>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* ── Formalités de clôture ── */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Formalités de clôture
                </CardTitle>
                <InfoPopover text="Cochez chaque étape au fur et à mesure de son accomplissement. Ce checklist vous guidera dans les démarches administratives de fermeture." />
              </div>
              <Badge variant="outline" className="text-xs">
                {checklistProgress.checked}/{checklistProgress.total} — {checklistProgress.percent}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleChecklist(item.key)}
                  className={cn(
                    'flex items-start gap-3 w-full rounded-lg border p-3 text-left transition-all',
                    checklist[item.key]
                      ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                  )}
                >
                  <div className={cn(
                    'flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded-md border transition-colors',
                    checklist[item.key]
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-muted-foreground/30'
                  )}>
                    {checklist[item.key] && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      'text-sm font-medium',
                      checklist[item.key] && 'line-through text-muted-foreground'
                    )}>
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-purple-500"
                  animate={{ width: `${checklistProgress.percent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* ── Parcours de rebond ── */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Parcours de rebond
            <InfoPopover text="Découvrez les options disponibles après la clôture de votre entreprise. Chaque option a ses avantages et inconvénients. Sélectionnez celle qui correspond le mieux à votre profil." />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REBOND_OPTIONS.map((option) => {
              const OptionIcon = option.icon
              const isSelected = rebondPrefere === option.id
              return (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={() => setRebondPrefere(isSelected ? null : option.id)}
                  className={cn(
                    'text-left rounded-xl border-2 p-4 transition-all relative',
                    isSelected
                      ? 'shadow-lg border-purple-500 dark:border-purple-500'
                      : 'border-border hover:border-purple-300 dark:hover:border-purple-700'
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-purple-500" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      isSelected ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-muted'
                    )}>
                      <OptionIcon className={cn(
                        'h-5 w-5',
                        isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        'text-sm font-bold',
                        isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-foreground'
                      )}>
                        {option.title}
                      </p>
                      {isSelected && (
                        <Badge className="text-[10px] px-1.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          Sélectionné
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-semibold text-green-600 mb-1 flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Avantages
                      </p>
                      <ul className="space-y-0.5">
                        {option.avantages.map((a, i) => (
                          <li key={i} className="text-[11px] text-muted-foreground">• {a}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-red-500 mb-1 flex items-center gap-1">
                        <Minus className="h-3 w-3" /> Inconvénients
                      </p>
                      <ul className="space-y-0.5">
                        {option.inconvenients.map((inc, i) => (
                          <li key={i} className="text-[11px] text-muted-foreground">• {inc}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* ── AI Orientation ── */}
        {aiOrientation && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-amber-300 dark:border-amber-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Orientation IA — Recommandation personnalisée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                  {aiOrientation}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Bottom Save Bar ── */}
        <Card className="bg-gradient-to-r from-purple-500/5 to-purple-300/5 border-purple-200 dark:border-purple-800">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: completion.total }).map((_, i) => (
                    <div key={i} className={cn(
                      'h-2 w-2 rounded-full transition-colors',
                      i < completion.filled ? 'bg-purple-500' : 'bg-muted',
                    )} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {completion.percent}% complété
                </span>
              </div>
              <Button
                size="sm"
                className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
