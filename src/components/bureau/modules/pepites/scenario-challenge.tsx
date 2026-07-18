'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { SWIPE_QUESTIONS, type SwipeQuestionData } from '@/data/swipe-questions'
import { cn } from '@/lib/utils'
import { DIMENSION_CODES, type QuestionAnswer } from '@/lib/kiviat-scoring'
import { shuffleArray, DIMENSION_COLORS, DIMENSION_LABELS, OPTION_LABELS } from './shared'
import { AudioControls } from '@/components/audio/audio-controls'
import type { MatchOptions } from '@/lib/hooks/useAudioHelper'

// ─── ScenarioChallenge ───────────────────────────

export function ScenarioChallenge({
  onComplete,
  onBack,
}: {
  onComplete: (answers: QuestionAnswer[]) => void
  onBack: () => void
}) {
  const [scenarios] = useState(() => {
    const pool = SWIPE_QUESTIONS.filter((q) => q.type === 'scenario')
    const dimCodes = DIMENSION_CODES
    const selected: SwipeQuestionData[] = []
    const usedCategories = new Set<string>()

    const shuffled = shuffleArray(pool)

    for (const q of shuffled) {
      if (selected.length >= 10) break
      if (!usedCategories.has(q.category) || selected.filter((s) => s.category === q.category).length < 2) {
        selected.push(q)
        usedCategories.add(q.category)
      }
    }

    const remaining = shuffled.filter((q) => !selected.includes(q))
    while (selected.length < 10 && remaining.length > 0) {
      selected.push(remaining.shift()!)
    }

    return selected.slice(0, 10)
  })

  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<QuestionAnswer[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<string | number | undefined>()
  const [showFeedback, setShowFeedback] = useState(false)
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleAnswer = useCallback((val: string | number) => {
    setCurrentAnswer(val)
    setShowFeedback(true)
    // Click-to-advance: auto-advance after showing feedback
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    autoAdvanceRef.current = setTimeout(() => {
      // handleNext logic
      const newAnswers = [...answers]
      if (currentQ < newAnswers.length) {
        newAnswers[currentQ] = {
          questionCode: scenarios[currentQ].code,
          category: scenarios[currentQ].category,
          type: scenarios[currentQ].type,
          value: val,
        }
      } else {
        newAnswers.push({
          questionCode: scenarios[currentQ].code,
          category: scenarios[currentQ].category,
          type: scenarios[currentQ].type,
          value: val,
        })
      }
      setAnswers(newAnswers)
      setShowFeedback(false)
      setCurrentAnswer(undefined)
      if (currentQ < scenarios.length - 1) {
        setCurrentQ((p) => p + 1)
      } else {
        onComplete(newAnswers.length >= scenarios.length ? newAnswers : [...newAnswers])
      }
    }, 1000)
  }, [currentQ, scenarios, answers, onComplete])

  const handleNext = useCallback(() => {
    if (currentAnswer !== undefined) {
      const newAnswers = [...answers]
      if (currentQ < answers.length) {
        newAnswers[currentQ] = {
          questionCode: scenarios[currentQ].code,
          category: scenarios[currentQ].category,
          type: scenarios[currentQ].type,
          value: currentAnswer,
        }
      } else {
        newAnswers.push({
          questionCode: scenarios[currentQ].code,
          category: scenarios[currentQ].category,
          type: scenarios[currentQ].type,
          value: currentAnswer,
        })
      }
      setAnswers(newAnswers)
    }
    setShowFeedback(false)
    setCurrentAnswer(undefined)
    if (currentQ < scenarios.length - 1) {
      setCurrentQ((p) => p + 1)
    } else {
      onComplete(answers.length >= scenarios.length ? answers : [...answers, {
        questionCode: scenarios[currentQ].code,
        category: scenarios[currentQ].category,
        type: scenarios[currentQ].type,
        value: currentAnswer ?? '',
      }])
    }
  }, [currentAnswer, currentQ, scenarios, answers, onComplete])

  const handlePrev = useCallback(() => {
    if (currentQ > 0) {
      setCurrentQ((p) => p - 1)
      const prevAns = answers[currentQ - 1]
      setCurrentAnswer(prevAns?.value)
      setShowFeedback(true)
    }
  }, [currentQ, answers])

  const q = scenarios[currentQ]

  const bestOption = useMemo(() => {
    if (!q || !q.scoring) return -1
    let bestIdx = 0
    let bestScore = 0
    for (const [key, val] of Object.entries(q.scoring)) {
      const idx = OPTION_LABELS.indexOf(key)
      if (idx !== -1 && val > bestScore) {
        bestScore = val
        bestIdx = idx
      }
    }
    return bestIdx
  }, [q])

  if (!q) return null

  const selectedIdx = typeof currentAnswer === 'string' ? OPTION_LABELS.indexOf(currentAnswer) : -1

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Retour
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Challenge Scénario</span>
        <div className="w-16" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <Badge variant="secondary" className={cn('text-xs', DIMENSION_COLORS[q.category])}>
          {DIMENSION_LABELS[q.category]}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Scénario {currentQ + 1}/{scenarios.length}
        </span>
      </div>

      <Progress value={((currentQ + 1) / scenarios.length) * 100} className="h-1.5 mb-6" />

      <AnimatePresence mode="wait">
        <motion.div
          key={q.code}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🎯 Scénario</CardTitle>
              <CardDescription>{q.helpText}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-medium text-sm">{q.question}</p>

              {!showFeedback && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border text-sm transition-all',
                        'hover:border-primary hover:bg-primary/5',
                        selectedIdx === i
                          ? 'border-primary bg-primary/10 font-medium'
                          : 'border-border'
                      )}
                    >
                      <span className="font-mono text-xs text-muted-foreground mr-2">
                        {OPTION_LABELS[i]}.
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {showFeedback && q.options && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <Separator />
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={cn(
                        'p-3 rounded-lg border text-sm',
                        i === bestOption && 'border-emerald-500 bg-emerald-500/10',
                        i === selectedIdx && i !== bestOption && 'border-amber-500 bg-amber-500/10',
                        i !== bestOption && i !== selectedIdx && 'border-border opacity-50'
                      )}
                    >
                      <span className="font-mono text-xs text-muted-foreground mr-2">
                        {OPTION_LABELS[i]}.
                      </span>
                      {opt}
                      {i === bestOption && (
                        <span className="ml-2 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          ✓ Meilleure réponse
                        </span>
                      )}
                      {i === selectedIdx && i !== bestOption && (
                        <span className="ml-2 text-amber-600 dark:text-amber-400 text-xs">
                          Votre réponse
                        </span>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Score : {q.scoring ? (q.scoring[OPTION_LABELS[selectedIdx]] || 0) : '?'} / 4
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={currentQ === 0}>
              ← Précédent
            </Button>
            <Button onClick={handleNext} disabled={!showFeedback}>
              {currentQ < scenarios.length - 1 ? 'Suivant →' : 'Terminer ✓'}
            </Button>
          </div>

          {/* Audio controls — read scenario + voice answer */}
          <div className="flex justify-center mt-2">
            <AudioControls
              readText={`Scénario ${currentQ + 1}. ${q.question}${q.options ? '. ' + q.options.map((o, i) => `${OPTION_LABELS[i]}: ${o}`).join(', ') : ''}`}
              compact
              onVoiceResult={(transcript) => {
                if (q.options) {
                  const upper = transcript.trim().toUpperCase()
                  const letterMatch = OPTION_LABELS.findIndex((l) => l === upper)
                  if (letterMatch >= 0 && letterMatch < q.options.length) {
                    handleAnswer(OPTION_LABELS[letterMatch])
                    return
                  }
                  const numMap: Record<string, number> = { un: 0, une: 0, deux: 1, trois: 2, quatre: 3 }
                  const word = transcript.trim().toLowerCase()
                  for (const [w, idx] of Object.entries(numMap)) {
                    if (word.includes(w) && idx < q.options.length) {
                      handleAnswer(OPTION_LABELS[idx])
                      return
                    }
                  }
                }
              }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
