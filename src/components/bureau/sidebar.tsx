'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBureauStore, type BureauSection } from './bureau-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  LayoutDashboard,
  User,
  Lightbulb,
  Eye,
  FlaskConical,
  Pentagon,
  Target,
  Scale,
  Calculator,
  TrendingUp,
  FileText,
  Presentation,
  Globe,
  MessageSquare,
  MessageCircle,
  GraduationCap,
  Rocket,
  Stamp,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ─── Types ─── */
interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

interface NavGroup {
  id: BureauSection
  label: string
  icon: LucideIcon
  items: NavItem[]
  progress?: number
}

/* ─── Navigation data ─── */
const navigationGroups: NavGroup[] = [
  {
    id: 'parcours',
    label: 'Parcours',
    icon: User,
    progress: 35,
    items: [
      { id: 'profil-createur', label: 'Profil créateur', icon: User },
      { id: 'mon-projet', label: 'Mon projet', icon: Lightbulb, badge: 'Nouveau' },
      { id: 'vision', label: 'Vision', icon: Eye },
      { id: 'riasec', label: 'RIASEC', icon: FlaskConical },
      { id: 'kiviat', label: 'Kiviat', icon: Pentagon },
      { id: 'bilan-ia', label: 'Bilan IA', icon: Sparkles, badge: 'IA' },
    ],
  },
  {
    id: 'strategie',
    label: 'Stratégie',
    icon: Target,
    progress: 20,
    items: [
      { id: 'marche', label: 'Marché', icon: Globe },
      { id: 'juridique', label: 'Juridique', icon: Scale },
      { id: 'financier', label: 'Financier', icon: Calculator },
      { id: 'creasim', label: 'CreaSim', icon: TrendingUp, badge: 'IA' },
      { id: 'business-plan', label: 'Business Plan', icon: FileText },
      { id: 'pitch-deck', label: 'Pitch Deck', icon: Presentation },
    ],
  },
  {
    id: 'ecosysteme',
    label: 'Écosystème',
    icon: Globe,
    progress: 10,
    items: [
      { id: 'annuaire', label: 'Annuaire', icon: Globe },
      { id: 'forum', label: 'Forum', icon: MessageSquare },
      { id: 'messages', label: 'Messages', icon: MessageCircle, badge: 'Nouveau' },
      { id: 'mentorat', label: 'Mentorat', icon: GraduationCap, badge: 'Bientôt' },
    ],
  },
  {
    id: 'pilotage',
    label: 'Pilotage',
    icon: Rocket,
    progress: 5,
    items: [
      { id: 'tremplin', label: 'Tremplin', icon: Rocket },
      { id: 'passeport', label: 'Passeport', icon: Stamp, badge: 'Nouveau' },
      { id: 'certifications', label: 'Certifications', icon: BadgeCheck },
    ],
  },
]

/* ─── Circular progress helper ─── */
function MiniProgress({ value, size = 24, className }: { value: number; size?: number; className?: string }) {
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} className={className}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-neutral-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="text-teal-400 transition-all duration-700"
      />
    </svg>
  )
}

/* ─── NavItemButton ─── */
function NavItemButton({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: NavItem
  isActive: boolean
  collapsed: boolean
  onClick: () => void
}) {
  const button = (
    <Button
      variant="ghost"
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'w-full justify-start gap-3 h-9 px-3 text-sm font-normal',
        isActive
          ? 'bg-primary/15 text-teal-300 font-medium'
          : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200',
        collapsed && 'justify-center px-0'
      )}
      onClick={onClick}
    >
      <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-teal-400')} />
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{item.label}</span>
          {item.badge && (
            <Badge
              variant={item.badgeVariant || 'secondary'}
              className={cn(
                'text-[10px] px-1.5 py-0 h-5 font-medium',
                item.badge === 'Nouveau' && 'bg-coral-500/20 text-coral-400 border-coral-500/30',
                item.badge === 'IA' && 'bg-teal-500/20 text-teal-300 border-teal-500/30',
                item.badge === 'Bientôt' && 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              )}
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Button>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}

/* ─── Sidebar content (shared between desktop and mobile) ─── */
function SidebarContent({ collapsed, onNavigate, onCloseMobile }: {
  collapsed: boolean
  onNavigate?: () => void
  onCloseMobile?: () => void
}) {
  const { currentSection, currentModule, setSection, setModule, sidebarOpen } = useBureauStore()

  const handleNavClick = (groupId: BureauSection, itemId: string) => {
    setSection(groupId)
    setModule(itemId)
    onNavigate?.()
    onCloseMobile?.()
  }

  const handleGroupClick = (groupId: BureauSection) => {
    setSection(groupId)
    setModule(null)
    onNavigate?.()
    onCloseMobile?.()
  }

  return (
    <nav className="flex h-full flex-col bg-[#1A1A2E] text-white" aria-label="Navigation Bureau Virtuel">
      {/* Logo area */}
      <div className={cn(
        'flex h-16 items-center border-b border-white/10',
        collapsed ? 'justify-center px-3' : 'justify-between px-4'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 mt-2 mb-1">
              <img src="/images/logo-creapulse.svg" alt="CreaPulse" className="h-8 w-8 shrink-0" />
              <img src="/images/logo-gidef.svg" alt="GIDEF" className="h-5 w-auto shrink-0" />
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-1">
            <img src="/images/logo-creapulse.svg" alt="CreaPulse" className="h-7 w-7 shrink-0" />
            <img src="/images/logo-gidef.svg" alt="GIDEF" className="h-4 w-auto shrink-0" />
          </div>
        )}
      </div>

      {/* Dashboard button */}
      <div className={cn('px-2 pt-3 pb-1', collapsed && 'px-1')}>
        <NavItemButton
          item={{ id: 'dashboard', label: 'Accueil', icon: LayoutDashboard }}
          isActive={currentSection === 'dashboard'}
          collapsed={collapsed}
          onClick={() => handleGroupClick('dashboard')}
        />
      </div>

      <Separator className="bg-white/10 mx-3 my-2" />

      {/* Nav groups */}
      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-1 pb-4">
          {navigationGroups.map((group) => {
            const isGroupActive = currentSection === group.id && !currentModule

            return (
              <div key={group.id} className="mt-1">
                {/* Group header */}
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-2 h-8 px-3 text-xs font-semibold uppercase tracking-wider',
                        isGroupActive
                          ? 'text-teal-400'
                          : 'text-neutral-500 hover:text-neutral-300',
                        collapsed && 'justify-center px-0'
                      )}
                      onClick={() => handleGroupClick(group.id)}
                    >
                      <group.icon className="h-3.5 w-3.5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{group.label}</span>
                          {group.progress !== undefined && (
                            <MiniProgress value={group.progress} size={18} />
                          )}
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      {group.label} ({group.progress}%)
                    </TooltipContent>
                  )}
                </Tooltip>

                {/* Group items */}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-2 flex flex-col gap-0.5 border-l border-white/10 pl-2">
                        {group.items.map((item) => (
                          <NavItemButton
                            key={item.id}
                            item={item}
                            isActive={currentSection === group.id && currentModule === item.id}
                            collapsed={false}
                            onClick={() => handleNavClick(group.id, item.id)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-3" aria-label="Progression globale">
        <div className={cn(
          'flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2',
          collapsed && 'justify-center px-2'
        )}>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-400">Progression globale</p>
              <p className="text-sm font-semibold text-white">18%</p>
            </div>
          )}
          <MiniProgress value={18} size={collapsed ? 28 : 32} className="text-teal-400" />
        </div>
      </div>
    </nav>
  )
}

/* ─── Desktop Sidebar ─── */
export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen, currentSection, currentModule } = useBureauStore()
  const collapsed = !sidebarOpen

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 260 : 64 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative hidden md:flex h-screen shrink-0 overflow-hidden border-r border-white/10"
    >
      <SidebarContent collapsed={collapsed} />

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white shadow-sm transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700"
        aria-label={sidebarOpen ? 'Réduire la barre latérale' : 'Ouvrir la barre latérale'}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-3 w-3 text-neutral-600 dark:text-neutral-300" />
        ) : (
          <ChevronRight className="h-3 w-3 text-neutral-600 dark:text-neutral-300" />
        )}
      </button>
    </motion.aside>
  )
}

/* ─── Mobile Sidebar (Sheet) ─── */
export function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Bureau Virtuel</SheetTitle>
        </SheetHeader>
        <SidebarContent
          collapsed={false}
          onCloseMobile={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
