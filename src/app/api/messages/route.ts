// ============================================
// CreaPulse V2 — Messages API (Conversations List)
// GET: List all conversations for authenticated user
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Auth
    const token = getTokenFromHeader(request) || request.cookies.get('session')?.value
    if (!token) return Errors.unauthorized('Authentification requise')

    const payload = await verifyToken(token)
    const userId = payload.userId

    // Pagination
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    // Fetch conversations where user is participant1 or participant2
    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        messages: {
          where: {
            senderId: { not: userId },
            isRead: false,
          },
          select: { id: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take: limit,
    })

    // Fetch participant details for each conversation
    const conversationsWithParticipants = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.participant1Id === userId
          ? conv.participant2Id
          : conv.participant1Id

        const otherUser = await db.user.findUnique({
          where: { id: otherParticipantId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        })

        return {
          id: conv.id,
          otherParticipant: otherUser,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt.toISOString(),
          unreadCount: conv.messages.length,
          createdAt: conv.createdAt.toISOString(),
        }
      })
    )

    // Total count
    const total = await db.conversation.count({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
    })

    return success({
      conversations: conversationsWithParticipants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
