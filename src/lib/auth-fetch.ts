// ============================================
// CreaPulse V2 — Authenticated Fetch Wrapper
// Centralizes fetch with:
//   1. Always sends credentials (session cookie)
//   2. Attaches Authorization header from Zustand store
//   3. Intercepts 401 responses and clears stale auth state
// ============================================

import { useAuthStore } from '@/lib/zustand/store'

/**
 * Authenticated fetch wrapper.
 *
 * - Always includes `credentials: 'include'` so the httpOnly session cookie is sent.
 * - Automatically attaches `Authorization: Bearer <token>` from the Zustand auth store.
 * - If the server returns 401, the Zustand store is cleared to prevent future
 *   requests from sending a stale token.
 *
 * Usage (same API as native fetch):
 *   const res = await authFetch('/api/swipe', { method: 'POST', body: ... })
 *   const data = await res.json()
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = useAuthStore.getState().token

  const headers = new Headers(init?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  // Set Content-Type if body is present and not already set
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  })

  // Intercept 401 — clear stale auth state
  if (res.status === 401) {
    useAuthStore.getState().logout()
  }

  return res
}
