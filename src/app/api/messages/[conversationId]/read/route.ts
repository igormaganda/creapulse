// ============================================
// CreaPulse V2 — Messages API (Mark as Read)
// PUT: Mark all messages in conversation as read
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const token = getTokenFromHeader(request) || request.cookies.get('session')?.value
    if (!token) return Errors.unauthorized('Authentification requise')

    const payload = await verifyToken(token)
    const userId = payload.userId
    const { conversationId } = await params

    // Verify conversation exists and user is participant
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) return Errors.notFound('Conversation')
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return Errors.forbidden('Vous n\'etes pas participant de cette conversation')
    }

    // Mark all unread messages (not from this user) as read
    const result = await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return success({
      markedCount: result.count,
    }, `${result.count} message(s) marque(s) comme lu(s)`)
  } catch (err) {
    return handleApiError(err)
  }
}
