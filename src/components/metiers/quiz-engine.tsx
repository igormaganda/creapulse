'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  Trophy,
  Target,
  Star,
  Loader2,
} from 'lucide-react'
import type { CategoryData } from '@/lib/metiers-data'

interface QuizEngineProps {
  category: CategoryData
}

type QuizStep = 'intro' | 'playing' | 'results-preview' | 'lead-form' | 'results-full'

export function QuizEngine({ category }: QuizEngineProps) {
  const [step, setStep] = useState<QuizStep>('intro')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [competencyScores, setCompetencyScores] = useState<number[]>([])
  const [topResults, setTopResults] = useState<{ title: string; description: string; match: number }[]>([])
  const [leadForm, setLeadForm] = useState({ prenom: '', email: '', telephone: '', ville: '', age: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animateDirection, setAnimateDirection] = useState<'forward' | 'backward'>('forward')

  const totalQuestions = category.quizQuestions.length
  const progress = step === 'playing' ? ((currentQuestion + 1) / totalQuestions) * 100 : step === 'lead-form' ? 90 : 100

  const handleStart = () => {
    setStep('playing')
    setCurrentQuestion(0)
    setAnswers([])
  }

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex]
    setAnswers(newAnswers)

    if (currentQuestion < totalQuestions - 1) {
      setAnimateDirection('forward')
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 150)
    } else {
      // Calculate results
      calculateResults(newAnswers)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setAnimateDirection('backward')
      setAnswers(prev => prev.slice(0, -1))
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const calculateResults = (finalAnswers: number[]) => {
    const competencies = category.competencies
    const scores = new Array(competencies.length).fill(0)
    const answerCounts = new Array(competencies.length).fill(0)

    finalAnswers.forEach((answerIdx, questionIdx) => {
      const question = category.quizQuestions[questionIdx]
      const optionScores = question.scores[answerIdx]
      optionScores.forEach((score, compIdx) => {
        scores[compIdx] += score
        answerCounts[compIdx]++
      })
    })

    // Normalize scores to 0-100
    const normalizedScores = scores.map((s, i) =>
      answerCounts[i] > 0 ? Math.round((s / (answerCounts[i] * 5)) * 100) : 0
    )

    // Calculate match percentages for each result (deterministic)
    const avgScore = normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length
    const resultsWithMatch = category.quizResults.map((result, idx) => ({
      ...result,
      match: Math.min(98, Math.max(60, result.match + Math.round((avgScore - 65) * 0.3))),
    })).sort((a, b) => b.match - a.match)

    setCompetencyScores(normalizedScores)
    setTopResults(resultsWithMatch)
    setStep('results-preview')
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const ageNum = leadForm.age ? parseInt(leadForm.age, 10) : null
      const response = await fetch('/api/metiers/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: leadForm.prenom,
          email: leadForm.email,
          telephone: leadForm.telephone || null,
          ville: leadForm.ville || null,
          age: ageNum,
          metierCategory: category.slug,
          quizResults: Object.fromEntries(
            category.competencies.map((comp, idx) => [comp, competencyScores[idx]])
          ),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData?.error?.message || 'Une erreur est survenue lors de l\'enregistrement'
        toast.error(message)
        return
      }

      toast.success('Analyse enregistrée avec succès !')
      setStep('results-full')
    } catch {
      toast.error('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Intro screen
  if (step === 'intro') {
    return (
      <section id="quiz" className="scroll-mt-20">
        <Card className="overflow-hidden border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5">
          <CardHeader className="pb-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
            >
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">{category.quizTitle}</CardTitle>
            <CardDescription className="text-base">
              Réponds à {totalQuestions} questions et découvre les métiers qui correspondent à ton profil.
              L&apos;IA analyse tes compétences et te propose un matching personnalisé.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {category.competencies.map((comp) => (
                <Badge key={comp} variant="secondary" className="text-xs">
                  {comp}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Target className="h-4 w-4" />{totalQuestions} questions</span>
              <span className="flex items-center gap-1"><Star className="h-4 w-4" />Résultats instantanés</span>
              <span className="flex items-center gap-1"><Sparkles className="h-4 w-4" />100% gratuit</span>
            </div>
            <Button size="lg" className="mt-2 gap-2 text-base" onClick={handleStart}>
              Commencer le test
              <ArrowRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  // Playing screen
  if (step === 'playing') {
    const question = category.quizQuestions[currentQuestion]

    return (
      <section id="quiz" className="scroll-mt-20">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Question {currentQuestion + 1} / {totalQuestions}</span>
            <span className="font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: animateDirection === 'forward' ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: animateDirection === 'forward' ? -40 : 40 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-xl leading-relaxed">{question.text}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {question.options.map((option, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleAnswer(idx)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left text-sm transition-all hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>
        </div>
      </section>
    )
  }

  // Results preview (teaser + lead gate)
  if (step === 'results-preview' || step === 'lead-form') {
    const topResult = topResults[0]
    return (
      <section id="quiz" className="scroll-mt-20">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Analyse terminée</span>
            <span className="font-medium text-primary">90%</span>
          </div>
          <Progress value={90} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          {step === 'results-preview' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5">
                <CardHeader className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"
                  >
                    <Trophy className="h-7 w-7 text-primary" />
                  </motion.div>
                  <CardTitle className="text-2xl">Ton profil a été analysé !</CardTitle>
                  <CardDescription className="text-base">
                    L&apos;IA a identifié <span className="font-semibold text-foreground">{topResult?.title}</span> comme métier idéal pour toi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Mini radar */}
                  <div className="mx-auto max-w-xs">
                    <RadarChart scores={competencyScores} labels={category.competencies} size={220} />
                  </div>

                  {/* Top 3 preview (blurred) */}
                  <div className="space-y-2">
                    {topResults.slice(0, 3).map((result, idx) => (
                      <div key={result.title} className={`flex items-center gap-3 rounded-xl border p-3 ${idx === 0 ? 'border-primary/30 bg-primary/5' : 'border-border opacity-60 blur-[1px]'}`}>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{idx === 0 ? result.title : '••••••'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {idx === 0 ? `${result.match}% de compatibilité` : 'Résultat masqué'}
                          </p>
                        </div>
                        {idx === 0 && (
                          <Badge className="bg-primary shrink-0">{result.match}%</Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <p className="mb-4 text-sm text-muted-foreground">
                      Recevez votre analyse complète avec tous les résultats, conseils personnalisés et les formations adaptées.
                    </p>
                    <Button size="lg" className="gap-2" onClick={() => setStep('lead-form')}>
                      <Mail className="h-4 w-4" />
                      Recevoir mon analyse complète
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Accédez à vos résultats complets</CardTitle>
                  <CardDescription>
                    Renseignez vos coordonnées pour recevoir votre analyse IA personnalisée.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-sm font-medium">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          Prénom
                        </label>
                        <Input
                          placeholder="Votre prénom"
                          value={leadForm.prenom}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, prenom: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-sm font-medium">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          Âge
                        </label>
                        <Input
                          type="number"
                          placeholder="Votre âge"
                          value={leadForm.age}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, age: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-sm font-medium">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        Email
                      </label>
                      <Input
                        type="email"
                        placeholder="votre@email.com"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-sm font-medium">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          Téléphone
                        </label>
                        <Input
                          type="tel"
                          placeholder="06 XX XX XX XX"
                          value={leadForm.telephone}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, telephone: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-sm font-medium">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          Ville
                        </label>
                        <Input
                          placeholder="Votre ville"
                          value={leadForm.ville}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, ville: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyse en cours...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Voir mes résultats complets
                          </>
                        )}
                      </Button>
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        Vos données sont protégées et ne seront pas partagées.
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    )
  }

  // Full results
  if (step === 'results-full') {
    return (
      <section id="quiz" className="scroll-mt-20">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-primary">Analyse terminée</span>
            <span className="font-medium text-primary">100%</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
              >
                <Trophy className="h-8 w-8 text-primary" />
              </motion.div>
              <CardTitle className="text-2xl">Voici ton profil métier !</CardTitle>
              <CardDescription className="text-base">
                Merci {leadForm.prenom} ! Voici ton analyse IA personnalisée.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Radar chart */}
              <div className="mx-auto max-w-sm">
                <RadarChart scores={competencyScores} labels={category.competencies} size={250} />
              </div>

              {/* Competency bars */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Tes compétences analysées :</p>
                {category.competencies.map((comp, idx) => (
                  <div key={comp} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{comp}</span>
                      <span className="font-medium text-primary">{competencyScores[idx]}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${competencyScores[idx]}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Top results */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Métiers compatibles avec ton profil :</p>
                {topResults.map((result, idx) => (
                  <motion.div
                    key={result.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.15 }}
                    className={`flex items-center gap-3 rounded-xl border p-4 ${idx === 0 ? 'border-primary/40 bg-primary/5' : 'border-border'}`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{result.title}</p>
                      <p className="text-sm text-muted-foreground">{result.description}</p>
                    </div>
                    <Badge variant={idx === 0 ? 'default' : 'secondary'} className="shrink-0 text-sm">
                      {result.match}%
                    </Badge>
                  </motion.div>
                ))}
              </div>

              <Separator />

              {/* CTA */}
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium">Ton analyse a été envoyée à {leadForm.email}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button size="lg" className="gap-2">
                    <Phone className="h-4 w-4" />
                    Être recontacté par un conseiller
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2" onClick={handleStart}>
                    <ArrowLeft className="h-4 w-4" />
                    Refaire le test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    )
  }

  return null
}

/* ─────────────────────────────────────────────
   SVG Radar Chart Component
   ───────────────────────────────────────────── */
function RadarChart({ scores, labels, size = 220 }: { scores: number[]; labels: string[]; size?: number }) {
  const center = size / 2
  const maxRadius = size / 2 - 40
  const levels = 4
  const n = scores.length

  // Calculate polygon points
  const getPolygonPoints = (radius: number) => {
    return Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      }
    })
  }

  const dataPoints = getPolygonPoints(maxRadius * 0.85)

  return (
    <svg viewBox={`0 0 ${size} ${size + 30}`} className="w-full">
      {/* Grid levels */}
      {Array.from({ length: levels }, (_, level) => {
        const radius = (maxRadius * (level + 1)) / levels
        const points = getPolygonPoints(radius)
        const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ')
        return (
          <polygon
            key={level}
            points={pointsStr}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-muted-foreground/30"
          />
        )
      })}

      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        const x = center + maxRadius * Math.cos(angle)
        const y = center + maxRadius * Math.sin(angle)
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-muted-foreground/20"
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={dataPoints.map((p, i) => {
          const score = scores[i] / 100
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2
          const r = maxRadius * 0.85 * score
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
        }).join(' ')}
        fill="hsl(var(--primary) / 0.15)"
        stroke="hsl(var(--primary))"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((_, i) => {
        const score = scores[i] / 100
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        const r = maxRadius * 0.85 * score
        return (
          <circle
            key={i}
            cx={center + r * Math.cos(angle)}
            cy={center + r * Math.sin(angle)}
            r={4}
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth={2}
          />
        )
      })}

      {/* Labels */}
      {labels.map((label, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        const labelRadius = maxRadius + 20
        const x = center + labelRadius * Math.cos(angle)
        const y = center + labelRadius * Math.sin(angle) + size + 15
        return (
          <text
            key={i}
            x={center + labelRadius * Math.cos(angle)}
            y={center + labelRadius * Math.sin(angle) + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-[10px] font-medium"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}
