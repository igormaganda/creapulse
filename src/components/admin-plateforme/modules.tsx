'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Search, ChevronUp, ChevronDown, Puzzle, RefreshCw, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { MODULE_REGISTRY } from '@/lib/module-registry'
import { useModuleConfigStore } from '@/lib/stores/module-config-store'

/* ─── Types ─── */
interface DbModule {
  id: string
  code: string
  nom: string
  description: string
  categorie: string
  phase: string
  actif: boolean
  ordre: number
  configuration: Record<string, unknown>
  utilisation: { completions: number; scoreMoyen: number }
}

const categories = ['DIAGNOSTIC', 'MODELING', 'STRATEGY', 'ECOSYSTEM', 'PILOTAGE', 'TOOL'] as const
const categoryLabels: Record<string, string> = {
  DIAGNOSTIC: 'Diagnostic',
  MODELING: 'Modélisation',
  STRATEGY: 'Stratégie',
  ECOSYSTEM: 'Écosystème',
  PILOTAGE: 'Pilotage',
  TOOL: 'Outil',
}
const categoryColors: Record<string, string> = {
  DIAGNOSTIC: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  MODELING: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  STRATEGY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  ECOSYSTEM: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  PILOTAGE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  TOOL: 'bg-[#FFB74D]/20 text-[#FFB74D]',
}

export function Modules() {
  const [dbModules, setDbModules] = useState<DbModule[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [catFilter, setCatFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const { toggleModule: toggleLocalModule } = useModuleConfigStore()

  // Fetch modules from DB on mount
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/admin-plateforme/modules', { credentials: 'include' })
        if (res.ok && !cancelled) {
          const json = await res.json()
          if (json.success && json.data) {
            setDbModules(json.data)
          }
        }
      } catch {
        // Fall back to registry defaults
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Refetch function for after sync/toggle
  const refetchModules = useCallback(async () => {
    try {
      const res = await fetch('/api/admin-plateforme/modules', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setDbModules(json.data)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Sync registry → DB
  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin-plateforme/modules-sync', {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          toast.success(`${json.data.created} créé(s), ${json.data.updated} mis à jour`)
          await refetchModules()
        }
      } else {
        toast.error('Erreur lors de la synchronisation')
      }
    } catch {
      toast.error('Erreur réseau')
    }
    setSyncing(false)
  }

  // Toggle module active/inactive
  const toggleActive = async (moduleId: string, code: string, newActive: boolean) => {
    try {
      const res = await fetch('/api/admin-plateforme/modules', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, isActive: newActive }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          // Update local state
          setDbModules((prev) =>
            prev.map((m) => (m.id === moduleId ? { ...m, actif: newActive } : m))
          )
          // Also update module config store for live UI update
          toggleLocalModule(code, newActive)
          toast.success(`Module ${newActive ? 'activé' : 'désactivé'}`)
        }
      }
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  // Merge DB data with registry metadata
  const mergedModules = MODULE_REGISTRY.map((reg) => {
    const db = dbModules.find((m) => m.code === reg.code)
    return {
      id: db?.id || '',
      code: reg.code,
      label: reg.label,
      description: reg.description,
      category: reg.category,
      section: reg.section,
      active: db ? db.actif : true, // Default active if not in DB yet
      sortOrder: reg.sortOrder,
      completions: db?.utilisation?.completions || 0,
      scoreMoyen: db?.utilisation?.scoreMoyen || 0,
      core: reg.core,
    }
  })

  const filtered = mergedModules
    .filter((m) => {
      if (catFilter !== 'all' && m.category !== catFilter) return false
      if (search && !m.label.toLowerCase().includes(search.toLowerCase()) && !m.code.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const activeCount = mergedModules.filter((m) => m.active).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Modules</h2>
          <p className="text-sm text-muted-foreground">{activeCount} actif(s) sur {mergedModules.length} modules</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-1.5">
            {syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {syncing ? 'Synchronisation...' : 'Synchroniser le registre'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un module..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
            ))}
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
                <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                <TableHead className="hidden md:table-cell">Section</TableHead>
                <TableHead className="hidden lg:table-cell">Utilisation</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]">Core</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chargement des modules...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun module trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((mod) => (
                  <TableRow key={mod.code} className={cn(!mod.active && 'opacity-50')}>
                    <TableCell>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Puzzle className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{mod.label}</p>
                        <p className="text-xs text-muted-foreground">{mod.code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className={categoryColors[mod.category]}>
                        {categoryLabels[mod.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground capitalize">{mod.section}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {mod.completions} complétion(s)
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={mod.active}
                          onCheckedChange={(checked) => {
                            if (mod.id) {
                              toggleActive(mod.id, mod.code, checked)
                            } else {
                              toast.error('Synchronisez d\'abord le registre')
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">{mod.active ? 'Actif' : 'Inactif'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {mod.core && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary">
                          Core
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
