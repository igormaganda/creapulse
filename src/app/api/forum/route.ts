// ============================================
// CreaPulse V2 — Forum Discussions API
// GET  /api/forum          — List discussions (?category=...&search=...&page=1&sort=recent|popular|comments)
// POST /api/forum          — Create new discussion
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'
import { withAuth } from '@/lib/api-auth'

// ─── Validation schemas ────────────────────

const CreateDiscussionBody = z.object({
  title: z.string().min(10, 'Le titre doit contenir au moins 10 caractères').max(200),
  content: z.string().min(20, 'Le contenu doit contenir au moins 20 caractères').max(10000),
  categoryId: z.string().min(1, 'La catégorie est requise'),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
})

// ─── Helper: Author shape ───────────────────

function authorShape(user: { firstName: string | null; lastName: string | null; id: string }) {
  const first = user.firstName || ''
  const last = user.lastName || ''
  const fullName = [first, last].filter(Boolean).join(' ') || 'Anonyme'
  const initials = [first?.[0] || '', last?.[0] || ''].filter(Boolean).join('').toUpperCase() || '?'
  return { id: user.id, name: fullName, initials }
}

// ─── GET: List discussions ─────────────────

export async function GET(request: NextRequest) {
  try {
    // Auth required for forum access
    const auth = await withAuth(request)
    if (!auth || auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)

    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const sortParam = searchParams.get('sort') || 'recent'
    const validSorts = ['recent', 'popular', 'comments'] as const
    const sort = validSorts.includes(sortParam as typeof validSorts[number]) ? sortParam as typeof validSorts[number] : 'recent'

    const where: Record<string, unknown> = {}

    if (category) {
      where.category = { slug: category }
    }

    if (search) {
      const searchTerm = search
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { has: searchTerm } },
      ]
    }

    const orderBy =
      sort === 'popular'
        ? [{ isPinned: 'desc' as const }, { likesCount: 'desc' as const }, { createdAt: 'desc' as const }]
        : sort === 'comments'
          ? [{ isPinned: 'desc' as const }, { replyCount: 'desc' as const }, { createdAt: 'desc' as const }]
          : [{ isPinned: 'desc' as const }, { createdAt: 'desc' as const }]

    const [discussions, total] = await Promise.all([
      db.discussion.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
        },
      }),
      db.discussion.count({ where }),
    ])

    return success({
      discussions: discussions.map(d => ({
        id: d.id,
        title: d.title,
        content: d.content,
        preview: d.content.substring(0, 150) + (d.content.length > 150 ? '...' : ''),
        author: authorShape(d.author),
        category: d.category,
        replyCount: d.replyCount,
        likesCount: d.likesCount,
        isPinned: d.isPinned,
        isLocked: d.isLocked,
        viewCount: d.viewCount,
        tags: d.tags,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
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

// ─── POST: Create discussion ───────────────

export async function POST(request: NextRequest) {
  try {
    // Auth required
    let userId: string | undefined
    try {
      const token = getTokenFromHeader(request)
      if (!token) {
        return Errors.unauthorized('Authentification requise pour publier')
      }
      const payload = await verifyToken(token)
      userId = payload.userId
    } catch {
      return Errors.unauthorized('Token invalide ou expiré')
    }

    const body = await request.json()
    const { title, content, categoryId, tags } = CreateDiscussionBody.parse(body)

    // Verify category exists
    const category = await db.discussionCategory.findUnique({ where: { id: categoryId } })
    if (!category) {
      return Errors.notFound('Catégorie')
    }

    // Create discussion
    const discussion = await db.discussion.create({
      data: {
        title,
        content,
        authorId: userId,
        categoryId,
        tags,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
    })

    return success(
      {
        id: discussion.id,
        title: discussion.title,
        content: discussion.content,
        author: authorShape(discussion.author),
        category: discussion.category,
        tags: discussion.tags,
        createdAt: discussion.createdAt,
      },
      'Discussion créée avec succès',
      201,
    )
  } catch (err) {
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}
