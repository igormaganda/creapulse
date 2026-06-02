'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip,
} from 'recharts'
import { toast } from 'sonner'
import { KIVIAT_DIMENSIONS } from '@/data/swipe-cards'
import { useAuthStore } from '@/lib/zustand/store'
import { authFetch } from '@/lib/auth-fetch'
import {
  computeSwipeScores, computeQuestionScores, computeCombinedKiviat,
  type SwipeResult, type QuestionAnswer,
} from '@/lib/kiviat-scoring'
import { DIMENSION_CHART_COLORS, type DimensionScore } from './shared'

// ─── ScoreSummary ────────────────────────────────

export function ScoreSummary({
  swipeResults,
  questionAnswers,
  scenarioAnswers,
  onRestart,
  onSave,
}: {
  swipeResults: SwipeResult[]
  questionAnswers: QuestionAnswer[]
  scenarioAnswers: QuestionAnswer[]
  onRestart: () => void
  onSave: () => void
}) {
  const [isSaving, setIsSaving] = useState(false)

  const combinedData = useMemo(() => {
    const swipeScores = swipeResults.length > 0 ? computeSwipeScores(swipeResults) : null
    const qScores = questionAnswers.length > 0 ? computeQuestionScores(questionAnswers) : null

    const scenarioQAnswers: QuestionAnswer[] = scenarioAnswers.map((a) => ({
      ...a,
      type: 'scenario',
    }))
    const sScores = scenarioAnswers.length > 0 ? computeQuestionScores(scenarioQAnswers) : null

    return computeCombinedKiviat(swipeScores, qScores, sScores)
  }, [swipeResults, questionAnswers, scenarioAnswers])

  const radarData = useMemo(
    () =>
      combinedData.map((d) => ({
        dimension: d.dimensionLabel,
        score: d.combinedScore,
        fullName: d.dimensionLabel,
      })),
    [combinedData]
  )

  const dimScores: DimensionScore[] = useMemo(
    () =>
      combinedData.map((d) => {
        const dimMeta = KIVIAT_DIMENSIONS.find((k) => k.code === d.dimension)
        return {
          dimension: d.dimension,
          label: d.dimensionLabel,
          emoji: dimMeta?.emoji ?? '',
          score: d.combinedScore,
          sources: d.sources,
        }
      }),
    [combinedData]
  )

  const globalAvg = Math.round(combinedData.reduce((s, d) => s + d.combinedScore, 0) / combinedData.length)

  const topStrength = useMemo(() => {
    const sorted = [...dimScores].sort((a, b) => b.score - a.score)
    return sorted[0]
  }, [dimScores])

  const areaImprove = useMemo(() => {
    const sorted = [...dimScores].sort((a, b) => a.score - b.score)
    return sorted.slice(0, 2)
  }, [dimScores])

  const sourceLabels: Record<string, string> = {
    swipe: 'Swipe',
    question: 'Questions',
    scenario: 'Scénarios',
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = useAuthStore.getState().token
      if (!token) {
        toast.error('Vous devez être connecté(e) pour sauvegarder')
        return
      }

      if (swipeResults.length > 0) {
        await authFetch('/api/swipe', { method: 'POST', body: JSON.stringify({ results: swipeResults }) })
      }
      if (questionAnswers.length > 0) {
        await authFetch('/api/swipe/questions', {
          method: 'POST',
          body: JSON.stringify({ answers: questionAnswers }),
        })
      }
      if (scenarioAnswers.length > 0) {
        await authFetch('/api/swipe/questions', {
          method: 'POST',
          body: JSON.stringify({ answers: scenarioAnswers }),
        })
      }

      toast.success('Résultats sauvegardés et Kiviat mis à jour !')
      onSave()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onRestart}>
          ← Modes
        </Button>
        <h2 className="font-semibold">Résultats</h2>
        <div className="w-16" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold">{globalAvg}<span className="text-lg text-muted-foreground">/100</span></div>
                <p className="text-sm text-muted-foreground mt-1">Score global</p>
              </div>
              <div className="w-full max-w-sm">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(val: number) => [`${val}/100`, 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {topStrength && (
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <span className="text-2xl">💪</span>
                <div>
                  <p className="text-xs text-muted-foreground">Votre point fort</p>
                  <p className="font-medium text-sm">
                    {topStrength.emoji} {topStrength.label}
                  </p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {topStrength.score}%
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {areaImprove.length > 0 && (
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="text-xs text-muted-foreground">Axes d&apos;amélioration</p>
                  {areaImprove.map((d) => (
                    <p key={d.dimension} className="font-medium text-sm">
                      {d.emoji} {d.label}{' '}
                      <span className="text-amber-600 dark:text-amber-400">({d.score}%)</span>
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Détail par dimension</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dimScores.map((d) => (
              <div key={d.dimension} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{d.emoji}</span>
                    <span className="font-medium">{d.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {d.sources.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {sourceLabels[s] ?? s}
                        </Badge>
                      ))}
                    </div>
                    <span className="font-bold w-10 text-right">{d.score}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: DIMENSION_CHART_COLORS[d.dimension] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${d.score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder et mettre à jour le Kiviat'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onRestart}>
            Recommencer
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
