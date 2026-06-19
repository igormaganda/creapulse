'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  GraduationCap,
  Clock,
  Target,
  BarChart3,
  Users,
  Star,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  ClipboardCheck,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ─── Types ─── */
interface PaaModuleConfig {
  code: string
  label: string
  description: string
  enabled: boolean
}

interface PaaSettings {
  programDurationDays: number
  minAteliers: number
  followUpDays: number
  npsEnabled: boolean
}

interface PaaStats {
  activePrograms: number
  completionRate: number
  satisfaction: number
}

interface PaaConfig {
  enabled: boolean
  modules: Record<string, boolean>
  settings: PaaSettings
}

/* ─── PAA Module Definitions ─── */
const PAA_MODULES: PaaModuleConfig[] = [
  { code: 'parcours-paa', label: 'Timeline PAA 60 jours', description: 'Parcours structuré d\'accompagnement sur 60 jours', enabled: true },
  { code: 'swot', label: 'Matrice SWOT', description: 'Analyse forces, faiblesses, opportunités et menaces', enabled: true },
  { code: 'objectifs-smart', label: 'Objectifs SMART', description: 'Définition d\'objectifs Spécifiques, Mesurables, Atteignables, Réalistes, Temporels', enabled: true },
  { code: 'gestion-temps', label: 'Gestion du Temps', description: 'Outils et méthodes de gestion du temps entrepreneurial', enabled: true },
  { code: 'gestion-crise', label: 'Gestion de Crise', description: 'Protocoles de gestion de crise et résilience', enabled: true },
  { code: 'cloture-rebond', label: 'Clôture & Rebond', description: 'Bilan final et plan de rebond post-accompagnement', enabled: true },
]

const PAA_MODULE_ICONS: Record<string, React.ElementType> = {
  'parcours-paa': CalendarDays,
  'swot': BarChart3,
  'objectifs-smart': Target,
  'gestion-temps': Clock,
  'gestion-crise': AlertTriangle,
  'cloture-rebond': TrendingUp,
}

const DEFAULT_SETTINGS: PaaSettings = {
  programDurationDays: 60,
  minAteliers: 3,
  followUpDays: 90,
  npsEnabled: true,
}

/* ─── Component ─── */
export function PaaPack() {
  const [config, setConfig] = useState<PaaConfig>({
    enabled: false,
    modules: Object.fromEntries(PAA_MODULES.map((m) => [m.code, m.enabled])),
    settings: { ...DEFAULT_SETTINGS },
  })
  const [stats, setStats] = useState<PaaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)

  // Load PAA config from API
  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin-plateforme/configuration?section=paa', {
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data?.paa) {
          setConfig(json.data.paa)
        }
      }
    } catch {
      // Keep defaults
    }
    setLoading(false)
  }, [])

  // Load PAA stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/paa/dashboard', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setStats(json.data)
        }
      }
    } catch {
      // Stats unavailable — show placeholder
      setStats(null)
    }
    setStatsLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      setLoading(true)
      setStatsLoading(true)
      try {
        const [configRes, statsRes] = await Promise.all([
          fetch('/api/admin-plateforme/configuration?section=paa', { credentials: 'include' }),
          fetch('/api/paa/dashboard', { credentials: 'include' }),
        ])
        if (cancelled) return
        if (configRes.ok) {
          const json = await configRes.json()
          if (json.success && json.data?.paa) setConfig(json.data.paa)
        }
        if (statsRes.ok) {
          const json = await statsRes.json()
          if (json.success && json.data) setStats(json.data)
        }
      } catch { /* keep defaults */ }
      if (!cancelled) { setLoading(false); setStatsLoading(false) }
    }
    init()
    return () => { cancelled = true }
  }, [])

  // Save PAA config
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin-plateforme/configuration', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'platform',
          paa: config,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          toast.success('Configuration PAA sauvegardée')
          return
        }
      }
      toast.error('Erreur lors de la sauvegarde')
    } catch {
      toast.error('Erreur réseau')
    }
    setSaving(false)
  }

  // Toggle master PAA pack
  const handleMasterToggle = (enabled: boolean) => {
    setConfig((prev) => ({ ...prev, enabled }))
    // When master is OFF, all individual modules are disabled
    if (!enabled) {
      setConfig((prev) => ({
        ...prev,
        modules: Object.fromEntries(PAA_MODULES.map((m) => [m.code, false])),
      }))
    }
  }

  // Toggle individual PAA module
  const handleModuleToggle = (code: string, enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      modules: { ...prev.modules, [code]: enabled },
    }))
  }

  // Update a setting value
  const handleSettingChange = <K extends keyof PaaSettings>(key: K, value: PaaSettings[K]) => {
    setConfig((prev) => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
    }))
  }

  const enabledModuleCount = Object.values(config.modules).filter(Boolean).length
  const totalModuleCount = PAA_MODULES.length

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Pack PAA</h2>
            <p className="text-sm text-muted-foreground">
              Programme d&apos;Accompagnement à l&apos;Amorçage — Configuration du pack
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="gap-2 bg-[#FFB74D] text-[#0F172A] hover:bg-[#FFA726]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Sauvegarder
        </Button>
      </div>

      {/* ─── Master Toggle ─── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                  config.enabled
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-muted'
                )}
              >
                <GraduationCap
                  className={cn(
                    'h-6 w-6 transition-colors',
                    config.enabled
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  )}
                />
              </div>
              <div>
                <h3 className="text-base font-semibold">Activer le Pack PAA</h3>
                <p className="text-sm text-muted-foreground">
                  {config.enabled
                    ? 'Le pack PAA est actif — les modules sont visibles pour les bénéficiaires'
                    : 'Le pack PAA est désactivé — aucun module PAA n\'est visible'}
                </p>
              </div>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={handleMasterToggle}
              className="scale-125"
            />
          </div>

          {!config.enabled && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:bg-amber-900/20 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Tous les modules PAA sont masqués pour les bénéficiaires. Activez le pack pour les rendre disponibles.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── PAA Modules List ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Modules du pack PAA</CardTitle>
              <CardDescription>
                {enabledModuleCount} module(s) activé(s) sur {totalModuleCount}
              </CardDescription>
            </div>
            {config.enabled && (
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Pack actif
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {PAA_MODULES.map((mod) => {
            const Icon = PAA_MODULE_ICONS[mod.code] || GraduationCap
            const isEnabled = config.modules[mod.code] ?? mod.enabled
            const isPackEnabled = config.enabled

            return (
              <div
                key={mod.code}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-4 transition-all',
                  !isPackEnabled && 'opacity-50',
                  isEnabled && isPackEnabled && 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                      isEnabled && isPackEnabled
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-muted'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isEnabled && isPackEnabled
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{mod.label}</p>
                    <p className="text-xs text-muted-foreground">{mod.description}</p>
                    <p className="mt-0.5 text-xs font-mono text-muted-foreground">{mod.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isEnabled && isPackEnabled}
                    onCheckedChange={(checked) => handleModuleToggle(mod.code, checked)}
                    disabled={!isPackEnabled}
                  />
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {isPackEnabled ? (isEnabled ? 'Actif' : 'Inactif') : 'Masqué'}
                  </span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ─── Stats Section ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Statistiques du programme PAA</CardTitle>
          <CardDescription>Indicateurs clés du programme d&apos;accompagnement</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Chargement des statistiques…
            </div>
          ) : stats ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activePrograms}</p>
                  <p className="text-xs text-muted-foreground">Programmes actifs</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">Taux de complétion</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.satisfaction}/10</p>
                  <p className="text-xs text-muted-foreground">Satisfaction moyenne</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-muted p-4 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <p className="text-sm">Aucune statistique disponible. Les données apparaîtront une fois le programme actif.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Configuration ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configuration du programme</CardTitle>
          <CardDescription>Paramètres par défaut du programme d&apos;accompagnement PAA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Program Duration */}
          <div className="grid gap-2 max-w-md">
            <Label className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              Durée du programme (jours)
            </Label>
            <Input
              type="number"
              min={7}
              max={365}
              value={config.settings.programDurationDays}
              onChange={(e) => handleSettingChange('programDurationDays', parseInt(e.target.value) || 60)}
            />
            <p className="text-xs text-muted-foreground">
              Durée par défaut du parcours d&apos;accompagnement en jours
            </p>
          </div>

          <Separator />

          {/* Min Ateliers */}
          <div className="grid gap-2 max-w-md">
            <Label className="flex items-center gap-2">
              <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
              Nombre minimum d&apos;ateliers requis
            </Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={config.settings.minAteliers}
              onChange={(e) => handleSettingChange('minAteliers', parseInt(e.target.value) || 3)}
            />
            <p className="text-xs text-muted-foreground">
              Nombre minimum d&apos;ateliers à compléter pour valider le programme
            </p>
          </div>

          <Separator />

          {/* Follow-up Period */}
          <div className="grid gap-2 max-w-md">
            <Label className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Période de suivi (jours)
            </Label>
            <Input
              type="number"
              min={7}
              max={365}
              value={config.settings.followUpDays}
              onChange={(e) => handleSettingChange('followUpDays', parseInt(e.target.value) || 90)}
            />
            <p className="text-xs text-muted-foreground">
              Durée de la période de suivi post-programme en jours
            </p>
          </div>

          <Separator />

          {/* NPS Survey Toggle */}
          <div className="flex items-center justify-between max-w-md">
            <div>
              <Label className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-muted-foreground" />
                Enquête NPS activée
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Activer l&apos;enquête Net Promoter Score en fin de programme
              </p>
            </div>
            <Switch
              checked={config.settings.npsEnabled}
              onCheckedChange={(checked) => handleSettingChange('npsEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
