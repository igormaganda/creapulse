'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Phase Configuration (SOP) ───────────────

export interface PhaseStep {
  code: string
  label: string
  recommendedMinutes: number
  status: 'pending' | 'in_progress' | 'completed'
}

export interface PhaseConfig {
  id: string
  name: string
  shortName: string
  color: string
  icon: string
  recommendedMinutes: number
  steps: PhaseStep[]
}

export const CREASCOPE_PHASES: PhaseConfig[] = [
  {
    id: '1',
    name: 'Accueil & Acculturation',
    shortName: 'Accueil',
    color: '#00838F',
    icon: 'Handshake',
    recommendedMinutes: 20,
    steps: [
      { code: '1.1', label: 'Accueil du porteur', recommendedMinutes: 5, status: 'pending' },
      { code: '1.2', label: 'Vérification profil créateur', recommendedMinutes: 5, status: 'pending' },
      { code: '1.3', label: 'Présentation du projet', recommendedMinutes: 5, status: 'pending' },
      { code: '1.4', label: 'Expliquer le déroulé CréaScope', recommendedMinutes: 3, status: 'pending' },
      { code: '1.5', label: 'Lancer la session', recommendedMinutes: 2, status: 'pending' },
    ],
  },
  {
    id: '2',
    name: 'Découverte (Pépites)',
    shortName: 'Découverte',
    color: '#FF6B35',
    icon: 'Search',
    recommendedMinutes: 45,
    steps: [
      { code: '2.1', label: 'Lancer le Jeu de Pépites', recommendedMinutes: 30, status: 'pending' },
      { code: '2.2', label: 'Observer le comportement', recommendedMinutes: 10, status: 'pending' },
      { code: '2.3', label: 'Analyser les résultats Kiviat', recommendedMinutes: 5, status: 'pending' },
    ],
  },
  {
    id: '3',
    name: 'Approfondissement',
    shortName: 'Approfondissement',
    color: '#FFB74D',
    icon: 'Brain',
    recommendedMinutes: 60,
    steps: [
      { code: '3.1', label: 'Analyse du projet', recommendedMinutes: 15, status: 'pending' },
      { code: '3.2', label: 'Complément RIASEC', recommendedMinutes: 15, status: 'pending' },
      { code: '3.3', label: 'Analyse de marché', recommendedMinutes: 10, status: 'pending' },
      { code: '3.4', label: 'Simulation financière', recommendedMinutes: 10, status: 'pending' },
      { code: '3.5', label: 'Statut juridique', recommendedMinutes: 10, status: 'pending' },
    ],
  },
  {
    id: '4',
    name: 'Synthèse & Recommandations',
    shortName: 'Synthèse',
    color: '#AB47BC',
    icon: 'FileCheck',
    recommendedMinutes: 40,
    steps: [
      { code: '4.1', label: 'Bilan IA automatisé', recommendedMinutes: 10, status: 'pending' },
      { code: '4.2', label: 'Discussion du bilan', recommendedMinutes: 10, status: 'pending' },
      { code: '4.3', label: 'Tremplin Go/No-Go', recommendedMinutes: 10, status: 'pending' },
      { code: '4.4', label: 'Discussion Tremplin', recommendedMinutes: 5, status: 'pending' },
      { code: '4.5', label: 'Recommandations', recommendedMinutes: 5, status: 'pending' },
    ],
  },
  {
    id: '5',
    name: "Plan d'Action",
    shortName: 'Plan d\'Action',
    color: '#43A047',
    icon: 'Rocket',
    recommendedMinutes: 25,
    steps: [
      { code: '5.1', label: 'Actions prioritaires', recommendedMinutes: 8, status: 'pending' },
      { code: '5.2', label: 'Livrables attendus', recommendedMinutes: 4, status: 'pending' },
      { code: '5.3', label: 'Prochain rendez-vous', recommendedMinutes: 3, status: 'pending' },
      { code: '5.4', label: 'Passeport Entrepreneurial', recommendedMinutes: 5, status: 'pending' },
      { code: '5.5', label: 'Feedback session', recommendedMinutes: 3, status: 'pending' },
      { code: '5.6', label: 'Clôture', recommendedMinutes: 2, status: 'pending' },
    ],
  },
]

// ─── Types for phase components ──────────────

export type TremplinDecision = 'GO' | 'GO_CONDITIONNEL' | 'NO_GO'

export interface ActionPlanItem {
  id: string
  action: string
  deadline: string
  responsible: string
  status: 'todo' | 'in_progress' | 'done'
}

export interface KiviatScore {
  dimension: string
  score: number
  maxScore: number
}

export interface AccueilState {
  steps: {
    accueilPorteur: boolean
    verificationProfil: boolean
    presentationProjet: boolean
    expliquerDeroule: boolean
    lancerSession: boolean
  }
  notes: string
}

export interface DecouverteState {
  swipeCompleted: boolean
  kiviatScores: KiviatScore[]
  observations: string
}

export interface ApprofondissementState {
  notes: string
}

export interface SyntheseState {
  bilanDiscussion: string
  tremplinDecision: TremplinDecision | null
  tremplinDiscussion: string
  recommendations: string
  synthesis: string
}

export interface PlanActionState {
  actionItems: ActionPlanItem[]
  nextRendezVousNotes: string
  feedbackScore: number | null
  feedbackText: string
  completed: boolean
}

export interface PhaseNote {
  id: string
  phaseIndex: number
  content: string
  createdAt: number
}

// ─── Root store state ────────────────────────

export type SessionStatus = 'idle' | 'active' | 'paused' | 'completed'

export interface CreaScopeState {
  // ── Session orchestration (for creascope-session.tsx) ──
  isSessionActive: boolean
  sessionStatus: SessionStatus
  currentPhaseIndex: number
  phases: PhaseConfig[]
  sessionStartedAt: number | null
  phaseStartedAt: number | null
  totalPausedMs: number
  phasePausedMs: number
  pausedAt: number | null
  notes: PhaseNote[]
  sessionId: string | null
  sessionCompleted: boolean

  // ── Phase-specific state (for phase components) ──
  accueil: AccueilState
  decouverte: DecouverteState
  approfondissement: ApprofondissementState
  synthese: SyntheseState
  planAction: PlanActionState

  // ── Session actions ──
  startSession: () => void
  pauseSession: () => void
  resumeSession: () => void
  nextPhase: () => void
  goToPhase: (index: number) => void
  completeSession: () => void
  resetSession: () => void

  // ── Notes actions ──
  addPhaseNote: (phaseIndex: number, content: string) => void
  updatePhaseNote: (noteId: string, content: string) => void

  // ── Accueil actions ──
  toggleAccueilStep: (step: keyof AccueilState['steps']) => void
  setAccueilNotes: (notes: string) => void

  // ── Découverte actions ──
  setSwipeCompleted: (completed: boolean) => void
  setKiviatScores: (scores: KiviatScore[]) => void
  setDecouverteObservations: (obs: string) => void

  // ── Approfondissement actions ──
  setApprofondissementNotes: (notes: string) => void

  // ── Synthèse actions ──
  setBilanDiscussion: (text: string) => void
  setTremplinDecision: (decision: TremplinDecision | null) => void
  setTremplinDiscussion: (text: string) => void
  setRecommendations: (text: string) => void
  setSynthesisText: (text: string) => void

  // ── Plan d'Action actions ──
  addActionItem: () => void
  updateActionItem: (id: string, field: keyof Omit<ActionPlanItem, 'id'>, value: string | number) => void
  removeActionItem: (id: string) => void
  setNextRendezVousNotes: (text: string) => void
  setFeedbackScore: (score: number | null) => void
  setFeedbackText: (text: string) => void
}

// ─── Default values ──────────────────────────

const defaultAccueil: AccueilState = {
  steps: {
    accueilPorteur: false,
    verificationProfil: false,
    presentationProjet: false,
    expliquerDeroule: false,
    lancerSession: false,
  },
  notes: '',
}

const defaultDecouverte: DecouverteState = {
  swipeCompleted: false,
  kiviatScores: [],
  observations: '',
}

const defaultApprofondissement: ApprofondissementState = {
  notes: '',
}

const defaultSynthese: SyntheseState = {
  bilanDiscussion: '',
  tremplinDecision: null,
  tremplinDiscussion: '',
  recommendations: '',
  synthesis: '',
}

const defaultPlanAction: PlanActionState = {
  actionItems: [],
  nextRendezVousNotes: '',
  feedbackScore: null,
  feedbackText: '',
  completed: false,
}

function clonePhases(): PhaseConfig[] {
  return CREASCOPE_PHASES.map((p) => ({
    ...p,
    steps: p.steps.map((s) => ({ ...s })),
  }))
}

// ─── Store ────────────────────────────────────

export const useCreaScopeStore = create<CreaScopeState>()(
  persist(
    (set, get) => ({
      // Session orchestration
      isSessionActive: false,
      sessionStatus: 'idle' as SessionStatus,
      currentPhaseIndex: 0,
      phases: clonePhases(),
      sessionStartedAt: null,
      phaseStartedAt: null,
      totalPausedMs: 0,
      phasePausedMs: 0,
      pausedAt: null,
      notes: [],
      sessionId: null,
      sessionCompleted: false,

      // Phase-specific data
      accueil: { ...defaultAccueil },
      decouverte: { ...defaultDecouverte },
      approfondissement: { ...defaultApprofondissement },
      synthese: { ...defaultSynthese },
      planAction: { ...defaultPlanAction },

      // ── Session actions ──

      startSession: () =>
        set({
          isSessionActive: true,
          sessionStatus: 'active',
          sessionStartedAt: Date.now(),
          phaseStartedAt: Date.now(),
          currentPhaseIndex: 0,
          phases: clonePhases(),
          totalPausedMs: 0,
          phasePausedMs: 0,
          pausedAt: null,
          notes: [],
          sessionCompleted: false,
          accueil: { ...defaultAccueil },
          decouverte: { ...defaultDecouverte },
          approfondissement: { ...defaultApprofondissement },
          synthese: { ...defaultSynthese },
          planAction: { ...defaultPlanAction },
        }),

      pauseSession: () =>
        set({
          sessionStatus: 'paused',
          pausedAt: Date.now(),
        }),

      resumeSession: () => {
        const { pausedAt, totalPausedMs, phasePausedMs } = get()
        const pausedDuration = pausedAt ? Date.now() - pausedAt : 0
        set({
          sessionStatus: 'active',
          pausedAt: null,
          totalPausedMs: totalPausedMs + pausedDuration,
          phasePausedMs: phasePausedMs + pausedDuration,
        })
      },

      nextPhase: () => {
        const { currentPhaseIndex, phases, phasePausedMs, totalPausedMs } = get()
        if (currentPhaseIndex < phases.length - 1) {
          // Mark all steps of current phase as completed
          const updatedPhases = phases.map((p, i) => {
            if (i === currentPhaseIndex) {
              return { ...p, steps: p.steps.map((s) => ({ ...s, status: 'completed' as const })) }
            }
            if (i === currentPhaseIndex + 1) {
              return {
                ...p,
                steps: p.steps.map((s, j) => ({
                  ...s,
                  status: j === 0 ? ('in_progress' as const) : ('pending' as const),
                })),
              }
            }
            return p
          })
          set({
            currentPhaseIndex: currentPhaseIndex + 1,
            phases: updatedPhases,
            phaseStartedAt: Date.now(),
            phasePausedMs: 0,
          })
        } else {
          // Last phase — complete session
          set({
            sessionStatus: 'completed',
            isSessionActive: false,
            sessionCompleted: true,
          })
        }
      },

      goToPhase: (index: number) => {
        if (index < 0 || index >= CREASCOPE_PHASES.length) return
        const { currentPhaseIndex, phasePausedMs, totalPausedMs, phases } = get()
        if (index <= currentPhaseIndex) {
          // Accumulate paused time for the phase we're leaving
          const accumulatedPause = phasePausedMs
          set({
            currentPhaseIndex: index,
            phases: phases.map((p, i) => ({
              ...p,
              steps: i < index
                ? p.steps.map((s) => ({ ...s, status: 'completed' as const }))
                : i === index
                  ? p.steps.map((s) => ({
                      ...s,
                      status: s.status === 'completed' ? 'completed' as const : 'pending' as const,
                    }))
                  : p.steps.map((s) => ({ ...s, status: 'pending' as const })),
            })),
            phaseStartedAt: Date.now(),
            phasePausedMs: 0,
            totalPausedMs: totalPausedMs + accumulatedPause,
          })
        }
      },

      completeSession: () =>
        set((s) => ({
          sessionStatus: 'completed' as SessionStatus,
          isSessionActive: false,
          sessionCompleted: true,
          planAction: { ...s.planAction, completed: true },
        })),

      resetSession: () =>
        set({
          isSessionActive: false,
          sessionStatus: 'idle' as SessionStatus,
          currentPhaseIndex: 0,
          phases: clonePhases(),
          sessionStartedAt: null,
          phaseStartedAt: null,
          totalPausedMs: 0,
          phasePausedMs: 0,
          pausedAt: null,
          notes: [],
          sessionId: null,
          sessionCompleted: false,
          accueil: { ...defaultAccueil },
          decouverte: { ...defaultDecouverte },
          approfondissement: { ...defaultApprofondissement },
          synthese: { ...defaultSynthese },
          planAction: { ...defaultPlanAction },
        }),

      // ── Notes actions ──

      addPhaseNote: (phaseIndex, content) =>
        set((s) => ({
          notes: [
            ...s.notes,
            {
              id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              phaseIndex,
              content,
              createdAt: Date.now(),
            },
          ],
        })),

      updatePhaseNote: (noteId, content) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === noteId ? { ...n, content } : n)),
        })),

      // ── Accueil actions ──

      toggleAccueilStep: (step) =>
        set((s) => ({
          accueil: {
            ...s.accueil,
            steps: { ...s.accueil.steps, [step]: !s.accueil.steps[step] },
          },
        })),

      setAccueilNotes: (notes) =>
        set((s) => ({ accueil: { ...s.accueil, notes } })),

      // ── Découverte actions ──

      setSwipeCompleted: (completed) =>
        set((s) => ({ decouverte: { ...s.decouverte, swipeCompleted: completed } })),

      setKiviatScores: (scores) =>
        set((s) => ({ decouverte: { ...s.decouverte, kiviatScores: scores } })),

      setDecouverteObservations: (obs) =>
        set((s) => ({ decouverte: { ...s.decouverte, observations: obs } })),

      // ── Approfondissement actions ──

      setApprofondissementNotes: (notes) =>
        set((s) => ({ approfondissement: { ...s.approfondissement, notes } })),

      // ── Synthèse actions ──

      setBilanDiscussion: (text) =>
        set((s) => ({ synthese: { ...s.synthese, bilanDiscussion: text } })),

      setTremplinDecision: (decision) =>
        set((s) => ({ synthese: { ...s.synthese, tremplinDecision: decision } })),

      setTremplinDiscussion: (text) =>
        set((s) => ({ synthese: { ...s.synthese, tremplinDiscussion: text } })),

      setRecommendations: (text) =>
        set((s) => ({ synthese: { ...s.synthese, recommendations: text } })),

      setSynthesisText: (text) =>
        set((s) => ({ synthese: { ...s.synthese, synthesis: text } })),

      // ── Plan d'Action actions ──

      addActionItem: () =>
        set((s) => ({
          planAction: {
            ...s.planAction,
            actionItems: [
              ...s.planAction.actionItems,
              {
                id: `act-${Date.now()}`,
                action: '',
                deadline: '',
                responsible: '',
                status: 'todo',
              },
            ],
          },
        })),

      updateActionItem: (id, field, value) =>
        set((s) => ({
          planAction: {
            ...s.planAction,
            actionItems: s.planAction.actionItems.map((item) =>
              item.id === id ? { ...item, [field]: value } : item
            ),
          },
        })),

      removeActionItem: (id) =>
        set((s) => ({
          planAction: {
            ...s.planAction,
            actionItems: s.planAction.actionItems.filter((item) => item.id !== id),
          },
        })),

      setNextRendezVousNotes: (text) =>
        set((s) => ({ planAction: { ...s.planAction, nextRendezVousNotes: text } })),

      setFeedbackScore: (score) =>
        set((s) => ({ planAction: { ...s.planAction, feedbackScore: score } })),

      setFeedbackText: (text) =>
        set((s) => ({ planAction: { ...s.planAction, feedbackText: text } })),
    }),
    {
      name: 'creascope-session',
      partialize: (state) => ({
        sessionStatus: state.sessionStatus,
        currentPhaseIndex: state.currentPhaseIndex,
        phases: state.phases,
        sessionStartedAt: state.sessionStartedAt,
        totalPausedMs: state.totalPausedMs,
        notes: state.notes,
        sessionId: state.sessionId,
        sessionCompleted: state.sessionCompleted,
        accueil: state.accueil,
        decouverte: state.decouverte,
        approfondissement: state.approfondissement,
        synthese: state.synthese,
        planAction: state.planAction,
      }),
    }
  )
)
