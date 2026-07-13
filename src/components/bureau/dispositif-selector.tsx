'use client'

// ============================================
// CreaPulse V2 — Dispositif Selector
// Dropdown to switch between enrolled dispositifs
// Shown in the topbar when user has multiple enrollments
// ============================================

import { useEffect, useRef } from 'react'
import {
  Briefcase, Search, Rocket, ChevronDown, Layers,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useDispositifStore, type DispositifInfo } from '@/lib/stores/dispositif-store'
import { useAuthStore } from '@/lib/zustand/store'
import { toast } from 'sonner'

// ─── Icon rendering (no component variables — React Compiler safe) ──

function renderIcon(name: string, color: string, className: string) {
  switch (name) {
    case 'Search': return <Search className={className} style={{ color }} />
    case 'Rocket': return <Rocket className={className} style={{ color }} />
    default:      return <Briefcase className={className} style={{ color }} />
  }
}

// ─── Component ────────────────────────────

export function DispositifSelector() {
  const {
    enrollments,
    activeDispositifId,
    setActiveEnrollment,
    setEnrollments,
    isLoading,
    projectInitStatus,
    setInitDialogOpen,
  } = useDispositifStore()
  const token = useAuthStore((s) => s.token)

  const active = enrollments.find((e) => e.id === activeDispositifId)

  // Track which enrollments have had their init status fetched
  // to avoid showing the dialog for enrollments that haven't been checked yet
  const statusFetchedRef = useRef<Set<string>>(new Set())

  // Fetch enrollments on mount
  useEffect(() => {
    if (!token || enrollments.length > 0) return

    async function fetchEnrollments() {
      try {
        const res = await fetch('/api/enrollments', {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) return
        const json = await res.json()
        if (json.success && json.data?.enrollments) {
          setEnrollments(json.data.enrollments)
          // Pre-populate init status from hasProjectData if available
          for (const e of json.data.enrollments) {
            if (e.hasProjectData !== undefined) {
              useDispositifStore.setState((s) => ({
                projectInitStatus: {
                  ...s.projectInitStatus,
                  [e.id]: e.hasProjectData as boolean,
                },
              }))
              statusFetchedRef.current.add(e.id)
            }
          }
        }
      } catch {
        // Silently fail — the selector will just not show
      }
    }

    fetchEnrollments()
  }, [token, enrollments.length, setEnrollments])

  // Handle selecting an enrollment
  const handleSelect = (enrollmentId: string) => {
    setActiveEnrollment(enrollmentId)

    // Check if this enrollment needs init (after a short delay for the fetch)
    const enrollment = enrollments.find((e) => e.id === enrollmentId)

    // If we already have hasProjectData from the enrollments list
    if (enrollment?.hasProjectData === false) {
      setInitDialogOpen(true, enrollmentId)
      return
    }

    // If we already fetched init status
    if (statusFetchedRef.current.has(enrollmentId)) {
      if (!projectInitStatus[enrollmentId]) {
        setInitDialogOpen(true, enrollmentId)
      }
      return
    }

    // Otherwise, the setActiveEnrollment will fetch and we need to react
    // The dialog will be opened from the effect or on next render
  }

  // Watch for init status changes to open dialog for newly-fetched statuses
  useEffect(() => {
    if (!activeDispositifId) return
    const status = projectInitStatus[activeDispositifId]
    if (status === undefined) return
    statusFetchedRef.current.add(activeDispositifId)
    if (!status) {
      setInitDialogOpen(true, activeDispositifId)
    }
  }, [activeDispositifId, projectInitStatus])

  // Don't render if only one enrollment or none
  if (enrollments.length <= 1 && !isLoading) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
            'hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary/30',
            'border border-transparent hover:border-border',
          )}
          aria-label="Changer de dispositif"
        >
          {active ? (
            <>
              <DispositifBadge dispositif={active} size="sm" />
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </>
          ) : (
            <>
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tous les parcours</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Mes dispositifs
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* "All modules" option */}
        <DropdownMenuItem
          className={cn(
            'flex items-center gap-3 cursor-pointer',
            !activeDispositifId && 'bg-accent',
          )}
          onClick={() => {
            setActiveEnrollment(null)
            toast.info('Vue complète — tous les modules affichés')
          }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Layers className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Tous les parcours</p>
            <p className="text-xs text-muted-foreground">Vue complète du bureau</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Enrollment options */}
        {enrollments.map((enrollment) => (
          <DropdownMenuItem
            key={enrollment.id}
            className={cn(
              'flex items-center gap-3 cursor-pointer',
              activeDispositifId === enrollment.id && 'bg-accent',
            )}
            onClick={() => handleSelect(enrollment.id)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: enrollment.color + '18' }}>
              {renderIcon(enrollment.icon, enrollment.color, 'h-4 w-4')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{enrollment.name}</p>
                {enrollment.type === 'BASE' && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">Par défaut</Badge>
                )}
                {!enrollment.hasProjectData && projectInitStatus[enrollment.id] === false && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-amber-600 border-amber-300">
                    Non initié
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {enrollment.description || enrollment.code}
              </p>
            </div>
            {/* Progress indicator */}
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs font-medium" style={{ color: enrollment.color }}>
                {enrollment.progress}%
              </span>
              <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${enrollment.progress}%`, backgroundColor: enrollment.color }}
                />
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Compact Badge (for topbar) ────────────

interface DispositifBadgeProps {
  dispositif: DispositifInfo
  size?: 'sm' | 'md'
}

export function DispositifBadge({ dispositif, size = 'md' }: DispositifBadgeProps) {
  const isSmall = size === 'sm'

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'flex items-center justify-center rounded-md',
          isSmall ? 'h-5 w-5' : 'h-7 w-7',
        )}
        style={{ backgroundColor: dispositif.color + '20' }}
      >
        {renderIcon(dispositif.icon, dispositif.color, isSmall ? 'h-3 w-3' : 'h-4 w-4')}
      </div>
      <span
        className={cn(
          'font-semibold truncate max-w-[140px]',
          isSmall ? 'text-xs' : 'text-sm',
        )}
        style={{ color: dispositif.color }}
      >
        {dispositif.name}
      </span>
    </div>
  )
}