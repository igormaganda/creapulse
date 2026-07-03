'use server'

import { db } from '@/lib/db'
import { createLogger } from './logger'

const log = createLogger('DB-Ensure')

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
    log.info('PostgreSQL database ready')
  } catch (error) {
    log.error('Database initialization error', { error: String(error) })
    initialized = false // Allow retry
  }
}
