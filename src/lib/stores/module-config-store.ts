'use client'

import { create } from 'zustand'
import { MODULE_REGISTRY, getModuleDef } from '@/lib/module-registry'

/* ─── Types ─── */
interface ActiveModule {
  code: string
  isActive: boolean
  sortOrder?: number
  config?: Record<string, unknown>
}

/** PAA module codes — used to identify PAA modules for pack-level filtering */
const PAA_MODULE_CODES = [
  'parcours-paa',
  'swot',
  'objectifs-smart',
  'gestion-temps',
  'gestion-crise',
  'cloture-rebond',
  'marketing-commerciale',
  'mind-map',
  'satisfaction-feedback',
] as const

type PaaModuleCode = (typeof PAA_MODULE_CODES)[number]

interface PaaConfig {
  enabled: boolean
  modules: Record<PaaModuleCode, boolean>
}

interface ModuleConfigState {
  /** Map of module code → active status (true = visible/enabled) */
  activeModules: Map<string, boolean>
  /** Whether the config has been loaded from the API */
  loaded: boolean
  /** Whether we're currently fetching */
  loading: boolean
  /** Whether admin mode (shows all modules regardless) */
  adminMode: boolean

  /** PAA pack enabled status */
  isPaaEnabled: boolean
  /** Individual PAA module enabled status */
  paaModules: Record<PaaModuleCode, boolean>

  // Actions
  fetchActiveModules: () => Promise<void>
  isModuleActive: (code: string) => boolean
  isPaaModule: (code: string) => boolean
  getActiveModulesForSection: (section: string) => string[]
  getAllActiveCodes: () => string[]
  toggleModule: (code: string, active: boolean) => void
  setAdminMode: (enabled: boolean) => void
  togglePaaPack: (enabled: boolean) => void
  togglePaaModule: (code: PaaModuleCode, enabled: boolean) => void
  reset: () => void
}

/* ─── Default: all modules active ─── */
function createDefaultMap(): Map<string, boolean> {
  return new Map(MODULE_REGISTRY.map((m) => [m.code, true]))
}

/* ─── Default PAA state ─── */
const DEFAULT_PAA_MODULES: Record<PaaModuleCode, boolean> = {
  'parcours-paa': true,
  'swot': true,
  'objectifs-smart': true,
  'gestion-temps': true,
  'gestion-crise': true,
  'cloture-rebond': true,
  'marketing-commerciale': true,
  'mind-map': true,
  'satisfaction-feedback': true,
}

/* ─── Store ─── */
export const useModuleConfigStore = create<ModuleConfigState>((set, get) => ({
  activeModules: createDefaultMap(),
  loaded: false,
  loading: false,
  adminMode: false,

  isPaaEnabled: false,
  paaModules: { ...DEFAULT_PAA_MODULES },

  fetchActiveModules: async () => {
    // Don't refetch if already loaded (unless forced)
    if (get().loaded) return

    set({ loading: true })

    try {
      // Fetch regular modules
      const modulesRes = await fetch('/api/modules', { credentials: 'include' })
      let activeMap = createDefaultMap()

      if (modulesRes.ok) {
        const json = await modulesRes.json()
        if (json.success && json.data) {
          // Merge API data: mark inactive modules
          const apiModules: ActiveModule[] = json.data
          for (const mod of apiModules) {
            if (mod.isActive === false) {
              activeMap.set(mod.code, false)
            }
          }
        }
      }

      // Fetch PAA config in parallel
      try {
        const paaRes = await fetch('/api/admin-plateforme/configuration?section=paa', {
          credentials: 'include',
        })
        if (paaRes.ok) {
          const paaJson = await paaRes.json()
          if (paaJson.success && paaJson.data?.paa) {
            const paa = paaJson.data.paa as PaaConfig
            set({
              isPaaEnabled: paa.enabled ?? false,
              paaModules: { ...DEFAULT_PAA_MODULES, ...paa.modules },
            })
          }
        }
      } catch {
        // PAA config unavailable — keep defaults (disabled)
      }

      set({ activeModules: activeMap, loaded: true, loading: false })
      return
    } catch {
      // API unavailable — keep defaults (all active)
    }

    // Fallback: all modules active
    set({ activeModules: createDefaultMap(), loaded: true, loading: false })
  },

  isModuleActive: (code: string) => {
    const state = get()
    // Admin mode: show all modules
    if (state.adminMode) return true

    // Check if this is a PAA module
    if (PAA_MODULE_CODES.includes(code as PaaModuleCode)) {
      // If PAA pack is disabled, all PAA modules are hidden
      if (!state.isPaaEnabled) return false
      // Otherwise check individual module status
      return state.paaModules[code as PaaModuleCode] === true
    }

    const def = getModuleDef(code)
    // Unknown modules are inactive
    if (!def) return false
    // Core modules are always active (unless explicitly disabled)
    if (def.core) return state.activeModules.get(code) !== false
    return state.activeModules.get(code) === true
  },

  isPaaModule: (code: string) => {
    return PAA_MODULE_CODES.includes(code as PaaModuleCode)
  },

  getActiveModulesForSection: (section: string) => {
    return MODULE_REGISTRY
      .filter((m) => m.section === section && get().isModuleActive(m.code))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => m.code)
  },

  getAllActiveCodes: () => {
    const state = get()
    const registryCodes = MODULE_REGISTRY
      .filter((m) => state.isModuleActive(m.code))
      .map((m) => m.code)

    // Include active PAA modules
    const paaCodes: string[] = []
    if (state.isPaaEnabled) {
      for (const code of PAA_MODULE_CODES) {
        if (state.paaModules[code]) {
          paaCodes.push(code)
        }
      }
    }

    return [...registryCodes, ...paaCodes]
  },

  toggleModule: (code: string, active: boolean) => {
    set((state) => {
      const newMap = new Map(state.activeModules)
      newMap.set(code, active)
      return { activeModules: newMap }
    })
  },

  setAdminMode: (enabled: boolean) => {
    set({ adminMode: enabled })
  },

  togglePaaPack: (enabled: boolean) => {
    set((state) => ({
      isPaaEnabled: enabled,
      // When pack is disabled, disable all individual modules
      paaModules: enabled
        ? state.paaModules
        : { ...DEFAULT_PAA_MODULES } as Record<PaaModuleCode, boolean>,
    }))
  },

  togglePaaModule: (code: PaaModuleCode, enabled: boolean) => {
    set((state) => ({
      paaModules: { ...state.paaModules, [code]: enabled },
    }))
  },

  reset: () => {
    set({
      activeModules: createDefaultMap(),
      loaded: false,
      loading: false,
      isPaaEnabled: false,
      paaModules: { ...DEFAULT_PAA_MODULES },
    })
  },
}))
