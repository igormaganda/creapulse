// ============================================
// CreaPulse V2 — Forum Discussion Detail API
// GET  /api/forum/[id]    — Get single discussion with replies
// POST /api/forum/[id]    — Add reply to discussion
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'

// ─── Validation schemas ────────────────────

const AddReplyBody = z.object({
  content: z.string().min(1, 'Le contenu est requis').max(5000),
  parentId: z.string().optional(),
})

// ─── Helper: Author shape ───────────────────

function authorShape(user: { firstName: string | null; lastName: string | null; id: string }) {
  const first = user.firstName || ''
  const last = user.lastName || ''
  const fullName = [first, last].filter(Boolean).join(' ') || 'Anonyme'
  const initials = [first?.[0] || '', last?.[0] || ''].filter(Boolean).join('').toUpperCase() || '?'
  return { id: user.id, name: fullName, initials }
}

// ─── Helper: Build reply tree ──────────────

function buildReplyTree(replies: Array<{
  id: string
  content: string
  isEdited: boolean
  likesCount: number
  createdAt: Date
  updatedAt: Date
  parentId: string | null
  author: { id: string; firstName: string | null; lastName: string | null }
}>): Array<{
  id: string
  content: string
  isEdited: boolean
  likesCount: number
  createdAt: Date
  updatedAt: Date
  parentId: string | null
  author: { id: string; name: string; initials: string }
  children: ReturnType<typeof buildReplyTree>
}> {
  const replyMap = new Map<string, ReturnType<typeof buildReplyTree>[number]>()
  const rootReplies: ReturnType<typeof buildReplyTree> = []

  // First pass: create all nodes
  for (const r of replies) {
    replyMap.set(r.id, {
      id: r.id,
      content: r.content,
      isEdited: r.isEdited,
      likesCount: r.likesCount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      parentId: r.parentId,
      author: authorShape(r.author),
      children: [],
    })
  }

  // Second pass: build tree
  for (const r of replies) {
    const node = replyMap.get(r.id)!
    if (r.parentId && replyMap.has(r.parentId)) {
      replyMap.get(r.parentId)!.children.push(node)
    } else {
      rootReplies.push(node)
    }
  }

  return rootReplies
}

// ─── GET: Get single discussion with replies ─

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const discussion = await db.discussion.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        replies: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!discussion) {
      return Errors.notFound('Discussion')
    }

    // Increment view count
    await db.discussion.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return success({
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
      author: authorShape(discussion.author),
      category: discussion.category,
      tags: discussion.tags,
      isPinned: discussion.isPinned,
      isLocked: discussion.isLocked,
      viewCount: discussion.viewCount + 1,
      likesCount: discussion.likesCount,
      replyCount: discussion.replyCount,
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
      replies: buildReplyTree(discussion.replies),
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Add reply to discussion ─────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Auth (optional — prefer authenticated)
    let userId: string | undefined
    try {
      const token = getTokenFromHeader(request)
      if (token) {
        const payload = await verifyToken(token)
        userId = payload.userId
      }
    } catch {
      // Continue without auth
    }

    if (!userId) {
      const firstUser = await db.user.findFirst({ select: { id: true } })
      if (!firstUser) {
        return Errors.notFound('Utilisateur')
      }
      userId = firstUser.id
    }

    // Check discussion exists
    const discussion = await db.discussion.findUnique({ where: { id } })
    if (!discussion) {
      return Errors.notFound('Discussion')
    }

    if (discussion.isLocked) {
      return Errors.validation(null, 'Cette discussion est verrouillée')
    }

    const body = await request.json()
    const { content, parentId } = AddReplyBody.parse(body)

    // If parentId, verify it belongs to this discussion
    if (parentId) {
      const parentReply = await db.reply.findUnique({
        where: { id: parentId },
      })
      if (!parentReply || parentReply.discussionId !== id) {
        return Errors.notFound('Réponse parente')
      }
    }

    // Create reply
    const reply = await db.reply.create({
      data: {
        discussionId: id,
        authorId: userId,
        content,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Increment reply count on discussion
    await db.discussion.update({
      where: { id },
      data: { replyCount: { increment: 1 } },
    })

    return success(
      {
        id: reply.id,
        content: reply.content,
        author: authorShape(reply.author),
        parentId: reply.parentId,
        likesCount: 0,
        isEdited: false,
        createdAt: reply.createdAt,
      },
      'Réponse ajoutée avec succès',
      201,
    )
  } catch (err) {
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}
