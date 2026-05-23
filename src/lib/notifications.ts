// ============================================
// CreaPulse V2 — Notification Helper
// Crée des notifications depuis n'importe où dans l'app
// ============================================

import { db } from '@/lib/db'
import type { NotificationType } from '@prisma/client'

type CreateNotificationData = {
  userId: string
  title: string
  content: string
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED' | 'MILESTONE'
  link?: string
}

/**
 * Crée une notification pour un utilisateur.
 * Peut être appelé depuis n'importe quel API route ou module.
 */
export async function createNotification(data: CreateNotificationData): Promise<void> {
  const { userId, title, content, type, link } = data

  await db.notification.create({
    data: {
      userId,
      title,
      content,
      type: (type || 'INFO') as NotificationType,
      link: link || null,
    },
  })
}

/**
 * Crée plusieurs notifications en une seule opération.
 * Idéal pour les notifications en masse (ex: module terminé + jalon atteint).
 */
export async function createNotifications(
  notifications: CreateNotificationData[],
): Promise<void> {
  if (notifications.length === 0) return

  await db.notification.createMany({
    data: notifications.map((n) => ({
      userId: n.userId,
      title: n.title,
      content: n.content,
      type: (n.type || 'INFO') as NotificationType,
      link: n.link || null,
    })),
  })
}
