// ============================================
// CreaPulse V2 — Zustand Stores
// Client-side state management for auth & notifications
// ============================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@prisma/client'

// ─── Types ──────────────────────────────────

export type UserProfile = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  avatarUrl: string | null
}

export type NotificationItem = {
  id: string
  title: string
  content: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED' | 'MILESTONE'
  link?: string
  isRead: boolean
  createdAt: string
}

export type AuthState = {
  // State
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: (token: string, user: UserProfile) => void
  logout: () => void
  setUser: (user: UserProfile) => void
  setLoading: (loading: boolean) => void
  getFullName: () => string
  getInitials: () => string
}

export type NotificationState = {
  // State
  notifications: NotificationItem[]
  unreadCount: number

  // Actions
  setNotifications: (notifications: NotificationItem[]) => void
  addNotification: (notification: NotificationItem) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

// ─── Auth Store ─────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      // Set auth state on login
      login: (token: string, user: UserProfile) => {
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      // Clear auth state on logout
      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      // Update user data (e.g., after profile edit)
      setUser: (user: UserProfile) => {
        set({ user })
      },

      // Set loading state (e.g., during token verification)
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Get user's full name
      getFullName: () => {
        const { user } = get()
        if (!user) return ''
        const parts = [user.firstName, user.lastName].filter(Boolean)
        return parts.join(' ')
      },

      // Get user's initials for avatar
      getInitials: () => {
        const { user } = get()
        if (!user) return ''
        const f = (user.firstName || '').charAt(0).toUpperCase()
        const l = (user.lastName || '').charAt(0).toUpperCase()
        return (f + l) || user.email.charAt(0).toUpperCase()
      },
    }),
    {
      name: 'creapulse-auth',
      // Only persist token and user data
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

// ─── Notification Store ─────────────────────

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,

      // Replace all notifications (e.g., after fetching from API)
      setNotifications: (notifications: NotificationItem[]) => {
        const unreadCount = notifications.filter((n) => !n.isRead).length
        set({ notifications, unreadCount })
      },

      // Add a single notification
      addNotification: (notification: NotificationItem) => {
        const { notifications } = get()
        const updated = [notification, ...notifications]
        const unreadCount = updated.filter((n) => !n.isRead).length
        set({ notifications: updated, unreadCount })
      },

      // Mark a notification as read
      markAsRead: (id: string) => {
        const { notifications } = get()
        const updated = notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        )
        const unreadCount = updated.filter((n) => !n.isRead).length
        set({ notifications: updated, unreadCount })
      },

      // Mark all as read
      markAllAsRead: () => {
        const { notifications } = get()
        const updated = notifications.map((n) => ({ ...n, isRead: true }))
        set({ notifications: updated, unreadCount: 0 })
      },

      // Remove a notification
      removeNotification: (id: string) => {
        const { notifications } = get()
        const updated = notifications.filter((n) => n.id !== id)
        const unreadCount = updated.filter((n) => !n.isRead).length
        set({ notifications: updated, unreadCount })
      },

      // Clear all notifications
      clearAll: () => {
        set({ notifications: [], unreadCount: 0 })
      },
    }),
    {
      name: 'creapulse-notifications',
      // Only persist notifications locally
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    },
  ),
)
