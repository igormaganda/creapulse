'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Scale,
  Check,
  Sparkles,
  Loader2,
  Building2,
  Shield,
  FileCheck,
  Info,
  Save,
  Users,
  DollarSign,
  Percent,
  Calculator,
  Briefcase,
  BarChart3,
  ArrowRight,
  CircleDot,
  Landmark,
  Receipt,
  UserCheck,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTradEmploi } from '@/components/trad-emploi/voice-context'

// ─── Types ──────────────────────────────────

type StatutJuridique = 'SAS' | 'SARL' | 'EURL' | 'Auto-entrepreneur' | 'SASU'

interface StatutInfo {
  id: StatutJuridique
  name: string
  description: string
  capital: string
  associates: string
  regime: string
  social: string
  liability: string
  color: string
  icon: typeof Building2
  advantages: string[]
  disadvantages: string[]
}

interface SimulateurJuridique {
  statut: StatutJuridique
  caPrev: number
  associes: number
  capitalSocial: number
  reductionCharges: number
}

// ─── Constants ──────────────────────────────

const STATUTS: StatutInfo[] = [
  {
    id: 'SAS',
    name: 'SAS',
    description: 'Société par Actions Simplifiée — idéale pour les startups et projets innovants',
    capital: '1 € minimum',
    associates: '2+',
    regime: 'IS',
    social: 'Assimilé salarié',
    liability: 'Limitée au capital',
    color: '#EF4444',
    icon: Building2,
    advantages: ['Flexibilité statutaire', 'Facilite levées de fonds', 'Assimilé salarié'],
    disadvantages: ['Charges sociales élevées', 'Formalités complexes', 'IS obligatoire'],
  },
  {
    id: 'SARL',
    name: 'SARL',
    description: 'Société à Responsabilité Limitée — classique et fiable pour les PME',
    capital: '1 € minimum',
    associates: '2-100',
    regime: 'IR (option IS)',
    social: 'TNS (gérant majoritaire)',
    liability: 'Limitée au capital',
    color: '#FF6B35',
    icon: Briefcase,
    advantages: ['Protection patrimoine', 'Crédibilité bancaire', 'Fiscalité souple'],
    disadvantages: ['Charges sociales', 'Formalités comptables', 'Décisions conjointes'],
  },
  {
    id: 'EURL',
    name: 'EURL',
    description: 'Entreprise Unipersonnelle à Responsabilité Limitée — SARL à associé unique',
    capital: '1 € minimum',
    associates: '1',
    regime: 'IR (option IS)',
    social: 'TNS',
    liability: 'Limitée au capital',
    color: '#00838F',
    icon: Shield,
    advantages: ['Solo avec protection', 'Flexibilité fiscale', 'Faible capital'],
    disadvantages: ['Pas d\'assurance chômage', 'Charges sociales', 'Comptabilité'],
  },
  {
    id: 'Auto-entrepreneur',
    name: 'Auto-entrepreneur',
    description: 'Micro-entreprise — le statut le plus simple pour démarrer',
    capital: 'Aucun',
    associates: '1',
    regime: 'Micro-BIC/BNC',
    social: 'TNS',
    liability: 'Illimitée',
    color: '#10B981',
    icon: UserCheck,
    advantages: ['Simplicité maximale', 'Faibles charges', 'Pas de comptabilité'],
    disadvantages: ['Pas de protection', 'Plafonds de CA', 'Pas de déduction'],
  },
  {
    id: 'SASU',
    name: 'SASU',
    description: 'SAS Unipersonnelle — SAS à associé unique avec protection sociale',
    capital: '1 € minimum',
    associates: '1',
    regime: 'IS',
    social: 'Assimilé salarié',
    liability: 'Limitée au capital',
    color: '#8B5CF6',
    icon: Landmark,
    advantages: ['Statut salarié', 'Protection sociale', 'Flexibilité'],
    disadvantages: ['Charges très élevées', 'IS obligatoire', 'Comptabilité complexe'],
  },
]

const DEFAULT_SIM: SimulateurJuridique = {
  statut: 'SARL',
  caPrev: 50_000,
  associes: 2,
  capitalSocial: 1_000,
  reductionCharges: 50,
}

const formatEur = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(v)

// ─── InfoPopover helper ─────────────────────

function InfoPopover({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-[#00838F] hover:bg-[#00838F]/10 transition-colors shrink-0">
          <Info className="h-3.5 w-3.5" />
          <span className="sr-only">Aide</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-sm text-sm bg-popover border-border shadow-lg">
        <p className="text-muted-foreground leading-relaxed">{text}</p>
      </PopoverContent>
    </Popover>
  )
}

// ─── Animated Number ────────────────────────

function AnimatedValue({ value, format }: { value: number; format: (v: number) => string }) {
  const formatted = useMemo(() => format(value), [value, format])
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="font-bold text-xl"
    >
      {formatted}
    </motion.span>
  )
}

// ─── Main Component ─────────────────────────

export function JuridiqueModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { setContext: setVoiceContext } = useTradEmploi()

  // Simulator state
  const [sim, setSim] = useState<SimulateurJuridique>(DEFAULT_SIM)

  // ─── Slider setter helper ────────────────
  const updateSim = useCallback((key: keyof SimulateurJuridique, val: number) => {
    setSim(prev => ({ ...prev, [key]: val }))
  }, [])

  // ─── Load data on mount ──────────────────
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('creapulse-juridique')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.sim) setSim(prev => ({ ...prev, ...parsed.sim }))
        } catch { /* ignore */ }
      }

      try {
        const res = await fetch('/api/juridique', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const d = json.data
            if (d.legalStructure) {
              try {
                const structure = typeof d.legalStructure === 'string'
                  ? JSON.parse(d.legalStructure)
                  : d.legalStructure
                if (structure.recommended) {
                  const matchingStatut = STATUTS.find(s => s.name.toLowerCase().includes(structure.recommended.toLowerCase()))
                  if (matchingStatut) {
                    setSim(prev => ({ ...prev, statut: matchingStatut.id }))
                  }
                }
                if (structure.answers) {
                  if (structure.answers.associatesCount === 'solo') updateSim('associes', 1)
                  else if (structure.answers.associatesCount === '2-5') updateSim('associes', 3)
                  else if (structure.answers.associatesCount === '6+') updateSim('associes', 7)
                }
              } catch { /* ignore */ }
            }
            if (d.fiscalRegime) {
              // Could use this to pre-select
            }
          }
        }
      } catch { /* ignore */ }

      setIsLoading(false)
    }
    load()
  }, [])

  // ─── Auto-save to localStorage ──────────
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('creapulse-juridique', JSON.stringify({ sim }))
    }
  }, [isLoading, sim])

  // ─── Voice context ──────────────────────
  useEffect(() => {
    setVoiceContext({ module: 'juridique', section: 'simulateur-juridique' })
    return () => setVoiceContext({ module: '' })
  }, [setVoiceContext])

  // ─── Computed legal outputs ─────────────
  const legalOutputs = useMemo(() => {
    const statutInfo = STATUTS.find(s => s.id === sim.statut)!
    const ca = sim.caPrev

    // Régime fiscal
    const regimeFiscal: string = (sim.statut === 'SAS' || sim.statut === 'SASU') ? 'IS' : 'IR'

    // Charges sociales estimées (annual %)
    let chargesRate = 0
    switch (sim.statut) {
      case 'Auto-entrepreneur': chargesRate = 22; break
      case 'EURL': chargesRate = 45; break
      case 'SARL': chargesRate = 45; break
      case 'SASU': chargesRate = 65; break
      case 'SAS': chargesRate = 65; break
    }
    const chargesAnuelles = Math.round(ca * (chargesRate / 100) * (1 - sim.reductionCharges / 100))

    // TVA
    let tvaPlafond: 'Franchise' | 'Simplifié' | 'Réel' = 'Franchise'
    if (ca > 188_700) tvaPlafond = 'Réel'
    else if (ca > 85_800) tvaPlafond = 'Simplifié'

    // ACRE eligibility (auto-entrepreneur or first-time creator)
    const acreEligible = sim.statut === 'Auto-entrepreneur' || sim.reductionCharges > 40

    // Compatibility check
    const compatAssocies = sim.associes === 1
      ? (['EURL', 'Auto-entrepreneur', 'SASU'].includes(sim.statut))
      : sim.associes <= 100
        ? ['SAS', 'SARL'].includes(sim.statut)
        : sim.statut === 'SAS'

    return { statutInfo, regimeFiscal, chargesAnuelles, chargesRate, tvaPlafond, acreEligible, compatAssocies }
  }, [sim])

  // ─── Bar chart data ─────────────────────
  const chargesChartData = useMemo(() => {
    return STATUTS.map(s => {
      let rate = 0
      switch (s.id) {
        case 'Auto-entrepreneur': rate = 22; break
        case 'EURL': rate = 45; break
        case 'SARL': rate = 45; break
        case 'SASU': rate = 65; break
        case 'SAS': rate = 65; break
      }
      return {
        name: s.id,
        charges: Math.round(sim.caPrev * (rate / 100) * (1 - sim.reductionCharges / 100)),
        color: s.id === sim.statut ? s.color : `${s.color}40`,
        isActive: s.id === sim.statut,
      }
    })
  }, [sim.caPrev, sim.reductionCharges, sim.statut])

  // ─── Save to API + sync BP ──────────────
  const handleSaveAndSync = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/juridique', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          legalStructure: JSON.stringify({
            recommended: legalOutputs.statutInfo.name,
            statut: sim.statut,
            caPrev: sim.caPrev,
            associes: sim.associes,
            capitalSocial: sim.capitalSocial,
            reductionCharges: sim.reductionCharges,
            regimeFiscal: legalOutputs.regimeFiscal,
            chargesEstimees: legalOutputs.chargesAnuelles,
            tvaPlafond: legalOutputs.tvaPlafond,
            acreEligible: legalOutputs.acreEligible,
          }),
          fiscalRegime: legalOutputs.regimeFiscal,
          socialCharges: {
            micro: Math.round(sim.caPrev * 0.22 * (1 - sim.reductionCharges / 100)),
            eurl: Math.round(sim.caPrev * 0.45 * (1 - sim.reductionCharges / 100)),
            sarl: Math.round(sim.caPrev * 0.45 * (1 - sim.reductionCharges / 100)),
            sasu: Math.round(sim.caPrev * 0.65 * (1 - sim.reductionCharges / 100)),
          },
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message || 'Erreur lors de la sauvegarde')
        return
      }

      // Sync Business Plan
      try {
        await fetch('/api/business-plan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'sync-simulators' }),
        })
      } catch { /* non-critical */ }

      toast.success('Configuration juridique sauvegardée et BP synchronisé')
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }, [sim, legalOutputs])

  // ─── Loading skeleton ───────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  // ─── Main Render ──────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:px-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00838F]/10">
            <Scale className="h-5 w-5 text-[#00838F]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Simulateur Juridique</h2>
            <p className="text-xs text-muted-foreground">
              Choisissez votre statut et simulez vos charges
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 bg-[#00838F] hover:bg-[#00838F]/90 text-white"
            onClick={handleSaveAndSync}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Enregistrer &amp; synchroniser le BP
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* ── Statut Juridique Visual Selector ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#00838F]" />
              Statut juridique
            </h3>
            <InfoPopover text="Sélectionnez le statut juridique adapté à votre projet. Chaque statut a des implications sur la fiscalité, les charges sociales et la protection du patrimoine." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STATUTS.map((statut) => {
              const isSelected = sim.statut === statut.id
              const IconComp = statut.icon
              return (
                <motion.button
                  key={statut.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateSim('statut', statut.id)}
                  className={cn(
                    'text-left rounded-xl border-2 p-4 transition-all relative overflow-hidden',
                    isSelected
                      ? 'shadow-lg'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30',
                  )}
                  style={isSelected ? { borderColor: statut.color, boxShadow: `0 0 0 1px ${statut.color}` } : {}}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-white" style={{ color: statut.color }} />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${statut.color}15` }}
                    >
                      <IconComp className="h-5 w-5" style={{ color: statut.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: isSelected ? statut.color : undefined }}>
                        {statut.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{statut.capital}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {statut.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {statut.advantages.slice(0, 2).map((adv, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                        style={isSelected ? { borderColor: `${statut.color}60`, color: statut.color } : {}}
                      >
                        {adv}
                      </Badge>
                    ))}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* ── Incompatibility warning ── */}
        {!legalOutputs.compatAssocies && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border-2 border-red-500/30 bg-red-50/50 dark:bg-red-900/10 p-4 flex items-start gap-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 shrink-0">
              <Info className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-600">Incompatibilité détectée</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {legalOutputs.statutInfo.name} nécessite {legalOutputs.statutInfo.associes} associé(s).
                Vous avez sélectionné {sim.associes} associé(s). Changez le statut ou le nombre d&apos;associés.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Simulator Sliders ── */}
        <div className="space-y-6">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[#FF6B35]" />
            Paramètres du simulateur
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CA prévisionnel */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#00838F]" />
                      CA prévisionnel (année 1)
                    </CardTitle>
                    <InfoPopover text="Votre chiffre d'affaires prévisionnel pour la première année. Il détermine le régime fiscal applicable, les plafonds TVA et le montant des charges sociales." />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">0 €</span>
                  <span className="text-xl font-bold text-[#00838F]">{formatEur(sim.caPrev)}</span>
                  <span className="text-xs text-muted-foreground">500 000 €</span>
                </div>
                <Slider
                  value={[sim.caPrev]}
                  onValueChange={([v]) => updateSim('caPrev', v)}
                  min={0}
                  max={500_000}
                  step={5_000}
                  className="[&_[role=slider]]:bg-[#00838F] [&_[role=slider]]:border-[#00838F] [&_[data-orientation=horizontal]>.bg-primary]:bg-[#00838F]"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Démarrage</span>
                  <span>Pas : 5 000 €</span>
                  <span>Croissance</span>
                </div>
              </CardContent>
            </Card>

            {/* Nombre d'associés */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#FF6B35]" />
                      Nombre d&apos;associés
                    </CardTitle>
                    <InfoPopover text="Le nombre d'associés détermine quels statuts sont compatibles. 1 associé = EURL, SASU ou Auto-entrepreneur. 2+ associés = SARL ou SAS." />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={sim.associes === 1 ? 'border-[#00838F] text-[#00838F]' : 'text-muted-foreground'}>Solo</Badge>
                  <span className="text-xl font-bold text-[#FF6B35]">{sim.associes}</span>
                  <Badge variant="outline" className={sim.associes > 5 ? 'border-[#FF6B35] text-[#FF6B35]' : 'text-muted-foreground'}>Équipe</Badge>
                </div>
                <Slider
                  value={[sim.associes]}
                  onValueChange={([v]) => updateSim('associes', v)}
                  min={1}
                  max={10}
                  step={1}
                  className="[&_[role=slider]]:bg-[#FF6B35] [&_[role=slider]]:border-[#FF6B35] [&_[data-orientation=horizontal]>.bg-primary]:bg-[#FF6B35]"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>1 — Solo</span>
                  <span>10 — Grande équipe</span>
                </div>
              </CardContent>
            </Card>

            {/* Capital social */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-[#00838F]" />
                      Capital social
                    </CardTitle>
                    <InfoPopover text="Le capital social est le montant apporté par les associés à la création. La plupart des sociétés acceptent 1€ minimum. Un capital plus élevé renforce la crédibilité bancaire." />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">1 €</span>
                  <span className="text-xl font-bold text-[#00838F]">{formatEur(sim.capitalSocial)}</span>
                  <span className="text-xs text-muted-foreground">100 000 €</span>
                </div>
                <Slider
                  value={[sim.capitalSocial]}
                  onValueChange={([v]) => updateSim('capitalSocial', Math.max(1, v))}
                  min={1}
                  max={100_000}
                  step={500}
                  className="[&_[role=slider]]:bg-[#00838F] [&_[role=slider]]:border-[#00838F] [&_[data-orientation=horizontal]>.bg-primary]:bg-[#00838F]"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Symbolique</span>
                  <span>Pas : 500 €</span>
                  <span>Solide</span>
                </div>
              </CardContent>
            </Card>

            {/* Réduction de charges (ACRE) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Percent className="h-4 w-4 text-[#FFB74D]" />
                      Réduction de charges (ACRE)
                    </CardTitle>
                    <InfoPopover text="L'ACRE (Aide à la Création ou Reprise d'Entreprise) offre une réduction de charges pendant la 1ère année. Cette réduction s'applique différemment selon le statut." />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">0 %</span>
                  <span className="text-xl font-bold text-[#FFB74D]">{sim.reductionCharges}%</span>
                  <span className="text-xs text-muted-foreground">80 %</span>
                </div>
                <Slider
                  value={[sim.reductionCharges]}
                  onValueChange={([v]) => updateSim('reductionCharges', v)}
                  min={0}
                  max={80}
                  step={5}
                  className="[&_[role=slider]]:bg-[#FFB74D] [&_[role=slider]]:border-[#FFB74D] [&_[data-orientation=horizontal]>.bg-primary]:bg-[#FFB74D]"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Aucune réduction</span>
                  <span>ACRE maximale</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* ── Visual Output Cards ── */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-[#00838F]" />
            Résultats de la simulation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Régime fiscal */}
            <Card className={cn('border-2', legalOutputs.compatAssocies ? 'border-[#00838F]/20' : 'border-red-500/30')}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00838F]/10">
                    <Receipt className="h-4 w-4 text-[#00838F]" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Régime fiscal</span>
                </div>
                <p className="text-2xl font-bold text-[#00838F]">{legalOutputs.regimeFiscal}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {legalOutputs.regimeFiscal === 'IS' ? 'Impôt sur les Sociétés' : 'Impôt sur le Revenu'}
                </p>
                {sim.statut === 'EURL' || sim.statut === 'SARL' ? (
                  <p className="text-[11px] text-amber-500 mt-1">Option IS possible</p>
                ) : null}
              </CardContent>
            </Card>

            {/* Charges sociales estimées */}
            <Card className="border-[#00838F]/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]/10">
                    <Calculator className="h-4 w-4 text-[#FF6B35]" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Charges sociales</span>
                </div>
                <AnimatedValue value={legalOutputs.chargesAnuelles} format={formatEur} />
                <p className="text-[11px] text-muted-foreground mt-1">
                  ~{legalOutputs.chargesRate}% du CA × {(1 - sim.reductionCharges / 100 * 100).toFixed(0)}%
                </p>
              </CardContent>
            </Card>

            {/* Plafond TVA */}
            <Card className="border-[#00838F]/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFB74D]/10">
                    <Receipt className="h-4 w-4 text-[#FFB74D]" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Plafond TVA</span>
                </div>
                <Badge
                  className={cn(
                    'text-sm px-3 py-1',
                    legalOutputs.tvaPlafond === 'Franchise' && 'bg-green-500/10 text-green-600 border-green-500/30',
                    legalOutputs.tvaPlafond === 'Simplifié' && 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                    legalOutputs.tvaPlafond === 'Réel' && 'bg-red-500/10 text-red-600 border-red-500/30',
                  )}
                  variant="outline"
                >
                  {legalOutputs.tvaPlafond === 'Franchise' && '🟢 Franchise'}
                  {legalOutputs.tvaPlafond === 'Simplifié' && '🟡 Simplifié'}
                  {legalOutputs.tvaPlafond === 'Réel' && '🔴 Réel normal'}
                </Badge>
                <p className="text-[11px] text-muted-foreground mt-2">
                  {legalOutputs.tvaPlafond === 'Franchise' && 'En-dessous des plafonds de franchise de TVA'}
                  {legalOutputs.tvaPlafond === 'Simplifié' && 'Régime réel simplifié applicable'}
                  {legalOutputs.tvaPlafond === 'Réel' && 'Au-delà des plafonds — régime réel obligatoire'}
                </p>
              </CardContent>
            </Card>

            {/* Éligibilité ACRE */}
            <Card className="border-[#00838F]/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00838F]/10">
                    <Shield className="h-4 w-4 text-[#00838F]" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Éligibilité ACRE</span>
                </div>
                {legalOutputs.acreEligible ? (
                  <Badge className="bg-green-500 text-white text-sm px-3 py-1">
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Oui
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-500/40 text-red-500 text-sm px-3 py-1">
                    Non
                  </Badge>
                )}
                <p className="text-[11px] text-muted-foreground mt-2">
                  {legalOutputs.acreEligible
                    ? 'Réduction de charges sociale la 1ère année'
                    : 'Augmentez la réduction de charges ou choisissez auto-entrepreneur'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Comparison chart ── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#FFB74D]" />
                Comparaison des charges sociales annuelles
              </CardTitle>
              <InfoPopover text="Comparaison des charges sociales estimées pour chaque statut juridique en fonction de votre CA prévisionnel et de la réduction ACRE." />
            </div>
            <CardDescription>
              Basé sur {formatEur(sim.caPrev)} de CA avec {sim.reductionCharges}% de réduction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chargesChartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k €`} />
                  <YAxis dataKey="name" type="category" width={50} />
                  <Tooltip
                    formatter={(value: number) => [formatEur(value), 'Charges annuelles estimées']}
                  />
                  <Bar dataKey="charges" radius={[0, 6, 6, 0]} barSize={32}>
                    {chargesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ── Selected status detail ── */}
        <Card className="border-[#00838F]/20" style={{ borderColor: `${legalOutputs.statutInfo.color}40` }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${legalOutputs.statutInfo.color}15` }}
              >
                {(() => {
                  const Icon = legalOutputs.statutInfo.icon
                  return <Icon className="h-6 w-6" style={{ color: legalOutputs.statutInfo.color }} />
                })()}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut sélectionné</p>
                <h3 className="text-2xl font-bold" style={{ color: legalOutputs.statutInfo.color }}>
                  {legalOutputs.statutInfo.name}
                </h3>
              </div>
              <Badge className="ml-auto" style={{ backgroundColor: legalOutputs.statutInfo.color, color: 'white' }}>
                Sélectionné
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-[11px] text-muted-foreground mb-1">Capital</p>
                <p className="text-sm font-semibold">{legalOutputs.statutInfo.capital}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-[11px] text-muted-foreground mb-1">Associés</p>
                <p className="text-sm font-semibold">{legalOutputs.statutInfo.associates}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-[11px] text-muted-foreground mb-1">Responsabilité</p>
                <p className="text-sm font-semibold">{legalOutputs.statutInfo.liability}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-[11px] text-muted-foreground mb-1">Régime social</p>
                <p className="text-sm font-semibold">{legalOutputs.statutInfo.social}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Avantages
                </p>
                <ul className="space-y-1">
                  {legalOutputs.statutInfo.advantages.map((a, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <CircleDot className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" /> Points de vigilance
                </p>
                <ul className="space-y-1">
                  {legalOutputs.statutInfo.disadvantages.map((d, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <CircleDot className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Bottom Save Bar ── */}
        <Card className="bg-gradient-to-r from-[#00838F]/5 to-[#FF6B35]/5 border-[#00838F]/20">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="text-sm"
                  style={{ borderColor: legalOutputs.statutInfo.color, color: legalOutputs.statutInfo.color }}
                >
                  {legalOutputs.statutInfo.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatEur(sim.caPrev)} de CA — {sim.associes} associé(s)
                </span>
              </div>
              <Button
                size="sm"
                className="gap-1.5 bg-[#00838F] hover:bg-[#00838F]/90 text-white"
                onClick={handleSaveAndSync}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Enregistrer &amp; synchroniser le BP
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
