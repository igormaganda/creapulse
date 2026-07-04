'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { authFetch } from '@/lib/auth-fetch'
import {
  GraduationCap,
  Search,
  Star,
  MapPin,
  Clock,
  Send,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Target,
  User,
  Calendar,
  Briefcase,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface Mentor {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  bio: string
  expertise: string[]
  sectors: string[]
  location: string
  availability: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE'
  maxMentees: number
  rating: number
  reviewCount: number
}

interface MentorRequest {
  id: string
  mentorName: string
  mentorAvatarUrl: string | null
  message: string
  objectives: string[]
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const AVAILABILITY_CONFIG = {
  AVAILABLE: { label: 'Disponible', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500' },
  LIMITED: { label: 'Disponibilité limitée', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500' },
  UNAVAILABLE: { label: 'Indisponible', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500' },
}

const REQUEST_STATUS_CONFIG = {
  PENDING: { label: 'En attente', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  ACCEPTED: { label: 'Acceptée', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  REJECTED: { label: 'Refusée', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
  CANCELLED: { label: 'Annulée', color: 'text-muted-foreground', bg: 'bg-muted', icon: XCircle },
}

const EXPERTISE_OPTIONS = [
  'Business Plan', 'Financement', 'Marketing Digital', 'Stratégie',
  'Gestion d\'équipe', 'Commerce International', 'Innovation',
  'Fiscalité', 'Droit des sociétés', 'Développement commercial',
  'Gestion de projet', 'Ressources Humaines',
]

const SECTOR_OPTIONS = [
  'Tech / Numérique', 'Commerce', 'Restauration', 'BTP',
  'Santé / Bien-être', 'Formation', 'Services', 'Industrie',
  'Immobilier', 'Événementiel', 'Artisanat', 'Autre',
]

const MENTOR_OBJECTIVES = [
  'Valider mon idée de business',
  'Structurer mon business plan',
  'Préparer ma levée de fonds',
  'Développer mon réseau',
  'Améliorer ma stratégie marketing',
  'Gérer mes finances',
  'Recruter et manager une équipe',
  'Préparer le lancement',
]

const AVATAR_COLORS = [
  'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500',
  'bg-violet-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-lime-500',
]

// Types for active mentorships returned by API
interface ActiveMentorship {
  id: string
  mentorName: string
  mentorAvatarUrl: string | null
  status: string
  startedAt: string
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function Mentorat() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [requests, setRequests] = useState<MentorRequest[]>([])
  const [activeMentorships, setActiveMentorships] = useState<ActiveMentorship[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('mentors')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExpertise, setSelectedExpertise] = useState('')
  const [selectedSector, setSelectedSector] = useState('')
  const [selectedAvailability, setSelectedAvailability] = useState('')

  // Request dialog
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [requestObjectives, setRequestObjectives] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  // Mentor detail
  const [selectedDetailMentor, setSelectedDetailMentor] = useState<Mentor | null>(null)

  // Load data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await authFetch('/api/mentorat')
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setMentors(json.data.mentors ?? [])
            setRequests(json.data.myRequests ?? [])
            setActiveMentorships(json.data.activeMentorships ?? [])
          }
        }
      } catch {
        // Silently fail — empty state will show
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter mentors
  const filteredMentors = useMemo(() => {
    let result = mentors
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        m.expertise.some((e) => e.toLowerCase().includes(q)) ||
        m.sectors.some((s) => s.toLowerCase().includes(q))
      )
    }
    if (selectedExpertise) {
      result = result.filter((m) => m.expertise.includes(selectedExpertise))
    }
    if (selectedSector) {
      result = result.filter((m) => m.sectors.includes(selectedSector))
    }
    if (selectedAvailability) {
      result = result.filter((m) => m.availability === selectedAvailability)
    }
    return result
  }, [mentors, searchQuery, selectedExpertise, selectedSector, selectedAvailability])

  const openRequestDialog = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor)
    setRequestMessage('')
    setRequestObjectives([])
    setRequestDialogOpen(true)
  }, [])

  const sendRequest = async () => {
    if (!selectedMentor || !requestMessage.trim() || requestObjectives.length === 0) return
    setSending(true)
    try {
      const res = await authFetch('/api/mentorat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: selectedMentor.id,
          message: requestMessage,
          objectives: requestObjectives,
        }),
      })

      if (res.ok) {
        setRequests((prev) => [
          {
            id: `req-${Date.now()}`,
            mentorName: selectedMentor.name,
            mentorAvatarUrl: selectedMentor.avatarUrl,
            message: requestMessage,
            objectives: requestObjectives,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ])
        toast.success('Demande de mentorat envoyée avec succès !')
        setRequestDialogOpen(false)
      } else {
        const json = await res.json()
        toast.error(json.error?.message || 'Erreur lors de l\'envoi de la demande')
      }
    } catch {
      toast.error('Erreur lors de l\'envoi de la demande')
    } finally {
      setSending(false)
    }
  }

  const toggleObjective = (objective: string) => {
    setRequestObjectives((prev) =>
      prev.includes(objective) ? prev.filter((o) => o !== objective) : [...prev, objective]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedExpertise('')
    setSelectedSector('')
    setSelectedAvailability('')
  }

  const activeFiltersCount = [selectedExpertise, selectedSector, selectedAvailability].filter(Boolean).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mentorat</h2>
          <p className="text-sm text-muted-foreground">Trouvez un mentor pour vous accompagner dans votre parcours</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="mentors" className="gap-1.5">
            <User className="h-4 w-4" />
            Mentors disponibles ({mentors.filter(m => m.availability !== 'UNAVAILABLE').length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Mes demandes ({requests.filter(r => r.status === 'PENDING').length > 0 ? `${requests.filter(r => r.status === 'PENDING').length} en attente` : requests.length})
          </TabsTrigger>
          {activeMentorships.length > 0 && (
            <TabsTrigger value="active" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Mon mentor ({activeMentorships.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Mentors Tab */}
        <TabsContent value="mentors" className="space-y-4 mt-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un mentor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button variant="outline" size="sm" className="h-10 gap-2" onClick={() => {
              if (activeFiltersCount > 0) clearFilters()
            }}>
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs rounded-full">{activeFiltersCount}</Badge>
              )}
            </Button>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <Select value={selectedExpertise} onValueChange={(v) => setSelectedExpertise(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                <Briefcase className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Expertise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Toutes les expertises</SelectItem>
                {EXPERTISE_OPTIONS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSector} onValueChange={(v) => setSelectedSector(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                <Target className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Secteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tous les secteurs</SelectItem>
                {SECTOR_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAvailability} onValueChange={(v) => setSelectedAvailability(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Disponibilité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Toutes</SelectItem>
                <SelectItem value="AVAILABLE">Disponible</SelectItem>
                <SelectItem value="LIMITED">Limitée</SelectItem>
                <SelectItem value="UNAVAILABLE">Indisponible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''} trouvé{filteredMentors.length !== 1 ? 's' : ''}
          </p>

          {/* Mentor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMentors.map((mentor, idx) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                index={idx}
                onRequest={() => openRequestDialog(mentor)}
                onViewDetail={() => setSelectedDetailMentor(mentor)}
                hasPendingRequest={requests.some(r => r.mentorName === mentor.name && r.status === 'PENDING')}
                hasActiveMentorship={requests.some(r => r.mentorName === mentor.name && r.status === 'ACCEPTED')}
              />
            ))}
          </div>

          {filteredMentors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun mentor ne correspond à vos critères.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4 mt-4">
          {requests.length === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">Aucune demande</p>
                <p className="text-sm text-muted-foreground mt-1">Vous n&apos;avez pas encore envoyé de demande de mentorat.</p>
                <Button className="mt-4" onClick={() => setActiveTab('mentors')}>Trouver un mentor</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Mentorship Tab */}
        <TabsContent value="active" className="space-y-4 mt-4">
          {activeMentorships.length === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Aucun mentorat actif</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeMentorships.map((ms) => (
                <Card key={ms.id} className="border-emerald-200 dark:border-emerald-800">
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0', AVATAR_COLORS[ms.mentorName.charCodeAt(0) % AVATAR_COLORS.length])}>
                      {ms.mentorName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ms.mentorName}</p>
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Depuis le {new Date(ms.startedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Demande de mentorat
            </DialogTitle>
            <DialogDescription>
              Envoyez une demande à {selectedMentor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Mentor info */}
            {selectedMentor && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <MentorAvatar mentor={selectedMentor} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedMentor.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedMentor.expertise.slice(0, 3).join(' · ')}</p>
                </div>
              </div>
            )}

            {/* Objectives */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Vos objectifs <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MENTOR_OBJECTIVES.map((obj) => (
                  <label key={obj} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <Checkbox
                      checked={requestObjectives.includes(obj)}
                      onCheckedChange={() => toggleObjective(obj)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-muted-foreground leading-snug">{obj}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Votre message <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Présentez votre projet et expliquez pourquoi vous souhaitez être mentoré(e)..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{requestMessage.length}/500 caractères min. 10</p>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setRequestDialogOpen(false)} className="flex-1">
                Annuler
              </Button>
              <Button
                onClick={sendRequest}
                disabled={sending || requestMessage.length < 10 || requestObjectives.length === 0}
                className="flex-1 gap-2"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Envoyer la demande
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mentor Detail Dialog */}
      <Dialog open={!!selectedDetailMentor} onOpenChange={() => setSelectedDetailMentor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Profil du Mentor</DialogTitle>
          </DialogHeader>
          {selectedDetailMentor && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-4">
                <MentorAvatar mentor={selectedDetailMentor} size="lg" />
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedDetailMentor.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      {selectedDetailMentor.rating}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {selectedDetailMentor.reviewCount} avis
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1.5">Bio</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedDetailMentor.bio}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1.5">Expertises</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDetailMentor.expertise.map((e) => (
                    <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1.5">Secteurs</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDetailMentor.sectors.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{selectedDetailMentor.location}</span>
                <AvailabilityBadge availability={selectedDetailMentor.availability} />
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => {
                  setSelectedDetailMentor(null)
                  openRequestDialog(selectedDetailMentor)
                }}
                disabled={selectedDetailMentor.availability === 'UNAVAILABLE'}
              >
                <Send className="h-4 w-4" />
                {selectedDetailMentor.availability === 'UNAVAILABLE' ? 'Indisponible' : 'Demander un mentor'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────

function MentorAvatar({ mentor, size = 'md' }: { mentor: Mentor; size?: 'sm' | 'md' | 'lg' }) {
  const initials = mentor.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const colorIndex = mentor.name.charCodeAt(0) % AVATAR_COLORS.length
  const colorClass = AVATAR_COLORS[colorIndex]

  const sizeClass = size === 'sm' ? 'h-10 w-10 text-sm' : size === 'lg' ? 'h-16 w-16 text-xl' : 'h-12 w-12 text-base'

  return (
    <div className={cn('flex items-center justify-center rounded-full text-white font-semibold shrink-0', sizeClass, colorClass)}>
      {initials}
    </div>
  )
}

function AvailabilityBadge({ availability }: { availability: Mentor['availability'] }) {
  const config = AVAILABILITY_CONFIG[availability]
  return (
    <span className={cn('flex items-center gap-1.5 text-xs font-medium', config.color)}>
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}

function MentorCard({
  mentor,
  index,
  onRequest,
  onViewDetail,
  hasPendingRequest,
  hasActiveMentorship,
}: {
  mentor: Mentor
  index: number
  onRequest: () => void
  onViewDetail: () => void
  hasPendingRequest: boolean
  hasActiveMentorship: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all duration-300">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <MentorAvatar mentor={mentor} />
            <div className="flex-1 min-w-0">
              <button onClick={onViewDetail} className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left">
                {mentor.name}
                <ChevronRight className="h-3.5 w-3.5 inline ml-0.5" />
              </button>
              <div className="flex items-center gap-2 mt-0.5">
                <AvailabilityBadge availability={mentor.availability} />
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  'h-3.5 w-3.5',
                  s <= Math.round(mentor.rating) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'
                )}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">{mentor.rating} ({mentor.reviewCount})</span>
          </div>

          {/* Bio */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{mentor.bio}</p>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>{mentor.location}</span>
          </div>

          {/* Expertise */}
          <div className="flex flex-wrap gap-1">
            {mentor.expertise.slice(0, 3).map((e) => (
              <Badge key={e} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">{e}</Badge>
            ))}
            {mentor.expertise.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">+{mentor.expertise.length - 3}</Badge>
            )}
          </div>

          {/* Action */}
          <Button
            size="sm"
            className="w-full gap-2 rounded-full"
            disabled={mentor.availability === 'UNAVAILABLE' || hasActiveMentorship}
            variant={hasPendingRequest ? 'outline' : 'default'}
            onClick={hasPendingRequest ? undefined : onRequest}
          >
            {hasActiveMentorship ? (
              <><CheckCircle2 className="h-3.5 w-3.5" /> Mentorat actif</>
            ) : hasPendingRequest ? (
              <><Clock className="h-3.5 w-3.5" /> Demande en attente</>
            ) : mentor.availability === 'UNAVAILABLE' ? (
              <><XCircle className="h-3.5 w-3.5" /> Indisponible</>
            ) : (
              <><Send className="h-3.5 w-3.5" /> Demander un mentor</>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RequestCard({ request }: { request: MentorRequest }) {
  const config = REQUEST_STATUS_CONFIG[request.status]
  const StatusIcon = config.icon

  const initials = request.mentorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const colorIndex = request.mentorName.charCodeAt(0) % AVATAR_COLORS.length
  const colorClass = AVATAR_COLORS[colorIndex]

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Card className="hover:shadow-sm transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold', colorClass)}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">{request.mentorName}</h4>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', config.bg, config.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{request.message}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {request.objectives.map((obj) => (
                  <Badge key={obj} variant="outline" className="text-[10px]">{obj}</Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                <Calendar className="h-3 w-3 inline mr-1" />
                {new Date(request.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
