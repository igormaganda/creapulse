// ============================================
// CreaPulse V2 — Mark All Notifications as Read
// PUT /api/notifications/read-all
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'

// ─── Auth Helper ──────────────────────────────

async function authenticate(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const headerToken = getTokenFromHeader(request)
  const token = cookieToken || headerToken

  if (!token) {
    return null
  }

  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}

// ─── PUT: Mark all as read ────────────────────

export async function PUT(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized('Aucune session trouvée')
    }

    const result = await db.notification.updateMany({
      where: {
        userId: payload.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return success(
      { updatedCount: result.count },
      result.count > 0
        ? `${result.count} notification(s) marquée(s) comme lue(s)`
        : 'Toutes les notifications sont déjà lues',
    )
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée — veuillez vous reconnecter')
      }
    }
    return handleApiError(err)
  }
}
