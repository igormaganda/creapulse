'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  Users,
  UserCheck,
  UserCircle,
  Rocket,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
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

const kpis = [
  { label: 'Organisations actives', value: 8, change: '+2', up: true, icon: Building2, color: 'text-[#FFB74D]' },
  { label: 'Total utilisateurs', value: 247, change: '+18%', up: true, icon: Users, color: 'text-[#00838F]' },
  { label: 'Beneficiaires', value: 198, change: '+12%', up: true, icon: UserCircle, color: 'text-emerald-500' },
  { label: 'Conseillers', value: 49, change: '+5', up: true, icon: UserCheck, color: 'text-[#FF6B35]' },
  { label: 'Entreprises creees (mois)', value: 34, change: '+8', up: true, icon: Rocket, color: 'text-purple-500' },
  { label: 'Taux completion moyen', value: 67, change: '+3%', up: true, icon: TrendingUp, color: 'text-[#FFB74D]', suffix: '%' },
  { label: 'Revenus MRR', value: 792, change: '+15%', up: true, icon: DollarSign, color: 'text-emerald-500', prefix: '€' },
  { label: 'Uptime', value: 99.9, change: '-0.01%', up: false, icon: Activity, color: 'text-[#00838F]', suffix: '%' },
]

const croissanceData = [
  { month: 'Jan', utilisateurs: 120, organisations: 4 },
  { month: 'Fev', utilisateurs: 135, organisations: 4 },
  { month: 'Mar', utilisateurs: 152, organisations: 5 },
  { month: 'Avr', utilisateurs: 168, organisations: 5 },
  { month: 'Mai', utilisateurs: 180, organisations: 6 },
  { month: 'Jun', utilisateurs: 195, organisations: 6 },
  { month: 'Jul', utilisateurs: 198, organisations: 6 },
  { month: 'Aou', utilisateurs: 205, organisations: 7 },
  { month: 'Sep', utilisateurs: 218, organisations: 7 },
  { month: 'Oct', utilisateurs: 228, organisations: 7 },
  { month: 'Nov', utilisateurs: 238, organisations: 8 },
  { month: 'Dec', utilisateurs: 247, organisations: 8 },
]

const repartitionData = [
  { name: 'GIDEF', utilisateurs: 142 },
  { name: 'Incubateurs', utilisateurs: 48 },
  { name: 'PEPITE', utilisateurs: 28 },
  { name: 'CCI', utilisateurs: 18 },
  { name: 'Formation', utilisateurs: 11 },
]

const modulesData = [
  { name: 'Diagnostic RIASEC', utilisations: 189 },
  { name: 'Mon Projet', utilisations: 165 },
  { name: 'CreaSim', utilisations: 142 },
  { name: 'Business Plan', utilisations: 128 },
  { name: 'Annuaire', utilisations: 98 },
  { name: 'Forum', utilisations: 76 },
]

const bpScoreData = [
  { name: 'GIDEF Paris', score: 72 },
  { name: 'GIDEF Creteil', score: 65 },
  { name: 'Incub Startup', score: 78 },
  { name: 'GIDEF Nanterre', score: 58 },
  { name: 'PEPITE Paris', score: 70 },
]

const activityFeed = [
  { text: 'Nouvelle organisation "Incub Val-de-Marne" inscrite', time: 'Il y a 5 min', type: 'success' },
  { text: 'Panne de la base de donnees resolue en 2 min', time: 'Il y a 1h', type: 'warning' },
  { text: 'Mise a jour du module CreaSim deployee', time: 'Il y a 3h', type: 'info' },
  { text: 'Alerte : 3 utilisateurs sans activite depuis 30 jours', time: 'Il y a 6h', type: 'warning' },
  { text: 'Nouveau record : 156 connexions en une journee', time: 'Hier', type: 'success' },
]

const systemStatus = [
  { name: 'API Backend', status: 'Operationnel', uptime: '99.98%', latency: '45ms' },
  { name: 'Base de donnees', status: 'Operationnel', uptime: '99.99%', latency: '12ms' },
  { name: 'CDN / Assets', status: 'Operationnel', uptime: '100%', latency: '8ms' },
  { name: 'Services IA', status: 'Degradé', uptime: '98.5%', latency: '230ms' },
]

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{kpi.label}</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-foreground">
                {kpi.prefix || ''}{typeof kpi.value === 'number' ? kpi.value.toLocaleString('fr-FR') : kpi.value}{kpi.suffix || ''}
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] font-medium mt-1 ${kpi.up ? 'text-emerald-500' : 'text-red-500'}`}>
                {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {kpi.change}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Croissance utilisateurs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Croissance utilisateurs (12 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={croissanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(value: number, name: string) => [value.toLocaleString('fr-FR'), name]}
                  />
                  <Line type="monotone" dataKey="utilisateurs" stroke="#00838F" strokeWidth={2} dot={{ r: 3 }} name="Utilisateurs" />
                  <Line type="monotone" dataKey="organisations" stroke="#FFB74D" strokeWidth={2} dot={{ r: 3 }} name="Organisations" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Repartition par organisation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Repartition par organisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repartitionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" width={80} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="utilisateurs" fill="#00838F" radius={[0, 4, 4, 0]} name="Utilisateurs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Modules les plus utilises */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Modules les plus utilises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modulesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" width={120} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="utilisations" fill="#FFB74D" radius={[0, 4, 4, 0]} name="Utilisations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score BP moyen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Score Business Plan moyen par organisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bpScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" angle={-20} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v: number) => [`${v}%`, 'Score']} />
                  <Bar dataKey="score" fill="#FF6B35" radius={[4, 4, 0, 0]} name="Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom: Activity + System Status */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Activity feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Activite recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityFeed.map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  item.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                  item.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                  'bg-teal-100 text-teal-600 dark:bg-teal-900/30'
                }`}>
                  {item.type === 'success' ? <CheckCircle2 className="h-3 w-3" /> :
                   item.type === 'warning' ? <AlertTriangle className="h-3 w-3" /> :
                   <Clock className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Statut systeme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemStatus.map((service) => (
                <div key={service.name} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${
                      service.status === 'Operationnel' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">Latence : {service.latency}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={service.status === 'Operationnel' ? 'default' : 'secondary'} className={
                      service.status === 'Operationnel' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                    }>
                      {service.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{service.uptime}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
