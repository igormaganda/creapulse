// ============================================
// CreaPulse V2 — Annuaire Favorites API
// GET    /api/annuaire/favorites  — List user's favorites
// POST   /api/annuaire/favorites  — Toggle favorite (add/remove)
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'

// ─── Validation ────────────────────────────

const ToggleFavoriteBody = z.object({
  actorId: z.string().min(1),
})

// ─── Helper: get authenticated user ────────

async function getAuthUser(request: NextRequest) {
  const token = getTokenFromHeader(request)
  if (!token) {
    throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)
  }
  return verifyToken(token)
}

// ─── GET: List user's favorite actors ──────

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuthUser(request)

    const favorites = await db.favorite.findMany({
      where: { userId: payload.userId },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            type: true,
            category: true,
            city: true,
            region: true,
            address: true,
            phone: true,
            email: true,
            website: true,
            description: true,
            services: true,
            featured: true,
            successRate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return success({
      favorites: favorites.map((f) => ({
        id: f.id,
        actor: {
          ...f.actor,
          services: f.actor.services as string[] | null,
        },
        addedAt: f.createdAt,
      })),
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}

// ─── POST: Toggle favorite (add if not exists, remove if exists) ──

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthUser(request)

    const body = await request.json()
    const { actorId } = ToggleFavoriteBody.parse(body)

    // Verify actor exists
    const actor = await db.actor.findUnique({ where: { id: actorId } })
    if (!actor) {
      return Errors.notFound('Acteur')
    }

    // Check if already a favorite
    const existing = await db.favorite.findUnique({
      where: {
        userId_actorId: {
          userId: payload.userId,
          actorId,
        },
      },
    })

    if (existing) {
      // Remove favorite
      await db.favorite.delete({ where: { id: existing.id } })
      return success({ isFavorite: false }, 'Favori retiré')
    } else {
      // Add favorite
      await db.favorite.create({
        data: {
          userId: payload.userId,
          actorId,
        },
      })
      return success({ isFavorite: true }, 'Favori ajouté')
    }
  } catch (err) {
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}
