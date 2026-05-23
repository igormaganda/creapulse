'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { CreditCard, TrendingUp, TrendingDown, Users, DollarSign, ArrowUpRight, CheckCircle2, Crown, Zap } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const revenueData = [
  { month: 'Jul', mrr: 396 },
  { month: 'Aou', mrr: 495 },
  { month: 'Sep', mrr: 594 },
  { month: 'Oct', mrr: 693 },
  { month: 'Nov', mrr: 743 },
  { month: 'Dec', mrr: 792 },
]

interface BillingOrg {
  id: string
  name: string
  plan: string
  mrr: number
  usersCount: number
  nextBilling: string
  status: string
}

const billingOrgs: BillingOrg[] = [
  { id: '1', name: 'GIDEF Paris Centre', plan: 'Enterprise', mrr: 299, usersCount: 68, nextBilling: '2025-01-15', status: 'actif' },
  { id: '2', name: 'GIDEF Creteil', plan: 'Pro', mrr: 99, usersCount: 42, nextBilling: '2025-01-20', status: 'actif' },
  { id: '3', name: 'GIDEF Nanterre', plan: 'Pro', mrr: 99, usersCount: 32, nextBilling: '2025-01-10', status: 'actif' },
  { id: '4', name: 'Incub Startup IDF', plan: 'Pro', mrr: 99, usersCount: 38, nextBilling: '2025-01-25', status: 'actif' },
  { id: '5', name: 'Incub Val-de-Marne', plan: 'Starter', mrr: 0, usersCount: 10, nextBilling: '-', status: 'en_attente' },
  { id: '6', name: 'PEPITE Paris Sorbonne', plan: 'Pro', mrr: 99, usersCount: 28, nextBilling: '2025-01-15', status: 'actif' },
  { id: '7', name: 'CCI Paris IDF', plan: 'Starter', mrr: 0, usersCount: 18, nextBilling: '-', status: 'actif' },
  { id: '8', name: 'Formation Entreprendre IDF', plan: 'Starter', mrr: 0, usersCount: 11, nextBilling: '-', status: 'inactif' },
]

const planColors: Record<string, string> = {
  Starter: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  Pro: 'bg-[#FFB74D]/20 text-[#FFB74D]',
  Enterprise: 'bg-[#00838F]/10 text-[#00838F]',
}

export function Facturation() {
  const totalMRR = billingOrgs.reduce((s, o) => s + o.mrr, 0)
  const totalARR = totalMRR * 12
  const activeSubs = billingOrgs.filter(o => o.status === 'actif').length
  const churnRate = 5.2

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Facturation</h2>
        <p className="text-sm text-muted-foreground">Suivi des abonnements et revenus</p>
      </div>

      {/* Overview KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">MRR</span>
          </div>
          <p className="text-2xl font-bold">{totalMRR.toLocaleString('fr-FR')}€</p>
          <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1"><ArrowUpRight className="h-3 w-3" />+6.6% vs mois precedent</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-[#FFB74D]" />
            <span className="text-xs text-muted-foreground">ARR</span>
          </div>
          <p className="text-2xl font-bold">{totalARR.toLocaleString('fr-FR')}€</p>
          <p className="text-xs text-muted-foreground mt-1">Revenu annuel recurrent</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-[#00838F]" />
            <span className="text-xs text-muted-foreground">Abonnements actifs</span>
          </div>
          <p className="text-2xl font-bold">{activeSubs}</p>
          <p className="text-xs text-muted-foreground mt-1">{billingOrgs.length} organisation(s) totale(s)</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Taux de churn</span>
          </div>
          <p className="text-2xl font-bold">{churnRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">-0.3% vs mois precedent</p>
        </Card>
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Evolution du MRR (6 derniers mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v: number) => [`${v.toLocaleString('fr-FR')}€`, 'MRR']} />
                <Bar dataKey="mrr" fill="#FFB74D" radius={[4, 4, 0, 0]} name="MRR" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 relative overflow-hidden">
          <div className="h-1 bg-gray-300 absolute top-0 left-0 right-0" />
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Starter</h3>
          </div>
          <p className="text-2xl font-bold">0€<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
          <Separator className="my-3" />
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />Jusqu&apos;a 20 utilisateurs</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />Modules de base</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />Support email</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3">{billingOrgs.filter(o => o.plan === 'Starter').length} organisation(s)</p>
        </Card>
        <Card className="p-5 relative overflow-hidden border-[#FFB74D]/50">
          <div className="h-1 bg-[#FFB74D] absolute top-0 left-0 right-0" />
          <div className="absolute top-3 right-3">
            <Badge className="bg-[#FFB74D] text-[#0F172A] text-[10px]">Populaire</Badge>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-5 w-5 text-[#FFB74D]" />
            <h3 className="font-semibold">Pro</h3>
          </div>
          <p className="text-2xl font-bold">99€<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
          <Separator className="my-3" />
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-[#FFB74D]" />Jusqu&apos;a 100 utilisateurs</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-[#FFB74D]" />Tous les modules</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-[#FFB74D]" />Support prioritaire</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3">{billingOrgs.filter(o => o.plan === 'Pro').length} organisation(s)</p>
        </Card>
        <Card className="p-5 relative overflow-hidden">
          <div className="h-1 bg-[#00838F] absolute top-0 left-0 right-0" />
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-5 w-5 text-[#00838F]" />
            <h3 className="font-semibold">Enterprise</h3>
          </div>
          <p className="text-2xl font-bold">Sur devis</p>
          <Separator className="my-3" />
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-[#00838F]" />Utilisateurs illimites</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-[#00838F]" />Modules + IA avancee</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-[#00838F]" />Account manager dedie</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3">{billingOrgs.filter(o => o.plan === 'Enterprise').length} organisation(s)</p>
        </Card>
      </div>

      {/* Billing table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Facturation par organisation</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="hidden sm:table-cell">MRR</TableHead>
                  <TableHead className="hidden md:table-cell">Utilisateurs</TableHead>
                  <TableHead className="hidden lg:table-cell">Prochaine facturation</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingOrgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="text-sm font-medium">{org.name}</TableCell>
                    <TableCell><Badge variant="secondary" className={planColors[org.plan]}>{org.plan}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell text-sm font-semibold">{org.mrr > 0 ? `${org.mrr}€` : 'Gratuit'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{org.usersCount}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{org.nextBilling !== '-' ? new Date(org.nextBilling).toLocaleDateString('fr-FR') : '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={org.status === 'actif' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : org.status === 'en_attente' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}>
                        {org.status === 'actif' ? 'Actif' : org.status === 'en_attente' ? 'En attente' : 'Inactif'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
