'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/auth-fetch'
import {
  Video,
  Plus,
  Phone,
  PhoneOff,
  Calendar,
  Clock,
  Users,
  X,
  MonitorPlay,
  AlertCircle,
  ChevronRight,
  MoreVertical,
  Copy,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
type SessionStatus = 'WAITING' | 'ACTIVE' | 'ENDED' | 'CANCELLED'

interface VisioSession {
  id: string
  roomName: string
  roomSubject: string
  beneficiaryId: string
  beneficiaryName: string
  beneficiaryInitials: string
  conseillerName: string
  scheduledAt: string
  status: SessionStatus
  duration?: number // in minutes
  jitsiUrl?: string
}

/* ═══════════════════════════════════════════════════════════
   Status config
   ═══════════════════════════════════════════════════════════ */
const statusConfig: Record<SessionStatus, { label: string; color: string; dotColor: string; bg: string }> = {
  WAITING: {
    label: 'En attente',
    color: 'text-amber-700 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  ACTIVE: {
    label: 'En cours',
    color: 'text-emerald-700 dark:text-emerald-400',
    dotColor: 'bg-emerald-500 animate-pulse',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  ENDED: {
    label: 'Terminee',
    color: 'text-muted-foreground',
    dotColor: 'bg-muted-foreground',
    bg: 'bg-muted',
  },
  CANCELLED: {
    label: 'Annulee',
    color: 'text-red-600 dark:text-red-400',
    dotColor: 'bg-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
}

/* ═══════════════════════════════════════════════════════════
   Mock data
   ═══════════════════════════════════════════════════════════ */
const mockBeneficiaires = [
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

const initialSessions: VisioSession[] = [
  {
    id: 'vs1',
    roomName: 'creapulse-suivi-amadou-diallo',
    roomSubject: 'Suivi Business Plan',
    beneficiaryId: 'b1',
    beneficiaryName: 'Amadou Diallo',
    beneficiaryInitials: 'AD',
    conseillerName: 'Sophie Martin',
    scheduledAt: new Date(Date.now() + 15 * 60000).toISOString(),
    status: 'WAITING',
    jitsiUrl: 'https://meet.jit.si/creapulse-suivi-amadou-diallo',
  },
  {
    id: 'vs2',
    roomName: 'creapulse-bilan-lea-fontaine',
    roomSubject: 'Bilan Trimestriel',
    beneficiaryId: 'b2',
    beneficiaryName: 'Lea Fontaine',
    beneficiaryInitials: 'LF',
    conseillerName: 'Sophie Martin',
    scheduledAt: new Date(Date.now() - 20 * 60000).toISOString(),
    status: 'ACTIVE',
    duration: 20,
    jitsiUrl: 'https://meet.jit.si/creapulse-bilan-lea-fontaine',
  },
  {
    id: 'vs3',
    roomName: 'creapulse-atelier-marc-renaud',
    roomSubject: 'Atelier Creation - Canvas',
    beneficiaryId: 'b3',
    beneficiaryName: 'Marc Renaud',
    beneficiaryInitials: 'MR',
    conseillerName: 'Sophie Martin',
    scheduledAt: new Date(Date.now() + 2 * 3600000).toISOString(),
    status: 'WAITING',
    jitsiUrl: 'https://meet.jit.si/creapulse-atelier-marc-renaud',
  },
  {
    id: 'vs4',
    roomName: 'creapulse-suivi-clara-dubois',
    roomSubject: 'Suivi Post-lancement',
    beneficiaryId: 'b4',
    beneficiaryName: 'Clara Dubois',
    beneficiaryInitials: 'CD',
    conseillerName: 'Sophie Martin',
    scheduledAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'ENDED',
    duration: 45,
    jitsiUrl: 'https://meet.jit.si/creapulse-suivi-clara-dubois',
  },
  {
    id: 'vs5',
    roomName: 'creapulse-financement-karim',
    roomSubject: 'Point Financement',
    beneficiaryId: 'b5',
    beneficiaryName: 'Karim Benali',
    beneficiaryInitials: 'KB',
    conseillerName: 'Sophie Martin',
    scheduledAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'CANCELLED',
  },
]

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */
const JITSI_SERVER = process.env.NEXT_PUBLIC_JITSI_SERVER_URL || 'https://meet.jit.si'

function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function generateRoomName(subject: string, beneficiaryName: string): string {
  const slug = subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const nameSlug = beneficiaryName
    .toLowerCase()
    .replace(/\s+/g, '-')
  const ts = Date.now().toString(36)
  return `creapulse-${slug}-${nameSlug}-${ts}`
}

function isSessionActive(session: VisioSession): boolean {
  return session.status === 'ACTIVE'
}

function isSessionPast(session: VisioSession): boolean {
  return session.status === 'ENDED' || session.status === 'CANCELLED'
}

/* ═══════════════════════════════════════════════════════════
   Session Card
   ═══════════════════════════════════════════════════════════ */
function SessionCard({
  session,
  isSelected,
  onSelect,
  onJoin,
}: {
  session: VisioSession
  isSelected: boolean
  onSelect: () => void
  onJoin: () => void
}) {
  const status = statusConfig[session.status]
  const past = isSessionPast(session)
  const active = isSessionActive(session)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group cursor-pointer transition-all duration-200 hover:shadow-md',
          isSelected
            ? 'border-primary shadow-md ring-1 ring-primary/20'
            : active
              ? 'border-emerald-300 hover:border-emerald-400'
              : past
                ? 'border-border/60 opacity-75'
                : 'border-border hover:border-primary/30'
        )}
        onClick={onSelect}
      >
        <CardContent className="p-3.5">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <Avatar className="h-9 w-9 shrink-0 mt-0.5">
              <AvatarFallback
                className={cn(
                  'text-xs font-bold',
                  active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : past
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/10 text-primary'
                )}
              >
                {session.beneficiaryInitials}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    'text-sm font-semibold text-foreground truncate',
                    past && 'line-through opacity-60'
                  )}
                >
                  {session.beneficiaryName}
                </p>
                <Badge
                  variant="secondary"
                  className={cn('text-[10px] px-2 py-0 gap-1 shrink-0', status.bg, status.color)}
                >
                  <span className={cn('inline-block h-1.5 w-1.5 rounded-full', status.dotColor)} />
                  {status.label}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {session.roomSubject}
              </p>

              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateFr(session.scheduledAt)}
                </span>
                {session.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(session.duration)}
                  </span>
                )}
              </div>
            </div>

            {/* Right: action */}
            <div className="flex items-center gap-1.5 shrink-0">
              {active && (
                <Button
                  size="sm"
                  className="h-7 px-2.5 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    onJoin()
                  }}
                >
                  <Phone className="h-3 w-3" />
                  Rejoindre
                </Button>
              )}
              {!past && !active && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <ChevronRight className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              {past && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Jitsi Room View
   ═══════════════════════════════════════════════════════════ */
function JitsiRoomView({ session, onLeave }: { session: VisioSession; onLeave: () => void }) {
  const [copied, setCopied] = useState(false)
  const displayName = session.conseillerName

  const jitsiUrl = `${JITSI_SERVER}/${session.roomName}#config.startWithVideoMuted=true&config.prejoinPageEnabled=false&config.displayName=${encodeURIComponent(displayName)}&config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false`

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(`${JITSI_SERVER}/${session.roomName}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [session.roomName])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Video className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {session.roomSubject}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                avec {session.beneficiaryName}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="text-[10px] px-2 py-0 gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En direct
          </Badge>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-[11px] gap-1.5"
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Copie
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copier le lien
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 px-2.5 text-[11px] gap-1.5"
            onClick={onLeave}
          >
            <PhoneOff className="h-3 w-3" />
            Quitter
          </Button>
        </div>
      </div>

      {/* Jitsi iframe */}
      <div className="flex-1 relative bg-black">
        <iframe
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="absolute inset-0 w-full h-full border-none"
          title={`Visioconférence - ${session.roomSubject}`}
        />
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Empty State
   ═══════════════════════════════════════════════════════════ */
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center h-full p-8 text-center"
    >
      {/* Illustration */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative"
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00838F] to-emerald-600 shadow-lg shadow-teal-500/25">
            <Video className="h-8 w-8 text-white" />
          </div>
        </div>
        {/* Floating elements */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md"
        >
          <Users className="h-4 w-4 text-[#00838F]" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute -bottom-1 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md"
        >
          <MonitorPlay className="h-3.5 w-3.5 text-emerald-600" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-6 max-w-sm"
      >
        <h3 className="text-lg font-bold text-foreground">
          Visioconference
        </h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Planifiez et lancez des sessions visio avec vos beneficiaires directement depuis cette interface. 
          Selectionnez une session dans la liste ou creez-en une nouvelle.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-6 flex flex-col sm:flex-row items-center gap-3"
      >
        <Button
          onClick={onCreateClick}
          className="gap-2 bg-gradient-to-r from-[#00838F] to-emerald-600 hover:from-[#006978] hover:to-emerald-700 text-white shadow-lg shadow-teal-500/20"
        >
          <Plus className="h-4 w-4" />
          Creer une session visio
        </Button>
      </motion.div>

      {/* Feature hints */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground"
      >
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-[#00838F]" />
          Partage d&apos;ecran
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Chat integre
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Enregistrement
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Create Session Dialog
   ═══════════════════════════════════════════════════════════ */
function CreateSessionDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreate: (session: Omit<VisioSession, 'id' | 'status' | 'duration' | 'jitsiUrl'>) => void
}) {
  const [beneficiaryId, setBeneficiaryId] = useState('')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const handleSubmit = () => {
    if (!beneficiaryId || !subject || !date || !time) return
    const beneficiary = mockBeneficiaires.find((b) => b.id === beneficiaryId)
    if (!beneficiary) return
    const initials = `${beneficiary.name.split(' ')[0][0]}${beneficiary.name.split(' ').slice(-1)[0][0]}`.toUpperCase()
    const roomName = generateRoomName(subject, beneficiary.name)
    const scheduledAt = new Date(`${date}T${time}`).toISOString()

    onCreate({
      roomName,
      roomSubject: subject,
      beneficiaryId,
      beneficiaryName: beneficiary.name,
      beneficiaryInitials: initials,
      conseillerName: 'Sophie Martin',
      scheduledAt,
    })

    // Reset form
    setBeneficiaryId('')
    setSubject('')
    setDate('')
    setTime('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00838F] to-emerald-600">
              <Video className="h-4 w-4 text-white" />
            </div>
            Nouvelle session visio
          </DialogTitle>
          <DialogDescription>
            Planifiez une visioconference avec un beneficiaire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Beneficiary select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Beneficiaire <span className="text-destructive">*</span>
            </label>
            <Select value={beneficiaryId} onValueChange={setBeneficiaryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selectionner un beneficiaire" />
              </SelectTrigger>
              <SelectContent>
                {mockBeneficiaires.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Objet de la session <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="ex: Suivi Business Plan"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Heure <span className="text-destructive">*</span>
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!beneficiaryId || !subject || !date || !time}
            className="gap-1.5 bg-gradient-to-r from-[#00838F] to-emerald-600 hover:from-[#006978] hover:to-emerald-700 text-white"
          >
            <Video className="h-4 w-4" />
            Creer la session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════════════
   Main VisioView Component
   ═══════════════════════════════════════════════════════════ */
export function VisioView() {
  const [sessions, setSessions] = useState<VisioSession[]>(initialSessions)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isInRoom, setIsInRoom] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [sessionFilter, setSessionFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Try fetching sessions from API
  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true)
        const res = await authFetch('/api/visio/sessions')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setSessions(data)
          }
        }
      } catch {
        // API not available — use mock data
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  )

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roomSubject.toLowerCase().includes(searchQuery.toLowerCase())

      if (sessionFilter === 'upcoming') return matchesSearch && !isSessionPast(s)
      if (sessionFilter === 'past') return matchesSearch && isSessionPast(s)
      return matchesSearch
    })
  }, [sessions, sessionFilter, searchQuery])

  const upcomingSessions = useMemo(
    () => sessions.filter((s) => !isSessionPast(s)),
    [sessions]
  )
  const activeSessions = useMemo(
    () => sessions.filter((s) => s.status === 'ACTIVE'),
    [sessions]
  )

  const handleCreateSession = useCallback(
    (data: Omit<VisioSession, 'id' | 'status' | 'duration' | 'jitsiUrl'>) => {
      const newSession: VisioSession = {
        ...data,
        id: `vs-${Date.now()}`,
        status: 'WAITING',
        jitsiUrl: `${JITSI_SERVER}/${data.roomName}`,
      }
      setSessions((prev) => [newSession, ...prev])
      setSelectedSessionId(newSession.id)

      // Try POST to API
      authFetch('/api/visio/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: data.beneficiaryId,
          roomSubject: data.roomSubject,
        }),
      }).catch(() => {
        // API not available — local state only
      })
    },
    []
  )

  const handleJoinSession = useCallback((session: VisioSession) => {
    setSelectedSessionId(session.id)
    setIsInRoom(true)
  }, [])

  const handleLeaveRoom = useCallback(() => {
    setIsInRoom(false)
    // Don't deselect — keep session info visible
  }, [])

  // If in room, show full Jitsi view
  if (isInRoom && selectedSession) {
    return (
      <div className="h-[calc(100vh-8rem)] -m-4 md:-m-6 lg:-m-8">
        <JitsiRoomView session={selectedSession} onLeave={handleLeaveRoom} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00838F] to-emerald-600">
              <Video className="h-4 w-4 text-white" />
            </div>
            Visioconference
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {upcomingSessions.length} session{upcomingSessions.length > 1 ? 's' : ''} a venir
            {activeSessions.length > 0 && (
              <span className="text-emerald-600 font-medium">
                {' '}&middot; {activeSessions.length} en cours
              </span>
            )}
          </p>
        </div>

        <CreateSessionDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreate={handleCreateSession}
        />

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-[#00838F] to-emerald-600 hover:from-[#006978] hover:to-emerald-700 text-white shadow-lg shadow-teal-500/20"
        >
          <Plus className="h-4 w-4" />
          Creer une session visio
        </Button>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'A venir',
            value: upcomingSessions.filter((s) => s.status === 'WAITING').length,
            color: 'text-[#00838F]',
            bg: 'bg-[#00838F]/10',
          },
          {
            label: 'En cours',
            value: activeSessions.length,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          },
          {
            label: 'Terminees',
            value: sessions.filter((s) => s.status === 'ENDED').length,
            color: 'text-muted-foreground',
            bg: 'bg-muted',
          },
          {
            label: 'Annulees',
            value: sessions.filter((s) => s.status === 'CANCELLED').length,
            color: 'text-red-500',
            bg: 'bg-red-50 dark:bg-red-900/20',
          },
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

      {/* Main content: session list + detail/empty state */}
      <div className="flex flex-col lg:flex-row gap-5 min-h-[480px]">
        {/* Left panel: session list */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="w-full lg:w-96 shrink-0"
        >
          <Card className="border-border h-full flex flex-col">
            {/* Search + filters */}
            <div className="p-4 space-y-3 border-b border-border">
              <div className="relative">
                <Users className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une session..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
                {searchQuery && (
                  <button
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                {(['all', 'upcoming', 'past'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSessionFilter(filter)}
                    className={cn(
                      'flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all duration-200',
                      sessionFilter === filter
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {filter === 'all' ? 'Toutes' : filter === 'upcoming' ? 'A venir' : 'Passees'}
                  </button>
                ))}
              </div>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto max-h-[400px] lg:max-h-[520px] p-3 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-xs">Chargement...</span>
                  </div>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">Aucune session</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {searchQuery
                      ? 'Aucun resultat pour votre recherche'
                      : sessionFilter !== 'all'
                        ? 'Aucune session dans cette categorie'
                        : 'Creez votre premiere session visio'}
                  </p>
                  {!searchQuery && sessionFilter === 'all' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-1.5 text-xs"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="h-3 w-3" />
                      Creer une session
                    </Button>
                  )}
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      isSelected={selectedSessionId === session.id}
                      onSelect={() => {
                        setSelectedSessionId(session.id)
                        if (session.status === 'ACTIVE') {
                          setIsInRoom(true)
                        }
                      }}
                      onJoin={() => handleJoinSession(session)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Right panel: detail or empty state */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex-1 min-h-[400px]"
        >
          <Card className="h-full border-border">
            <AnimatePresence mode="wait">
              {selectedSession && !isInRoom ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="h-full flex flex-col"
                >
                  {/* Session header */}
                  <div className="p-5 border-b border-border">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback
                          className={cn(
                            'text-sm font-bold',
                            isSessionActive(selectedSession)
                              ? 'bg-emerald-100 text-emerald-700'
                              : isSessionPast(selectedSession)
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-primary/10 text-primary'
                          )}
                        >
                          {selectedSession.beneficiaryInitials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-foreground">
                          {selectedSession.roomSubject}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          avec {selectedSession.beneficiaryName}
                        </p>
                      </div>

                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs px-3 py-1 gap-1.5',
                          statusConfig[selectedSession.status].bg,
                          statusConfig[selectedSession.status].color
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-2 w-2 rounded-full',
                            statusConfig[selectedSession.status].dotColor
                          )}
                        />
                        {statusConfig[selectedSession.status].label}
                      </Badge>
                    </div>

                    {/* Session info */}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formatDateFr(selectedSession.scheduledAt)}
                      </div>
                      {selectedSession.duration && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {formatDuration(selectedSession.duration)}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {selectedSession.conseillerName}
                      </div>
                    </div>
                  </div>

                  {/* Session detail body */}
                  <div className="flex-1 flex items-center justify-center p-8">
                    {selectedSession.status === 'ACTIVE' ? (
                      <div className="text-center space-y-4">
                        <div className="relative inline-block">
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                            <Video className="h-10 w-10 text-emerald-600" />
                          </div>
                          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-ping" />
                            <span className="absolute h-2.5 w-2.5 rounded-full bg-white" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-foreground">
                            Session en cours
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Cette session est active. Rejoignez la maintenant.
                          </p>
                        </div>
                        <Button
                          onClick={() => handleJoinSession(selectedSession)}
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          size="lg"
                        >
                          <Phone className="h-4 w-4" />
                          Rejoindre la visioconference
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 mt-2"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${JITSI_SERVER}/${selectedSession.roomName}`
                            )
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copier le lien d&apos;invitation
                        </Button>
                      </div>
                    ) : selectedSession.status === 'WAITING' ? (
                      <div className="text-center space-y-4">
                        <div className="inline-block">
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/20">
                            <Clock className="h-10 w-10 text-amber-600" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-foreground">
                            Session planifiee
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Cette session est en attente. Elle sera accessible a l&apos;heure prevue.
                          </p>
                        </div>

                        {/* Countdown or time until */}
                        <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {formatDateFr(selectedSession.scheduledAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${JITSI_SERVER}/${selectedSession.roomName}`
                              )
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copier le lien
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => {
                              setSessions((prev) =>
                                prev.map((s) =>
                                  s.id === selectedSession.id
                                    ? { ...s, status: 'ACTIVE' as SessionStatus }
                                    : s
                                )
                              )
                            }}
                          >
                            <Video className="h-3.5 w-3.5 text-emerald-600" />
                            Demarrer maintenant
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="inline-block">
                          <div className={cn(
                            'flex h-20 w-20 items-center justify-center rounded-2xl',
                            selectedSession.status === 'CANCELLED'
                              ? 'bg-red-100 dark:bg-red-900/20'
                              : 'bg-muted'
                          )}>
                            {selectedSession.status === 'CANCELLED' ? (
                              <X className="h-10 w-10 text-red-500" />
                            ) : (
                              <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-foreground">
                            {selectedSession.status === 'CANCELLED'
                              ? 'Session annulee'
                              : 'Session terminee'}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedSession.status === 'CANCELLED'
                              ? 'Cette session a ete annulee.'
                              : selectedSession.duration
                                ? `Session de ${formatDuration(selectedSession.duration)} terminee avec succes.`
                                : 'Session terminee.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="h-full"
                >
                  <EmptyState onCreateClick={() => setCreateDialogOpen(true)} />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
