// ============================================
// CreaPulse V2 — Session Restore Hook
// Validates stored auth token on page load.
// If token is expired/invalid, clears the Zustand store
// so components don't send stale tokens → 401 errors.
// ============================================

'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/zustand/store'

/**
 * Call this hook once at the app root (e.g. inside BureauLayout or page.tsx).
 * On mount, it checks whether the persisted Zustand token is still valid by
 * calling /api/auth/me. If the call fails with 401, the store is cleared.
 */
export function useSessionRestore() {
  const { token, setLoading, logout, isAuthenticated } = useAuthStore()
  const restoredRef = useRef(false)

  useEffect(() => {
    // Skip if no persisted token or already restored
    if (!token || restoredRef.current) {
      setLoading(false)
      return
    }

    restoredRef.current = true
    let cancelled = false

    async function restore() {
      try {
        const res = await fetch('/api/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        })

        if (cancelled) return

        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const userData = json.data
            // Update the store with fresh user data from server
            useAuthStore.getState().setUser({
              id: userData.id,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              avatarUrl: userData.avatarUrl || null,
            })
          }
        } else {
          // 401 or other error — token is stale, clear the store
          logout()
        }
      } catch {
        // Network error — don't clear the store (might be offline)
        if (!cancelled) {
          setLoading(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    restore()

    return () => {
      cancelled = true
    }
  }, [token, logout, setLoading])

  // Return nothing — this is a side-effect-only hook
}
