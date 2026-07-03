'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminPlateformeStore, type AdminPlateformeTab } from './admin-plateforme-store'
import { Dashboard } from './dashboard'
import { Organisations } from './organisations'
import { Utilisateurs } from './utilisateurs'
import { Modules } from './modules'
import { Contenus } from './contenus'
import { Facturation } from './facturation'
import { Analytics } from './analytics'
import { Configuration } from './configuration'
import { PaaPack } from './paa-pack'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  Building2,
  Users,
  Puzzle,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  X,
  Menu,
  Shield,
  Zap,
  UserCircle,
  LogOut,
  GraduationCap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ─── Sidebar navigation config ─── */
const navItems: { id: AdminPlateformeTab; label: string; icon: LucideIcon; badge?: string }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'organisations', label: 'Organisations', icon: Building2, badge: '8' },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: Users, badge: '247' },
  { id: 'modules', label: 'Modules', icon: Puzzle },
  { id: 'paa-pack', label: 'Pack PAA', icon: GraduationCap },
  { id: 'contenus', label: 'Contenus', icon: FileText },
  { id: 'facturation', label: 'Facturation', icon: CreditCard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'configuration', label: 'Configuration', icon: Settings },
]

/* ─── Sidebar ─── */
function Sidebar() {
  const { currentTab, setTab, sidebarOpen, toggleSidebar, closeAdminPlateforme } = useAdminPlateformeStore()

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-full bg-[#0F172A] text-white transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-64' : 'w-[68px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFB74D] shrink-0">
          <Shield className="h-4 w-4 text-[#0F172A]" />
        </div>
        {sidebarOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-bold whitespace-nowrap"
          >
            Super Admin
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col gap-1 px-2" aria-label="Navigation administration plateforme">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-[#FFB74D]/20 text-[#FFB74D]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                )}
                title={item.label}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-[#FFB74D]')} />
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 text-left whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
                {sidebarOpen && item.badge && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFB74D]/20 px-1.5 text-xs text-[#FFB74D]"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Bottom actions */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={closeAdminPlateforme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
          title="Fermer"
        >
          <X className="h-4 w-4 shrink-0" />
          {sidebarOpen && <span>Fermer</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 z-20 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-muted transition-colors cursor-pointer"
      >
        {sidebarOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
    </aside>
  )
}

/* ─── Mobile sidebar ─── */
function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { currentTab, setTab, closeAdminPlateforme } = useAdminPlateformeStore()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 bg-[#0F172A] text-white border-white/10 p-0">
        <SheetHeader className="flex h-14 flex-row items-center gap-2 px-4 border-b border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFB74D]">
            <Shield className="h-4 w-4 text-[#0F172A]" />
          </div>
          <SheetTitle className="text-sm font-bold text-white">Super Admin</SheetTitle>
          <SheetDescription className="sr-only">Navigation administration plateforme</SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 py-3">
          <nav className="flex flex-col gap-1 px-2" aria-label="Navigation administration plateforme">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id)
                    onOpenChange(false)
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer',
                    isActive
                      ? 'bg-[#FFB74D]/20 text-[#FFB74D]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive && 'text-[#FFB74D]')} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFB74D]/20 px-1.5 text-xs text-[#FFB74D]">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

/* ─── TopBar ─── */
function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { currentTab, closeAdminPlateforme } = useAdminPlateformeStore()
  const tabLabel = navItems.find((n) => n.id === currentTab)?.label || ''

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-4 shrink-0">
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-sm font-semibold text-foreground">Administration Plateforme</h1>
          <p className="text-xs text-muted-foreground">Echo Entreprendre</p>
        </div>
      </div>

      {/* Center: search */}
      <div className="hidden md:flex flex-1 max-w-md mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher organisations, utilisateurs..."
            className="pl-9 h-9 bg-muted/50"
            aria-label="Rechercher organisations, utilisateurs"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 ml-auto">
        <Badge variant="secondary" className="hidden sm:flex gap-1 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {tabLabel}
        </Badge>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B35] text-[10px] text-white font-bold">
            3
          </span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFB74D] text-xs font-bold text-[#0F172A]">
                SA
              </div>
              <span className="hidden sm:inline text-sm font-medium">Super Admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <UserCircle className="h-4 w-4" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive"
              onClick={closeAdminPlateforme}
            >
              <LogOut className="h-4 w-4" />
              Quitter l&apos;admin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

/* ─── Content router ─── */
function AdminContent() {
  const { currentTab } = useAdminPlateformeStore()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="p-4 md:p-6"
      >
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'organisations' && <Organisations />}
        {currentTab === 'utilisateurs' && <Utilisateurs />}
        {currentTab === 'modules' && <Modules />}
        {currentTab === 'paa-pack' && <PaaPack />}
        {currentTab === 'contenus' && <Contenus />}
        {currentTab === 'facturation' && <Facturation />}
        {currentTab === 'analytics' && <Analytics />}
        {currentTab === 'configuration' && <Configuration />}
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Main Layout ─── */
export function AdminPlateformeLayout() {
  const { isAdminPlateformeOpen, closeAdminPlateforme } = useAdminPlateformeStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isAdminPlateformeOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isAdminPlateformeOpen])

  return (
    <AnimatePresence>
      {isAdminPlateformeOpen && (
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
            onClick={closeAdminPlateforme}
          />

          {/* Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex h-screen w-screen flex-col overflow-hidden bg-background shadow-2xl"
          >
            <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main id="admin-plateforme-main-content" role="main" tabIndex={-1} className="flex-1 overflow-y-auto bg-muted/30" aria-label="Contenu administration plateforme">
                <AdminContent />
              </main>
            </div>
          </motion.div>

          {/* Mobile sidebar */}
          <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
