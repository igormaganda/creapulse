'use client'

import { motion } from 'framer-motion'
import { useConseillerStore } from './conseiller-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Users,
  MessageSquare,
  FileText,
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  UserPlus,
} from 'lucide-react'

/* ─── Mock data ─── */
const today = new Date()
const formatDate = (d: Date) =>
  d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const kpiData = [
  {
    label: 'Beneficiaires actifs',
    value: 24,
    icon: Users,
    color: 'text-primary',
    bg: 'bg-primary/10',
    change: '+3 ce mois',
  },
  {
    label: 'Entretiens cette semaine',
    value: 8,
    icon: MessageSquare,
    color: 'text-coral-500',
    bg: 'bg-coral-50',
    change: '12 prevus',
  },
  {
    label: 'Livrables en attente',
    value: 5,
    icon: FileText,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    change: '3 urgents',
  },
  {
    label: 'Progression moyenne',
    value: 62,
    suffix: '%',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    change: '+8% vs mois dernier',
  },
]

const recentActivity = [
  {
    id: '1',
    type: 'entretien',
    message: 'Entretien de suivi termine avec Amadou Diallo',
    time: 'Il y a 2 heures',
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    id: '2',
    type: 'livrable',
    message: 'Business plan soumis par Lea Fontaine',
    time: 'Il y a 3 heures',
    icon: FileText,
    color: 'text-primary bg-primary/10',
  },
  {
    id: '3',
    type: 'alerte',
    message: 'Karim Benali na pas complete son test RIASEC',
    time: 'Il y a 5 heures',
    icon: AlertCircle,
    color: 'text-amber-500 bg-amber-50',
  },
  {
    id: '4',
    type: 'entretien',
    message: 'Entretien de bilan programme avec Clara Dubois',
    time: 'Il y a 1 jour',
    icon: Calendar,
    color: 'text-coral-500 bg-coral-50',
  },
  {
    id: '5',
    type: 'inscription',
    message: 'Nouveau beneficiaire inscrit : Hugo Petit',
    time: 'Il y a 2 jours',
    icon: UserPlus,
    color: 'text-primary bg-primary/10',
  },
]

const upcomingAppointments = [
  {
    id: '1',
    beneficiary: 'Amadou Diallo',
    initials: 'AD',
    type: 'Suivi',
    date: 'Lun. 27 Jan',
    time: '10:00 - 11:00',
    color: 'bg-primary',
  },
  {
    id: '2',
    beneficiary: 'Lea Fontaine',
    initials: 'LF',
    type: 'Bilan BP',
    date: 'Lun. 27 Jan',
    time: '14:00 - 15:30',
    color: 'bg-coral-500',
  },
  {
    id: '3',
    beneficiary: 'Marc Renaud',
    initials: 'MR',
    type: 'Atelier',
    date: 'Mar. 28 Jan',
    time: '09:30 - 11:00',
    color: 'bg-amber-500',
  },
  {
    id: '4',
    beneficiary: 'Clara Dubois',
    initials: 'CD',
    type: 'Suivi',
    date: 'Mer. 29 Jan',
    time: '11:00 - 12:00',
    color: 'bg-primary',
  },
]

/* ─── Dashboard Component ─── */
export function ConseillerDashboard() {
  const { conseillerName, setTab } = useConseillerStore()

  const greetingHour = new Date().getHours()
  const greeting =
    greetingHour < 12 ? 'Bonjour' : greetingHour < 18 ? 'Bon apres-midi' : 'Bonsoir'

  return (
    <div className="space-y-6">
      {/* Greeting banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-gradient-to-r from-[#1A1A2E] to-[#16213E] p-6 md:p-8 text-white"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {greeting}, {conseillerName.split(' ')[0]}
            </h1>
            <p className="mt-1 text-white/60 text-sm md:text-base">
              {formatDate(today)} — Voici un apercu de votre activite
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/15 border-0">
              GIDEF Paris
            </Badge>
            <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/15 border-0">
              Conseiller Senior
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="relative overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.label}</p>
                      <p className="mt-2 text-3xl font-bold text-foreground">
                        {kpi.value}
                        {kpi.suffix && <span className="text-xl text-muted-foreground">{kpi.suffix}</span>}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{kpi.change}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg}`}>
                      <Icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Two-column: Recent activity + Upcoming appointments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent Activity — 3 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-3"
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Activite recente</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {recentActivity.length} evenements
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              {recentActivity.map((activity, i) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id}>
                    <div className="flex items-start gap-3 py-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${activity.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">
                          {activity.message}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                    {i < recentActivity.length - 1 && <Separator />}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Appointments — 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Prochains RDV</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary"
                  onClick={() => setTab('entretiens')}
                >
                  Voir tout
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              {upcomingAppointments.map((apt, i) => (
                <div key={apt.id}>
                  <div className="flex items-center gap-3 py-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className={`${apt.color} text-white text-xs font-bold`}>
                        {apt.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {apt.beneficiary}
                      </p>
                      <p className="text-xs text-muted-foreground">{apt.type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-foreground">{apt.date}</p>
                      <p className="text-xs text-muted-foreground">{apt.time}</p>
                    </div>
                  </div>
                  {i < upcomingAppointments.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto flex items-center gap-3 p-4 justify-start hover:bg-primary/5 hover:border-primary/30 transition-colors"
                onClick={() => setTab('entretiens')}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Planifier un entretien</p>
                  <p className="text-xs text-muted-foreground">Nouveau rendez-vous</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex items-center gap-3 p-4 justify-start hover:bg-coral-50 hover:border-coral-200 transition-colors"
                onClick={() => setTab('livrables')}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-50 shrink-0">
                  <FileText className="h-5 w-5 text-coral-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Voir les livrables</p>
                  <p className="text-xs text-muted-foreground">5 en attente</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex items-center gap-3 p-4 justify-start hover:bg-amber-50 hover:border-amber-200 transition-colors"
                onClick={() => setTab('rapports')}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 shrink-0">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Rapport mensuel</p>
                  <p className="text-xs text-muted-foreground">Generer un rapport</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
