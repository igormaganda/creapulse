// ─── Shared types & constants for pepites sub-components ──────────

export type GameMode = 'select' | 'swipe' | 'questionnaire' | 'scenario' | 'bilan' | 'results'
export type SwipeAction = 'pass' | 'pepite' | 'superPepite'

export interface DimensionScore {
  dimension: string
  label: string
  emoji: string
  score: number
  sources: string[]
}

export const DIMENSION_COLORS: Record<string, string> = {
  leadership: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  stress: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  communication: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  resolution: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  creativity: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  adaptability: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export const DIMENSION_CHART_COLORS: Record<string, string> = {
  leadership: '#f59e0b',
  stress: '#0ea5e9',
  communication: '#8b5cf6',
  resolution: '#f43f5e',
  creativity: '#14b8a6',
  adaptability: '#10b981',
}

export const DIMENSION_LABELS: Record<string, string> = {
  leadership: 'Leadership & Vision',
  stress: 'Gestion du stress',
  communication: 'Communication',
  resolution: 'Résolution de problèmes',
  creativity: 'Créativité & Innovation',
  adaptability: 'Adaptabilité',
}

export const OPTION_LABELS = ['A', 'B', 'C', 'D']

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
