// ============================================
// CreaPulse V2 — Dispositif Store (Zustand)
// Client-side state for multi-dispositif enrollments
// ============================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ───────────────────────────────────

export interface DispositifInfo {
  id: string
  code: string
  name: string
  description: string | null
  type: string        // DispositifType from Prisma
  color: string
  icon: string
  progress: number
  status: string      // EnrollmentStatus from Prisma
  projectTitle: string | null
  hasProjectData?: boolean
}

export interface AvailableProject {
  enrollmentId: string | null
  dispositifCode: string
  dispositifName: string
  dispositifColor: string
  dispositifIcon: string
  projectTitle: string | null
  hasData: boolean
}

export interface DispositifState {
  enrollments: DispositifInfo[]
  activeDispositifId: string | null  // null = show all / base mode
  isLoading: boolean

  // Project init state
  projectInitStatus: Record<string, boolean>  // enrollmentId → isInitialized
  initDialogOpen: boolean
  initDialogEnrollmentId: string | null

  // Actions
  setEnrollments: (enrollments: DispositifInfo[]) => void
  setActiveEnrollment: (id: string | null) => void
  updateProgress: (dispositifId: string, progress: number) => void
  reset: () => void

  // Project init actions
  fetchProjectInitStatus: (enrollmentId: string) => Promise<boolean | null>
  fetchProjectInitStatusForAll: () => Promise<void>
  initProject: (
    enrollmentId: string,
    mode: 'new' | 'import' | 'legacy',
    sourceEnrollmentId?: string | null,
    projectTitle?: string,
  ) => Promise<{ success: boolean; message?: string }>
  setInitDialogOpen: (open: boolean, enrollmentId?: string | null) => void
}

// ─── Default State ───────────────────────────

const INITIAL_STATE = {
  enrollments: [] as DispositifInfo[],
  activeDispositifId: null as string | null,
  isLoading: false,
  projectInitStatus: {} as Record<string, boolean>,
  initDialogOpen: false,
  initDialogEnrollmentId: null as string | null,
}

// ─── Store ───────────────────────────────────

export const useDispositifStore = create<DispositifState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ─── Setters ───

      setEnrollments: (enrollments) =>
        set({
          enrollments,
          isLoading: false,
          // Auto-select the BASE type or first enrollment if no active selection
          activeDispositifId: get().activeDispositifId
            ?? enrollments.find((e) => e.type === 'BASE')?.id
            ?? enrollments[0]?.id
            ?? null,
        }),

      setActiveEnrollment: (id) => {
        set({ activeDispositifId: id })
        // Fetch project init status when switching
        if (id) {
          get().fetchProjectInitStatus(id)
        }
      },

      updateProgress: (dispositifId, progress) =>
        set((state) => ({
          enrollments: state.enrollments.map((e) =>
            e.id === dispositifId ? { ...e, progress } : e,
          ),
        })),

      reset: () => set(INITIAL_STATE),

      // ─── Project Init Actions ───

      setInitDialogOpen: (open, enrollmentId) =>
        set({
          initDialogOpen: open,
          initDialogEnrollmentId: enrollmentId ?? get().initDialogEnrollmentId,
        }),

      fetchProjectInitStatus: async (enrollmentId: string) => {
        try {
          const res = await fetch(`/api/enrollments/${enrollmentId}/init-project`, {
            credentials: 'include',
          })
          if (!res.ok) return null
          const json = await res.json()
          if (json.success && json.data != null) {
            const isInitialized = json.data.isInitialized
            set((state) => ({
              projectInitStatus: { ...state.projectInitStatus, [enrollmentId]: isInitialized },
            }))
            return isInitialized
          }
          return null
        } catch {
          return null
        }
      },

      fetchProjectInitStatusForAll: async () => {
        const { enrollments } = get()
        await Promise.all(
          enrollments.map((e) => get().fetchProjectInitStatus(e.id)),
        )
      },

      initProject: async (enrollmentId, mode, sourceEnrollmentId, projectTitle) => {
        try {
          const body: Record<string, string> = { mode }
          if (sourceEnrollmentId) body.sourceEnrollmentId = sourceEnrollmentId
          if (projectTitle) body.projectTitle = projectTitle

          const res = await fetch(`/api/enrollments/${enrollmentId}/init-project`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            return { success: false, message: err.message ?? 'Erreur lors de l\'initialisation' }
          }

          const json = await res.json()
          if (json.success) {
            // Mark as initialized
            set((state) => ({
              projectInitStatus: { ...state.projectInitStatus, [enrollmentId]: true },
              initDialogOpen: false,
              initDialogEnrollmentId: null,
            }))
            return { success: true, message: json.message }
          }

          return { success: false, message: json.message ?? 'Erreur inconnue' }
        } catch {
          return { success: false, message: 'Erreur réseau lors de l\'initialisation' }
        }
      },
    }),
    {
      name: 'creapulse-dispositif',
      partialize: (state) => ({
        activeDispositifId: state.activeDispositifId,
        enrollments: state.enrollments.map((e) => ({
          id: e.id,
          code: e.code,
          name: e.name,
          description: e.description,
          type: e.type,
          color: e.color,
          icon: e.icon,
          progress: e.progress,
          status: e.status,
          projectTitle: e.projectTitle,
          hasProjectData: e.hasProjectData,
        })),
        projectInitStatus: state.projectInitStatus,
      }),
    },
  ),
)

// ─── Computed helpers (used outside of React) ───

/**
 * Returns the active enrollment that is NOT initialized, or null if all are initialized.
 * To use inside React: const needsInit = useDispositifStore(s => s.activeDispositifId ? !s.projectInitStatus[s.activeDispositifId] : null)
 */
export function getNeedsInitDialog(state: DispositifState): string | null {
  const { activeDispositifId, projectInitStatus } = state
  if (!activeDispositifId) return null
  // If status not yet fetched (undefined), we don't know — return null
  if (projectInitStatus[activeDispositifId] === undefined) return null
  // If explicitly false (not initialized), return the enrollment id
  if (!projectInitStatus[activeDispositifId]) return activeDispositifId
  return null
}