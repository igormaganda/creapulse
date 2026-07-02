// ============================================
// CreaPulse V2 — Messages API (Start Conversation)
// POST: Start or find a conversation with another user
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const startConversationSchema = z.object({
  recipientId: z.string().min(1, 'L\'identifiant du destinataire est requis'),
})

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request) || request.cookies.get('session')?.value
    if (!token) return Errors.unauthorized('Authentification requise')

    const payload = await verifyToken(token)
    const userId = payload.userId
    const tenantId = payload.tenantId

    // Validate body
    const body = await request.json()
    const parsed = startConversationSchema.safeParse(body)
    if (!parsed.success) return Errors.validation(parsed.error.issues)

    const { recipientId } = parsed.data

    // Cannot start conversation with self
    if (recipientId === userId) {
      return Errors.validation('Vous ne pouvez pas commencer une conversation avec vous-meme')
    }

    // Verify recipient exists and belongs to the same tenant
    const recipient = await db.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        tenantId: true,
      },
    })

    if (!recipient) return Errors.notFound('Destinataire')
    if (recipient.tenantId !== tenantId) {
      return Errors.forbidden('Impossible de démarrer une conversation avec un utilisateur d\'une autre organisation')
    }

    // Sort participant IDs to ensure consistent ordering
    const [p1, p2] = userId < recipientId ? [userId, recipientId] : [recipientId, userId]

    // Find existing conversation
    let conversation = await db.conversation.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id: p1,
          participant2Id: p2,
        },
      },
    })

    // Create if not found
    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          tenantId,
          participant1Id: p1,
          participant2Id: p2,
        },
      })
    }

    return success({
      conversation: {
        id: conversation.id,
        otherParticipant: recipient,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
      },
    }, conversation.createdAt.toISOString() === conversation.updatedAt.toISOString()
      ? 'Conversation creee'
      : 'Conversation existante retrouvee'
    )
  } catch (err) {
    return handleApiError(err)
  }
}
