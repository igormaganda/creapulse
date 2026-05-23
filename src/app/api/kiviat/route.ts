// ============================================
// CreaPulse V2 — Kiviat Assessment API
// GET  /api/kiviat  — Retrieve saved Kiviat results
// POST /api/kiviat  — Save/update Kiviat results
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'

// ─── Validation schemas ────────────────────

const KiviatDimensionSchema = z.object({
  category: z.string().min(1),
  score: z.number().min(1).max(10),
})

const SaveKiviatBody = z.object({
  results: z.array(KiviatDimensionSchema).min(8).max(8),
})

// ─── GET: Retrieve saved Kiviat results ─────

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)

    const results = await db.kiviatResult.findMany({
      where: { userId: payload.userId },
      orderBy: { category: 'asc' },
    })

    if (results.length === 0) {
      return success([], 'No Kiviat results found')
    }

    return success(
      results.map((r) => ({
        category: r.category,
        score: r.score,
        maxScore: r.maxScore,
        createdAt: r.createdAt,
      }))
    )
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}

// ─── POST: Save/update Kiviat results ──────

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)

    const body = await request.json()
    const { results } = SaveKiviatBody.parse(body)

    // Upsert all 8 Kiviat dimensions in a transaction
    await db.$transaction(
      results.map((r) =>
        db.kiviatResult.upsert({
          where: {
            userId_category: {
              userId: payload.userId,
              category: r.category,
            },
          },
          create: {
            userId: payload.userId,
            category: r.category,
            score: r.score,
            maxScore: 10,
          },
          update: {
            score: r.score,
          },
        })
      )
    )

    // Calculate global average
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

    // Update ModuleResult for kiviat module
    await db.moduleResult.upsert({
      where: {
        userId_moduleCode: {
          userId: payload.userId,
          moduleCode: 'kiviat',
        },
      },
      create: {
        userId: payload.userId,
        moduleCode: 'kiviat',
        score: Math.round(avgScore * 10),
        maxScore: 100,
        answers: results.reduce(
          (acc, r) => {
            acc[r.category] = r.score
            return acc
          },
          {} as Record<string, unknown>
        ),
        completedAt: new Date(),
      },
      update: {
        score: Math.round(avgScore * 10),
        answers: results.reduce(
          (acc, r) => {
            acc[r.category] = r.score
            return acc
          },
          {} as Record<string, unknown>
        ),
        completedAt: new Date(),
      },
    })

    return success(
      {
        saved: results.length,
        globalAverage: Math.round(avgScore * 10) / 10,
        moduleScore: Math.round(avgScore * 10),
      },
      'Résultats Kiviat sauvegardés avec succès'
    )
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
