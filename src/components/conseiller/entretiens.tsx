'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConseillerStore } from './conseiller-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Calendar,
  Clock,
  MessageSquare,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'

/* ─── Types ─── */
type EntretienType = 'bilan' | 'suivi' | 'atelier'
type EntretienStatus = 'planifie' | 'confirme' | 'termine'

interface Entretien {
  id: string
  date: string
  time: string
  beneficiaryId: string
  beneficiaryName: string
  beneficiaryInitials: string
  type: EntretienType
  status: EntretienStatus
  conseiller: string
  notes?: string
}

/* ─── Badge configs ─── */
const typeConfig: Record<EntretienType, { label: string; color: string }> = {
  bilan: {
    label: 'Bilan',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  },
  suivi: {
    label: 'Suivi',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  atelier: {
    label: 'Atelier',
    color: 'bg-coral-50 text-coral-500 dark:bg-coral-900/20 dark:text-coral-400',
  },
}

const statusConfig: Record<EntretienStatus, { label: string; color: string; dotColor: string }> = {
  planifie: {
    label: 'Planifie',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    dotColor: 'bg-blue-500',
  },
  confirme: {
    label: 'Confirme',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  termine: {
    label: 'Termine',
    color: 'bg-muted text-muted-foreground',
    dotColor: 'bg-muted-foreground',
  },
}

/* ─── Mock data ─── */
const mockEntretiens: Entretien[] = [
  {
    id: 'e1',
    date: '2025-02-03',
    time: '10:00',
    beneficiaryId: 'b1',
    beneficiaryName: 'Amadou Diallo',
    beneficiaryInitials: 'AD',
    type: 'suivi',
    status: 'confirme',
    conseiller: 'Sophie Martin',
    notes: 'Suivi du business plan. Verifier les hypotheses de prix.',
  },
  {
    id: 'e2',
    date: '2025-02-03',
    time: '14:00',
    beneficiaryId: 'b2',
    beneficiaryName: 'Lea Fontaine',
    beneficiaryInitials: 'LF',
    type: 'bilan',
    status: 'planifie',
    conseiller: 'Sophie Martin',
    notes: 'Bilan trimestriel. Revision du plan financier.',
  },
  {
    id: 'e3',
    date: '2025-02-04',
    time: '09:30',
    beneficiaryId: 'b3',
    beneficiaryName: 'Marc Renaud',
    beneficiaryInitials: 'MR',
    type: 'atelier',
    status: 'planifie',
    conseiller: 'Sophie Martin',
    notes: 'Atelier creation - model Canvas.',
  },
  {
    id: 'e4',
    date: '2025-02-05',
    time: '11:00',
    beneficiaryId: 'b4',
    beneficiaryName: 'Clara Dubois',
    beneficiaryInitials: 'CD',
    type: 'suivi',
    status: 'confirme',
    conseiller: 'Sophie Martin',
    notes: 'Suivi post-lancement. Analyse des premieres ventes.',
  },
  {
    id: 'e5',
    date: '2025-02-06',
    time: '15:00',
    beneficiaryId: 'b7',
    beneficiaryName: 'Thomas Leroy',
    beneficiaryInitials: 'TL',
    type: 'bilan',
    status: 'planifie',
    conseiller: 'Sophie Martin',
    notes: 'Bilan de mi-parcours. Point sur le choix du statut juridique.',
  },
  {
    id: 'e6',
    date: '2025-02-07',
    time: '10:30',
    beneficiaryId: 'b8',
    beneficiaryName: 'Fatima Hassani',
    beneficiaryInitials: 'FH',
    type: 'suivi',
    status: 'planifie',
    conseiller: 'Sophie Martin',
    notes: 'Suivi sur la strategie de communication digitale.',
  },
  {
    id: 'e7',
    date: '2025-02-10',
    time: '09:00',
    beneficiaryId: 'b9',
    beneficiaryName: 'Hugo Petit',
    beneficiaryInitials: 'HP',
    type: 'atelier',
    status: 'planifie',
    conseiller: 'Sophie Martin',
    notes: 'Atelier financement - presentation des aides GIDEF.',
  },
  {
    id: 'e8',
    date: '2025-01-27',
    time: '10:00',
    beneficiaryId: 'b1',
    beneficiaryName: 'Amadou Diallo',
    beneficiaryInitials: 'AD',
    type: 'suivi',
    status: 'termine',
    conseiller: 'Sophie Martin',
    notes: 'Avancement du business plan. Points de vigilance sur la logistique.',
  },
]

/* ─── Beneficiary list for select ─── */
const mockBeneficiairesList = [
  { id: 'b1', name: 'Amadou Diallo' },
  { id: 'b2', name: 'Lea Fontaine' },
  { id: 'b3', name: 'Marc Renaud' },
  { id: 'b4', name: 'Clara Dubois' },
  { id: 'b5', name: 'Karim Benali' },
  { id: 'b6', name: 'Julie Moreau' },
  { id: 'b7', name: 'Thomas Leroy' },
  { id: 'b8', name: 'Fatima Hassani' },
  { id: 'b9', name: 'Hugo Petit' },
  { id: 'b10', name: 'Nadia Bouzid' },
]

/* ─── Helper: format date in French ─── */
function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) >= new Date(new Date().toDateString())
}

/* ─── ITEMS_PER_PAGE ─── */
const ITEMS_PER_PAGE = 6

/* ═══════════════════════════════════════════════════════════
   Entretiens Component
   ═══════════════════════════════════════════════════════════ */
export function EntretiensView() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)

  /* ─── New entretien form ─── */
  const [newBeneficiary, setNewBeneficiary] = useState('')
  const [newType, setNewType] = useState<string>('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newNotes, setNewNotes] = useState('')

  /* ─── Filter logic ─── */
  const filteredEntretiens = useMemo(() => {
    return mockEntretiens.filter((e) => {
      const matchSearch =
        !search ||
        e.beneficiaryName.toLowerCase().includes(search.toLowerCase()) ||
        e.conseiller.toLowerCase().includes(search.toLowerCase())

      const matchType = !filterType || e.type === filterType
      const matchStatus = !filterStatus || e.status === filterStatus

      return matchSearch && matchType && matchStatus
    })
  }, [search, filterType, filterStatus])

  const totalPages = Math.ceil(filteredEntretiens.length / ITEMS_PER_PAGE)
  const paginatedEntretiens = filteredEntretiens.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const activeFilterCount = [search, filterType, filterStatus].filter(Boolean).length

  /* ─── Stats ─── */
  const upcomingCount = mockEntretiens.filter((e) => isUpcoming(e.date) && e.status !== 'termine').length
  const todayCount = mockEntretiens.filter(
    (e) => e.date === new Date().toISOString().split('T')[0] && e.status !== 'termine'
  ).length

  /* ─── Reset filters ─── */
  const resetFilters = () => {
    setSearch('')
    setFilterType('')
    setFilterStatus('')
    setCurrentPage(1)
  }

  /* ─── Submit new entretien ─── */
  const handleSubmit = () => {
    if (!newBeneficiary || !newType || !newDate || !newTime) return
    const b = mockBeneficiairesList.find((b) => b.id === newBeneficiary)
    if (!b) return
    const initials = `${b.name.split(' ')[0][0]}${b.name.split(' ').slice(-1)[0][0]}`.toUpperCase()
    const newEntretien: Entretien = {
      id: `e${mockEntretiens.length + 1}`,
      date: newDate,
      time: newTime,
      beneficiaryId: newBeneficiary,
      beneficiaryName: b.name,
      beneficiaryInitials: initials,
      type: newType as EntretienType,
      status: 'planifie',
      conseiller: 'Sophie Martin',
      notes: newNotes || undefined,
    }
    mockEntretiens.push(newEntretien)
    setDialogOpen(false)
    setNewBeneficiary('')
    setNewType('')
    setNewDate('')
    setNewTime('')
    setNewNotes('')
    setCurrentPage(1)
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
        <div>
          <h2 className="text-xl font-bold text-foreground">Entretiens</h2>
          <p className="text-sm text-muted-foreground">
            {upcomingCount} entretien{upcomingCount > 1 ? 's' : ''} a venir
            {todayCount > 0 && ` · ${todayCount} aujourd'hui`}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvel entretien
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Planifier un nouvel entretien</DialogTitle>
              <DialogDescription>
                Remplissez les informations ci-dessous pour planifier un entretien avec un beneficiaire.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Beneficiary select */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Beneficiaire <span className="text-destructive">*</span>
                </label>
                <Select value={newBeneficiary} onValueChange={setNewBeneficiary}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un beneficiaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockBeneficiairesList.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type select */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Type d&apos;entretien <span className="text-destructive">*</span>
                </label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bilan">Bilan</SelectItem>
                    <SelectItem value="suivi">Suivi</SelectItem>
                    <SelectItem value="atelier">Atelier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date + Time row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Heure <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes textarea */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notes</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="Ajouter des notes ou l'objet de l'entretien..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!newBeneficiary || !newType || !newDate || !newTime}
              >
                Planifier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'A venir', value: upcomingCount, color: 'text-primary', bg: 'bg-primary/10' },
          { label: "Aujourd'hui", value: todayCount, color: 'text-coral-500', bg: 'bg-coral-50' },
          { label: 'Bilan', value: mockEntretiens.filter((e) => e.type === 'bilan' && e.status !== 'termine').length, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Termines', value: mockEntretiens.filter((e) => e.status === 'termine').length, color: 'text-muted-foreground', bg: 'bg-muted' },
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

      {/* Search + Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par beneficiaire ou conseiller..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9"
              />
              {search && (
                <button
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch('')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Type filter */}
            <Select
              value={filterType}
              onValueChange={(v) => {
                setFilterType(v === 'all' ? '' : v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="bilan">Bilan</SelectItem>
                <SelectItem value="suivi">Suivi</SelectItem>
                <SelectItem value="atelier">Atelier</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select
              value={filterStatus}
              onValueChange={(v) => {
                setFilterStatus(v === 'all' ? '' : v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="planifie">Planifie</SelectItem>
                <SelectItem value="confirme">Confirme</SelectItem>
                <SelectItem value="termine">Termine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Filtres actifs :</span>
              {search && (
                <Badge variant="outline" className="text-xs gap-1">
                  &ldquo;{search}&rdquo;
                  <button onClick={() => setSearch('')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterType && (
                <Badge variant="outline" className="text-xs gap-1">
                  {typeConfig[filterType as EntretienType]?.label || filterType}
                  <button onClick={() => setFilterType('')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterStatus && (
                <Badge variant="outline" className="text-xs gap-1">
                  {statusConfig[filterStatus as EntretienStatus]?.label || filterStatus}
                  <button onClick={() => setFilterStatus('')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={resetFilters}
                className="text-xs text-primary hover:underline"
              >
                Reinitialiser
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entretien cards list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {paginatedEntretiens.map((entretien, i) => {
            const type = typeConfig[entretien.type]
            const status = statusConfig[entretien.status]
            const upcoming = isUpcoming(entretien.date) && entretien.status !== 'termine'

            return (
              <motion.div
                key={entretien.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                layout
              >
                <Card
                  className={`group transition-all duration-200 hover:shadow-md ${
                    upcoming
                      ? 'border-primary/20 hover:border-primary/40'
                      : 'border-border'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Left: avatar */}
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className={`text-xs font-bold ${
                          entretien.status === 'termine'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          {entretien.beneficiaryInitials}
                        </AvatarFallback>
                      </Avatar>

                      {/* Center: info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-sm font-semibold text-foreground ${
                            entretien.status === 'termine' ? 'line-through opacity-60' : ''
                          }`}>
                            {entretien.beneficiaryName}
                          </p>
                          <Badge variant="secondary" className={`text-[10px] px-2 py-0 ${type.color}`}>
                            {type.label}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-2 py-0 gap-1 ${status.color}`}
                          >
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
                            {status.label}
                          </Badge>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateFr(entretien.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entretien.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {entretien.conseiller}
                          </span>
                        </div>

                        {entretien.notes && (
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
                            {entretien.notes}
                          </p>
                        )}
                      </div>

                      {/* Right: type icon */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        entretien.status === 'termine'
                          ? 'bg-muted'
                          : upcoming
                            ? 'bg-primary/10'
                            : 'bg-muted'
                      }`}>
                        <MessageSquare className={`h-4 w-4 ${
                          entretien.status === 'termine'
                            ? 'text-muted-foreground'
                            : upcoming
                              ? 'text-primary'
                              : 'text-muted-foreground'
                        }`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Empty state */}
        {paginatedEntretiens.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground">Aucun entretien trouve</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Essayez de modifier vos criteres de recherche
            </p>
            <Button variant="outline" className="mt-4" onClick={resetFilters}>
              Reinitialiser les filtres
            </Button>
          </motion.div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
