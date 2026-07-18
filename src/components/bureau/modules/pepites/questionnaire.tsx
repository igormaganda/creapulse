'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { SWIPE_QUESTIONS, type SwipeQuestionData } from '@/data/swipe-questions'
import { cn } from '@/lib/utils'
import type { QuestionAnswer } from '@/lib/kiviat-scoring'
import { shuffleArray, DIMENSION_COLORS, DIMENSION_LABELS, OPTION_LABELS } from './shared'
import { AudioControls } from '@/components/audio/audio-controls'
import type { MatchOptions } from '@/lib/hooks/useAudioHelper'

// ─── QuestionCard ────────────────────────────────

function QuestionCard({
  question,
  index,
  total,
  answer,
  onAnswer,
  onNext,
  onPrev,
  canPrev,
  canNext,
}: {
  question: SwipeQuestionData
  index: number
  total: number
  answer: string | number | undefined
  onAnswer: (val: string | number) => void
  onNext: () => void
  onPrev: () => void
  canPrev: boolean
  canNext: boolean
}) {
  const [openText, setOpenText] = useState('')
  const [ranking, setRanking] = useState<number[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSubmit = () => {
    if (question.type === 'open') {
      if (openText.trim().length < 20) {
        toast.error('Minimum 20 caractères requis')
        return
      }
      onAnswer(openText.trim())
    } else if (question.type === 'ranking') {
      if (ranking.length !== (question.options?.length ?? 0)) {
        toast.error('Classez tous les éléments')
        return
      }
      onAnswer(ranking.join(','))
    }
    setShowFeedback(true)
  }

  const handleChoiceSelect = (optionIndex: number) => {
    const letter = OPTION_LABELS[optionIndex]
    onAnswer(letter)
    setShowFeedback(true)
    // Click-to-advance: auto-advance after showing feedback
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    autoAdvanceRef.current = setTimeout(() => {
      onNext()
    }, 800)
  }

  const bestOption = useMemo(() => {
    if (!question.scoring) return -1
    let bestIdx = 0
    let bestScore = 0
    for (const [key, val] of Object.entries(question.scoring)) {
      const idx = OPTION_LABELS.indexOf(key)
      if (idx !== -1 && val > bestScore) {
        bestScore = val
        bestIdx = idx
      }
    }
    return bestIdx
  }, [question.scoring])

  const selectedIdx = typeof answer === 'string' ? OPTION_LABELS.indexOf(answer) : -1

  return (
    <motion.div
      key={question.code}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between mb-4">
        <Badge variant="secondary" className={cn('text-xs', DIMENSION_COLORS[question.category])}>
          {DIMENSION_LABELS[question.category]}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {index + 1}/{total}
        </span>
      </div>

      <Progress value={((index + 1) / total) * 100} className="h-1.5 mb-6" />

      <Card className="mb-6">
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-base mb-1">{question.question}</h3>
            {question.helpText && (
              <p className="text-xs text-muted-foreground">{question.helpText}</p>
            )}
          </div>

          {!showFeedback && (
            <div className="space-y-3">
              {question.type === 'scale' && (
                <div className="space-y-3">
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[(answer as number) || 3]}
                    onValueChange={(v) => onAnswer(v[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Pas du tout</span>
                    <span className="font-medium text-base text-primary">{(answer as number) || 3}</span>
                    <span>Tout à fait</span>
                  </div>
                </div>
              )}

              {(question.type === 'choice' || question.type === 'behavioral' || question.type === 'scenario') &&
                question.options && (
                  <div className="space-y-2">
                    {question.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleChoiceSelect(i)}
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

              {question.type === 'ranking' && question.options && (
                <div className="space-y-2">
                  {ranking.map((itemIdx, rank) => (
                    <div
                      key={rank}
                      className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
                    >
                      <span className="text-xs font-bold w-6 text-center text-primary">{rank + 1}</span>
                      <span className="flex-1 text-sm">{question.options![itemIdx]}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            if (rank > 0) {
                              const n = [...ranking]
                              ;[n[rank], n[rank - 1]] = [n[rank - 1], n[rank]]
                              setRanking(n)
                            }
                          }}
                          className="p-1 rounded hover:bg-background"
                          disabled={rank === 0}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => {
                            if (rank < ranking.length - 1) {
                              const n = [...ranking]
                              ;[n[rank], n[rank + 1]] = [n[rank + 1], n[rank]]
                              setRanking(n)
                            }
                          }}
                          className="p-1 rounded hover:bg-background"
                          disabled={rank === ranking.length - 1}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                  {ranking.length < (question.options?.length ?? 0) && (
                    <div className="flex flex-wrap gap-2">
                      {question.options
                        ?.filter((_, i) => !ranking.includes(i))
                        .map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => setRanking([...ranking, i])}
                            className="text-xs px-3 py-1.5 rounded-full border hover:bg-primary/5 transition-colors"
                          >
                            + {opt.slice(0, 30)}...
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {question.type === 'open' && (
                <Textarea
                  value={openText}
                  onChange={(e) => setOpenText(e.target.value)}
                  placeholder="Décrivez votre expérience..."
                  rows={4}
                />
              )}

              {(question.type === 'ranking' || question.type === 'open') && (
                <Button onClick={handleSubmit} className="w-full">
                  Valider
                </Button>
              )}
            </div>
          )}

          {showFeedback && (question.type === 'choice' || question.type === 'scenario' || question.type === 'behavioral') &&
            question.scoring && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <Separator />
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {selectedIdx === bestOption ? (
                      <span className="text-emerald-600 dark:text-emerald-400">✓ Excellente réponse !</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">
                        Réponse idéale : {OPTION_LABELS[bestOption]}
                      </span>
                    )}
                  </span>
                </div>
              </motion.div>
            )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={!canPrev}>
          ← Précédent
        </Button>
        <Button onClick={onNext} disabled={!canNext}>
          Suivant →
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Questionnaire ───────────────────────────────

const QUESTIONNAIRE_COUNT = 15
const WEAK_QUESTIONNAIRE_COUNT = 7
const OTHER_QUESTIONNAIRE_COUNT = 8

export function Questionnaire({
  onComplete,
  onBack,
  weakDimensions,
}: {
  onComplete: (answers: QuestionAnswer[]) => void
  onBack: () => void
  weakDimensions?: string[]
}) {
  const [questions] = useState(() => {
    let pool = shuffleArray([...SWIPE_QUESTIONS])

    if (weakDimensions && weakDimensions.length > 0) {
      const weakQ = pool.filter((q) => weakDimensions.includes(q.category))
      const otherQ = pool.filter((q) => !weakDimensions.includes(q.category))
      const extraWeak = shuffleArray(weakQ).slice(0, WEAK_QUESTIONNAIRE_COUNT)
      const extraOther = shuffleArray(otherQ).slice(0, QUESTIONNAIRE_COUNT - extraWeak.length)
      pool = shuffleArray([...extraWeak, ...extraOther])
    } else {
      pool = pool.slice(0, QUESTIONNAIRE_COUNT)
    }

    return pool
  })

  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Map<string, { answer: string | number; q: SwipeQuestionData }>>(new Map())
  const currentAnswer = answers.get(questions[currentQ]?.code)?.answer

  const handleAnswer = useCallback((val: string | number) => {
    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(questions[currentQ].code, { answer: val, q: questions[currentQ] })
      return next
    })
  }, [currentQ, questions])

  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((p) => p + 1)
    } else {
      setAnswers((prev) => {
        const finalAnswers: QuestionAnswer[] = Array.from(prev.entries()).map(([code, { answer, q }]) => ({
          questionCode: code,
          category: q.category,
          type: q.type,
          value: answer,
        }))
        onComplete(finalAnswers)
        return prev
      })
    }
  }, [currentQ, questions.length, onComplete])

  const handlePrev = useCallback(() => {
    if (currentQ > 0) setCurrentQ((p) => p - 1)
  }, [currentQ])

  const q = questions[currentQ]
  if (!q) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Retour
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Questionnaire</span>
        <div className="w-16" />
      </div>

      <AnimatePresence mode="wait">
        <QuestionCard
          key={q.code}
          question={q}
          index={currentQ}
          total={questions.length}
          answer={currentAnswer}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onPrev={handlePrev}
          canPrev={currentQ > 0}
          canNext={currentAnswer !== undefined}
        />
      </AnimatePresence>

      {/* Audio controls — read question + voice answer */}
      <div className="flex justify-center mt-2">
        <AudioControls
          readText={`Question ${currentQ + 1}. ${q.question}`}
          compact
          onVoiceResult={(transcript) => {
            if (q.type === 'scale') {
              const num = parseInt(transcript, 10)
              if (num >= 1 && num <= 5) { handleAnswer(num); return }
            }
            if ((q.type === 'choice' || q.type === 'behavioral' || q.type === 'scenario') && q.options) {
              const upper = transcript.trim().toUpperCase()
              const letterMatch = OPTION_LABELS.findIndex((l) => l === upper)
              if (letterMatch >= 0 && letterMatch < q.options.length) {
                handleAnswer(OPTION_LABELS[letterMatch]); return
              }
              const numMap: Record<string, number> = { un: 0, une: 0, deux: 1, trois: 2, quatre: 3, cinq: 4, six: 5, sept: 6 }
              const word = transcript.trim().toLowerCase()
              for (const [w, idx] of Object.entries(numMap)) {
                if (word.includes(w) && idx < q.options.length) { handleAnswer(OPTION_LABELS[idx]); return }
              }
            }
            if (q.type === 'open' && transcript.length >= 20) { handleAnswer(transcript) }
          }}
        />
      </div>
    </div>
  )
}
