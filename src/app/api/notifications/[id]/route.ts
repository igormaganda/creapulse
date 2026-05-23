// ============================================
// CreaPulse V2 — Notification Detail API
// PUT    /api/notifications/[id]  — Marquer comme lu/non lu
// DELETE /api/notifications/[id]  — Supprimer une notification
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

// ─── Validation Schema ────────────────────────

const updateNotificationSchema = z.object({
  isRead: z.boolean(),
})

// ─── Context type ─────────────────────────────

type RouteContext = {
  params: Promise<{ id: string }>
}

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

// ─── PUT: Mark as read/unread ─────────────────

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized('Aucune session trouvée')
    }

    const { id } = await context.params

    const body = await request.json()
    const parsed = updateNotificationSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      )
    }

    // Vérifier que la notification existe et appartient à l'utilisateur
    const notification = await db.notification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!notification) {
      return Errors.notFound('Notification')
    }

    if (notification.userId !== payload.userId) {
      return Errors.forbidden('Vous n\'êtes pas autorisé à modifier cette notification')
    }

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: parsed.data.isRead },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        link: true,
        isRead: true,
        createdAt: true,
      },
    })

    return success(updated, parsed.data.isRead ? 'Notification marquée comme lue' : 'Notification marquée comme non lue')
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

// ─── DELETE: Delete notification ──────────────

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized('Aucune session trouvée')
    }

    const { id } = await context.params

    // Vérifier que la notification existe et appartient à l'utilisateur
    const notification = await db.notification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!notification) {
      return Errors.notFound('Notification')
    }

    if (notification.userId !== payload.userId) {
      return Errors.forbidden('Vous n\'êtes pas autorisé à supprimer cette notification')
    }

    await db.notification.delete({
      where: { id },
    })

    return success({ deleted: true }, 'Notification supprimée')
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
