// ============================================
// CreaPulse V2 — Detailed Health Check
// GET /api/monitoring/health-detailed
// Returns comprehensive system metrics
// ============================================

import { NextRequest } from 'next/server'
import { accessSync, constants } from 'fs'
import { db } from '@/lib/db'
import { success, handleApiError } from '@/lib/api-response'
import { createLogger } from '@/lib/logger'

const logger = createLogger('HealthDetailed')
const startTime = Date.now()
const UPLOAD_DIR = '/home/z/my-project/upload'

export async function GET(_request: NextRequest) {
  try {
    // ─── Database Check ──────────────────
    let dbStatus: 'connected' | 'error' = 'connected'
    let dbLatencyMs: number | null = null
    let dbError: string | null = null

    const dbStart = Date.now()
    try {
      await db.$queryRaw`SELECT 1 as ok`
      dbLatencyMs = Date.now() - dbStart
    } catch (err) {
      dbStatus = 'error'
      dbError = err instanceof Error ? err.message : String(err)
      dbLatencyMs = Date.now() - dbStart
    }

    // ─── File System Check ───────────────
    let fsWritable: boolean = false
    let fsError: string | null = null

    try {
      accessSync(UPLOAD_DIR, constants.W_OK)
      fsWritable = true
    } catch (err) {
      fsError = err instanceof Error ? err.message : String(err)
    }

    // ─── Memory Usage ────────────────────
    const memoryUsage = process.memoryUsage()
    const memoryFormatted = {
      rss: formatBytes(memoryUsage.rss),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      heapUsed: formatBytes(memoryUsage.heapUsed),
      external: formatBytes(memoryUsage.external),
      arrayBuffers: formatBytes(memoryUsage.arrayBuffers),
    }

    // ─── Uptime ──────────────────────────
    const uptimeMs = Date.now() - startTime
    const processUptime = process.uptime()

    // ─── Environment ─────────────────────
    const environment = process.env.NODE_ENV || 'development'

    // ─── Overall Status ──────────────────
    const isHealthy = dbStatus === 'connected' && fsWritable
    const overallStatus = isHealthy ? 'healthy' : 'degraded'

    logger.info('Detailed health check executed', {
      overallStatus,
      dbStatus,
      fsWritable,
      memoryRss: memoryUsage.rss,
    })

    return success(
      {
        status: overallStatus,
        version: '2.0.0',
        environment,
        timestamp: new Date().toISOString(),

        // Uptime
        uptime: {
          application: formatUptime(uptimeMs),
          process: formatUptime(processUptime * 1000),
          uptimeMs,
          processUptimeSec: Math.round(processUptime),
        },

        // Database
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          error: dbError,
        },

        // File system
        filesystem: {
          uploadDir: UPLOAD_DIR,
          writable: fsWritable,
          error: fsError,
        },

        // Memory
        memory: {
          ...memoryFormatted,
          raw: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
            arrayBuffers: memoryUsage.arrayBuffers,
          },
        },

        // Runtime info
        runtime: {
          platform: process.platform,
          nodeVersion: process.version,
          arch: process.arch,
          pid: process.pid,
        },
      },
      `CreaPulse V2 — ${overallStatus === 'healthy' ? 'Système en bonne santé' : 'Système dégradé'}`,
    )
  } catch (err) {
    logger.error('Erreur critique lors du health check détaillé', { error: String(err) })
    return handleApiError(err)
  }
}

// ─── Helpers ────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 o'
  const units = ['o', 'Ko', 'Mo', 'Go']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}j ${hours % 24}h ${minutes % 60}m`
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}
