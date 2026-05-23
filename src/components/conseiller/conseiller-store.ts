import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ConseillerTab =
  | 'dashboard'
  | 'beneficiaires'
  | 'entretiens'
  | 'livrables'
  | 'planning'
  | 'rapports'

export interface ConseillerFilters {
  search: string
  status: string
  journeyPhase: string
}

export interface ConseillerState {
  /* ─── Conseiller visibility ─── */
  isConseillerOpen: boolean
  openConseiller: () => void
  closeConseiller: () => void

  /* ─── Navigation ─── */
  currentTab: ConseillerTab
  sidebarOpen: boolean
  setTab: (tab: ConseillerTab) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  /* ─── Selected beneficiary ─── */
  selectedBeneficiaryId: string | null
  selectBeneficiary: (id: string | null) => void

  /* ─── Filters ─── */
  filters: ConseillerFilters
  setFilters: (filters: Partial<ConseillerFilters>) => void
  resetFilters: () => void

  /* ─── Simulated conseiller data ─── */
  conseillerName: string
  conseillerInitials: string
  setConseillerName: (name: string) => void
}

const defaultFilters: ConseillerFilters = {
  search: '',
  status: '',
  journeyPhase: '',
}

export const useConseillerStore = create<ConseillerState>()(
  persist(
    (set) => ({
      /* Visibility */
      isConseillerOpen: false,
      openConseiller: () => set({ isConseillerOpen: true, sidebarOpen: true }),
      closeConseiller: () => set({ isConseillerOpen: false, sidebarOpen: false, selectedBeneficiaryId: null }),

      /* Navigation */
      currentTab: 'dashboard',
      sidebarOpen: true,
      setTab: (tab) => set({ currentTab: tab, selectedBeneficiaryId: null }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      /* Selected beneficiary */
      selectedBeneficiaryId: null,
      selectBeneficiary: (id) => set({ selectedBeneficiaryId: id, currentTab: id ? 'beneficiaires' : 'beneficiaires' }),

      /* Filters */
      filters: { ...defaultFilters },
      setFilters: (newFilters) =>
        set((s) => ({ filters: { ...s.filters, ...newFilters } })),
      resetFilters: () => set({ filters: { ...defaultFilters } }),

      /* Conseiller */
      conseillerName: 'Sophie Martin',
      conseillerInitials: 'SM',
      setConseillerName: (name) => {
        const parts = name.trim().split(/\s+/)
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase()
        set({ conseillerName: name, conseillerInitials: initials })
      },
    }),
    {
      name: 'creapulse-conseiller',
      partialize: (state) => ({
        conseillerName: state.conseillerName,
        conseillerInitials: state.conseillerInitials,
      }),
    }
  )
)
