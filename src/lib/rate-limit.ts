// ============================================
// CreaPulse V2 — Simple In-Memory Rate Limiter
// Per-user or per-IP rate limiting for API routes
// ============================================

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()
let lastCleanup = Date.now()
const CLEANUP_INTERVAL_MS = 5 * 60_000

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key)
    }
    lastCleanup = now
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given key (userId or IP).
 * @param key - Identifier (userId for authenticated, IP for anonymous)
 * @param maxRequests - Max requests per window
 * @param windowMs - Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000,
): RateLimitResult {
  cleanup()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

// Pre-configured limiters
export const aiRateLimit = {
  /** 20 AI requests per minute per user */
  check(userId: string): RateLimitResult {
    return checkRateLimit(`ai:${userId}`, 20, 60_000)
  },
}

export const creascopeAiRateLimit = {
  /** 15 Creascope AI suggestions per minute per user */
  check(userId: string): RateLimitResult {
    return checkRateLimit(`creascope-ai:${userId}`, 15, 60_000)
  },
}