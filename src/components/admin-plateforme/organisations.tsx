'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Search, MapPin, Users, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type OrgType = 'GIDEF' | 'Incubateur' | 'PEPITE' | 'CCI' | 'Formation'
type OrgPlan = 'Starter' | 'Pro' | 'Enterprise'
type OrgStatus = 'actif' | 'inactif' | 'en_attente'

interface Org {
  id: string
  name: string
  type: OrgType
  city: string
  usersCount: number
  plan: OrgPlan
  status: OrgStatus
  createdAt: string
  beneficiaires: number
  conseillers: number
  completionRate: number
  description: string
  contact: string
  members: { name: string; role: string; email: string }[]
}

const orgs: Org[] = [
  { id: '1', name: 'GIDEF Paris Centre', type: 'GIDEF', city: 'Paris', usersCount: 68, plan: 'Enterprise', status: 'actif', createdAt: '2024-01-15', beneficiaires: 52, conseillers: 16, completionRate: 74, description: 'Agence principale GIDEF en Ile-de-France', contact: 'contact@gidef-paris.fr', members: [{ name: 'Sophie Martin', role: 'Admin', email: 'sophie@gidef-paris.fr' }, { name: 'Jean Dupont', role: 'Conseiller', email: 'jean@gidef-paris.fr' }] },
  { id: '2', name: 'GIDEF Creteil', type: 'GIDEF', city: 'Creteil', usersCount: 42, plan: 'Pro', status: 'actif', createdAt: '2024-02-20', beneficiaires: 34, conseillers: 8, completionRate: 68, description: 'Agence GIDEF du Val-de-Marne', contact: 'contact@gidef-creteil.fr', members: [{ name: 'Marie Leroy', role: 'Admin', email: 'marie@gidef-creteil.fr' }] },
  { id: '3', name: 'GIDEF Nanterre', type: 'GIDEF', city: 'Nanterre', usersCount: 32, plan: 'Pro', status: 'actif', createdAt: '2024-03-10', beneficiaires: 24, conseillers: 8, completionRate: 61, description: 'Agence GIDEF des Hauts-de-Seine', contact: 'contact@gidef-nanterre.fr', members: [{ name: 'Pierre Moreau', role: 'Admin', email: 'pierre@gidef-nanterre.fr' }] },
  { id: '4', name: 'Incub Startup IDF', type: 'Incubateur', city: 'Paris', usersCount: 38, plan: 'Pro', status: 'actif', createdAt: '2024-01-25', beneficiaires: 35, conseillers: 3, completionRate: 72, description: 'Incubateur specialise startups tech', contact: 'info@incub-startup.fr', members: [{ name: 'Lucas Bernard', role: 'Admin', email: 'lucas@incub-startup.fr' }, { name: 'Claire Petit', role: 'Conseiller', email: 'claire@incub-startup.fr' }] },
  { id: '5', name: 'Incub Val-de-Marne', type: 'Incubateur', city: 'Vitry-sur-Seine', usersCount: 10, plan: 'Starter', status: 'en_attente', createdAt: '2024-11-01', beneficiaires: 8, conseillers: 2, completionRate: 32, description: 'Incubateur en cours de validation', contact: 'info@incub-vdm.fr', members: [{ name: 'Nathalie Roux', role: 'Admin', email: 'nathalie@incub-vdm.fr' }] },
  { id: '6', name: 'PEPITE Paris Sorbonne', type: 'PEPITE', city: 'Paris', usersCount: 28, plan: 'Pro', status: 'actif', createdAt: '2024-04-15', beneficiaires: 24, conseillers: 4, completionRate: 65, description: 'Pole etudiant pour l\'innovation', contact: 'contact@pepite-sorbonne.fr', members: [{ name: 'Antoine Dubois', role: 'Admin', email: 'antoine@pepite-sorbonne.fr' }] },
  { id: '7', name: 'CCI Paris Ile-de-France', type: 'CCI', city: 'Paris', usersCount: 18, plan: 'Starter', status: 'actif', createdAt: '2024-06-01', beneficiaires: 14, conseillers: 4, completionRate: 55, description: 'Chambre de commerce et d\'industrie', contact: 'contact@cci-paris.fr', members: [{ name: 'Isabelle Thomas', role: 'Admin', email: 'isabelle@cci-paris.fr' }] },
  { id: '8', name: 'Formation Entreprendre IDF', type: 'Formation', city: 'Bobigny', usersCount: 11, plan: 'Starter', status: 'inactif', createdAt: '2024-07-20', beneficiaires: 11, conseillers: 0, completionRate: 38, description: 'Organisme de formation a la creation', contact: 'contact@formation-idf.fr', members: [{ name: 'Francoise Garcia', role: 'Admin', email: 'francoise@formation-idf.fr' }] },
]

const typeColors: Record<OrgType, string> = {
  GIDEF: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Incubateur: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  PEPITE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  CCI: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  Formation: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

const planColors: Record<OrgPlan, string> = {
  Starter: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  Pro: 'bg-[#FFB74D]/20 text-[#FFB74D]',
  Enterprise: 'bg-[#00838F]/10 text-[#00838F]',
}

const statusColors: Record<OrgStatus, string> = {
  actif: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  inactif: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  en_attente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

const statusLabels: Record<OrgStatus, string> = { actif: 'Actif', inactif: 'Inactif', en_attente: 'En attente' }

export function Organisations() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const filtered = orgs.filter((o) => {
    if (search && !o.name.toLowerCase().includes(search.toLowerCase()) && !o.city.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'all' && o.type !== typeFilter) return false
    if (planFilter !== 'all' && o.plan !== planFilter) return false
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Organisations</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} organisation(s) affichee(s)</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#FFB74D] text-[#0F172A] hover:bg-[#FFA726]">
              <Plus className="h-4 w-4" />
              Ajouter une organisation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle organisation</DialogTitle>
              <DialogDescription>Creez une nouvelle organisation sur la plateforme</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nom</Label>
                <Input placeholder="Ex: GIDEF Lyon" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GIDEF">GIDEF</SelectItem>
                      <SelectItem value="Incubateur">Incubateur</SelectItem>
                      <SelectItem value="PEPITE">PEPITE</SelectItem>
                      <SelectItem value="CCI">CCI</SelectItem>
                      <SelectItem value="Formation">Formation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Ville</Label>
                  <Input placeholder="Ex: Lyon" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Plan</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Plan" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Starter">Starter (0€)</SelectItem>
                      <SelectItem value="Pro">Pro (99€/mois)</SelectItem>
                      <SelectItem value="Enterprise">Enterprise (sur devis)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Contact</Label>
                  <Input placeholder="email@org.fr" type="email" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
              <Button className="bg-[#FFB74D] text-[#0F172A] hover:bg-[#FFA726]">Creer l&apos;organisation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom ou ville..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="GIDEF">GIDEF</SelectItem>
            <SelectItem value="Incubateur">Incubateur</SelectItem>
            <SelectItem value="PEPITE">PEPITE</SelectItem>
            <SelectItem value="CCI">CCI</SelectItem>
            <SelectItem value="Formation">Formation</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les plans</SelectItem>
            <SelectItem value="Starter">Starter</SelectItem>
            <SelectItem value="Pro">Pro</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="actif">Actif</SelectItem>
            <SelectItem value="inactif">Inactif</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]" />
                <TableHead>Organisation</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Ville</TableHead>
                <TableHead className="hidden md:table-cell">Utilisateurs</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((org) => (
                <>
                  <TableRow key={org.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === org.id ? null : org.id)}>
                    <TableCell className="py-2">
                      {expandedId === org.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{org.name}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{org.type} - {org.city}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className={typeColors[org.type]}>{org.type}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{org.city}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{org.usersCount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={planColors[org.plan]}>{org.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[org.status]}>{statusLabels[org.status]}</Badge>
                    </TableCell>
                  </TableRow>
                  <AnimatePresence>
                    {expandedId === org.id && (
                      <TableRow key={`${org.id}-expanded`}>
                        <TableCell colSpan={7} className="bg-muted/30 p-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 space-y-4"
                          >
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <Card className="p-3"><p className="text-xs text-muted-foreground">Beneficiaires</p><p className="text-lg font-bold">{org.beneficiaires}</p></Card>
                              <Card className="p-3"><p className="text-xs text-muted-foreground">Conseillers</p><p className="text-lg font-bold">{org.conseillers}</p></Card>
                              <Card className="p-3"><p className="text-xs text-muted-foreground">Taux completion</p><p className="text-lg font-bold">{org.completionRate}%</p></Card>
                              <Card className="p-3"><p className="text-xs text-muted-foreground">Cree le</p><p className="text-lg font-bold">{new Date(org.createdAt).toLocaleDateString('fr-FR')}</p></Card>
                            </div>
                            <p className="text-sm text-muted-foreground">{org.description}</p>
                            <div>
                              <p className="text-sm font-medium mb-2">Membres</p>
                              <div className="space-y-1">
                                {org.members.map((m, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB74D] text-[10px] font-bold text-[#0F172A]">
                                      {m.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span className="font-medium">{m.name}</span>
                                    <Badge variant="secondary" className="text-[10px]">{m.role}</Badge>
                                    <span className="text-muted-foreground ml-auto text-xs">{m.email}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
