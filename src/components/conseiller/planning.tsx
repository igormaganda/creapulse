'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Video,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

/* ─── Types ─── */
type AppointmentType = 'bilan' | 'suivi' | 'atelier'
type AppointmentMode = 'physique' | 'video' | 'telephone'

interface Appointment {
  id: string
  date: string
  startTime: string
  endTime: string
  beneficiaryId: string
  beneficiaryName: string
  beneficiaryInitials: string
  type: AppointmentType
  mode: AppointmentMode
  location?: string
  notes?: string
}

/* ─── Configs ─── */
const typeConfig: Record<AppointmentType, { label: string; color: string; bg: string }> = {
  bilan: { label: 'Bilan', color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
  suivi: { label: 'Suivi', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  atelier: { label: 'Atelier', color: 'text-coral-500 dark:text-coral-400', bg: 'bg-coral-50 dark:bg-coral-900/20' },
}

const modeConfig: Record<AppointmentMode, { label: string; icon: typeof MapPin }> = {
  physique: { label: 'Physique', icon: MapPin },
  video: { label: 'Video', icon: Video },
  telephone: { label: 'Telephone', icon: Phone },
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HOURS = Array.from({ length: 10 }, (_, i) => i + 9) // 9h-18h

/* ─── Helpers ─── */
function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date())
}

/* ─── Generate mock appointments for current week ─── */
function generateMockAppointments(): Appointment[] {
  const today = new Date()
  const monday = getMonday(today)

  function offsetDate(dayOffset: number): string {
    const d = new Date(monday)
    d.setDate(d.getDate() + dayOffset)
    return d.toISOString().split('T')[0]
  }

  return [
    { id: 'p1', date: offsetDate(0), startTime: '09:00', endTime: '10:00', beneficiaryId: 'b1', beneficiaryName: 'Amadou Diallo', beneficiaryInitials: 'AD', type: 'suivi', mode: 'physique', location: 'GIDEF Paris - Salle A', notes: 'Suivi business plan Afrika Fusion.' },
    { id: 'p2', date: offsetDate(0), startTime: '14:00', endTime: '15:30', beneficiaryId: 'b2', beneficiaryName: 'Lea Fontaine', beneficiaryInitials: 'LF', type: 'bilan', mode: 'video', notes: 'Bilan trimestriel EcoTech Solutions.' },
    { id: 'p3', date: offsetDate(1), startTime: '09:30', endTime: '11:00', beneficiaryId: 'b3', beneficiaryName: 'Marc Renaud', beneficiaryInitials: 'MR', type: 'atelier', mode: 'physique', location: 'GIDEF Paris - Salle B', notes: 'Atelier Business Model Canvas.' },
    { id: 'p4', date: offsetDate(1), startTime: '15:00', endTime:  '16:00', beneficiaryId: 'b4', beneficiaryName: 'Clara Dubois', beneficiaryInitials: 'CD', type: 'suivi', mode: 'telephone', notes: 'Suivi BoxFit Paris, analyse ventes.' },
    { id: 'p5', date: offsetDate(2), startTime: '10:00', endTime: '11:00', beneficiaryId: 'b5', beneficiaryName: 'Karim Benali', beneficiaryInitials: 'KB', type: 'suivi', mode: 'video', notes: 'Suivi SnapClean.' },
    { id: 'p6', date: offsetDate(2), startTime: '14:00', endTime: '16:00', beneficiaryId: 'b6', beneficiaryName: 'Julie Moreau', beneficiaryInitials: 'JM', type: 'atelier', mode: 'physique', location: 'GIDEF Paris - Salle A', notes: 'Atelier financement. Groupe de 5.' },
    { id: 'p7', date: offsetDate(3), startTime: '09:00', endTime: '10:00', beneficiaryId: 'b7', beneficiaryName: 'Thomas Leroy', beneficiaryInitials: 'TL', type: 'bilan', mode: 'physique', location: 'GIDEF Paris - Salle C', notes: 'Bilan mi-parcours UrbanFarm.' },
    { id: 'p8', date: offsetDate(3), startTime: '11:00', endTime: '12:00', beneficiaryId: 'b8', beneficiaryName: 'Fatima Hassani', beneficiaryInitials: 'FH', type: 'suivi', mode: 'video', notes: 'Suivi CraftID, strategie digitale.' },
    { id: 'p9', date: offsetDate(3), startTime: '16:00', endTime: '17:00', beneficiaryId: 'b9', beneficiaryName: 'Hugo Petit', beneficiaryInitials: 'HP', type: 'suivi', mode: 'telephone', notes: 'Point rapide TechLab93.' },
    { id: 'p10', date: offsetDate(4), startTime: '10:00', endTime: '11:30', beneficiaryId: 'b10', beneficiaryName: 'Nadia Bouzid', beneficiaryInitials: 'NB', type: 'bilan', mode: 'physique', location: 'GIDEF Paris - Salle A', notes: 'Bilan complet MedConnect.' },
    { id: 'p11', date: offsetDate(4), startTime: '14:00', endTime: '15:00', beneficiaryId: 'b1', beneficiaryName: 'Amadou Diallo', beneficiaryInitials: 'AD', type: 'atelier', mode: 'physique', location: 'GIDEF Paris - Salle B', notes: 'Atelier marketing digital.' },
    { id: 'p12', date: offsetDate(5), startTime: '10:00', endTime: '11:00', beneficiaryId: 'b2', beneficiaryName: 'Lea Fontaine', beneficiaryInitials: 'LF', type: 'suivi', mode: 'video', notes: 'Suivi post-presentation investisseurs.' },
    { id: 'p13', date: offsetDate(1), startTime: '11:00', endTime: '12:00', beneficiaryId: 'b10', beneficiaryName: 'Nadia Bouzid', beneficiaryInitials: 'NB', type: 'bilan', mode: 'telephone', notes: 'Bilan express MedConnect.' },
    { id: 'p14', date: offsetDate(0), startTime: '16:00', endTime: '17:00', beneficiaryId: 'b6', beneficiaryName: 'Julie Moreau', beneficiaryInitials: 'JM', type: 'suivi', mode: 'video', notes: 'Suivi Papillon Events.' },
    { id: 'p15', date: offsetDate(4), startTime: '09:00', endTime: '10:00', beneficiaryId: 'b5', beneficiaryName: 'Karim Benali', beneficiaryInitials: 'KB', type: 'bilan', mode: 'physique', location: 'GIDEF Paris - Salle C', notes: 'Bilan SnapClean.' },
  ]
}

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

/* ═══════════════════════════════════════════════════════════
   Planning Component
   ═══════════════════════════════════════════════════════════ */
export function PlanningView() {
  const [appointments, setAppointments] = useState(generateMockAppointments)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  /* New appointment form */
  const [newBeneficiary, setNewBeneficiary] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')
  const [newType, setNewType] = useState<string>('')
  const [newMode, setNewMode] = useState<string>('')
  const [newNotes, setNewNotes] = useState('')

  /* ─── Week navigation ─── */
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [currentWeekStart])

  const navigateWeek = (direction: -1 | 1) => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + direction * 7)
      return d
    })
  }

  const goToday = () => {
    setCurrentWeekStart(getMonday(new Date()))
  }

  const weekLabel = useMemo(() => {
    const last = new Date(currentWeekStart)
    last.setDate(last.getDate() + 6)
    return `${formatDateShort(currentWeekStart)} - ${formatDateShort(last)}`
  }, [currentWeekStart])

  /* ─── Filter appointments for a day ─── */
  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((a) => isSameDay(new Date(a.date), day))
  }

  /* ─── Get hour for appointment ─── */
  const getAppointmentHour = (timeStr: string): number => {
    return parseInt(timeStr.split(':')[0], 10)
  }

  /* ─── Upcoming appointments (next 7 days) ─── */
  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    const in7Days = new Date(now)
    in7Days.setDate(in7Days.getDate() + 7)

    return appointments
      .filter((a) => {
        const d = new Date(a.date)
        return d >= now && d <= in7Days
      })
      .sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
        if (dateCompare !== 0) return dateCompare
        return a.startTime.localeCompare(b.startTime)
      })
  }, [appointments])

  /* ─── Submit new appointment ─── */
  const handleSubmit = () => {
    if (!newBeneficiary || !newDate || !newStartTime || !newType || !newMode) return
    const b = mockBeneficiaires.find((b) => b.id === newBeneficiary)
    if (!b) return
    const initials = `${b.name.split(' ')[0][0]}${b.name.split(' ').slice(-1)[0][0]}`.toUpperCase()
    const newAppointment: Appointment = {
      id: `p${appointments.length + 1}`,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime || `${String(parseInt(newStartTime.split(':')[0]) + 1).padStart(2, '0')}:00`,
      beneficiaryId: newBeneficiary,
      beneficiaryName: b.name,
      beneficiaryInitials: initials,
      type: newType as AppointmentType,
      mode: newMode as AppointmentMode,
      notes: newNotes || undefined,
    }
    setAppointments((prev) => [...prev, newAppointment])
    toast.success(`Rendez-vous planifie avec ${b.name}`)
    setDialogOpen(false)
    setNewBeneficiary('')
    setNewDate('')
    setNewStartTime('')
    setNewEndTime('')
    setNewType('')
    setNewMode('')
    setNewNotes('')
  }

  /* ─── Current hour indicator ─── */
  const currentHour = new Date().getHours()

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-foreground">Planning</h2>
          <p className="text-sm text-muted-foreground">
            {appointments.length} rendez-vous ce mois
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border p-0.5">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setViewMode('week')}
            >
              Semaine
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setViewMode('month')}
            >
              Mois
            </Button>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau RDV
          </Button>
        </div>
      </motion.div>

      {viewMode === 'week' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          {/* Calendar grid */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={goToday}>
                    Aujourd&apos;hui
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-semibold text-foreground">{weekLabel}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  S{getWeekNumber(currentWeekStart)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[640px]">
                {/* Day headers */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
                  <div className="p-2 text-xs text-muted-foreground text-center" />
                  {weekDays.map((day, i) => {
                    const today = isToday(day)
                    return (
                      <div
                        key={i}
                        className={`p-2 text-center border-l ${
                          today ? 'bg-primary/5' : ''
                        }`}
                      >
                        <p className={`text-xs ${today ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                          {DAYS_FR[i]}
                        </p>
                        <p className={`text-lg font-bold mt-0.5 ${
                          today ? 'text-primary' : 'text-foreground'
                        }`}>
                          {day.getDate()}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Time grid */}
                <div className="relative max-h-[520px] overflow-y-auto scrollbar-thin">
                  {HOURS.map((hour) => (
                    <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50">
                      <div className="p-2 text-xs text-muted-foreground text-right pr-3">
                        {String(hour).padStart(2, '0')}:00
                      </div>
                      {weekDays.map((day, dayIdx) => {
                        const dayAppointments = getAppointmentsForDay(day)
                        const hourAppointments = dayAppointments.filter((a) => getAppointmentHour(a.startTime) === hour)
                        const isTodayCol = isToday(day)
                        const isCurrentHourRow = isTodayCol && currentHour === hour

                        return (
                          <div
                            key={dayIdx}
                            className={`border-l p-0.5 min-h-[48px] relative ${
                              isTodayCol ? 'bg-primary/[0.02]' : ''
                            } ${isCurrentHourRow ? 'bg-primary/5' : ''}`}
                          >
                            {/* Current time indicator line */}
                            {isCurrentHourRow && (
                              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10" />
                            )}
                            {hourAppointments.map((apt) => {
                              const tc = typeConfig[apt.type]
                              return (
                                <motion.div
                                  key={apt.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  whileHover={{ scale: 1.02 }}
                                  onClick={() => {
                                    setSelectedAppointment(apt)
                                    setDetailOpen(true)
                                  }}
                                  className={`cursor-pointer rounded-md ${tc.bg} px-1.5 py-1 mb-0.5 border border-transparent hover:border-current`}
                                >
                                  <p className={`text-[10px] font-semibold leading-tight ${tc.color}`}>
                                    {apt.startTime}-{apt.endTime}
                                  </p>
                                  <p className="text-[10px] font-medium text-foreground truncate">
                                    {apt.beneficiaryName}
                                  </p>
                                  <Badge variant="secondary" className={`text-[8px] px-1 py-0 mt-0.5 ${tc.bg} ${tc.color}`}>
                                    {tc.label}
                                  </Badge>
                                </motion.div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar: upcoming appointments */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Prochains rendez-vous</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucun rendez-vous a venir</p>
              ) : (
                upcomingAppointments.slice(0, 8).map((apt, i) => {
                  const tc = typeConfig[apt.type]
                  const ModeIcon = modeConfig[apt.mode].icon
                  return (
                    <div key={apt.id}>
                      <div
                        className="flex items-start gap-2 py-2.5 cursor-pointer hover:bg-muted/50 rounded-md px-1 -mx-1 transition-colors"
                        onClick={() => {
                          setSelectedAppointment(apt)
                          setDetailOpen(true)
                        }}
                      >
                        <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                          apt.type === 'bilan' ? 'bg-teal-500' :
                          apt.type === 'suivi' ? 'bg-amber-500' : 'bg-coral-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{apt.beneficiaryName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${tc.bg} ${tc.color}`}>
                              {tc.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <ModeIcon className="h-2.5 w-2.5" />
                              {modeConfig[apt.mode].label}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDateLong(new Date(apt.date))} · {apt.startTime}-{apt.endTime}
                          </p>
                        </div>
                      </div>
                      {i < upcomingAppointments.slice(0, 8).length - 1 && <Separator />}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ─── Month view ─── */
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={goToday}>
                  Aujourd&apos;hui
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold text-foreground">
                  {currentWeekStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b">
                {DAYS_FR.map((day, i) => (
                  <div key={i} className="p-2 text-center text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Month grid (6 rows x 7 cols) */}
              {(() => {
                const monthStart = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1)
                const startDay = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1
                const daysInMonth = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth() + 1, 0).getDate()
                const today = new Date()

                const cells: { date: Date; isCurrentMonth: boolean }[] = []
                // Previous month padding
                const prevMonth = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 0)
                for (let i = startDay - 1; i >= 0; i--) {
                  cells.push({ date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i), isCurrentMonth: false })
                }
                // Current month
                for (let i = 1; i <= daysInMonth; i++) {
                  cells.push({ date: new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), i), isCurrentMonth: true })
                }
                // Next month padding
                const remaining = 42 - cells.length
                for (let i = 1; i <= remaining; i++) {
                  cells.push({ date: new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth() + 1, i), isCurrentMonth: false })
                }

                return (
                  <div className="grid grid-cols-7">
                    {cells.map((cell, idx) => {
                      const dayApts = appointments.filter((a) => isSameDay(new Date(a.date), cell.date))
                      const isT = isSameDay(cell.date, today)

                      return (
                        <div
                          key={idx}
                          className={`border-b border-r p-1 min-h-[72px] ${
                            !cell.isCurrentMonth ? 'bg-muted/20' : ''
                          } ${isT ? 'bg-primary/5' : ''}`}
                        >
                          <p className={`text-xs mb-1 ${
                            isT ? 'text-primary font-bold' : !cell.isCurrentMonth ? 'text-muted-foreground/50' : 'text-muted-foreground'
                          }`}>
                            {cell.date.getDate()}
                          </p>
                          {dayApts.slice(0, 2).map((apt) => {
                            const tc = typeConfig[apt.type]
                            return (
                              <div
                                key={apt.id}
                                onClick={() => {
                                  setSelectedAppointment(apt)
                                  setDetailOpen(true)
                                }}
                                className={`cursor-pointer rounded px-1 py-0.5 mb-0.5 text-[9px] leading-tight font-medium truncate ${tc.bg} ${tc.color}`}
                              >
                                {apt.startTime} {apt.beneficiaryName.split(' ')[0]}
                              </div>
                            )
                          })}
                          {dayApts.length > 2 && (
                            <p className="text-[9px] text-muted-foreground">+{dayApts.length - 2}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New appointment dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
            <DialogDescription>Planifier un entretien avec un beneficiaire.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Beneficiaire <span className="text-destructive">*</span></label>
              <Select value={newBeneficiary} onValueChange={setNewBeneficiary}>
                <SelectTrigger><SelectValue placeholder="Selectionner" /></SelectTrigger>
                <SelectContent>
                  {mockBeneficiaires.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date <span className="text-destructive">*</span></label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Debut <span className="text-destructive">*</span></label>
                <Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fin</label>
                <Input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type <span className="text-destructive">*</span></label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bilan">Bilan</SelectItem>
                    <SelectItem value="suivi">Suivi</SelectItem>
                    <SelectItem value="atelier">Atelier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mode <span className="text-destructive">*</span></label>
                <Select value={newMode} onValueChange={setNewMode}>
                  <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physique">Physique</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="telephone">Telephone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Ajouter des notes..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleSubmit}
              disabled={!newBeneficiary || !newDate || !newStartTime || !newType || !newMode}
            >
              Planifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[440px]">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selectedAppointment.beneficiaryName}</DialogTitle>
                <DialogDescription>{formatDateLong(new Date(selectedAppointment.date))}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {selectedAppointment.beneficiaryInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{selectedAppointment.beneficiaryName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={typeConfig[selectedAppointment.type].bg + ' ' + typeConfig[selectedAppointment.type].color}>
                        {typeConfig[selectedAppointment.type].label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedAppointment.startTime} - {selectedAppointment.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => { const ModeIcon = modeConfig[selectedAppointment.mode].icon; return <ModeIcon className="h-4 w-4 text-muted-foreground" /> })()}
                    <span>{modeConfig[selectedAppointment.mode].label}</span>
                  </div>
                  {selectedAppointment.location && (
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedAppointment.location}</span>
                    </div>
                  )}
                </div>

                {selectedAppointment.notes && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Fermer</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─── Helper: ISO week number ─── */
function getWeekNumber(d: Date): number {
  const date = new Date(d.getTime())
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}
