'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sparkles,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Target,
  AlertTriangle,
} from 'lucide-react'
import { useCreaScopeStore } from '../creascope-store'
import { useBureauStore } from '@/components/bureau/bureau-store'
import { useTradEmploi } from '@/components/trad-emploi/voice-context'

// ─── Kiviat dimensions ────────────────────────

const KIVIAT_DIMENSIONS = [
  { key: 'leadership', label: 'Leadership', color: 'bg-teal-500' },
  { key: 'stress', label: 'Gestion du stress', color: 'bg-coral-500' },
  { key: 'communication', label: 'Communication', color: 'bg-amber-500' },
  { key: 'resolution', label: 'Résolution de problèmes', color: 'bg-emerald-500' },
  { key: 'creativity', label: 'Créativité', color: 'bg-violet-500' },
  { key: 'adaptability', label: 'Adaptabilité', color: 'bg-sky-500' },
]

// ─── Component ─────────────────────────────────

export function PhaseDecouverte() {
  const {
    decouverte,
    setSwipeCompleted,
    setDecouverteObservations,
    nextPhase,
  } = useCreaScopeStore()
  const setSection = useBureauStore((s) => s.setSection)
  const setModule = useBureauStore((s) => s.setModule)
  const { setContext: setVoiceContext } = useTradEmploi()

  // Set voice context for discovery phase
  useEffect(() => {
    setVoiceContext({ module: 'creascope', section: 'Découverte (Pépites)' })
  }, [setVoiceContext])

  const hasScores = decouverte.kiviatScores.length > 0
  const maxScore = 10

  const openSwipeGame = () => {
    setSection('creascope')
    setModule('creascope-swipe')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            Phase 2
          </Badge>
          <h2 className="text-lg font-semibold text-gray-900">
            Découverte (Pépites)
          </h2>
        </div>
      </div>

      <Tabs defaultValue="swipe" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="swipe">Jeu de Cartes Pépites</TabsTrigger>
          <TabsTrigger value="kiviat">Résultats Kiviat</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Jeu de Cartes Pépites ── */}
        <TabsContent value="swipe" className="space-y-4 pt-4">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-amber-600" />
                Lancez le Jeu de Pépites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-gray-700">
                Le Jeu de Pépites permet d'identifier les soft skills du porteur de
                projet à travers un jeu de cartes interactif. Chaque carte représente
                une compétence clé pour la création d'entreprise. Le porteur swipe les
                cartes selon son ressenti, et les résultats alimentent un radar Kiviat
                en 6 dimensions.
              </p>

              {/* Info badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  <Target className="mr-1 h-3 w-3" />
                  60 cartes
                </Badge>
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  <Brain className="mr-1 h-3 w-3" />
                  6 dimensions
                </Badge>
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  <BarChart3 className="mr-1 h-3 w-3" />
                  ~35 min
                </Badge>
              </div>

              <Button
                onClick={openSwipeGame}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Ouvrir le Jeu Pépites
              </Button>

              {decouverte.swipeCompleted && (
                <div className="flex items-center gap-2 rounded-md bg-green-100 p-3 text-sm text-green-800">
                  <ThumbsUp className="h-4 w-4" />
                  Jeu terminé — Consultez les résultats dans l'onglet « Résultats Kiviat »
                </div>
              )}
            </CardContent>
          </Card>

          {/* Counselor observations */}
          <Card className="border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 text-gray-500" />
                Observations du conseiller
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observations pendant le jeu de cartes : réactions du porteur, cartes hésitantes, dynamique..."
                value={decouverte.observations}
                onChange={(e) => setDecouverteObservations(e.target.value)}
                className="min-h-[80px] resize-y"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Résultats Kiviat ── */}
        <TabsContent value="kiviat" className="space-y-4 pt-4">
          {!hasScores ? (
            <Card className="border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="mb-4 h-12 w-12 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">
                  Complétez le Jeu de Pépites pour voir les résultats
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Les scores apparaîtront ici sous forme de graphique en barres
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Bar chart */}
              <Card className="border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <BarChart3 className="h-4 w-4 text-teal-600" />
                    Radar Kiviat — Scores par dimension
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {KIVIAT_DIMENSIONS.map((dim) => {
                    const scoreEntry = decouverte.kiviatScores.find(
                      (s) => s.dimension === dim.key
                    )
                    const score = scoreEntry?.score ?? 0
                    const pct = (score / maxScore) * 100

                    return (
                      <div key={dim.key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            {dim.label}
                          </span>
                          <span className="text-gray-500">
                            {score.toFixed(1)}/{maxScore}
                          </span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-gray-100">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              pct >= 70
                                ? 'bg-green-500'
                                : pct >= 40
                                ? 'bg-amber-500'
                                : 'bg-red-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Average score */}
              <Card className="border-teal-200 bg-teal-50/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-teal-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Score moyen global
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-teal-100 text-lg font-bold text-teal-800"
                  >
                    {(
                      decouverte.kiviatScores.reduce(
                        (sum, s) => sum + s.score,
                        0
                      ) / Math.max(decouverte.kiviatScores.length, 1)
                    ).toFixed(1)}
                    <span className="ml-1 text-xs font-normal text-teal-600">
                      /{maxScore}
                    </span>
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Next phase */}
      {decouverte.swipeCompleted && (
        <Button
          onClick={nextPhase}
          className="w-full bg-green-600 text-white hover:bg-green-700"
          size="lg"
        >
          Phase 2 terminée — Passer à l'Approfondissement
        </Button>
      )}
    </div>
  )
}
