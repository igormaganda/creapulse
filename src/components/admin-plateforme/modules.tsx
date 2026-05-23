'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, ChevronUp, ChevronDown, Puzzle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModuleCategory = 'Diagnostic' | 'Modelisation' | 'Strategie' | 'Ecosysteme' | 'Pilotage' | 'Outil'
type ModulePhase = 'idee' | 'structurer' | 'financer' | 'lancer'

interface Module {
  id: string
  code: string
  name: string
  category: ModuleCategory
  phase: ModulePhase
  active: boolean
  order: number
  tenantIds: string[]
}

const categories: ModuleCategory[] = ['Diagnostic', 'Modelisation', 'Strategie', 'Ecosysteme', 'Pilotage', 'Outil']
const categoryColors: Record<ModuleCategory, string> = {
  Diagnostic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Modelisation: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Strategie: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Ecosysteme: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  Pilotage: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Outil: 'bg-[#FFB74D]/20 text-[#FFB74D]',
}

const phaseLabels: Record<ModulePhase, string> = {
  idee: 'Idee & Vision',
  structurer: 'Structurer',
  financer: 'Financer',
  lancer: 'Lancer',
}

const initialModules: Module[] = [
  { id: '1', code: 'riasec', name: 'Test RIASEC', category: 'Diagnostic', phase: 'idee', active: true, order: 1, tenantIds: ['1', '2', '3', '4', '5', '6'] },
  { id: '2', code: 'kiviat', name: 'Test Kiviat', category: 'Diagnostic', phase: 'idee', active: true, order: 2, tenantIds: ['1', '2', '3'] },
  { id: '3', code: 'profil-createur', name: 'Profil Createur', category: 'Diagnostic', phase: 'idee', active: true, order: 3, tenantIds: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  { id: '4', code: 'mon-projet', name: 'Mon Projet', category: 'Modelisation', phase: 'idee', active: true, order: 4, tenantIds: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  { id: '5', code: 'vision', name: 'Vision', category: 'Modelisation', phase: 'idee', active: true, order: 5, tenantIds: ['1', '4', '6'] },
  { id: '6', code: 'creasim', name: 'CreaSim', category: 'Strategie', phase: 'financer', active: true, order: 6, tenantIds: ['1', '2', '3', '4', '5', '6', '7'] },
  { id: '7', code: 'business-plan', name: 'Business Plan IA', category: 'Strategie', phase: 'structurer', active: true, order: 7, tenantIds: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  { id: '8', code: 'annuaire', name: 'Annuaire', category: 'Ecosysteme', phase: 'lancer', active: true, order: 8, tenantIds: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  { id: '9', code: 'forum', name: 'Forum', category: 'Ecosysteme', phase: 'lancer', active: true, order: 9, tenantIds: ['1', '2', '4', '6'] },
  { id: '10', code: 'mentorat', name: 'Mentorat', category: 'Ecosysteme', phase: 'lancer', active: false, order: 10, tenantIds: ['1', '4'] },
  { id: '11', code: 'passeport', name: 'Passeport Entrepreneurial', category: 'Pilotage', phase: 'lancer', active: false, order: 11, tenantIds: [] },
  { id: '12', code: 'pitch-deck', name: 'Pitch Deck', category: 'Outil', phase: 'financer', active: false, order: 12, tenantIds: ['1', '4'] },
]

export function Modules() {
  const [modules, setModules] = useState(initialModules)
  const [catFilter, setCatFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const toggleActive = (id: string) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m)))
  }

  const moveModule = (id: string, dir: 'up' | 'down') => {
    setModules((prev) => {
      const idx = prev.findIndex((m) => m.id === id)
      if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === prev.length - 1)) return prev
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next.map((m, i) => ({ ...m, order: i + 1 }))
    })
  }

  const filtered = modules
    .filter((m) => {
      if (catFilter !== 'all' && m.category !== catFilter) return false
      if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.code.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Modules</h2>
          <p className="text-sm text-muted-foreground">{modules.filter(m => m.active).length} actif(s) sur {modules.length} modules</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un module..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]" />
                <TableHead>Module</TableHead>
                <TableHead className="hidden sm:table-cell">Categorie</TableHead>
                <TableHead className="hidden md:table-cell">Phase</TableHead>
                <TableHead className="hidden lg:table-cell">Tenants</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[60px]">Ordre</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((mod) => (
                <TableRow key={mod.id}>
                  <TableCell>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Puzzle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{mod.name}</p>
                      <p className="text-xs text-muted-foreground">{mod.code}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className={categoryColors[mod.category]}>{mod.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{phaseLabels[mod.phase]}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{mod.tenantIds.length} organisation(s)</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={mod.active} onCheckedChange={() => toggleActive(mod.id)} />
                      <span className="text-xs text-muted-foreground">{mod.active ? 'Actif' : 'Inactif'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveModule(mod.id, 'up')} disabled={mod.order === 1}>
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveModule(mod.id, 'down')} disabled={mod.order === modules.length}>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
