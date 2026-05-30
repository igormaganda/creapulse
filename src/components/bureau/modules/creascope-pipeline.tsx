'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/zustand/store'
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  Loader2,
  ChevronRight,
  Plus,
  AlertCircle,
  ArrowLeft,
  Brain,
  Target,
  MessageSquare,
  Timer,
  BarChart3,
  Rocket,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────

interface Session {
  id: string
  beneficiaryId: string
  counselorId: string
  status: string
  currentStep: string
  scheduledAt: string
  startedAt: string | null
  completedAt: string | null
  estimatedMinutes: number
  stepProgress: Record<string, { startedAt?: string; completedAt?: string; durationMinutes?: number; notes?: string }>
  counselorNotes: string | null
  aiInsights: Record<string, unknown> | null
  actionPlan: Record<string, unknown> | null
  globalScore: number | null
  beneficiary: { user: { firstName: string | null; lastName: string | null; email: string } }
  counselor: { user: { firstName: string | null; lastName: string | null } }
}

interface AISuggestion {
  focus: string[]
  questions: string[]
  observations: string
  approach: string
}

// ─── Constants ───────────────────────────────────

const STEPS = [
  { key: 'ACCUEIL', label: 'Accueil', icon: '👋', duration: '10 min', color: 'bg-teal-500' },
  { key: 'FLASH_SWIPE', label: 'Flash Swipe', icon: '⚡', duration: '8 min', color: 'bg-amber-500' },
  { key: 'ANALYSE_INTERMEDIAIRE', label: 'Analyse IA', icon: '🧠', duration: '15 min', color: 'bg-purple-500' },
  { key: 'QUESTIONNAIRE', label: 'Questionnaire', icon: '📋', duration: '20 min', color: 'bg-sky-500' },
  { key: 'CHALLENGE_SCENARIO', label: 'Challenge Scénario', icon: '🎯', duration: '15 min', color: 'bg-rose-500' },
  { key: 'BILAN_IA', label: 'Bilan IA', icon: '📊', duration: '20 min', color: 'bg-indigo-500' },
  { key: 'PLAN_ACTION', label: 'Plan d\'Action', icon: '🚀', duration: '20 min', color: 'bg-emerald-500' },
] as const

const STATUS_COLORS: Record<string, string> = {
  PLANIFIEE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  EN_COURS: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  PAUSEE: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  TERMINEE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ANNULEE: 'bg-red-500/20 text-red-300 border-red-500/30',
}

const STATUS_LABELS: Record<string, string> = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  PAUSEE: 'En pause',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
}

const STEP_INSTRUCTIONS: Record<string, { title: string; desc: string }> = {
  ACCUEIL: { title: 'Phase d\'accueil', desc: 'Accueillez le bénéficiaire, présentez le déroulé de la session CréaScope et recueillez ses attentes.' },
  FLASH_SWIPE: { title: 'Flash Swipe', desc: 'Le bénéficiaire swippe 60 cartes compétences pour identifier ses soft skills. Durée estimée: 5-8 minutes.' },
  ANALYSE_INTERMEDIAIRE: { title: 'Analyse intermédiaire', desc: 'Présentez les résultats du Flash Swipe et analysez les premières tendances avec le bénéficiaire.' },
  QUESTIONNAIRE: { title: 'Questionnaire approfondi', desc: 'Le bénéficiaire répond à 50 questions adaptatives pour affiner son profil entrepreneurial.' },
  CHALLENGE_SCENARIO: { title: 'Challenge Scénario', desc: '10 scénarios entrepreneuriaux réalistes pour tester la prise de décision en situation.' },
  BILAN_IA: { title: 'Bilan IA complet', desc: 'Présentation du bilan complet généré par l\'IA avec co-analyse des résultats.' },
  PLAN_ACTION: { title: 'Plan d\'action', desc: 'Co-construction du plan d\'action personnalisé avec le bénéficiaire.' },
}

// ─── Helper ─────────────────────────────────────

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getStepIndex(step: string): number {
  return STEPS.findIndex((s) => s.key === step)
}

function useTimer(startedAt: string | null, status: string) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!startedAt || status !== 'EN_COURS') {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    const start = new Date(startedAt).getTime()
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [startedAt, status])

  const hours = Math.floor(elapsed / 3600)
  const mins = Math.floor((elapsed % 3600) / 60)
  const secs = elapsed % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// ─── Step Progress Bar ───────────────────────────

function StepProgressBar({ currentStep, stepProgress }: { currentStep: string; stepProgress: Record<string, unknown> }) {
  const currentIndex = getStepIndex(currentStep)

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STEPS.map((step, idx) => {
        const isCompleted = stepProgress[step.key] && (stepProgress[step.key] as Record<string, unknown>).completedAt
        const isCurrent = idx === currentIndex
        const isPending = idx > currentIndex && !isCompleted

        return (
          <div key={step.key} className="flex items-center gap-1 shrink-0">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                isCompleted && 'bg-emerald-500/20 text-emerald-300',
                isCurrent && 'bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/40',
                isPending && 'bg-white/5 text-white/40',
              )}
            >
              <span className="text-sm">{step.icon}</span>
              <span className="hidden sm:inline">{step.label}</span>
              {isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
            </motion.div>
            {idx < STEPS.length - 1 && (
              <ChevronRight className={cn(
                'h-3 w-3 shrink-0',
                isCompleted ? 'text-emerald-500/40' : 'text-white/20',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── AI Suggestion Panel ─────────────────────────

function AISuggestionPanel({ sessionId, step }: { sessionId: string; step: string }) {
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSuggestion = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/creascope/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAuthStore.getState().token}` },
        body: JSON.stringify({ sessionId, step }),
      })
      const data = await res.json()
      if (data.success && data.data?.suggestions) {
        setSuggestion(data.data.suggestions)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [sessionId, step])

  useEffect(() => {
    if (sessionId && step) fetchSuggestion()
  }, [sessionId, step, fetchSuggestion])

  return (
    <Card className="bg-white/5 border-white/10 rounded-2xl h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-400" />
            Suggestion IA
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchSuggestion} disabled={loading} className="text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Rafraîchir'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && !suggestion ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        ) : suggestion ? (
          <>
            <div>
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1.5">Focus</p>
              <ul className="space-y-1">
                {suggestion.focus.map((f, i) => (
                  <li key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                    <Target className="h-3 w-3 mt-0.5 text-teal-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Separator className="bg-white/10" />
            <div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">Questions</p>
              <ul className="space-y-1">
                {suggestion.questions.map((q, i) => (
                  <li key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                    <MessageSquare className="h-3 w-3 mt-0.5 text-amber-400 shrink-0" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
            <Separator className="bg-white/10" />
            <div>
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1.5">Observations</p>
              <p className="text-xs text-white/60 leading-relaxed">{suggestion.observations}</p>
            </div>
            <Separator className="bg-white/10" />
            <div>
              <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1.5">Approche</p>
              <p className="text-xs text-white/60 leading-relaxed">{suggestion.approach}</p>
            </div>
          </>
        ) : (
          <p className="text-xs text-white/40 text-center py-4">Aucune suggestion disponible</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Session Card ────────────────────────────────

function SessionCard({ session, onClick, isSelected }: { session: Session; onClick: () => void; isSelected: boolean }) {
  const stepIdx = getStepIndex(session.currentStep)
  const progress = Math.round((stepIdx / STEPS.length) * 100)

  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Card
        onClick={onClick}
        className={cn(
          'cursor-pointer transition-all duration-200 rounded-2xl',
          isSelected
            ? 'bg-teal-500/15 border-teal-500/40 ring-1 ring-teal-500/20'
            : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20',
        )}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xs font-bold">
                {(session.beneficiary.user.firstName || '?')[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {session.beneficiary.user.firstName} {session.beneficiary.user.lastName}
                </p>
                <p className="text-xs text-white/50">{formatDate(session.scheduledAt)}</p>
              </div>
            </div>
            <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[session.status] || '')}>
              {STATUS_LABELS[session.status] || session.status}
            </Badge>
          </div>

          {session.status === 'EN_COURS' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">{STEPS[stepIdx]?.label || session.currentStep}</span>
                <span className="text-teal-400 font-medium">{progress}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Session Orchestrator ────────────────────────

function SessionOrchestrator({ session, onBack, onRefresh }: { session: Session; onBack: () => void; onRefresh: () => void }) {
  const [stepNotes, setStepNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const elapsed = useTimer(session.startedAt, session.status)
  const stepIdx = getStepIndex(session.currentStep)
  const currentStepConfig = STEPS[stepIdx] || STEPS[0]
  const instructions = STEP_INSTRUCTIONS[session.currentStep] || STEP_INSTRUCTIONS.ACCUEIL
  const token = useAuthStore((s) => s.token)

  const sessionAction = useCallback(async (action: string, extra?: Record<string, unknown>) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/creascope/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Action effectuée')
        onRefresh()
        setStepNotes('')
      } else {
        toast.error(data.error?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setActionLoading(false)
    }
  }, [session.id, token, onRefresh])

  const handleStart = () => sessionAction('start')
  const handleAdvance = () => sessionAction('advance_step', { stepNotes: stepNotes || undefined })
  const handlePause = () => sessionAction('pause')
  const handleResume = () => sessionAction('resume')
  const handleComplete = () => sessionAction('complete')
  const handleCancel = () => sessionAction('cancel')
  const handleAddNotes = () => {
    if (!stepNotes.trim()) return
    sessionAction('add_notes', { notes: stepNotes })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <Separator orientation="vertical" className="h-6 bg-white/10" />
          <div>
            <h2 className="text-lg font-semibold text-white">
              {session.beneficiary.user.firstName} {session.beneficiary.user.lastName}
            </h2>
            <p className="text-xs text-white/50">{formatDate(session.scheduledAt)} · {session.estimatedMinutes} min</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.status === 'EN_COURS' && (
            <Badge className="bg-teal-500/20 text-teal-300 border border-teal-500/30 gap-1">
              <Timer className="h-3 w-3" /> {elapsed}
            </Badge>
          )}
          <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[session.status] || '')}>
            {STATUS_LABELS[session.status] || session.status}
          </Badge>
          {session.globalScore !== null && (
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              Score: {session.globalScore}/100
            </Badge>
          )}
        </div>
      </div>

      {/* Step Progress Bar */}
      {session.status !== 'ANNULEE' && (
        <StepProgressBar currentStep={session.currentStep} stepProgress={session.stepProgress as Record<string, unknown>} />
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Step View */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={session.currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="bg-white/5 border-white/10 rounded-2xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center text-xl', currentStepConfig.color)}>
                      {currentStepConfig.icon}
                    </div>
                    <div>
                      <CardTitle className="text-white">{instructions.title}</CardTitle>
                      <CardDescription className="text-white/50">{currentStepConfig.label} · {currentStepConfig.duration}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-white/70 leading-relaxed">{instructions.desc}</p>

                  {/* Action Buttons */}
                  <Separator className="bg-white/10" />
                  <div className="flex items-center gap-2 flex-wrap">
                    {session.status === 'PLANIFIEE' && (
                      <Button onClick={handleStart} disabled={actionLoading} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        Démarrer la session
                      </Button>
                    )}
                    {session.status === 'EN_COURS' && session.currentStep !== 'TERMINEE' && (
                      <>
                        <Button onClick={handleAdvance} disabled={actionLoading} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SkipForward className="h-4 w-4" />}
                          Étape suivante
                        </Button>
                        <Button variant="outline" onClick={handlePause} disabled={actionLoading} className="border-white/20 text-white/70 hover:text-white hover:bg-white/10 gap-2">
                          <Pause className="h-4 w-4" /> Pause
                        </Button>
                        <Button variant="outline" onClick={handleComplete} disabled={actionLoading} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Terminer
                        </Button>
                      </>
                    )}
                    {session.status === 'PAUSEE' && (
                      <Button onClick={handleResume} disabled={actionLoading} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        Reprendre
                      </Button>
                    )}
                    {(session.status === 'PLANIFIEE' || session.status === 'PAUSEE') && (
                      <Button variant="outline" onClick={handleCancel} disabled={actionLoading} className="border-red-500/30 text-red-400 hover:bg-red-500/10 ml-auto">
                        Annuler
                      </Button>
                    )}
                  </div>

                  {/* AI Insights */}
                  {session.aiInsights && session.status !== 'ANNULEE' && (
                    <>
                      <Separator className="bg-white/10" />
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="h-4 w-4 text-purple-400" />
                          <h3 className="text-sm font-semibold text-purple-400">Insights IA</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(session.aiInsights as Record<string, string[] | string>).strengths && Array.isArray(session.aiInsights.strengths) && (
                            <div className="bg-emerald-500/10 rounded-xl p-3 space-y-1.5">
                              <p className="text-xs font-semibold text-emerald-400">Forces</p>
                              {(session.aiInsights.strengths as string[]).map((s, i) => (
                                <p key={i} className="text-xs text-white/60">✓ {s}</p>
                              ))}
                            </div>
                          )}
                          {(session.aiInsights as Record<string, string[] | string>).areasToWork && Array.isArray(session.aiInsights.areasToWork) && (
                            <div className="bg-amber-500/10 rounded-xl p-3 space-y-1.5">
                              <p className="text-xs font-semibold text-amber-400">Points à travailler</p>
                              {(session.aiInsights.areasToWork as string[]).map((a, i) => (
                                <p key={i} className="text-xs text-white/60">→ {a}</p>
                              ))}
                            </div>
                          )}
                          {(session.aiInsights as Record<string, string[] | string>).recommendations && Array.isArray(session.aiInsights.recommendations) && (
                            <div className="bg-teal-500/10 rounded-xl p-3 space-y-1.5 sm:col-span-2">
                              <p className="text-xs font-semibold text-teal-400">Recommandations</p>
                              {(session.aiInsights.recommendations as string[]).map((r, i) => (
                                <p key={i} className="text-xs text-white/60">💡 {r}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step Notes */}
                  {(session.status === 'EN_COURS' || session.status === 'PAUSEE') && (
                    <>
                      <Separator className="bg-white/10" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Notes pour cette étape</p>
                          <Button size="sm" variant="ghost" onClick={handleAddNotes} disabled={!stepNotes.trim() || actionLoading} className="text-xs text-teal-400 hover:text-teal-300">
                            <FileText className="h-3 w-3 mr-1" /> Sauvegarder
                          </Button>
                        </div>
                        <Textarea
                          value={stepNotes}
                          onChange={(e) => setStepNotes(e.target.value)}
                          placeholder="Ajoutez vos observations pour cette étape..."
                          className="bg-white/5 border-white/10 text-white text-sm min-h-[80px] rounded-xl resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Counselor Notes History */}
                  {session.counselorNotes && (
                    <>
                      <Separator className="bg-white/10" />
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Notes du conseiller</p>
                        <div className="bg-white/5 rounded-xl p-3 max-h-40 overflow-y-auto">
                          <p className="text-xs text-white/60 whitespace-pre-wrap">{session.counselorNotes}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: AI Suggestion Panel */}
        {session.status === 'EN_COURS' && (
          <AISuggestionPanel sessionId={session.id} step={session.currentStep} />
        )}
      </div>
    </div>
  )
}

// ─── Create Session Dialog ───────────────────────

function CreateSessionForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [beneficiaries, setBeneficiaries] = useState<{ id: string; name: string }[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    async function fetchBeneficiaries() {
      try {
        const res = await fetch('/api/assignments?role=counselor', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setBeneficiaries(data.data.map((a: { beneficiaryId: string; beneficiary: { user: { firstName: string | null; lastName: string | null } } }) => ({
            id: a.beneficiaryId,
            name: `${a.beneficiary.user.firstName || ''} ${a.beneficiary.user.lastName || ''}`.trim(),
          })))
        }
      } catch {
        // silent
      }
    }
    fetchBeneficiaries()
  }, [token])

  const handleCreate = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('/api/creascope/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ beneficiaryId: selected }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Session CréaScope créée !')
        onSuccess()
      } else {
        toast.error(data.error?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white/5 border-white/10 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-white text-base">Nouvelle session CréaScope</CardTitle>
        <CardDescription className="text-white/50">Sélectionnez un bénéficiaire pour démarrer une session de diagnostic complet.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {beneficiaries.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl text-sm transition-all',
                  selected === b.id
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10',
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-[10px] font-bold">
                    {b.name[0] || '?'}
                  </div>
                  {b.name || b.id}
                </div>
              </button>
            ))}
            {beneficiaries.length === 0 && (
              <p className="text-xs text-white/40 text-center py-4">Aucun bénéficiaire assigné trouvé</p>
            )}
          </div>
        </ScrollArea>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate} disabled={!selected || loading} className="bg-teal-600 hover:bg-teal-700 text-white gap-2 flex-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Créer la session
          </Button>
          <Button variant="outline" onClick={onCancel} className="border-white/20 text-white/70 hover:bg-white/10">
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ──────────────────────────────

export function CreascopePipeline() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [activeTab, setActiveTab] = useState('en_cours')
  const token = useAuthStore((s) => s.token)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/creascope/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setSessions(data.data || [])
        // Auto-refresh selected session
        if (selectedSession) {
          const updated = (data.data || []).find((s: Session) => s.id === selectedSession.id)
          if (updated) setSelectedSession(updated)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [token, selectedSession])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'en_cours') return s.status === 'EN_COURS' || s.status === 'PAUSEE'
    if (activeTab === 'planifiees') return s.status === 'PLANIFIEE'
    if (activeTab === 'terminees') return s.status === 'TERMINEE' || s.status === 'ANNULEE'
    return true
  })

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session)
  }

  const handleBackToList = () => {
    setSelectedSession(null)
    fetchSessions()
  }

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="space-y-4 w-full max-w-md">
          <div className="h-8 bg-white/10 animate-pulse rounded w-1/3" />
          <div className="h-4 bg-white/10 animate-pulse rounded w-2/3" />
          <div className="h-32 bg-white/5 animate-pulse rounded mt-6" />
        </div>
      </div>
    )
  }

  // Session detail view
  if (selectedSession) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 md:p-6"
      >
        <SessionOrchestrator session={selectedSession} onBack={handleBackToList} onRefresh={fetchSessions} />
      </motion.div>
    )
  }

  // Session list view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xl">
            <Rocket />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">CréaScope</h1>
            <p className="text-sm text-white/50">Pipeline de session diagnostic 3-4h</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2 rounded-xl"
        >
          <Plus className="h-4 w-4" /> Nouvelle session
        </Button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CreateSessionForm
              onSuccess={() => { setShowCreate(false); fetchSessions() }}
              onCancel={() => setShowCreate(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10 rounded-xl">
          <TabsTrigger value="en_cours" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300 rounded-lg text-white/60">
            En cours ({sessions.filter((s) => s.status === 'EN_COURS' || s.status === 'PAUSEE').length})
          </TabsTrigger>
          <TabsTrigger value="planifiees" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300 rounded-lg text-white/60">
            Planifiées ({sessions.filter((s) => s.status === 'PLANIFIEE').length})
          </TabsTrigger>
          <TabsTrigger value="terminees" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300 rounded-lg text-white/60">
            Terminées ({sessions.filter((s) => s.status === 'TERMINEE' || s.status === 'ANNULEE').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredSessions.length === 0 ? (
            <Card className="bg-white/5 border-white/10 rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-10 w-10 text-white/20 mb-3" />
                <p className="text-sm text-white/40">Aucune session {activeTab === 'en_cours' ? 'en cours' : activeTab === 'planifiees' ? 'planifiée' : 'terminée'}</p>
                <Button variant="ghost" onClick={() => setShowCreate(true)} className="text-teal-400 text-xs mt-3">
                  <Plus className="h-3 w-3 mr-1" /> Créer une session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClick={() => handleSelectSession(session)}
                  isSelected={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total sessions', value: sessions.length, icon: BarChart3, color: 'text-teal-400' },
          { label: 'En cours', value: sessions.filter((s) => s.status === 'EN_COURS').length, icon: Play, color: 'text-amber-400' },
          { label: 'Terminées', value: sessions.filter((s) => s.status === 'TERMINEE').length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Score moyen', value: sessions.filter((s) => s.globalScore !== null).length > 0
            ? Math.round(sessions.filter((s) => s.globalScore !== null).reduce((acc, s) => acc + (s.globalScore || 0), 0) / sessions.filter((s) => s.globalScore !== null).length)
            : '—',
            icon: Brain, color: 'text-purple-400' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white/5 border-white/10 rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={cn('h-5 w-5', stat.color)} />
              <div>
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
