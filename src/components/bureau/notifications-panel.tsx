'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBureauStore } from './bureau-store'
import { useNotificationStore, useAuthStore, type NotificationItem } from '@/lib/zustand/store'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { NotificationsBadge } from './notifications-badge'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Trophy,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { authFetch } from '@/lib/auth-fetch'

// ─── Types ──────────────────────────────────

type NotificationType = NotificationItem['type']

interface NotificationWithMeta extends NotificationItem {
  _deleting?: boolean
}

type TabValue = 'all' | 'unread'

// ─── Config ─────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, {
  icon: typeof Info
  bg: string
  text: string
  border: string
  dot: string
}> = {
  INFO: {
    icon: Info,
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-500',
  },
  SUCCESS: {
    icon: CheckCircle,
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  WARNING: {
    icon: AlertTriangle,
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  ACTION_REQUIRED: {
    icon: AlertCircle,
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  MILESTONE: {
    icon: Trophy,
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
}

// ─── Time Ago Helper ────────────────────────

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)

  if (diffSec < 60) return 'À l\'instant'
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffHour < 24) return `Il y a ${diffHour}h`
  if (diffDay === 1) return 'Hier'
  if (diffDay < 7) return `Il y a ${diffDay} jours`
  if (diffWeek === 1) return 'La semaine dernière'
  return `Il y a ${diffWeek} semaines`
}

// ─── Single Notification Item ───────────────

function NotificationItemRow({
  notification,
  onMarkRead,
  onDelete,
  onClick,
}: {
  notification: NotificationWithMeta
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  onClick: (n: NotificationWithMeta) => void
}) {
  const config = TYPE_CONFIG[notification.type]
  const Icon = config.icon
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClick = () => {
    onClick(notification)
    if (!notification.isRead) {
      onMarkRead(notification.id)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(true)
    try {
      const res = await authFetch(`/api/notifications/${notification.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(notification.id)
        toast.success('Notification supprimée')
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDeleting ? 0 : 1, y: isDeleting ? -10 : 0, scale: isDeleting ? 0.95 : 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative flex items-start gap-3 rounded-lg p-3 cursor-pointer transition-colors',
        'hover:bg-muted/50',
        !notification.isRead && 'bg-primary/5',
        notification.link && 'hover:bg-primary/10',
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick() }}
      aria-label={`${notification.isRead ? 'Lue : ' : 'Non lue : '}${notification.title}`}
    >
      {/* Type icon */}
      <div className={cn(
        'flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full mt-0.5',
        config.bg,
      )}>
        <Icon className={cn('h-4 w-4', config.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {!notification.isRead && (
            <span className={cn('flex-shrink-0 w-2 h-2 rounded-full', config.dot)} />
          )}
          <p className={cn(
            'text-sm truncate',
            !notification.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80',
          )}>
            {notification.title}
          </p>
          {notification.link && (
            <ExternalLink className="flex-shrink-0 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.content}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {getTimeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Delete button (on hover) */}
      <button
        className={cn(
          'flex-shrink-0 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all',
          'hover:bg-destructive/10 hover:text-destructive text-muted-foreground',
        )}
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label="Supprimer la notification"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

// ─── Empty State ────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <BellOff className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">Aucune notification</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Vos notifications apparaîtront ici
      </p>
    </motion.div>
  )
}

// ─── Panel Content (shared between dropdown & sheet) ─────────

function NotificationPanelContent({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [tab, setTab] = useState<TabValue>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const { setSection, setModule } = useBureauStore()
  const {
    notifications,
    unreadCount,
    setNotifications,
    markAsRead,
    removeNotification,
  } = useNotificationStore()

  // ── Fetch notifications (immediate, for panel open) ──
  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '30' })
      const res = await authFetch(`/api/notifications?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setNotifications(json.data.notifications || [])
        }
      }
    } catch {
      // Silently fail — use cached data from poller
    } finally {
      setIsLoading(false)
    }
  }, [setNotifications])

  // ── Initial fetch when panel opens ──
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(true)
    }
  }, [isOpen, fetchNotifications])

  // ── Mark as read (API + store) ──
  const handleMarkRead = useCallback(async (id: string) => {
    markAsRead(id)
    try {
      await authFetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })
    } catch {
      // Store already updated
    }
  }, [markAsRead])

  // ── Mark all as read ──
  const handleMarkAllRead = useCallback(async () => {
    useNotificationStore.getState().markAllAsRead()
    try {
      await authFetch('/api/notifications/read-all', { method: 'PUT' })
      toast.success('Toutes les notifications marquées comme lues')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }, [])

  // ── Delete ──
  const handleDelete = useCallback(async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id))
    try {
      const res = await authFetch(`/api/notifications/${id}`, { method: 'DELETE' })
      if (res.ok) {
        removeNotification(id)
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [removeNotification])

  // ── Click notification ──
  const handleNotificationClick = useCallback((n: NotificationWithMeta) => {
    if (n.link) {
      // Parse internal links like "section:parcours" or "module:riasec"
      const parts = n.link.split(':')
      if (parts.length === 2) {
        const validSections = ['dashboard', 'parcours', 'strategie', 'ecosysteme', 'pilotage'] as const
        if (parts[0] === 'section' && parts[1] && (validSections as readonly string[]).includes(parts[1])) {
          setSection(parts[1] as typeof validSections[number])
        }
        if (parts[0] === 'module') setModule(parts[1])
      }
    }
    onClose()
  }, [setSection, setModule, onClose])

  // ── Filtered notifications ──
  const filteredNotifications = useMemo(() => {
    if (tab === 'unread') {
      return notifications.filter((n) => !n.isRead)
    }
    return notifications
  }, [notifications, tab])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-coral-500 border-0 text-white">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-primary hover:text-primary/80 hover:bg-primary/10 gap-1"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-1">
        <button
          className={cn(
            'flex-1 text-center py-2 text-xs font-medium rounded-md transition-colors',
            tab === 'all'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          )}
          onClick={() => setTab('all')}
        >
          Toutes
        </button>
        <button
          className={cn(
            'flex-1 text-center py-2 text-xs font-medium rounded-md transition-colors',
            tab === 'unread'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          )}
          onClick={() => setTab('unread')}
        >
          Non lues{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </button>
      </div>

      <Separator className="mt-1" />

      {/* Notification list */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-xs">Chargement...</span>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-full max-h-[400px]">
            <div className="px-2 py-1 space-y-0.5">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.map((n) => (
                  <NotificationItemRow
                    key={n.id}
                    notification={{ ...n, _deleting: deletingIds.has(n.id) }}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                    onClick={handleNotificationClick}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer */}
      <Separator />
      <div className="px-4 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSection('pilotage')
            onClose()
          }}
        >
          Voir tout
        </Button>
      </div>
    </div>
  )
}

// ─── Main NotificationsPanel Component ──────

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const user = useAuthStore((s) => s.user)
  const { unreadCount } = useNotificationStore()

  // Start the smart notification poller — updates Zustand store continuously
  useNotifications(user?.id ?? null)

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const unreadCountValue = unreadCount

  // ── Desktop: Dropdown panel ──
  if (!isMobile) {
    return (
      <div className="relative">
        {/* Bell trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Notifications"
          aria-expanded={isOpen}
        >
          <Bell className="h-4 w-4" />
          <NotificationsBadge count={unreadCountValue} />
        </Button>

        {/* Dropdown panel */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop to close on click outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  'absolute right-0 top-full mt-2 z-50 w-[380px]',
                  'rounded-xl border border-border shadow-lg',
                  'glass-card',
                  'overflow-hidden',
                )}
                style={{ maxHeight: '520px' }}
              >
                <NotificationPanelContent
                  isOpen={isOpen}
                  onClose={() => setIsOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── Mobile: Sheet drawer ──
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <NotificationsBadge count={unreadCountValue} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <div className="h-full flex flex-col">
          <NotificationPanelContent
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
