// ============================================
// CreaPulse V2 — useNotifications Hook
// Manages notification polling lifecycle + Zustand store sync
// ============================================

'use client'

import { useEffect, useCallback, useRef } from 'react'
import { notificationPoller } from '@/lib/notification-poller'
import { useNotificationStore, type NotificationItem } from '@/lib/zustand/store'

export interface UseNotificationsResult {
  /** All notifications from the store */
  notifications: NotificationItem[]
  /** Count of unread notifications */
  unreadCount: number
  /** Manually trigger a fast poll */
  refresh: () => void
}

/**
 * Hook that starts the smart notification poller and syncs results
 * with the Zustand notification store. Returns reactive state.
 *
 * The poller runs continuously with exponential backoff and pauses
 * when the tab is hidden. It resets to fast polling on visibility
 * change or when new notifications arrive.
 */
export function useNotifications(userId: string | null): UseNotificationsResult {
  const mountedRef = useRef(true)
  const { setNotifications, notifications, unreadCount } = useNotificationStore()

  const refresh = useCallback(() => {
    notificationPoller.triggerFastPoll()
  }, [])

  useEffect(() => {
    mountedRef.current = true

    if (!userId) return

    notificationPoller.start(userId, (incoming) => {
      if (!mountedRef.current) return

      // Sync incoming notifications into the Zustand store
      const mapped: NotificationItem[] = incoming.map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        type: n.type,
        link: n.link ?? undefined,
        isRead: n.isRead,
        createdAt: n.createdAt,
      }))

      setNotifications(mapped)
    })

    return () => {
      mountedRef.current = false
      notificationPoller.stop()
    }
  }, [userId, setNotifications])

  return { notifications, unreadCount, refresh }
}
