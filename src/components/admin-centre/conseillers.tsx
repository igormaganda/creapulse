'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  Plus,
  Mail,
  Phone,
  Star,
  Users,
  TrendingUp,
  CalendarDays,
  X,
  MapPin,
} from 'lucide-react'

/* ─── Mock data ─── */
const mockConseillers = [
  { id: 'c1', name: 'Sophie Martin', email: 'sophie.martin@gidef.fr', phone: '01 43 45 12 34', specialities: ['Creation', 'Financement', 'Business Plan'], beneficiairesCount: 28, maxCapacity: 30, status: 'active', avgProgress: 72, city: 'Creteil', entretiensThisMonth: 12 },
  { id: 'c2', name: 'Pierre Dubois', email: 'pierre.dubois@gidef.fr', phone: '01 43 45 12 35', specialities: ['Juridique', 'Social', 'Marche'], beneficiairesCount: 25, maxCapacity: 30, status: 'active', avgProgress: 68, city: 'Creteil', entretiensThisMonth: 10 },
  { id: 'c3', name: 'Claire Lefevre', email: 'claire.lefevre@gidef.fr', phone: '01 43 45 12 36', specialities: ['Marketing', 'Digital', 'Reseau'], beneficiairesCount: 22, maxCapacity: 30, status: 'active', avgProgress: 65, city: 'Creteil', entretiensThisMonth: 9 },
  { id: 'c4', name: 'Marc Petit', email: 'marc.petit@gidef.fr', phone: '01 43 45 12 37', specialities: ['Comptabilite', 'Fiscalite', 'CreaSim'], beneficiairesCount: 20, maxCapacity: 30, status: 'active', avgProgress: 61, city: 'Creteil', entretiensThisMonth: 8 },
  { id: 'c5', name: 'Julie Moreau', email: 'julie.moreau@gidef.fr', phone: '01 43 45 12 38', specialities: ['Creation', 'Formation', 'Passeport'], beneficiairesCount: 18, maxCapacity: 30, status: 'active', avgProgress: 58, city: 'Villeneuve-Saint-Georges', entretiensThisMonth: 7 },
  { id: 'c6', name: 'Antoine Roux', email: 'antoine.roux@gidef.fr', phone: '01 43 45 12 39', specialities: ['Immigration', 'International', 'Marche'], beneficiairesCount: 14, maxCapacity: 30, status: 'active', avgProgress: 55, city: 'Creteil', entretiensThisMonth: 5 },
  { id: 'c7', name: 'Isabelle Fontaine', email: 'isabelle.fontaine@gidef.fr', phone: '01 43 45 12 40', specialities: ['Social', 'Insertion', 'Coaching'], beneficiairesCount: 3, maxCapacity: 30, status: 'inactive', avgProgress: 0, city: 'Creteil', entretiensThisMonth: 0 },
]

const assignedBeneficiaires = [
  { id: 'b1', name: 'Alexandre Chen', project: 'Restaurant Asiatique Fusion', phase: 'Structuration', progress: 75 },
  { id: 'b2', name: 'Marie Dupont', project: 'Studio de Yoga', phase: 'Financement', progress: 60 },
  { id: 'b3', name: 'Thomas Leroy', project: 'Application mobile Sante', phase: 'Lancement', progress: 90 },
  { id: 'b4', name: 'Fatima Benali', project: 'Salon de coiffure', phase: 'Ideation', progress: 30 },
  { id: 'b5', name: 'Lucas Martin', project: 'E-commerce artisanal', phase: 'Structuration', progress: 55 },
]

export function ConseillersManagement() {
  const [search, setSearch] = useState('')
  const [selectedConseiller, setSelectedConseiller] = useState<typeof mockConseillers[0] | null>(null)

  const filtered = mockConseillers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.specialities.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  )

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Actif</Badge>
    return <Badge variant="secondary">Inactif</Badge>
  }

  const getCapacityColor = (count: number, max: number) => {
    const ratio = count / max
    if (ratio >= 0.9) return 'text-red-500'
    if (ratio >= 0.7) return 'text-amber-500'
    return 'text-green-600'
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Gestion des conseillers</h2>
          <p className="text-sm text-muted-foreground">{mockConseillers.length} conseillers dans ce centre</p>
        </div>
        <Button className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un conseiller
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un conseiller..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Conseiller</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Specialites</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Beneficiaires</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Capacite</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedConseiller(c)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-bold">
                          {c.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.specialities.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{c.beneficiairesCount}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Progress value={(c.beneficiairesCount / c.maxCapacity) * 100} className="h-2 w-20" />
                        <span className={`text-xs font-medium ${getCapacityColor(c.beneficiairesCount, c.maxCapacity)}`}>
                          {c.beneficiairesCount}/{c.maxCapacity}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      {getStatusBadge(c.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedConseiller} onOpenChange={() => setSelectedConseiller(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedConseiller && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-sm font-bold">
                    {selectedConseiller.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p>{selectedConseiller.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {getStatusBadge(selectedConseiller.status)}
                      <Badge variant="secondary" className="text-xs"><MapPin className="h-3 w-3 mr-1" />{selectedConseiller.city}</Badge>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Separator />

                {/* Contact */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contact</p>
                  <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{selectedConseiller.email}</div>
                  <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{selectedConseiller.phone}</div>
                </div>

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <Users className="h-5 w-5 mx-auto text-[#FF6B35]" />
                    <p className="text-lg font-bold mt-1">{selectedConseiller.beneficiairesCount}</p>
                    <p className="text-xs text-muted-foreground">Beneficiaires</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <TrendingUp className="h-5 w-5 mx-auto text-primary" />
                    <p className="text-lg font-bold mt-1">{selectedConseiller.avgProgress}%</p>
                    <p className="text-xs text-muted-foreground">Progression moy.</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <CalendarDays className="h-5 w-5 mx-auto text-amber-500" />
                    <p className="text-lg font-bold mt-1">{selectedConseiller.entretiensThisMonth}</p>
                    <p className="text-xs text-muted-foreground">Entretiens/mois</p>
                  </div>
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capacite utilisee</span>
                    <span className={`font-medium ${getCapacityColor(selectedConseiller.beneficiairesCount, selectedConseiller.maxCapacity)}`}>
                      {selectedConseiller.beneficiairesCount}/{selectedConseiller.maxCapacity}
                    </span>
                  </div>
                  <Progress value={(selectedConseiller.beneficiairesCount / selectedConseiller.maxCapacity) * 100} className="h-3" />
                </div>

                <Separator />

                {/* Specialities */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Specialites</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedConseiller.specialities.map((s) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Assigned beneficiaries */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Beneficiaires assignes</p>
                  <div className="space-y-2">
                    {assignedBeneficiaires.slice(0, 5).map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.project}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-xs">{b.phase}</Badge>
                          <p className="text-xs text-muted-foreground mt-0.5">{b.progress}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
