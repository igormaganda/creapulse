// ============================================
// CreaPulse — Onboarding Persistence API
// GET  /api/onboarding  → fetch onboarding data
// PUT  /api/onboarding  → save/update onboarding data
// Reuses ModuleResult model with moduleCode='onboarding'
// ============================================

import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

// ─── Extract userId from request (cookie or header) ──

async function getUserId(request: NextRequest): Promise<string | null> {
  const cookieToken = request.cookies.get('session')?.value
  const headerToken = getTokenFromHeader(request)
  const token = cookieToken || headerToken

  if (!token) return null

  try {
    const payload = await verifyToken(token)
    return payload.userId
  } catch {
    return null
  }
}

// ─── GET: Fetch onboarding data ─────────────

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return Errors.unauthorized('Authentication required')
    }

    const result = await db.moduleResult.findUnique({
      where: {
        userId_moduleCode: {
          userId,
          moduleCode: 'onboarding',
        },
      },
    })

    if (!result || !result.completedAt) {
      return success({ completed: false, data: null })
    }

    return success({
      completed: true,
      data: result.answers,
    })
  } catch (err) {
    console.error('[Onboarding GET] DB error:', err)
    // Graceful fallback on DB error
    return Response.json({ fallback: true, completed: false, data: null })
  }
}

// ─── PUT: Save/update onboarding data ───────

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return Errors.unauthorized('Authentication required')
    }

    const body = await request.json()

    // Upsert onboarding result
    await db.moduleResult.upsert({
      where: {
        userId_moduleCode: {
          userId,
          moduleCode: 'onboarding',
        },
      },
      create: {
        userId,
        moduleCode: 'onboarding',
        answers: body,
        score: 1,
        maxScore: 1,
        completedAt: new Date(),
      },
      update: {
        answers: body,
        score: 1,
        maxScore: 1,
        completedAt: new Date(),
      },
    })

    return success({ completed: true }, 'Onboarding saved')
  } catch (err) {
    console.error('[Onboarding PUT] DB error:', err)
    // Graceful fallback on DB error
    return Response.json({ fallback: true })
  }
}