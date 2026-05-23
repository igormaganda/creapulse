'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Search, UserCog, MoreHorizontal, Clock } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

type UserRole = 'Admin' | 'Conseiller' | 'Beneficiaire'
type UserStatus = 'actif' | 'inactif'

interface MockUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  organization: string
  status: UserStatus
  lastLogin: string
  createdAt: string
}

const users: MockUser[] = [
  { id: '1', firstName: 'Sophie', lastName: 'Martin', email: 'sophie@gidef-paris.fr', role: 'Admin', organization: 'GIDEF Paris Centre', status: 'actif', lastLogin: '2024-12-18 09:30', createdAt: '2024-01-15' },
  { id: '2', firstName: 'Jean', lastName: 'Dupont', email: 'jean@gidef-paris.fr', role: 'Conseiller', organization: 'GIDEF Paris Centre', status: 'actif', lastLogin: '2024-12-17 14:20', createdAt: '2024-01-20' },
  { id: '3', firstName: 'Marie', lastName: 'Leroy', email: 'marie@gidef-creteil.fr', role: 'Admin', organization: 'GIDEF Creteil', status: 'actif', lastLogin: '2024-12-18 08:15', createdAt: '2024-02-20' },
  { id: '4', firstName: 'Pierre', lastName: 'Moreau', email: 'pierre@gidef-nanterre.fr', role: 'Admin', organization: 'GIDEF Nanterre', status: 'actif', lastLogin: '2024-12-16 16:45', createdAt: '2024-03-10' },
  { id: '5', firstName: 'Lucas', lastName: 'Bernard', email: 'lucas@incub-startup.fr', role: 'Admin', organization: 'Incub Startup IDF', status: 'actif', lastLogin: '2024-12-18 10:00', createdAt: '2024-01-25' },
  { id: '6', firstName: 'Claire', lastName: 'Petit', email: 'claire@incub-startup.fr', role: 'Conseiller', organization: 'Incub Startup IDF', status: 'actif', lastLogin: '2024-12-17 11:30', createdAt: '2024-02-01' },
  { id: '7', firstName: 'Antoine', lastName: 'Dubois', email: 'antoine@pepite-sorbonne.fr', role: 'Admin', organization: 'PEPITE Paris Sorbonne', status: 'actif', lastLogin: '2024-12-15 09:00', createdAt: '2024-04-15' },
  { id: '8', firstName: 'Isabelle', lastName: 'Thomas', email: 'isabelle@cci-paris.fr', role: 'Admin', organization: 'CCI Paris IDF', status: 'actif', lastLogin: '2024-12-14 15:30', createdAt: '2024-06-01' },
  { id: '9', firstName: 'Francoise', lastName: 'Garcia', email: 'francoise@formation-idf.fr', role: 'Admin', organization: 'Formation Entreprendre IDF', status: 'inactif', lastLogin: '2024-10-05 10:00', createdAt: '2024-07-20' },
  { id: '10', firstName: 'Ahmed', lastName: 'Benali', email: 'ahmed@gmail.com', role: 'Beneficiaire', organization: 'GIDEF Paris Centre', status: 'actif', lastLogin: '2024-12-18 07:45', createdAt: '2024-03-05' },
  { id: '11', firstName: 'Fatima', lastName: 'Hassan', email: 'fatima@gmail.com', role: 'Beneficiaire', organization: 'GIDEF Creteil', status: 'actif', lastLogin: '2024-12-17 18:20', createdAt: '2024-04-12' },
  { id: '12', firstName: 'David', lastName: 'Nguyen', email: 'david@gmail.com', role: 'Beneficiaire', organization: 'GIDEF Paris Centre', status: 'actif', lastLogin: '2024-12-18 12:00', createdAt: '2024-05-01' },
  { id: '13', firstName: 'Camille', lastName: 'Roux', email: 'camille@gmail.com', role: 'Beneficiaire', organization: 'Incub Startup IDF', status: 'actif', lastLogin: '2024-12-16 14:30', createdAt: '2024-06-15' },
  { id: '14', firstName: 'Hugo', lastName: 'Lambert', email: 'hugo@gmail.com', role: 'Beneficiaire', organization: 'GIDEF Nanterre', status: 'actif', lastLogin: '2024-12-17 09:15', createdAt: '2024-07-01' },
  { id: '15', firstName: 'Lea', lastName: 'Fournier', email: 'lea@gmail.com', role: 'Beneficiaire', organization: 'PEPITE Paris Sorbonne', status: 'inactif', lastLogin: '2024-09-20 11:00', createdAt: '2024-05-20' },
  { id: '16', firstName: 'Nathan', lastName: 'Girard', email: 'nathan@gmail.com', role: 'Beneficiaire', organization: 'GIDEF Paris Centre', status: 'actif', lastLogin: '2024-12-18 08:30', createdAt: '2024-08-01' },
  { id: '17', firstName: 'Emma', lastName: 'Bonnet', email: 'emma@gmail.com', role: 'Conseiller', organization: 'GIDEF Creteil', status: 'actif', lastLogin: '2024-12-18 10:45', createdAt: '2024-03-15' },
  { id: '18', firstName: 'Romain', lastName: 'Mercier', email: 'romain@gmail.com', role: 'Conseiller', organization: 'GIDEF Nanterre', status: 'actif', lastLogin: '2024-12-17 16:00', createdAt: '2024-04-01' },
  { id: '19', firstName: 'Julie', lastName: 'Lemoine', email: 'julie@gmail.com', role: 'Beneficiaire', organization: 'CCI Paris IDF', status: 'actif', lastLogin: '2024-12-16 13:15', createdAt: '2024-07-10' },
  { id: '20', firstName: 'Maxime', lastName: 'Faure', email: 'maxime@gmail.com', role: 'Beneficiaire', organization: 'Incub Startup IDF', status: 'inactif', lastLogin: '2024-11-01 09:00', createdAt: '2024-08-20' },
]

const roleColors: Record<UserRole, string> = {
  Admin: 'bg-[#FFB74D]/20 text-[#FFB74D]',
  Conseiller: 'bg-[#00838F]/10 text-[#00838F]',
  Beneficiaire: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

export function Utilisateurs() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [orgFilter, setOrgFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [userStates, setUserStates] = useState<Record<string, boolean>>(
    Object.fromEntries(users.map(u => [u.id, u.status === 'actif']))
  )

  const orgs = [...new Set(users.map(u => u.organization))]

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    if (q && !`${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)) return false
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (orgFilter !== 'all' && u.organization !== orgFilter) return false
    if (statusFilter !== 'all' && u.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Utilisateurs</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} utilisateur(s) affiche(s) sur {users.length}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#FFB74D] text-[#0F172A] hover:bg-[#FFA726]">
              <Plus className="h-4 w-4" />
              Creer un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel utilisateur</DialogTitle>
              <DialogDescription>Ajoutez un utilisateur a la plateforme</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Prenom</Label><Input placeholder="Prenom" /></div>
                <div className="grid gap-2"><Label>Nom</Label><Input placeholder="Nom" /></div>
              </div>
              <div className="grid gap-2"><Label>Email</Label><Input placeholder="email@exemple.fr" type="email" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beneficiaire">Beneficiaire</SelectItem>
                      <SelectItem value="Conseiller">Conseiller</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Organisation</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Organisation" /></SelectTrigger>
                    <SelectContent>
                      {orgs.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
              <Button className="bg-[#FFB74D] text-[#0F172A] hover:bg-[#FFA726]">Creer l&apos;utilisateur</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les roles</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Conseiller">Conseiller</SelectItem>
            <SelectItem value="Beneficiaire">Beneficiaire</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Organisation" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les orgs</SelectItem>
            {orgs.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="actif">Actif</SelectItem>
            <SelectItem value="inactif">Inactif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Organisation</TableHead>
                  <TableHead className="hidden lg:table-cell">Derniere connexion</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className={roleColors[user.role]}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[180px] truncate">{user.organization}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(user.lastLogin).toLocaleDateString('fr-FR')}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${userStates[user.id] ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        <span className="text-xs text-muted-foreground">{userStates[user.id] ? 'Actif' : 'Inactif'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2 cursor-pointer"><UserCog className="h-4 w-4" />Voir le profil</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer">Se deconnecter en tant que</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => setUserStates(s => ({ ...s, [user.id]: !s[user.id] }))}
                          >
                            {userStates[user.id] ? 'Desactiver le compte' : 'Activer le compte'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
