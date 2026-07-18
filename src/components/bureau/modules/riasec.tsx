'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  FlaskConical,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Save,
  CheckCircle2,
  Wrench,
  Search,
  Palette,
  Users,
  Rocket,
  ClipboardList,
  Star,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Target,
  Lightbulb,
  BookOpen,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AudioControls } from '@/components/audio/audio-controls'
import type { MatchOptions } from '@/lib/hooks/useAudioHelper'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type RiasecType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'

interface Question {
  id: number
  text: string
  type: RiasecType
}

interface RiasecScores {
  R: number
  I: number
  A: number
  S: number
  E: number
  C: number
}

type Screen = 'intro' | 'quiz' | 'results'

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const STORAGE_KEY = 'creapulse-riasec-progress'

const RIASEC_COLORS: Record<RiasecType, { bg: string; text: string; chart: string; fill: string; light: string }> = {
  R: { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', chart: '#F59E0B', fill: 'rgba(245,158,11,0.15)', light: 'bg-amber-50 dark:bg-amber-900/20' },
  I: { bg: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', chart: '#00838F', fill: 'rgba(0,131,143,0.15)', light: 'bg-teal-50 dark:bg-teal-900/20' },
  A: { bg: 'bg-coral-500', text: 'text-coral-600 dark:text-coral-400', chart: '#FF6B35', fill: 'rgba(255,107,53,0.15)', light: 'bg-coral-50 dark:bg-coral-900/20' },
  S: { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400', chart: '#22C55E', fill: 'rgba(34,197,94,0.15)', light: 'bg-green-50 dark:bg-green-900/20' },
  E: { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', chart: '#3B82F6', fill: 'rgba(59,130,246,0.15)', light: 'bg-blue-50 dark:bg-blue-900/20' },
  C: { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', chart: '#A855F7', fill: 'rgba(168,85,247,0.15)', light: 'bg-purple-50 dark:bg-purple-900/20' },
}

const RIASEC_LABELS: Record<RiasecType, string> = {
  R: 'Réaliste',
  I: 'Investigateur',
  A: 'Artistique',
  S: 'Social',
  E: 'Entreprenant',
  C: 'Conventionnel',
}

const RIASEC_ICONS: Record<RiasecType, typeof Wrench> = {
  R: Wrench,
  I: Search,
  A: Palette,
  S: Users,
  E: Rocket,
  C: ClipboardList,
}

const LIKERT_LABELS = [
  'Pas du tout d\'accord',
  'Pas d\'accord',
  'Neutre',
  'D\'accord',
  'Tout à fait d\'accord',
]

// 30 questions — 5 per dimension, shuffled order
const QUESTIONS: Question[] = [
  // ── Réaliste (R) ──
  { id: 1, text: 'J\'aime travailler avec des outils ou des machines', type: 'R' },
  { id: 2, text: 'Je préfère les activités pratiques et concrètes', type: 'R' },
  { id: 3, text: 'J\'aime construire ou réparer des choses de mes mains', type: 'R' },
  { id: 4, text: 'Je suis à l\'aise avec les tâches physiques ou manuelles', type: 'R' },
  { id: 5, text: 'J\'apprécie de voir le résultat tangible de mon travail', type: 'R' },
  // ── Investigateur (I) ──
  { id: 6, text: 'J\'aime analyser des données et résoudre des problèmes complexes', type: 'I' },
  { id: 7, text: 'Je suis curieux(se) et j\'aime comprendre comment les choses fonctionnent', type: 'I' },
  { id: 8, text: 'J\'apprécie la recherche scientifique ou l\'expérimentation', type: 'I' },
  { id: 9, text: 'Je préfère observer et réfléchir avant d\'agir', type: 'I' },
  { id: 10, text: 'J\'aime résoudre des énigmes ou des casse-têtes intellectuels', type: 'I' },
  // ── Artistique (A) ──
  { id: 11, text: 'J\'aime créer des choses originales et exprimer ma créativité', type: 'A' },
  { id: 12, text: 'Je suis attiré(e) par les arts, le design ou la musique', type: 'A' },
  { id: 13, text: 'J\'apprécie l\'innovation et penser hors des sentiers battus', type: 'A' },
  { id: 14, text: 'Je préfère un environnement de travail libre et non structuré', type: 'A' },
  { id: 15, text: 'J\'aime expérimenter de nouvelles idées et approches', type: 'A' },
  // ── Social (S) ──
  { id: 16, text: 'J\'aime aider et enseigner aux autres', type: 'S' },
  { id: 17, text: 'Je suis à l\'aise pour communiquer et écouter les gens', type: 'S' },
  { id: 18, text: 'J\'apprécie le travail en équipe et la collaboration', type: 'S' },
  { id: 19, text: 'Je me soucie du bien-être des personnes autour de moi', type: 'S' },
  { id: 20, text: 'J\'aime conseiller, former ou accompagner des personnes', type: 'S' },
  // ── Entreprenant (E) ──
  { id: 21, text: 'J\'aime prendre des décisions et diriger des projets', type: 'E' },
  { id: 22, text: 'Je suis persuasif(se) et j\'aime convaincre les autres', type: 'E' },
  { id: 23, text: 'J\'apprécie les défis et je suis ambitieux(se)', type: 'E' },
  { id: 24, text: 'Je suis à l\'aise pour organiser et motiver une équipe', type: 'E' },
  { id: 25, text: 'J\'aime prendre des risques calculés pour atteindre mes objectifs', type: 'E' },
  // ── Conventionnel (C) ──
  { id: 26, text: 'J\'aime organiser et structurer mon travail avec précision', type: 'C' },
  { id: 27, text: 'Je suis attentif(ve) aux détails et méthodique', type: 'C' },
  { id: 28, text: 'J\'apprécie travailler avec des chiffres et des tableaux', type: 'C' },
  { id: 29, text: 'Je préfère suivre des procédures clairement définies', type: 'C' },
  { id: 30, text: 'Je suis fière de la qualité et de l\'exactitude de mon travail', type: 'C' },
]

// ────────────────────────────────────────────
// Profile descriptions for results
// ────────────────────────────────────────────

const PROFILE_DESCRIPTIONS: Record<RiasecType, {
  title: string
  description: string
  strengths: string[]
  areas: string[]
  careers: string[]
  businessTypes: string[]
}> = {
  R: {
    title: 'Le Bâtisseur Pratique',
    description: 'Vous êtes une personne d\'action qui préfère le concret à l\'abstrait. Votre approche entrepreneurial est ancrée dans le réel — vous aimez créer, fabriquer et voir les résultats tangibles de vos efforts. Vous êtes méthodique dans votre exécution et valuez la qualité artisanale.',
    strengths: [
      'Excellente capacité d\'exécution et de mise en œuvre',
      'Sens aigu de la qualité et du travail bien fait',
      'Autonomie forte dans les tâches techniques',
      'Approche pragmatique de la résolution de problèmes',
    ],
    areas: [
      'Communication et marketing parfois négligés',
      'Tendance à vouloir tout faire soi-même',
      'Peut manquer de vision stratégique à long terme',
    ],
    careers: ['Artisan', 'Technicien spécialisé', 'Chef de production', 'Agriculteur', 'Installateur', 'Expert technique'],
    businessTypes: ['Artisanat', 'Services techniques', 'Production locale', 'Maintenance et réparation', 'Agroalimentaire', 'BTP'],
  },
  I: {
    title: 'L\'Analyste Innovant',
    description: 'Vous êtes guidé(e) par la curiosité intellectuelle et le besoin de comprendre en profondeur. En tant qu\'entrepreneur, vous excellez dans l\'analyse de marchés, l\'identification d\'opportunités et le développement de solutions innovantes. Votre force réside dans votre capacité à transformer des observations en stratégies.',
    strengths: [
      'Capacité d\'analyse approfondie des marchés et tendances',
      'Esprit d\'innovation et de recherche continue',
      'Prise de décision basée sur des données concrètes',
      'Résolution créative de problèmes complexes',
    ],
    areas: [
      'Peut parfois sur-analyser et retarder l\'action',
      'Difficulté à déléguer des tâches intellectuelles',
      'Communication parfois trop technique',
    ],
    careers: ['Chercheur', 'Consultant stratégique', 'Data scientist', 'Ingénieur R&D', 'Analyste financier', 'Développeur de solutions'],
    businessTypes: ['Conseil et expertise', 'R&D et innovation', 'EdTech / SaaS', 'Biotechnologie', 'Intelligence artificielle', 'Conseil en stratégie'],
  },
  A: {
    title: 'Le Créatif Visionnaire',
    description: 'Votre imagination débordante est votre plus grand atout entrepreneurial. Vous voyez le monde différemment et trouvez des solutions que d\'autres ne voient pas. En affaires, cela se traduit par des produits et services uniques, un branding fort et une capacité naturelle à vous démarquer de la concurrence.',
    strengths: [
      'Créativité et capacité d\'innovation remarquable',
      'Sens esthétique et branding naturel',
      'Capacité à penser hors des sentiers battus',
      'Adaptabilité et flexibilité face au changement',
    ],
    areas: [
      'Difficulté avec les tâches administratives répétitives',
      'Structure et rigueur financière à renforcer',
      'Peut parfois manquer de constance dans l\'exécution',
    ],
    careers: ['Designer', 'Directeur artistique', 'Photographe', 'Architecte d\'intérieur', 'Créateur de contenu', 'Réalisateur'],
    businessTypes: ['Agence de création', 'Studio de design', 'Mode et textile', 'Arts et culture', 'Événementiel', 'Communication visuelle'],
  },
  S: {
    title: 'Le Facilitateur Bienveillant',
    description: 'Vous êtes naturellement orienté(e) vers les autres et vous tirez votre énergie des relations humaines. En entrepreneuriat, cela vous rend exceptionnel dans les services, la formation, le coaching et tout ce qui implique un contact humain de qualité. Vous construisez des relations solides avec vos clients et partenaires.',
    strengths: [
      'Excellente intelligence relationnelle et empathie',
      'Leadership participatif et bienveillant',
      'Fidélisation naturelle de la clientèle',
      'Capacité à créer un climat de confiance',
    ],
    areas: [
      'Peut éviter les confrontations nécessaires',
      'Difficulté à prendre des décisions impopulaires',
      'Risque de sur-investissement émotionnel',
    ],
    careers: ['Formateur', 'Coach professionnel', 'Conseiller', 'Professeur', 'Travailleur social', 'Médiateur'],
    businessTypes: ['Formation et coaching', 'Services à la personne', 'Santé et bien-être', 'Éducation', 'RH et recrutement', 'Tourisme solidaire'],
  },
  E: {
    title: 'Le Leader Stratégique',
    description: 'Vous êtes un(e) né(e) leader avec une forte capacité à prendre des décisions, convaincre et mobiliser. En entrepreneuriat, vous excellez dans la direction d\'entreprise, le développement commercial et la levée de fonds. Votre ambition et votre énergie sont contagieuses.',
    strengths: [
      'Leadership naturel et capacité de persuasion',
      'Vision stratégique et sens des affaires',
      'Prise de décision rapide et assumée',
      'Réseau et relations institutionnelles solides',
    ],
    areas: [
      'Risque de burnout par sur-implication',
      'Peut parfois négliger les détails opérationnels',
      'Tendance à vouloir tout contrôler',
    ],
    careers: ['Directeur général', 'Commercial', 'Responsable développement', 'Investisseur', 'Manager de transition', 'Consultant en management'],
    businessTypes: ['Startup tech', 'Franchise', 'Commerce', 'Import-export', 'Agence immobilière', 'Conseil en management'],
  },
  C: {
    title: 'L\'Organisateur Méticuleux',
    description: 'Vous excellez dans la structuration, la planification et le respect des procédures. En entrepreneuriat, vous êtes la colonne vertébrale opérationnelle — vous assurez que tout fonctionne de manière fluide, efficace et conforme. Votre fiabilité est votre marque de fabrique.',
    strengths: [
      'Organisation et rigueur exemplaires',
      'Fiabilité et respect des engagements',
      'Gestion administrative et financière maîtrisée',
      'Capacité à créer des processus reproductibles',
    ],
    areas: [
      'Peut manquer de flexibilité face à l\'imprévu',
      'Innovation et prise de risque parfois limitées',
      'Communication parfois perçue comme rigide',
    ],
    careers: ['Comptable', 'Gestionnaire', 'Contrôleur de gestion', 'Administrateur', 'Responsable qualité', 'Expert-comptable'],
    businessTypes: ['Expertise comptable', 'Conseil en gestion', 'Services administratifs', 'Immobilier', 'Assurance', 'Logistique'],
  },
}

// ────────────────────────────────────────────
// Slide animation variants
// ────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

const fadeVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function calculateScores(answers: Record<number, number>): RiasecScores {
  const scores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
  for (const q of QUESTIONS) {
    const answer = answers[q.id]
    if (answer) {
      scores[q.type] += answer
    }
  }
  return scores
}

function getDominantTypes(scores: RiasecScores): [RiasecType, RiasecType] {
  const sorted = (Object.entries(scores) as [RiasecType, number][])
    .sort(([, a], [, b]) => b - a)
  return [sorted[0][0], sorted[1][0]]
}

function getPercentage(scores: RiasecScores): Record<RiasecType, number> {
  const maxPerType = 25 // 5 questions × 5 max
  const result = {} as Record<RiasecType, number>
  for (const key of Object.keys(scores) as RiasecType[]) {
    result[key] = Math.round((scores[key] / maxPerType) * 100)
  }
  return result
}

// ────────────────────────────────────────────
// Custom Tooltip for RadarChart
// ────────────────────────────────────────────

function CustomRadarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fullMark: number } }> }) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0]
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{data.name}</p>
      <p className="text-xs text-muted-foreground">{data.value} / {data.payload.fullMark}</p>
    </div>
  )
}

// ────────────────────────────────────────────
// Intro Screen
// ────────────────────────────────────────────

function IntroScreen({ onStart }: { onStart: () => void }) {
  const riasecTypes: RiasecType[] = ['R', 'I', 'A', 'S', 'E', 'C']

  return (
    <motion.div
      key="intro"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8"
    >
      {/* Header */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col items-center text-center max-w-2xl mx-auto"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg mb-6">
          <FlaskConical className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Test RIASEC
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-lg">
          Découvrez votre profil entrepreneurial grâce au modèle Holland
        </p>
      </motion.div>

      {/* Description card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 w-full max-w-2xl"
      >
        <Card className="border-none shadow-sm bg-muted/30">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le modèle RIASEC, développé par John Holland, identifie <strong className="text-foreground">6 dimensions de personnalité</strong> qui influencent vos préférences professionnelles et votre style entrepreneurial.
              Ce test vous aidera à mieux comprendre vos forces, vos motivations et les types d&apos;activités qui vous correspondent le mieux.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {riasecTypes.map((type, i) => {
                const Icon = RIASEC_ICONS[type]
                const colors = RIASEC_COLORS[type]
                return (
                  <motion.div
                    key={type}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl p-3',
                      colors.light
                    )}
                  >
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', colors.bg, 'bg-opacity-10')}>
                      <Icon className={cn('h-4 w-4', colors.text)} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{type}</p>
                      <p className="text-xs text-muted-foreground">{RIASEC_LABELS[type]}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info badges */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-3"
      >
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <BookOpen className="h-3 w-3" />
          30 questions
        </Badge>
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <Target className="h-3 w-3" />
          6 dimensions
        </Badge>
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <Sparkles className="h-3 w-3" />
          ~5 minutes
        </Badge>
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <Save className="h-3 w-3" />
          Auto-sauvegarde
        </Badge>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="mt-8"
      >
        <Button
          size="lg"
          onClick={onStart}
          className="gap-2 rounded-full px-8 shadow-md hover:shadow-lg transition-all"
        >
          Commencer le test
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ────────────────────────────────────────────
// Quiz Screen
// ────────────────────────────────────────────

function QuizScreen({
  answers,
  currentQuestion,
  direction,
  onAnswer,
  onPrev,
  onNext,
  onFinish,
}: {
  answers: Record<number, number>
  currentQuestion: number
  direction: number
  onAnswer: (questionId: number, value: number) => void
  onPrev: () => void
  onNext: () => void
  onFinish: () => void
}) {
  const question = QUESTIONS[currentQuestion]
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100
  const selectedValue = answers[question.id]
  const colors = RIASEC_COLORS[question.type]
  const isLastQuestion = currentQuestion === QUESTIONS.length - 1
  const canContinue = selectedValue !== undefined

  // ── Click-to-advance timer ──
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Audio: voice-driven quiz ──
  const [audioAutoAdvance, setAudioAutoAdvance] = useState(true)

  const readText = `Question ${currentQuestion + 1} sur ${QUESTIONS.length}. ${question.text}`

  const riasecMatchOptions: MatchOptions = useMemo(() => ({
    choices: LIKERT_LABELS.map((label, idx) => ({ label, value: idx + 1 })),
    keywords: {
      'pas du tout': 1, 'pas du tout d\'accord': 1,
      'pas d\'accord': 2,
      'neutre': 3, 'bof': 3,
      'd\'accord': 4,
      'tout à fait': 5, 'tout à fait d\'accord': 5, 'très': 5,
    },
  }), [])

  const handleVoiceResult = useCallback((result: string) => {
    const value = parseInt(result, 10)
    if (value >= 1 && value <= 5) {
      onAnswer(question.id, value)
      // Auto-advance after voice answer
      setTimeout(() => {
        if (isLastQuestion) {
          onFinish()
        } else {
          onNext()
        }
      }, 400)
    }
  }, [question.id, isLastQuestion, onAnswer, onNext, onFinish])

  return (
    <div className="flex flex-col min-h-[70vh] px-4 py-6 md:px-8 md:py-8 max-w-2xl mx-auto w-full">
      {/* Progress header */}
      <div className="space-y-3 mb-6" role="status" aria-live="polite">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">
            Question {currentQuestion + 1} sur {QUESTIONS.length}
          </span>
          <Badge variant="outline" className={cn('gap-1.5 text-xs border-current/20', colors.text, 'bg-transparent')}>
            {RIASEC_LABELS[question.type]}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" aria-hidden="true" />
        <span className="sr-only">Progression : {Math.round(progress)}%</span>
      </div>

      {/* Question content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={question.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex-1 flex flex-col"
        >
          {/* Question card */}
          <Card className="border-none shadow-sm bg-muted/30 flex-1">
            <CardContent className="p-6 md:p-8 flex flex-col h-full">
              {/* Dimension color bar */}
              <div className={cn('h-1 w-16 rounded-full mb-6', colors.bg)} />

              {/* Question text */}
              <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed flex-1" id={`riasec-question-${question.id}`}>
                {question.text}
              </p>

              {/* Likert scale */}
              <div className="mt-8 space-y-3" role="radiogroup" aria-labelledby={`riasec-question-${question.id}`} aria-label="Niveau d'accord">
                {LIKERT_LABELS.map((label, idx) => {
                  const value = idx + 1
                  const isSelected = selectedValue === value
                  return (
                    <motion.button
                      key={value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        onAnswer(question.id, value)
                        // Click-to-advance: cancel any pending timer, then auto-advance
                        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
                        autoAdvanceTimerRef.current = setTimeout(() => {
                          if (isLastQuestion) {
                            onFinish()
                          } else {
                            onNext()
                          }
                        }, 400)
                      }}
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${label}, note ${value} sur 5`}
                      className={cn(
                        'w-full flex items-center gap-4 rounded-xl p-3.5 text-left transition-all duration-200 border-2 cursor-pointer',
                        isSelected
                          ? cn(colors.light, 'border-current/30 shadow-sm', colors.text)
                          : 'border-transparent hover:bg-muted/60 text-muted-foreground'
                      )}
                    >
                      {/* Rating circles */}
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <div
                            key={v}
                            className={cn(
                              'h-2.5 w-2.5 rounded-full transition-all',
                              v <= value
                                ? isSelected ? colors.bg : 'bg-muted-foreground/30'
                                : 'bg-muted-foreground/10'
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn(
                        'text-sm font-medium transition-colors',
                        isSelected ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {label}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className={cn('h-4 w-4 ml-auto shrink-0', colors.text)} />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Audio controls — read question + voice answer */}
      <div className="flex justify-center mt-4">
        <AudioControls
          readText={readText}
          matchOptions={riasecMatchOptions}
          onVoiceResult={handleVoiceResult}
          autoAdvance={audioAutoAdvance}
          onAutoAdvanceChange={setAudioAutoAdvance}
        />
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={currentQuestion === 0}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Précédent
        </Button>

        <div className="flex items-center gap-1.5" aria-hidden="true">
          {QUESTIONS.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1.5 rounded-full transition-all duration-200',
                idx === currentQuestion
                  ? 'w-6 bg-primary'
                  : idx < currentQuestion
                    ? 'w-1.5 bg-primary/60'
                    : 'w-1.5 bg-muted-foreground/20'
              )}
            />
          ))}
        </div>

        {isLastQuestion ? (
          <Button
            size="sm"
            onClick={onFinish}
            disabled={!canContinue}
            className="gap-1.5 rounded-full"
          >
            Voir les résultats
            <Sparkles className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onNext}
            disabled={!canContinue}
            className="gap-1.5"
          >
            Suivant
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
// Results Screen
// ────────────────────────────────────────────

function ResultsScreen({
  scores,
  onRestart,
  onSave,
}: {
  scores: RiasecScores
  onRestart: () => void
  onSave: () => void
}) {
  const [dominant1, dominant2] = getDominantTypes(scores)
  const percentages = getPercentage(scores)
  const profile1 = PROFILE_DESCRIPTIONS[dominant1]
  const profile2 = PROFILE_DESCRIPTIONS[dominant2]

  // Radar chart data
  const chartData = (Object.entries(RIASEC_LABELS) as [RiasecType, string][])
    .map(([type, label]) => ({
      dimension: label,
      score: scores[type],
      fullMark: 25,
      type,
    }))

  return (
    <motion.div
      key="results"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto w-full space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg mb-4"
        >
          <Sparkles className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Votre profil entrepreneurial
        </h2>
        <p className="mt-2 text-muted-foreground">
          Basé sur vos réponses au test RIASEC
        </p>
      </div>

      {/* Dominant profile banner */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-none shadow-md overflow-hidden">
          <div className={cn(
            'h-1.5',
            RIASEC_COLORS[dominant1].bg
          )} />
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  RIASEC_COLORS[dominant1].light
                )}>
                  {(() => {
                    const Icon1 = RIASEC_ICONS[dominant1]
                    return <Icon1 className={cn('h-6 w-6', RIASEC_COLORS[dominant1].text)} />
                  })()}
                </div>
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl -ml-3 border-2 border-background',
                  RIASEC_COLORS[dominant2].light
                )}>
                  {(() => {
                    const Icon2 = RIASEC_ICONS[dominant2]
                    return <Icon2 className={cn('h-6 w-6', RIASEC_COLORS[dominant2].text)} />
                  })()}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profil dominant</p>
                <h3 className="text-xl font-bold text-foreground">
                  {profile1.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {RIASEC_LABELS[dominant1]} — {RIASEC_LABELS[dominant2]} ({percentages[dominant1]}% — {percentages[dominant2]}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Radar Chart + Score bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-none shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Radar des compétences</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="w-full aspect-square max-w-[350px] mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 25]}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickCount={6}
                    />
                    {chartData.map((entry, idx) => {
                      const type = entry.type as RiasecType
                      // Single radar polygon with all points
                      if (idx > 0) return null
                      return (
                        <Radar
                          key="main-radar"
                          name="Score"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      )
                    })}
                    <Tooltip content={<CustomRadarTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Score breakdown */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-none shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Détail par dimension</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {(Object.entries(RIASEC_LABELS) as [RiasecType, string][])
                .sort(([, a], [, b]) => scores[b as RiasecType] - scores[a as RiasecType])
                .map(([type, label], idx) => {
                  const pct = percentages[type]
                  const isDominant = type === dominant1 || type === dominant2
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold',
                            isDominant ? RIASEC_COLORS[type].bg : 'bg-muted',
                            isDominant ? 'text-white' : 'text-muted-foreground'
                          )}>
                            {idx + 1}
                          </div>
                          <span className={cn(
                            'text-sm font-medium',
                            isDominant ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {label}
                          </span>
                          {isDominant && (
                            <Star className={cn('h-3 w-3', RIASEC_COLORS[type].text)} />
                          )}
                        </div>
                        <span className={cn(
                          'text-sm font-semibold',
                          RIASEC_COLORS[type].text
                        )}>
                          {scores[type]}/25
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.6 + idx * 0.1, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', RIASEC_COLORS[type].bg)}
                        />
                      </div>
                    </div>
                  )
                })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Profile descriptions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-6"
      >
        {/* Primary profile */}
        <ProfileCard type={dominant1} profile={profile1} primary />
        {/* Secondary profile */}
        <ProfileCard type={dominant2} profile={profile2} primary={false} />
      </motion.div>

      {/* Combined recommendations */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Pistes entrepreneuriales recommandées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recommended business types */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Types d&apos;entreprises</h4>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...profile1.businessTypes.slice(0, 3), ...profile2.businessTypes.slice(0, 3)])]
                  .map((bt, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {bt}
                    </Badge>
                  ))}
              </div>
            </div>
            {/* Recommended careers */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Métiers compatibles</h4>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...profile1.careers.slice(0, 3), ...profile2.careers.slice(0, 3)])]
                  .map((c, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {c}
                    </Badge>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-4"
      >
        <Button
          variant="outline"
          onClick={onRestart}
          className="gap-2 rounded-full"
        >
          <RotateCcw className="h-4 w-4" />
          Recommencer
        </Button>
        <Button
          onClick={onSave}
          className="gap-2 rounded-full"
        >
          <Save className="h-4 w-4" />
          Sauvegarder mes résultats
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ────────────────────────────────────────────
// Profile Card sub-component
// ────────────────────────────────────────────

function ProfileCard({
  type,
  profile,
  primary,
}: {
  type: RiasecType
  profile: typeof PROFILE_DESCRIPTIONS[RiasecType]
  primary: boolean
}) {
  const colors = RIASEC_COLORS[type]
  const Icon = RIASEC_ICONS[type]
  const [expanded, setExpanded] = useState(primary)

  return (
    <Card className={cn('border-none shadow-sm overflow-hidden', !primary && 'opacity-90')}>
      <div className={cn('h-1', colors.bg, !primary && 'opacity-50')} />
      <CardContent className="p-6">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              colors.light
            )}>
              <Icon className={cn('h-5 w-5', colors.text)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className={cn('font-semibold', primary ? 'text-lg' : 'text-base', 'text-foreground')}>
                  {RIASEC_LABELS[type]} — {profile.title}
                </h4>
                {primary && (
                  <Badge className="text-[10px] px-1.5 py-0" variant="default">Principal</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {profile.description.slice(0, 100)}...
              </p>
            </div>
          </div>
          <ChevronRight className={cn(
            'h-4 w-4 text-muted-foreground transition-transform shrink-0',
            expanded && 'rotate-90'
          )} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-5 space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.description}
                </p>

                <Separator />

                {/* Strengths */}
                <div>
                  <h5 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Points forts
                  </h5>
                  <ul className="space-y-2">
                    {profile.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas to develop */}
                <div>
                  <h5 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Axes de développement
                  </h5>
                  <ul className="space-y-2">
                    {profile.areas.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Careers */}
                <div>
                  <h5 className="text-sm font-semibold text-foreground mb-3">
                    Métiers associés
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {profile.careers.map((c, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Business types */}
                <div>
                  <h5 className="text-sm font-semibold text-foreground mb-3">
                    Types d&apos;entreprises
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {profile.businessTypes.map((b, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {b}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

// ────────────────────────────────────────────
// Main RIASEC Component
// ────────────────────────────────────────────

export function RiasecModule() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [direction, setDirection] = useState(1)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [savedScores, setSavedScores] = useState<RiasecScores | null>(null)

  // Load saved progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.answers && Object.keys(data.answers).length > 0) {
          // If all questions answered, go straight to results
          if (Object.keys(data.answers).length === QUESTIONS.length) {
            setAnswers(data.answers)
            setSavedScores(calculateScores(data.answers))
            setScreen('results')
          } else {
            setAnswers(data.answers)
            setCurrentQuestion(Math.min(data.currentQuestion || 0, QUESTIONS.length - 1))
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Auto-save progress to localStorage
  const saveProgress = useCallback((currentAnswers: Record<number, number>, questionIdx: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers: currentAnswers,
        currentQuestion: questionIdx,
        updatedAt: new Date().toISOString(),
      }))
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Handle answer selection
  const handleAnswer = useCallback((questionId: number, value: number) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: value }
      saveProgress(updated, currentQuestion)
      return updated
    })
  }, [currentQuestion, saveProgress])

  // Navigate to next question
  const handleNext = useCallback(() => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setDirection(1)
      setCurrentQuestion((prev) => prev + 1)
    }
  }, [currentQuestion])

  // Navigate to previous question
  const handlePrev = useCallback(() => {
    if (currentQuestion > 0) {
      setDirection(-1)
      setCurrentQuestion((prev) => prev - 1)
    }
  }, [currentQuestion])

  // Finish quiz — show results
  const handleFinish = useCallback(() => {
    const finalScores = calculateScores(answers)
    setSavedScores(finalScores)
    setScreen('results')
  }, [answers])

  // Restart quiz
  const handleRestart = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
    setAnswers({})
    setCurrentQuestion(0)
    setDirection(1)
    setSavedScores(null)
    setScreen('intro')
  }, [])

  // Save results to API (cookie-based auth — session cookie is sent automatically)
  const handleSave = useCallback(async () => {
    if (!savedScores) return
    setIsSaving(true)
    try {
      const types: RiasecType[] = ['R', 'I', 'A', 'S', 'E', 'C']
      const results = types.map(type => ({
        profileType: type,
        score: savedScores[type],
        isDominant: type === getDominantTypes(savedScores)[0] || type === getDominantTypes(savedScores)[1],
      }))

      const res = await fetch('/api/riasec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ results }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Résultats sauvegardés', {
          description: 'Vos résultats RIASEC ont été enregistrés dans votre profil.',
        })
      } else {
        toast.error('Erreur de sauvegarde', {
          description: data.error?.message || 'Impossible de sauvegarder vos résultats. Êtes-vous connecté(e) ?',
        })
      }
    } catch {
      toast.error('Erreur réseau', {
        description: 'Vérifiez votre connexion et réessayez.',
      })
    } finally {
      setIsSaving(false)
    }
  }, [savedScores])

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {screen === 'intro' && (
          <IntroScreen
            key="intro"
            onStart={() => {
              setDirection(1)
              setScreen('quiz')
            }}
          />
        )}
        {screen === 'quiz' && (
          <QuizScreen
            key={`quiz-${currentQuestion}`}
            answers={answers}
            currentQuestion={currentQuestion}
            direction={direction}
            onAnswer={handleAnswer}
            onPrev={handlePrev}
            onNext={handleNext}
            onFinish={handleFinish}
          />
        )}
        {screen === 'results' && savedScores && (
          <ResultsScreen
            key="results"
            scores={savedScores}
            onRestart={handleRestart}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Save loading overlay */}
      {isSaving && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
          <div className="flex items-center gap-3 rounded-xl bg-background px-6 py-4 shadow-lg border">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm font-medium text-foreground">Sauvegarde en cours...</span>
          </div>
        </div>
      )}
    </div>
  )
}
