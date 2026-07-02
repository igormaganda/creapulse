'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useConseillerStore } from './conseiller-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  Clock,
  ArrowRight,
  User,
} from 'lucide-react'

/* ─── Types ─── */
export interface Beneficiary {
  id: string
  firstName: string
  lastName: string
  email: string
  projectTitle: string
  sector: string
  journeyPhase: string
  progress: number
  lastActivity: string
  status: 'actif' | 'en_attente' | 'inactif'
  conseiller: string
}

/* ─── Mock data ─── */
const mockBeneficiaires: Beneficiary[] = [
  {
    id: 'b1',
    firstName: 'Amadou',
    lastName: 'Diallo',
    email: 'amadou.diallo@email.com',
    projectTitle: 'Plateforme de livraison locale bio',
    sector: 'Agroalimentaire',
    journeyPhase: 'Structurer',
    progress: 45,
    lastActivity: 'Il y a 2 heures',
    status: 'actif',
    conseiller: 'Sophie Martin',
  },
  {
    id: 'b2',
    firstName: 'Lea',
    lastName: 'Fontaine',
    email: 'lea.fontaine@email.com',
    projectTitle: 'Studio de yoga et bien-etre',
    sector: 'Bien-etre',
    journeyPhase: 'Financer',
    progress: 72,
    lastActivity: 'Il y a 3 heures',
    status: 'actif',
    conseiller: 'Sophie Martin',
  },
  {
    id: 'b3',
    firstName: 'Marc',
    lastName: 'Renaud',
    email: 'marc.renaud@email.com',
    projectTitle: 'Application de gestion locative',
    sector: 'Immobilier',
    journeyPhase: 'Idee',
    progress: 18,
    lastActivity: 'Il y a 1 jour',
    status: 'actif',
    conseiller: 'Sophie Martin',
  },
  {
    id: 'b4',
    firstName: 'Clara',
    lastName: 'Dubois',
    email: 'clara.dubois@email.com',
    projectTitle: 'Boutique de mode ethique en ligne',
    sector: 'Commerce',
    journeyPhase: 'Lancer',
    progress: 88,
    lastActivity: 'Il y a 5 heures',
    status: 'actif',
    conseiller: 'Sophie Martin',
  },
  {
    id: 'b5',
    firstName: 'Karim',
    lastName: 'Benali',
    email: 'karim.benali@email.com',
    projectTitle: 'Service de nettoyage ecologique',
    sector: 'Services',
    journeyPhase: 'Structurer',
    progress: 35,
    lastActivity: 'Il y a 3 jours',
    status: 'en_attente',
    conseiller: 'Sophie Martin',
  },
  {
    id: 'b6',
    firstName: 'Julie',
    lastName: 'Moreau',
    email: 'julie.moreau@email.com',
    projectTitle: 'Cuisine traiteur vegan',
    sector: 'Restauration',
    journeyPhase: 'Idee',
    progress: 10,
    lastActivity: 'Il y a 1 semaine',
    status: 'inactif',
    conseiller: 'Sophie Martin',
  },
  {
    id: 'b7',
    firstName: 'Thomas',
    lastName: 'Leroy',
    email: 'thomas.leroy@email.com',
    projectTitle: 'Salle d\'escalade et coworking',
    sector: 'Sport',
    journeyPhase: 'Financer',
    progress: 60,
    lastActivity: 'Il y a 12 heures',
    status: 'actif',
    conseiller: 'Sophie Martin',
  },
  {
    id: 'b8',
    firstName: 'Fatima',
    lastName: 'Hassani',
    email: 'fatima.hassani@email.com',
    projectTitle: 'Agence de communication digitale',
    sector: 'Communication',
    journeyPhase: 'Structurer',
    progress: 52,
    lastActivity: 'Il y a 6 heures',
    status: 'actif',
    conseiller: 'Sophie Martin',
  },
  {
    id: 'b9',
    firstName: 'Hugo',
    lastName: 'Petit',
    email: 'hugo.petit@email.com',
    projectTitle: 'Atelier de menuiserie artisanale',
    sector: 'Artisanat',
    journeyPhase: 'Idee',
    progress: 5,
    lastActivity: 'Il y a 2 jours',
    status: 'actif',
    conseiller: 'Sophie Martin',
  },
  {
    id: 'b10',
    firstName: 'Nadia',
    lastName: 'Bouzid',
    email: 'nadia.bouzid@email.com',
    projectTitle: 'Cabinet de coaching scolaire',
    sector: 'Education',
    journeyPhase: 'Financer',
    progress: 78,
    lastActivity: 'Il y a 1 jour',
    status: 'actif',
    conseiller: 'Sophie Martin',
  },
]

/* ─── Phase badges ─── */
const phaseConfig: Record<string, { color: string; variant: 'default' | 'secondary' | 'outline' }> = {
  Idee: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', variant: 'secondary' },
  Structurer: { color: 'bg-teal-100 text-primary dark:bg-teal-900/40 dark:text-teal-300', variant: 'secondary' },
  Financer: { color: 'bg-coral-50 text-coral-500 dark:bg-coral-900/20 dark:text-coral-400', variant: 'secondary' },
  Lancer: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', variant: 'secondary' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  actif: { label: 'Actif', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  inactif: { label: 'Inactif', color: 'bg-muted text-muted-foreground' },
}

const ITEMS_PER_PAGE = 6

/* ─── Beneficiaires List ─── */
export function BeneficiairesList() {
  const { filters, setFilters, selectBeneficiary } = useConseillerStore()
  const [currentPage, setCurrentPage] = useState(1)

  /* Filter logic */
  const filteredBeneficiaires = useMemo(() => {
    return mockBeneficiaires.filter((b) => {
      const searchLower = filters.search.toLowerCase()
      const matchSearch =
        !searchLower ||
        `${b.firstName} ${b.lastName}`.toLowerCase().includes(searchLower) ||
        b.email.toLowerCase().includes(searchLower) ||
        b.projectTitle.toLowerCase().includes(searchLower)

      const matchStatus = !filters.status || b.status === filters.status
      const matchPhase = !filters.journeyPhase || b.journeyPhase === filters.journeyPhase

      return matchSearch && matchStatus && matchPhase
    })
  }, [filters])

  const totalPages = Math.ceil(filteredBeneficiaires.length / ITEMS_PER_PAGE)
  const paginatedBeneficiaires = filteredBeneficiaires.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const activeFilterCount = [filters.search, filters.status, filters.journeyPhase].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Beneficiaires</h2>
          <p className="text-sm text-muted-foreground">
            {filteredBeneficiaires.length} beneficiaire{filteredBeneficiaires.length > 1 ? 's' : ''} dans votre portefeuille
          </p>
        </div>
        <Badge variant="secondary" className="w-fit text-xs">
          Portefeuille : {mockBeneficiaires.length} beneficiaires
        </Badge>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou projet..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ search: e.target.value })
                  setCurrentPage(1)
                }}
                className="pl-9"
              />
              {filters.search && (
                <button
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setFilters({ search: '' })}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <Select
              value={filters.status}
              onValueChange={(v) => {
                setFilters({ status: v === 'all' ? '' : v })
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>

            {/* Phase filter */}
            <Select
              value={filters.journeyPhase}
              onValueChange={(v) => {
                setFilters({ journeyPhase: v === 'all' ? '' : v })
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les phases</SelectItem>
                <SelectItem value="Idee">Idee</SelectItem>
                <SelectItem value="Structurer">Structurer</SelectItem>
                <SelectItem value="Financer">Financer</SelectItem>
                <SelectItem value="Lancer">Lancer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Filtres actifs :</span>
              {filters.search && (
                <Badge variant="outline" className="text-xs gap-1">
                  &ldquo;{filters.search}&rdquo;
                  <button onClick={() => setFilters({ search: '' })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.status && (
                <Badge variant="outline" className="text-xs gap-1">
                  {statusConfig[filters.status]?.label || filters.status}
                  <button onClick={() => setFilters({ status: '' })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.journeyPhase && (
                <Badge variant="outline" className="text-xs gap-1">
                  {filters.journeyPhase}
                  <button onClick={() => setFilters({ journeyPhase: '' })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={() => {
                  useConseillerStore.getState().resetFilters()
                  setCurrentPage(1)
                }}
                className="text-xs text-primary hover:underline"
              >
                Reinitialiser
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Beneficiary cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paginatedBeneficiaires.map((b, i) => {
          const phase = phaseConfig[b.journeyPhase]
          const status = statusConfig[b.status]
          const initials = `${(b.firstName || '')[0] || ''}${(b.lastName || '')[0] || ''}`.toUpperCase()

          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card
                className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
                onClick={() => selectBeneficiary(b.id)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Top: avatar + name + status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {b.firstName} {b.lastName}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[140px]">{b.email}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 ${status.color}`}>
                      {status.label}
                    </Badge>
                  </div>

                  {/* Project */}
                  <div>
                    <p className="text-sm font-medium text-foreground line-clamp-1">{b.projectTitle}</p>
                    <p className="text-xs text-muted-foreground">{b.sector}</p>
                  </div>

                  {/* Phase + Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 ${phase.color}`}>
                        {b.journeyPhase}
                      </Badge>
                      <span className="text-xs font-medium text-foreground">{b.progress}%</span>
                    </div>
                    <Progress value={b.progress} className="h-1.5" />
                  </div>

                  {/* Bottom: last activity + arrow */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {b.lastActivity}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Empty state */}
      {paginatedBeneficiaires.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">Aucun beneficiaire trouve</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Essayez de modifier vos criteres de recherche
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              useConseillerStore.getState().resetFilters()
              setCurrentPage(1)
            }}
          >
            Reinitialiser les filtres
          </Button>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
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
