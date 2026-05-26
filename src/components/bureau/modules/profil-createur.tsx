'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  Upload,
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  Phone,
  Loader2,
  X,
  Plus,
  FileText,
  Briefcase,
  Heart,
  Accessibility,
  Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface ProfilData {
  firstName: string | null
  lastName: string | null
  email: string
  avatarUrl: string | null
  birthdate: string | null
  phone: string | null
  address: string | null
  employmentStatus: string | null
  educationLevel: string | null
  lastDiploma: string | null
  skills: string[]
  creationMotivation: string | null
  previousExperience: boolean | null
  previousExperienceDetails: string | null
  availableTimePerWeek: number | null
  hasDisability: boolean
  rqthStatus: boolean
  disabilityRate: number | null
  supportNeeds: string[]
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const STORAGE_KEY = 'creapulse-profil'

const EMPLOYMENT_OPTIONS = [
  { value: 'EMPLOYED', label: 'Salarié(e)' },
  { value: 'UNEMPLOYED', label: 'Demandeur/demandeuse d\'emploi' },
  { value: 'SELF_EMPLOYED', label: 'Auto-entrepreneur(e)' },
  { value: 'STUDENT', label: 'Étudiant(e)' },
  { value: 'RETIRED', label: 'Retraité(e)' },
  { value: 'INACTIVE', label: 'Inactif/ve' },
  { value: 'OTHER', label: 'Autre' },
]

const EDUCATION_OPTIONS = [
  { value: 'sans_diplome', label: 'Sans diplôme' },
  { value: 'bep_cap', label: 'BEP / CAP' },
  { value: 'bac', label: 'Baccalauréat' },
  { value: 'bac_plus2', label: 'Bac +2 (BTS, DUT, DEUG)' },
  { value: 'bac_plus3', label: 'Bac +3 (Licence, BUT)' },
  { value: 'bac_plus5', label: 'Bac +5 (Master, Ingénieur)' },
  { value: 'bac_plus8', label: 'Bac +8 (Doctorat)' },
]

const SUPPORT_NEEDS_OPTIONS = [
  { value: 'financement', label: 'Financement & aides' },
  { value: 'juridique', label: 'Conseil juridique' },
  { value: 'marketing', label: 'Marketing & communication' },
  { value: 'technique', label: 'Compétences techniques' },
  { value: 'reseau', label: 'Mise en réseau' },
  { value: 'coaching', label: 'Coaching personnel' },
  { value: 'formation', label: 'Formation continue' },
  { value: 'local', label: 'Local & immobilier' },
]

const SUGGESTED_SKILLS = [
  'Gestion de projet', 'Vente', 'Marketing digital', 'Comptabilité',
  'Développement web', 'Design graphique', 'Rédaction', 'Community management',
  'Logistique', 'Négociation', 'Leadership', 'Analyse de données',
]

const DEFAULT_PROFIL: ProfilData = {
  firstName: null, lastName: null, email: '', avatarUrl: null,
  birthdate: null, phone: null, address: null,
  employmentStatus: null, educationLevel: null, lastDiploma: null,
  skills: [], creationMotivation: null, previousExperience: null,
  previousExperienceDetails: null, availableTimePerWeek: null,
  hasDisability: false, rqthStatus: false, disabilityRate: null,
  supportNeeds: [],
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function calculateCompletion(data: ProfilData): number {
  let filled = 0
  let total = 14
  if (data.firstName) filled++
  if (data.lastName) filled++
  if (data.birthdate) filled++
  if (data.phone) filled++
  if (data.address) filled++
  if (data.employmentStatus) filled++
  if (data.educationLevel) filled++
  if (data.lastDiploma) filled++
  if (data.skills.length > 0) filled++
  if (data.creationMotivation) filled++
  if (data.previousExperience !== null) filled++
  if (data.availableTimePerWeek !== null) filled++
  if (data.supportNeeds.length > 0) filled++
  if (data.previousExperience && data.previousExperienceDetails) filled++
  return Math.round((filled / total) * 100)
}

function getCompletionColor(pct: number): string {
  if (pct >= 80) return 'text-green-600 dark:text-green-400'
  if (pct >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-muted-foreground'
}

// ────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────

export function ProfilCreateur() {
  const [data, setData] = useState<ProfilData>(DEFAULT_PROFIL)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [newSkill, setNewSkill] = useState('')
  const [activeTab, setActiveTab] = useState('personal')
  const [hasChanges, setHasChanges] = useState(false)
  const [cvFile, setCvFile] = useState<{ name: string; size: number; uploadedAt: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Load data ──
  useEffect(() => {
    async function loadProfil() {
      // Try localStorage first
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setData(parsed)
          setLoading(false)
          // Then fetch from API in background (always try — cookie auth)
          fetchFromApi()
          return
        } catch { /* ignore */ }
      }
      // Fetch from API (always try — cookie auth)
      await fetchFromApi()
    }

    async function fetchFromApi() {
      try {
        const res = await fetch('/api/profil', {
          credentials: 'include',
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setData((prev) => ({ ...prev, ...json.data }))
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_PROFIL, ...json.data }))
          }
        }
      } catch { /* silent */ }
      setLoading(false)
    }

    loadProfil()
  }, [])

  // ── Auto-save to localStorage on change ──
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data, loading])

  // ── Update field helper ──
  const updateField = useCallback(<K extends keyof ProfilData>(key: K, value: ProfilData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }, [])

  // ── Add skill ──
  const addSkill = useCallback((skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !data.skills.includes(trimmed)) {
      setData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }))
      setHasChanges(true)
    }
    setNewSkill('')
  }, [data.skills])

  // ── Remove skill ──
  const removeSkill = useCallback((skill: string) => {
    setData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }))
    setHasChanges(true)
  }, [])

  // ── Toggle support need ──
  const toggleSupportNeed = useCallback((need: string) => {
    setData((prev) => ({
      ...prev,
      supportNeeds: prev.supportNeeds.includes(need)
        ? prev.supportNeeds.filter((n) => n !== need)
        : [...prev.supportNeeds, need],
    }))
    setHasChanges(true)
  }, [])

  // ── Save to API (cookie-based auth — session cookie sent automatically) ──
  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/profil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSaveStatus('saved')
        setHasChanges(false)
        toast.success('Profil sauvegardé avec succès !')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        const errData = await res.json().catch(() => ({}))
        setSaveStatus('error')
        if (res.status === 401) {
          toast.error('Vous devez être connecté(e) pour sauvegarder', {
            description: 'Votre session a peut-être expiré. Reconnectez-vous.',
          })
        } else {
          toast.error('Erreur lors de la sauvegarde', {
            description: errData?.error?.message || 'Veuillez réessayer.',
          })
        }
      }
    } catch {
      setSaveStatus('error')
      toast.error('Erreur réseau')
    }
  }

  const completion = calculateCompletion(data)

  if (loading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto w-full space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
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
              <User className="h-5 w-5 text-primary" />
            </div>
            Profil Créateur
          </h1>
          <p className="mt-1 text-muted-foreground">
            Complétez votre profil pour un accompagnement personnalisé
          </p>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Modifications non sauvegardées
            </span>
          )}
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

      {/* Progress indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-none shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Complétion du profil</span>
              <span className={cn('text-sm font-bold', getCompletionColor(completion))}>
                {completion}%
              </span>
            </div>
            <Progress value={completion} className="h-2.5" />
            <p className="mt-2 text-xs text-muted-foreground">
              {completion < 30
                ? 'Commencez par remplir vos informations personnelles'
                : completion < 60
                  ? 'Bien commencé ! Pensez à compléter votre profil entrepreneurial'
                  : completion < 100
                    ? 'Presque terminé ! Quelques informations manquantes'
                    : 'Votre profil est complet !'
              }
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="personal" className="gap-2 text-xs sm:text-sm">
            <User className="h-4 w-4 hidden sm:block" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="entrepreneurial" className="gap-2 text-xs sm:text-sm">
            <Briefcase className="h-4 w-4 hidden sm:block" />
            Profil entrepreneurial
          </TabsTrigger>
          <TabsTrigger value="cv" className="gap-2 text-xs sm:text-sm">
            <Upload className="h-4 w-4 hidden sm:block" />
            CV
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Personal Info ── */}
        <TabsContent value="personal">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Read-only personal info card (counselor-entered) */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Informations saisies par votre conseiller
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Prénom :</span>{' '}
                    <span className="text-sm font-medium">{data.firstName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Nom :</span>{' '}
                    <span className="text-sm font-medium">{data.lastName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Email :</span>{' '}
                    <span className="text-sm font-medium">{data.email || '—'}</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthdate" className="text-sm font-medium">
                      Date de naissance
                    </Label>
                    <Input
                      id="birthdate"
                      type="date"
                      value={data.birthdate || ''}
                      onChange={(e) => updateField('birthdate', e.target.value || null)}
                      className="max-w-[220px] relative z-10"
                      max={new Date().toLocaleDateString('en-CA')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editable contact info */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Coordonnées
                </CardTitle>
                <CardDescription>
                  Informations que vous pouvez modifier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={data.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    placeholder="Votre adresse complète"
                    value={data.address || ''}
                    onChange={(e) => updateField('address', e.target.value || null)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── TAB 2: Entrepreneurial Profile ── */}
        <TabsContent value="entrepreneurial">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Employment status & education */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Situation professionnelle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Statut professionnel</Label>
                    <Select
                      value={data.employmentStatus || ''}
                      onValueChange={(val) => updateField('employmentStatus', val || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez..." />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[250]">
                        {EMPLOYMENT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Niveau d&apos;études</Label>
                    <Select
                      value={data.educationLevel || ''}
                      onValueChange={(val) => updateField('educationLevel', val || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez..." />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[250]">
                        {EDUCATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastDiploma">Dernier diplôme obtenu</Label>
                  <Input
                    id="lastDiploma"
                    placeholder="Ex: BTS Communication, Master en informatique..."
                    value={data.lastDiploma || ''}
                    onChange={(e) => updateField('lastDiploma', e.target.value || null)}
                  />
                </div>

                {/* Skills */}
                <div className="space-y-3">
                  <Label>Compétences</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {data.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="gap-1.5 py-1.5 px-3">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {data.skills.length === 0 && (
                      <p className="text-sm text-muted-foreground">Ajoutez vos compétences</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter une compétence..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkill) } }}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={() => addSkill(newSkill)} disabled={!newSkill.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Suggested skills */}
                  {data.skills.length < 5 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Suggestions :</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SUGGESTED_SKILLS.filter((s) => !data.skills.includes(s)).slice(0, 6).map((skill) => (
                          <button
                            key={skill}
                            onClick={() => addSkill(skill)}
                            className="text-xs px-2 py-1 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-coral-500" />
                  Motivation & expérience
                </CardTitle>
                <CardDescription>
                  Comprendre votre parcours entrepreneurial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="motivation">Quelle est votre motivation pour créer une entreprise ?</Label>
                  <Textarea
                    id="motivation"
                    placeholder="Décrivez ce qui vous motive à entreprendre..."
                    value={data.creationMotivation || ''}
                    onChange={(e) => updateField('creationMotivation', e.target.value || null)}
                    rows={4}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base font-medium">Avez-vous déjà eu une expérience entrepreneuriale ?</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={data.previousExperience === true ? 'default' : 'outline'}
                      onClick={() => updateField('previousExperience', true)}
                      className="flex-1"
                    >
                      Oui
                    </Button>
                    <Button
                      variant={data.previousExperience === false ? 'default' : 'outline'}
                      onClick={() => { updateField('previousExperience', false); updateField('previousExperienceDetails', null) }}
                      className="flex-1"
                    >
                      Non
                    </Button>
                  </div>

                  <AnimatePresence>
                    {data.previousExperience === true && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-2">
                          <Label htmlFor="experienceDetails">Décrivez votre expérience</Label>
                          <Textarea
                            id="experienceDetails"
                            placeholder="Type d'activité, durée, résultats..."
                            value={data.previousExperienceDetails || ''}
                            onChange={(e) => updateField('previousExperienceDetails', e.target.value || null)}
                            rows={3}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  Disponibilité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Temps disponible par semaine</Label>
                    <Badge variant="secondary" className="text-base font-bold">
                      {data.availableTimePerWeek ?? 0}h / semaine
                    </Badge>
                  </div>
                  <Slider
                    value={[data.availableTimePerWeek ?? 0]}
                    onValueChange={(val) => updateField('availableTimePerWeek', val[0])}
                    min={0}
                    max={80}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0h</span>
                    <span>20h</span>
                    <span>40h</span>
                    <span>60h</span>
                    <span>80h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Accessibility className="h-5 w-5 text-purple-500" />
                  Situation de handicap
                </CardTitle>
                <CardDescription>
                  Ces informations nous permettent d&apos;adapter notre accompagnement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Accessibility className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Reconnaissance RQTH</p>
                      <p className="text-xs text-muted-foreground">Reconnaissance de la Qualité de Travailleur Handicapé</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={data.rqthStatus}
                    onCheckedChange={(checked) => updateField('rqthStatus', !!checked)}
                  />
                </div>

                <AnimatePresence>
                  {data.rqthStatus && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <Label>Taux de handicap</Label>
                        <Badge variant="secondary">
                          {data.disabilityRate ?? 0}%
                        </Badge>
                      </div>
                      <Slider
                        value={[data.disabilityRate ?? 0]}
                        onValueChange={(val) => updateField('disabilityRate', val[0])}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Besoins en accompagnement</CardTitle>
                <CardDescription>
                  Sélectionnez les domaines dans lesquels vous avez besoin de soutien
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUPPORT_NEEDS_OPTIONS.map((need) => (
                    <label
                      key={need.value}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                        data.supportNeeds.includes(need.value)
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <Checkbox
                        checked={data.supportNeeds.includes(need.value)}
                        onCheckedChange={() => toggleSupportNeed(need.value)}
                      />
                      <span className="text-sm">{need.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── TAB 3: CV Upload ── */}
        <TabsContent value="cv">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Importer votre CV
                </CardTitle>
                <CardDescription>
                  Votre CV nous permet d&apos;identifier vos compétences et votre parcours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Fichier trop volumineux', { description: 'La taille maximale est de 5 Mo.' })
                      return
                    }
                    setIsUploading(true)
                    try {
                      const formData = new FormData()
                      formData.append('file', file)
                      const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                        credentials: 'include',
                      })
                      if (res.ok) {
                        setCvFile({ name: file.name, size: file.size, uploadedAt: new Date().toLocaleString('fr-FR') })
                        toast.success('CV importé avec succès', { description: `${file.name} a été téléchargé.` })
                      } else {
                        toast.error('Erreur lors de l\'import', { description: 'Impossible de télécharger le fichier.' })
                      }
                    } catch {
                      toast.error('Erreur réseau', { description: 'Vérifiez votre connexion.' })
                    } finally {
                      setIsUploading(false)
                      // Reset input so same file can be re-selected
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }
                  }}
                />

                {/* Upload area */}
                <div
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group',
                    isDragOver
                      ? 'border-primary bg-primary/10'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5',
                    isUploading && 'pointer-events-none opacity-60'
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragOver(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file) {
                      const dt = new DataTransfer()
                      dt.items.add(file)
                      if (fileInputRef.current) {
                        fileInputRef.current.files = dt.files
                        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
                      }
                    }
                  }}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm text-muted-foreground">Téléchargement en cours...</p>
                    </div>
                  ) : cvFile ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30 transition-colors">
                        <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{cvFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(cvFile.size / 1024).toFixed(1)} Ko — importé le {cvFile.uploadedAt}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                        Importé
                      </Badge>
                    </div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Upload className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Glissez-déposez votre CV ici
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ou cliquez pour sélectionner (PDF, DOCX — max 5 Mo)
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills extracted from CV (mock display) */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Compétences détectées
                </CardTitle>
                <CardDescription>
                  Compétences issues de votre profil et parcours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill, i) => (
                      <motion.div
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Badge variant="secondary" className="py-1.5 px-3 text-sm">
                          {skill}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      Aucune compétence détectée. Ajoutez vos compétences dans l&apos;onglet &quot;Informations&quot;.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CV Preview (mock) */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Aperçu du profil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border bg-muted/30 p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                      {data.firstName?.[0] || ''}{data.lastName?.[0] || ''}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {data.firstName} {data.lastName || '—'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{data.email}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Statut :</span>
                      <span className="ml-2 font-medium">
                        {EMPLOYMENT_OPTIONS.find((o) => o.value === data.employmentStatus)?.label || 'Non défini'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Formation :</span>
                      <span className="ml-2 font-medium">
                        {EDUCATION_OPTIONS.find((o) => o.value === data.educationLevel)?.label || 'Non défini'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Diplôme :</span>
                      <span className="ml-2 font-medium">{data.lastDiploma || 'Non défini'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Téléphone :</span>
                      <span className="ml-2 font-medium">{data.phone || 'Non défini'}</span>
                    </div>
                  </div>
                  {data.skills.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Compétences :</p>
                        <div className="flex flex-wrap gap-1.5">
                          {data.skills.map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

export default ProfilCreateur
