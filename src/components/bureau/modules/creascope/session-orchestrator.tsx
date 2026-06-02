'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { authFetch } from '@/lib/auth-fetch'
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Timer,
  FileText,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Brain,
} from 'lucide-react'
import { STEPS, STEP_INSTRUCTIONS, STATUS_COLORS, STATUS_LABELS, getStepIndex } from './shared'
import type { Session } from './shared'
import { AISuggestionPanel } from './ai-suggest-panel'

// ─── useTimer ────────────────────────────────────

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
        const stepData = stepProgress[step.key] as Record<string, unknown> | undefined
        const isCompleted = !!stepData?.completedAt
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

// ─── Session Orchestrator ────────────────────────

export function SessionOrchestrator({ session, onBack, onRefresh }: { session: Session; onBack: () => void; onRefresh: () => void }) {
  const [stepNotes, setStepNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const elapsed = useTimer(session.startedAt, session.status)
  const stepIdx = getStepIndex(session.currentStep)
  const currentStepConfig = STEPS[stepIdx] || STEPS[0]
  const instructions = STEP_INSTRUCTIONS[session.currentStep] || STEP_INSTRUCTIONS.ACCUEIL

  const sessionAction = useCallback(async (action: string, extra?: Record<string, unknown>) => {
    setActionLoading(true)
    try {
      const res = await authFetch(`/api/creascope/sessions/${session.id}`, {
        method: 'PATCH',
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
  }, [session.id, onRefresh])

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
            <p className="text-xs text-white/50">{session.estimatedMinutes} min</p>
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
