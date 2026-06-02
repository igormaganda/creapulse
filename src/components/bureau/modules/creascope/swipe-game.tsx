'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  Star,
  RotateCcw,
  BarChart3,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Clock,
  Zap,
  Target,
} from 'lucide-react'
import {
  SWIPE_CARDS,
  KIVIAT_DIMENSIONS,
  getCardsByDimension,
  getDimension,
  type SwipeCardData,
} from '@/data/swipe-cards'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GameMode = 'flash' | 'questionnaire' | 'scenario' | 'complet'

interface CardResult {
  kept: boolean
  superPepite: boolean
}

type ResultsMap = Map<string, CardResult>

// ---------------------------------------------------------------------------
// Color map — dimension string color → CSS classes
// ---------------------------------------------------------------------------

const DIM_COLOR_MAP: Record<string, { bg: string; text: string; bar: string; border: string }> = {
  amber:    { bg: 'bg-amber-100 dark:bg-amber-950',  text: 'text-amber-700 dark:text-amber-300',  bar: 'bg-amber-500', border: 'border-amber-300' },
  sky:      { bg: 'bg-sky-100 dark:bg-sky-950',      text: 'text-sky-700 dark:text-sky-300',      bar: 'bg-sky-500',   border: 'border-sky-300' },
  violet:   { bg: 'bg-violet-100 dark:bg-violet-950',  text: 'text-violet-700 dark:text-violet-300', bar: 'bg-violet-500', border: 'border-violet-300' },
  rose:     { bg: 'bg-rose-100 dark:bg-rose-950',      text: 'text-rose-700 dark:text-rose-300',   bar: 'bg-rose-500',  border: 'border-rose-300' },
  blue:     { bg: 'bg-blue-100 dark:bg-blue-950',     text: 'text-blue-700 dark:text-blue-300',  bar: 'bg-blue-500',  border: 'border-blue-300' },
  emerald:  { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500', border: 'border-emerald-300' },
}

const dimColor = (colorKey: string) =>
  DIM_COLOR_MAP[colorKey] ?? DIM_COLOR_MAP.amber

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function difficultyStars(d: number) {
  return '★'.repeat(d) + '☆'.repeat(3 - d)
}

// ---------------------------------------------------------------------------
// Swipe Card (animated)
// ---------------------------------------------------------------------------

interface SwipeableCardProps {
  card: SwipeCardData
  dimension: typeof KIVIAT_DIMENSIONS[number]
  index: number
  total: number
  onSwipe: (direction: 'left' | 'right', superPepite?: boolean) => void
}

function SwipeableCard({ card, dimension, index, total, onSwipe }: SwipeableCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18])
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0.5, 1, 1, 1, 0.5])

  // Overlay indicators
  const passOpacity = useTransform(x, [-200, -50, 0], [1, 0, 0])
  const pepiteOpacity = useTransform(x, [0, 50, 200], [0, 0, 1])

  const flyOff = useCallback(
    (direction: 'left' | 'right') => {
      const target = direction === 'left' ? -600 : 600
      animate(x, target, {
        duration: 0.35,
        ease: 'easeOut',
        onComplete: () => onSwipe(direction),
      })
    },
    [x, onSwipe],
  )

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 120
    if (info.offset.x < -threshold) flyOff('left')
    else if (info.offset.x > threshold) flyOff('right')
    else animate(x, 0, { type: 'spring', stiffness: 300, damping: 25 })
  }

  const handlePass = () => flyOff('left')
  const handlePepite = () => flyOff('right')
  const handleSuper = () => {
    // mark super then fly right
    onSwipe('right', true)
    animate(x, 600, { duration: 0.35, ease: 'easeOut' })
  }

  const pct = Math.round(((index) / total) * 100)
  const c = dimColor(dimension.color)

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {/* Progress */}
      <div className="w-full space-y-1">
        <div className="flex justify-between text-sm font-medium text-muted-foreground">
          <span>{index} / {total}</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* Draggable Card */}
      <div className="relative w-full touch-none" style={{ perspective: 800 }}>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          style={{ x, rotate, opacity }}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 1.02 }}
          className="cursor-grab active:cursor-grabbing"
        >
          <Card className="relative overflow-hidden border-2 shadow-xl">
            {/* Pass overlay */}
            <motion.div
              style={{ opacity: passOpacity }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-red-500/20 backdrop-blur-[1px] rounded-lg pointer-events-none"
            >
              <div className="rotate-[-18deg] border-4 border-red-500 rounded-2xl px-6 py-3 text-red-600 font-extrabold text-3xl tracking-wider">
                PASS
              </div>
            </motion.div>

            {/* Pépite overlay */}
            <motion.div
              style={{ opacity: pepiteOpacity }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-teal-500/20 backdrop-blur-[1px] rounded-lg pointer-events-none"
            >
              <div className="rotate-[18deg] border-4 border-teal-500 rounded-2xl px-6 py-3 text-teal-600 font-extrabold text-3xl tracking-wider">
                PÉPITE
              </div>
            </motion.div>

            <CardHeader className="text-center pb-2 pt-8">
              <div className="text-6xl mb-3 drop-shadow-sm">{card.icon}</div>
              <Badge className={`mb-2 ${c.bg} ${c.text} border ${c.border} text-xs font-semibold`}>
                {dimension.emoji} {dimension.label}
              </Badge>
              <CardTitle className="text-xl mt-2">{card.title}</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center gap-4 pb-8">
              <p className="text-center text-muted-foreground leading-relaxed max-w-sm">
                &ldquo;{card.description}&rdquo;
              </p>

              <div className="flex items-center gap-3 text-sm">
                <span className={c.text}>{dimension.label}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-amber-500 tracking-wider">{difficultyStars(card.difficulty)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 w-full max-w-sm">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
          onClick={handlePass}
        >
          <ThumbsDown className="h-4 w-4" />
          Pass
        </Button>

        <Button
          size="lg"
          className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          onClick={handleSuper}
        >
          <Star className="h-4 w-4 fill-current" />
          Super Pépite
        </Button>

        <Button
          size="lg"
          className="flex-1 gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          onClick={handlePepite}
        >
          Pépite
          <ThumbsUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Results Screen
// ---------------------------------------------------------------------------

interface ResultsScreenProps {
  results: ResultsMap
  onRestart: () => void
}

function ResultsScreen({ results, onRestart }: ResultsScreenProps) {
  const cardsByDim = useMemo(() => getCardsByDimension(), [])
  const keptCount = useMemo(
    () => [...results.values()].filter((r) => r.kept).length,
    [results],
  )
  const superCount = useMemo(
    () => [...results.values()].filter((r) => r.superPepite).length,
    [results],
  )
  const totalCards = SWIPE_CARDS.length

  const dimensionScores = useMemo(() => {
    return KIVIAT_DIMENSIONS.map((dim) => {
      const cards = cardsByDim[dim.code] ?? []
      const keptInDim = cards.filter((c) => results.get(c.code)?.kept).length
      const totalInDim = cards.length
      const pct = totalInDim > 0 ? Math.round((keptInDim / totalInDim) * 100) : 0
      return { ...dim, keptInDim, totalInDim, pct }
    })
  }, [results, cardsByDim])

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Summary card */}
      <Card className="border-teal-200 dark:border-teal-800">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-teal-500" />
            Résultats — Pépites identifiées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="rounded-xl bg-teal-50 dark:bg-teal-950 p-4">
              <p className="text-3xl font-bold text-teal-600">{keptCount}/{totalCards}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Pépites</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950 p-4">
              <p className="text-3xl font-bold text-amber-500">{superCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Super Pépites</p>
            </div>
          </div>

          <Button onClick={onRestart} className="w-full gap-2" variant="outline">
            <RotateCcw className="h-4 w-4" />
            Recommencer
          </Button>
        </CardContent>
      </Card>

      {/* Dimension breakdown */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-teal-500" />
          Répartition par dimension
        </h3>
        {dimensionScores.map((dim) => {
          const c = dimColor(dim.color)
          return (
            <Card key={dim.code} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium text-sm flex items-center gap-1.5 ${c.text}`}>
                    <span>{dim.emoji}</span>
                    {dim.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {dim.keptInDim}/{dim.totalInDim} — {dim.pct}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${c.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${dim.pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Placeholder mode component
// ---------------------------------------------------------------------------

interface PlaceholderProps {
  icon: React.ReactNode
  title: string
  description: string
  duration: string
  features: string[]
}

function PlaceholderMode({ icon, title, description, duration, features }: PlaceholderProps) {
  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-12">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 mb-4">
        {icon}
      </div>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Durée estimée : {duration}</span>
      </div>

      <Card className="text-left border-dashed">
        <CardContent className="p-6">
          <p className="text-sm font-medium mb-3">Ce mode inclura :</p>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Badge variant="secondary" className="text-xs px-3 py-1">
        🚧 Mode en cours de développement
      </Badge>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main SwipeGame Component
// ---------------------------------------------------------------------------

export function SwipeGame() {
  const [currentMode, setCurrentMode] = useState<GameMode>('flash')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<ResultsMap>(new Map())
  const [isComplete, setIsComplete] = useState(false)
  const [showStartDialog, setShowStartDialog] = useState(false)

  // Shuffled cards for this session
  const [shuffledCards] = useState<SwipeCardData[]>(() => shuffleArray(SWIPE_CARDS))

  const totalCards = shuffledCards.length

  const currentCard = useMemo(() => shuffledCards[currentIndex], [shuffledCards, currentIndex])
  const currentDimension = useMemo(
    () => (currentCard ? getDimension(currentCard.category) : null),
    [currentCard],
  )

  const handleSwipe = useCallback(
    (direction: 'left' | 'right', superPepite?: boolean) => {
      if (!currentCard) return

      setResults((prev) => {
        const next = new Map(prev)
        next.set(currentCard.code, {
          kept: direction === 'right',
          superPepite: superPepite ?? false,
        })
        return next
      })

      const nextIndex = currentIndex + 1
      if (nextIndex >= totalCards) {
        setCurrentIndex(nextIndex)
        setIsComplete(true)
      } else {
        setCurrentIndex(nextIndex)
      }
    },
    [currentCard, currentIndex, totalCards],
  )

  const handleRestart = useCallback(() => {
    setCurrentIndex(0)
    setResults(new Map())
    setIsComplete(false)
  }, [])

  const handleCompletStart = useCallback(() => {
    setCurrentMode('flash')
    handleRestart()
    setShowStartDialog(false)
  }, [handleRestart])

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="h-7 w-7 text-teal-500" />
          Jeu de Cartes Pépites
        </h2>
        <p className="text-muted-foreground">
          Identifiez vos compétences entrepreneuriales grâce au swipe intuitif
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={currentMode} onValueChange={(v) => setCurrentMode(v as GameMode)}>
        <TabsList className="grid grid-cols-4 w-full h-auto">
          <TabsTrigger value="flash" className="text-xs sm:text-sm py-2 gap-1">
            <Zap className="h-4 w-4 hidden sm:block" />
            Flash Swipe
          </TabsTrigger>
          <TabsTrigger value="questionnaire" className="text-xs sm:text-sm py-2 gap-1">
            <Target className="h-4 w-4 hidden sm:block" />
            Questionnaire
          </TabsTrigger>
          <TabsTrigger value="scenario" className="text-xs sm:text-sm py-2 gap-1">
            <Flame className="h-4 w-4 hidden sm:block" />
            Scénario
          </TabsTrigger>
          <TabsTrigger value="complet" className="text-xs sm:text-sm py-2 gap-1">
            <BarChart3 className="h-4 w-4 hidden sm:block" />
            Bilan Complet
          </TabsTrigger>
        </TabsList>

        {/* ── Mode 1 : Flash Swipe ────────────────────────────── */}
        <TabsContent value="flash" className="mt-6">
          {isComplete ? (
            <ResultsScreen results={results} onRestart={handleRestart} />
          ) : currentCard && currentDimension ? (
            <SwipeableCard
              key={currentCard.code}
              card={currentCard}
              dimension={currentDimension}
              index={currentIndex}
              total={totalCards}
              onSwipe={handleSwipe}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">Chargement…</div>
          )}

          {/* Quick stats bar */}
          {!isComplete && results.size > 0 && (
            <div className="flex justify-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5 text-teal-500" />
                {[...results.values()].filter((r) => r.kept).length} pépites
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                {[...results.values()].filter((r) => r.superPepite).length} super
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                ~5-8 min
              </span>
            </div>
          )}
        </TabsContent>

        {/* ── Mode 2 : Questionnaire Approfondi ─────────────── */}
        <TabsContent value="questionnaire" className="mt-6">
          <PlaceholderMode
            icon={<Target className="h-9 w-9" />}
            title="Questionnaire Approfondi"
            description="Explorez chaque dimension en profondeur grâce à des questions ciblées sur une échelle de 1 à 10. 5 batches de 10 questions pour un bilan détaillé."
            duration="15-20 min"
            features={[
              'Questions générées par dimension (Leadership, Stress, Communication…)',
              'Échelle de 1 à 10 avec slider interactif',
              'Batchs de 10 questions avec validation progressive',
              'Résultats comparatifs par dimension',
            ]}
          />
        </TabsContent>

        {/* ── Mode 3 : Challenge Scénario ────────────────────── */}
        <TabsContent value="scenario" className="mt-6">
          <PlaceholderMode
            icon={<Flame className="h-9 w-9" />}
            title="Challenge Scénario"
            description="Mettez-vous en situation ! 10 scénarios réalistes du monde entrepreneurial avec 4 choix chacun. Testez votre réaction face au imprévus."
            duration="10-15 min"
            features={[
              '10 scénarios entrepreneurials réalistes',
              '4 choix de réponse par situation',
              'Explication détaillée après chaque réponse',
              'Score de pertinence par décision',
            ]}
          />
        </TabsContent>

        {/* ── Mode 4 : Bilan Complet ─────────────────────────── */}
        <TabsContent value="scenario" className="mt-6" />
        <TabsContent value="complet" className="mt-6">
          <div className="max-w-md mx-auto text-center space-y-6 py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 mb-4">
              <BarChart3 className="h-9 w-9" />
            </div>

            <h3 className="text-2xl font-bold">Bilan Complet</h3>
            <p className="text-muted-foreground leading-relaxed">
              Enchaînez les 3 modes pour obtenir le profil le plus complet de vos compétences
              entrepreneuriales. Le bilan combine les données du Flash Swipe, du Questionnaire et
              du Challenge Scénario.
            </p>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Durée estimée : 35-45 min</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="gap-1">
                  <Zap className="h-3 w-3" /> 1. Flash Swipe
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="gap-1">
                  <Target className="h-3 w-3" /> 2. Questionnaire
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="gap-1">
                  <Flame className="h-3 w-3" /> 3. Scénario
                </Badge>
              </div>
            </div>

            <Button size="lg" className="gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8" onClick={() => setShowStartDialog(true)}>
              <Sparkles className="h-5 w-5" />
              Lancer le Bilan Complet
            </Button>

            <p className="text-xs text-muted-foreground">
              Le Flash Swipe est disponible dès maintenant. Les autres modes arrivent bientôt.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Start Dialog for Bilan Complet */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-500" />
              Lancer le Bilan Complet
            </DialogTitle>
            <DialogDescription>
              Ce bilan enchaîne les 3 modes d&apos;évaluation. Le Flash Swipe démarre en premier.
              Les modes Questionnaire et Scénario seront disponibles prochainement.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowStartDialog(false)}>
              Annuler
            </Button>
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleCompletStart}>
              <Zap className="h-4 w-4" />
              Commencer le Flash Swipe
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
