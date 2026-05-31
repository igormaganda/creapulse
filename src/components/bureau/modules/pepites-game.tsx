'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { KIVIAT_DIMENSIONS } from '@/data/swipe-cards'
import { cn } from '@/lib/utils'
import {
  computeSwipeScores,
  type SwipeResult, type QuestionAnswer,
} from '@/lib/kiviat-scoring'
import { FlashSwipe } from './pepites/flash-swipe'
import { Questionnaire } from './pepites/questionnaire'
import { ScenarioChallenge } from './pepites/scenario-challenge'
import { ScoreSummary } from './pepites/score-summary'
import { type GameMode } from './pepites/shared'

// ─── Constants ───────────────────────────────────

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
