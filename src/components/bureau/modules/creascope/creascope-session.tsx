'use client'

import { useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Brain,
  Handshake,
  Sparkles,
  Search,
  FileCheck,
  Rocket,
  Clock,
  AlertTriangle,
  MessageSquare,
  StickyNote,
  CheckCircle,
  Circle,
  Loader2,
  Timer,
  X,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

import { useCreaScopeStore, CREASCOPE_PHASES } from './creascope-store'
import type { PhaseConfig } from './creascope-store'

import { PhaseAccueil } from './phases/phase-accueil'
import { PhaseDecouverte } from './phases/phase-decouverte'
import { PhaseApprofondissement } from './phases/phase-approfondissement'
import { PhaseSynthese } from './phases/phase-synthese'
import { PhasePlanAction } from './phases/phase-plan-action'

// ─── Constants & Colors ──────────────────────────────────────────────────────

const TEAL = '#00838F'
const CORAL = '#FF6B35'
const AMBER = '#FFB74D'
const PHASE_ICONS: Record<string, React.ReactNode> = {
  Handshake: <Handshake className="h-4 w-4" />,
  Search: <Search className="h-4 w-4" />,
  Brain: <Brain className="h-4 w-4" />,
  FileCheck: <FileCheck className="h-4 w-4" />,
  Rocket: <Rocket className="h-4 w-4" />,
}
const TOTAL_RECOMMENDED_MS = CREASCOPE_PHASES.reduce((s, p) => s + p.recommendedMinutes, 0) * 60 * 1000

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  const totalSec = Math.floor(Math.abs(ms) / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getTimerColor(elapsedMs: number, recommendedMs: number): string {
  if (recommendedMs === 0) return TEAL
  const ratio = elapsedMs / recommendedMs
  if (ratio < 0.8) return '#22c55e' // green
  if (ratio < 1.0) return AMBER // yellow
  if (ratio < 1.2) return CORAL // orange
  return '#ef4444' // red
}

function getTimerLabel(ratio: number): string {
  if (ratio < 0.8) return 'Dans le temps'
  if (ratio < 1.0) return 'Approche de la limite'
  if (ratio < 1.2) return 'Dépassement modéré'
  return 'Dépassement significatif'
}

function getPhaseIcon(phase: PhaseConfig): React.ReactNode {
  return PHASE_ICONS[phase.icon] ?? <Sparkles className="h-4 w-4" />
}

// ─── Phase Renderer ──────────────────────────────────────────────────────────

function renderPhase(index: number) {
  switch (index) {
    case 0: return <PhaseAccueil />
    case 1: return <PhaseDecouverte />
    case 2: return <PhaseApprofondissement />
    case 3: return <PhaseSynthese />
    case 4: return <PhasePlanAction />
    default: return null
  }
}

// ─── Phase Navigation ────────────────────────────────────────────────────────

function PhaseNav() {
  const { currentPhaseIndex, goToPhase, sessionStatus } = useCreaScopeStore()

  return (
    <nav className="w-full overflow-x-auto pb-1">
      <div className="flex items-center justify-start gap-1 sm:gap-2 min-w-max px-1">
        {CREASCOPE_PHASES.map((phase, i) => {
          const isActive = i === currentPhaseIndex
          const isCompleted = i < currentPhaseIndex
          const isPending = i > currentPhaseIndex

          return (
            <TooltipProvider key={phase.id} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (isCompleted || isActive) goToPhase(i)
                    }}
                    disabled={isPending}
                    className={`
                      flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2
                      text-xs sm:text-sm font-medium transition-all duration-200
                      ${isCompleted
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-pointer hover:bg-emerald-200'
                        : isActive
                          ? 'ring-2 cursor-pointer'
                          : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                      }
                    `}
                    style={isActive ? { ringColor: TEAL, backgroundColor: `${TEAL}18`, color: TEAL, '--tw-ring-color': TEAL } as React.CSSProperties : undefined}
                  >
                    <span className="flex items-center justify-center">
                      {isCompleted ? (
                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : isActive ? (
                        <span className="flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full" style={{ backgroundColor: TEAL, color: '#fff', animation: 'pulse 2s infinite' }}>
                          {i + 1}
                        </span>
                      ) : (
                        <Circle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/40" />
                      )}
                    </span>
                    <span className="hidden sm:inline">{phase.shortName}</span>
                    <span className="sm:hidden">{phase.id}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">{phase.name}</p>
                  <p className="text-muted-foreground">{phase.recommendedMinutes} min recommandées</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    </nav>
  )
}

// ─── Timer Bar ───────────────────────────────────────────────────────────────

function TimerBar() {
  const {
    sessionStatus,
    sessionStartedAt,
    phaseStartedAt,
    totalPausedMs,
    phasePausedMs,
    currentPhaseIndex,
    pauseSession,
    resumeSession,
    nextPhase,
  } = useCreaScopeStore()

  const [now, setNow] = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (sessionStatus === 'active') {
      timerRef.current = setInterval(() => setNow(Date.now()), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [sessionStatus])

  const sessionElapsed = sessionStartedAt ? now - sessionStartedAt - totalPausedMs : 0
  const phaseElapsed = phaseStartedAt ? now - phaseStartedAt - phasePausedMs : 0
  const currentPhase = CREASCOPE_PHASES[currentPhaseIndex]
  const phaseRecommendedMs = currentPhase.recommendedMinutes * 60 * 1000
  const sessionProgress = Math.min((sessionElapsed / TOTAL_RECOMMENDED_MS) * 100, 100)
  const phaseProgress = Math.min((phaseElapsed / phaseRecommendedMs) * 100, 100)
  const sessionRatio = sessionElapsed / TOTAL_RECOMMENDED_MS
  const phaseRatio = phaseElapsed / phaseRecommendedMs
  const timerColor = getTimerColor(phaseElapsed, phaseRecommendedMs)
  const isPaused = sessionStatus === 'paused'

  return (
    <Card className="border-0 shadow-none bg-gradient-to-r from-muted/60 to-muted/30">
      <CardContent className="p-3 sm:p-4">
        {/* Session + Phase timers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <Timer className="h-3.5 w-3.5" />
              <span className="font-mono font-medium text-foreground">{formatMs(sessionElapsed)}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-mono">{formatMs(TOTAL_RECOMMENDED_MS)}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Clock className="h-3.5 w-3.5" style={{ color: timerColor }} />
              <span className="font-mono font-medium" style={{ color: timerColor }}>
                {formatMs(phaseElapsed)}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="font-mono text-muted-foreground">{formatMs(phaseRecommendedMs)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] sm:text-xs font-normal gap-1"
              style={{ borderColor: timerColor, color: timerColor }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: timerColor, animation: isPaused ? 'none' : 'pulse 2s infinite' }}
              />
              {isPaused ? 'En pause' : getTimerLabel(phaseRatio)}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={sessionProgress} className="h-1.5 mb-3" />

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={isPaused ? resumeSession : pauseSession}
            className="h-8 gap-1.5 text-xs"
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {isPaused ? 'Reprendre' : 'Pause'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPhase}
            className="h-8 gap-1.5 text-xs"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Phase suivante
          </Button>
          <div className="ml-auto text-[10px] sm:text-xs text-muted-foreground">
            Phase {currentPhaseIndex + 1} / {CREASCOPE_PHASES.length}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── SOP Panel ──────────────────────────────────────────────────────────────

function SopPanelContent() {
  const { currentPhaseIndex, notes, addPhaseNote, updatePhaseNote } = useCreaScopeStore()
  const currentPhase = CREASCOPE_PHASES[currentPhaseIndex]
  const phaseNotes = notes.filter((n) => n.phaseIndex === currentPhaseIndex)
  const latestNote = phaseNotes[phaseNotes.length - 1]
  const [noteText, setNoteText] = useState(latestNote?.content ?? '')

  const handleSaveNote = useCallback(() => {
    const trimmed = noteText.trim()
    if (!trimmed) return
    if (latestNote) {
      updatePhaseNote(latestNote.id, trimmed)
    } else {
      addPhaseNote(currentPhaseIndex, trimmed)
    }
  }, [noteText, latestNote, currentPhaseIndex, addPhaseNote, updatePhaseNote])

  return (
    <div className="space-y-4">
      {/* Phase header */}
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm font-bold"
          style={{ backgroundColor: currentPhase.color }}
        >
          {currentPhase.id}
        </span>
        <div>
          <h3 className="text-sm font-semibold leading-tight">{currentPhase.name}</h3>
          <p className="text-[11px] text-muted-foreground">{currentPhase.recommendedMinutes} min</p>
        </div>
      </div>

      <Separator />

      {/* SOP Steps */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FileCheck className="h-3.5 w-3.5" />
          Procédure — SOP
        </h4>
        {currentPhase.steps.map((step) => (
          <div
            key={step.code}
            className="flex items-start gap-2 rounded-lg border p-2.5 text-xs transition-colors hover:bg-muted/50"
          >
            <span className="flex items-center justify-center mt-0.5">
              {step.status === 'completed' ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              ) : step.status === 'in_progress' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: CORAL }} />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-medium text-muted-foreground">{step.code}</span>
                <span className="font-medium truncate">{step.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {step.recommendedMinutes} min recommandées
              </p>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Notes */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <StickyNote className="h-3.5 w-3.5" />
          Notes de session
        </h4>
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onBlur={handleSaveNote}
          placeholder="Prenez des notes pour cette phase…"
          className="min-h-[100px] text-xs resize-y"
          rows={5}
        />
        <p className="text-[10px] text-muted-foreground">
          {phaseNotes.length > 0 ? `${phaseNotes.length} note(s) enregistrée(s)` : 'Les notes sont sauvegardées automatiquement'}
        </p>
      </div>
    </div>
  )
}

function SopPanelDesktop() {
  return (
    <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
      <Card className="sticky top-4">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Guide & Notes</CardTitle>
            <Badge variant="outline" className="text-[10px] font-normal">SOP</Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="px-4 pb-4">
          <ScrollArea className="max-h-[calc(100vh-220px)]">
            <SopPanelContent key={currentPhaseIndex} />
          </ScrollArea>
        </CardContent>
      </Card>
    </aside>
  )
}

function SopPanelMobile() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden h-8 gap-1.5 text-xs">
          <MessageSquare className="h-3.5 w-3.5" />
          Guide SOP
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96 p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-sm font-semibold">Guide & Notes — SOP</SheetTitle>
        </SheetHeader>
        <Separator />
        <ScrollArea className="h-[calc(100vh-80px)] px-4 pb-4">
          <div className="pt-4">
            <SopPanelContent key={currentPhaseIndex} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// ─── Pre-Session Card ────────────────────────────────────────────────────────

function PreSessionCard() {
  const startSession = useCreaScopeStore((s) => s.startSession)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-2xl mx-auto"
    >
      <Card className="overflow-hidden border-2" style={{ borderColor: `${TEAL}30` }}>
        {/* Hero */}
        <div
          className="relative px-6 py-10 sm:px-10 sm:py-14 text-center text-white"
          style={{ background: `linear-gradient(135deg, ${TEAL}, ${TEAL}cc)` }}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Prêt à démarrer une session CréaScope ?
          </h1>
          <p className="mt-3 max-w-lg mx-auto text-sm sm:text-base text-white/85 leading-relaxed">
            Accompagnement structuré de 3h30 à 4h en 5 phases pour diagnostiquer
            et guider le porteur de projet vers son épanouissement entrepreneurial.
          </p>
        </div>

        {/* Phase cards */}
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {CREASCOPE_PHASES.map((phase, i) => (
              <div
                key={phase.id}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white text-sm flex-shrink-0"
                  style={{ backgroundColor: phase.color }}
                >
                  {getPhaseIcon(phase)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{phase.name}</p>
                  <p className="text-xs text-muted-foreground">{phase.recommendedMinutes} min</p>
                </div>
              </div>
            ))}
          </div>

          {/* Total duration */}
          <div className="flex items-center gap-2 mb-6 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              Durée totale recommandée :{' '}
              <span className="font-semibold text-foreground">
                {Math.floor(TOTAL_RECOMMENDED_MS / 60000)} minutes
              </span>{' '}
              ({Math.floor(TOTAL_RECOMMENDED_MS / 3600000)}h{Math.floor((TOTAL_RECOMMENDED_MS % 3600000) / 60000)})
            </span>
          </div>

          {/* Start button */}
          <Button
            onClick={startSession}
            size="lg"
            className="w-full h-12 text-base font-semibold gap-2"
            style={{ backgroundColor: TEAL, color: '#fff' }}
          >
            <Play className="h-5 w-5" />
            Démarrer la session
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Post-Session Card ───────────────────────────────────────────────────────

function PostSessionCard() {
  const {
    sessionStartedAt,
    totalPausedMs,
    phases,
    resetSession,
    startSession,
  } = useCreaScopeStore()

  const totalDuration = sessionStartedAt
    ? Math.max(0, Date.now() - sessionStartedAt - totalPausedMs)
    : 0

  const completedStepsPerPhase = phases.map((p) => ({
    name: p.shortName,
    total: p.steps.length,
    completed: p.steps.filter((s) => s.status === 'completed').length,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-2xl mx-auto"
    >
      <Card className="overflow-hidden border-2" style={{ borderColor: `${TEAL}30` }}>
        <div
          className="px-6 py-10 sm:px-10 sm:py-14 text-center text-white"
          style={{ background: `linear-gradient(135deg, ${TEAL}, #00695C)` }}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <CheckCircle className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Session terminée !</h1>
          <p className="mt-2 text-white/85 text-sm">
            Bravo, vous avez mené à bien la session CréaScope.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-mono">
            <Timer className="h-4 w-4" />
            Durée : {formatMs(totalDuration)}
          </div>
        </div>

        <CardContent className="p-4 sm:p-6">
          {/* Summary */}
          <h3 className="text-sm font-semibold mb-3">Bilan par phase</h3>
          <div className="space-y-2 mb-6">
            {completedStepsPerPhase.map((phase, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{phase.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{phase.completed}/{phase.total} étapes</span>
                  <Progress value={(phase.completed / phase.total) * 100} className="w-20 h-1.5" />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 gap-2">
              <FileCheck className="h-4 w-4" />
              Revoir le bilan
            </Button>
            <Button
              className="flex-1 gap-2"
              style={{ backgroundColor: TEAL, color: '#fff' }}
              onClick={() => {
                resetSession()
                startSession()
              }}
            >
              <Sparkles className="h-4 w-4" />
              Démarrer une nouvelle session
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CreaScopeSession() {
  const {
    isSessionActive,
    sessionStatus,
    currentPhaseIndex,
    phases,
  } = useCreaScopeStore()

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  // ── Pre-session ──
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: TEAL }} />
      </div>
    )
  }

  if (!isSessionActive && sessionStatus === 'idle') {
    return (
      <div className="p-4 sm:p-6">
        <PreSessionCard />
      </div>
    )
  }

  // ── Post-session ──
  if (sessionStatus === 'completed') {
    return (
      <div className="p-4 sm:p-6">
        <PostSessionCard />
      </div>
    )
  }

  // ── Active session ──
  const currentPhase = phases[currentPhaseIndex]

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: TEAL }}>
              <Brain className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight">CréaScope</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Session d&apos;accompagnement — Phase {currentPhaseIndex + 1}/{CREASCOPE_PHASES.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SopPanelMobile />
            <Badge
              variant="outline"
              className="text-[10px] sm:text-xs gap-1"
              style={{
                borderColor: sessionStatus === 'paused' ? AMBER : TEAL,
                color: sessionStatus === 'paused' ? AMBER : TEAL,
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: sessionStatus === 'paused' ? AMBER : TEAL,
                  animation: sessionStatus === 'paused' ? 'none' : 'pulse 2s infinite',
                }}
              />
              {sessionStatus === 'paused' ? 'En pause' : 'En cours'}
            </Badge>
          </div>
        </header>

        {/* Phase Nav */}
        <div className="px-4 sm:px-6 py-3 border-b bg-muted/30">
          <PhaseNav />
        </div>

        {/* Timer Bar */}
        <div className="px-4 sm:px-6 py-2">
          <TimerBar />
        </div>

        {/* Main Content + SOP sidebar */}
        <div className="flex flex-1 min-h-0">
          {/* Phase content */}
          <main className="flex-1 min-w-0 p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhaseIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Phase title */}
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: currentPhase?.color ?? TEAL }}
                  >
                    {currentPhase ? getPhaseIcon(currentPhase) : <Sparkles className="h-5 w-5" />}
                  </span>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">
                      {currentPhase?.name ?? 'Chargement…'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {currentPhase?.recommendedMinutes ?? 0} minutes recommandées
                    </p>
                  </div>
                </div>

                {/* Phase component */}
                <div className="max-w-4xl">
                  {renderPhase(currentPhaseIndex)}
                </div>
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Desktop SOP panel */}
          <SopPanelDesktop />
        </div>
      </div>
    </TooltipProvider>
  )
}
