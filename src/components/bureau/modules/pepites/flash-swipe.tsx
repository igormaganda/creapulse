'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { SWIPE_CARDS, KIVIAT_DIMENSIONS } from '@/data/swipe-cards'
import { useAuthStore } from '@/lib/zustand/store'
import { authFetch } from '@/lib/auth-fetch'
import { cn } from '@/lib/utils'
import type { SwipeResult } from '@/lib/kiviat-scoring'
import { shuffleArray, DIMENSION_COLORS, type SwipeAction } from './shared'

// ─── FlashSwipe ──────────────────────────────────

export function FlashSwipe({
  onComplete,
  onBack,
}: {
  onComplete: (results: SwipeResult[]) => void
  onBack: () => void
}) {
  // All 60 cards — full deck shuffled each session
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
      const token = useAuthStore.getState().token
      if (!token) return // Don't send request if not authenticated
      try {
        await authFetch('/api/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        // Only save if authenticated — avoids 401 errors in production
        const token = useAuthStore.getState().token
        if (token) {
          saveSwipeBatch(newResults.slice(-10))
        }
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
