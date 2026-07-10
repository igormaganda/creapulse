// ============================================
// CreaPulse V2 — Detailed Health Check
// GET /api/monitoring/health-detailed
// Returns comprehensive system metrics
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, handleApiError } from '@/lib/api-response'
import { withAdminAuth } from '@/lib/api-auth'
import { createLogger } from '@/lib/logger'

const logger = createLogger('HealthDetailed')
const startTime = Date.now()
const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME

export async function GET(request: NextRequest) {
  try {
    // Auth required (admin only)
    const auth = await withAdminAuth(request)
    if (!auth) return auth

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

    // ─── File System Check (skipped in serverless) ─
    let fsWritable: boolean | null = null
    let fsError: string | null = null

    if (!IS_SERVERLESS) {
      try {
        // Dynamic import to avoid bundling fs in serverless environments
        const { accessSync, constants } = await import('fs')
        const uploadDir = process.env.UPLOAD_DIR || '/home/z/my-project/upload'
        accessSync(uploadDir, constants.W_OK)
        fsWritable = true
      } catch (err) {
        fsWritable = false
        fsError = err instanceof Error ? err.message : String(err)
      }
    } else {
      // In serverless, filesystem is not persistent — report as N/A
      fsWritable = null
      fsError = 'Filesystem check skipped (serverless environment)'
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
    const isHealthy = dbStatus === 'connected' && (fsWritable === true || fsWritable === null)
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
          writable: fsWritable,
          error: fsError,
        },

        // Memory
        memory: {
          ...memoryFormatted,
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
