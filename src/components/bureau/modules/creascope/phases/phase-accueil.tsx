'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Handshake,
  User,
  Lightbulb,
  Eye,
  FileCheck,
  CheckCircle,
  MessageSquare,
} from 'lucide-react'
import { useCreaScopeStore } from '../creascope-store'

// ─── Step definitions ─────────────────────────

interface AccueilStep {
  key: string
  number: string
  title: string
  description: string
  icon: React.ReactNode
}

const steps: AccueilStep[] = [
  {
    key: 'accueilPorteur',
    number: '1.1',
    title: 'Accueil du porteur',
    description:
      'Accueillir chaleureusement le porteur de projet. Instaurer un climat de confiance, présenter votre rôle de conseiller et rappeler les objectifs de la séance.',
    icon: <Handshake className="h-5 w-5 text-teal-600" />,
  },
  {
    key: 'verificationProfil',
    number: '1.2',
    title: 'Vérification profil créateur',
    description:
      'Vérifier les informations du profil créateur : statut administratif, parcours, compétences, motivations. Identifier les éventuelles mises à jour nécessaires.',
    icon: <User className="h-5 w-5 text-teal-600" />,
  },
  {
    key: 'presentationProjet',
    number: '1.3',
    title: 'Présentation du projet',
    description:
      'Inviter le porteur à présenter son projet de création d\'entreprise en quelques minutes. Noter les éléments clés : secteur, cible, proposition de valeur, stade d\'avancement.',
    icon: <Lightbulb className="h-5 w-5 text-teal-600" />,
  },
  {
    key: 'expliquerDeroule',
    number: '1.4',
    title: 'Expliquer le déroulé CréaScope',
    description:
      'Présenter les 5 phases du diagnostic CréaScope : Accueil → Découverte (Pépites) → Approfondissement → Synthèse → Plan d\'Action. Durée estimée : 3h à 4h15. Expliquer que chaque outil s\'ouvre dans un module dédié.',
    icon: <Eye className="h-5 w-5 text-teal-600" />,
  },
  {
    key: 'lancerSession',
    number: '1.5',
    title: 'Lancer la session',
    description:
      'Confirmer que le porteur est prêt à démarrer le diagnostic. Vérifier le temps disponible et les éventuelles contraintes. Lancer le chronomètre de la session.',
    icon: <FileCheck className="h-5 w-5 text-teal-600" />,
  },
]

// ─── Component ─────────────────────────────────

export function PhaseAccueil() {
  const {
    accueil,
    toggleAccueilStep,
    setAccueilNotes,
    nextPhase,
  } = useCreaScopeStore()

  const allChecked = Object.values(accueil.steps).every(Boolean)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-teal-100 text-teal-800">
            Phase 1
          </Badge>
          <h2 className="text-lg font-semibold text-gray-900">
            Accueil & Acculturation
          </h2>
        </div>
        <span className="text-sm text-gray-500">
          {Object.values(accueil.steps).filter(Boolean).length}/{steps.length} étapes
        </span>
      </div>

      {/* Step cards */}
      <div className="space-y-3">
        {steps.map((step) => {
          const isChecked = accueil.steps[step.key as keyof typeof accueil.steps]
          return (
            <Card
              key={step.key}
              className={`transition-all duration-200 ${
                isChecked
                  ? 'border-green-200 bg-green-50/50'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <CardHeader className="flex flex-row items-start gap-3 pb-2">
                <button
                  type="button"
                  onClick={() => toggleAccueilStep(step.key as keyof typeof accueil.steps)}
                  className={`mt-0.5 flex-shrink-0 rounded-full border-2 transition-colors ${
                    isChecked
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 hover:border-teal-400'
                  }`}
                  aria-label={`Cocher ${step.title}`}
                >
                  {isChecked ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center text-xs font-bold text-gray-400">
                      {step.number.split('.')[1]}
                    </span>
                  )}
                </button>
                <div className="flex-1 space-y-1">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-gray-400">{step.number}</span>
                    {step.icon}
                    {step.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pl-10">
                <p className="text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Launch button */}
      {accueil.steps.lancerSession && (
        <Button
          onClick={() => toggleAccueilStep('lancerSession')}
          className="w-full bg-teal-600 hover:bg-teal-700"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Prêt à démarrer
        </Button>
      )}

      {/* Notes */}
      <Card className="border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            Notes du conseiller — Accueil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Saisissez vos observations sur l'accueil et le profil du porteur..."
            value={accueil.notes}
            onChange={(e) => setAccueilNotes(e.target.value)}
            className="min-h-[80px] resize-y"
          />
        </CardContent>
      </Card>

      {/* Next phase button */}
      {allChecked && (
        <Button
          onClick={nextPhase}
          className="w-full bg-green-600 text-white hover:bg-green-700"
          size="lg"
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          Phase 1 terminée — Passer à la Découverte
        </Button>
      )}
    </div>
  )
}
