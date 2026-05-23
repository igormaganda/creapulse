'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
} from 'lucide-react'

/* ─── Types ─── */
type AppointmentType = 'bilan' | 'suivi' | 'atelier'

interface Appointment {
  id: string
  title: string
  conseiller: string
  beneficiaire: string
  type: AppointmentType
  day: number
  startHour: number
  duration: number // in hours (0.5 increments)
  location: string
}

/* ─── Mock data ─── */
const mockAppointments: Appointment[] = [
  { id: 'a1', title: 'Bilan initial', conseiller: 'Sophie Martin', beneficiaire: 'Alexandre Chen', type: 'bilan', day: 1, startHour: 9, duration: 1, location: 'Salle A' },
  { id: 'a2', title: 'Suivi mensuel', conseiller: 'Pierre Dubois', beneficiaire: 'Thomas Leroy', type: 'suivi', day: 1, startHour: 14, duration: 0.5, location: 'Salle B' },
  { id: 'a3', title: 'Atelier Business Plan', conseiller: 'Claire Lefevre', beneficiaire: 'Groupe (8 pers.)', type: 'atelier', day: 2, startHour: 10, duration: 2, location: 'Salle Formation' },
  { id: 'a4', title: 'Bilan trimestriel', conseiller: 'Sophie Martin', beneficiaire: 'Marie Dupont', type: 'bilan', day: 2, startHour: 15, duration: 1, location: 'Salle A' },
  { id: 'a5', title: 'Suivi financier', conseiller: 'Marc Petit', beneficiaire: 'David Nguyen', type: 'suivi', day: 3, startHour: 9.5, duration: 1, location: 'Salle C' },
  { id: 'a6', title: 'Atelier Marketing Digital', conseiller: 'Claire Lefevre', beneficiaire: 'Groupe (12 pers.)', type: 'atelier', day: 3, startHour: 14, duration: 2.5, location: 'Salle Formation' },
  { id: 'a7', title: 'Suivi projet', conseiller: 'Pierre Dubois', beneficiaire: 'Karim Diallo', type: 'suivi', day: 4, startHour: 10, duration: 1, location: 'Salle B' },
  { id: 'a8', title: 'Bilan parcours', conseiller: 'Julie Moreau', beneficiaire: 'Laura Petit', type: 'bilan', day: 4, startHour: 11.5, duration: 1, location: 'Salle A' },
  { id: 'a9', title: 'Atelier CreaSim', conseiller: 'Marc Petit', beneficiaire: 'Groupe (6 pers.)', type: 'atelier', day: 5, startHour: 9, duration: 2, location: 'Salle Formation' },
  { id: 'a10', title: 'Suivi final', conseiller: 'Sophie Martin', beneficiaire: 'Sophie Morel', type: 'suivi', day: 5, startHour: 14, duration: 0.5, location: 'Visio' },
]

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
const HOURS = [8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5]

const typeConfig: Record<AppointmentType, { label: string; bg: string; border: string; text: string }> = {
  bilan: { label: 'Bilan', bg: 'bg-[#00838F]/10', border: 'border-l-[#00838F]', text: 'text-[#00838F]' },
  suivi: { label: 'Suivi', bg: 'bg-[#FFB74D]/10', border: 'border-l-[#FFB74D]', text: 'text-[#FFB74D]' },
  atelier: { label: 'Atelier', bg: 'bg-[#FF6B35]/10', border: 'border-l-[#FF6B35]', text: 'text-[#FF6B35]' },
}

export function PlanningView() {
  const [filterConseiller, setFilterConseiller] = useState('all')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const conseillers = useMemo(() => ['all', ...new Set(mockAppointments.map((a) => a.conseiller))], [])

  const filtered = useMemo(() => {
    if (filterConseiller === 'all') return mockAppointments
    return mockAppointments.filter((a) => a.conseiller === filterConseiller)
  }, [filterConseiller])

  const formatHour = (h: number) => {
    const hours = Math.floor(h)
    const mins = (h % 1) * 60
    return `${hours.toString().padStart(2, '0')}:${mins === 0 ? '00' : '30'}`
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Planning de la semaine</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} rendez-vous programmes</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterConseiller} onValueChange={setFilterConseiller}>
            <SelectTrigger className="w-48">
              <User className="h-4 w-4 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Filtrer par conseiller" />
            </SelectTrigger>
            <SelectContent>
              {conseillers.map((c) => (
                <SelectItem key={c} value={c}>{c === 'all' ? 'Tous les conseillers' : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un creneau
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {(Object.entries(typeConfig) as [AppointmentType, typeof typeConfig.bilan][]).map(([type, config]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-sm ${config.border} border-l-4`} />
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header row */}
            <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b bg-muted/50">
              <div className="p-2 text-xs text-muted-foreground border-r" />
              {DAYS.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-semibold text-foreground border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Time grid */}
            {HOURS.filter((h) => h < 18).map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(5,1fr)] border-b last:border-b-0">
                {/* Time label */}
                <div className="p-1 text-xs text-muted-foreground text-right pr-2 border-r flex items-start justify-end pt-1">
                  {formatHour(hour)}
                </div>

                {/* Day columns */}
                {[1, 2, 3, 4, 5].map((day) => {
                  // Find appointments that start at this hour on this day
                  const appointments = filtered.filter(
                    (a) => a.day === day && Math.floor(a.startHour) === Math.floor(hour) && a.startHour === hour
                  )

                  return (
                    <div
                      key={day}
                      className="border-r last:border-r-0 min-h-[36px] relative p-0.5"
                    >
                      {appointments.map((apt) => {
                        const config = typeConfig[apt.type]
                        const heightPct = (apt.duration / 0.5) * 36
                        return (
                          <button
                            key={apt.id}
                            onClick={() => setSelectedAppointment(apt)}
                            className={`absolute inset-x-0.5 rounded-md p-1.5 text-left transition-all hover:shadow-md hover:z-10 cursor-pointer border-l-4 ${config.border} ${config.bg}`}
                            style={{ top: 2, height: `${heightPct}px` }}
                          >
                            <p className="text-xs font-medium text-foreground truncate">{apt.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{apt.conseiller.split(' ')[0]} — {formatHour(apt.startHour)}</p>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appointment detail */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-md">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge variant="secondary" className={typeConfig[selectedAppointment.type].bg}>
                    {typeConfig[selectedAppointment.type].label}
                  </Badge>
                  {selectedAppointment.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatHour(selectedAppointment.startHour)} — {formatHour(selectedAppointment.startHour + selectedAppointment.duration)} ({selectedAppointment.duration}h)
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Conseiller : {selectedAppointment.conseiller}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Beneficiaire : {selectedAppointment.beneficiaire}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {selectedAppointment.location}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
