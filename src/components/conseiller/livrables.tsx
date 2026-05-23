'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Clock,
  Download,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

/* ─── Types ─── */
type LivrableType = 'business_plan' | 'executive_summary' | 'pitch_deck' | 'financial_forecast' | 'passport' | 'market_study' | 'canvas'
type LivrableStatus = 'DRAFT' | 'READY' | 'VALIDATED' | 'EXPORTED'

interface Livrable {
  id: string
  beneficiaryId: string
  beneficiaryName: string
  beneficiaryInitials: string
  type: LivrableType
  title: string
  status: LivrableStatus
  createdAt: string
  notes?: string
  content?: string
}

/* ─── Configs ─── */
const typeConfig: Record<LivrableType, { label: string; color: string }> = {
  business_plan: { label: 'Business Plan', color: 'bg-primary/10 text-primary' },
  executive_summary: { label: 'Executive Summary', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  pitch_deck: { label: 'Pitch Deck', color: 'bg-coral-50 text-coral-500 dark:bg-coral-900/20 dark:text-coral-400' },
  financial_forecast: { label: 'Previsions Financieres', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  passport: { label: 'Passport', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  market_study: { label: 'Etude de Marche', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  canvas: { label: 'Business Model Canvas', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
}

const statusConfig: Record<LivrableStatus, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-muted text-muted-foreground', icon: FileText },
  READY: { label: 'A valider', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertTriangle },
  VALIDATED: { label: 'Valide', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  EXPORTED: { label: 'Exporte', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Download },
}

const tabFilters = [
  { id: 'all', label: 'Tous' },
  { id: 'DRAFT', label: 'En attente' },
  { id: 'READY', label: 'A valider' },
  { id: 'VALIDATED', label: 'Valides' },
] as const

type TabFilter = typeof tabFilters[number]['id']

/* ─── Mock data: 12 livrables ─── */
const mockLivrables: Livrable[] = [
  {
    id: 'l1', beneficiaryId: 'b1', beneficiaryName: 'Amadou Diallo', beneficiaryInitials: 'AD',
    type: 'business_plan', title: 'Business Plan - Restaurant Afrika Fusion', status: 'READY',
    createdAt: '2025-01-28', notes: '', content: 'Business plan complet avec etude de marche, projections financieres sur 3 ans et plan operationnel.',
  },
  {
    id: 'l2', beneficiaryId: 'b2', beneficiaryName: 'Lea Fontaine', beneficiaryInitials: 'LF',
    type: 'pitch_deck', title: 'Pitch Deck - EcoTech Solutions', status: 'READY',
    createdAt: '2025-01-30', notes: '', content: 'Presentation investisseur de 15 slides couvrant le probleme, la solution, le marche, le modele economique et l\'equipe.',
  },
  {
    id: 'l3', beneficiaryId: 'b3', beneficiaryName: 'Marc Renaud', beneficiaryInitials: 'MR',
    type: 'executive_summary', title: 'Resume Executif - Atelier Numerique', status: 'VALIDATED',
    createdAt: '2025-01-15', notes: 'Très bon resume, quelques ajustements sur les chiffres.', content: 'Resume de 2 pages presentant la vision, le marche cible et les previsions financieres.',
  },
  {
    id: 'l4', beneficiaryId: 'b4', beneficiaryName: 'Clara Dubois', beneficiaryInitials: 'CD',
    type: 'financial_forecast', title: 'Previsions Financieres - BoxFit Paris', status: 'READY',
    createdAt: '2025-02-01', notes: '', content: 'Tableau financier detaille : compte de resultat, tresorerie et bilan previsionnel sur 3 ans.',
  },
  {
    id: 'l5', beneficiaryId: 'b5', beneficiaryName: 'Karim Benali', beneficiaryInitials: 'KB',
    type: 'passport', title: 'Passport Creation - SnapClean', status: 'VALIDATED',
    createdAt: '2025-01-20', notes: 'Document complet et bien structure.', content: 'Fiche passport avec presentation du projet, du porteur et de l\'avancement.',
  },
  {
    id: 'l6', beneficiaryId: 'b6', beneficiaryName: 'Julie Moreau', beneficiaryInitials: 'JM',
    type: 'business_plan', title: 'Business Plan - Papillon Events', status: 'DRAFT',
    createdAt: '2025-02-02', notes: '', content: 'Business plan en cours de redaction. Sections marche et finances a completer.',
  },
  {
    id: 'l7', beneficiaryId: 'b7', beneficiaryName: 'Thomas Leroy', beneficiaryInitials: 'TL',
    type: 'market_study', title: 'Etude de Marche - UrbanFarm IDf', status: 'DRAFT',
    createdAt: '2025-02-03', notes: '', content: 'Etude de marche sur l\'agriculture urbaine en Ile-de-France. Enquete clients en cours.',
  },
  {
    id: 'l8', beneficiaryId: 'b8', beneficiaryName: 'Fatima Hassani', beneficiaryInitials: 'FH',
    type: 'canvas', title: 'Business Model Canvas - CraftID', status: 'VALIDATED',
    createdAt: '2025-01-25', notes: 'Canvas bien rempli, hypotheses claires.', content: 'Business Model Canvas complet avec 9 blocs documentes et hypotheses validees.',
  },
  {
    id: 'l9', beneficiaryId: 'b1', beneficiaryName: 'Amadou Diallo', beneficiaryInitials: 'AD',
    type: 'financial_forecast', title: 'Previsions Financieres - Afrika Fusion', status: 'EXPORTED',
    createdAt: '2025-01-10', notes: 'Exporte pour demande de pret bancaire.', content: 'Previsions financieres validees et exportees pour le dossier de financement.',
  },
  {
    id: 'l10', beneficiaryId: 'b9', beneficiaryName: 'Hugo Petit', beneficiaryInitials: 'HP',
    type: 'executive_summary', title: 'Resume Executif - TechLab93', status: 'DRAFT',
    createdAt: '2025-02-04', notes: '', content: 'Premier jet du resume executif. Version a ameliorer.',
  },
  {
    id: 'l11', beneficiaryId: 'b10', beneficiaryName: 'Nadia Bouzid', beneficiaryInitials: 'NB',
    type: 'pitch_deck', title: 'Pitch Deck - MedConnect', status: 'VALIDATED',
    createdAt: '2025-01-22', notes: 'Design professionnel, storytelling efficace.', content: 'Pitch deck de 12 slides pour lever des fonds aupres de business angels.',
  },
  {
    id: 'l12', beneficiaryId: 'b4', beneficiaryName: 'Clara Dubois', beneficiaryInitials: 'CD',
    type: 'passport', title: 'Passport Creation - BoxFit Paris', status: 'READY',
    createdAt: '2025-02-05', notes: '', content: 'Fiche passport mise a jour avec les derniers elements du projet.',
  },
]

/* ─── Helper ─── */
function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ═══════════════════════════════════════════════════════════
   Livrables Component
   ═══════════════════════════════════════════════════════════ */
export function LivrablesView() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [tabFilter, setTabFilter] = useState<TabFilter>('all')
  const [livrables, setLivrables] = useState(mockLivrables)

  /* Detail dialog */
  const [selectedLivrable, setSelectedLivrable] = useState<Livrable | null>(null)
  const [detailNotes, setDetailNotes] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)

  /* ─── Filtered data ─── */
  const filteredLivrables = useMemo(() => {
    return livrables.filter((l) => {
      const matchSearch = !search ||
        l.beneficiaryName.toLowerCase().includes(search.toLowerCase()) ||
        l.title.toLowerCase().includes(search.toLowerCase())
      const matchType = !filterType || l.type === filterType
      const matchStatus = tabFilter === 'all' || l.status === tabFilter
      return matchSearch && matchType && matchStatus
    })
  }, [livrables, search, filterType, tabFilter])

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    return {
      total: livrables.length,
      enAttente: livrables.filter((l) => l.status === 'DRAFT').length,
      aValider: livrables.filter((l) => l.status === 'READY').length,
      validesCeMois: livrables.filter((l) => {
        if (l.status !== 'VALIDATED') return false
        const d = new Date(l.createdAt)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
      }).length,
    }
  }, [livrables])

  /* ─── Open detail ─── */
  const openDetail = (livrable: Livrable) => {
    setSelectedLivrable(livrable)
    setDetailNotes(livrable.notes || '')
    setDetailOpen(true)
  }

  /* ─── Validate / Reject ─── */
  const handleValidate = () => {
    if (!selectedLivrable) return
    setLivrables((prev) =>
      prev.map((l) => (l.id === selectedLivrable.id ? { ...l, status: 'VALIDATED' as const, notes: detailNotes } : l))
    )
    toast.success(`Livrable valide : ${selectedLivrable.title}`)
    setDetailOpen(false)
  }

  const handleReject = () => {
    if (!selectedLivrable) return
    setLivrables((prev) =>
      prev.map((l) => (l.id === selectedLivrable.id ? { ...l, status: 'DRAFT' as const, notes: detailNotes } : l))
    )
    toast.error(`Livrable refuse : ${selectedLivrable.title}`)
    setDetailOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Livrables</h2>
          <Badge variant="secondary" className="text-xs">{stats.total}</Badge>
        </div>
        <Select
          value={filterType}
          onValueChange={(v) => setFilterType(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="business_plan">Business Plan</SelectItem>
            <SelectItem value="executive_summary">Executive Summary</SelectItem>
            <SelectItem value="pitch_deck">Pitch Deck</SelectItem>
            <SelectItem value="financial_forecast">Previsions Financieres</SelectItem>
            <SelectItem value="passport">Passport</SelectItem>
            <SelectItem value="market_study">Etude de Marche</SelectItem>
            <SelectItem value="canvas">Business Model Canvas</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total livrables', value: stats.total, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'En attente', value: stats.enAttente, color: 'text-muted-foreground', bg: 'bg-muted' },
          { label: 'A valider', value: stats.aValider, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Valides ce mois', value: stats.validesCeMois, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <Card className="border-none shadow-sm bg-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tab filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabFilters.map((tab) => (
          <Button
            key={tab.id}
            variant={tabFilter === tab.id ? 'default' : 'outline'}
            size="sm"
            className="shrink-0 text-xs"
            onClick={() => setTabFilter(tab.id)}
          >
            {tab.label}
            {tab.id === 'READY' && stats.aValider > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 text-[10px] px-1.5 bg-amber-100 text-amber-700">
                {stats.aValider}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par beneficiaire ou titre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Livrable cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredLivrables.map((livrable, i) => {
            const type = typeConfig[livrable.type]
            const status = statusConfig[livrable.status]
            const StatusIcon = status.icon

            return (
              <motion.div
                key={livrable.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                layout
              >
                <Card
                  className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
                  onClick={() => openDetail(livrable)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Beneficiary + type */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                          {livrable.beneficiaryInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-foreground truncate flex-1">
                        {livrable.beneficiaryName}
                      </span>
                      <Badge variant="secondary" className={`text-[10px] px-2 py-0 shrink-0 ${type.color}`}>
                        {type.label}
                      </Badge>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                      {livrable.title}
                    </p>

                    {/* Date + status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDateFr(livrable.createdAt)}
                      </span>
                      <Badge variant="secondary" className={`text-[10px] px-2 py-0 gap-1 ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDetail(livrable)
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        Apercu
                      </Button>
                      {livrable.status === 'READY' && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedLivrable(livrable)
                              setDetailNotes(livrable.notes || '')
                              handleValidate()
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedLivrable(livrable)
                              setDetailNotes(livrable.notes || '')
                              handleReject()
                            }}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredLivrables.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">Aucun livrable trouve</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Essayez de modifier vos criteres de recherche
          </p>
        </motion.div>
      )}

      {/* Livrable detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          {selectedLivrable && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selectedLivrable.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px] font-bold bg-primary/10 text-primary">
                      {selectedLivrable.beneficiaryInitials}
                    </AvatarFallback>
                  </Avatar>
                  {selectedLivrable.beneficiaryName}
                  <Separator orientation="vertical" className="h-4" />
                  {formatDateFr(selectedLivrable.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Type + Status badges */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={typeConfig[selectedLivrable.type].color}>
                    {typeConfig[selectedLivrable.type].label}
                  </Badge>
                  <Badge variant="secondary" className={statusConfig[selectedLivrable.status].color}>
                    {statusConfig[selectedLivrable.status].label}
                  </Badge>
                </div>

                {/* Content */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Contenu</p>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedLivrable.content || 'Aucun contenu disponible.'}
                    </p>
                  </div>
                </div>

                {/* Notes textarea */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Notes du conseiller
                  </label>
                  <Textarea
                    placeholder="Ajouter vos observations, remarques ou recommandations..."
                    value={detailNotes}
                    onChange={(e) => setDetailNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Fermer
                </Button>
                {selectedLivrable.status === 'READY' && (
                  <>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleReject}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Refuser
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleValidate}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Valider
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
