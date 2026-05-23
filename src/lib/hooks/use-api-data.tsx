// ──────────────────────────────────────────────
// CreaPulse V2 — Shared API Data Fetching Hook
// ──────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseApiDataOptions<T> {
  /** The URL to fetch from */
  url: string | null
  /** Fallback data when API fails or returns empty */
  fallback: T
  /** Whether the data has a `data` wrapper (API returns { success, data }) */
  unwrapData?: boolean
  /** Custom transform for the response */
  transform?: (data: T) => T
  /** Whether to fetch on mount (default: true) */
  enabled?: boolean
}

interface UseApiDataResult<T> {
  data: T
  loading: boolean
  error: string | null
  isFallback: boolean
  setData: React.Dispatch<React.SetStateAction<T>>
  refetch: () => void
}

/**
 * Generic hook to fetch data from API endpoints with graceful fallback.
 * Shows loading state, handles errors, and falls back to mock data.
 */
export function useApiData<T>(options: UseApiDataOptions<T>): UseApiDataResult<T> {
  const {
    url,
    fallback,
    unwrapData = true,
    transform,
    enabled = true,
  } = options

  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(!!url && enabled)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(true)
  const [fetchKey, setFetchKey] = useState(0)

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (!url || !enabled) {
      setLoading(false)
      setIsFallback(true)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('creapulse-token')
            : null

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(url, { headers })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const json = await res.json()

        if (unwrapData) {
          if (json.success && json.data !== undefined && json.data !== null) {
            const result = transform ? transform(json.data as T) : (json.data as T)
            if (!cancelled) {
              setData(result)
              setIsFallback(false)
            }
          } else if (json.error?.message) {
            throw new Error(json.error.message)
          }
          // If data is null/undefined but success=true, keep fallback
        } else {
          if (!cancelled) {
            const result = transform ? transform(json) : json
            setData(result as T)
            setIsFallback(false)
          }
        }
      } catch (err) {
        console.warn(`[API] ${url} unavailable, using fallback`, err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur')
          setIsFallback(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [url, unwrapData, transform, enabled, fetchKey])

  return { data, loading, error, isFallback, setData, refetch }
}

/* ─── Fallback Badge Component ──────────────── */

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 text-[10px] font-medium">
      <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM8 4a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 008 4zm0 6a.75.75 0 100 1.5.75.75 0 000-1.5z" />
      </svg>
      Données de démonstration
    </span>
  )
}

/* ─── Skeleton Helpers ─────────────────────── */

export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={className ?? 'animate-pulse rounded-md bg-muted'} />
  )
}
