'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authFetch } from '@/lib/auth-fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import {
  Search,
  X,
  User,
  Mail,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Eye,
  Sparkles,
  Target,
  BookOpen,
  BarChart3,
  TrendingUp,
  Loader2,
  CircleDot,
} from 'lucide-react'

/* ─── Types ─── */

interface Beneficiary {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  projectTitle: string
  sector: string
  journeyPhase: string
  journeyPhaseRaw: string
  progress: number
  lastActivity: string
  status: string
  createdAt: string
}

interface KiviatScore {
  category: string
  score: number
}

interface Livrable {
  id: string
  type: string
  title: string
  status: string
  statusLabel: string
  createdAt: string
  generatedAt: string | null
}

interface Beneficiary360Data {
  beneficiaire: Beneficiary
  kiviatScores: KiviatScore[]
  livrables: Livrable[]
  recentInterviews: Array<{
    id: string
    date: string
    time: string
    type: string
    typeLabel: string
    status: string
    statusLabel: string
    notes: string
  }>
  moduleCompletion: Array<{
    moduleName: string
    status: 'completed' | 'in_progress' | 'not_started'
    score: number
  }>
  journeyData: {
    currentPhase: string
    progressPercent: number
    projectTitle: string
    projectSector: string
    bpStatus: string
  } | null
}

/* ─── KIVIAT RADAR CHART (CSS) ─── */

const KIVIAT_DIMENSIONS = [
  'Leadership',
  'Gestion du Stress',
  'Communication',
  'Résolution de Problèmes',
  'Créativité',
  'Adaptabilité',
]

function KiviatRadar({ scores }: { scores: KiviatScore[] }) {
  const scoreMap = new Map(scores.map((s) => [s.category.toLowerCase(), s.score]))

  const getScore = (dim: string) => {
    const val = scoreMap.get(dim.toLowerCase())
    return val !== undefined ? val : 0
  }

  const values = KIVIAT_DIMENSIONS.map(getScore)
  const maxVal = Math.max(...values, 1)
  const n = values.length
  const size = 200
  const center = size / 2
  const radius = size / 2 - 30

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2
    const r = (value / maxVal) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const points = values.map((v, i) => getPoint(i, v))
  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <circle
            key={r}
            cx={center}
            cy={center}
            r={radius * r}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-muted-foreground/20"
          />
        ))}
        {/* Grid lines */}
        {values.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2
          const x2 = center + radius * Math.cos(angle)
          const y2 = center + radius * Math.sin(angle)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-muted-foreground/20"
            />
          )
        })}
        {/* Polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(5, 150, 105, 0.15)"
          stroke="#059669"
          strokeWidth={2}
        />
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="#059669" stroke="white" strokeWidth={2} />
        ))}
        {/* Labels */}
        {KIVIAT_DIMENSIONS.map((dim, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2
          const lx = center + (radius + 22) * Math.cos(angle)
          const ly = center + (radius + 22) * Math.sin(angle)
          return (
            <text
              key={dim}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] fill-muted-foreground"
            >
              {dim}
            </text>
          )
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-3">
        {KIVIAT_DIMENSIONS.map((dim, i) => (
          <div key={dim} className="flex items-center gap-1.5 text-xs">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">{dim}:</span>
            <span className="font-medium">{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── TIMELINE ─── */

function TimelineItem({
  icon: Icon,
  color,
  title,
  subtitle,
  date,
}: {
  icon: React.ElementType
  color: string
  title: string
  subtitle: string
  date: string
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="w-px flex-1 bg-border mt-2" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {date}
        </p>
      </div>
    </div>
  )
}

/* ─── MODULE COMPLETION CARD ─── */

function ModuleCard({
  name,
  status,
  score,
}: {
  name: string
  status: 'completed' | 'in_progress' | 'not_started'
  score: number
}) {
  const statusConfig = {
    completed: { label: 'Terminé', color: 'bg-emerald-500 text-white', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    in_progress: { label: 'En cours', color: 'bg-amber-500 text-white', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    not_started: { label: 'Non commencé', color: 'bg-muted text-muted-foreground', badge: 'bg-muted text-muted-foreground border-border' },
  }
  const cfg = statusConfig[status]

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
        {status === 'completed' ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : status === 'in_progress' ? (
          <CircleDot className="h-4 w-4" />
        ) : (
          <BookOpen className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={score} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground shrink-0">{score}%</span>
        </div>
      </div>
      <Badge variant="outline" className={cfg.badge}>{cfg.label}</Badge>
    </div>
  )
}

/* ─── LOADING SKELETONS ─── */

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-6 w-40" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/* ─── EMPTY STATE ─── */

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Eye className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>
    </motion.div>
  )
}

/* ─── MAIN BENEFICIAIRE 360° SHEET ─── */

export function Beneficiaire360Sheet({
  open,
  onOpenChange,
  preselectedBeneficiaryId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedBeneficiaryId?: string | null
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [searchResults, setSearchResults] = useState<Beneficiary[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null)
  const [data360, setData360] = useState<Beneficiary360Data | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch all beneficiaries when sheet opens
  useEffect(() => {
    if (open) {
      fetchBeneficiaries()
      // If preselected, directly load 360 data
      if (preselectedBeneficiaryId) {
        loadBeneficiary360(preselectedBeneficiaryId)
      } else {
        setSelectedBeneficiary(null)
        setData360(null)
        setError(null)
        setSearchQuery('')
      }
    }
  }, [open, preselectedBeneficiaryId])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchBeneficiaries = async () => {
    try {
      const res = await authFetch('/api/conseiller/beneficiaires?limit=50')
      const json = await res.json()
      if (json.success) {
        setBeneficiaries(json.data.beneficiaires)
      }
    } catch {
      // Silent fail - user can still search
    }
  }

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setLoadingSearch(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authFetch(`/api/conseiller/beneficiaires?search=${encodeURIComponent(query)}&limit=10`)
        const json = await res.json()
        if (json.success) {
          setSearchResults(json.data.beneficiaires)
          setShowDropdown(true)
        }
      } catch {
        // Fallback to local filter
        const q = query.toLowerCase()
        const filtered = beneficiaries.filter(
          (b) =>
            b.firstName.toLowerCase().includes(q) ||
            b.lastName.toLowerCase().includes(q) ||
            b.projectTitle.toLowerCase().includes(q)
        )
        setSearchResults(filtered)
        setShowDropdown(true)
      } finally {
        setLoadingSearch(false)
      }
    }, 300)
  }, [beneficiaries])

  const loadBeneficiary360 = async (beneficiaryId: string) => {
    setLoadingData(true)
    setError(null)
    setData360(null)
    setShowDropdown(false)

    try {
      // Fetch beneficiary details
      const [benRes, entretiensRes, livrablesRes, kiviatRes] = await Promise.all([
        authFetch(`/api/conseiller/beneficiaires?search=${beneficiaryId}&limit=1`),
        authFetch(`/api/conseiller/entretiens?limit=20`),
        authFetch(`/api/conseiller/livrables?limit=20`),
        authFetch(`/api/conseiller/creascope-stats?counselorId=self`),
      ])

      const [benJson, entJson, livJson, kiviatJson] = await Promise.all([
        benRes.json(),
        entretiensRes.json(),
        livrablesRes.json(),
        kiviatRes.json().catch(() => null),
      ])

      // Find the beneficiary
      let benef: Beneficiary | null = null
      if (benJson.success) {
        benef = benJson.data.beneficiaires.find((b: Beneficiary) => b.id === beneficiaryId) || null
        if (!benef && benJson.data.beneficiaires.length > 0) {
          benef = benJson.data.beneficiaires[0]
        }
      }

      if (!benef) {
        setError('Beneficiaire non trouvé')
        setLoadingData(false)
        return
      }

      setSelectedBeneficiary(benef)

      // Extract entretiens for this beneficiary
      const benEntretiens = entJson.success
        ? entJson.data.entretiens.filter((e: { beneficiaryId: string }) => e.beneficiaryId === beneficiaryId).slice(0, 8)
        : []

      // Extract livrables for this beneficiary
      const benLivrables = livJson.success
        ? livJson.data.livrables.filter((l: { beneficiaryId: string }) => l.beneficiaryId === beneficiaryId)
        : []

      // Extract kiviat scores (if creascope data available)
      let kiviatScores: KiviatScore[] = []
      if (kiviatJson?.success) {
        const dimAverages = kiviatJson.data.dimensionAverages
        if (dimAverages) {
          kiviatScores = Object.entries(dimAverages).map(([key, value]) => ({
            category: key.charAt(0).toUpperCase() + key.slice(1),
            score: value as number,
          }))
        }
      }

      // Build module completion mock based on progress
      const moduleNames = ['Découverte entrepreneuriale', 'Profilage RIASEC', 'Idéation & Créativité', 'Business Model Canvas', 'Business Plan', 'Stratégie financière']
      const moduleCompletion = moduleNames.map((name, i) => {
        const threshold = (i / moduleNames.length) * 100
        const status = benef.progress >= threshold + 16
          ? 'completed' as const
          : benef.progress >= threshold
            ? 'in_progress' as const
            : 'not_started' as const
        const score = status === 'completed' ? 100 : status === 'in_progress' ? Math.min(90, Math.round((benef.progress - threshold) / 16 * 100)) : 0
        return { moduleName: name, status, score }
      })

      setData360({
        beneficiaire: benef,
        kiviatScores,
        livrables: benLivrables,
        recentInterviews: benEntretiens,
        moduleCompletion,
        journeyData: {
          currentPhase: benef.journeyPhase,
          progressPercent: benef.progress,
          projectTitle: benef.projectTitle,
          projectSector: benef.sector,
          bpStatus: 'NOT_STARTED',
        },
      })
    } catch (err) {
      setError('Erreur lors du chargement des données')
    } finally {
      setLoadingData(false)
    }
  }

  const selectBeneficiary = (ben: Beneficiary) => {
    setSearchQuery(`${ben.firstName} ${ben.lastName}`)
    setShowDropdown(false)
    loadBeneficiary360(ben.id)
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  const initials = (b: Beneficiary) =>
    `${b.firstName[0] || ''}${b.lastName[0] || ''}`.toUpperCase()

  const livrableTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'business_plan': return 'BP'
      case 'bmc': return 'BMC'
      case 'previsionnel_financier': return 'PF'
      default: return 'DOC'
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after animation
    setTimeout(() => {
      setSelectedBeneficiary(null)
      setData360(null)
      setError(null)
      setSearchQuery('')
    }, 300)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            Vue 360° Bénéficiaire
          </SheetTitle>
          <SheetDescription>
            Consultez le parcours complet d&apos;un bénéficiaire
          </SheetDescription>
        </SheetHeader>

        {/* Search bar */}
        <div className="px-6 py-3 border-b border-border shrink-0 relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un bénéficiaire..."
              className="pl-9 pr-8"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0 || searchQuery.trim()) setShowDropdown(true)
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults([])
                  setShowDropdown(false)
                }}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {loadingSearch && (
              <Loader2 className="absolute top-1/2 right-10 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {showDropdown && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 right-0 mt-1 rounded-lg border bg-background shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {searchResults.map((ben) => (
                  <button
                    key={ben.id}
                    onClick={() => selectBeneficiary(ben)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {initials(ben)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {ben.firstName} {ben.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{ben.projectTitle || 'Aucun projet'}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{ben.journeyPhase}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content area */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {!selectedBeneficiary && !loadingData && !error && (
              <EmptyState
                title="Sélectionnez un bénéficiaire"
                description="Recherchez par nom ou projet pour afficher la vue 360° complète de son parcours."
              />
            )}

            {loadingData && <ProfileSkeleton />}

            {error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-8 w-8 text-coral-500" />
                <p className="mt-3 text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => { setError(null) }}>
                  Réessayer
                </Button>
              </div>
            )}

            {selectedBeneficiary && data360 && !loadingData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Tabs defaultValue="profil" className="space-y-6">
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="profil" className="text-xs sm:text-sm">Profil</TabsTrigger>
                    <TabsTrigger value="parcours" className="text-xs sm:text-sm">Parcours</TabsTrigger>
                    <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
                    <TabsTrigger value="ia" className="text-xs sm:text-sm">IA Insights</TabsTrigger>
                  </TabsList>

                  {/* ── TAB 1: PROFIL ── */}
                  <TabsContent value="profil" className="space-y-6 mt-4">
                    {/* Header card */}
                    <Card>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                              {initials(selectedBeneficiary)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-foreground">
                              {selectedBeneficiary.firstName} {selectedBeneficiary.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {selectedBeneficiary.projectTitle || 'Aucun projet défini'}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline">{selectedBeneficiary.journeyPhase}</Badge>
                              <Badge variant={selectedBeneficiary.status === 'actif' ? 'default' : 'secondary'}>
                                {selectedBeneficiary.status === 'actif' ? 'Actif' : selectedBeneficiary.status === 'inactif' ? 'Inactif' : 'En attente'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="text-xs">Email</span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{selectedBeneficiary.email}</p>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="text-xs">Inscription</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{formatDate(selectedBeneficiary.createdAt)}</p>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs">Dernière activité</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{formatDate(selectedBeneficiary.lastActivity)}</p>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Target className="h-3.5 w-3.5" />
                          <span className="text-xs">Secteur</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{selectedBeneficiary.sector || 'Non défini'}</p>
                      </Card>
                    </div>

                    {/* PAA Program progress */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          Programme PAA
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Progression globale</span>
                          <span className="text-lg font-bold text-foreground">{selectedBeneficiary.progress}%</span>
                        </div>
                        <Progress value={selectedBeneficiary.progress} className="h-2.5" />
                        <div className="text-xs text-muted-foreground">
                          Phase actuelle : <span className="font-medium text-foreground">{selectedBeneficiary.journeyPhase}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Module completion */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          Modules du parcours
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {data360.moduleCompletion.map((mod) => (
                          <ModuleCard key={mod.moduleName} {...mod} />
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── TAB 2: PARCOURS ── */}
                  <TabsContent value="parcours" className="space-y-6 mt-4">
                    {/* Timeline */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Chronologie des activités</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {data360.recentInterviews.length > 0 ? (
                          <div className="relative">
                            {data360.recentInterviews.map((interview, i) => {
                              const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
                                bilan: { icon: BarChart3, color: 'bg-primary/10 text-primary' },
                                suivi: { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
                                atelier: { icon: BookOpen, color: 'bg-amber-50 text-amber-600' },
                                autre: { icon: FileText, color: 'bg-muted text-muted-foreground' },
                              }
                              const cfg = typeConfig[interview.type] || typeConfig.autre
                              const Icon = cfg.icon
                              return (
                                <div key={interview.id}>
                                  <TimelineItem
                                    icon={Icon}
                                    color={cfg.color}
                                    title={`Entretien de ${interview.typeLabel}`}
                                    subtitle={interview.notes || 'Aucune note'}
                                    date={`${formatDate(interview.date)} - ${interview.time}`}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-6">
                            Aucun entretien enregistré pour ce bénéficiaire.
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Kiviat radar */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Target className="h-4 w-4 text-emerald-600" />
                          Scores CréaScope
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {data360.kiviatScores.length > 0 ? (
                          <KiviatRadar scores={data360.kiviatScores} />
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-6">
                            Aucune évaluation CréaScope disponible. Le bénéficiaire n&apos;a pas encore passé le test.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── TAB 3: DOCUMENTS ── */}
                  <TabsContent value="documents" className="space-y-6 mt-4">
                    {/* BP Status */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          Business Plan
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-foreground font-medium">
                              {data360.journeyData?.projectTitle || 'Business Plan'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {data360.journeyData?.bpStatus === 'VALIDATED' ? 'Validé' :
                               data360.journeyData?.bpStatus === 'DRAFT' ? 'Brouillon' :
                               data360.journeyData?.bpStatus === 'IN_PROGRESS' ? 'En cours' :
                               'Non commencé'}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              data360.journeyData?.bpStatus === 'VALIDATED'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : data360.journeyData?.bpStatus === 'IN_PROGRESS'
                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border-border'
                            }
                          >
                            {data360.journeyData?.bpStatus === 'VALIDATED' ? 'Validé' :
                             data360.journeyData?.bpStatus === 'DRAFT' ? 'Brouillon' :
                             data360.journeyData?.bpStatus === 'IN_PROGRESS' ? 'En cours' :
                             'Non commencé'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* BMC & Financial */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-sm font-medium">BMC</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Business Model Canvas</p>
                        <div className="mt-2">
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">À compléter</Badge>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">Prévisionnel financier</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Tableaux financiers</p>
                        <div className="mt-2">
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">À compléter</Badge>
                        </div>
                      </Card>
                    </div>

                    {/* Livrables list */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">Livrables soumis</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {data360.livrables.length} document{data360.livrables.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {data360.livrables.length > 0 ? (
                          <div className="space-y-0">
                            {data360.livrables.map((liv, i) => (
                              <div key={liv.id}>
                                <div className="flex items-center gap-3 py-2.5">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                                    {livrableTypeIcon(liv.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{liv.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {liv.type} · {formatDate(liv.createdAt)}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={
                                      liv.status === 'VALIDATED'
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : liv.status === 'READY'
                                          ? 'border-coral-200 bg-coral-50 text-coral-700'
                                          : 'border-border'
                                    }
                                  >
                                    {liv.statusLabel}
                                  </Badge>
                                </div>
                                {i < data360.livrables.length - 1 && <Separator />}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-6">
                            Aucun livrable soumis par ce bénéficiaire.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── TAB 4: IA INSIGHTS ── */}
                  <TabsContent value="ia" className="space-y-6 mt-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          Bilan IA
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Le bilan IA est généré automatiquement après chaque cycle d&apos;entretiens.
                          Il synthétise les forces, faiblesses et recommandations pour le bénéficiaire.
                        </p>
                        <div className="mt-4 rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
                          <Sparkles className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                          <p className="mt-3 text-sm text-muted-foreground">
                            Aucun bilan IA disponible pour le moment.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Recommandations personnalisées</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedBeneficiary.progress < 30 ? (
                            <>
                              <div className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-amber-800">Accélérer la phase de découverte</p>
                                  <p className="text-xs text-amber-700 mt-1">Ce bénéficiaire est en début de parcours. Planifiez un entretien de bilan initial.</p>
                                </div>
                              </div>
                              <div className="flex gap-3 p-3 rounded-lg bg-muted">
                                <Target className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">Compléter le test RIASEC</p>
                                  <p className="text-xs text-muted-foreground mt-1">Le profil RIASEC n&apos;est pas encore renseigné. Invitez le bénéficiaire à le compléter.</p>
                                </div>
                              </div>
                            </>
                          ) : selectedBeneficiary.progress < 70 ? (
                            <>
                              <div className="flex gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                <TrendingUp className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-emerald-800">Parcours en bonne progression</p>
                                  <p className="text-xs text-emerald-700 mt-1">Le bénéficiaire avance bien. Concentrez les prochains entretiens sur la modélisation et la stratégie.</p>
                                </div>
                              </div>
                              <div className="flex gap-3 p-3 rounded-lg bg-muted">
                                <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">Valider les livrables en attente</p>
                                  <p className="text-xs text-muted-foreground mt-1">Des livrables sont prêts pour review. Prenez le temps de les valider rapidement.</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-emerald-800">Phase de lancement imminente</p>
                                  <p className="text-xs text-emerald-700 mt-1">Le parcours est avancé. Préparez le bénéficiaire au lancement avec un bilan complet.</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Button
                      className="w-full h-auto flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-primary to-emerald-600 hover:opacity-90"
                      onClick={() => {
                        // Placeholder: In production, this would call an AI endpoint
                      }}
                    >
                      <Sparkles className="h-5 w-5" />
                      <div className="text-left">
                        <p className="text-sm font-semibold">Générer un bilan IA</p>
                        <p className="text-xs opacity-80">Analyse intelligente du parcours</p>
                      </div>
                    </Button>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}