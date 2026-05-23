'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Users, TrendingUp, Target, ArrowUpRight, ArrowDownRight, Activity, Zap } from 'lucide-react'

const dauWauMau = [
  { period: 'Lun', dau: 42, wau: 128, mau: 198 },
  { period: 'Mar', dau: 38, wau: 125, mau: 197 },
  { period: 'Mer', dau: 45, wau: 130, mau: 199 },
  { period: 'Jeu', dau: 50, wau: 132, mau: 200 },
  { period: 'Ven', dau: 35, wau: 135, mau: 202 },
  { period: 'Sam', dau: 18, wau: 138, mau: 205 },
  { period: 'Dim', dau: 12, wau: 140, mau: 207 },
]

const funnelData = [
  { etape: 'Inscription', count: 310, pct: 100 },
  { etape: 'Onboarding', count: 265, pct: 85 },
  { etape: 'Diagnostic', count: 198, pct: 64 },
  { etape: 'Business Plan', count: 142, pct: 46 },
  { etape: 'Tremplin', count: 78, pct: 25 },
  { etape: 'Creation', count: 34, pct: 11 },
]

const moduleUsage = [
  { module: 'RIASEC', sessions: 189 },
  { module: 'Mon Projet', sessions: 165 },
  { module: 'CreaSim', sessions: 142 },
  { module: 'BP IA', sessions: 128 },
  { module: 'Annuaire', sessions: 98 },
  { module: 'Forum', sessions: 76 },
]

const geoData = [
  { city: 'Paris', users: 120 },
  { city: 'Creteil', users: 42 },
  { city: 'Nanterre', users: 32 },
  { city: 'Vitry', users: 18 },
  { city: 'Bobigny', users: 14 },
  { city: 'Boulogne', users: 12 },
  { city: 'Montreuil', users: 9 },
]

const insights = [
  { label: 'Taux de conversion inscription → diagnostic', value: '64%', trend: '+5%', up: true, icon: Target },
  { label: 'Temps moyen onboarding', value: '4m 32s', trend: '-18s', up: false, icon: Clock },
  { label: 'Taux de retention 30 jours', value: '78%', trend: '+3%', up: true, icon: Users },
  { label: 'Sessions moyennes/utilisateur/mois', value: '12.4', trend: '+1.2', up: true, icon: Activity },
]

import { Clock } from 'lucide-react'

type DateRange = '7d' | '30d' | '90d' | '1y'

export function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>('30d')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Analytics</h2>
          <p className="text-sm text-muted-foreground">Metriques d&apos;utilisation et de performance</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['7d', '30d', '90d', '1y'] as DateRange[]).map((d) => (
            <Button
              key={d}
              variant={dateRange === d ? 'default' : 'ghost'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setDateRange(d)}
            >
              {d === '7d' ? '7 jours' : d === '30d' ? '30 jours' : d === '90d' ? '90 jours' : '1 an'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key insights */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {insights.map((i) => {
          const Icon = i.icon
          return (
            <Card key={i.label} className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-[#FFB74D]" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">{i.label}</span>
              </div>
              <p className="text-lg sm:text-xl font-bold">{i.value}</p>
              <div className={`flex items-center gap-0.5 text-[10px] font-medium mt-1 ${i.up ? 'text-emerald-500' : (i.label.includes('Temps') ? 'text-emerald-500' : 'text-red-500')}`}>
                {i.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {i.trend}
              </div>
            </Card>
          )
        })}
      </div>

      {/* DAU/WAU/MAU */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">DAU / WAU / MAU</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dauWauMau}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Line type="monotone" dataKey="dau" stroke="#00838F" strokeWidth={2} dot={{ r: 3 }} name="DAU" />
                <Line type="monotone" dataKey="wau" stroke="#FFB74D" strokeWidth={2} dot={{ r: 3 }} name="WAU" />
                <Line type="monotone" dataKey="mau" stroke="#FF6B35" strokeWidth={2} dot={{ r: 3 }} name="MAU" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Conversion funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Entonnoir de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((step, i) => (
                <div key={step.etape} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{step.etape}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{step.count}</span>
                      <Badge variant="secondary" className="text-[10px]">{step.pct}%</Badge>
                    </div>
                  </div>
                  <div className="h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${step.pct}%`,
                        background: `linear-gradient(90deg, #00838F ${i === 0 ? 100 : 50}%, #FFB74D)`,
                        opacity: 1 - i * 0.1,
                      }}
                    />
                  </div>
                  {i < funnelData.length - 1 && (
                    <p className="text-[10px] text-muted-foreground text-right">
                      -{funnelData[i].count - funnelData[i + 1].count} ({funnelData[i].pct - funnelData[i + 1].pct}%)
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Module usage heatmap (simplified bar) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Utilisation des modules (sessions/mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis dataKey="module" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" width={60} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="sessions" fill="#00838F" radius={[0, 4, 4, 0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Repartition geographique (Ile-de-France)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="city" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="users" fill="#FF6B35" radius={[4, 4, 0, 0]} name="Utilisateurs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
