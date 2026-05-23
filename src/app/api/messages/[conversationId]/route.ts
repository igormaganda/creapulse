// ============================================
// CreaPulse V2 — Messages API (Conversation Detail)
// GET: Get messages in a conversation
// POST: Send a message
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

// ─── GET: Messages in conversation ───────────

export async function GET(
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

    // Pagination (cursor-based for infinite scroll)
    const { searchParams } = new URL(request.url)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)))
    const before = searchParams.get('before')

    const messages = await db.message.findMany({
      where: {
        conversationId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Mark unread messages as read
    await db.message.updateMany({
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

    // Reverse for chronological order
    const reversedMessages = messages.reverse().map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      sender: msg.sender,
      isRead: msg.isRead,
      readAt: msg.readAt?.toISOString() ?? null,
      createdAt: msg.createdAt.toISOString(),
      isOwn: msg.senderId === userId,
    }))

    const hasMore = messages.length === limit

    return success({
      messages: reversedMessages,
      hasMore,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Send a message ────────────────────

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Le message ne peut pas etre vide'),
})

export async function POST(
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

    // Validate body
    const body = await request.json()
    const parsed = sendMessageSchema.safeParse(body)
    if (!parsed.success) return Errors.validation(parsed.error.issues)

    const { content } = parsed.data

    // Create message + update conversation
    const message = await db.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    })

    // Update conversation last message
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content.trim().slice(0, 200),
        lastMessageAt: new Date(),
      },
    })

    // Optionally create notification for recipient
    const recipientId = conversation.participant1Id === userId
      ? conversation.participant2Id
      : conversation.participant1Id

    try {
      await db.notification.create({
        data: {
          userId: recipientId,
          title: 'Nouveau message',
          content: content.trim().slice(0, 100),
          type: 'INFO',
          link: `/messages/${conversationId}`,
        },
      })
    } catch {
      // Notification creation is optional
    }

    return success({
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        sender: message.sender,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
        isOwn: true,
      },
    }, 'Message envoye', 201)
  } catch (err) {
    return handleApiError(err)
  }
}
