// ============================================
// CreaPulse V3 — Strategy Pipeline Store (Zustand)
// Central state management for the entire Strategy pipeline
// Replaces scattered React useState + localStorage
// ============================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  PipelinePhase,
  ModuleId,
  ModuleStatus,
  BpSectionProvenance,
  PipelineRecommendation,
  PipelineHealth,
  PipelineV3ApiResponse,
} from '@/lib/pipeline-types'

// Re-export types for consumer convenience
export type {
  PipelinePhase,
  ModuleId,
  DataSource,
  ModuleStatus,
  BpSectionProvenance,
  PipelineRecommendation,
  PipelineHealth,
  PipelineV3ApiResponse,
}

// ─── Store State ───────────────────────────────

export interface PipelineV3State {
  // ─── Module statuses ───
  modules: Record<ModuleId, ModuleStatus>
  
  // ─── BP Section provenance ───
  sectionProvenance: BpSectionProvenance[]
  
  // ─── Pipeline health ───
  health: PipelineHealth
  
  // ─── Recommendations ───
  recommendations: PipelineRecommendation[]
  
  // ─── Sync tracking ───
  lastFullSync: string | null
  isSyncing: boolean
  
  // ─── Loading ───
  isLoading: boolean
  lastFetched: string | null
  
  // ─── Actions ───
  setModules: (modules: Record<ModuleId, ModuleStatus>) => void
  updateModule: (id: ModuleId, update: Partial<ModuleStatus>) => void
  setSectionProvenance: (provenance: BpSectionProvenance[]) => void
  setHealth: (health: PipelineHealth) => void
  setRecommendations: (recs: PipelineRecommendation[]) => void
  setSyncing: (syncing: boolean) => void
  setLoading: (loading: boolean) => void
  hydrateFromAPI: (data: PipelineV3ApiResponse) => void
  reset: () => void
  
  // ─── Computed selectors (as getters) ───
  getNextRecommendation: () => PipelineRecommendation | null
  getPhaseProgress: (phase: PipelinePhase) => number
  isPhaseComplete: (phase: PipelinePhase) => boolean
  getModuleById: (id: ModuleId) => ModuleStatus | undefined
}

// ─── Default module statuses ──────────────────

const DEFAULT_MODULES: Record<ModuleId, ModuleStatus> = {
  marche: {
    id: 'marche',
    label: 'Analyse de Marché',
    phase: 'simulateurs',
    completion: 0,
    hasData: false,
    lastSyncAt: null,
    sectionsFilled: 0,
    sectionsTotal: 6,
  },
  juridique: {
    id: 'juridique',
    label: 'Analyse Juridique',
    phase: 'simulateurs',
    completion: 0,
    hasData: false,
    lastSyncAt: null,
    sectionsFilled: 0,
    sectionsTotal: 1,
  },
  financier: {
    id: 'financier',
    label: 'Prévisions Financières',
    phase: 'simulateurs',
    completion: 0,
    hasData: false,
    lastSyncAt: null,
    sectionsFilled: 0,
    sectionsTotal: 5,
  },
  creasim: {
    id: 'creasim',
    label: 'CreaSim',
    phase: 'simulateurs',
    completion: 0,
    hasData: false,
    lastSyncAt: null,
    sectionsFilled: 0,
    sectionsTotal: 1,
  },
  bmc: {
    id: 'bmc',
    label: 'Business Model Canvas',
    phase: 'hub',
    completion: 0,
    hasData: false,
    lastSyncAt: null,
    sectionsFilled: 0,
    sectionsTotal: 9,
  },
  'business-plan': {
    id: 'business-plan',
    label: 'Business Plan',
    phase: 'hub',
    completion: 0,
    hasData: false,
    lastSyncAt: null,
    sectionsFilled: 0,
    sectionsTotal: 24,
  },
  'pitch-deck': {
    id: 'pitch-deck',
    label: 'Pitch Deck',
    phase: 'livrables',
    completion: 0,
    hasData: false,
    lastSyncAt: null,
    sectionsFilled: 0,
    sectionsTotal: 8,
  },
}

// ─── Store ───────────────────────────────────

export const useStrategyStore = create<PipelineV3State>()(
  persist(
    (set, get) => ({
      // ─── Initial State ───
      modules: { ...DEFAULT_MODULES },
      sectionProvenance: [],
      health: {
        overallScore: 0,
        weightedProgress: 0,
        rawProgress: 0,
        phasesComplete: 0,
        totalPhases: 4,
      },
      recommendations: [],
      lastFullSync: null,
      isSyncing: false,
      isLoading: false,
      lastFetched: null,

      // ─── Setters ───
      setModules: (modules) => set({ modules }),
      
      updateModule: (id, update) =>
        set((state) => ({
          modules: {
            ...state.modules,
            [id]: { ...state.modules[id], ...update },
          },
        })),

      setSectionProvenance: (provenance) => set({ sectionProvenance: provenance }),
      
      setHealth: (health) => set({ health }),
      
      setRecommendations: (recs) => set({ recommendations: recs }),
      
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      
      setLoading: (loading) => set({ isLoading: loading }),

      hydrateFromAPI: (data) =>
        set({
          modules: data.modules,
          sectionProvenance: data.sectionProvenance,
          health: data.health,
          recommendations: data.recommendations,
          lastFullSync: new Date().toISOString(),
          isLoading: false,
          lastFetched: new Date().toISOString(),
        }),

      reset: () =>
        set({
          modules: { ...DEFAULT_MODULES },
          sectionProvenance: [],
          health: {
            overallScore: 0,
            weightedProgress: 0,
            rawProgress: 0,
            phasesComplete: 0,
            totalPhases: 4,
          },
          recommendations: [],
          lastFullSync: null,
          isSyncing: false,
          isLoading: false,
          lastFetched: null,
        }),

      // ─── Computed Getters ───
      getNextRecommendation: () => {
        const { recommendations } = get()
        if (recommendations.length === 0) return null
        return recommendations.reduce((a, b) => (a.priority < b.priority ? a : b))
      },

      getPhaseProgress: (phase) => {
        const { modules } = get()
        const phaseModules = Object.values(modules).filter((m) => m.phase === phase)
        if (phaseModules.length === 0) return 0
        return Math.round(phaseModules.reduce((sum, m) => sum + m.completion, 0) / phaseModules.length)
      },

      isPhaseComplete: (phase) => {
        const { modules } = get()
        const phaseModules = Object.values(modules).filter((m) => m.phase === phase)
        return phaseModules.length > 0 && phaseModules.every((m) => m.completion >= 80)
      },

      getModuleById: (id) => get().modules[id],
    }),
    {
      name: 'creapulse-strategy-v3',
      partialize: (state) => ({
        modules: state.modules,
        health: state.health,
        sectionProvenance: state.sectionProvenance,
        lastFullSync: state.lastFullSync,
      }),
    }
  )
)

// ─── Hook: fetch pipeline V3 data ─────────────

export function usePipelineV3() {
  const store = useStrategyStore()
  
  const fetchPipelineData = async () => {
    store.setLoading(true)
    try {
      const res = await fetch('/api/pipeline-v3', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          store.hydrateFromAPI(json.data as PipelineV3ApiResponse)
        }
      }
    } catch {
      // Silently fail — use cached data from store
    } finally {
      store.setLoading(false)
    }
  }

  const syncModule = async (moduleId: ModuleId) => {
    store.setSyncing(true)
    try {
      const res = await fetch('/api/pipeline-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'sync-module', module: moduleId }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          store.hydrateFromAPI(json.data as PipelineV3ApiResponse)
          return true
        }
      }
      return false
    } catch {
      return false
    } finally {
      store.setSyncing(false)
    }
  }

  return {
    ...store,
    fetchPipelineData,
    syncModule,
  }
}
