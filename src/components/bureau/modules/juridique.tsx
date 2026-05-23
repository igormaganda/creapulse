'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Scale,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Loader2,
  RotateCcw,
  Building2,
  Shield,
  FileCheck,
  ArrowRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Questionnaire ──────────────────────────

interface Question {
  id: string
  title: string
  description: string
  options: {
    value: string
    label: string
    explanation: string
  }[]
}

const QUESTIONS: Question[] = [
  {
    id: 'activityType',
    title: 'Quel est le type de votre activité ?',
    description: 'La nature de votre activité influence le choix du statut juridique.',
    options: [
      { value: 'service', label: 'Service', explanation: 'Conseil, formation, prestation intellectuelle...' },
      { value: 'commerce', label: 'Commerce', explanation: 'Achat-revente de biens, négoce...' },
      { value: 'artisanat', label: 'Artisanat', explanation: 'Activité manuelle, métier d\'art, BTP...' },
      { value: 'tech', label: 'Tech / Innovation', explanation: 'Développement logiciel, SaaS, startup tech...' },
      { value: 'restauration', label: 'Restauration / Alimentaire', explanation: 'Restaurant, traiteur, commerce alimentaire...' },
    ],
  },
  {
    id: 'associatesCount',
    title: 'Combien d\'associés prévoyez-vous ?',
    description: 'Le nombre d\'associés détermine les formes juridiques possibles.',
    options: [
      { value: 'solo', label: 'Seul (auto-entrepreneur ou société unipersonnelle)', explanation: 'Vous serez le seul dirigeant et associé.' },
      { value: '2-5', label: '2 à 5 associés', explanation: 'Projet en petite équipe avec quelques cofondateurs.' },
      { value: '6+', label: 'Plus de 5 associés', explanation: 'Projet ambitieux avec plusieurs investisseurs ou cofondateurs.' },
    ],
  },
  {
    id: 'initialCapital',
    title: 'Quel capital initial pouvez-vous apporter ?',
    description: 'Le capital social varie selon les formes juridiques.',
    options: [
      { value: 'none', label: 'Aucun apport', explanation: 'Démarrage avec 0 € de capital initial.' },
      { value: 'low', label: 'Moins de 1 000 €', explanation: 'Apport symbolique ou très modeste.' },
      { value: 'medium', label: '1 000 € à 10 000 €', explanation: 'Apport modéré pour les premiers investissements.' },
      { value: 'high', label: 'Plus de 10 000 €', explanation: 'Capital conséquent pour un démarrage solide.' },
    ],
  },
  {
    id: 'revenueForecast',
    title: 'Quel est votre chiffre d\'affaires prévisionnel (année 1) ?',
    description: 'Le CA influence le régime fiscal et les charges sociales.',
    options: [
      { value: 'low', label: 'Moins de 30 000 €', explanation: 'Démarrage progressif, activité complémentaire.' },
      { value: 'medium', label: '30 000 € à 70 000 €', explanation: 'Activité à temps plein, revenus décents.' },
      { value: 'high', label: 'Plus de 70 000 €', explanation: 'Ambition de croissance rapide.' },
    ],
  },
  {
    id: 'liabilityPreference',
    title: 'Comment gérez-vous la responsabilité ?',
    description: 'Protéger votre patrimoine personnel est souvent recommandé.',
    options: [
      { value: 'limited', label: 'Responsabilité limitée (protéger mon patrimoine)', explanation: 'En cas de problème, seuls les apports au capital sont engagés.' },
      { value: 'unlimited', label: 'Responsabilité illimitée (peu m\'importe)', explanation: 'Votre patrimoine personnel peut être engagé, mais formalités simplifiées.' },
    ],
  },
  {
    id: 'socialRegime',
    title: 'Préférez-vous quel régime social pour le dirigeant ?',
    description: 'Le régime social impacte vos cotisations et votre couverture.',
    options: [
      { value: 'salaried', label: 'Assimilé salarié (SAS/SASU)', explanation: 'Cotisations plus élevées mais meilleure couverture sociale (chômage, retraite).' },
      { value: 'independent', label: 'Travailleur non-salarié (EI/EURL/SARL)', explanation: 'Cotisations plus faibles mais couverture réduite.' },
      { value: 'no-preference', label: 'Pas de préférence', explanation: 'Je choisis en fonction des autres critères.' },
    ],
  },
  {
    id: 'vatRegime',
    title: 'Concernant la TVA, que préférez-vous ?',
    description: 'Le régime de TVA dépend de votre CA et de votre activité.',
    options: [
      { value: 'exempt', label: 'Franchise de TVA', explanation: 'Pas de TVA collectée ni déductible. Simplifié mais limité en CA.' },
      { value: 'simplified', label: 'Régime simplifié', explanation: 'Déclarations annuelles, TVA déductible.' },
      { value: 'real', label: 'Régime réel normal', explanation: 'Déclarations mensuelles, adapté aux gros volumes.' },
    ],
  },
  {
    id: 'growthPlans',
    title: 'Quels sont vos plans de croissance ?',
    description: 'La capacité à accueillir de nouveaux associés est cruciale pour la croissance.',
    options: [
      { value: 'steady', label: 'Croissance stable et progressive', explanation: 'Activité pérenne sans recherche d\'investisseurs.' },
      { value: 'rapid', label: 'Croissance rapide (levée de fonds envisagée)', explanation: 'Besoin de flexibilité pour accueillir des investisseurs.' },
    ],
  },
]

// ─── Status info for comparison ──────────────

const STATUS_INFO = [
  {
    name: 'Micro-entreprise',
    capital: 'Aucun',
    associates: '1',
    regime: 'Micro-BIC / Micro-BNC',
    social: 'TNS',
    liability: 'Illimitée',
    advantages: ['Simplicité', 'Faibles charges', 'Pas de comptabilité complexe'],
    disadvantages: ['Pas de protection du patrimoine', 'Plafonds de CA', 'Pas de déduction des charges'],
    color: '#10B981',
  },
  {
    name: 'EURL',
    capital: '1 € minimum',
    associates: '1',
    regime: 'IR (option IS possible)',
    social: 'TNS',
    liability: 'Limitée au capital',
    advantages: ['Protection du patrimoine', 'Flexibilité', 'Choix fiscal'],
    disadvantages: ['Charges sociales élevées', 'Formalités', 'Pas d\'assurance chômage'],
    color: '#00838F',
  },
  {
    name: 'SARL',
    capital: '1 € minimum',
    associates: '2-100',
    regime: 'IR (option IS possible)',
    social: 'TNS (gérant majoritaire)',
    liability: 'Limitée au capital',
    advantages: ['Protection du patrimoine', 'Fiable et classique', 'Cédibilité'],
    disadvantages: ['Charges sociales', 'Formalités comptables', 'Décisions conjointes'],
    color: '#FF6B35',
  },
  {
    name: 'SASU',
    capital: '1 € minimum',
    associates: '1',
    regime: 'IS',
    social: 'Assimilé salarié',
    liability: 'Limitée au capital',
    advantages: ['Statut du dirigeant', 'Protection sociale', 'Flexibilité'],
    disadvantages: ['Charges sociales très élevées', 'Comptabilité complexe', 'IS obligatoire'],
    color: '#8B5CF6',
  },
  {
    name: 'SAS',
    capital: '1 € minimum',
    associates: '2+',
    regime: 'IS',
    social: 'Assimilé salarié',
    liability: 'Limitée au capital',
    advantages: ['Statut salarié', 'Facilité levée de fonds', 'Flexible'],
    disadvantages: ['Charges sociales très élevées', 'Formalités', 'IS obligatoire'],
    color: '#EF4444',
  },
]

// ─── Types ──────────────────────────────────

interface Recommendation {
  recommended: string
  scores: Record<string, number>
  fiscalRegime: string
  socialCharges: {
    micro: number
    eurl: number
    sarl: number
    sasu: number
  }
}

interface NextStep {
  id: string
  text: string
  checked: boolean
}

const DEFAULT_STEPS: NextStep[] = [
  { id: '1', text: 'Confirmer le choix du statut juridique avec un conseiller GIDEF', checked: false },
  { id: '2', text: 'Rédiger les statuts de la société (ou effectuer la déclaration pour micro-entreprise)', checked: false },
  { id: '3', text: 'Ouvrir un compte bancaire professionnel', checked: false },
  { id: '4', text: 'Déposer le capital social (si société)', checked: false },
  { id: '5', text: 'Publier une annonce légale de constitution', checked: false },
  { id: '6', text: 'Immatriculer l\'entreprise au Greffe / CFE', checked: false },
  { id: '7', text: 'Obtenir le KBIS (ou extrait K pour micro-entreprise)', checked: false },
  { id: '8', text: 'Souscrire une assurance professionnelle adaptée', checked: false },
]

// ─── Main Component ─────────────────────────

export function JuridiqueModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResult, setShowResult] = useState(false)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [nextSteps, setNextSteps] = useState<NextStep[]>(DEFAULT_STEPS)

  // ─── Load saved data ───────────────────
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('creapulse-juridique')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.answers && Object.keys(parsed.answers).length > 0) {
            setAnswers(parsed.answers)
            setCurrentQuestion(Object.keys(parsed.answers).length)
            if (parsed.recommendation) setRecommendation(parsed.recommendation)
            if (parsed.showResult) setShowResult(parsed.showResult)
            if (parsed.nextSteps) setNextSteps(parsed.nextSteps)
          }
        } catch { /* ignore */ }
      }

      try {
        const res = await fetch('/api/juridique')
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            if (json.data.legalStructure) {
              try {
                const structure = typeof json.data.legalStructure === 'string'
                  ? JSON.parse(json.data.legalStructure)
                  : json.data.legalStructure
                if (structure.answers) setAnswers(structure.answers)
                if (structure.recommended) {
                  setRecommendation({
                    recommended: structure.recommended,
                    scores: structure.scores || {},
                    fiscalRegime: json.data.fiscalRegime || 'IR',
                    socialCharges: json.data.socialCharges || { micro: 0, eurl: 0, sarl: 0, sasu: 0 },
                  })
                  setShowResult(true)
                  setCurrentQuestion(QUESTIONS.length)
                }
              } catch { /* ignore */ }
            }
          }
        }
      } catch { /* ignore */ }

      setIsLoading(false)
    }
    load()
  }, [])

  // ─── Auto-save ─────────────────────────
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('creapulse-juridique', JSON.stringify({
        answers, recommendation, showResult, nextSteps,
      }))
    }
  }, [isLoading, answers, recommendation, showResult, nextSteps])

  // ─── Select answer ─────────────────────
  const selectAnswer = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }, [])

  // ─── Navigate ──────────────────────────
  const goNext = useCallback(() => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }, [currentQuestion])

  const goPrev = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }, [currentQuestion])

  // ─── Generate recommendation ──────────
  const handleGenerate = useCallback(async () => {
    const unanswered = QUESTIONS.findIndex(q => !answers[q.id])
    if (unanswered !== -1) {
      setCurrentQuestion(unanswered)
      toast.error(`Veuillez répondre à toutes les questions (question ${unanswered + 1} non répondue)`)
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch('/api/juridique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setRecommendation(json.data.recommendation)
        setShowResult(true)
        toast.success('Recommandation générée !')
      } else {
        toast.error(json.error?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setIsGenerating(false)
    }
  }, [answers])

  // ─── Reset ────────────────────────────
  const handleReset = useCallback(() => {
    setAnswers({})
    setCurrentQuestion(0)
    setShowResult(false)
    setRecommendation(null)
    setNextSteps(DEFAULT_STEPS)
    localStorage.removeItem('creapulse-juridique')
    toast.info('Questionnaire réinitialisé')
  }, [])

  // ─── Toggle next step ─────────────────
  const toggleStep = useCallback((id: string) => {
    setNextSteps(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s))
  }, [])

  // ─── Computed ─────────────────────────
  const progressPercent = useMemo(() => {
    return Math.round((Object.keys(answers).length / QUESTIONS.length) * 100)
  }, [answers])

  const socialChargesData = useMemo(() => {
    if (!recommendation) return []
    return [
      { name: 'Micro', charges: recommendation.socialCharges.micro, color: '#10B981' },
      { name: 'EURL', charges: recommendation.socialCharges.eurl, color: '#00838F' },
      { name: 'SARL', charges: recommendation.socialCharges.sarl, color: '#FF6B35' },
      { name: 'SASU', charges: recommendation.socialCharges.sasu, color: '#8B5CF6' },
    ]
  }, [recommendation])

  const stepsCompleted = useMemo(() => nextSteps.filter(s => s.checked).length, [nextSteps])

  const question = QUESTIONS[currentQuestion]

  // ─── Loading ──────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  // ─── Main Render ──────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:px-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00838F]/10">
            <Scale className="h-5 w-5 text-[#00838F]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Analyse Juridique</h2>
            <p className="text-xs text-muted-foreground">
              {showResult ? 'Recommandation générée' : `Question ${currentQuestion + 1}/${QUESTIONS.length} — ${progressPercent}%`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showResult && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Recommencer
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!showResult ? (
            /* ── Questionnaire View ── */
            <motion.div
              key="questionnaire"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progression du questionnaire</span>
                  <span className="text-sm text-[#00838F] font-semibold">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="flex gap-1.5">
                  {QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-colors',
                        answers[QUESTIONS[i].id]
                          ? 'bg-[#00838F]'
                          : i === currentQuestion
                            ? 'bg-[#00838F]/40'
                            : 'bg-muted',
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Question card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{question.title}</CardTitle>
                  <CardDescription>{question.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {question.options.map((option) => {
                    const isSelected = answers[question.id] === option.value
                    return (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => selectAnswer(question.id, option.value)}
                        className={cn(
                          'w-full text-left rounded-lg border p-4 transition-all',
                          isSelected
                            ? 'border-[#00838F] bg-[#00838F]/5 ring-1 ring-[#00838F]/20'
                            : 'border-border hover:border-[#00838F]/30 hover:bg-muted/50',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5 transition-colors',
                            isSelected ? 'border-[#00838F] bg-[#00838F]' : 'border-muted-foreground/30',
                          )}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{option.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{option.explanation}</p>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={goPrev} disabled={currentQuestion === 0} className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>

                {currentQuestion === QUESTIONS.length - 1 ? (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-[#00838F] hover:bg-[#00838F]/90 text-white"
                    onClick={handleGenerate}
                    disabled={isGenerating || Object.keys(answers).length < QUESTIONS.length}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Obtenir ma recommandation
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={goNext} className="gap-1.5">
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ) : recommendation ? (
            /* ── Results View ── */
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Recommended status */}
              <Card className="border-[#00838F]/30 bg-gradient-to-br from-[#00838F]/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00838F]/10">
                      <Building2 className="h-6 w-6 text-[#00838F]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Statut recommandé</p>
                      <h3 className="text-2xl font-bold text-[#00838F]">{recommendation.recommended}</h3>
                    </div>
                    <Badge className="bg-[#00838F] text-white ml-auto">Recommandé</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Régime fiscal</p>
                      <p className="text-sm font-semibold mt-1">{recommendation.fiscalRegime}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Questions</p>
                      <p className="text-sm font-semibold mt-1">{QUESTIONS.length}/{QUESTIONS.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Concordance</p>
                      <p className="text-sm font-semibold mt-1 text-green-600">
                        {Math.min(100, Math.round((recommendation.scores[recommendation.recommended] || 0) / 20 * 100))}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Étapes suivantes</p>
                      <p className="text-sm font-semibold mt-1">{stepsCompleted}/{nextSteps.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comparison table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#FF6B35]" />
                    Comparaison des statuts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Critère</TableHead>
                          {STATUS_INFO.map(s => (
                            <TableHead key={s.name} className={cn(
                              'min-w-[100px] text-center',
                              s.name === recommendation.recommended && 'bg-[#00838F]/5',
                            )}>
                              <span className={s.name === recommendation.recommended ? 'font-bold text-[#00838F]' : ''}>{s.name}</span>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Capital</TableCell>
                          {STATUS_INFO.map(s => (
                            <TableCell key={s.name} className={cn('text-center text-xs', s.name === recommendation.recommended && 'bg-[#00838F]/5')}>{s.capital}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Associés</TableCell>
                          {STATUS_INFO.map(s => (
                            <TableCell key={s.name} className={cn('text-center text-xs', s.name === recommendation.recommended && 'bg-[#00838F]/5')}>{s.associates}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Fiscalité</TableCell>
                          {STATUS_INFO.map(s => (
                            <TableCell key={s.name} className={cn('text-center text-xs', s.name === recommendation.recommended && 'bg-[#00838F]/5')}>{s.regime}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Social</TableCell>
                          {STATUS_INFO.map(s => (
                            <TableCell key={s.name} className={cn('text-center text-xs', s.name === recommendation.recommended && 'bg-[#00838F]/5')}>{s.social}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Responsabilité</TableCell>
                          {STATUS_INFO.map(s => (
                            <TableCell key={s.name} className={cn('text-center text-xs', s.name === recommendation.recommended && 'bg-[#00838F]/5')}>{s.liability}</TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Social charges chart */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-[#FFB74D]" />
                    Comparaison des charges sociales
                  </CardTitle>
                  <CardDescription>Estimation annuelle selon votre prévision de revenus</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={socialChargesData} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k €`} />
                        <YAxis dataKey="name" type="category" width={50} />
                        <Tooltip
                          formatter={(value: number) => [new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value), 'Charges annuelles']}
                        />
                        <Bar dataKey="charges" radius={[0, 6, 6, 0]} barSize={32}>
                          {socialChargesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Fiscal regime comparison */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">IS vs IR — Comparaison fiscale</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Critère</TableHead>
                          <TableHead>IS (Impôt Sociétés)</TableHead>
                          <TableHead>IR (Impôt Revenu)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { critere: 'Taux', is: '15 % jusqu\'à 42 500 €, 25 % au-delà', ir: 'Barème progressif du contribuable' },
                          { critere: 'Charges déductibles', is: 'Salaires, charges, amortissements', ir: 'Idem + rémunération du dirigeant' },
                          { critere: 'Rémunération dirigeant', is: 'Déductible, pas de cotisations sur dividendes', ir: 'Déductible, intégrée au revenu' },
                          { critere: 'Distribution', is: 'Flat tax 30 % (PV + dividendes)', ir: 'Déjà taxé dans le bénéfice' },
                          { critere: 'Idéal pour', is: 'Bénéfices réinvestis, forte croissance', ir: 'Revenus modestes, auto-entrepreneur' },
                        ].map(row => (
                          <TableRow key={row.critere}>
                            <TableCell className="font-medium">{row.critere}</TableCell>
                            <TableCell className="text-xs">{row.is}</TableCell>
                            <TableCell className="text-xs">{row.ir}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Next steps */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-green-500" />
                    Prochaines étapes
                  </CardTitle>
                  <CardDescription>{stepsCompleted}/{nextSteps.length} étapes complétées</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {nextSteps.map(step => (
                    <button
                      key={step.id}
                      onClick={() => toggleStep(step.id)}
                      className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                        step.checked
                          ? 'border-green-500 bg-green-500'
                          : 'border-muted-foreground/30',
                      )}>
                        {step.checked && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={cn(
                        'text-sm transition-colors',
                        step.checked ? 'text-muted-foreground line-through' : 'text-foreground',
                      )}>
                        {step.text}
                      </span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
