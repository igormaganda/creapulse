import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BureauSection = 'dashboard' | 'parcours' | 'strategie' | 'ecosysteme' | 'pilotage'

export interface BureauState {
  /* ─── Navigation ─── */
  currentSection: BureauSection
  currentModule: string | null
  sidebarOpen: boolean
  setSection: (section: BureauSection) => void
  setModule: (module: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  /* ─── Bureau visibility ─── */
  isBureauOpen: boolean
  openBureau: () => void
  closeBureau: () => void

  /* ─── Onboarding ─── */
  hasCompletedOnboarding: boolean
  completeOnboarding: () => void

  /* ─── Simulated user data ─── */
  userName: string
  userInitials: string
  setUserName: (name: string) => void
}

export const useBureauStore = create<BureauState>()(
  persist(
    (set) => ({
      /* Navigation */
      currentSection: 'dashboard',
      currentModule: null,
      sidebarOpen: true,
      setSection: (section) => set({ currentSection: section, currentModule: null }),
      setModule: (module) => set({ currentModule: module }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      /* Bureau visibility */
      isBureauOpen: false,
      openBureau: () => set({ isBureauOpen: true }),
      closeBureau: () => set({ isBureauOpen: false, sidebarOpen: false }),

      /* Onboarding */
      hasCompletedOnboarding: false,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      /* User */
      userName: 'Créateur',
      userInitials: 'CR',
      setUserName: (name) => {
        const parts = name.trim().split(/\s+/)
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase()
        set({ userName: name, userInitials: initials })
      },
    }),
    {
      name: 'creapulse-bureau',
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        userName: state.userName,
        userInitials: state.userInitials,
      }),
    }
  )
)
