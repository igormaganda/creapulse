// ============================================
// CreaPulse V2 — In-Memory JWT Blocklist
// Stores revoked JTIs (JWT IDs) for token revocation.
// Auto-cleanup runs every hour to prune expired entries.
// ============================================

import { createLogger } from './logger'

const log = createLogger('TokenBlocklist')

// jti → expiry timestamp (ms since epoch)
const blocklist = new Map<string, number>()

// Cleanup interval reference
let cleanupTimer: ReturnType<typeof setInterval> | null = null

/**
 * Revoke a token by its JTI.
 * Stores the expiry so cleanup can remove it once it's naturally expired.
 */
export function revokeToken(jti: string, exp: number): void {
  // exp is in seconds from JWT; convert to ms for comparison
  const expiryMs = exp * 1000
  blocklist.set(jti, expiryMs)
}

/**
 * Check if a JTI has been revoked.
 * Also removes entries that have naturally expired (lazy cleanup).
 */
export function isRevoked(jti: string): boolean {
  if (!blocklist.has(jti)) return false

  const expiryMs = blocklist.get(jti)!
  const now = Date.now()

  // If the token has naturally expired, remove from blocklist
  if (now > expiryMs) {
    blocklist.delete(jti)
    return false
  }

  return true
}

/**
 * Remove all expired entries from the blocklist.
 * Runs automatically every hour, but can also be called manually.
 */
export function cleanup(): number {
  const now = Date.now()
  let removed = 0

  for (const [jti, expiryMs] of blocklist.entries()) {
    if (now > expiryMs) {
      blocklist.delete(jti)
      removed++
    }
  }

  return removed
}

/**
 * Start automatic cleanup (runs every hour).
 * Safe to call multiple times — only one timer is active.
 */
export function startAutoCleanup(): void {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    const removed = cleanup()
    if (removed > 0) {
      log.debug('Cleanup: removed expired entries', { count: removed })
    }
  }, 60 * 60 * 1000) // Every hour
}

// Start auto-cleanup on module load
startAutoCleanup()

/**
 * Get the current size of the blocklist (useful for monitoring).
 */
export function getBlocklistSize(): number {
  return blocklist.size
}
