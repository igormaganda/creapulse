'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import {
  Users,
  UserCheck,
  CalendarDays,
  TrendingUp,
  UserPlus,
  FileCheck,
  Trophy,
  Clock,
  ArrowUpRight,
} from 'lucide-react'

/* ─── Mock data ─── */
const phaseData = [
  { phase: 'Ideation', count: 28 },
  { phase: 'Structuration', count: 42 },
  { phase: 'Financement', count: 31 },
  { phase: 'Lancement', count: 18 },
  { phase: 'Developpement', count: 11 },
]

const monthlyData = [
  { mois: 'Sep', inscriptions: 12 },
  { mois: 'Oct', inscriptions: 18 },
  { mois: 'Nov', inscriptions: 15 },
  { mois: 'Dec', inscriptions: 22 },
  { mois: 'Jan', inscriptions: 28 },
  { mois: 'Fev', inscriptions: 25 },
  { mois: 'Mar', inscriptions: 32 },
  { mois: 'Avr', inscriptions: 19 },
  { mois: 'Mai', inscriptions: 35 },
  { mois: 'Jun', inscriptions: 30 },
]

const topPerformers = [
  { name: 'Sophie Martin', initials: 'SM', color: 'bg-[#FF6B35] text-white', beneficiaires: 28, avgProgress: 72 },
  { name: 'Pierre Dubois', initials: 'PD', color: 'bg-primary text-white', beneficiaires: 25, avgProgress: 68 },
  { name: 'Claire Lefevre', initials: 'CL', color: 'bg-amber-500 text-white', beneficiaires: 22, avgProgress: 65 },
  { name: 'Marc Petit', initials: 'MP', color: 'bg-teal-600 text-white', beneficiaires: 20, avgProgress: 61 },
  { name: 'Julie Moreau', initials: 'JM', color: 'bg-purple-600 text-white', beneficiaires: 18, avgProgress: 58 },
]

const recentActivity = [
  { id: 1, action: 'Nouveau beneficiaire inscrit', user: 'Alexandre Chen', time: 'Il y a 15 min', icon: UserPlus, color: 'text-green-600 bg-green-50' },
  { id: 2, action: 'Livrable valide', user: 'Business Plan — Marie D.', time: 'Il y a 1h', icon: FileCheck, color: 'text-primary bg-teal-50' },
  { id: 3, action: 'Entretien termine', user: 'Bilan trimestriel — Thomas L.', time: 'Il y a 2h', icon: CalendarDays, color: 'text-amber-600 bg-amber-50' },
  { id: 4, action: 'Tremplin depose', user: 'Aide creation — Sophie M.', time: 'Il y a 3h', icon: Trophy, color: 'text-[#FF6B35] bg-[#FF6B35]/10' },
  { id: 5, action: 'Nouveau beneficiaire inscrit', user: 'Fatima Benali', time: 'Il y a 5h', icon: UserPlus, color: 'text-green-600 bg-green-50' },
]

/* ─── KPI Card ─── */
function KpiCard({ title, value, subtitle, icon: Icon, trend, color }: {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  trend?: string
  color: string
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
              <div className="mt-1 flex items-center gap-1">
                {trend && (
                  <span className="flex items-center text-xs font-medium text-green-600">
                    <ArrowUpRight className="h-3 w-3" />
                    {trend}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{subtitle}</span>
              </div>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ─── Main Dashboard ─── */
export function AdminDashboard() {
  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF8F65] p-6 md:p-8 text-white"
      >
        <div className="relative z-10">
          <p className="text-sm opacity-80 capitalize">{dateStr}</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-bold">Centre GIDEF Creteil</h2>
          <p className="mt-1 text-sm opacity-80">Vue d&apos;ensemble de votre centre et de vos equipes</p>
        </div>
        <div className="absolute right-4 top-4 md:right-8 md:top-6 opacity-10">
          <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-8 border-white" />
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard title="Total beneficiaires" value={130} subtitle="ce centre" icon={Users} trend="+12%" color="bg-[#FF6B35]/10 text-[#FF6B35]" />
        <KpiCard title="Conseillers actifs" value={7} subtitle="sur 8" icon={UserCheck} trend="" color="bg-primary/10 text-primary" />
        <KpiCard title="Entretiens ce mois" value={48} subtitle="prevu : 52" icon={CalendarDays} trend="+8%" color="bg-amber-500/10 text-amber-600" />
        <KpiCard title="Taux completion" value="62%" subtitle="en moyenne" icon={TrendingUp} trend="+5%" color="bg-green-500/10 text-green-600" />
        <KpiCard title="Nouveaux ce mois" value={18} subtitle="inscriptions" icon={UserPlus} trend="+24%" color="bg-purple-500/10 text-purple-600" />
        <KpiCard title="Livrables valides" value={34} subtitle="sur 45" icon={FileCheck} trend="" color="bg-teal-500/10 text-teal-600" />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Beneficiaires par phase */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Beneficiaires par phase de parcours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={phaseData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="phase" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Evolution mensuelle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Evolution mensuelle des inscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line type="monotone" dataKey="inscriptions" stroke="#00838F" strokeWidth={2.5} dot={{ r: 4, fill: '#00838F' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row: Top performers + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top performers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Top conseillers</CardTitle>
                <Badge variant="secondary" className="text-xs">Par progression</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {topPerformers.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${c.color}`}>
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Progress value={c.avgProgress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{c.avgProgress}%</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{c.beneficiaires} benef.</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Activite recente</CardTitle>
                <Badge variant="secondary" className="text-xs">Live</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${a.color}`}>
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.user}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {a.time}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'
