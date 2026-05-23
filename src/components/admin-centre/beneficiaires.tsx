'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  Download,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  FileText,
  TrendingUp,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'

/* ─── Mock data ─── */
const mockBeneficiaires = [
  { id: 'b1', name: 'Alexandre Chen', email: 'a.chen@email.com', project: 'Restaurant Asiatique Fusion', conseiller: 'Sophie Martin', phase: 'Structuration', progress: 75, sector: 'Restauration', registrationDate: '2025-01-15', status: 'active' },
  { id: 'b2', name: 'Marie Dupont', email: 'm.dupont@email.com', project: 'Studio de Yoga Bien-etre', conseiller: 'Sophie Martin', phase: 'Financement', progress: 60, sector: 'Bien-etre', registrationDate: '2024-11-20', status: 'active' },
  { id: 'b3', name: 'Thomas Leroy', email: 't.leroy@email.com', project: 'Application mobile Sante', conseiller: 'Pierre Dubois', phase: 'Lancement', progress: 90, sector: 'Tech', registrationDate: '2024-09-10', status: 'active' },
  { id: 'b4', name: 'Fatima Benali', email: 'f.benali@email.com', project: 'Salon de coiffure moderne', conseiller: 'Claire Lefevre', phase: 'Ideation', progress: 30, sector: 'Beaute', registrationDate: '2025-03-05', status: 'active' },
  { id: 'b5', name: 'Lucas Martin', email: 'l.martin@email.com', project: 'E-commerce artisanal', conseiller: 'Pierre Dubois', phase: 'Structuration', progress: 55, sector: 'Commerce', registrationDate: '2025-02-12', status: 'active' },
  { id: 'b6', name: 'Sophie Morel', email: 's.morel@email.com', project: 'Cabinet de conseil RH', conseiller: 'Sophie Martin', phase: 'Developpement', progress: 95, sector: 'Services', registrationDate: '2024-06-18', status: 'active' },
  { id: 'b7', name: 'David Nguyen', email: 'd.nguyen@email.com', project: 'Boulangerie artisanale bio', conseiller: 'Marc Petit', phase: 'Lancement', progress: 85, sector: 'Alimentation', registrationDate: '2024-10-01', status: 'active' },
  { id: 'b8', name: 'Emma Bernard', email: 'e.bernard@email.com', project: 'Agence de communication digitale', conseiller: 'Claire Lefevre', phase: 'Structuration', progress: 45, sector: 'Marketing', registrationDate: '2025-01-28', status: 'active' },
  { id: 'b9', name: 'Karim Diallo', email: 'k.diallo@email.com', project: 'Transport de marchandises', conseiller: 'Pierre Dubois', phase: 'Financement', progress: 50, sector: 'Transport', registrationDate: '2024-12-14', status: 'active' },
  { id: 'b10', name: 'Laura Petit', email: 'l.petit@email.com', project: 'Creche municipale privee', conseiller: 'Julie Moreau', phase: 'Ideation', progress: 20, sector: 'Social', registrationDate: '2025-03-20', status: 'active' },
  { id: 'b11', name: 'Nicolas Faure', email: 'n.faure@email.com', project: ' Garage auto electrique', conseiller: 'Marc Petit', phase: 'Developpement', progress: 92, sector: 'Automobile', registrationDate: '2024-07-22', status: 'active' },
  { id: 'b12', name: 'Amina Toure', email: 'a.toure@email.com', project: 'Restaurant vegan gourmand', conseiller: 'Antoine Roux', phase: 'Structuration', progress: 40, sector: 'Restauration', registrationDate: '2025-02-28', status: 'inactive' },
]

export function BeneficiairesManagement() {
  const [search, setSearch] = useState('')
  const [filterConseiller, setFilterConseiller] = useState('all')
  const [filterPhase, setFilterPhase] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState<typeof mockBeneficiaires[0] | null>(null)

  const conseillers = useMemo(() => ['all', ...new Set(mockBeneficiaires.map((b) => b.conseiller))], [])
  const phases = useMemo(() => ['all', ...new Set(mockBeneficiaires.map((b) => b.phase))], [])

  const filtered = useMemo(() => {
    return mockBeneficiaires.filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.email.toLowerCase().includes(search.toLowerCase()) ||
        b.project.toLowerCase().includes(search.toLowerCase())
      const matchConseiller = filterConseiller === 'all' || b.conseiller === filterConseiller
      const matchPhase = filterPhase === 'all' || b.phase === filterPhase
      const matchStatus = filterStatus === 'all' || b.status === filterStatus
      return matchSearch && matchConseiller && matchPhase && matchStatus
    })
  }, [search, filterConseiller, filterPhase, filterStatus])

  const getPhaseColor = (phase: string) => {
    const colors: Record<string, string> = {
      'Ideation': 'bg-amber-100 text-amber-700',
      'Structuration': 'bg-primary/10 text-primary',
      'Financement': 'bg-[#FF6B35]/10 text-[#FF6B35]',
      'Lancement': 'bg-green-100 text-green-700',
      'Developpement': 'bg-purple-100 text-purple-700',
    }
    return colors[phase] || 'bg-muted text-muted-foreground'
  }

  const handleExport = () => {
    toast.success('Export CSV lance', { description: 'Le fichier sera telecharge dans quelques instants.' })
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Gestion des beneficiaires</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} beneficiaires affiches sur {mockBeneficiaires.length}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, projet..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={filterConseiller} onValueChange={setFilterConseiller}>
            <SelectTrigger className="w-44">
              <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Conseiller" />
            </SelectTrigger>
            <SelectContent>
              {conseillers.map((c) => (
                <SelectItem key={c} value={c}>{c === 'all' ? 'Tous les conseillers' : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPhase} onValueChange={setFilterPhase}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              {phases.map((p) => (
                <SelectItem key={p} value={p}>{p === 'all' ? 'Toutes les phases' : p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Beneficiaire</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Projet</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Conseiller</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Phase</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Progression</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden xl:table-cell">Inscription</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedBeneficiaire(b)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {b.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="max-w-[200px] truncate">
                        <p className="truncate">{b.project}</p>
                        <p className="text-xs text-muted-foreground">{b.sector}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-sm">{b.conseiller}</td>
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <Badge variant="secondary" className={getPhaseColor(b.phase)}>{b.phase}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 justify-center">
                        <Progress value={b.progress} className="h-2 w-16" />
                        <span className="text-xs font-medium w-8 text-right">{b.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground hidden xl:table-cell">
                      {new Date(b.registrationDate).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Aucun beneficiaire ne correspond a vos criteres.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBeneficiaire} onOpenChange={() => setSelectedBeneficiaire(null)}>
        <DialogContent className="max-w-lg">
          {selectedBeneficiaire && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {selectedBeneficiaire.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p>{selectedBeneficiaire.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className={getPhaseColor(selectedBeneficiaire.phase)}>{selectedBeneficiaire.phase}</Badge>
                      <Badge variant="secondary">{selectedBeneficiaire.sector}</Badge>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Separator />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{selectedBeneficiaire.email}</div>
                  <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />Inscrit le {new Date(selectedBeneficiaire.registrationDate).toLocaleDateString('fr-FR')}</div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Projet</p>
                  <p className="font-medium text-foreground">{selectedBeneficiaire.project}</p>
                  <p className="text-sm text-muted-foreground">Conseiller : {selectedBeneficiaire.conseiller}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progression du parcours</span>
                    <span className="font-bold text-foreground">{selectedBeneficiaire.progress}%</span>
                  </div>
                  <Progress value={selectedBeneficiaire.progress} className="h-3" />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
