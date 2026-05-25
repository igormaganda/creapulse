'use server'

import { db } from '@/lib/db'

/**
 * Ensure database connection is working.
 * Call this at app startup (layout.tsx) to verify database connectivity.
 */
let initialized = false

export async function ensureDatabase() {
  if (initialized) return
  initialized = true

  try {
    await db.$queryRaw`SELECT 1`
    console.log('[DB] PostgreSQL database ready')
  } catch (error) {
    console.error('[DB] Database initialization error:', error)
    initialized = false // Allow retry
  }
}
