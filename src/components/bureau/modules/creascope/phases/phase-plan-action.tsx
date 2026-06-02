'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Rocket,
  Stamp,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  Star,
  ExternalLink,
  Award,
  Clock,
} from 'lucide-react'
import { useCreaScopeStore } from '../creascope-store'
import { useBureauStore } from '@/components/bureau/bureau-store'

// ─── Component ─────────────────────────────────

export function PhasePlanAction() {
  const {
    planAction,
    addActionItem,
    updateActionItem,
    removeActionItem,
    setNextRendezVousNotes,
    setFeedbackScore,
    setFeedbackText,
    completeSession,
  } = useCreaScopeStore()
  const setSection = useBureauStore((s) => s.setSection)
  const setModule = useBureauStore((s) => s.setModule)

  const openModule = (mod: string) => {
    setSection('creascope')
    setModule(mod)
  }

  const handleComplete = () => {
    completeSession()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
            Phase 5
          </Badge>
          <h2 className="text-lg font-semibold text-gray-900">
            Plan d'Action
          </h2>
        </div>
      </div>

      {/* 5.1 — Actions prioritaires */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Rocket className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-400">5.1</span>
              Actions prioritaires
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pl-11 space-y-3">
          <p className="text-sm text-gray-500">
            Définissez les actions concrètes à réaliser après la session. Chaque action
            doit avoir un délai et un responsable identifié.
          </p>

          {/* Action items list */}
          <div className="space-y-2">
            {planAction.actionItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Description de l'action..."
                    value={item.action}
                    onChange={(e) =>
                      updateActionItem(item.id, 'action', e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Calendar className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="date"
                        value={item.deadline}
                        onChange={(e) =>
                          updateActionItem(item.id, 'deadline', e.target.value)
                        }
                        className="h-8 pl-8 text-sm"
                      />
                    </div>
                    <Input
                      placeholder="Responsable"
                      value={item.responsible}
                      onChange={(e) =>
                        updateActionItem(item.id, 'responsible', e.target.value)
                      }
                      className="h-8 flex-1 text-sm"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-1 h-8 w-8 flex-shrink-0 text-gray-400 hover:text-red-500"
                  onClick={() => removeActionItem(item.id)}
                  aria-label="Supprimer l'action"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addActionItem}
            className="border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Ajouter une action
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* 5.2 — Livrables attendus */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Stamp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-400">5.2</span>
              Livrables attendus
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pl-11 space-y-3">
          <p className="text-sm leading-relaxed text-gray-600">
            Identifiez les livrables attendus à la fin du parcours : business plan,
            prévisionnel financier, pitch deck, passeport entrepreneurial, etc. Ouvrez
            le module Passeport pour consulter ou générer les livrables.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModule('passeport')}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <Award className="mr-1.5 h-3.5 w-3.5" />
            Ouvrir Passeport
          </Button>
        </CardContent>
      </Card>

      {/* 5.3 — Prochain rendez-vous */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-400">5.3</span>
              Prochain rendez-vous
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pl-11 space-y-2">
          <p className="text-sm text-gray-500">
            Planifiez le prochain rendez-vous de suivi. Notez la date proposée, les
            points à aborder et les documents à préparer.
          </p>
          <Textarea
            placeholder="Notes sur le prochain rendez-vous..."
            value={planAction.nextRendezVousNotes}
            onChange={(e) => setNextRendezVousNotes(e.target.value)}
            className="min-h-[60px] resize-y"
          />
        </CardContent>
      </Card>

      {/* 5.4 — Passeport Entrepreneurial */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-400">5.4</span>
              Passeport Entrepreneurial
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pl-11 space-y-3">
          <p className="text-sm leading-relaxed text-gray-600">
            Le Passeport Entrepreneurial rassemble les attestations et certifications
            obtenues par le porteur tout au long de son parcours. Générez ou mettez à
            jour le passeport pour le livrer en fin de session.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModule('passeport')}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Ouvrir le Passeport
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* 5.5 — Feedback session */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Star className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-400">5.5</span>
              Feedback session
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pl-11 space-y-3">
          <p className="text-sm text-gray-500">
            Évaluez la satisfaction de la session et recueillez le feedback du porteur.
          </p>

          {/* Star rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() =>
                  setFeedbackScore(planAction.feedbackScore === star ? null : star)
                }
                className="transition-transform hover:scale-110"
                aria-label={`Note ${star}/5`}
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= (planAction.feedbackScore ?? 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            {planAction.feedbackScore && (
              <span className="ml-2 text-sm text-gray-500">
                {planAction.feedbackScore}/5
              </span>
            )}
          </div>

          <Textarea
            placeholder="Commentaires du feedback..."
            value={planAction.feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="min-h-[60px] resize-y"
          />
        </CardContent>
      </Card>

      {/* 5.6 — Clôture */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="flex flex-col items-center gap-3 py-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <p className="text-center text-sm text-gray-600">
            La session CréaScope est terminée. En cliquant sur le bouton ci-dessous,
            la session sera marquée comme complétée et les données seront sauvegardées.
          </p>
          <Button
            onClick={handleComplete}
            className="w-full bg-green-600 text-white hover:bg-green-700"
            size="lg"
          >
            <Stamp className="mr-2 h-5 w-5" />
            Terminer la session
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
