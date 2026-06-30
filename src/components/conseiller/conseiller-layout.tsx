'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConseillerStore } from './conseiller-store'
import { ConseillerDashboard } from './dashboard'
import { BeneficiairesList } from './beneficiaires-list'
import { BeneficiaireDetail } from './beneficiaire-detail'
import { EntretiensView } from './entretiens'
import { LivrablesView } from './livrables'
import { PlanningView } from './planning'
import { RapportsView } from './rapports'
import { Beneficiaire360Sheet } from './beneficiaire-360'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  FileText,
  Calendar,
  BarChart3,
  Search,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Zap,
  X,
  ArrowLeft,
  Eye,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ConseillerTab } from './conseiller-store'

/* ─── Navigation items ─── */
const navItems: { id: ConseillerTab; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'beneficiaires', label: 'Beneficiaires', icon: Users },
  { id: 'vue360', label: 'Vue 360\u00b0', icon: Eye },
  { id: 'entretiens', label: 'Entretiens', icon: MessageSquare },
  { id: 'livrables', label: 'Livrables', icon: FileText },
  { id: 'planning', label: 'Planning', icon: Calendar },
  { id: 'rapports', label: 'Rapports', icon: BarChart3 },
]

/* ─── Sidebar ─── */
function ConseillerSidebar() {
  const { currentTab, setTab, sidebarOpen, toggleSidebar, closeConseiller } = useConseillerStore()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full transition-all duration-300 bg-[#1A1A2E] text-white',
        sidebarOpen ? 'w-60' : 'w-[68px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-white/10">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="flex flex-col overflow-hidden"
          >
            <span className="text-sm font-bold truncate">CreaPulse</span>
            <span className="text-[10px] text-white/50 truncate">Espace Conseiller</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <TooltipProvider key={item.id} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTab(item.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                        : 'text-white/60 hover:bg-white/8 hover:text-white'
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </button>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 space-y-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 hover:bg-white/8 hover:text-white transition-colors"
              >
                {sidebarOpen ? (
                  <ChevronLeft className="h-4.5 w-4.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-4.5 w-4.5 shrink-0" />
                )}
                {sidebarOpen && <span>Reduire</span>}
              </button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">Ouvrir le menu</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={closeConseiller}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 hover:bg-red-500/20 hover:text-red-300 transition-colors"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" />
                {sidebarOpen && <span>Se deconnecter</span>}
              </button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">Se deconnecter</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  )
}

/* ─── Mobile sidebar (Sheet drawer) ─── */
function MobileConseillerSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { currentTab, setTab, closeConseiller } = useConseillerStore()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 bg-[#1A1A2E] text-white border-white/10 p-0">
        <SheetHeader className="px-4 pt-4 pb-0">
          <SheetTitle className="flex items-center gap-2 text-white">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            CreaPulse Conseiller
          </SheetTitle>
          <SheetDescription className="text-white/50">Espace conseiller</SheetDescription>
        </SheetHeader>
        <nav className="px-2 py-4 space-y-1">
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
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3">
          <button
            onClick={() => {
              closeConseiller()
              onOpenChange(false)
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" />
            Se deconnecter
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ─── Top Bar ─── */
function ConseillerTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { currentTab, setTab, selectedBeneficiaryId, selectBeneficiary, conseillerName, conseillerInitials, closeConseiller } = useConseillerStore()

  const tabLabel = navItems.find((n) => n.id === currentTab)?.label || ''

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b border-border bg-background">
      {/* Left: mobile menu + breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>

        {/* Breadcrumb with back button when viewing beneficiary detail */}
        {selectedBeneficiaryId ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => selectBeneficiary(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{tabLabel}</span>
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Fiche beneficiaire</span>
          </div>
        ) : (
          <h1 className="text-sm font-semibold text-foreground md:text-base">
            {tabLabel}
          </h1>
        )}
      </div>

      {/* Center: search (desktop) */}
      <div className="hidden md:block w-72">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Right: notifications + avatar */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-coral-500" />
          </span>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User avatar */}
        <div className="hidden sm:flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {conseillerInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground hidden lg:inline">
            {conseillerName}
          </span>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={closeConseiller}
        >
          <X className="h-4.5 w-4.5" />
          <span className="sr-only">Fermer</span>
        </Button>
      </div>
    </header>
  )
}

/* ─── Placeholder for tabs not yet built ─── */
function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[60vh] p-8"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <FileText className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-center text-muted-foreground">{description}</p>
      <div className="mt-8 flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
        Module en cours de developpement
      </div>
    </motion.div>
  )
}

/* ─── Vue 360° Tab (full-page) ─── */
function Vue360Tab() {
  const [sheetOpen, setSheetOpen] = useState(true)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[60vh] p-8"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Eye className="h-10 w-10 text-primary" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-foreground">Vue 360\u00b0 Bénéficiaire</h2>
      <p className="mt-2 max-w-md text-center text-muted-foreground">
        Sélectionnez un bénéficiaire pour consulter son parcours complet, ses scores, ses livrables et les insights IA.
      </p>
      <Button
        className="mt-6"
        size="lg"
        onClick={() => setSheetOpen(true)}
      >
        <Eye className="h-4 w-4 mr-2" />
        Ouvrir la vue 360\u00b0
      </Button>
      <Beneficiaire360Sheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </motion.div>
  )
}

/* ─── Main content router ─── */
function ConseillerContent() {
  const { currentTab, selectedBeneficiaryId } = useConseillerStore()
  const contentKey = `${currentTab}-${selectedBeneficiaryId || ''}`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={contentKey}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.2 }}
        className="p-4 md:p-6 lg:p-8"
      >
        {currentTab === 'dashboard' && <ConseillerDashboard />}

        {currentTab === 'beneficiaires' && (
          selectedBeneficiaryId
            ? <BeneficiaireDetail beneficiaryId={selectedBeneficiaryId} />
            : <BeneficiairesList />
        )}

        {currentTab === 'vue360' && <Vue360Tab />}

        {currentTab === 'entretiens' && <EntretiensView />}

        {currentTab === 'livrables' && <LivrablesView />}

        {currentTab === 'planning' && <PlanningView />}

        {currentTab === 'rapports' && <RapportsView />}
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Conseiller Layout (overlay) ─── */
export function ConseillerLayout() {
  const { isConseillerOpen, closeConseiller } = useConseillerStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  /* Lock body scroll when conseiller is open */
  useEffect(() => {
    if (isConseillerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isConseillerOpen])

  return (
    <AnimatePresence>
      {isConseillerOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex"
        >
          {/* Background backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeConseiller}
          />

          {/* Conseiller container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex h-screen w-screen flex-col overflow-hidden rounded-none md:my-3 md:mr-3 md:rounded-2xl border border-border bg-background shadow-2xl"
          >
            {/* Top Bar */}
            <ConseillerTopBar onMenuClick={() => setMobileMenuOpen(true)} />

            {/* Body: Sidebar + Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Desktop Sidebar */}
              <ConseillerSidebar />

              {/* Main content */}
              <main className="flex-1 overflow-y-auto scrollbar-thin bg-muted/30">
                <ConseillerContent />
              </main>
            </div>
          </motion.div>

          {/* Mobile Sidebar */}
          <MobileConseillerSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
