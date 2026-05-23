// ============================================
// CreaPulse V2 — Pitch Deck API
// GET  /api/pitch-deck  — Retrieve pitch deck data
// PUT  /api/pitch-deck  — Save / update pitch deck data
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

// ─── Validation Schema ───────────────────────

const pitchDeckSchema = z.object({
  slides: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string().optional(),
      extraData: z.unknown().optional(),
    })
  ).optional(),
}).passthrough()

// ─── Auth helper ─────────────────────────────

async function authenticate(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const authHeader = request.headers.get('authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
  if (!token) return null
  try { return await verifyToken(token) } catch { return null }
}

// ─── GET ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

    // Try to get from ZeroDraft (reused for pitch deck persistence)
    const draft = await db.zeroDraft.findUnique({
      where: { userId: payload.userId },
    })

    if (!draft) return success(null, 'Aucun pitch deck')

    return success(draft, 'Pitch deck chargé')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PUT ────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return Errors.unauthorized()

    const body = await request.json()
    const parsed = pitchDeckSchema.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const { slides, projectTitle } = body

    // Store slides as content in ZeroDraft (JSON stringify)
    const content = JSON.stringify({ slides })
    const wordCount = content.split(/\s+/).filter(Boolean).length

    const draft = await db.zeroDraft.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        projectTitle: projectTitle || 'Mon Pitch Deck',
        content,
        wordCount,
        status: 'DRAFT',
      },
      update: {
        projectTitle: projectTitle || undefined,
        content,
        wordCount,
      },
    })

    return success(draft, 'Pitch deck sauvegardé')
  } catch (err) {
    return handleApiError(err)
  }
}
