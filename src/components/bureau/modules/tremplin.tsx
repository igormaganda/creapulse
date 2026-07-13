'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTradEmploi } from '@/components/trad-emploi/voice-context'
import { toast } from 'sonner'
import {
  Rocket,
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Shield,
  Star,
  Users,
  Heart,
  Target,
  Lightbulb,
  Loader2,
  RotateCcw,
  Award,
  Zap,
} from 'lucide-react'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type Decision = 'GO' | 'GO_CONDITIONAL' | 'NO_GO'

interface StepConfig {
  id: number
  title: string
  icon: typeof Rocket
  description: string
}

interface Question {
  id: string
  text: string
  type: 'yes_no' | 'select' | 'likert'
  options?: { label: string; value: string | number }[]
  weight: number
  category: string
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const STORAGE_KEY = 'creapulse-tremplin'

const STEPS: StepConfig[] = [
  { id: 1, title: 'Viabilité du projet', icon: Target, description: 'Validation du marché et de la demande' },
  { id: 2, title: 'Modèle économique', icon: TrendingUp, description: 'Sources de revenus et rentabilité' },
  { id: 3, title: 'Plan financier', icon: Shield, description: 'Budget, seuil de rentabilité et financement' },
  { id: 4, title: 'Compétences clés', icon: Star, description: 'Auto-évaluation de vos compétences' },
  { id: 5, title: 'Réseau & Soutien', icon: Users, description: 'Mentorat et accompagnement' },
  { id: 6, title: 'Motivation & Engagement', icon: Heart, description: 'Niveau d\'engagement et tolérance au risque' },
  { id: 7, title: 'Synthèse & Recommandations', icon: Award, description: 'Score final et décision' },
]

const QUESTIONS_BY_STEP: Record<number, Question[]> = {
  1: [
    { id: 'v1', text: 'Avez-vous identifié un besoin clair et non satisfait sur votre marché cible ?', type: 'yes_no', weight: 8, category: 'Marché' },
    { id: 'v2', text: 'Avez-vous réalisé des entretiens ou sondages avec des clients potentiels ?', type: 'yes_no', weight: 7, category: 'Validation' },
    { id: 'v3', text: 'Existe-t-il déjà une demande ou des signaux de marché positifs pour votre produit/service ?', type: 'yes_no', weight: 6, category: 'Demande' },
    { id: 'v4', text: 'Avez-vous identifié vos premiers clients ou early adopters ?', type: 'yes_no', weight: 5, category: 'Ciblage' },
  ],
  2: [
    { id: 'm1', text: 'Avez-vous clairement défini vos sources de revenus principales ?', type: 'yes_no', weight: 7, category: 'Revenus' },
    { id: 'm2', text: 'Votre proposition de valeur est-elle différenciée de la concurrence ?', type: 'yes_no', weight: 8, category: 'Différenciation' },
    { id: 'm3', text: 'Votre modèle économique est-il viable à moyen terme (3 ans) ?', type: 'select', weight: 6, category: 'Viabilité', options: [
      { label: 'Oui, très viable', value: 'yes_strong' },
      { label: 'Probablement viable', value: 'yes_moderate' },
      { label: 'Incertain', value: 'maybe' },
      { label: 'Non encore validé', value: 'no' },
    ]},
    { id: 'm4', text: 'Connaissez-vous votre coût d\'acquisition client estimé ?', type: 'yes_no', weight: 5, category: 'CAC' },
  ],
  3: [
    { id: 'f1', text: 'Avez-vous établi un budget prévisionnel détaillé ?', type: 'yes_no', weight: 7, category: 'Budget' },
    { id: 'f2', text: 'Connaissez-vous votre seuil de rentabilité (en mois et en chiffre d\'affaires) ?', type: 'yes_no', weight: 8, category: 'Seuil' },
    { id: 'f3', text: 'Avez-vous sécurisé ou identifié vos sources de financement ?', type: 'select', weight: 7, category: 'Financement', options: [
      { label: 'Financement déjà obtenu', value: 'secured' },
      { label: 'Financement en cours de négociation', value: 'pending' },
      { label: 'Sources identifiées mais non contactées', value: 'identified' },
      { label: 'Pas encore de source de financement', value: 'none' },
    ]},
  ],
  4: [
    { id: 'c1', text: 'Gestion et organisation', type: 'likert', weight: 6, category: 'Gestion' },
    { id: 'c2', text: 'Vente et négociation', type: 'likert', weight: 6, category: 'Commercial' },
    { id: 'c3', text: 'Marketing et communication', type: 'likert', weight: 5, category: 'Marketing' },
    { id: 'c4', text: 'Gestion financière et comptabilité', type: 'likert', weight: 6, category: 'Finance' },
    { id: 'c5', text: 'Technique et production', type: 'likert', weight: 5, category: 'Technique' },
    { id: 'c6', text: 'Leadership et management', type: 'likert', weight: 5, category: 'Leadership' },
  ],
  5: [
    { id: 'r1', text: 'Disposez-vous d\'un mentor ou d\'un accompagnateur expérimenté ?', type: 'yes_no', weight: 7, category: 'Mentorat' },
    { id: 'r2', text: 'Avez-vous un réseau professionnel pertinent dans votre secteur ?', type: 'select', weight: 6, category: 'Réseau', options: [
      { label: 'Réseau étendu et actif', value: 'strong' },
      { label: 'Réseau modéré', value: 'moderate' },
      { label: 'Début de réseau', value: 'limited' },
      { label: 'Pas de réseau dans ce secteur', value: 'none' },
    ]},
    { id: 'r3', text: 'Bénéficiez-vous d\'un soutien familial ou personnel pour votre projet ?', type: 'yes_no', weight: 4, category: 'Soutien' },
  ],
  6: [
    { id: 'mo1', text: 'Quel est votre niveau de motivation pour ce projet ?', type: 'select', weight: 8, category: 'Motivation', options: [
      { label: 'Très élevé — prêt(e) à tout quitter', value: 'very_high' },
      { label: 'Élevé — fortement engagé(e)', value: 'high' },
      { label: 'Modéré — intéressé(e) mais prudent(e)', value: 'moderate' },
      { label: 'Faible — encore en exploration', value: 'low' },
    ]},
    { id: 'mo2', text: 'Quel est votre niveau de tolérance au risque ?', type: 'select', weight: 6, category: 'Risque', options: [
      { label: 'J\'accepte de prendre des risques calculés', value: 'high' },
      { label: 'Je préfère limiter les risques au maximum', value: 'moderate' },
      { label: 'Je suis très averse au risque', value: 'low' },
    ]},
    { id: 'mo3', text: 'Êtes-vous prêt(e) à consacrer plus de 40h/semaine à votre projet au lancement ?', type: 'yes_no', weight: 5, category: 'Temps' },
  ],
}

// ────────────────────────────────────────────
// Score calculation helpers
// ────────────────────────────────────────────

function calculateStepScore(step: number, responses: Record<string, string | number>): { score: number; max: number; weakAreas: string[] } {
  const questions = QUESTIONS_BY_STEP[step]
  if (!questions) return { score: 0, max: 0, weakAreas: [] }

  let total = 0
  let earned = 0
  const weakAreas: string[] = []

  for (const q of questions) {
    const maxPossible = q.weight
    total += maxPossible
    const answer = responses[q.id]

    if (answer === undefined || answer === '') {
      weakAreas.push(q.category)
      continue
    }

    if (q.type === 'yes_no') {
      if (answer === 'yes') earned += maxPossible
      else weakAreas.push(q.category)
    } else if (q.type === 'select') {
      const optIndex = q.options?.findIndex((o) => o.value === answer) ?? -1
      const totalOpts = q.options?.length ?? 1
      const ratio = (totalOpts - optIndex) / totalOpts
      earned += Math.round(maxPossible * ratio)
      if (optIndex < totalOpts / 2) weakAreas.push(q.category)
    } else if (q.type === 'likert') {
      const likertVal = Number(answer) || 1
      earned += Math.round(maxPossible * (likertVal / 5))
      if (likertVal < 3) weakAreas.push(q.category)
    }
  }

  return {
    score: earned,
    max: total,
    weakAreas: [...new Set(weakAreas)],
  }
}

function calculateTotalScore(responses: Record<string, string | number>): { score: number; decision: Decision; recommendations: string[]; stepScores: Record<number, { score: number; max: number }> } {
  const stepScores: Record<number, { score: number; max: number }> = {}
  let totalEarned = 0
  let totalMax = 0
  const allWeakAreas: string[] = []

  for (let step = 1; step <= 6; step++) {
    const result = calculateStepScore(step, responses)
    stepScores[step] = { score: result.score, max: result.max }
    totalEarned += result.score
    totalMax += result.max
    allWeakAreas.push(...result.weakAreas)
  }

  const percent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0
  const decision: Decision = percent >= 70 ? 'GO' : percent >= 50 ? 'GO_CONDITIONAL' : 'NO_GO'

  const recommendations = generateRecommendations(decision, [...new Set(allWeakAreas)])

  return { score: percent, decision, recommendations, stepScores }
}

function generateRecommendations(decision: Decision, weakAreas: string[]): string[] {
  const recs: string[] = []

  if (decision === 'NO_GO') {
    recs.push('Votre projet nécessite une maturation supplémentaire avant le lancement. Prenez le temps de valider chaque dimension.')
  } else if (decision === 'GO_CONDITIONAL') {
    recs.push('Vous êtes sur la bonne voie, mais certains aspects nécessitent votre attention avant de passer à l\'action.')
  } else {
    recs.push('Félicitations ! Votre projet semble prêt pour le lancement. Passez à l\'étape suivante avec confiance.')
  }

  const areaRecs: Record<string, string> = {
    'Marché': 'Approfondissez votre étude de marché et identifiez plus précisément votre client cible.',
    'Validation': 'Réalisez des entretiens avec au moins 10 clients potentiels pour valider votre idée.',
    'Demande': 'Recherchez des signaux de marché positifs (pré-commandes, lettres d\'intention, sondages).',
    'Ciblage': 'Définissez vos personas clients et identifiez vos early adopters.',
    'Revenus': 'Clarifiez vos sources de revenus et testez la disposition à payer de vos clients.',
    'Différenciation': 'Affinez votre proposition de valeur pour vous démarquer de la concurrence.',
    'Viabilité': 'Validez la viabilité de votre modèle à 3 ans avec des données réelles.',
    'CAC': 'Estimez votre coût d\'acquisition client et comparez-le à la valeur client attendue.',
    'Budget': 'Élaborez un budget prévisionnel sur 12 mois minimum.',
    'Seuil': 'Calculez précisément votre seuil de rentabilité en mois et en CA.',
    'Financement': 'Rencontrez des banques et investisseurs pour sécuriser votre financement.',
    'Gestion': 'Renforcez vos compétences en gestion et organisation (formation, lecture, mentorat).',
    'Commercial': 'Développez vos compétences en vente et négociation commerciale.',
    'Marketing': 'Formez-vous au marketing digital et à la communication de votre marque.',
    'Finance': 'Suivez une formation en gestion financière ou rapprochez-vous d\'un expert-comptable.',
    'Technique': 'Identifiez les compétences techniques manquantes et trouvez des partenaires.',
    'Leadership': 'Développez votre leadership par le coaching ou le mentorat.',
    'Mentorat': 'Trouvez un mentor ou un conseiller pour vous accompagner dans votre parcours.',
    'Réseau': 'Élargissez votre réseau professionnel (événements, salons, plateformes en ligne).',
    'Soutien': 'Discutez de votre projet avec votre entourage pour obtenir leur soutien.',
    'Motivation': 'Confirmez votre motivation en réalisant un test de projet pilote ou MVP.',
    'Risque': 'Préparez un plan B et évaluez le pire scénario pour réduire l\'incertitude.',
    'Temps': 'Assurez-vous d\'avoir suffisamment de temps disponible pour votre projet.',
  }

  for (const area of weakAreas) {
    if (areaRecs[area]) recs.push(areaRecs[area])
  }

  return recs.slice(0, 8)
}

// ────────────────────────────────────────────
// Animation variants
// ────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
}

const fadeVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function Tremplin() {
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(0)
  const [responses, setResponses] = useState<Record<string, string | number>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [finalScore, setFinalScore] = useState<{ score: number; decision: Decision; recommendations: string[]; stepScores: Record<number, { score: number; max: number }> } | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const { setContext: setVoiceContext } = useTradEmploi()

  // Load saved progress
  useEffect(() => {
    const loadProgress = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const data = JSON.parse(saved)
          if (data.responses) setResponses(data.responses)
          if (data.currentStep) setCurrentStep(data.currentStep)
          if (data.isCompleted) {
            setIsCompleted(true)
            setFinalScore(data.finalScore)
          }
        }
      } catch {
        // ignore
      }
      setLoading(false)
    }
    loadProgress()
  }, [])

  // Auto-save
  useEffect(() => {
    if (loading) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentStep,
      responses,
      isCompleted,
      finalScore,
    }))
  }, [currentStep, responses, isCompleted, finalScore, loading])

  // ─── Voice context ──────────────────────
  useEffect(() => {
    const stepConfig = STEPS[currentStep - 1]
    setVoiceContext({ module: 'tremplin', section: stepConfig?.title || `étape ${currentStep}` })
    return () => setVoiceContext({ module: '' })
  }, [currentStep, setVoiceContext])

  const setAnswer = useCallback((questionId: string, value: string | number) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  const goNext = () => {
    if (currentStep < 7) {
      setDirection(1)
      setCurrentStep((s) => s + 1)
    }
  }

  const goPrev = () => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep((s) => s - 1)
    }
  }

  const handleFinish = () => {
    const result = calculateTotalScore(responses)
    setFinalScore(result)
    setIsCompleted(true)
    setDirection(1)
    setCurrentStep(7)
    saveToApi(result)
  }

  const saveToApi = async (result: typeof finalScore) => {
    if (!result) return
    setSaving(true)
    try {
      await fetch('/api/tremplin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentStep: 7,
          responses,
          isCompleted: true,
          score: result.score,
          decision: result.decision,
          summary: `Score: ${result.score}/100 — Décision: ${result.decision}`,
          recommendations: result.recommendations,
        }),
      })
      toast.success('Évaluation Tremplin sauvegardée !')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleRestart = () => {
    setResponses({})
    setCurrentStep(1)
    setIsCompleted(false)
    setFinalScore(null)
    setDirection(0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const questions = QUESTIONS_BY_STEP[currentStep]
  const stepConfig = STEPS[currentStep - 1]
  const allAnswered = questions?.every((q) => responses[q.id] !== undefined && responses[q.id] !== '') ?? true

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
          <Rocket className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tremplin — Évaluation de Préparation</h2>
          <p className="text-sm text-muted-foreground">Mesurez votre préparation au lancement de votre entreprise</p>
        </div>
      </div>

      {/* Progress bar + Steps */}
      <div className="mb-8">
        <Progress value={(currentStep / 7) * 100} className="h-2 mb-3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {STEPS.map((step) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isDone = step.id < currentStep || isCompleted
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (isDone || step.id <= currentStep) {
                      setDirection(step.id > currentStep ? 1 : -1)
                      setCurrentStep(step.id)
                    }
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all shrink-0',
                    isActive && 'bg-primary text-primary-foreground shadow-sm',
                    isDone && !isActive && 'bg-primary/10 text-primary',
                    !isDone && !isActive && 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">Étape {step.id}</span>
                </button>
              )
            })}
          </div>
          <Badge variant="outline" className="shrink-0 text-xs">
            {currentStep}/7
          </Badge>
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {currentStep < 7 ? (
            <QuestionStep
              step={currentStep}
              config={stepConfig}
              questions={questions}
              responses={responses}
              setAnswer={setAnswer}
            />
          ) : (
            <SynthesisStep
              score={finalScore}
              responses={responses}
              saving={saving}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="ghost" size="sm" onClick={goPrev} disabled={currentStep === 1} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Précédent
        </Button>

        <div className="flex gap-2">
          {isCompleted && (
            <Button variant="outline" size="sm" onClick={handleRestart} className="gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Recommencer
            </Button>
          )}
          {currentStep < 6 ? (
            <Button size="sm" onClick={goNext} disabled={!allAnswered} className="gap-1.5 rounded-full">
              Suivant
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : currentStep === 6 ? (
            <Button size="sm" onClick={handleFinish} disabled={!allAnswered} className="gap-1.5 rounded-full">
              Voir la synthèse
              <Zap className="h-4 w-4" />
            </Button>
          ) : null}
          {saving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
      </div>
    </motion.div>
  )
}

// ────────────────────────────────────────────
// Question Step
// ────────────────────────────────────────────

function QuestionStep({
  step,
  config,
  questions,
  responses,
  setAnswer,
}: {
  step: number
  config: StepConfig
  questions: Question[]
  responses: Record<string, string | number>
  setAnswer: (id: string, value: string | number) => void
}) {
  const Icon = config.icon

  return (
    <Card className="border-none shadow-sm bg-muted/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{config.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q, idx) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="space-y-3"
          >
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {q.text}
            </p>

            {q.type === 'yes_no' && (
              <div className="flex gap-3">
                {['yes', 'no'].map((opt) => {
                  const isSelected = responses[q.id] === opt
                  return (
                    <motion.button
                      key={opt}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAnswer(q.id, opt)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border-2 transition-all',
                        isSelected
                          ? opt === 'yes'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          : 'border-muted hover:border-muted-foreground/30 text-muted-foreground'
                      )}
                    >
                      {opt === 'yes' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {opt === 'yes' ? 'Oui' : 'Non'}
                    </motion.button>
                  )
                })}
              </div>
            )}

            {q.type === 'select' && q.options && (
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => {
                  const isSelected = responses[q.id] === opt.value
                  return (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setAnswer(q.id, opt.value)}
                      className={cn(
                        'w-full text-left rounded-xl px-4 py-2.5 text-sm font-medium border-2 transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-muted hover:border-muted-foreground/30 text-muted-foreground'
                      )}
                    >
                      {opt.label}
                    </motion.button>
                  )
                })}
              </div>
            )}

            {q.type === 'likert' && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isSelected = responses[q.id] === val
                  return (
                    <motion.button
                      key={val}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAnswer(q.id, val)}
                      className={cn(
                        'flex-1 flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium border-2 transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-muted hover:border-muted-foreground/30 text-muted-foreground'
                      )}
                    >
                      <span className="text-base font-bold">{val}</span>
                      <span className="text-[10px]">{val === 1 ? 'Faible' : val === 5 ? 'Excellent' : ''}</span>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {idx < questions.length - 1 && <Separator className="mt-4" />}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}

// ────────────────────────────────────────────
// Synthesis Step (Results)
// ────────────────────────────────────────────

function SynthesisStep({
  score,
  responses,
  saving,
}: {
  score: typeof finalScore
  responses: Record<string, string | number>
  saving: boolean
}) {
  const liveScore = score ?? calculateTotalScore(responses)
  const decision = liveScore.decision

  const decisionConfig = {
    GO: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2, label: 'GO — Prêt à lancer !', description: 'Votre projet présente un niveau de préparation suffisant pour entamer la création de votre entreprise.' },
    GO_CONDITIONAL: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: AlertTriangle, label: 'GO CONDITIONNEL — Presque prêt', description: 'Votre projet est prometteur mais nécessite des améliorations sur certains points avant le lancement.' },
    NO_GO: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle, label: 'NO GO — Maturation nécessaire', description: 'Votre projet nécessite davantage de travail de préparation. Consultez les recommandations ci-dessous.' },
  }

  const dc = decisionConfig[decision]
  const DecIcon = dc.icon

  // Gauge component
  const gaugeAngle = (liveScore.score / 100) * 180
  const gaugeRadius = 80
  const gaugeCx = 100
  const gaugeCy = 100

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const angleRad = ((angleDeg - 180) * Math.PI) / 180
    return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) }
  }

  function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Score Gauge */}
      <Card className="border-none shadow-md overflow-hidden">
        <div className={cn('h-1.5', decision === 'GO' ? 'bg-emerald-500' : decision === 'GO_CONDITIONAL' ? 'bg-amber-500' : 'bg-red-500')} />
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* SVG Gauge */}
            <div className="relative">
              <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible" role="img" aria-label={`Jauge de décision : ${liveScore.score} sur 100`}>
                <title>Jauge de décision : {liveScore.score}/100</title>
                {/* Background arc */}
                <path
                  d={describeArc(gaugeCx, gaugeCy, gaugeRadius, 0, 180)}
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Score arc */}
                <motion.path
                  d={describeArc(gaugeCx, gaugeCy, gaugeRadius, 0, Math.max(1, gaugeAngle))}
                  fill="none"
                  stroke={decision === 'GO' ? '#22C55E' : decision === 'GO_CONDITIONAL' ? '#F59E0B' : '#EF4444'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
                {/* Score text */}
                <text x={gaugeCx} y={gaugeCy - 10} textAnchor="middle" className="text-3xl font-bold" fill="hsl(var(--foreground))">
                  {liveScore.score}
                </text>
                <text x={gaugeCx} y={gaugeCy + 15} textAnchor="middle" className="text-sm" fill="hsl(var(--muted-foreground))">
                  / 100
                </text>
              </svg>
            </div>

            {/* Decision */}
            <div className="flex-1 text-center md:text-left">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                className={cn('inline-flex items-center gap-2 rounded-xl px-4 py-2 mb-3', dc.bg)}
              >
                <DecIcon className={cn('h-5 w-5', dc.color)} />
                <span className={cn('font-semibold text-sm', dc.color)}>{dc.label}</span>
              </motion.div>
              <p className="text-sm text-muted-foreground leading-relaxed">{dc.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step scores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STEPS.slice(0, 6).map((step, idx) => {
          const ss = liveScore.stepScores[step.id]
          const pct = ss ? Math.round((ss.score / ss.max) * 100) : 0
          const Icon = step.icon
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.08 }}
            >
              <Card className="border-none shadow-sm">
                <CardContent className="p-3 text-center">
                  <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground mb-1.5 line-clamp-1">{step.title}</p>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + idx * 0.1 }}
                      className={cn(
                        'h-full rounded-full',
                        pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                    />
                  </div>
                  <p className="text-xs font-semibold mt-1.5">{pct}%</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Recommendations */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {liveScore.recommendations.map((rec, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <div className={cn(
                  'mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold',
                  idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {idx + 1}
                </div>
                <span className="leading-relaxed">{rec}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  )
}
