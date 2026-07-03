'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminCentreStore, type AdminCentreTab } from './admin-centre-store'
import { cn } from '@/lib/utils'
import { AdminDashboard } from './dashboard'
import { ConseillersManagement } from './conseillers'
import { BeneficiairesManagement } from './beneficiaires'
import { PlanningView } from './planning'
import { StatistiquesView } from './statistiques'
import { ParametresView } from './parametres'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  Bell,
  LogOut,
  UserCircle,
  Zap,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ─── Navigation items ─── */
const navItems: { id: AdminCentreTab; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'conseillers', label: 'Conseillers', icon: UserCheck },
  { id: 'beneficiaires', label: 'Beneficiaires', icon: Users },
  { id: 'planning', label: 'Planning', icon: CalendarDays },
  { id: 'statistiques', label: 'Statistiques', icon: BarChart3 },
  { id: 'parametres', label: 'Parametres', icon: Settings },
]

/* ─── Sidebar ─── */
function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { currentTab, setTab, sidebarOpen, toggleSidebar } = useAdminCentreStore()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-[#1A1A2E] text-white transition-all duration-300 h-full',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo area */}
      <div className={cn('flex items-center gap-2 px-4 h-16 border-b border-white/10', collapsed ? 'justify-center' : '')}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35] shrink-0">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold tracking-tight">CreaPulse</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Admin Centre</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" aria-label="Navigation administration centre">
        {navItems.map((item) => {
          const isActive = currentTab === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/20'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full rounded-lg py-2 text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}

/* ─── Mobile Sidebar (Sheet drawer) ─── */
function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { currentTab, setTab } = useAdminCentreStore()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-[#1A1A2E] text-white border-white/10">
        <SheetHeader className="px-4 h-16 flex flex-row items-center gap-2 border-b border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35] shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <SheetTitle className="text-sm font-bold text-white">CreaPulse Admin</SheetTitle>
          </div>
        </SheetHeader>
        <nav className="px-2 py-4 space-y-1" aria-label="Navigation administration centre">
          {navItems.map((item) => {
            const isActive = currentTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id)
                  onOpenChange(false)
                }}
                className={cn(
                  'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-[#FF6B35] text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

/* ─── TopBar ─── */
function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { currentTab, closeAdminCentre } = useAdminCentreStore()

  const tabLabels: Record<AdminCentreTab, string> = {
    dashboard: 'Tableau de bord',
    conseillers: 'Conseillers',
    beneficiaires: 'Beneficiaires',
    planning: 'Planning',
    statistiques: 'Statistiques',
    parametres: 'Parametres',
  }

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b bg-background shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>

        <div>
          <h1 className="text-lg font-bold text-foreground">
            Administration Centre GIDEF
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Creteil — {tabLabels[currentTab]}
          </p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="w-56 pl-8 h-9 text-sm bg-muted/50"
              aria-label="Rechercher"
            />
          </div>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#FF6B35]" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B35]/10 text-[#FF6B35]">
                <UserCircle className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline text-sm font-medium">Admin GIDEF</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <UserCircle className="h-4 w-4" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={closeAdminCentre}
            >
              <LogOut className="h-4 w-4" />
              Fermer l&apos;admin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

/* ─── Tab content router ─── */
function AdminContent() {
  const { currentTab } = useAdminCentreStore()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentTab}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {currentTab === 'dashboard' && <AdminDashboard />}
        {currentTab === 'conseillers' && <ConseillersManagement />}
        {currentTab === 'beneficiaires' && <BeneficiairesManagement />}
        {currentTab === 'planning' && <PlanningView />}
        {currentTab === 'statistiques' && <StatistiquesView />}
        {currentTab === 'parametres' && <ParametresView />}
      </motion.div>
    </AnimatePresence>
  )
}



/* ─── Main Admin Centre Layout ─── */
export function AdminCentreLayout() {
  const { isAdminCentreOpen, sidebarOpen, setSidebarOpen, closeAdminCentre } = useAdminCentreStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isAdminCentreOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isAdminCentreOpen])

  return (
    <AnimatePresence>
      {isAdminCentreOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeAdminCentre}
          />

          {/* Admin container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex h-screen w-screen flex-col overflow-hidden rounded-none md:my-3 md:mr-3 md:rounded-2xl border border-border bg-background shadow-2xl"
          >
            <TopBar onMenuClick={() => setMobileMenuOpen(true)} />

            <div className="flex flex-1 overflow-hidden">
              <Sidebar collapsed={!sidebarOpen} />
              <main id="admin-centre-main-content" role="main" tabIndex={-1} className="flex-1 overflow-y-auto scrollbar-thin bg-muted/30" aria-label="Contenu administration centre">
                <AdminContent />
              </main>
            </div>
          </motion.div>

          <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
