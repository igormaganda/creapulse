'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip,
} from 'recharts'
import { toast } from 'sonner'
import { SWIPE_CARDS, KIVIAT_DIMENSIONS, type SwipeCardData } from '@/data/swipe-cards'
import { SWIPE_QUESTIONS, type SwipeQuestionData } from '@/data/swipe-questions'
import { useAuthStore } from '@/lib/zustand/store'
import { cn } from '@/lib/utils'
import {
  computeSwipeScores, computeQuestionScores, computeCombinedKiviat,
  type SwipeResult, type QuestionAnswer, DIMENSION_CODES,
} from '@/lib/kiviat-scoring'

// ─── Types ───────────────────────────────────────

type GameMode = 'select' | 'swipe' | 'questionnaire' | 'scenario' | 'bilan' | 'results'
type SwipeAction = 'pass' | 'pepite' | 'superPepite'

interface DimensionScore {
  dimension: string
  label: string
  emoji: string
  score: number
  sources: string[]
}

// ─── Constants ───────────────────────────────────

const DIMENSION_COLORS: Record<string, string> = {
  leadership: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  stress: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  communication: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  resolution: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  creativity: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  adaptability: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const DIMENSION_CHART_COLORS: Record<string, string> = {
  leadership: '#f59e0b',
  stress: '#0ea5e9',
  communication: '#8b5cf6',
  resolution: '#f43f5e',
  creativity: '#14b8a6',
  adaptability: '#10b981',
}

const DIMENSION_LABELS: Record<string, string> = {
  leadership: 'Leadership & Vision',
  stress: 'Gestion du stress',
  communication: 'Communication',
  resolution: 'Résolution de problèmes',
  creativity: 'Créativité & Innovation',
  adaptability: 'Adaptabilité',
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

const MODE_CONFIG = [
  {
    mode: 'swipe' as const,
    icon: '⚡',
    title: 'Flash Swipe',
    description: '60 cartes à swipper rapidement pour identifier vos soft skills',
    duration: '5-8 min',
    badge: 'Recommandé',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    mode: 'questionnaire' as const,
    icon: '📋',
    title: 'Questionnaire Approfondi',
    description: '50 questions adaptatives pour affiner votre profil',
    duration: '15-20 min',
    badge: null,
    badgeColor: '',
  },
  {
    mode: 'scenario' as const,
    icon: '🎯',
    title: 'Challenge Scénario',
    description: '10 scénarios entrepreneuriaux réalistes',
    duration: '10-15 min',
    badge: null,
    badgeColor: '',
  },
  {
    mode: 'bilan' as const,
    icon: '🏆',
    title: 'Bilan Complet',
    description: 'Les 3 modes séquentiels pour un profil complet',
    duration: '35-45 min',
    badge: 'Complet',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
]

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── ModeSelector ────────────────────────────────

function ModeSelector({ onSelect }: { onSelect: (mode: GameMode) => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Pépites Game
        </motion.h2>
        <p className="text-muted-foreground text-lg">
          Identifiez vos compétences entrepreneuriales
        </p>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          Découvrez vos soft skills à travers 4 modes de jeu interactifs. Swippez des cartes, répondez
          à des questions, analysez des scénarios réalistes et obtenez un profil complet de vos
          compétences entrepreneuriales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {MODE_CONFIG.map((m, i) => (
          <motion.div
            key={m.mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
              onClick={() => onSelect(m.mode)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{m.icon}</span>
                  {m.badge && (
                    <Badge variant="secondary" className={cn('text-xs', m.badgeColor)}>
                      {m.badge}
                    </Badge>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                </div>
                <p className="text-xs text-muted-foreground">{m.duration}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── FlashSwipe ──────────────────────────────────

function FlashSwipe({
  onComplete,
  onBack,
}: {
  onComplete: (results: SwipeResult[]) => void
  onBack: () => void
}) {
  const [deck] = useState(() => shuffleArray(SWIPE_CARDS))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<SwipeResult[]>([])
  const [direction, setDirection] = useState<SwipeAction | null>(null)
  const [showConfidence, setShowConfidence] = useState(false)
  const [currentConfidence, setCurrentConfidence] = useState(3)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const opacityPass = useTransform(x, [-150, -50], [1, 0])
  const opacityPepite = useTransform(x, [50, 150], [0, 1])
  const scalePass = useTransform(x, [-150, -50], [1.2, 1])
  const scalePepite = useTransform(x, [50, 150], [1, 1.2])

  const lastTapRef = useRef(0)

  const saveSwipeBatch = useCallback(
    async (batch: SwipeResult[]) => {
      if (batch.length === 0) return
      try {
        await fetch('/api/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAuthStore.getState().token}` },
          body: JSON.stringify({ results: batch }),
        })
      } catch {
        // silent save
      }
    },
    []
  )

  const processSwipe = useCallback(
    (action: SwipeAction) => {
      if (isAnimating || currentIndex >= deck.length) return
      const card = deck[currentIndex]
      const kept = action === 'pepite' || action === 'superPepite'
      const result: SwipeResult = {
        cardCode: card.code,
        cardTitle: card.title,
        kept,
        superPepite: action === 'superPepite',
        confidence: kept ? currentConfidence : undefined,
      }
      const newResults = [...results, result]
      setResults(newResults)
      setIsAnimating(true)
      setDirection(action)
      setShowConfidence(false)

      if ((newResults.length % 10 === 0) || currentIndex === deck.length - 1) {
        saveSwipeBatch(newResults.slice(-10))
      }

      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setIsAnimating(false)
        setDirection(null)
        if (currentIndex + 1 >= deck.length) {
          setIsComplete(true)
        }
      }, 350)
    },
    [isAnimating, currentIndex, deck, results, currentConfidence, saveSwipeBatch]
  )

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) > 120) {
        processSwipe(info.offset.x > 0 ? 'pepite' : 'pass')
      }
    },
    [processSwipe]
  )

  const handleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      processSwipe('superPepite')
      lastTapRef.current = 0
    } else {
      lastTapRef.current = now
    }
  }, [processSwipe])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') processSwipe('pass')
      if (e.key === 'ArrowRight') processSwipe('pepite')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [processSwipe])

  const currentCard = deck[currentIndex]
  const progress = deck.length > 0 ? (currentIndex / deck.length) * 100 : 0

  if (isComplete) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center py-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold">Swipe terminé !</h2>
        <p className="text-muted-foreground">
          Vous avez swippé {results.length} cartes — {results.filter((r) => r.kept).length} pépites
          dont {results.filter((r) => r.superPepite).length} super pépites.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onBack}>
            Retour
          </Button>
          <Button onClick={() => onComplete(results)}>Voir les résultats</Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Retour
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          {currentIndex + 1}/{deck.length} cartes
        </span>
        <div className="w-16" />
      </div>

      <Progress value={progress} className="h-2" />

      <div className="relative flex items-center justify-center" style={{ height: 420 }}>
        {currentIndex < deck.length && (
          <>
            {[2, 1].map(
              (offset) =>
                currentIndex + offset < deck.length && (
                  <motion.div
                    key={`bg-${currentIndex + offset}`}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ scale: 1 - offset * 0.04, y: offset * 8 }}
                    animate={{ scale: 1 - offset * 0.04, y: offset * 8, opacity: 0.4 / offset }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="w-full max-w-xs h-80 rounded-2xl bg-muted/50 border" />
                  </motion.div>
                )
            )}

            <AnimatePresence mode="popLayout">
              {!isAnimating && currentCard && (
                <motion.div
                  key={currentCard.code}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{
                    x: direction === 'pass' ? -300 : direction === 'superPepite' ? 0 : 300,
                    rotate: direction === 'pass' ? -20 : direction === 'superPepite' ? 0 : 20,
                    opacity: 0,
                    scale: direction === 'superPepite' ? 1.1 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    style={{ x, rotate }}
                    onDragEnd={handleDragEnd}
                    onTap={handleTap}
                    whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
                    className="touch-none"
                  >
                    <Card className="w-full max-w-xs h-80 rounded-2xl shadow-xl overflow-hidden relative bg-card">
                      <CardContent className="p-5 flex flex-col h-full relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', DIMENSION_COLORS[currentCard.category])}
                          >
                            {KIVIAT_DIMENSIONS.find((d) => d.code === currentCard.category)?.label}
                          </Badge>
                          <div className="flex gap-0.5">
                            {Array.from({ length: currentCard.difficulty }).map((_, i) => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-amber-400"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                          <span className="text-5xl">{currentCard.icon}</span>
                          <h3 className="font-bold text-lg">{currentCard.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-4">
                            {currentCard.description}
                          </p>
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
                          <span>← Pass</span>
                          <span>Pépite →</span>
                        </div>
                      </CardContent>

                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-red-500/20 z-20 pointer-events-none flex items-center justify-center"
                        style={{ opacity: opacityPass, scale: scalePass }}
                      >
                        <span className="text-4xl font-bold text-red-600 dark:text-red-400 rotate-[-12deg]">
                          PASS ✕
                        </span>
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-emerald-500/20 z-20 pointer-events-none flex items-center justify-center"
                        style={{ opacity: opacityPepite, scale: scalePepite }}
                      >
                        <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 rotate-[12deg]">
                          ✓ PÉPITE
                        </span>
                      </motion.div>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => processSwipe('pass')}
          disabled={isAnimating || currentIndex >= deck.length}
          className="gap-2"
        >
          <span className="text-red-500">✕</span> Pass
        </Button>
        <Button
          size="lg"
          onClick={() => processSwipe('pepite')}
          disabled={isAnimating || currentIndex >= deck.length}
          className="gap-2"
        >
          Pépite <span className="text-emerald-400">✓</span>
        </Button>
      </div>

      {showConfidence && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-sm text-muted-foreground">Confiance en cette compétence :</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setCurrentConfidence(v)}
                className={cn(
                  'text-2xl transition-transform hover:scale-110',
                  v <= currentConfidence ? 'opacity-100' : 'opacity-30'
                )}
              >
                ⭐
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Double tap = Super Pépite · Flèches clavier · Glissez la carte
      </p>
    </div>
  )
}

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

function Questionnaire({
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
      const extraWeak = shuffleArray(weakQ).slice(0, 25)
      const extraOther = shuffleArray(otherQ).slice(0, 50 - extraWeak.length)
      pool = shuffleArray([...extraWeak, ...extraOther])
    } else {
      pool = pool.slice(0, 50)
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
    </div>
  )
}

// ─── ScenarioChallenge ───────────────────────────

function ScenarioChallenge({
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

  const handleAnswer = useCallback((val: string | number) => {
    setCurrentAnswer(val)
    setShowFeedback(true)
  }, [])

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
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── BilanComplet ────────────────────────────────

type BilanPhase = 'intro' | 'swipe' | 'intermediate' | 'questionnaire' | 'scenario' | 'final'

function BilanComplet({
  onComplete,
  onBack,
}: {
  onComplete: (swipeResults: SwipeResult[], questionAnswers: QuestionAnswer[], scenarioAnswers: QuestionAnswer[]) => void
  onBack: () => void
}) {
  const [phase, setPhase] = useState<BilanPhase>('intro')
  const [swipeResults, setSwipeResults] = useState<SwipeResult[]>([])
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([])
  const [scenarioAnswers, setScenarioAnswers] = useState<QuestionAnswer[]>([])

  const weakDimensions = useMemo(() => {
    if (swipeResults.length === 0) return undefined
    const scores = computeSwipeScores(swipeResults)
    const entries = Object.entries(scores).sort(([, a], [, b]) => a - b)
    return entries.slice(0, 3).map(([dim]) => dim)
  }, [swipeResults])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Retour
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Bilan Complet</span>
        <div className="w-16" />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6 py-12"
          >
            <div className="text-6xl">🏆</div>
            <h2 className="text-2xl font-bold">Bilan Complet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Vous allez passer 3 épreuves successives pour obtenir un profil entrepreneurial complet :
            </p>
            <div className="max-w-md mx-auto space-y-3">
              {[
                { step: 1, title: 'Flash Swipe', desc: '60 cartes à swipper', icon: '⚡' },
                { step: 2, title: 'Questionnaire', desc: '50 questions adaptatives', icon: '📋' },
                { step: 3, title: 'Challenge Scénario', desc: '10 scénarios réalistes', icon: '🎯' },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <span className="text-2xl">{s.icon}</span>
                  <div className="text-left">
                    <p className="font-medium text-sm">
                      Étape {s.step} : {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button size="lg" onClick={() => setPhase('swipe')}>
              Commencer le bilan →
            </Button>
          </motion.div>
        )}

        {phase === 'swipe' && (
          <motion.div key="swipe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FlashSwipe
              onComplete={(results) => {
                setSwipeResults(results)
                setPhase('intermediate')
              }}
              onBack={() => setPhase('intro')}
            />
          </motion.div>
        )}

        {phase === 'intermediate' && (
          <motion.div
            key="intermediate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6 py-12"
          >
            <div className="text-5xl">📊</div>
            <h2 className="text-xl font-bold">Premiers résultats</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Vous avez terminé le Flash Swipe ! Voici un aperçu de vos premières tendances avant de
              passer au questionnaire.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {KIVIAT_DIMENSIONS.map((dim) => {
                const score = computeSwipeScores(swipeResults)[dim.code] ?? 0
                return (
                  <Badge key={dim.code} variant="outline" className="gap-1">
                    {dim.emoji} {score}%
                  </Badge>
                )
              })}
            </div>
            <Button onClick={() => setPhase('questionnaire')}>
              Continuer avec le Questionnaire →
            </Button>
          </motion.div>
        )}

        {phase === 'questionnaire' && (
          <motion.div
            key="questionnaire"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Questionnaire
              onComplete={(ans) => {
                setQuestionAnswers(ans)
                setPhase('scenario')
              }}
              onBack={() => setPhase('intermediate')}
              weakDimensions={weakDimensions}
            />
          </motion.div>
        )}

        {phase === 'scenario' && (
          <motion.div
            key="scenario"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ScenarioChallenge
              onComplete={(ans) => {
                setScenarioAnswers(ans)
                setPhase('final')
              }}
              onBack={() => setPhase('questionnaire')}
            />
          </motion.div>
        )}

        {phase === 'final' && (
          <motion.div
            key="final"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6 py-12"
          >
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold">Bilan terminé !</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Félicitations ! Vous avez complété les 3 épreuves du bilan. Voici un résumé :
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="font-bold">{swipeResults.length}</div>
                <div className="text-muted-foreground">Cartes swippées</div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="font-bold">{questionAnswers.length}</div>
                <div className="text-muted-foreground">Questions répondues</div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="font-bold">{scenarioAnswers.length}</div>
                <div className="text-muted-foreground">Scénarios analysés</div>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => onComplete(swipeResults, questionAnswers, scenarioAnswers)}
            >
              Voir les résultats complets →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── ScoreSummary ────────────────────────────────

function ScoreSummary({
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
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      if (swipeResults.length > 0) {
        await fetch('/api/swipe', { method: 'POST', headers, body: JSON.stringify({ results: swipeResults }) })
      }
      if (questionAnswers.length > 0) {
        await fetch('/api/swipe/questions', {
          method: 'POST',
          headers,
          body: JSON.stringify({ answers: questionAnswers }),
        })
      }
      if (scenarioAnswers.length > 0) {
        await fetch('/api/swipe/questions', {
          method: 'POST',
          headers,
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

// ─── Main Component ──────────────────────────────

export function PepitesGame() {
  const [mode, setMode] = useState<GameMode>('select')
  const [swipeResults, setSwipeResults] = useState<SwipeResult[]>([])
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([])
  const [scenarioAnswers, setScenarioAnswers] = useState<QuestionAnswer[]>([])

  const handleModeSelect = useCallback((m: GameMode) => {
    if (m === 'swipe') {
      setSwipeResults([])
      setQuestionAnswers([])
      setScenarioAnswers([])
    }
    if (m === 'questionnaire') {
      setQuestionAnswers([])
    }
    if (m === 'scenario') {
      setScenarioAnswers([])
    }
    if (m === 'bilan') {
      setSwipeResults([])
      setQuestionAnswers([])
      setScenarioAnswers([])
    }
    setMode(m)
  }, [])

  const handleSwipeComplete = useCallback((results: SwipeResult[]) => {
    setSwipeResults(results)
    setMode('results')
  }, [])

  const handleQuestionnaireComplete = useCallback((answers: QuestionAnswer[]) => {
    setQuestionAnswers(answers)
    setMode('results')
  }, [])

  const handleScenarioComplete = useCallback((answers: QuestionAnswer[]) => {
    setScenarioAnswers(answers)
    setMode('results')
  }, [])

  const handleBilanComplete = useCallback(
    (sResults: SwipeResult[], qResults: QuestionAnswer[], scResults: QuestionAnswer[]) => {
      setSwipeResults(sResults)
      setQuestionAnswers(qResults)
      setScenarioAnswers(scResults)
      setMode('results')
    },
    []
  )

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6">
      <AnimatePresence mode="wait">
        {mode === 'select' && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ModeSelector onSelect={handleModeSelect} />
          </motion.div>
        )}

        {mode === 'swipe' && (
          <motion.div key="swipe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FlashSwipe onComplete={handleSwipeComplete} onBack={() => setMode('select')} />
          </motion.div>
        )}

        {mode === 'questionnaire' && (
          <motion.div key="questionnaire" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Questionnaire
              onComplete={handleQuestionnaireComplete}
              onBack={() => setMode('select')}
            />
          </motion.div>
        )}

        {mode === 'scenario' && (
          <motion.div key="scenario" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ScenarioChallenge onComplete={handleScenarioComplete} onBack={() => setMode('select')} />
          </motion.div>
        )}

        {mode === 'bilan' && (
          <motion.div key="bilan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BilanComplet
              onComplete={handleBilanComplete}
              onBack={() => setMode('select')}
            />
          </motion.div>
        )}

        {mode === 'results' && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ScoreSummary
              swipeResults={swipeResults}
              questionAnswers={questionAnswers}
              scenarioAnswers={scenarioAnswers}
              onRestart={() => {
                setSwipeResults([])
                setQuestionAnswers([])
                setScenarioAnswers([])
                setMode('select')
              }}
              onSave={() => {
                setSwipeResults([])
                setQuestionAnswers([])
                setScenarioAnswers([])
                setMode('select')
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PepitesGame
