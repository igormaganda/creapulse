import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AdminPlateformeTab =
  | 'dashboard'
  | 'organisations'
  | 'utilisateurs'
  | 'modules'
  | 'contenus'
  | 'facturation'
  | 'analytics'
  | 'configuration'

export interface AdminPlateformeState {
  /* ─── Overlay visibility ─── */
  isAdminPlateformeOpen: boolean
  openAdminPlateforme: () => void
  closeAdminPlateforme: () => void

  /* ─── Navigation ─── */
  currentTab: AdminPlateformeTab
  setTab: (tab: AdminPlateformeTab) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  /* ─── Selections ─── */
  selectedTenantId: string | null
  selectTenant: (id: string | null) => void
  selectedOrgId: string | null
  selectOrg: (id: string | null) => void
}

export const useAdminPlateformeStore = create<AdminPlateformeState>()(
  persist(
    (set) => ({
      /* Overlay visibility */
      isAdminPlateformeOpen: false,
      openAdminPlateforme: () => set({ isAdminPlateformeOpen: true, sidebarOpen: true }),
      closeAdminPlateforme: () => set({ isAdminPlateformeOpen: false, sidebarOpen: false }),

      /* Navigation */
      currentTab: 'dashboard',
      setTab: (tab) => set({ currentTab: tab }),
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      /* Selections */
      selectedTenantId: null,
      selectTenant: (id) => set({ selectedTenantId: id }),
      selectedOrgId: null,
      selectOrg: (id) => set({ selectedOrgId: id }),
    }),
    {
      name: 'creapulse-admin-plateforme',
      partialize: (state) => ({
        currentTab: state.currentTab,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
