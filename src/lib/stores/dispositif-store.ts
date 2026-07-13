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
}

export interface DispositifState {
  enrollments: DispositifInfo[]
  activeDispositifId: string | null  // null = show all / base mode
  isLoading: boolean

  // Actions
  setEnrollments: (enrollments: DispositifInfo[]) => void
  setActiveDispositif: (id: string | null) => void
  updateProgress: (dispositifId: string, progress: number) => void
  reset: () => void
}

// ─── Default State ───────────────────────────

const INITIAL_STATE = {
  enrollments: [] as DispositifInfo[],
  activeDispositifId: null as string | null,
  isLoading: false,
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

      setActiveDispositif: (id) =>
        set({ activeDispositifId: id }),

      updateProgress: (dispositifId, progress) =>
        set((state) => ({
          enrollments: state.enrollments.map((e) =>
            e.id === dispositifId ? { ...e, progress } : e,
          ),
        })),

      reset: () => set(INITIAL_STATE),
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
        })),
      }),
    },
  ),
)