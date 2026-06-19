'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/auth-fetch'

// ─── Types ──────────────────────────────────

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

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

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

// ─── Helpers ────────────────────────────────

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

// ─── Eisenhower Quadrant Sub-component ─────────

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

// ─── Main Component ─────────────────────────

export function GestionTempsModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [data, setData] = useState<GestionTempsData>(DEFAULT_DATA)

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

  // ─── Eisenhower helpers ─────────────────
  const addToQuadrant = useCallback((quadrant: keyof EisenhowerMatrix, text: string) => {
    setData(prev => ({
      ...prev,
      eisenhower: {
        ...prev.eisenhower,
        [quadrant]: [...prev.eisenhower[quadrant], createTask(text)],
      },
    }))
  }, [])

  const removeFromQuadrant = useCallback((quadrant: keyof EisenhowerMatrix, id: string) => {
    setData(prev => ({
      ...prev,
      eisenhower: {
        ...prev.eisenhower,
        [quadrant]: prev.eisenhower[quadrant].filter(t => t.id !== id),
      },
    }))
  }, [])

  // ─── Week schedule helper ───────────────
  const updateWeekDay = useCallback((day: string, value: string) => {
    setData(prev => ({
      ...prev,
      weekSchedule: { ...prev.weekSchedule, [day]: value },
    }))
  }, [])

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
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
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
    </motion.div>
  )
}
