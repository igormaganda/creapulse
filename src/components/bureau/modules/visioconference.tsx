'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Video,
  Calendar,
  Users,
  Clock,
  Mic,
  MicOff,
  VideoIcon,
  PhoneOff,
  MonitorUp,
  MessageSquare,
  Download,
  Plus,
  Search,
  Send,
  Loader2,
  X,
  ChevronRight,
  ChevronDown,
  Circle,
  Sparkles,
  FileText,
  CheckCircle2,
  ArrowLeft,
  Copy,
  DoorOpen,
} from 'lucide-react'
import { authFetch } from '@/lib/auth-fetch'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type MeetingType = 'Entretien' | 'Mentorat' | 'Groupe' | 'Formation'
type MeetingStatus = 'À venir' | 'En cours' | 'Terminé'

interface Participant {
  name: string
  initials: string
  color: string
}

interface Meeting {
  id: string
  title: string
  date: string
  time: string
  type: MeetingType
  status: MeetingStatus
  participants: Participant[]
  description: string
  agenda: string
  notes: string
  actionItems: string[]
  aiSummary: string
  duration?: number
}

interface VirtualRoom {
  id: string
  name: string
  capacity: number
  available: boolean
  currentOccupants: number
}

interface ChatMessage {
  id: string
  sender: string
  text: string
  time: string
  isMe: boolean
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const STORAGE_KEY = 'creapulse-visioconference'

const COLORS = [
  'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-sky-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500',
]

const TYPE_COLORS: Record<MeetingType, string> = {
  'Entretien': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  'Mentorat': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Groupe': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Formation': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
}

const STATUS_COLORS: Record<MeetingStatus, string> = {
  'À venir': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'En cours': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Terminé': 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
}

const MOCK_PARTICIPANTS: Participant[] = [
  { name: 'Marie Dupont', initials: 'MD', color: 'bg-violet-500' },
  { name: 'Jean Martin', initials: 'JM', color: 'bg-emerald-500' },
  { name: 'Sophie Bernard', initials: 'SB', color: 'bg-amber-500' },
  { name: 'Pierre Leroy', initials: 'PL', color: 'bg-rose-500' },
  { name: 'Claire Moreau', initials: 'CM', color: 'bg-sky-500' },
  { name: 'Lucas Petit', initials: 'LP', color: 'bg-teal-500' },
]

const SEED_MEETINGS: Meeting[] = [
  {
    id: 'm1',
    title: 'Point de suivi projet',
    date: '2025-07-28',
    time: '10:00',
    type: 'Entretien',
    status: 'À venir',
    participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[1]],
    description: 'Suivi mensuel de l\'avancement du projet entrepreneurial.',
    agenda: '1. Bilan des actions du mois\n2. Points bloquants\n3. Prochaines étapes',
    notes: '',
    actionItems: [],
    aiSummary: '',
  },
  {
    id: 'm2',
    title: 'Session mentorat — Strategy marketing',
    date: '2025-07-30',
    time: '14:30',
    type: 'Mentorat',
    status: 'À venir',
    participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[2], MOCK_PARTICIPANTS[3]],
    description: 'Mentorat sur la stratégie de lancement et le plan marketing.',
    agenda: '1. Revue du positionnement\n2. Canaux d\'acquisition\n3. Budget prévisionnel',
    notes: '',
    actionItems: [],
    aiSummary: '',
  },
  {
    id: 'm3',
    title: 'Atelier création de réseau',
    date: '2025-08-02',
    time: '09:00',
    type: 'Groupe',
    status: 'À venir',
    participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[1], MOCK_PARTICIPANTS[2], MOCK_PARTICIPANTS[4]],
    description: 'Atelier collectif sur le développement de son réseau professionnel.',
    agenda: '1. Présentation des participants\n2. Exercice de networking\n3. Partage de bonnes pratiques',
    notes: '',
    actionItems: [],
    aiSummary: '',
  },
  {
    id: 'm4',
    title: 'Formation — Business Model Canvas',
    date: '2025-08-05',
    time: '10:00',
    type: 'Formation',
    status: 'À venir',
    participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[1], MOCK_PARTICIPANTS[3], MOCK_PARTICIPANTS[5], MOCK_PARTICIPANTS[4]],
    description: 'Formation interactive sur le Business Model Canvas.',
    agenda: '1. Introduction au BMC\n2. Travail en sous-groupes\n3. Présentation et feedback',
    notes: '',
    actionItems: [],
    aiSummary: '',
  },
  {
    id: 'm5',
    title: 'Bilan trimestriel',
    date: '2025-06-15',
    time: '11:00',
    type: 'Entretien',
    status: 'Terminé',
    participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[1]],
    description: 'Bilan des 3 derniers mois et objectifs pour le trimestre suivant.',
    agenda: '1. Revue des objectifs\n2. Analyse des résultats\n3. Nouveaux objectifs',
    notes: 'Bilan positif. Le projet avance bien sur le volet commercial. Points d\'amélioration identifiés sur la gestion de trésorerie. Prochain objectif : finaliser le business plan avant fin juillet.',
    actionItems: ['Finaliser le business plan', 'Mettre à jour le prévisionnel financier', 'Prendre RDV expert-comptable'],
    aiSummary: '',
    duration: 45,
  },
  {
    id: 'm6',
    title: 'Rencontre avec mentor',
    date: '2025-06-01',
    time: '15:00',
    type: 'Mentorat',
    status: 'Terminé',
    participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[2]],
    description: 'Première rencontre avec le mentor assigné.',
    agenda: '1. Présentation mutuelle\n2. Objectifs du mentorat\n3. Planning des sessions',
    notes: 'Très bonne première impression. Le mentor a une grande expérience dans le secteur du e-commerce. Accord sur un rythme de 2 sessions par mois pendant 6 mois.',
    actionItems: ['Envoyer le deck de présentation', 'Préparer les questions pour la prochaine session'],
    aiSummary: '',
    duration: 60,
  },
]

const MOCK_ROOMS: VirtualRoom[] = [
  { id: 'room-a', name: 'Salle A', capacity: 4, available: true, currentOccupants: 0 },
  { id: 'room-b', name: 'Salle B', capacity: 8, available: true, currentOccupants: 0 },
  { id: 'room-c', name: 'Salle C', capacity: 12, available: false, currentOccupants: 6 },
  { id: 'room-d', name: 'Salle D', capacity: 6, available: true, currentOccupants: 0 },
  { id: 'room-e', name: 'Salle E', capacity: 20, available: true, currentOccupants: 0 },
  { id: 'room-f', name: 'Salle F', capacity: 4, available: false, currentOccupants: 3 },
]

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function generateId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function loadMeetings(): Meeting[] {
  if (typeof window === 'undefined') return SEED_MEETINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MEETINGS))
  return SEED_MEETINGS
}

function saveMeetings(meetings: Meeting[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings))
  }
}

// ────────────────────────────────────────────
// Main Module
// ────────────────────────────────────────────

export function VisioconferenceModule() {
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MEETINGS))
    return SEED_MEETINGS
  })
  const [loading, setLoading] = useState(false)

  const updateMeetings = useCallback((updated: Meeting[]) => {
    setMeetings(updated)
    saveMeetings(updated)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/20">
          <Video className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visioconférence</h1>
          <p className="text-sm text-muted-foreground">Gérez vos réunions et salles virtuelles</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="reunions" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="reunions" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Réunions
          </TabsTrigger>
          <TabsTrigger value="salles" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <DoorOpen className="h-4 w-4 mr-2" />
            Salles virtuelles
          </TabsTrigger>
          <TabsTrigger value="historique" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reunions">
          <ReunionsTab meetings={meetings} onUpdateMeetings={updateMeetings} />
        </TabsContent>
        <TabsContent value="salles">
          <SallesTab />
        </TabsContent>
        <TabsContent value="historique">
          <HistoriqueTab meetings={meetings} onUpdateMeetings={updateMeetings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ────────────────────────────────────────────
// Tab 1: Réunions
// ────────────────────────────────────────────

function ReunionsTab({
  meetings,
  onUpdateMeetings,
}: {
  meetings: Meeting[]
  onUpdateMeetings: (m: Meeting[]) => void
}) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  const filtered = meetings
    .filter((m) => m.status !== 'Terminé')
    .filter((m) => {
      if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterType !== 'all' && m.type !== filterType) return false
      if (filterStatus !== 'all' && m.status !== filterStatus) return false
      return true
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const handleCreateMeeting = (data: Omit<Meeting, 'id' | 'status' | 'notes' | 'actionItems' | 'aiSummary' | 'duration'>) => {
    const newMeeting: Meeting = {
      ...data,
      id: generateId(),
      status: 'À venir',
      notes: '',
      actionItems: [],
      aiSummary: '',
    }
    onUpdateMeetings([...meetings, newMeeting])
    setShowCreateForm(false)
    toast.success('Réunion planifiée avec succès')
  }

  const handleDeleteMeeting = (id: string) => {
    onUpdateMeetings(meetings.filter((m) => m.id !== id))
    setSelectedMeeting(null)
    toast.success('Réunion supprimée')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une réunion..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="Entretien">Entretien</SelectItem>
              <SelectItem value="Mentorat">Mentorat</SelectItem>
              <SelectItem value="Groupe">Groupe</SelectItem>
              <SelectItem value="Formation">Formation</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="À venir">À venir</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreateForm(true)} className="bg-violet-600 hover:bg-violet-700 text-white shrink-0">
            <Plus className="h-4 w-4 mr-1" />
            Planifier
          </Button>
        </div>
      </div>

      {/* Meeting list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Aucune réunion trouvée</p>
            <Button variant="link" className="text-violet-600 mt-1" onClick={() => setShowCreateForm(true)}>
              Planifier une réunion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((meeting) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.005 }}
            >
              <Card
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700"
                onClick={() => setSelectedMeeting(meeting)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">{meeting.title}</h3>
                        <Badge variant="secondary" className={cn('text-xs', TYPE_COLORS[meeting.type])}>
                          {meeting.type}
                        </Badge>
                        <Badge variant="secondary" className={cn('text-xs', STATUS_COLORS[meeting.status])}>
                          {meeting.status === 'En cours' && (
                            <span className="flex items-center gap-1">
                              <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
                            </span>
                          )}
                          {meeting.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(meeting.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {meeting.time}
                        </span>
                      </div>
                      {meeting.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{meeting.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {meeting.participants.slice(0, 4).map((p, i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium text-white ring-2 ring-background -ml-1 first:ml-0',
                            p.color
                          )}
                          title={p.name}
                        >
                          {p.initials}
                        </div>
                      ))}
                      {meeting.participants.length > 4 && (
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium bg-muted text-muted-foreground ring-2 ring-background -ml-1">
                          +{meeting.participants.length - 4}
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Meeting Dialog */}
      {showCreateForm && (
        <CreateMeetingDialog
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateMeeting}
        />
      )}

      {/* Meeting Detail Dialog */}
      {selectedMeeting && (
        <MeetingDetailDialog
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onDelete={() => handleDeleteMeeting(selectedMeeting.id)}
        />
      )}
    </motion.div>
  )
}

// ────────────────────────────────────────────
// Create Meeting Dialog
// ────────────────────────────────────────────

function CreateMeetingDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: Omit<Meeting, 'id' | 'status' | 'notes' | 'actionItems' | 'aiSummary' | 'duration'>) => void
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState<MeetingType>('Entretien')
  const [description, setDescription] = useState('')
  const [agenda, setAgenda] = useState('')
  const [participantInput, setParticipantInput] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([MOCK_PARTICIPANTS[0]])

  const addParticipant = () => {
    const name = participantInput.trim()
    if (!name) return
    const initials = getInitials(name)
    const color = COLORS[participants.length % COLORS.length]
    setParticipants([...participants, { name, initials, color }])
    setParticipantInput('')
  }

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!title || !date || !time) {
      toast.error('Veuillez remplir le titre, la date et l\'heure')
      return
    }
    onSubmit({ title, date, time, type, participants, description, agenda })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-violet-600" />
            Planifier une réunion
          </DialogTitle>
          <DialogDescription>Remplissez les informations de la réunion</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Titre *</label>
            <Input
              placeholder="Ex: Point de suivi projet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Date *</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Heure *</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as MeetingType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Entretien">Entretien</SelectItem>
                <SelectItem value="Mentorat">Mentorat</SelectItem>
                <SelectItem value="Groupe">Groupe</SelectItem>
                <SelectItem value="Formation">Formation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Participants</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {participants.map((p, i) => (
                <Badge key={i} variant="secondary" className="gap-1.5 py-1.5 px-2.5">
                  <div className={cn('h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white', p.color)}>
                    {p.initials}
                  </div>
                  {p.name}
                  <button onClick={() => removeParticipant(i)} className="ml-0.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nom du participant"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
              />
              <Button variant="outline" size="icon" onClick={addParticipant}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <Textarea
              placeholder="Description de la réunion..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Ordre du jour</label>
            <Textarea
              placeholder="1. Point 1&#10;2. Point 2&#10;3. Point 3"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} className="bg-violet-600 hover:bg-violet-700 text-white">
              Planifier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────
// Meeting Detail Dialog
// ────────────────────────────────────────────

function MeetingDetailDialog({
  meeting,
  onClose,
  onDelete,
}: {
  meeting: Meeting
  onClose: () => void
  onDelete: () => void
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {meeting.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={cn('text-xs', TYPE_COLORS[meeting.type])}>
              {meeting.type}
            </Badge>
            <Badge variant="secondary" className={cn('text-xs', STATUS_COLORS[meeting.status])}>
              {meeting.status}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Date & Time */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-violet-500" />
              {formatDate(meeting.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-violet-500" />
              {meeting.time}
            </span>
          </div>

          {/* Participants */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-violet-500" />
              Participants ({meeting.participants.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {meeting.participants.map((p, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
                  <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white', p.color)}>
                    {p.initials}
                  </div>
                  <span className="text-sm">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {meeting.description && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{meeting.description}</p>
            </div>
          )}

          {meeting.agenda && (
            <div>
              <h4 className="text-sm font-semibold mb-1.5">Ordre du jour</h4>
              <div className="bg-muted rounded-lg p-3">
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{meeting.agenda}</pre>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Supprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────
// Tab 2: Salles virtuelles
// ────────────────────────────────────────────

function SallesTab() {
  const [inCall, setInCall] = useState(false)
  const [activeRoom, setActiveRoom] = useState<VirtualRoom | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [callTimer, setCallTimer] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Marie Dupont', text: 'Bonjour à tous !', time: '10:00', isMe: false },
    { id: '2', sender: 'Moi', text: 'Bonjour Marie !', time: '10:00', isMe: true },
  ])
  const [chatInput, setChatInput] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inCall) {
      timerRef.current = setInterval(() => setCallTimer((t) => t + 1), 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [inCall])

  useEffect(() => {
    if (isRecording) {
      recordTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current)
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current)
    }
  }, [isRecording])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const joinRoom = (room: VirtualRoom) => {
    setActiveRoom(room)
    setInCall(true)
    setIsChatOpen(false)
    setCallTimer(0)
    setIsRecording(false)
    setRecordingTime(0)
    toast.success(`Vous avez rejoint la ${room.name}`)
  }

  const leaveCall = () => {
    setInCall(false)
    setActiveRoom(null)
    setIsMuted(false)
    setIsCameraOff(false)
    setIsScreenSharing(false)
    setIsChatOpen(false)
    setIsRecording(false)
    setCallTimer(0)
    setRecordingTime(0)
    if (timerRef.current) clearInterval(timerRef.current)
    if (recordTimerRef.current) clearInterval(recordTimerRef.current)
    toast.info('Vous avez quitté la réunion')
  }

  const sendMessage = () => {
    if (!chatInput.trim()) return
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setChatMessages([...chatMessages, {
      id: `msg-${Date.now()}`,
      sender: 'Moi',
      text: chatInput.trim(),
      time: timeStr,
      isMe: true,
    }])
    setChatInput('')
  }

  // Simulated participants in call
  const callParticipants = activeRoom
    ? [MOCK_PARTICIPANTS[0], ...MOCK_PARTICIPANTS.slice(1, Math.min(activeRoom.capacity, 5))]
    : []

  // Call interface
  if (inCall && activeRoom) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] -m-4 md:-m-6 lg:-m-8"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={leaveCall}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-medium">{activeRoom.name} — Réunion en cours</p>
              <p className="text-xs text-gray-400">{activeRoom.currentOccupants} participants</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isRecording && (
              <div className="flex items-center gap-1.5 text-red-400 text-sm">
                <Circle className="h-3 w-3 fill-red-500 text-red-500 animate-pulse" />
                <span>Enregistrement {formatDuration(recordingTime)}</span>
              </div>
            )}
            <div className="text-sm font-mono text-gray-300">{formatDuration(callTimer)}</div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex overflow-hidden bg-gray-950">
          {/* Video grid */}
          <div className="flex-1 p-3 flex items-center justify-center">
            <div className="grid gap-3 w-full h-full" style={{
              gridTemplateColumns: callParticipants.length <= 2
                ? `repeat(${Math.min(callParticipants.length, 2)}, 1fr)`
                : `repeat(3, 1fr)`,
              gridTemplateRows: callParticipants.length <= 2 ? '1fr' : `repeat(${Math.ceil(callParticipants.length / 3)}, 1fr)`,
            }}>
              {callParticipants.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden min-h-[120px]"
                >
                  <div className={cn('h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold text-white', p.color)}>
                    {p.initials}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/60 rounded-md px-2.5 py-1 flex items-center gap-2">
                    <span className="text-xs text-white font-medium">{p.name}</span>
                    {i === 0 && (
                      <Mic className="h-3 w-3 text-green-400" />
                    )}
                  </div>
                  {i === 0 && (
                    <div className="absolute top-3 right-3 bg-violet-600 rounded-md px-2 py-0.5 text-[10px] text-white font-medium">
                      Vous
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Side chat */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-800">
                  <h3 className="text-sm font-semibold text-white">Chat</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={cn('flex flex-col', msg.isMe ? 'items-end' : 'items-start')}>
                      <span className="text-[10px] text-gray-500 mb-0.5">{msg.sender} · {msg.time}</span>
                      <div className={cn(
                        'rounded-lg px-3 py-2 max-w-[85%] text-sm',
                        msg.isMe
                          ? 'bg-violet-600 text-white rounded-br-sm'
                          : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-gray-800">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Écrire un message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-sm"
                    />
                    <Button size="icon" onClick={sendMessage} className="bg-violet-600 hover:bg-violet-700 text-white shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-center gap-3 px-4 py-4 bg-gray-900 border-t border-gray-800">
          <Button
            variant={isMuted ? 'destructive' : 'ghost'}
            size="icon"
            className={cn('h-12 w-12 rounded-full', !isMuted && 'text-white hover:bg-white/10')}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button
            variant={isCameraOff ? 'destructive' : 'ghost'}
            size="icon"
            className={cn('h-12 w-12 rounded-full', !isCameraOff && 'text-white hover:bg-white/10')}
            onClick={() => setIsCameraOff(!isCameraOff)}
          >
            {isCameraOff ? <VideoIcon className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
          </Button>
          <Button
            variant={isScreenSharing ? 'default' : 'ghost'}
            size="icon"
            className={cn('h-12 w-12 rounded-full', !isScreenSharing && 'text-white hover:bg-white/10', isScreenSharing && 'bg-violet-600 hover:bg-violet-700')}
            onClick={() => {
              setIsScreenSharing(!isScreenSharing)
              toast(isScreenSharing ? 'Partage d\'écran arrêté' : 'Partage d\'écran démarré')
            }}
          >
            <MonitorUp className="h-5 w-5" />
          </Button>
          <Button
            variant={isChatOpen ? 'default' : 'ghost'}
            size="icon"
            className={cn('h-12 w-12 rounded-full', !isChatOpen && 'text-white hover:bg-white/10', isChatOpen && 'bg-violet-600 hover:bg-violet-700')}
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button
            variant={isRecording ? 'destructive' : 'ghost'}
            size="icon"
            className={cn('h-12 w-12 rounded-full', !isRecording && 'text-white hover:bg-white/10')}
            onClick={() => {
              setIsRecording(!isRecording)
              if (!isRecording) {
                setRecordingTime(0)
                toast.success('Enregistrement démarré')
              } else {
                toast.info('Enregistrement arrêté')
              }
            }}
          >
            <Circle className={cn('h-5 w-5', isRecording && 'fill-current animate-pulse')} />
          </Button>
          <div className="w-px h-8 bg-gray-700 mx-1" />
          <Button
            variant="destructive"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={leaveCall}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>
    )
  }

  // Room grid
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Salles disponibles</h3>
          <p className="text-sm text-muted-foreground">{MOCK_ROOMS.filter(r => r.available).length} salles libres sur {MOCK_ROOMS.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_ROOMS.map((room) => (
          <motion.div
            key={room.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className={cn(
              'transition-all duration-200',
              room.available ? 'hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700' : 'opacity-60'
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Video className="h-4 w-4 text-violet-500" />
                    {room.name}
                  </CardTitle>
                  <Badge variant={room.available ? 'default' : 'secondary'} className={
                    room.available
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }>
                    {room.available ? 'Disponible' : 'Occupée'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {room.capacity} places max
                  </span>
                  {room.currentOccupants > 0 && (
                    <span className="flex items-center gap-1">
                      <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                      {room.currentOccupants} en ligne
                    </span>
                  )}
                </div>
                <Button
                  className={cn(
                    'w-full',
                    room.available
                      ? 'bg-violet-600 hover:bg-violet-700 text-white'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                  disabled={!room.available}
                  onClick={() => joinRoom(room)}
                >
                  {room.available ? (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Rejoindre la salle
                    </>
                  ) : (
                    'Salle occupée'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ────────────────────────────────────────────
// Tab 3: Historique
// ────────────────────────────────────────────

function HistoriqueTab({
  meetings,
  onUpdateMeetings,
}: {
  meetings: Meeting[]
  onUpdateMeetings: (m: Meeting[]) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState<string | null>(null)

  const pastMeetings = meetings
    .filter((m) => m.status === 'Terminé')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const updateMeetingNotes = (id: string, notes: string) => {
    onUpdateMeetings(meetings.map((m) => (m.id === id ? { ...m, notes } : m)))
  }

  const updateActionItems = (id: string, items: string[]) => {
    onUpdateMeetings(meetings.map((m) => (m.id === id ? { ...m, actionItems: items } : m)))
  }

  const generateAISummary = async (meeting: Meeting) => {
    setLoadingSummary(meeting.id)
    try {
      const res = await authFetch('/api/visioconference', {
        method: 'POST',
        body: JSON.stringify({ action: 'ai-summary', notes: meeting.notes, title: meeting.title, type: meeting.type }),
      })
      const data = await res.json()
      if (data.success && data.summary) {
        onUpdateMeetings(meetings.map((m) =>
          m.id === meeting.id ? { ...m, aiSummary: data.summary } : m
        ))
        toast.success('Résumé IA généré')
      } else {
        toast.error('Erreur lors de la génération du résumé')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoadingSummary(null)
    }
  }

  const downloadNotes = (meeting: Meeting) => {
    const text = [
      `Réunion : ${meeting.title}`,
      `Date : ${formatDate(meeting.date)}`,
      `Type : ${meeting.type}`,
      `Durée : ${meeting.duration ? `${meeting.duration} min` : 'N/A'}`,
      `Participants : ${meeting.participants.map((p) => p.name).join(', ')}`,
      '',
      '--- Notes ---',
      meeting.notes || 'Aucune note',
      '',
      '--- Résumé IA ---',
      meeting.aiSummary || 'Non généré',
      '',
      '--- Actions ---',
      meeting.actionItems.length > 0
        ? meeting.actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')
        : 'Aucune action définie',
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reunion-${meeting.title.toLowerCase().replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Notes téléchargées')
  }

  const addActionItem = (meetingId: string) => {
    const items = meetings.find((m) => m.id === meetingId)?.actionItems || []
    updateActionItems(meetingId, [...items, ''])
  }

  const updateActionItem = (meetingId: string, index: number, value: string) => {
    const items = [...(meetings.find((m) => m.id === meetingId)?.actionItems || [])]
    items[index] = value
    updateActionItems(meetingId, items)
  }

  const removeActionItem = (meetingId: string, index: number) => {
    const items = (meetings.find((m) => m.id === meetingId)?.actionItems || []).filter((_, i) => i !== index)
    updateActionItems(meetingId, items)
  }

  if (pastMeetings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Aucune réunion passée</p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {pastMeetings.map((meeting) => {
        const isExpanded = expandedId === meeting.id
        return (
          <motion.div key={meeting.id} layout>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header row (always visible) */}
                <button
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpand(meeting.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                      <Badge variant="secondary" className={cn('text-xs', TYPE_COLORS[meeting.type])}>
                        {meeting.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(meeting.date)}
                      </span>
                      {meeting.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {meeting.duration} min
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {meeting.participants.length} participants
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    'h-5 w-5 text-muted-foreground shrink-0 transition-transform',
                    isExpanded && 'rotate-180'
                  )} />
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4">
                        <Separator />

                        {/* Notes */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Notes de réunion</h4>
                          <Textarea
                            placeholder="Écrivez vos notes ici..."
                            value={meeting.notes}
                            onChange={(e) => updateMeetingNotes(meeting.id, e.target.value)}
                            rows={4}
                            className="text-sm"
                          />
                        </div>

                        {/* Action items */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-violet-500" />
                              Actions ({meeting.actionItems.length})
                            </h4>
                            <Button variant="ghost" size="sm" className="text-violet-600 h-7" onClick={() => addActionItem(meeting.id)}>
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Ajouter
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {meeting.actionItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                <Input
                                  value={item}
                                  onChange={(e) => updateActionItem(meeting.id, i, e.target.value)}
                                  placeholder="Action..."
                                  className="text-sm"
                                />
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeActionItem(meeting.id, i)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                            {meeting.actionItems.length === 0 && (
                              <p className="text-sm text-muted-foreground pl-6">Aucune action définie</p>
                            )}
                          </div>
                        </div>

                        {/* AI Summary */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold flex items-center gap-1.5">
                              <Sparkles className="h-4 w-4 text-violet-500" />
                              Résumé IA
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-violet-600 border-violet-300 h-7"
                              onClick={() => generateAISummary(meeting)}
                              disabled={loadingSummary === meeting.id || !meeting.notes}
                            >
                              {loadingSummary === meeting.id ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5 mr-1" />
                              )}
                              Générer un résumé
                            </Button>
                          </div>
                          {meeting.aiSummary ? (
                            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 text-sm text-foreground border border-violet-200 dark:border-violet-800">
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                                <p className="whitespace-pre-wrap">{meeting.aiSummary}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 text-violet-600 h-7"
                                onClick={() => {
                                  navigator.clipboard.writeText(meeting.aiSummary)
                                  toast.success('Résumé copié')
                                }}
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                Copier
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {meeting.notes
                                ? 'Cliquez sur "Générer un résumé" pour obtenir un résumé intelligent de vos notes.'
                                : 'Rédigez des notes pour générer un résumé IA.'
                              }
                            </p>
                          )}
                        </div>

                        {/* Download button */}
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-violet-600 border-violet-300"
                            onClick={() => downloadNotes(meeting)}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Télécharger les notes
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}