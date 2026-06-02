'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  FileCheck,
  Brain,
  Rocket,
  AlertTriangle,
  Star,
  CheckCircle,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import { useCreaScopeStore, type TremplinDecision } from '../creascope-store'
import { useBureauStore } from '@/components/bureau/bureau-store'

// ─── Tremplin decision config ─────────────────

const TREMPLIN_OPTIONS: {
  value: TremplinDecision
  label: string
  description: string
  color: string
}[] = [
  {
    value: 'GO',
    label: 'GO',
    description: 'Le projet est viable et le porteur est prêt à se lancer.',
    color: 'border-green-500 bg-green-50',
  },
  {
    value: 'GO_CONDITIONNEL',
    label: 'GO Conditionnel',
    description:
      'Le projet est prometteur mais nécessite des actions préalables (formation, financement, etc.).',
    color: 'border-amber-500 bg-amber-50',
  },
  {
    value: 'NO_GO',
    label: 'NO-GO',
    description:
      'Le projet n\'est pas viable dans sa forme actuelle. Réorientation recommandée.',
    color: 'border-red-500 bg-red-50',
  },
]

// ─── Component ─────────────────────────────────

export function PhaseSynthese() {
  const {
    synthese,
    setBilanDiscussion,
    setTremplinDecision,
    setTremplinDiscussion,
    setRecommendations,
    setSynthesisText,
    nextPhase,
  } = useCreaScopeStore()
  const setSection = useBureauStore((s) => s.setSection)
  const setModule = useBureauStore((s) => s.setModule)

  const openModule = (mod: string) => {
    setSection('creascope')
    setModule(mod)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-violet-100 text-violet-800">
            Phase 4
          </Badge>
          <h2 className="text-lg font-semibold text-gray-900">
            Synthèse & Recommandations
          </h2>
        </div>
      </div>

      {/* 4.1 — Bilan IA automatisé */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100">
            <Sparkles className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-400">4.1</span>
              Bilan IA automatisé
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pl-11 space-y-3">
          <p className="text-sm leading-relaxed text-gray-600">
            Générez un bilan automatisé regroupant les résultats de toutes les phases
            : profil créateur, Kiviat, RIASEC, analyse de marché, simulation financière
            et statut juridique. L'IA synthétise les forces et axes d'amélioration.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModule('bilan-ia')}
            className="border-violet-300 text-violet-700 hover:bg-violet-50"
          >
            <Brain className="mr-1.5 h-3.5 w-3.5" />
            Générer le bilan IA
          </Button>
        </CardContent>
      </Card>

      {/* 4.2 — Discussion du bilan */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100">
            <MessageSquare className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-400">4.2</span>
              Discussion du bilan
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pl-11 space-y-2">
          <p className="text-sm text-gray-500">
            Discutez le bilan IA avec le porteur. Notez les réactions, les points de
            désaccord et les ajustements proposés.
          </p>
          <Textarea
            placeholder="Notes de discussion du bilan..."
            value={synthese.bilanDiscussion}
            onChange={(e) => setBilanDiscussion(e.target.value)}
            className="min-h-[80px] resize-y"
          />
        </CardContent>
      </Card>

      {/* 4.3 — Tremplin Go/No-Go */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100">
            <AlertTriangle className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-400">4.3</span>
              Tremplin Go/No-Go
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pl-11 space-y-3">
          <p className="text-sm leading-relaxed text-gray-600">
            Ouvrez l'outil Tremplin pour évaluer la préparation du porteur sur les 8
            dimensions clés : motivation, compétences, marché, finance, réseau,
            planification, résilience et vision.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModule('tremplin')}
            className="border-violet-300 text-violet-700 hover:bg-violet-50"
          >
            <Rocket className="mr-1.5 h-3.5 w-3.5" />
            Ouvrir Tremplin
          </Button>
        </CardContent>
      </Card>

      {/* 4.4 — Tremplin decision */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100">
            <FileCheck className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-400">4.4</span>
              Discussion Tremplin — Décision
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pl-11 space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {TREMPLIN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setTremplinDecision(
                    synthese.tremplinDecision === opt.value ? null : opt.value
                  )
                }
                className={`rounded-lg border-2 p-3 text-left transition-all ${
                  synthese.tremplinDecision === opt.value
                    ? opt.color
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-semibold">{opt.label}</div>
                <p className="mt-1 text-xs text-gray-500">{opt.description}</p>
              </button>
            ))}
          </div>

          {synthese.tremplinDecision && (
            <div className="flex items-center gap-2 rounded-md p-3 text-sm font-medium">
              <Star className="h-4 w-4" />
              Décision enregistrée :
              <Badge
                variant="secondary"
                className={
                  synthese.tremplinDecision === 'GO'
                    ? 'bg-green-100 text-green-800'
                    : synthese.tremplinDecision === 'GO_CONDITIONNEL'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {synthese.tremplinDecision === 'GO_CONDITIONNEL'
                  ? 'GO Conditionnel'
                  : synthese.tremplinDecision}
              </Badge>
            </div>
          )}

          <Textarea
            placeholder="Commentaires sur la décision Tremplin..."
            value={synthese.tremplinDiscussion}
            onChange={(e) => setTremplinDiscussion(e.target.value)}
            className="min-h-[60px] resize-y"
          />
        </CardContent>
      </Card>

      {/* 4.5 — Recommandations */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100">
            <Star className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-400">4.5</span>
              Recommandations personnalisées
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pl-11 space-y-2">
          <p className="text-sm text-gray-500">
            Formulez vos recommandations au porteur : formations, mentors, financements,
            ajustements du projet, prochaines étapes.
          </p>
          <Textarea
            placeholder="Recommandations personnalisées..."
            value={synthese.recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            className="min-h-[80px] resize-y"
          />
        </CardContent>
      </Card>

      {/* 4.6 — Synthèse écrite */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100">
            <FileCheck className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-400">4.6</span>
              Synthèse écrite
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pl-11 space-y-2">
          <p className="text-sm text-gray-500">
            Rédigez la synthèse complète de la session. Ce document sera joint au
            passeport entrepreneurial du porteur.
          </p>
          <Textarea
            placeholder="Synthèse complète de la session CréaScope..."
            value={synthese.synthesis}
            onChange={(e) => setSynthesisText(e.target.value)}
            className="min-h-[120px] resize-y"
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
        Phase 4 terminée — Passer au Plan d'Action
      </Button>
    </div>
  )
}
