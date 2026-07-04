'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authFetch } from '@/lib/auth-fetch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  MessageSquare,
  Users,
  GraduationCap,
  Check,
  X,
  Clock,
  Star,
  MapPin,
  AlertCircle,
  Loader2,
  Inbox,
  UserPlus,
  ShieldCheck,
  HandshakeIcon,
} from 'lucide-react'

// ─── Types ──────────────────────────────────

interface MentorData {
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

interface PendingRequest {
  id: string
  menteeId: string
  menteeName: string
  menteeAvatarUrl: string | null
  message: string
  objectives: string[]
  status: string
  createdAt: string
}

interface ActiveMentorship {
  id: string
  mentorId: string
  mentorName: string
  mentorAvatarUrl: string | null
  menteeId: string
  menteeName: string
  menteeAvatarUrl: string | null
  startedAt: string
}

type MentoratTab = 'demandes' | 'mentorats' | 'mentors'

// ─── Availability config ────────────────────

const availabilityConfig: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: 'Disponible', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  LIMITED: { label: 'Limité', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  UNAVAILABLE: { label: 'Indisponible', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

// ─── Animation variants ─────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

// ─── Component ──────────────────────────────

export function MentorManagement() {
  const [activeTab, setActiveTab] = useState<MentoratTab>('demandes')
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [activeMentorships, setActiveMentorships] = useState<ActiveMentorship[]>([])
  const [mentors, setMentors] = useState<MentorData[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: 'accept' | 'reject' | 'end'
    itemId: string
    itemName: string
  }>({ open: false, type: 'accept', itemId: '', itemName: '' })

  // ─── Data fetching ──────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/mentorat')
      const json = await res.json()

      if (json.success) {
        // Fetch pending requests for the tenant (counselor view)
        const pendingRes = await authFetch('/api/mentorat?view=counselor-pending')
        const pendingJson = await pendingRes.json()

        if (pendingJson.success && pendingJson.data?.pendingRequests) {
          setPendingRequests(pendingJson.data.pendingRequests)
        } else if (pendingJson.success && pendingJson.data?.myRequests) {
          // Fallback: use myRequests to find pending ones from mentees
          setPendingRequests(
            pendingJson.data.myRequests
              .filter((r: { status: string }) => r.status === 'PENDING')
              .map((r: { id: string; mentorName: string; mentorAvatarUrl: string | null; message: string; objectives: string[]; createdAt: string }) => ({
                id: r.id,
                menteeId: '',
                menteeName: 'Menté inconnu',
                menteeAvatarUrl: r.mentorAvatarUrl,
                message: r.message,
                objectives: r.objectives,
                status: r.status,
                createdAt: r.createdAt,
              })),
          )
        }

        // Fetch active mentorships for the tenant
        const mentorshipsRes = await authFetch('/api/mentorat?view=counselor-mentorships')
        const mentorshipsJson = await mentorshipsRes.json()

        if (mentorshipsJson.success && mentorshipsJson.data?.activeMentorships) {
          setActiveMentorships(mentorshipsJson.data.activeMentorships)
        } else if (mentorshipsJson.success && mentorshipsJson.data?.activeMentorships) {
          setActiveMentorships(mentorshipsJson.data.activeMentorships)
        }

        // Use mentors from the main endpoint
        if (json.data?.mentors) {
          setMentors(json.data.mentors)
        }
      }
    } catch {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Actions ────────────────────────────

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const res = await authFetch('/api/mentorat', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'accept-request', requestId }),
      })
      const json = await res.json()

      if (json.success) {
        toast.success('Demande acceptée avec succès')
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
        // Refresh mentorships
        fetchData()
      } else {
        toast.error(json.error?.message || 'Erreur lors de l\'acceptation')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setActionLoading(null)
      setConfirmDialog((d) => ({ ...d, open: false }))
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const res = await authFetch('/api/mentorat', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'reject-request', requestId }),
      })
      const json = await res.json()

      if (json.success) {
        toast.success('Demande refusée')
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
      } else {
        toast.error(json.error?.message || 'Erreur lors du refus')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setActionLoading(null)
      setConfirmDialog((d) => ({ ...d, open: false }))
    }
  }

  const handleEndMentorship = async (mentorshipId: string) => {
    setActionLoading(mentorshipId)
    try {
      const res = await authFetch('/api/mentorat', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'end-mentorship', mentorshipId }),
      })
      const json = await res.json()

      if (json.success) {
        toast.success('Mentorat terminé')
        setActiveMentorships((prev) => prev.filter((m) => m.id !== mentorshipId))
      } else {
        toast.error(json.error?.message || 'Erreur lors de la fin du mentorat')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setActionLoading(null)
      setConfirmDialog((d) => ({ ...d, open: false }))
    }
  }

  const openConfirm = (type: 'accept' | 'reject' | 'end', itemId: string, itemName: string) => {
    setConfirmDialog({ open: true, type, itemId, itemName })
  }

  const confirmAction = () => {
    const { type, itemId } = confirmDialog
    if (type === 'accept') handleAcceptRequest(itemId)
    else if (type === 'reject') handleRejectRequest(itemId)
    else if (type === 'end') handleEndMentorship(itemId)
  }

  // ─── Helpers ────────────────────────────

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // ─── Render: Pending requests ──────────

  const renderPendingRequests = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (pendingRequests.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">Aucune demande en attente</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les nouvelles demandes de mentorat apparaîtront ici
          </p>
        </motion.div>
      )
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''}
          </Badge>
        </div>
        <AnimatePresence mode="popLayout">
          {pendingRequests.map((request) => (
            <motion.div
              key={request.id}
              variants={itemVariants}
              layout
              exit="exit"
            >
              <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <CardContent className="p-4 space-y-3">
                  {/* Header: mentee info + date */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={request.menteeAvatarUrl || undefined} alt={request.menteeName} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                          {getInitials(request.menteeName || '??')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {request.menteeName}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{formatDate(request.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 shrink-0 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                      En attente
                    </Badge>
                  </div>

                  {/* Message */}
                  {request.message && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Message</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                        {request.message}
                      </p>
                    </div>
                  )}

                  {/* Objectives */}
                  {request.objectives.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {request.objectives.map((obj, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[11px]">
                          {obj}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <Separator />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                      disabled={actionLoading === request.id}
                      onClick={() => openConfirm('reject', request.id, request.menteeName)}
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      Refuser
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={actionLoading === request.id}
                      onClick={() => openConfirm('accept', request.id, request.menteeName)}
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Accepter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    )
  }

  // ─── Render: Active mentorships ────────

  const renderActiveMentorships = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (activeMentorships.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <HandshakeIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">Aucun mentorat actif</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les mentorats actifs apparaîtront ici
          </p>
        </motion.div>
      )
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {activeMentorships.length} mentorat{activeMentorships.length > 1 ? 's' : ''} actif{activeMentorships.length > 1 ? 's' : ''}
          </Badge>
        </div>
        <AnimatePresence mode="popLayout">
          {activeMentorships.map((mentorship) => (
            <motion.div
              key={mentorship.id}
              variants={itemVariants}
              layout
              exit="exit"
            >
              <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Mentor */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={mentorship.mentorAvatarUrl || undefined} alt={mentorship.mentorName} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                            {getInitials(mentorship.mentorName || '??')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Mentor</p>
                          <p className="text-sm font-semibold text-foreground truncate">{mentorship.mentorName}</p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                        <UserPlus className="h-4 w-4" />
                      </div>

                      {/* Mentee */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={mentorship.menteeAvatarUrl || undefined} alt={mentorship.menteeName} />
                          <AvatarFallback className="bg-muted-foreground/10 text-muted-foreground text-xs font-bold">
                            {getInitials(mentorship.menteeName || '??')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Menté</p>
                          <p className="text-sm font-semibold text-foreground truncate">{mentorship.menteeName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <Badge className="text-[10px] px-2 py-0.5 shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                      Actif
                    </Badge>
                  </div>

                  {/* Start date + End button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Début : {formatDate(mentorship.startedAt)}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 text-xs"
                      disabled={actionLoading === mentorship.id}
                      onClick={() => openConfirm('end', mentorship.id, `${mentorship.mentorName} → ${mentorship.menteeName}`)}
                    >
                      {actionLoading === mentorship.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      Terminer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    )
  }

  // ─── Render: Mentors list ──────────────

  const renderMentors = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (mentors.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <GraduationCap className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">Aucun mentor enregistré</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les profils mentors seront visibles ici une fois créés
          </p>
        </motion.div>
      )
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <div className="col-span-full mb-1">
          <Badge variant="secondary" className="text-xs">
            {mentors.length} mentor{mentors.length > 1 ? 's' : ''}
          </Badge>
        </div>
        {mentors.map((mentor) => {
          const avail = availabilityConfig[mentor.availability] || availabilityConfig.AVAILABLE
          return (
            <motion.div
              key={mentor.id}
              variants={itemVariants}
            >
              <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={mentor.avatarUrl || undefined} alt={mentor.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                        {getInitials(mentor.name || '??')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base leading-tight truncate">{mentor.name}</CardTitle>
                      <CardDescription className="text-xs truncate mt-0.5">{mentor.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {/* Bio */}
                  {mentor.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {mentor.bio}
                    </p>
                  )}

                  {/* Expertise tags */}
                  {mentor.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {mentor.expertise.slice(0, 4).map((exp, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px]">
                          {exp}
                        </Badge>
                      ))}
                      {mentor.expertise.length > 4 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{mentor.expertise.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Sectors */}
                  {mentor.sectors.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {mentor.sectors.slice(0, 3).map((sector, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px]">
                          {sector}
                        </Badge>
                      ))}
                      {mentor.sectors.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{mentor.sectors.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Meta info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Availability */}
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${avail.color} border-0`}>
                        {avail.label}
                      </Badge>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span className="text-foreground font-medium">
                        {mentor.rating > 0 ? mentor.rating.toFixed(1) : '—'}
                      </span>
                      {mentor.reviewCount > 0 && (
                        <span className="text-muted-foreground">({mentor.reviewCount})</span>
                      )}
                    </div>

                    {/* Location */}
                    {mentor.location && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">{mentor.location}</span>
                      </div>
                    )}

                    {/* Mentees capacity */}
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        Max {mentor.maxMentees} mentoré{mentor.maxMentees > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
    )
  }

  // ─── Main render ────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Gestion du mentorat</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez les demandes, les mentorats actifs et les profils mentors
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MentoratTab)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="demandes" className="gap-1.5 text-sm">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Demandes</span>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mentorats" className="gap-1.5 text-sm">
            <HandshakeIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Mentorats actifs</span>
            {activeMentorships.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {activeMentorships.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mentors" className="gap-1.5 text-sm">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Mentors</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demandes" className="mt-4">
          {renderPendingRequests()}
        </TabsContent>

        <TabsContent value="mentorats" className="mt-4">
          {renderActiveMentorships()}
        </TabsContent>

        <TabsContent value="mentors" className="mt-4">
          {renderMentors()}
        </TabsContent>
      </Tabs>

      {/* Confirmation dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((d) => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.type === 'accept' && <Check className="h-5 w-5 text-emerald-600" />}
              {confirmDialog.type === 'reject' && <X className="h-5 w-5 text-destructive" />}
              {confirmDialog.type === 'end' && <AlertCircle className="h-5 w-5 text-amber-500" />}
              {confirmDialog.type === 'accept' && 'Accepter la demande'}
              {confirmDialog.type === 'reject' && 'Refuser la demande'}
              {confirmDialog.type === 'end' && 'Terminer le mentorat'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'accept' && (
                <>
                  Voulez-vous accepter la demande de mentorat de <strong>{confirmDialog.itemName}</strong> ?
                  Un mentorat actif sera créé.
                </>
              )}
              {confirmDialog.type === 'reject' && (
                <>
                  Voulez-vous refuser la demande de mentorat de <strong>{confirmDialog.itemName}</strong> ?
                  Cette action est irréversible.
                </>
              )}
              {confirmDialog.type === 'end' && (
                <>
                  Voulez-vous terminer le mentorat entre <strong>{confirmDialog.itemName}</strong> ?
                  Le mentor et le mentoré seront notifiés.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog((d) => ({ ...d, open: false }))}
              disabled={!!actionLoading}
            >
              Annuler
            </Button>
            <Button
              variant={confirmDialog.type === 'reject' || confirmDialog.type === 'end' ? 'destructive' : 'default'}
              onClick={confirmAction}
              disabled={!!actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {confirmDialog.type === 'accept' && 'Accepter'}
              {confirmDialog.type === 'reject' && 'Refuser'}
              {confirmDialog.type === 'end' && 'Terminer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}