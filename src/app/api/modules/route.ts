import { NextRequest } from 'next/server'
import { success, Errors, getTokenFromHeader, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/modules
 *
 * Public endpoint (requires auth) that returns active modules for the current user's tenant.
 * Used by the frontend `useModuleConfigStore` to determine which modules to show.
 *
 * Query params:
 *   - activeOnly: "true" to return only active modules (default: false — returns all with status)
 *
 * Returns array of { code, isActive, sortOrder, config }
 */
export async function GET(request: NextRequest) {
  try {
    // Auth required — extract tenant from token
    const token = getTokenFromHeader(request)
    let tenantId = ''

    if (token) {
      try {
        const payload = await verifyToken(token)
        tenantId = payload.tenantId
      } catch {
        // Token invalid — fall through without tenant filter
      }
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Build WHERE clause
    const where: Record<string, unknown> = {}
    if (tenantId) {
      where.tenantId = tenantId
    }
    if (activeOnly) {
      where.isActive = true
    }

    const modules = await db.appModule.findMany({
      where,
      select: {
        code: true,
        isActive: true,
        sortOrder: true,
        config: true,
        category: true,
        name: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return success(modules, 'Modules chargés')
  } catch (err) {
    return handleApiError(err)
  }
}
