'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Star,
  LayoutGrid,
  List,
  ChevronRight,
  SlidersHorizontal,
  X,
  Building2,
  Sparkles,
  GraduationCap,
  Landmark,
  Banknote,
  TrendingUp,
  Users,
  BookOpen,
  CircleHelp,
  Loader2,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { DemoBadge } from '@/lib/hooks/use-api-data'

// ─── Types ──────────────────────────────────

type ActorType =
  | 'GIDEF'
  | 'INCUBATOR'
  | 'PEPITE'
  | 'CCI'
  | 'BANK'
  | 'INVESTOR'
  | 'MENTOR'
  | 'FORMATION'
  | 'OTHER'

interface Actor {
  id: string
  name: string
  type: ActorType
  category?: string | null
  city: string
  region?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  description?: string | null
  services?: string[] | null
  featured: boolean
  successRate?: number | null
}

// ─── Constants ──────────────────────────────

const ACTOR_TYPE_CONFIG: Record<
  ActorType,
  { label: string; color: string; bgColor: string; icon: typeof Building2 }
> = {
  GIDEF: {
    label: 'Agence GIDEF',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    icon: Building2,
  },
  INCUBATOR: {
    label: 'Incubateur',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    icon: Sparkles,
  },
  PEPITE: {
    label: 'Pépite',
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    icon: GraduationCap,
  },
  CCI: {
    label: 'CCI',
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-900/20',
    icon: Landmark,
  },
  BANK: {
    label: 'Banque',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: Banknote,
  },
  INVESTOR: {
    label: 'Investisseur',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    icon: TrendingUp,
  },
  MENTOR: {
    label: 'Mentor',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    icon: Users,
  },
  FORMATION: {
    label: 'Formation',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: BookOpen,
  },
  OTHER: {
    label: 'Autre',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    icon: CircleHelp,
  },
}

const CITIES_IDF = [
  'Paris',
  'Créteil',
  'Nanterre',
  'Bobigny',
  'Versailles',
  'Saint-Denis',
  'Montreuil',
  'Boulogne-Billancourt',
  'Argenteuil',
  'Rouen',
  'Evry-Courcouronnes',
  'Aubervilliers',
  'Levallois-Perret',
  'Vitry-sur-Seine',
  'Colombes',
]

// ─── Mock Data ──────────────────────────────

const MOCK_ACTORS: Actor[] = [
  {
    id: 'mock-1',
    name: 'GIDEF Paris Centre',
    type: 'GIDEF',
    category: 'Agence principale',
    city: 'Paris',
    region: 'Île-de-France',
    address: '45 Rue de Rivoli, 75004 Paris',
    phone: '01 42 72 60 00',
    email: 'paris-centre@gidef.fr',
    website: 'https://www.gidef.fr',
    description:
      'Agence GIDEF de Paris Centre, accompagnement complet des créateurs et repreneurs d\'entreprise dans le cœur de Paris.',
    services: ['Création d\'entreprise', 'Formation', 'Financement', 'Mentorat', 'Réseau'],
    featured: true,
    successRate: 78,
  },
  {
    id: 'mock-2',
    name: 'GIDEF Créteil Val-de-Marne',
    type: 'GIDEF',
    category: 'Agence départementale',
    city: 'Créteil',
    region: 'Île-de-France',
    address: '12 Avenue du Général de Gaulle, 94000 Créteil',
    phone: '01 45 13 50 00',
    email: 'creteil@gidef.fr',
    website: 'https://www.gidef.fr',
    description:
      'L\'agence GIDEF du Val-de-Marne accompagne les porteurs de projets du département.',
    services: ['Création d\'entreprise', 'Diagnostic', 'Ateliers', 'Réseau'],
    featured: true,
    successRate: 72,
  },
  {
    id: 'mock-3',
    name: 'Incubateur Paris Innovation',
    type: 'INCUBATOR',
    category: 'Incubateur numérique',
    city: 'Paris',
    region: 'Île-de-France',
    address: '88 Rue de la Fédération, 75015 Paris',
    phone: '01 56 78 90 12',
    email: 'contact@parisinnovation.fr',
    website: 'https://www.parisinnovation.fr',
    description:
      'Incubateur dédié aux startups innovantes, avec un programme d\'accompagnement de 18 mois et des locaux partagés.',
    services: ['Hébergement', 'Mentorat', 'Réseau investisseurs', 'Workshops'],
    featured: true,
    successRate: 85,
  },
  {
    id: 'mock-4',
    name: 'Pépite Paris-Descartes',
    type: 'PEPITE',
    category: 'Pépite étudiante',
    city: 'Paris',
    region: 'Île-de-France',
    address: '15 Rue de l\'École de Médecine, 75006 Paris',
    phone: '01 44 27 55 00',
    email: 'pepite@paris-descartes.fr',
    website: 'https://www.pepite-paris.fr',
    description:
      'Pépite étudiante favorisant l\'entrepreneuriat parmi les étudiants et jeunes diplômés.',
    services: ['Statut étudiant-entrepreneur', 'Formation', 'Coaching', 'Financement'],
    featured: false,
    successRate: 68,
  },
  {
    id: 'mock-5',
    name: 'CCI Paris Île-de-France',
    type: 'CCI',
    category: 'Chambre de Commerce',
    city: 'Paris',
    region: 'Île-de-France',
    address: '2 Place de la Bourse, 75002 Paris',
    phone: '01 55 65 70 00',
    email: 'info@cci-paris-idf.fr',
    website: 'https://www.cci-paris-idf.fr',
    description:
      'La CCI Paris Île-de-France propose des services aux entreprises de toute taille.',
    services: ['Formalités création', 'Marchés publics', 'Formation', 'International'],
    featured: true,
    successRate: 90,
  },
  {
    id: 'mock-6',
    name: 'Banque Populaire Rives de Paris',
    type: 'BANK',
    category: 'Banque de proximité',
    city: 'Nanterre',
    region: 'Île-de-France',
    address: '30 Avenue Pablo Picasso, 92000 Nanterre',
    phone: '01 47 24 50 00',
    email: 'entreprises@bp.paris',
    website: 'https://www.banquepopulaire.fr',
    description:
      'Banque spécialisée dans le financement des créateurs d\'entreprise en Île-de-France.',
    services: ['Prêt création', 'Compte professionnel', 'Assurance', 'Crédit immobilier'],
    featured: false,
    successRate: 75,
  },
  {
    id: 'mock-7',
    name: 'XAnge Investissement',
    type: 'INVESTOR',
    category: 'Fonds d\'investissement',
    city: 'Paris',
    region: 'Île-de-France',
    address: '70 Rue Saint-Honoré, 75001 Paris',
    phone: '01 40 15 80 00',
    email: 'invest@xange.com',
    website: 'https://www.xange.com',
    description:
      'Fonds d\'investissement early-stage spécialisé dans les startups tech en France.',
    services: ['Investissement seed', 'Accompagnement stratégique', 'Réseau'],
    featured: true,
    successRate: 82,
  },
  {
    id: 'mock-8',
    name: 'Marie Dupont — Mentor Senior',
    type: 'MENTOR',
    category: 'Mentorat',
    city: 'Versailles',
    region: 'Île-de-France',
    phone: '06 12 34 56 78',
    email: 'marie.dupont@mentor.fr',
    description:
      'Ancienne directrice de PME, Marie accompagne les créateurs sur les aspects stratégiques et financiers.',
    services: ['Coaching stratégique', 'Préparation financements', 'Réseau'],
    featured: false,
    successRate: 92,
  },
  {
    id: 'mock-9',
    name: 'École de l\'Entrepreneuriat IDF',
    type: 'FORMATION',
    category: 'Formation continue',
    city: 'Bobigny',
    region: 'Île-de-France',
    address: '8 Boulevard de la République, 93000 Bobigny',
    phone: '01 48 30 20 00',
    email: 'contact@eco-entrepreneuriat.fr',
    website: 'https://www.eco-entrepreneuriat.fr',
    description:
      'Centre de formation spécialisé en entrepreneuriat, proposant des certifications reconnues.',
    services: ['Formation création', 'Ateliers pratiques', 'Certification', 'Coaching'],
    featured: false,
    successRate: 70,
  },
  {
    id: 'mock-10',
    name: 'GIDEF Nanterre-La Défense',
    type: 'GIDEF',
    category: 'Agence territoriale',
    city: 'Nanterre',
    region: 'Île-de-France',
    address: '5 Place Nelson Mandela, 92000 Nanterre',
    phone: '01 47 25 60 00',
    email: 'nanterre@gidef.fr',
    website: 'https://www.gidef.fr',
    description:
      'Agence GIDEF de la plateforme de La Défense, accompagnement des projets innovants.',
    services: ['Création d\'entreprise', 'Innovation', 'Mentorat'],
    featured: false,
    successRate: 74,
  },
  {
    id: 'mock-11',
    name: 'Incubateur 93 Entreprendre',
    type: 'INCUBATOR',
    category: 'Incubateur territorial',
    city: 'Bobigny',
    region: 'Île-de-France',
    address: '22 Boulevard Gambetta, 93000 Bobigny',
    phone: '01 41 60 50 00',
    email: 'contact@incubateur93.fr',
    website: 'https://www.incubateur93.fr',
    description:
      'Incubateur du département de la Seine-Saint-Denis, soutenant la création d\'activité locale.',
    services: ['Hébergement', 'Formation', 'Financement solidaire', 'Réseau'],
    featured: false,
    successRate: 66,
  },
  {
    id: 'mock-12',
    name: 'Bpifrance Île-de-France',
    type: 'INVESTOR',
    category: 'Banque publique d\'investissement',
    city: 'Paris',
    region: 'Île-de-France',
    address: '27-31 Avenue du Général Leclerc, 75014 Paris',
    phone: '01 49 78 42 00',
    email: 'idf@bpifrance.fr',
    website: 'https://www.bpifrance.fr',
    description:
      'Bpifrance accompagne les entreprises à chaque étape de leur développement.',
    services: ['Prêt d\'amorçage', 'Aide à l\'innovation', 'Garantie', 'Investissement'],
    featured: true,
    successRate: 88,
  },
  {
    id: 'mock-13',
    name: 'Réseau Entreprendre Île-de-France',
    type: 'OTHER',
    category: 'Réseau associatif',
    city: 'Boulogne-Billancourt',
    region: 'Île-de-France',
    address: '100 Boulevard Jean Jaurès, 92100 Boulogne-Billancourt',
    phone: '01 46 05 20 00',
    email: 'idf@reseau-entreprendre.org',
    website: 'https://www.reseau-entreprendre.org',
    description:
      'Réseau de chefs d\'entreprise bénévoles qui accompagnent les créateurs dans leur parcours.',
    services: ['Mentorat bénévole', 'Parrainage', 'Ateliers', 'Réseau'],
    featured: false,
    successRate: 80,
  },
  {
    id: 'mock-14',
    name: 'CCI Versailles Yvelines',
    type: 'CCI',
    category: 'Chambre de Commerce',
    city: 'Versailles',
    region: 'Île-de-France',
    address: '10 Rue de la Paroisse, 78000 Versailles',
    phone: '01 39 07 40 00',
    email: 'contact@cci-versailles.fr',
    website: 'https://www.cci-versailles.fr',
    description:
      'La CCI de Versailles accompagne les entreprises des Yvelines.',
    services: ['Formalités', 'Formation', 'International', 'Diagnostic'],
    featured: false,
    successRate: 87,
  },
  {
    id: 'mock-15',
    name: 'Pierre Martin — Expert Comptable',
    type: 'OTHER',
    category: 'Conseil',
    city: 'Saint-Denis',
    region: 'Île-de-France',
    address: '15 Rue Gabriel Péri, 93200 Saint-Denis',
    phone: '01 42 43 20 00',
    email: 'p.martin@expert-comptable.fr',
    description:
      'Expert-comptable spécialisé dans l\'accompagnement des créateurs d\'entreprise.',
    services: ['Comptabilité', 'Fiscalité', 'Statuts juridiques', 'Business plan'],
    featured: false,
    successRate: 76,
  },
]

// ─── Reduced Fallback (3-4 items) ──────────

const FALLBACK_ACTORS: Actor[] = [
  MOCK_ACTORS[0],
  MOCK_ACTORS[1],
  MOCK_ACTORS[2],
  MOCK_ACTORS[4],
]

// ─── Component ──────────────────────────────

export function AnnuaireModule() {
  // State
  const [actors, setActors] = useState<Actor[]>([])
  const [featuredActors, setFeaturedActors] = useState<Actor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<ActorType[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('annuaire-favorites')
      if (stored) {
        try {
          const ids: string[] = JSON.parse(stored)
          return new Set(ids)
        } catch {
          // ignore parse errors
        }
      }
    }
    return new Set()
  })
  const [loading, setLoading] = useState(true)
  const [isFallback, setIsFallback] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [visibleCount, setVisibleCount] = useState(12)
  const [isFetching, setIsFetching] = useState(false)

  // Fetch actors from API on mount or when filters change
  const fetchActors = useCallback(async (query: string, types: ActorType[], city: string, append: boolean = false) => {
    setIsFetching(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('search', query.trim())
      if (types.length === 1) params.set('type', types[0])
      if (city) params.set('city', city)
      params.set('limit', '50')

      const res = await fetch(`/api/annuaire?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.success && json.data?.actors?.length > 0) {
        const apiActors: Actor[] = json.data.actors.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          name: a.name as string,
          type: a.type as ActorType,
          category: (a.category as string) ?? null,
          city: (a.city as string) ?? '',
          region: (a.region as string) ?? null,
          address: (a.address as string) ?? null,
          phone: (a.phone as string) ?? null,
          email: (a.email as string) ?? null,
          website: (a.website as string) ?? null,
          description: (a.description as string) ?? null,
          services: (a.services as string[]) ?? null,
          featured: (a.featured as boolean) ?? false,
          successRate: (a.successRate as number) ?? null,
        }))
        if (append) {
          setActors((prev) => {
            const existingIds = new Set(prev.map(a => a.id))
            const newActors = apiActors.filter(a => !existingIds.has(a.id))
            return [...prev, ...newActors]
          })
        } else {
          setActors(apiActors)
          setFeaturedActors(apiActors.filter((a: Actor) => a.featured))
        }
        setIsFallback(false)
      } else {
        if (!append) {
          setActors(FALLBACK_ACTORS)
          setFeaturedActors(FALLBACK_ACTORS.filter((a: Actor) => a.featured))
          setIsFallback(true)
        }
      }
    } catch {
      if (!append) {
        setActors(FALLBACK_ACTORS)
        setFeaturedActors(FALLBACK_ACTORS.filter((a: Actor) => a.featured))
        setIsFallback(true)
      }
    } finally {
      setLoading(false)
      setIsFetching(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchActors('', [], '')
  }, [fetchActors])

  // Re-fetch when filters change
  const filterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current)
    filterTimeoutRef.current = setTimeout(() => {
      fetchActors(searchQuery, selectedTypes, selectedCity)
      setVisibleCount(12)
    }, 300)
    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current)
    }
  }, [searchQuery, selectedTypes, selectedCity, fetchActors])

  // Filter actors
  const filteredActors = useMemo(() => {
    let result = actors

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.services?.some((s) => s.toLowerCase().includes(q)) ||
          a.description?.toLowerCase().includes(q)
      )
    }

    if (selectedTypes.length > 0) {
      result = result.filter((a) => selectedTypes.includes(a.type))
    }

    if (selectedCity) {
      result = result.filter((a) => a.city === selectedCity)
    }

    return result
  }, [actors, searchQuery, selectedTypes, selectedCity])

  const visibleActors = filteredActors.slice(0, visibleCount)
  const hasMore = visibleCount < filteredActors.length

  // Featured filtered
  const filteredFeatured = useMemo(() => {
    let result = featuredActors
    if (selectedTypes.length > 0) {
      result = result.filter((a) => selectedTypes.includes(a.type))
    }
    if (selectedCity) {
      result = result.filter((a) => a.city === selectedCity)
    }
    return result
  }, [featuredActors, selectedTypes, selectedCity])

  // Toggle favorite (local + API)
  const toggleFavorite = useCallback(
    async (actorId: string) => {
      const isCurrentlyFavorite = favoriteIds.has(actorId)
      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (next.has(actorId)) {
          next.delete(actorId)
          toast.info('Favori retiré')
        } else {
          next.add(actorId)
          toast.success('Favori ajouté')
        }
        localStorage.setItem('annuaire-favorites', JSON.stringify([...next]))
        return next
      })
      // Try API call
      try {
        const token = localStorage.getItem('creapulse-token')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch('/api/annuaire/favorites', {
          method: 'POST',
          headers,
          body: JSON.stringify({ actorId }),
        })
        if (res.ok) {
          const json = await res.json()
          // Server confirmed, our optimistic update is correct
        } else {
          // Revert on error
          setFavoriteIds((prev) => {
            const next = new Set(prev)
            if (isCurrentlyFavorite) next.add(actorId)
            else next.delete(actorId)
            localStorage.setItem('annuaire-favorites', JSON.stringify([...next]))
            return next
          })
        }
      } catch {
        // Keep optimistic update even if API fails (localStorage is the source of truth)
      }
    },
    [favoriteIds]
  )

  // Toggle type filter
  const toggleType = useCallback((type: ActorType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedTypes([])
    setSelectedCity('')
    setVisibleCount(12)
  }, [])

  // Active filters count
  const activeFiltersCount = selectedTypes.length + (selectedCity ? 1 : 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 lg:p-8 space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Annuaire de l&apos;Écosystème
          </h2>
          {isFallback && <DemoBadge />}
        </div>
        <p className="mt-1 text-muted-foreground">
          Explorez les acteurs de l&apos;écosystème entrepreneurial en Île-de-France
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, ville, service..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setVisibleCount(12)
            }}
            className="pl-9 h-10"
            disabled={isFetching}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setVisibleCount(12)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-2 shrink-0"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="h-10 w-10 rounded-r-none"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="h-10 w-10 rounded-l-none"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="border-border/60">
              <CardContent className="p-4 space-y-4">
                {/* Actor Type Filters */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Type d&apos;acteur
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      Object.entries(ACTOR_TYPE_CONFIG) as [ActorType, (typeof ACTOR_TYPE_CONFIG)[ActorType]][]
                    ).map(([type, config]) => {
                      const isSelected = selectedTypes.includes(type)
                      return (
                        <button
                          key={type}
                          onClick={() => toggleType(type)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all border',
                            isSelected
                              ? `${config.bgColor} ${config.color} border-current/20 shadow-sm`
                              : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                          )}
                        >
                          <config.icon className="h-3 w-3" />
                          {config.label}
                          {isSelected && <X className="h-3 w-3 ml-0.5" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* City Filter */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Ville
                  </label>
                  <Select value={selectedCity} onValueChange={(v) => setSelectedCity(v === '__all__' ? '' : v)}>
                    <SelectTrigger className="w-full sm:w-64">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Toutes les villes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Toutes les villes</SelectItem>
                      {CITIES_IDF.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeFiltersCount > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif
                        {activeFiltersCount > 1 ? 's' : ''}
                      </span>
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
                        Réinitialiser
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground mr-1">Filtres :</span>
          {selectedTypes.map((type) => {
            const config = ACTOR_TYPE_CONFIG[type]
            return (
              <Badge
                key={type}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => toggleType(type)}
              >
                <config.icon className="h-3 w-3" />
                {config.label}
                <X className="h-3 w-3" />
              </Badge>
            )
          })}
          {selectedCity && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => setSelectedCity('')}
            >
              <MapPin className="h-3 w-3" />
              {selectedCity}
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Featured Section */}
      {filteredFeatured.length > 0 && !searchQuery && !selectedCity && selectedTypes.length === 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            <h3 className="text-lg font-semibold text-foreground">Acteurs en vedette</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFeatured.slice(0, 4).map((actor) => (
              <FeaturedCard
                key={actor.id}
                actor={actor}
                isFavorite={favoriteIds.has(actor.id)}
                onToggleFavorite={() => toggleFavorite(actor.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredActors.length} acteur{filteredActors.length !== 1 ? 's' : ''} trouvé
          {filteredActors.length !== 1 ? 's' : ''}
          {isFetching && <span className="ml-2 inline-block h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        </p>
        {filteredActors.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowUpDown className="h-3 w-3" />
            Tri alphabétique
          </div>
        )}
      </div>

      {/* Results Grid/List */}
      {visibleActors.length > 0 ? (
        <>
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col gap-3'
            )}
          >
            {visibleActors.map((actor) =>
              viewMode === 'grid' ? (
                <ActorCardGrid
                  key={actor.id}
                  actor={actor}
                  isFavorite={favoriteIds.has(actor.id)}
                  onToggleFavorite={() => toggleFavorite(actor.id)}
                />
              ) : (
                <ActorCardList
                  key={actor.id}
                  actor={actor}
                  isFavorite={favoriteIds.has(actor.id)}
                  onToggleFavorite={() => toggleFavorite(actor.id)}
                />
              )
            )}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="gap-2"
              >
                <ChevronDown className="h-4 w-4" />
                Charger plus ({filteredActors.length - visibleCount} restant
                {filteredActors.length - visibleCount > 1 ? 's' : ''})
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState onClear={clearFilters} />
      )}
    </motion.div>
  )
}

// ─── Featured Card ──────────────────────────

function FeaturedCard({
  actor,
  isFavorite,
  onToggleFavorite,
}: {
  actor: Actor
  isFavorite: boolean
  onToggleFavorite: () => void
}) {
  const config = ACTOR_TYPE_CONFIG[actor.type]
  const Icon = config.icon

  return (
    <motion.div whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.2 }}>
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 hover:shadow-lg hover:border-primary/40 transition-all duration-300">
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={onToggleFavorite}
            className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors shadow-sm"
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            {isFavorite ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                config.bgColor
              )}
            >
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
                {actor.name}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {config.label}
                </Badge>
                {actor.successRate && (
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(actor.successRate)}% de réussite
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{actor.city}</span>
          </div>
          {actor.services && actor.services.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {actor.services.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {s}
                </span>
              ))}
              {actor.services.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{actor.services.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Actor Grid Card ────────────────────────

function ActorCardGrid({
  actor,
  isFavorite,
  onToggleFavorite,
}: {
  actor: Actor
  isFavorite: boolean
  onToggleFavorite: () => void
}) {
  const config = ACTOR_TYPE_CONFIG[actor.type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group h-full hover:shadow-md hover:border-primary/30 transition-all duration-300">
        <CardContent className="p-4 space-y-3">
          {/* Header: icon, name, favorite */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  config.bgColor
                )}
              >
                <Icon className={cn('h-5 w-5', config.color)} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                  {actor.name}
                </h4>
                <Badge
                  variant="secondary"
                  className={cn('mt-1 text-[10px] px-1.5 py-0 h-4 border-0', config.bgColor, config.color)}
                >
                  {config.label}
                </Badge>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite()
              }}
              className={cn(
                'p-1.5 rounded-full transition-colors shrink-0',
                isFavorite
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              {isFavorite ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Description */}
          {actor.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {actor.description}
            </p>
          )}

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">
              {actor.city}
              {actor.region ? `, ${actor.region}` : ''}
            </span>
          </div>

          {/* Contact info */}
          <div className="flex flex-col gap-1.5 text-xs">
            {actor.phone && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="truncate">{actor.phone}</span>
              </div>
            )}
            {actor.email && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{actor.email}</span>
              </div>
            )}
          </div>

          {/* Services */}
          {actor.services && actor.services.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {actor.services.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {s}
                </span>
              ))}
              {actor.services.length > 3 && (
                <span className="inline-flex items-center text-[10px] text-muted-foreground px-1">
                  +{actor.services.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Success rate */}
          {actor.successRate != null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Taux de réussite</span>
                <span
                  className={cn(
                    'font-medium',
                    actor.successRate >= 80
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : actor.successRate >= 60
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-500 dark:text-red-400'
                  )}
                >
                  {Math.round(actor.successRate)}%
                </span>
              </div>
              <Progress
                value={actor.successRate}
                className="h-1.5"
              />
            </div>
          )}

          {/* Website link */}
          {actor.website && (
            <a
              href={actor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Site web
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Actor List Card ────────────────────────

function ActorCardList({
  actor,
  isFavorite,
  onToggleFavorite,
}: {
  actor: Actor
  isFavorite: boolean
  onToggleFavorite: () => void
}) {
  const config = ACTOR_TYPE_CONFIG[actor.type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-md hover:border-primary/30 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                config.bgColor
              )}
            >
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">{actor.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="secondary"
                      className={cn('text-[10px] px-1.5 py-0 h-4 border-0', config.bgColor, config.color)}
                    >
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {actor.city}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onToggleFavorite}
                  className={cn(
                    'p-1.5 rounded-full transition-colors shrink-0',
                    isFavorite
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                  aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  {isFavorite ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </button>
              </div>

              {actor.description && (
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
                  {actor.description}
                </p>
              )}

              {/* Contact row */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {actor.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {actor.phone}
                  </span>
                )}
                {actor.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {actor.email}
                  </span>
                )}
                {actor.website && (
                  <a
                    href={actor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Site web
                  </a>
                )}
              </div>

              {/* Services inline */}
              {actor.services && actor.services.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {actor.services.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Success rate inline */}
              {actor.successRate != null && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Réussite</span>
                  <div className="w-16">
                    <Progress value={actor.successRate} className="h-1.5" />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      actor.successRate >= 80
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : actor.successRate >= 60
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-500 dark:text-red-400'
                    )}
                  >
                    {Math.round(actor.successRate)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Empty State ────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Aucun acteur trouvé</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.
      </p>
      <Button variant="outline" size="sm" onClick={onClear} className="mt-4 gap-2">
        <X className="h-4 w-4" />
        Réinitialiser les filtres
      </Button>
    </motion.div>
  )
}
