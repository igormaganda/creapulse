// ─── Shared types & constants for creascope sub-components ──────────

export interface Session {
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

export interface AISuggestion {
  focus: string[]
  questions: string[]
  observations: string
  approach: string
}

export const STEPS = [
  { key: 'ACCUEIL', label: 'Accueil', icon: '👋', duration: '10 min', color: 'bg-teal-500' },
  { key: 'FLASH_SWIPE', label: 'Flash Swipe', icon: '⚡', duration: '8 min', color: 'bg-amber-500' },
  { key: 'ANALYSE_INTERMEDIAIRE', label: 'Analyse IA', icon: '🧠', duration: '15 min', color: 'bg-purple-500' },
  { key: 'QUESTIONNAIRE', label: 'Questionnaire', icon: '📋', duration: '20 min', color: 'bg-sky-500' },
  { key: 'CHALLENGE_SCENARIO', label: 'Challenge Scénario', icon: '🎯', duration: '15 min', color: 'bg-rose-500' },
  { key: 'BILAN_IA', label: 'Bilan IA', icon: '📊', duration: '20 min', color: 'bg-indigo-500' },
  { key: 'PLAN_ACTION', label: 'Plan d\'Action', icon: '🚀', duration: '20 min', color: 'bg-emerald-500' },
] as const

export const STATUS_COLORS: Record<string, string> = {
  PLANIFIEE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  EN_COURS: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  PAUSEE: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  TERMINEE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ANNULEE: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export const STATUS_LABELS: Record<string, string> = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  PAUSEE: 'En pause',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
}

export const STEP_INSTRUCTIONS: Record<string, { title: string; desc: string }> = {
  ACCUEIL: { title: 'Phase d\'accueil', desc: 'Accueillez le bénéficiaire, présentez le déroulé de la session CréaScope et recueillez ses attentes.' },
  FLASH_SWIPE: { title: 'Flash Swipe', desc: 'Le bénéficiaire swippe 60 cartes compétences pour identifier ses soft skills. Durée estimée: 5-8 minutes.' },
  ANALYSE_INTERMEDIAIRE: { title: 'Analyse intermédiaire', desc: 'Présentez les résultats du Flash Swipe et analysez les premières tendances avec le bénéficiaire.' },
  QUESTIONNAIRE: { title: 'Questionnaire approfondi', desc: 'Le bénéficiaire répond à 15 questions adaptatives pour affiner son profil entrepreneurial.' },
  CHALLENGE_SCENARIO: { title: 'Challenge Scénario', desc: '10 scénarios entrepreneuriaux réalistes pour tester la prise de décision en situation.' },
  BILAN_IA: { title: 'Bilan IA complet', desc: 'Présentation du bilan complet généré par l\'IA avec co-analyse des résultats.' },
  PLAN_ACTION: { title: 'Plan d\'action', desc: 'Co-construction du plan d\'action personnalisé avec le bénéficiaire.' },
}

// ─── Helpers ─────────────────────────────────────

export function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getStepIndex(step: string): number {
  return STEPS.findIndex((s) => s.key === step)
}
