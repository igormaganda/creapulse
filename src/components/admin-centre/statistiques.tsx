'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Clock,
  TrendingUp,
  FileText,
  Award,
  Users,
} from 'lucide-react'

/* ─── Period selector ─── */
type Period = 'mois' | 'trimestre' | 'annee'

/* ─── Mock data ─── */
const phaseData = {
  mois: [
    { phase: 'Ideation', count: 28 },
    { phase: 'Structuration', count: 42 },
    { phase: 'Financement', count: 31 },
    { phase: 'Lancement', count: 18 },
    { phase: 'Developpement', count: 11 },
  ],
  trimestre: [
    { phase: 'Ideation', count: 82 },
    { phase: 'Structuration', count: 125 },
    { phase: 'Financement', count: 94 },
    { phase: 'Lancement', count: 55 },
    { phase: 'Developpement', count: 38 },
  ],
  annee: [
    { phase: 'Ideation', count: 310 },
    { phase: 'Structuration', count: 478 },
    { phase: 'Financement', count: 356 },
    { phase: 'Lancement', count: 198 },
    { phase: 'Developpement', count: 142 },
  ],
}

const inscriptionData = {
  mois: [
    { mois: 'S1', inscriptions: 8 },
    { mois: 'S2', inscriptions: 10 },
    { mois: 'S3', inscriptions: 12 },
    { mois: 'S4', inscriptions: 6 },
  ],
  trimestre: [
    { mois: 'Jan', inscriptions: 25 },
    { mois: 'Fev', inscriptions: 32 },
    { mois: 'Mar', inscriptions: 28 },
    { mois: 'Avr', inscriptions: 35 },
    { mois: 'Mai', inscriptions: 40 },
    { mois: 'Jun', inscriptions: 38 },
    { mois: 'Jul', inscriptions: 18 },
    { mois: 'Aou', inscriptions: 12 },
    { mois: 'Sep', inscriptions: 30 },
  ],
  annee: [
    { mois: 'J', inscriptions: 22 },
    { mois: 'F', inscriptions: 28 },
    { mois: 'M', inscriptions: 35 },
    { mois: 'A', inscriptions: 30 },
    { mois: 'M', inscriptions: 38 },
    { mois: 'J', inscriptions: 42 },
    { mois: 'J', inscriptions: 48 },
    { mois: 'A', inscriptions: 35 },
    { mois: 'S', inscriptions: 52 },
    { mois: 'O', inscriptions: 45 },
    { mois: 'N', inscriptions: 55 },
    { mois: 'D', inscriptions: 40 },
  ],
}

const secteurData = [
  { name: 'Commerce', value: 28, color: '#FF6B35' },
  { name: 'Restauration', value: 22, color: '#00838F' },
  { name: 'Services', value: 20, color: '#FFB74D' },
  { name: 'Tech', value: 15, color: '#8B5CF6' },
  { name: 'BTP', value: 10, color: '#10B981' },
  { name: 'Autre', value: 5, color: '#6B7280' },
]

const conseillerCompletion = [
  { name: 'S. Martin', completion: 72 },
  { name: 'P. Dubois', completion: 68 },
  { name: 'C. Lefevre', completion: 65 },
  { name: 'M. Petit', completion: 61 },
  { name: 'J. Moreau', completion: 58 },
  { name: 'A. Roux', completion: 55 },
  { name: 'I. Fontaine', completion: 20 },
]

const keyMetrics = {
  mois: { tempsMoyen: '4.2 mois', tauxReussite: '72%', scoreBP: '68/100' },
  trimestre: { tempsMoyen: '4.5 mois', tauxReussite: '70%', scoreBP: '65/100' },
  annee: { tempsMoyen: '4.8 mois', tauxReussite: '68%', scoreBP: '63/100' },
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'mois', label: 'Ce mois' },
  { id: 'trimestre', label: 'Ce trimestre' },
  { id: 'annee', label: 'Cette annee' },
]

/* ─── Component ─── */
export function StatistiquesView() {
  const [period, setPeriod] = useState<Period>('trimestre')

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '8px',
      fontSize: '12px',
    },
  }

  const metrics = keyMetrics[period]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header + Period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Statistiques</h2>
          <p className="text-sm text-muted-foreground">Analyse de performance du centre</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 text-sm rounded-md transition-all cursor-pointer ${
                period === p.id
                  ? 'bg-[#FF6B35] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temps moyen parcours</p>
                <p className="text-2xl font-bold text-foreground">{metrics.tempsMoyen}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de reussite tremplin</p>
                <p className="text-2xl font-bold text-foreground">{metrics.tauxReussite}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score BP moyen</p>
                <p className="text-2xl font-bold text-foreground">{metrics.scoreBP}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Beneficiaires par phase */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Beneficiaires par phase</CardTitle>
              <CardDescription>Repartition dans le parcours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={phaseData[period]} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="phase" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Evolution inscriptions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Evolution des inscriptions</CardTitle>
              <CardDescription>Nouvelle arrivees par periode</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inscriptionData[period]} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="inscriptions" stroke="#00838F" strokeWidth={2.5} dot={{ r: 4, fill: '#00838F' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Repartition par secteur */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Repartition par secteur</CardTitle>
              <CardDescription>Projets actifs par secteur d&apos;activite</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={secteurData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {secteurData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {secteurData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-muted-foreground truncate">{s.name} ({s.value}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Taux de completion par conseiller */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Completion par conseiller</CardTitle>
              <CardDescription>Taux de progression moyen des beneficiaires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {conseillerCompletion.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.completion}%</span>
                  </div>
                  <Progress value={c.completion} className="h-2.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
