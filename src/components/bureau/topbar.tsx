'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useBureauStore } from './bureau-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Search,
  Bell,
  Sparkles,
  Menu,
  User,
  Settings,
  LogOut,
  Home,
  ChevronRight,
} from 'lucide-react'

/* ─── Section & module label maps ─── */
const sectionLabels: Record<string, string> = {
  dashboard: 'Accueil',
  parcours: 'Parcours',
  strategie: 'Stratégie',
  ecosysteme: 'Écosystème',
  pilotage: 'Pilotage',
}

const moduleLabels: Record<string, string> = {
  'profil-createur': 'Profil créateur',
  'mon-projet': 'Mon projet',
  'vision': 'Vision',
  'riasec': 'RIASEC',
  'kiviat': 'Kiviat',
  'marche': 'Marché',
  'juridique': 'Juridique',
  'financier': 'Financier',
  'creasim': 'CreaSim',
  'business-plan': 'Business Plan',
  'pitch-deck': 'Pitch Deck',
  'annuaire': 'Annuaire',
  'forum': 'Forum',
  'mentorat': 'Mentorat',
  'tremplin': 'Tremplin',
  'passeport': 'Passeport',
  'certifications': 'Certifications',
}

/* ─── TopBar Component ─── */
interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { currentSection, currentModule, userName, userInitials, closeBureau } = useBureauStore()
  const [searchFocused, setSearchFocused] = useState(false)

  /* Build breadcrumb from current state */
  const breadcrumbs = useMemo(() => {
    if (currentSection === 'dashboard') {
      return [{ label: 'Accueil', active: true }]
    }
    const crumbs = [
      { label: 'Accueil', section: 'dashboard' as const },
      { label: sectionLabels[currentSection] || currentSection, section: currentSection },
    ]
    if (currentModule) {
      crumbs.push({
        label: moduleLabels[currentModule] || currentModule,
        active: true,
      })
    } else {
      crumbs[crumbs.length - 1] = { ...crumbs[crumbs.length - 1], active: true }
    }
    return crumbs
  }, [currentSection, currentModule])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-white/80 backdrop-blur-md dark:bg-[#1A1D28]/80 dark:border-neutral-800 px-4 md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8"
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <Breadcrumb className="flex-1 min-w-0">
        <BreadcrumbList className="flex-nowrap">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1
            return (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <BreadcrumbSeparator className="h-3.5 w-3.5" />}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="text-sm font-medium truncate max-w-[200px]">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="text-sm text-muted-foreground truncate max-w-[150px] cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => {
                        if (crumb.section) {
                          useBureauStore.getState().setSection(crumb.section as any)
                        }
                      }}
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Search (desktop) */}
      <div className={cn(
        'hidden md:flex items-center relative transition-all duration-300',
        searchFocused ? 'w-72' : 'w-52'
      )}>
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher..."
          className="h-8 pl-8 pr-3 text-sm bg-muted/50 border-transparent focus:bg-background focus:border-border"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* IA Assistant FAB */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-primary hover:bg-primary/10"
          aria-label="Assistant IA"
        >
          <Sparkles className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        </Button>

        {/* Notification bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center bg-coral-500 border-0 text-white">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <Badge variant="secondary" className="text-[10px]">3 nouvelles</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
              <p className="text-sm font-medium">Rappel de rendez-vous</p>
              <p className="text-xs text-muted-foreground">RDV Conseil demain à 14h — GIDEF Paris</p>
              <p className="text-[10px] text-muted-foreground mt-1">Il y a 2h</p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
              <p className="text-sm font-medium">Module RIASEC terminé</p>
              <p className="text-xs text-muted-foreground">Votre profil entrepreneurial est disponible</p>
              <p className="text-[10px] text-muted-foreground mt-1">Il y a 1 jour</p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
              <p className="text-sm font-medium">Nouveau mentor disponible</p>
              <p className="text-xs text-muted-foreground">Un mentor en marketing digital est disponible</p>
              <p className="text-[10px] text-muted-foreground mt-1">Il y a 3 jours</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 gap-2 pl-2 pr-3">
              <Avatar className="h-7 w-7 border-2 border-primary/30">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline text-sm font-medium max-w-[120px] truncate">
                {userName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{userName}</span>
                <span className="text-xs text-muted-foreground">Créateur</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Settings className="h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={closeBureau}
            >
              <LogOut className="h-4 w-4" />
              Retour au site
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
