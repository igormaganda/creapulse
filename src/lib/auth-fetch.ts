// ============================================
// CreaPulse V2 — Authenticated Fetch Wrapper
// Centralizes fetch with:
//   1. Always sends credentials (session cookie)
//   2. Attaches Authorization header from Zustand store
//   3. Attaches CSRF token on mutating requests
//   4. Intercepts 401 → tries token refresh → retries once
//   5. If refresh fails, clears auth state and redirects
// ============================================

import { useAuthStore } from '@/lib/zustand/store'

// Track refresh state to prevent concurrent refresh calls
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

/**
 * Attempt to refresh the access token via /api/auth/refresh.
 * Returns true if successful, false otherwise.
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })

    return res.ok
  } catch {
    return false
  }
}

/**
 * Get CSRF token from cookie for double-submit pattern.
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Build headers for a request, including auth token and CSRF.
 */
function buildHeaders(input: RequestInfo | URL, init?: RequestInit): Headers {
  const headers = new Headers(init?.headers)
  const token = useAuthStore.getState().token

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Set Content-Type if body is present and not already set
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Attach CSRF token on mutating requests (double-submit cookie pattern)
  const method = (init?.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken)
    }
  }

  return headers
}

/**
 * Authenticated fetch wrapper with auto-refresh and CSRF.
 *
 * - Always includes `credentials: 'include'` so the httpOnly session cookie is sent.
 * - Automatically attaches `Authorization: Bearer <token>` from the Zustand auth store.
 * - On mutating requests, attaches `X-CSRF-Token` from the csrf_token cookie.
 * - If the server returns 401, attempts to refresh the token via /api/auth/refresh.
 *   - If refresh succeeds, retries the original request once.
 *   - If refresh also fails, clears the Zustand store (logout).
 *
 * Usage (same API as native fetch):
 *   const res = await authFetch('/api/swipe', { method: 'POST', body: ... })
 *   const data = await res.json()
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = buildHeaders(input, init)

  const res = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  })

  // Intercept 401 — try refresh before giving up
  if (res.status === 401) {
    // Prevent concurrent refresh calls
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false
        refreshPromise = null
      })
    }

    const refreshed = await refreshPromise

    if (refreshed) {
      // Retry the original request with same options (cookies are already updated)
      return fetch(input, {
        ...init,
        headers: buildHeaders(input, init),
        credentials: 'include',
      })
    }

    // Refresh failed — clear stale auth state
    useAuthStore.getState().logout()
  }

  return res
}
