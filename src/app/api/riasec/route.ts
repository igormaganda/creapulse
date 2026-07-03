// ============================================
// CreaPulse V2 — RIASEC Results API
// GET  /api/riasec  — Retrieve saved RIASEC results
// POST /api/riasec  — Save/upsert RIASEC results
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

// Helper: extract token from Authorization header or session cookie
function getTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = getTokenFromHeader(request)
  if (authHeader) return authHeader
  // Fallback: session cookie
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/session=([^;]+)/)
  return match ? match[1] : null
}

// ─── Validation schemas ────────────────────

const RiasecResultSchema = z.object({
  profileType: z.enum(['R', 'I', 'A', 'S', 'E', 'C']),
  score: z.number().min(0).max(25),
  isDominant: z.boolean(),
})

const SaveRiasecBody = z.object({
  results: z.array(RiasecResultSchema).min(6).max(6),
})

// ─── GET: Retrieve saved RIASEC results ────

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(request)
    if (!token) {
      throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)
    }

    const payload = await verifyToken(token)

    // Fetch RIASEC results
    const results = await db.riasecResult.findMany({
      where: { userId: payload.userId },
      orderBy: { profileType: 'asc' },
    })

    if (results.length === 0) {
      return success([], 'No RIASEC results found')
    }

    return success(
      results.map((r) => ({
        profileType: r.profileType,
        score: r.score,
        isDominant: r.isDominant,
        createdAt: r.createdAt,
      }))
    )
  } catch (err) {
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}

// ─── POST: Save/upsert RIASEC results ──────

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(request)
    if (!token) {
      throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)
    }

    const payload = await verifyToken(token)

    // Parse and validate request body
    const body = await request.json()
    const parsed = SaveRiasecBody.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })))
    }
    const { results } = parsed.data

    // Upsert all 6 RIASEC results in a transaction
    await db.$transaction(
      results.map((r) =>
        db.riasecResult.upsert({
          where: {
            userId_profileType: {
              userId: payload.userId,
              profileType: r.profileType,
            },
          },
          create: {
            userId: payload.userId,
            profileType: r.profileType,
            score: r.score,
            isDominant: r.isDominant,
          },
          update: {
            score: r.score,
            isDominant: r.isDominant,
          },
        })
      )
    )

    // Also update ModuleResult for riasec module
    const totalScore = results.reduce((sum, r) => sum + r.score, 0)
    const maxTotalScore = 150 // 6 types × 25 max

    await db.moduleResult.upsert({
      where: {
        userId_moduleCode: {
          userId: payload.userId,
          moduleCode: 'riasec',
        },
      },
      create: {
        userId: payload.userId,
        moduleCode: 'riasec',
        score: Math.round((totalScore / maxTotalScore) * 100),
        maxScore: 100,
        answers: results.reduce(
          (acc, r) => {
            acc[r.profileType] = { score: r.score, isDominant: r.isDominant }
            return acc
          },
          {} as Record<string, unknown>
        ),
        completedAt: new Date(),
      },
      update: {
        score: Math.round((totalScore / maxTotalScore) * 100),
        answers: results.reduce(
          (acc, r) => {
            acc[r.profileType] = { score: r.score, isDominant: r.isDominant }
            return acc
          },
          {} as Record<string, unknown>
        ),
        completedAt: new Date(),
      },
    })

    // Fire-and-forget: notify user on module completion
    createNotification({
      userId: payload.userId,
      title: 'Module complété',
      content: 'Félicitations ! Vous avez complété le module RIASEC',
      type: 'SUCCESS',
      link: '/bureau/riasec',
    }).catch(() => {})

    return success(
      { saved: results.length, moduleScore: Math.round((totalScore / maxTotalScore) * 100) },
      'RIASEC results saved successfully'
    )
  } catch (err) {
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}
