// ============================================
// CreaPulse V2 — Health Check Endpoint
// GET /api/health
// Checks database connectivity and returns system status
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error, handleApiError, ErrorCode } from '@/lib/api-response'

const startTime = Date.now()

export async function GET(_request: NextRequest) {
  try {
    // Check database connectivity
    let dbStatus: 'connected' | 'error' = 'connected'
    let dbLatencyMs: number | null = null

    const dbStart = Date.now()
    try {
      await db.$queryRaw`SELECT 1 as ok`
      dbLatencyMs = Date.now() - dbStart
    } catch {
      dbStatus = 'error'
      dbLatencyMs = null
    }

    const uptime = Date.now() - startTime
    const uptimeFormatted = formatUptime(uptime)

    return success(
      {
        status: dbStatus === 'connected' ? 'healthy' : 'degraded',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: uptimeFormatted,
        uptimeMs: uptime,
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        timestamp: new Date().toISOString(),
      },
      'CreaPulse V2 is running',
    )
  } catch (err) {
    return handleApiError(err)
  }
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}
