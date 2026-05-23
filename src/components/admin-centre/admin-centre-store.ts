import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AdminCentreTab = 'dashboard' | 'conseillers' | 'beneficiaires' | 'planning' | 'statistiques' | 'parametres'

export interface AdminCentreState {
  /* ─── Visibility ─── */
  isAdminCentreOpen: boolean
  openAdminCentre: () => void
  closeAdminCentre: () => void

  /* ─── Navigation ─── */
  currentTab: AdminCentreTab
  setTab: (tab: AdminCentreTab) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  /* ─── Detail view ─── */
  selectedUserId: string | null
  selectUser: (id: string | null) => void
}

export const useAdminCentreStore = create<AdminCentreState>()(
  persist(
    (set) => ({
      /* Visibility */
      isAdminCentreOpen: false,
      openAdminCentre: () => set({ isAdminCentreOpen: true }),
      closeAdminCentre: () => set({ isAdminCentreOpen: false, sidebarOpen: true }),

      /* Navigation */
      currentTab: 'dashboard',
      setTab: (tab) => set({ currentTab: tab, selectedUserId: null }),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      /* Detail */
      selectedUserId: null,
      selectUser: (id) => set({ selectedUserId: id }),
    }),
    {
      name: 'creapulse-admin-centre',
      partialize: (state) => ({
        currentTab: state.currentTab,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
