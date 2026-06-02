// ============================================
// CréaScope — Swipe Game Results API
// GET    /api/swipe  — Retrieve all swipe results for current user
// POST   /api/swipe  — Save swipe results (batch) + auto-update Kiviat
// DELETE /api/swipe  — Reset all swipe results
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import {
  computeSwipeScores,
  toKiviatResults,
  DIMENSION_CODES,
} from '@/lib/kiviat-scoring'

// ─── Validation schemas ────────────────────

const SwipeResultSchema = z.object({
  cardCode: z.string().min(1),
  cardTitle: z.string().min(1),
  kept: z.boolean(),
  superPepite: z.boolean().default(false),
  confidence: z.number().min(1).max(5).optional(),
})

const SaveSwipeBody = z.object({
  results: z.array(SwipeResultSchema).min(1).max(60),
})

// ─── GET: Retrieve all swipe results ───────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return
    const { payload } = auth

    const results = await db.swipeGameResult.findMany({
      where: { userId: payload.userId },
      orderBy: { swipedAt: 'desc' },
      select: {
        id: true,
        cardCode: true,
        cardTitle: true,
        kept: true,
        superPepite: true,
        confidence: true,
        swipedAt: true,
      },
    })

    // Compute current dimension scores from saved results
    const dimensionScores = computeSwipeScores(
      results.map((r) => ({
        cardCode: r.cardCode,
        cardTitle: r.cardTitle,
        kept: r.kept,
        superPepite: r.superPepite,
        confidence: r.confidence ?? undefined,
      }))
    )

    return success({
      results,
      dimensionScores,
      totalKept: results.filter((r) => r.kept).length,
      totalSuperPepite: results.filter((r) => r.superPepite).length,
      totalCards: results.length,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Save swipe results (batch) ──────

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return
    const { payload } = auth

    const body = await request.json()
    const { results } = SaveSwipeBody.parse(body)

    // 1. Look up all SwipeCards by code to get their IDs
    const cardCodes = results.map((r) => r.cardCode)
    const cards = await db.swipeCard.findMany({
      where: { code: { in: cardCodes } },
      select: { id: true, code: true },
    })

    const cardMap = new Map(cards.map((c) => [c.code, c.id]))

    // Validate all card codes exist
    const missingCodes = cardCodes.filter((code) => !cardMap.has(code))
    if (missingCodes.length > 0) {
      return Errors.validation(
        { missingCards: missingCodes },
        `Les cartes suivantes n'existent pas : ${missingCodes.join(', ')}`
      )
    }

    // 2. Upsert SwipeGameResults in a transaction
    const upsertOps = results.map((r) => {
      const cardId = cardMap.get(r.cardCode)!
      return db.swipeGameResult.upsert({
        where: {
          userId_cardId: {
            userId: payload.userId,
            cardId,
          },
        },
        create: {
          userId: payload.userId,
          cardId,
          cardCode: r.cardCode,
          cardTitle: r.cardTitle,
          kept: r.kept,
          superPepite: r.superPepite,
          confidence: r.confidence,
        },
        update: {
          cardTitle: r.cardTitle,
          kept: r.kept,
          superPepite: r.superPepite,
          confidence: r.confidence,
          swipedAt: new Date(),
        },
      })
    })

    await db.$transaction(upsertOps)

    // 3. Compute swipe dimension scores
    const swipeScores = computeSwipeScores(results)

    // 4. Auto-update KiviatResult for each dimension
    //    Only update if no existing Kiviat result OR if swipe is the sole source
    const kiviatOps = DIMENSION_CODES.map((dim) => {
      return db.kiviatResult.upsert({
        where: {
          userId_category: {
            userId: payload.userId,
            category: dim,
          },
        },
        create: {
          userId: payload.userId,
          category: dim,
          score: Math.round((swipeScores[dim] / 100) * 10 * 10) / 10,
          maxScore: 10,
        },
        update: {
          score: Math.round((swipeScores[dim] / 100) * 10 * 10) / 10,
        },
      })
    })

    await db.$transaction(kiviatOps)

    // 5. Update ModuleResult for 'pepites' module
    const avgScore = Object.values(swipeScores).reduce((sum, s) => sum + s, 0) / DIMENSION_CODES.length
    const totalKept = results.filter((r) => r.kept).length
    const totalSuperPepite = results.filter((r) => r.superPepite).length

    await db.moduleResult.upsert({
      where: {
        userId_moduleCode: {
          userId: payload.userId,
          moduleCode: 'pepites',
        },
      },
      create: {
        userId: payload.userId,
        moduleCode: 'pepites',
        score: Math.round(avgScore),
        maxScore: 100,
        answers: {
          swipeScores,
          totalKept,
          totalSuperPepite,
          totalCards: results.length,
          sources: ['swipe'],
        } as Record<string, unknown>,
        completedAt: new Date(),
      },
      update: {
        score: Math.round(avgScore),
        answers: {
          swipeScores,
          totalKept,
          totalSuperPepite,
          totalCards: results.length,
          sources: ['swipe'],
        } as Record<string, unknown>,
        completedAt: new Date(),
      },
    })

    return success(
      {
        saved: results.length,
        dimensionScores: swipeScores,
        globalAverage: Math.round(avgScore),
        totalKept,
        totalSuperPepite,
      },
      'Résultats swipe sauvegardés avec succès'
    )
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── DELETE: Reset all swipe results ───────

export async function DELETE(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return
    const { payload } = auth

    const { count } = await db.swipeGameResult.deleteMany({
      where: { userId: payload.userId },
    })

    return success(
      { deleted: count },
      count > 0
        ? 'Résultats swipe supprimés avec succès'
        : 'Aucun résultat swipe à supprimer'
    )
  } catch (err) {
    return handleApiError(err)
  }
}
