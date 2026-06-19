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

interface ModuleConfigState {
  /** Map of module code → active status (true = visible/enabled) */
  activeModules: Map<string, boolean>
  /** Whether the config has been loaded from the API */
  loaded: boolean
  /** Whether we're currently fetching */
  loading: boolean
  /** Whether admin mode (shows all modules regardless) */
  adminMode: boolean

  // Actions
  fetchActiveModules: () => Promise<void>
  isModuleActive: (code: string) => boolean
  getActiveModulesForSection: (section: string) => string[]
  getAllActiveCodes: () => string[]
  toggleModule: (code: string, active: boolean) => void
  setAdminMode: (enabled: boolean) => void
  reset: () => void
}

/* ─── Default: all modules active ─── */
function createDefaultMap(): Map<string, boolean> {
  return new Map(MODULE_REGISTRY.map((m) => [m.code, true]))
}

/* ─── Store ─── */
export const useModuleConfigStore = create<ModuleConfigState>((set, get) => ({
  activeModules: createDefaultMap(),
  loaded: false,
  loading: false,
  adminMode: false,

  fetchActiveModules: async () => {
    // Don't refetch if already loaded (unless forced)
    if (get().loaded) return

    set({ loading: true })

    try {
      const res = await fetch('/api/modules', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          const activeMap = createDefaultMap()

          // Merge API data: mark inactive modules
          const apiModules: ActiveModule[] = json.data
          for (const mod of apiModules) {
            if (mod.isActive === false) {
              activeMap.set(mod.code, false)
            }
          }

          set({ activeModules: activeMap, loaded: true })
          return
        }
      }
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
    const def = getModuleDef(code)
    // Unknown modules are inactive
    if (!def) return false
    // Core modules are always active (unless explicitly disabled)
    if (def.core) return state.activeModules.get(code) !== false
    return state.activeModules.get(code) === true
  },

  getActiveModulesForSection: (section: string) => {
    return MODULE_REGISTRY
      .filter((m) => m.section === section && get().isModuleActive(m.code))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => m.code)
  },

  getAllActiveCodes: () => {
    return MODULE_REGISTRY
      .filter((m) => get().isModuleActive(m.code))
      .map((m) => m.code)
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

  reset: () => {
    set({ activeModules: createDefaultMap(), loaded: false, loading: false })
  },
}))
