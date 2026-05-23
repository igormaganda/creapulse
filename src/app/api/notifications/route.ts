// ============================================
// CreaPulse V2 — Notifications API
// GET  /api/notifications        — Liste les notifications
// POST /api/notifications        — Crée une notification (système)
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import type { NotificationType } from '@prisma/client'

// ─── Validation Schema ────────────────────────

const createNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ACTION_REQUIRED', 'MILESTONE']).optional().default('INFO'),
  link: z.string().max(500).optional(),
})

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

// ─── GET: List notifications ──────────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized('Aucune session trouvée')
    }

    const { searchParams } = new URL(request.url)
    const unreadParam = searchParams.get('unread')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    const onlyUnread = unreadParam === 'true'
    const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 1), 100)
    const offset = Math.max(parseInt(offsetParam || '0', 10) || 0, 0)

    // Build where clause
    const where: Record<string, unknown> = { userId: payload.userId }
    if (onlyUnread) {
      where.isRead = false
    }

    // Fetch notifications
    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          link: true,
          isRead: true,
          createdAt: true,
        },
      }),
      db.notification.count({
        where: { userId: payload.userId, isRead: false },
      }),
    ])

    // Schedule mark-as-read after 30 seconds (fire-and-forget)
    if (!onlyUnread && notifications.length > 0) {
      const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id)
      if (unreadIds.length > 0) {
        setTimeout(async () => {
          try {
            await db.notification.updateMany({
              where: { id: { in: unreadIds }, isRead: false },
              data: { isRead: true },
            })
          } catch (err) {
            console.error('[Notification auto-read error]', err)
          }
        }, 30_000)
      }
    }

    return success({
      notifications,
      meta: {
        unreadCount,
        totalFetched: notifications.length,
        limit,
        offset,
      },
    })
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

// ─── POST: Create notification ────────────────

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized('Aucune session trouvée')
    }

    const body = await request.json()
    const parsed = createNotificationSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      )
    }

    const data = parsed.data

    // Vérifier que le userId cible existe (optionnel mais recommandé)
    const targetUser = await db.user.findUnique({
      where: { id: data.userId },
      select: { id: true },
    })

    if (!targetUser) {
      return Errors.notFound('Utilisateur cible')
    }

    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        content: data.content,
        type: data.type as NotificationType,
        link: data.link || null,
      },
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

    return success(notification, 'Notification créée', 201)
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
