'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Globe,
  Scale,
  Calculator,
  TrendingUp,
  FlaskConical,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'
import { useCreaScopeStore } from '../creascope-store'
import { useBureauStore } from '@/components/bureau/bureau-store'

// ─── Sub-step definitions ─────────────────────

interface ApproStep {
  number: string
  title: string
  description: string
  icon: React.ReactNode
  module: string
  buttonText: string
  badge?: string
}

const approSteps: ApproStep[] = [
  {
    number: '3.1',
    title: 'Analyse du projet',
    description:
      'Examinez en détail le projet entrepreneurial du porteur : vision, proposition de valeur, secteur d\'activité, stade de maturité. Complétez ou affinez les informations si nécessaire.',
    icon: <Search className="h-5 w-5 text-teal-600" />,
    module: 'mon-projet',
    buttonText: 'Ouvrir Mon Projet',
    badge: 'Vision',
  },
  {
    number: '3.2',
    title: 'Complément RIASEC',
    description:
      'Si le profil RIASEC n\'est pas encore établi, faites passer le test au porteur. Les résultats RIASEC viennent enrichir le diagnostic de personnalité et d\'affinités professionnelles.',
    icon: <FlaskConical className="h-5 w-5 text-teal-600" />,
    module: 'riasec',
    buttonText: 'Ouvrir le test RIASEC',
    badge: 'Profil',
  },
  {
    number: '3.3',
    title: 'Analyse de marché',
    description:
      'Utilisez le simulateur de marché pour évaluer la taille du marché cible, la concurrence, les tendances du secteur et les opportunités de différenciation.',
    icon: <Globe className="h-5 w-5 text-teal-600" />,
    module: 'marche',
    buttonText: 'Ouvrir le simulateur Marché',
    badge: 'Marché',
  },
  {
    number: '3.4',
    title: 'Simulation financière',
    description:
      'Lancez CreaSim pour simuler la viabilité financière du projet : charges, marges, seuil de rentabilité, projections sur 3 ans. Analysez les résultats avec le porteur.',
    icon: <Calculator className="h-5 w-5 text-teal-600" />,
    module: 'creasim',
    buttonText: 'Ouvrir CreaSim',
    badge: 'Finance',
  },
  {
    number: '3.5',
    title: 'Statut juridique',
    description:
      'Aidez le porteur à choisir le statut juridique adapté à son projet : SAS, SARL, EURL, auto-entrepreneur, SASU. Comparez les charges sociales, la fiscalité et les avantages de chaque forme.',
    icon: <Scale className="h-5 w-5 text-teal-600" />,
    module: 'juridique',
    buttonText: 'Ouvrir Juridique',
    badge: 'Juridique',
  },
]

// ─── Component ─────────────────────────────────

export function PhaseApprofondissement() {
  const {
    approfondissement,
    setApprofondissementNotes,
    nextPhase,
  } = useCreaScopeStore()
  const setSection = useBureauStore((s) => s.setSection)
  const setModule = useBureauStore((s) => s.setModule)

  const openModule = (module: string) => {
    setSection('creascope')
    setModule(module)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-sky-100 text-sky-800">
            Phase 3
          </Badge>
          <h2 className="text-lg font-semibold text-gray-900">
            Approfondissement
          </h2>
        </div>
      </div>

      {/* Navigation note */}
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Chaque outil s'ouvre dans un nouvel onglet du module CréaScope. Revenez
          ici pour continuer l'approfondissement une fois l'analyse terminée.
        </span>
      </div>

      {/* Sub-step cards */}
      <div className="space-y-3">
        {approSteps.map((step) => (
          <Card key={step.number} className="border-gray-200 hover:border-sky-200 transition-colors">
            <CardHeader className="flex flex-row items-start gap-3 pb-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100">
                {step.icon}
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-gray-400">{step.number}</span>
                  {step.title}
                  {step.badge && (
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {step.badge}
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pl-11 space-y-3">
              <p className="text-sm leading-relaxed text-gray-600">
                {step.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openModule(step.module)}
                className="border-sky-300 text-sky-700 hover:bg-sky-50"
              >
                <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                {step.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* 3.6 — Notes et observations */}
      <Card className="border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-gray-400">3.6</span>
            Notes et observations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-gray-500">
            Consignez ici vos observations globales sur l'approfondissement :
            points forts, alertes, axes à creuser, convergences avec le diagnostic.
          </p>
          <Textarea
            placeholder="Observations d'approfondissement..."
            value={approfondissement.notes}
            onChange={(e) => setApprofondissementNotes(e.target.value)}
            className="min-h-[100px] resize-y"
          />
        </CardContent>
      </Card>

      {/* Next phase */}
      <Button
        onClick={nextPhase}
        className="w-full bg-green-600 text-white hover:bg-green-700"
        size="lg"
      >
        <CheckCircle className="mr-2 h-5 w-5" />
        Phase 3 terminée — Passer à la Synthèse
      </Button>
    </div>
  )
}
