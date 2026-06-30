'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import {
  Clock,
  Save,
  Sparkles,
  Loader2,
  Check,
  Info,
  Plus,
  X,
  Timer,
  CalendarDays,
  Wrench,
  ListTodo,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings2,
  ChevronDown,
  Target,
  Flame,
  BarChart3,
  CircleDot,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/auth-fetch'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface TaskItem {
  id: string
  text: string
}

interface EisenhowerMatrix {
  urgentImportant: TaskItem[]
  urgentNotImportant: TaskItem[]
  notUrgentImportant: TaskItem[]
  notUrgentNotImportant: TaskItem[]
}

interface WeekSchedule {
  [day: string]: string
}

interface GestionTempsData {
  diagnostic: string
  eisenhower: EisenhowerMatrix
  weekSchedule: WeekSchedule
}

type SessionType = 'work' | 'break' | 'longBreak'

interface PomodoroSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
  soundEnabled: boolean
  autoStartNext: boolean
}

interface CompletedPomodoro {
  id: string
  taskName: string
  category: string
  duration: number
  completedAt: string // ISO date
}

interface PomodoroState {
  settings: PomodoroSettings
  isRunning: boolean
  sessionType: SessionType
  remainingSeconds: number
  completedSessionsInCycle: number
  currentTaskName: string
  currentCategory: string
  completedPomodoros: CompletedPomodoro[]
  streakDays: number
  lastPomodoroDate: string
  dailyStats: Record<string, { totalMinutes: number; count: number }> // key: YYYY-MM-DD
}

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const TASK_CATEGORIES = [
  { value: 'Production', label: 'Production', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'Prospection', label: 'Prospection', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  { value: 'Admin', label: 'Admin', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-300' },
  { value: 'Formation', label: 'Formation', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'Réseaux', label: 'Réseaux', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
]

const OUTILS_PRODUCTIVITE = [
  { name: 'Pomodoro (25/5)', description: 'Travail par cycles de 25 min, pause 5 min. Idéal pour les tâches concentrées.' },
  { name: 'Trello / Notion', description: 'Gestion de projets visuelle. Tableaux Kanban pour organiser vos tâches.' },
  { name: 'Google Agenda', description: 'Planification et rappels. Bloquez des créneaux pour chaque activité.' },
  { name: 'RescueTime / Toggl', description: 'Suivi du temps réel. Mesurez où passez réellement votre temps.' },
  { name: 'Time Blocking', description: 'Allocation de créneaux fixes pour chaque type d\'activité. Réduit la fragmentation.' },
  { name: 'Eat the Frog', description: 'Commencez par la tâche la plus difficile en priorité. Maximise la productivité matinale.' },
  { name: '2-Minute Rule', description: 'Si une tâche prend moins de 2 min, faites-la immédiatement. Évite l\'accumulation.' },
]

const DEFAULT_DATA: GestionTempsData = {
  diagnostic: '',
  eisenhower: {
    urgentImportant: [],
    urgentNotImportant: [],
    notUrgentImportant: [],
    notUrgentNotImportant: [],
  },
  weekSchedule: {
    Lundi: '',
    Mardi: '',
    Mercredi: '',
    Jeudi: '',
    Vendredi: '',
    Samedi: '',
    Dimanche: '',
  },
}

const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  soundEnabled: true,
  autoStartNext: false,
}

function getDefaultPomodoroState(): PomodoroState {
  return {
    settings: { ...DEFAULT_POMODORO_SETTINGS },
    isRunning: false,
    sessionType: 'work',
    remainingSeconds: DEFAULT_POMODORO_SETTINGS.workDuration * 60,
    completedSessionsInCycle: 0,
    currentTaskName: '',
    currentCategory: 'Production',
    completedPomodoros: [],
    streakDays: 0,
    lastPomodoroDate: '',
    dailyStats: {},
  }
}

function getTodayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getWeekDays(): string[] {
  const days: string[] = []
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1 // Monday = 0
  for (let i = dayOfWeek; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return days
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function createTask(text: string): TaskItem {
  return { id: crypto.randomUUID(), text: text.trim() }
}

function InfoPopover({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-sky-600 hover:bg-sky-600/10 transition-colors shrink-0">
          <Info className="h-3.5 w-3.5" />
          <span className="sr-only">Aide</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-sm text-sm bg-popover border-border shadow-lg">
        <p className="text-muted-foreground leading-relaxed">{text}</p>
      </PopoverContent>
    </Popover>
  )
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2)
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  } catch {
    // Audio not supported
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m > 0 ? m + 'min' : ''}`
}

// ═══════════════════════════════════════════════════════════════
// Eisenhower Quadrant Sub-component
// ═══════════════════════════════════════════════════════════════

function EisenhowerQuadrant({
  title,
  description,
  color,
  bgColor,
  borderColor,
  icon,
  tasks,
  onAdd,
  onRemove,
  placeholder,
}: {
  title: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof Clock
  tasks: TaskItem[]
  onAdd: (text: string) => void
  onRemove: (id: string) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')
  const Icon = icon

  const handleAdd = () => {
    if (input.trim()) {
      onAdd(input.trim())
      setInput('')
    }
  }

  return (
    <div className={cn('rounded-xl border-2 p-4 space-y-3', bgColor, borderColor)}>
      <div className="flex items-center gap-2">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', color)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className={cn('text-sm font-semibold', color.replace('bg-', 'text-'))}>{title}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <ul className="space-y-1.5 min-h-[40px]">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center justify-between gap-2 bg-background/60 rounded-lg px-3 py-2">
            <span className="text-sm">{task.text}</span>
            <button
              type="button"
              onClick={() => onRemove(task.id)}
              className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="flex-1 text-sm rounded-lg border border-border bg-background/60 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        />
        <Button size="sm" variant="outline" onClick={handleAdd} disabled={!input.trim()} className="shrink-0 h-8 w-8 p-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Circular Timer SVG Component
// ═══════════════════════════════════════════════════════════════

function CircularTimer({
  remainingSeconds,
  totalSeconds,
  sessionType,
  isRunning,
}: {
  remainingSeconds: number
  totalSeconds: number
  sessionType: SessionType
  isRunning: boolean
}) {
  const radius = 90
  const stroke = 8
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0
  const strokeDashoffset = circumference * (1 - progress)

  const colorMap: Record<SessionType, { stroke: string; bg: string; text: string; label: string }> = {
    work: { stroke: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', label: 'Travail' },
    break: { stroke: '#22c55e', bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', label: 'Pause' },
    longBreak: { stroke: '#14b8a6', bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', label: 'Pause longue' },
  }

  const { stroke: strokeColor, text: textColor, label } = colorMap[sessionType]

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="relative"
        animate={isRunning ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={isRunning ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
      >
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-muted/30"
          />
          {/* Progress circle */}
          <motion.circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            initial={false}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-4xl font-bold tabular-nums tracking-tight', textColor)}>
            {formatTime(remainingSeconds)}
          </span>
          <Badge
            variant="secondary"
            className={cn('mt-2 text-[10px] font-medium px-2', colorMap[sessionType].bg, textColor)}
          >
            {label}
          </Badge>
        </div>
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Pomodoro Timer Hook
// ═══════════════════════════════════════════════════════════════

function usePomodoroTimer() {
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>(() => {
    try {
      const saved = localStorage.getItem('creapulse-pomodoro')
      if (saved) {
        const parsed = JSON.parse(saved) as PomodoroState
        return { ...getDefaultPomodoroState(), ...parsed, isRunning: false }
      }
    } catch {
      // ignore
    }
    return getDefaultPomodoroState()
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef(pomodoroState)

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = pomodoroState
  })

  // Clear completed pomodoros older than 30 days
  useEffect(() => {
    const cleanup = setInterval(() => {
      setPomodoroState(prev => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const filtered = prev.completedPomodoros.filter(
          p => new Date(p.completedAt) >= thirtyDaysAgo
        )
        if (filtered.length === prev.completedPomodoros.length) return prev
        return { ...prev, completedPomodoros: filtered }
      })
    }, 60000)
    return () => clearInterval(cleanup)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (pomodoroState) {
      const toSave = { ...pomodoroState, isRunning: false }
      localStorage.setItem('creapulse-pomodoro', JSON.stringify(toSave))
    }
  }, [
    pomodoroState.settings,
    pomodoroState.sessionType,
    pomodoroState.remainingSeconds,
    pomodoroState.completedSessionsInCycle,
    pomodoroState.currentTaskName,
    pomodoroState.currentCategory,
    pomodoroState.completedPomodoros,
    pomodoroState.streakDays,
    pomodoroState.lastPomodoroDate,
    pomodoroState.dailyStats,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const getSessionDuration = useCallback((type: SessionType, settings: PomodoroSettings) => {
    switch (type) {
      case 'work': return settings.workDuration * 60
      case 'break': return settings.shortBreakDuration * 60
      case 'longBreak': return settings.longBreakDuration * 60
    }
  }, [])

  const handleSessionComplete = useCallback(() => {
    const state = stateRef.current
    if (state.sessionType === 'work') {
      // Completed a work session
      const today = getTodayKey()
      const newPomodoro: CompletedPomodoro = {
        id: crypto.randomUUID(),
        taskName: state.currentTaskName || 'Sans titre',
        category: state.currentCategory,
        duration: state.settings.workDuration,
        completedAt: new Date().toISOString(),
      }

      // Calculate streak
      let newStreak = state.streakDays
      const todayDate = getTodayKey()
      if (state.lastPomodoroDate !== todayDate) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
        if (state.lastPomodoroDate === yesterdayKey || state.lastPomodoroDate === '') {
          newStreak += 1
        } else if (state.lastPomodoroDate !== todayDate) {
          newStreak = 1
        }
      }

      const newCompletedInCycle = state.completedSessionsInCycle + 1
      const isLongBreak = newCompletedInCycle >= state.settings.sessionsBeforeLongBreak

      if (state.settings.soundEnabled) playBeep()

      const nextSessionType: SessionType = isLongBreak ? 'longBreak' : 'break'
      const nextDuration = getSessionDuration(nextSessionType, state.settings)

      setPomodoroState(prev => ({
        ...prev,
        isRunning: prev.settings.autoStartNext,
        sessionType: nextSessionType,
        remainingSeconds: nextDuration,
        completedSessionsInCycle: isLongBreak ? 0 : newCompletedInCycle,
        completedPomodoros: [...prev.completedPomodoros, newPomodoro],
        streakDays: newStreak,
        lastPomodoroDate: todayDate,
        dailyStats: {
          ...prev.dailyStats,
          [today]: {
            totalMinutes: (prev.dailyStats[today]?.totalMinutes || 0) + state.settings.workDuration,
            count: (prev.dailyStats[today]?.count || 0) + 1,
          },
        },
      }))
    } else {
      // Completed a break session
      if (state.settings.soundEnabled) playBeep()

      const nextDuration = getSessionDuration('work', state.settings)
      setPomodoroState(prev => ({
        ...prev,
        isRunning: prev.settings.autoStartNext,
        sessionType: 'work',
        remainingSeconds: nextDuration,
      }))
    }
  }, [getSessionDuration])

  // Timer tick
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (pomodoroState.isRunning) {
      intervalRef.current = setInterval(() => {
        setPomodoroState(prev => {
          if (prev.remainingSeconds <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            intervalRef.current = null
            return { ...prev, remainingSeconds: 0, isRunning: false }
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 }
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [pomodoroState.isRunning])

  // Watch for session complete (remainingSeconds === 0 and not running)
  useEffect(() => {
    if (pomodoroState.remainingSeconds === 0 && !pomodoroState.isRunning) {
      // Check if we just completed (not initial state)
      const totalDuration = getSessionDuration(pomodoroState.sessionType, pomodoroState.settings)
      if (totalDuration > 0) {
        handleSessionComplete()
      }
    }
  }, [pomodoroState.remainingSeconds, pomodoroState.isRunning, handleSessionComplete, getSessionDuration])

  const start = useCallback(() => {
    setPomodoroState(prev => ({ ...prev, isRunning: true }))
  }, [])

  const pause = useCallback(() => {
    setPomodoroState(prev => ({ ...prev, isRunning: false }))
  }, [])

  const reset = useCallback(() => {
    setPomodoroState(prev => ({
      ...prev,
      isRunning: false,
      sessionType: 'work',
      remainingSeconds: prev.settings.workDuration * 60,
      completedSessionsInCycle: 0,
    }))
  }, [])

  const skip = useCallback(() => {
    setPomodoroState(prev => {
      if (prev.sessionType === 'work') {
        // Skip work -> go to break
        const newCompletedInCycle = prev.completedSessionsInCycle + 1
        const isLongBreak = newCompletedInCycle >= prev.settings.sessionsBeforeLongBreak
        const nextSessionType: SessionType = isLongBreak ? 'longBreak' : 'break'
        return {
          ...prev,
          isRunning: false,
          sessionType: nextSessionType,
          remainingSeconds: getSessionDuration(nextSessionType, prev.settings),
          completedSessionsInCycle: isLongBreak ? 0 : newCompletedInCycle,
        }
      } else {
        // Skip break -> go to work
        return {
          ...prev,
          isRunning: false,
          sessionType: 'work',
          remainingSeconds: prev.settings.workDuration * 60,
        }
      }
    })
  }, [getSessionDuration])

  const updateSettings = useCallback((updates: Partial<PomodoroSettings>) => {
    setPomodoroState(prev => {
      const newSettings = { ...prev.settings, ...updates }
      // Update remaining seconds if timer hasn't started
      const newRemaining = prev.isRunning
        ? prev.remainingSeconds
        : getSessionDuration(prev.sessionType, newSettings)
      return {
        ...prev,
        settings: newSettings,
        remainingSeconds: newRemaining,
      }
    })
  }, [getSessionDuration])

  const setTaskName = useCallback((name: string) => {
    setPomodoroState(prev => ({ ...prev, currentTaskName: name }))
  }, [])

  const setCategory = useCallback((category: string) => {
    setPomodoroState(prev => ({ ...prev, currentCategory: category }))
  }, [])

  return {
    pomodoroState,
    start,
    pause,
    reset,
    skip,
    updateSettings,
    setTaskName,
    setCategory,
  }
}

// ═══════════════════════════════════════════════════════════════
// Pomodoro Tab Content
// ═══════════════════════════════════════════════════════════════

function PomodoroTab({
  pomodoroState,
  onStart,
  onPause,
  onReset,
  onSkip,
  onUpdateSettings,
  onSetTaskName,
  onSetCategory,
}: {
  pomodoroState: PomodoroState
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSkip: () => void
  onUpdateSettings: (updates: Partial<PomodoroSettings>) => void
  onSetTaskName: (name: string) => void
  onSetCategory: (category: string) => void
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [taskInput, setTaskInput] = useState(pomodoroState.currentTaskName)

  const todayKey = getTodayKey()
  const todayStats = pomodoroState.dailyStats[todayKey]
  const todayPomodoros = pomodoroState.completedPomodoros.filter(
    p => p.completedAt.startsWith(todayKey)
  )
  const totalDuration = useMemo(() => {
    switch (pomodoroState.sessionType) {
      case 'work': return pomodoroState.settings.workDuration * 60
      case 'break': return pomodoroState.settings.shortBreakDuration * 60
      case 'longBreak': return pomodoroState.settings.longBreakDuration * 60
    }
  }, [pomodoroState.sessionType, pomodoroState.settings])

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (taskInput.trim()) {
      onSetTaskName(taskInput.trim())
      toast.success('Tâche mise à jour')
    }
  }

  return (
    <div className="space-y-6">
      {/* Timer + Controls */}
      <Card className="border-sky-200 dark:border-sky-800 overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6">
            {/* Circular Timer */}
            <CircularTimer
              remainingSeconds={pomodoroState.remainingSeconds}
              totalSeconds={totalDuration}
              sessionType={pomodoroState.sessionType}
              isRunning={pomodoroState.isRunning}
            />

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={onReset}
                className="h-10 w-10 rounded-full"
                title="Réinitialiser"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                size="lg"
                onClick={pomodoroState.isRunning ? onPause : onStart}
                className={cn(
                  'h-14 w-14 rounded-full text-white shadow-lg transition-all',
                  pomodoroState.sessionType === 'work'
                    ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25'
                    : pomodoroState.sessionType === 'break'
                      ? 'bg-green-500 hover:bg-green-600 shadow-green-500/25'
                      : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/25',
                )}
              >
                {pomodoroState.isRunning
                  ? <Pause className="h-6 w-6" />
                  : <Play className="h-6 w-6 ml-0.5" />
                }
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={onSkip}
                className="h-10 w-10 rounded-full"
                title="Passer"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Session Progress Dots */}
            <div className="flex items-center gap-2">
              {Array.from({ length: pomodoroState.settings.sessionsBeforeLongBreak }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-3 w-3 rounded-full transition-all',
                    i < pomodoroState.completedSessionsInCycle
                      ? 'bg-orange-500 shadow-sm shadow-orange-500/50'
                      : 'bg-muted border border-muted-foreground/20',
                  )}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                Cycle {pomodoroState.completedSessionsInCycle}/{pomodoroState.settings.sessionsBeforeLongBreak}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Input + Category */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            Tâche de focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <form onSubmit={handleTaskSubmit} className="flex gap-2">
              <Input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Que travaillez-vous en ce moment ?"
                className="flex-1"
              />
              <Button type="submit" size="sm" className="bg-sky-600 hover:bg-sky-700 text-white shrink-0">
                <Check className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {TASK_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => onSetCategory(cat.value)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all border',
                    pomodoroState.currentCategory === cat.value
                      ? cn(cat.color, 'border-current shadow-sm')
                      : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted',
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 px-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-foreground">{pomodoroState.streakDays}</p>
            <p className="text-[10px] text-muted-foreground">jours d&apos;affilé</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 px-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CircleDot className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <p className="text-xl font-bold text-foreground">{todayStats?.count ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">pomodoros aujourd&apos;hui</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 px-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatMinutes(todayStats?.totalMinutes ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">focus aujourd&apos;hui</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings (Collapsible) */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <button type="button" className="w-full">
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    Paramètres du timer
                  </CardTitle>
                  <motion.div
                    animate={{ rotate: settingsOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </div>
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6 border-t pt-4">
              {/* Work Duration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Durée de travail</label>
                  <span className="text-sm text-muted-foreground tabular-nums">{pomodoroState.settings.workDuration} min</span>
                </div>
                <Slider
                  value={[pomodoroState.settings.workDuration]}
                  onValueChange={([v]) => onUpdateSettings({ workDuration: v })}
                  min={15}
                  max={60}
                  step={5}
                />
              </div>

              {/* Short Break */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Pause courte</label>
                  <span className="text-sm text-muted-foreground tabular-nums">{pomodoroState.settings.shortBreakDuration} min</span>
                </div>
                <Slider
                  value={[pomodoroState.settings.shortBreakDuration]}
                  onValueChange={([v]) => onUpdateSettings({ shortBreakDuration: v })}
                  min={3}
                  max={15}
                  step={1}
                />
              </div>

              {/* Long Break */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Pause longue</label>
                  <span className="text-sm text-muted-foreground tabular-nums">{pomodoroState.settings.longBreakDuration} min</span>
                </div>
                <Slider
                  value={[pomodoroState.settings.longBreakDuration]}
                  onValueChange={([v]) => onUpdateSettings({ longBreakDuration: v })}
                  min={10}
                  max={30}
                  step={5}
                />
              </div>

              {/* Sessions before long break */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Pomodoros avant pause longue</label>
                  <span className="text-sm text-muted-foreground tabular-nums">{pomodoroState.settings.sessionsBeforeLongBreak}</span>
                </div>
                <Slider
                  value={[pomodoroState.settings.sessionsBeforeLongBreak]}
                  onValueChange={([v]) => onUpdateSettings({ sessionsBeforeLongBreak: v })}
                  min={2}
                  max={6}
                  step={1}
                />
              </div>

              <Separator />

              {/* Toggles */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Son de notification</label>
                <Switch
                  checked={pomodoroState.settings.soundEnabled}
                  onCheckedChange={(v) => onUpdateSettings({ soundEnabled: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Démarrage automatique</label>
                <Switch
                  checked={pomodoroState.settings.autoStartNext}
                  onCheckedChange={(v) => onUpdateSettings({ autoStartNext: v })}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Today's Completed Pomodoros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Check className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            Pomodoros terminés aujourd&apos;hui
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayPomodoros.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun pomodoro terminé aujourd&apos;hui. Lancez votre premier cycle !
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {todayPomodoros.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 bg-muted/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <CircleDot className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.taskName}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {p.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {p.duration} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {new Date(p.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Stats Tab Content
// ═══════════════════════════════════════════════════════════════

function StatsTab({ pomodoroData }: { pomodoroData: PomodoroState }) {
  const weekDays = getWeekDays()
  const weekData = weekDays.map(dayKey => {
    const stats = pomodoroData.dailyStats[dayKey]
    return {
      dayKey,
      dayLabel: DAYS_SHORT[weekDays.indexOf(dayKey)],
      totalMinutes: stats?.totalMinutes || 0,
      count: stats?.count || 0,
    }
  })

  const totalWeekMinutes = weekData.reduce((s, d) => s + d.totalMinutes, 0)
  const totalWeekPomodoros = weekData.reduce((s, d) => s + d.count, 0)
  const activeDays = weekData.filter(d => d.count > 0).length
  const avgDailyMinutes = activeDays > 0 ? Math.round(totalWeekMinutes / activeDays) : 0
  const maxDay = weekData.reduce((best, d) => d.totalMinutes > best.totalMinutes ? d : best, weekData[0])
  const maxBarHeight = Math.max(...weekData.map(d => d.totalMinutes), 1)

  // Category stats from this week
  const weekStart = weekDays[0]
  const weekPomodoros = pomodoroData.completedPomodoros.filter(
    p => p.completedAt >= weekStart
  )
  const categoryMap: Record<string, { minutes: number; count: number }> = {}
  for (const p of weekPomodoros) {
    if (!categoryMap[p.category]) categoryMap[p.category] = { minutes: 0, count: 0 }
    categoryMap[p.category].minutes += p.duration
    categoryMap[p.category].count += 1
  }
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1].minutes - a[1].minutes)

  return (
    <div className="space-y-6">
      {/* Weekly Bar Chart */}
      <Card className="border-sky-200 dark:border-sky-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            Focus hebdomadaire
          </CardTitle>
          <CardDescription>Heures de concentration par jour cette semaine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-48 px-2">
            {weekData.map((d) => {
              const barHeight = maxBarHeight > 0 ? (d.totalMinutes / maxBarHeight) * 100 : 0
              return (
                <div key={d.dayKey} className="flex flex-col items-center flex-1 gap-2">
                  <span className="text-[10px] text-muted-foreground tabular-nums font-medium">
                    {d.totalMinutes > 0 ? formatMinutes(d.totalMinutes) : '—'}
                  </span>
                  <div className="w-full flex justify-center" style={{ height: '140px', alignItems: 'flex-end' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(barHeight, 4)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={cn(
                        'w-8 sm:w-10 rounded-t-md transition-colors',
                        d.totalMinutes > 0
                          ? 'bg-gradient-to-t from-sky-600 to-sky-400'
                          : 'bg-muted',
                      )}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{d.dayLabel}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 px-3">
            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{totalWeekPomodoros}</p>
            <p className="text-[10px] text-muted-foreground mt-1">pomodoros cette semaine</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 px-3">
            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{formatMinutes(totalWeekMinutes)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">focus total</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 px-3">
            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{formatMinutes(avgDailyMinutes)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">moyenne/jour actif</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 px-3">
            <p className="text-2xl font-bold text-amber-500">{maxDay?.dayLabel || '—'}</p>
            <p className="text-[10px] text-muted-foreground mt-1">jour le plus productif</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            Temps par catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune donnée cette semaine. Complétez des pomodoros pour voir vos statistiques !
            </p>
          ) : (
            <div className="space-y-3">
              {topCategories.map(([category, data]) => {
                const catInfo = TASK_CATEGORIES.find(c => c.value === category)
                const maxMinutes = topCategories[0]?.[1].minutes || 1
                const barWidth = (data.minutes / maxMinutes) * 100
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={cn('text-[10px] px-1.5', catInfo?.color)}>
                          {category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{data.count} pomodoro{data.count > 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-xs font-medium tabular-nums">{formatMinutes(data.minutes)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={cn(
                          'h-full rounded-full',
                          category === 'Production' ? 'bg-orange-500' :
                          category === 'Prospection' ? 'bg-sky-500' :
                          category === 'Admin' ? 'bg-gray-500' :
                          category === 'Formation' ? 'bg-emerald-500' :
                          'bg-violet-500',
                        )}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streak Card */}
      <Card className="bg-gradient-to-r from-amber-500/5 to-amber-300/5 border-amber-200 dark:border-amber-800">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {pomodoroData.streakDays > 0
                  ? `${pomodoroData.streakDays} jour${pomodoroData.streakDays > 1 ? 's' : ''} d'affilé avec ≥ 1 pomodoro !`
                  : 'Commencez votre série de productivité !'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Complétez au moins un pomodoro chaque jour pour maintenir votre streak.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Atelier Tab Content (existing)
// ═══════════════════════════════════════════════════════════════

function AtelierTab({
  data,
  setData,
  isLoading,
  isSaving,
  aiLoading,
  handleSave,
  handleAiAnalysis,
}: {
  data: GestionTempsData
  setData: React.Dispatch<React.SetStateAction<GestionTempsData>>
  isLoading: boolean
  isSaving: boolean
  aiLoading: boolean
  handleSave: () => Promise<void>
  handleAiAnalysis: () => Promise<void>
}) {
  const addToQuadrant = useCallback((quadrant: keyof EisenhowerMatrix, text: string) => {
    setData(prev => ({
      ...prev,
      eisenhower: {
        ...prev.eisenhower,
        [quadrant]: [...prev.eisenhower[quadrant], createTask(text)],
      },
    }))
  }, [setData])

  const removeFromQuadrant = useCallback((quadrant: keyof EisenhowerMatrix, id: string) => {
    setData(prev => ({
      ...prev,
      eisenhower: {
        ...prev.eisenhower,
        [quadrant]: prev.eisenhower[quadrant].filter(t => t.id !== id),
      },
    }))
  }, [setData])

  const updateWeekDay = useCallback((day: string, value: string) => {
    setData(prev => ({
      ...prev,
      weekSchedule: { ...prev.weekSchedule, [day]: value },
    }))
  }, [setData])

  const completion = useMemo(() => {
    let filled = 0
    const total = 4
    if (data.diagnostic.trim()) filled++
    const totalTasks = Object.values(data.eisenhower).reduce((s, q) => s + q.length, 0)
    if (totalTasks > 0) filled++
    const filledDays = Object.values(data.weekSchedule).filter(v => v.trim()).length
    if (filledDays >= 3) filled++
    if (filledDays >= 5) filled++
    return { filled, total, percent: Math.round((filled / total) * 100) }
  }, [data])

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI + Save buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-amber-400/40 text-amber-500 hover:bg-amber-400/10"
          onClick={handleAiAnalysis}
          disabled={aiLoading}
        >
          {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Aide IA
        </Button>
        <Button
          size="sm"
          className="gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Enregistrer
        </Button>
      </div>

      {/* ── Diagnostic temps ── */}
      <Card className="border-sky-200 dark:border-sky-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              Où passez-vous votre temps ?
            </CardTitle>
            <InfoPopover text="Listez vos activités quotidiennes avec le temps approximatif passé sur chacune. Cela vous aidera à identifier les pertes de temps et à mieux prioriser." />
          </div>
          <CardDescription>Atelier 5 — Diagnostic de votre emploi du temps</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.diagnostic}
            onChange={(e) => setData(prev => ({ ...prev, diagnostic: e.target.value }))}
            placeholder={"- Prospection clients : 3h\n- Réalisation prestation : 4h\n- Comptabilité : 1h\n- Réseaux sociaux : 1.5h\n- Emails & admin : 1h\n- Formation : 30min"}
            className="min-h-[160px] text-sm resize-none"
          />
        </CardContent>
      </Card>

      {/* ── Matrice Eisenhower ── */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          Matrice d&apos;Eisenhower
          <InfoPopover text="Classez vos tâches selon leur urgence et importance. Agissez sur les Urgent+Important, planifiez les Non-Urgent+Important, déléguez les Urgent+Non-Important, et éliminez les Non-Urgent+Non-Important." />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EisenhowerQuadrant
            title="Urgent & Important"
            description="FAIRE — Actions immédiates"
            color="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            bgColor="bg-red-50/50 dark:bg-red-950/20"
            borderColor="border-red-300 dark:border-red-800"
            icon={Timer}
            tasks={data.eisenhower.urgentImportant}
            onAdd={(text) => addToQuadrant('urgentImportant', text)}
            onRemove={(id) => removeFromQuadrant('urgentImportant', id)}
            placeholder="Ex: Livraison client urgente"
          />
          <EisenhowerQuadrant
            title="Urgent & Non-important"
            description="DÉLÉGUER — Confier à d'autres"
            color="bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
            bgColor="bg-amber-50/50 dark:bg-amber-950/20"
            borderColor="border-amber-300 dark:border-amber-800"
            icon={Clock}
            tasks={data.eisenhower.urgentNotImportant}
            onAdd={(text) => addToQuadrant('urgentNotImportant', text)}
            onRemove={(id) => removeFromQuadrant('urgentNotImportant', id)}
            placeholder="Ex: Répondre aux emails non-critiques"
          />
          <EisenhowerQuadrant
            title="Non-urgent & Important"
            description="PLANIFIER — Bloquer des créneaux"
            color="bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400"
            bgColor="bg-sky-50/50 dark:bg-sky-950/20"
            borderColor="border-sky-300 dark:border-sky-800"
            icon={CalendarDays}
            tasks={data.eisenhower.notUrgentImportant}
            onAdd={(text) => addToQuadrant('notUrgentImportant', text)}
            onRemove={(id) => removeFromQuadrant('notUrgentImportant', id)}
            placeholder="Ex: Stratégie, formation"
          />
          <EisenhowerQuadrant
            title="Non-urgent & Non-important"
            description="ÉLIMINER — Tâches à supprimer"
            color="bg-gray-100 text-gray-600 dark:bg-gray-800/20 dark:text-gray-400"
            bgColor="bg-gray-50/50 dark:bg-gray-950/20"
            borderColor="border-gray-300 dark:border-gray-700"
            icon={X}
            tasks={data.eisenhower.notUrgentNotImportant}
            onAdd={(text) => addToQuadrant('notUrgentNotImportant', text)}
            onRemove={(id) => removeFromQuadrant('notUrgentNotImportant', id)}
            placeholder="Ex: Scrolling réseaux sociaux"
          />
        </div>
      </div>

      <Separator />

      {/* ── Outils recommandés ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            Outils de productivité recommandés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OUTILS_PRODUCTIVITE.map((outil, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/20">
                  <Wrench className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{outil.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{outil.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Plan semaine type ── */}
      <Card className="border-sky-200 dark:border-sky-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              Plan de semaine type
            </CardTitle>
            <InfoPopover text="Organisez votre semaine idéale en allotant des créneaux pour chaque type d'activité. Bloquez les créneaux stratégiques en priorité le matin." />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS_FR.map((day) => (
              <div key={day} className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2 sm:w-32 shrink-0">
                  <Badge variant="outline" className="text-xs justify-center w-16">
                    {day.slice(0, 3)}
                  </Badge>
                </div>
                <input
                  type="text"
                  value={data.weekSchedule[day] || ''}
                  onChange={(e) => updateWeekDay(day, e.target.value)}
                  placeholder="8h-10h : Prospection | 10h-12h : Production | ..."
                  className="flex-1 text-sm rounded-lg border border-border bg-background/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Bottom Save Bar ── */}
      <Card className="bg-gradient-to-r from-sky-500/5 to-sky-300/5 border-sky-200 dark:border-sky-800">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: completion.total }).map((_, i) => (
                  <div key={i} className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    i < completion.filled ? 'bg-sky-500' : 'bg-muted',
                  )} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {completion.percent}% complété
              </span>
            </div>
            <Button
              size="sm"
              className="gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export function GestionTempsModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [data, setData] = useState<GestionTempsData>(DEFAULT_DATA)
  const [activeTab, setActiveTab] = useState('atelier')

  // ─── Pomodoro Timer (persists across tab switches) ───
  const {
    pomodoroState,
    start: pomodoroStart,
    pause: pomodoroPause,
    reset: pomodoroReset,
    skip: pomodoroSkip,
    updateSettings: pomodoroUpdateSettings,
    setTaskName: pomodoroSetTaskName,
    setCategory: pomodoroSetCategory,
  } = usePomodoroTimer()

  // ─── Load data on mount ──────────────────
  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem('creapulse-gestion-temps')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.diagnostic) setData(prev => ({ ...prev, diagnostic: parsed.diagnostic }))
          if (parsed.eisenhower) setData(prev => ({ ...prev, eisenhower: { ...prev.eisenhower, ...parsed.eisenhower } }))
          if (parsed.weekSchedule) setData(prev => ({ ...prev, weekSchedule: { ...prev.weekSchedule, ...parsed.weekSchedule } }))
        } catch { /* ignore */ }
      }

      try {
        const res = await authFetch('/api/paa/ateliers', {
          method: 'POST',
          body: JSON.stringify({ action: 'get', atelierCode: 'gestion-temps' }),
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const d = json.data
            if (d.diagnostic) setData(prev => ({ ...prev, diagnostic: d.diagnostic }))
            if (d.eisenhower) setData(prev => ({ ...prev, eisenhower: { ...prev.eisenhower, ...d.eisenhower } }))
            if (d.weekSchedule) setData(prev => ({ ...prev, weekSchedule: { ...prev.weekSchedule, ...d.weekSchedule } }))
          }
        }
      } catch { /* ignore */ }

      setIsLoading(false)
    }
    load()
  }, [])

  // ─── Auto-save to localStorage ──────────
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('creapulse-gestion-temps', JSON.stringify(data))
    }
  }, [isLoading, data])

  // ─── Completion ─────────────────────────
  const completion = useMemo(() => {
    let filled = 0
    const total = 4
    if (data.diagnostic.trim()) filled++
    const totalTasks = Object.values(data.eisenhower).reduce((s, q) => s + q.length, 0)
    if (totalTasks > 0) filled++
    const filledDays = Object.values(data.weekSchedule).filter(v => v.trim()).length
    if (filledDays >= 3) filled++
    if (filledDays >= 5) filled++
    return { filled, total, percent: Math.round((filled / total) * 100) }
  }, [data])

  // ─── Save to API ────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await authFetch('/api/paa/ateliers', {
        method: 'PUT',
        body: JSON.stringify({
          atelierCode: 'gestion-temps',
          diagnostic: data.diagnostic,
          eisenhower: data.eisenhower,
          weekSchedule: data.weekSchedule,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message || 'Erreur lors de la sauvegarde')
        return
      }
      toast.success('Atelier Gestion du Temps sauvegardé')
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }, [data])

  // ─── AI Analysis ────────────────────────
  const handleAiAnalysis = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await authFetch('/api/paa/ateliers', {
        method: 'POST',
        body: JSON.stringify({
          action: 'ai-analyze',
          atelierCode: 'gestion-temps',
          diagnostic: data.diagnostic,
          eisenhower: data.eisenhower,
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.suggestion) {
        const suggestion = json.data.suggestion
        if (typeof suggestion === 'string') {
          setData(prev => ({ ...prev, diagnostic: prev.diagnostic ? prev.diagnostic + '\n\n💡 ' + suggestion : '💡 ' + suggestion }))
        } else if (suggestion.eisenhower) {
          setData(prev => ({ ...prev, eisenhower: { ...prev.eisenhower, ...suggestion.eisenhower } }))
        }
        toast.success('Analyse IA générée !')
      } else {
        toast.error(json.error?.message || 'Erreur lors de la génération IA')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setAiLoading(false)
    }
  }, [data])

  // ─── Loading skeleton ───────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // ─── Main Render ─────────────────────────
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
            <Clock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Gestion du Temps &amp; Productivité</h2>
              <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 text-[10px] px-1.5">Atelier 5</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {completion.filled}/{completion.total} sections — {completion.percent}%
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 md:px-6 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/80">
            <TabsTrigger value="atelier" className="gap-1.5 text-xs sm:text-sm">
              <ListTodo className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Atelier</span>
              <span className="sm:hidden">Atelier</span>
            </TabsTrigger>
            <TabsTrigger value="pomodoro" className="gap-1.5 text-xs sm:text-sm">
              <CircleDot className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pomodoro</span>
              <span className="sm:hidden">Pomodoro</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Statistiques</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* Atelier Tab */}
          <TabsContent value="atelier">
            <AtelierTab
              data={data}
              setData={setData}
              isLoading={isLoading}
              isSaving={isSaving}
              aiLoading={aiLoading}
              handleSave={handleSave}
              handleAiAnalysis={handleAiAnalysis}
            />
          </TabsContent>

          {/* Pomodoro Tab */}
          <TabsContent value="pomodoro">
            <PomodoroTab
              pomodoroState={pomodoroState}
              onStart={pomodoroStart}
              onPause={pomodoroPause}
              onReset={pomodoroReset}
              onSkip={pomodoroSkip}
              onUpdateSettings={pomodoroUpdateSettings}
              onSetTaskName={pomodoroSetTaskName}
              onSetCategory={pomodoroSetCategory}
            />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <StatsTab pomodoroData={pomodoroState} />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  )
}
