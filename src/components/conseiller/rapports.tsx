'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import {
  MessageSquare,
  Users,
  FileCheck,
  TrendingUp,
  Download,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { toast } from 'sonner'

/* ─── Types ─── */
type Period = 'mois' | 'trimestre' | 'annee'

/* ─── Mock data ─── */
const monthlyEntretiens = [
  { month: 'Sep', count: 12 },
  { month: 'Oct', count: 18 },
  { month: 'Nov', count: 15 },
  { month: 'Dec', count: 10 },
  { month: 'Jan', count: 22 },
  { month: 'Fev', count: 16 },
]

const quarterlyEntretiens = [
  { month: 'T2 2024', count: 42 },
  { month: 'T3 2024', count: 45 },
  { month: 'T4 2024', count: 38 },
  { month: 'T1 2025', count: 50 },
]

const yearlyEntretiens = [
  { month: '2020', count: 120 },
  { month: '2021', count: 156 },
  { month: '2022', count: 180 },
  { month: '2023', count: 195 },
  { month: '2024', count: 210 },
  { month: '2025', count: 50 },
]

const statusRepartition = [
  { name: 'Ideation', value: 6, color: '#F59E0B' },
  { name: 'Structuration', value: 8, color: '#00838F' },
  { name: 'Financement', value: 5, color: '#FF6B35' },
  { name: 'Lancement', value: 3, color: '#059669' },
  { name: 'Developpement', value: 2, color: '#7C3AED' },
]

const monthlyProgression = [
  { month: 'Sep', moyenne: 42 },
  { month: 'Oct', moyenne: 48 },
  { month: 'Nov', moyenne: 52 },
  { month: 'Dec', moyenne: 55 },
  { month: 'Jan', moyenne: 58 },
  { month: 'Fev', moyenne: 62 },
]

const quarterlyProgression = [
  { month: 'T2 2024', moyenne: 35 },
  { month: 'T3 2024', moyenne: 42 },
  { month: 'T4 2024', moyenne: 50 },
  { month: 'T1 2025', moyenne: 58 },
]

const yearlyProgression = [
  { month: '2020', moyenne: 28 },
  { month: '2021', moyenne: 32 },
  { month: '2022', moyenne: 38 },
  { month: '2023', moyenne: 45 },
  { month: '2024', moyenne: 52 },
  { month: '2025', moyenne: 58 },
]

const topBeneficiaires = [
  { id: 'b1', name: 'Amadou Diallo', initials: 'AD', progress: 85, lastActivity: 'Il y a 2 jours', status: 'Lancement' },
  { id: 'b2', name: 'Lea Fontaine', initials: 'LF', progress: 78, lastActivity: 'Hier', status: 'Structuration' },
  { id: 'b4', name: 'Clara Dubois', initials: 'CD', progress: 72, lastActivity: 'Il y a 3 jours', status: 'Financement' },
  { id: 'b8', name: 'Fatima Hassani', initials: 'FH', progress: 68, lastActivity: 'Aujourd\'hui', status: 'Structuration' },
  { id: 'b5', name: 'Karim Benali', initials: 'KB', progress: 65, lastActivity: 'Il y a 5 jours', status: 'Lancement' },
  { id: 'b10', name: 'Nadia Bouzid', initials: 'NB', progress: 60, lastActivity: 'Il y a 1 jour', status: 'Structuration' },
  { id: 'b3', name: 'Marc Renaud', initials: 'MR', progress: 55, lastActivity: 'Il y a 4 jours', status: 'Ideation' },
  { id: 'b7', name: 'Thomas Leroy', initials: 'TL', progress: 48, lastActivity: 'Il y a 1 semaine', status: 'Ideation' },
]

const periodData: Record<Period, {
  kpis: { label: string; value: number | string; suffix?: string; change: string; trend: 'up' | 'down' }[]
  entretiensChart: typeof monthlyEntretiens
  progressionChart: typeof monthlyProgression
}> = {
  mois: {
    kpis: [
      { label: 'Entretiens realises', value: 16, change: '-6 vs mois precedent', trend: 'down' },
      { label: 'Beneficiaires actifs', value: 24, change: '+3 ce mois', trend: 'up' },
      { label: 'Livrables valides', value: 8, change: '+2 vs mois precedent', trend: 'up' },
      { label: 'Progression moyenne', value: 62, suffix: '%', change: '+4% vs mois precedent', trend: 'up' },
    ],
    entretiensChart: monthlyEntretiens,
    progressionChart: monthlyProgression,
  },
  trimestre: {
    kpis: [
      { label: 'Entretiens realises', value: 50, change: '+12 vs T4 2024', trend: 'up' },
      { label: 'Beneficiaires actifs', value: 24, change: '+5 ce trimestre', trend: 'up' },
      { label: 'Livrables valides', value: 18, change: '+6 vs T4 2024', trend: 'up' },
      { label: 'Progression moyenne', value: 58, suffix: '%', change: '+8% vs T4 2024', trend: 'up' },
    ],
    entretiensChart: quarterlyEntretiens,
    progressionChart: quarterlyProgression,
  },
  annee: {
    kpis: [
      { label: 'Entretiens realises', value: 50, change: 'En cours', trend: 'up' },
      { label: 'Beneficiaires actifs', value: 24, change: '+12 cette annee', trend: 'up' },
      { label: 'Livrables valides', value: 34, change: 'En cours', trend: 'up' },
      { label: 'Progression moyenne', value: 58, suffix: '%', change: '+6% vs 2024', trend: 'up' },
    ],
    entretiensChart: yearlyEntretiens,
    progressionChart: yearlyProgression,
  },
}

const phaseColorMap: Record<string, string> = {
  'Ideation': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Structuration': 'bg-primary/10 text-primary',
  'Financement': 'bg-coral-50 text-coral-500',
  'Lancement': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Developpement': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

/* ─── Custom tooltip for charts ─── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Rapports Component
   ═══════════════════════════════════════════════════════════ */
export function RapportsView() {
  const [period, setPeriod] = useState<Period>('mois')

  const data = periodData[period]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-foreground">Rapports</h2>
          <p className="text-sm text-muted-foreground">
            Indicateurs de performance de votre portefeuille
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mois">Ce mois</SelectItem>
              <SelectItem value="trimestre">Ce trimestre</SelectItem>
              <SelectItem value="annee">Cette annee</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast.info('Export PDF en cours de preparation...')}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast.info('Export CSV en cours de preparation...')}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.kpis.map((kpi, i) => {
          const icons = [MessageSquare, Users, FileCheck, TrendingUp]
          const colors = ['text-primary', 'text-coral-500', 'text-emerald-600', 'text-amber-500']
          const bgs = ['bg-primary/10', 'bg-coral-50', 'bg-emerald-50', 'bg-amber-50']
          const Icon = icons[i]

          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              <Card className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className="mt-2 text-2xl font-bold text-foreground">
                        {kpi.value}
                        {kpi.suffix && <span className="text-lg text-muted-foreground">{kpi.suffix}</span>}
                      </p>
                      <p className={`mt-1 text-xs flex items-center gap-0.5 ${
                        kpi.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {kpi.trend === 'up' ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {kpi.change}
                      </p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgs[i]}`}>
                      <Icon className={`h-5 w-5 ${colors[i]}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Bar chart: Entretiens par mois */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Entretiens realises</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.entretiensChart} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Entretiens" fill="#00838F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie chart: Repartition par statut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Repartition par statut beneficiaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusRepartition}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {statusRepartition.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {statusRepartition.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-foreground flex-1">{item.name}</span>
                      <span className="text-xs font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Line chart: Progression moyenne */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Progression moyenne du portefeuille</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.progressionChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={24}
                    formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="moyenne"
                    name="Progression moyenne"
                    stroke="#00838F"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#00838F', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#00838F', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top beneficiaires table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Top beneficiaires</CardTitle>
              <Badge variant="secondary" className="text-xs">{topBeneficiaires.length} beneficiaires</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {/* Header */}
              <div className="grid grid-cols-[40px_1fr_100px_120px_100px] sm:grid-cols-[40px_1fr_120px_140px_120px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                <span>#</span>
                <span>Beneficiaire</span>
                <span>Progression</span>
                <span className="hidden sm:block">Derniere activite</span>
                <span>Statut</span>
              </div>

              {/* Rows */}
              {topBeneficiaires.map((b, i) => (
                <div key={b.id}>
                  <div className="grid grid-cols-[40px_1fr_100px_120px_100px] sm:grid-cols-[40px_1fr_120px_140px_120px] gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                    <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                          {b.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground truncate">{b.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={b.progress} className="h-2 w-16" />
                      <span className="text-xs font-semibold text-foreground">{b.progress}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:block">{b.lastActivity}</span>
                    <Badge variant="secondary" className={`text-[10px] px-2 py-0 w-fit ${phaseColorMap[b.status] || 'bg-muted text-muted-foreground'}`}>
                      {b.status}
                    </Badge>
                  </div>
                  {i < topBeneficiaires.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
