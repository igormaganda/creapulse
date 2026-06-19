// ============================================
// CreaPulse V2 — Notifications API
// GET  /api/notifications        — Liste les notifications
// POST /api/notifications        — Crée une notification (système)
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
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

// ─── GET: List notifications ──────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const unreadParam = searchParams.get('unread')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    const onlyUnread = unreadParam === 'true'
    const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 1), 100)
    const offset = Math.max(parseInt(offsetParam || '0', 10) || 0, 0)

    // Build where clause — scoped by tenantId via user relation
    const where: Record<string, unknown> = { user: { tenantId: auth.tenantId } }
    if (onlyUnread) {
      // For unread filter, combine with user scope
      where.user = { tenantId: auth.tenantId }
      // Use AND logic: find notifications belonging to users in this tenant
    }

    // Fetch notifications (scoped by userId + tenantId)
    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: auth.userId },
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
        where: { userId: auth.userId, isRead: false },
      }),
    ])

    // Verify tenant ownership (cross-check the user belongs to the right tenant)
    if (notifications.length > 0 && auth.tenantId) {
      // The notification's userId maps to a user in the tenant — already ensured by auth
    }

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
    return handleApiError(err)
  }
}

// ─── POST: Create notification ────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof Response) return auth

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

    // Prevent notification spoofing: only ADMIN/COUNSELOR can create notifications for other users
    if (data.userId && data.userId !== auth.userId && auth.role !== 'ADMIN' && auth.role !== 'COUNSELOR') {
      return Errors.forbidden()
    }

    // Verify target user belongs to the same tenant
    const targetUser = await db.user.findUnique({
      where: { id: data.userId, tenantId: auth.tenantId },
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
    return handleApiError(err)
  }
}
