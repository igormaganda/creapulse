// ============================================
// CreaPulse V2 — Vision API
// GET  /api/vision  — Retrieve vision data
// PUT  /api/vision  — Save/update vision data
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'

// ─── Validation schemas ────────────────────

const VisionBody = z.object({
  visionStatement: z.string().optional(),
  objectives: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    deadline: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
  })).optional(),
  coreValues: z.array(z.string()).optional(),
  milestones: z.object({
    sixMonths: z.object({ goals: z.array(z.string()) }).optional(),
    oneYear: z.object({ goals: z.array(z.string()) }).optional(),
    threeYears: z.object({ goals: z.array(z.string()) }).optional(),
    fiveYears: z.object({ goals: z.array(z.string()) }).optional(),
  }).optional(),
  motivation: z.string().optional(),
  desiredImpact: z.string().optional(),
})

// ─── GET: Retrieve vision data ──────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return
    const { payload } = auth

    const journey = await db.creatorJourney.findUnique({
      where: { userId: payload.userId },
      select: { id: true, visionAnswers: true, projectTitle: true },
    })

    const visionAnswers = (journey?.visionAnswers || {}) as Record<string, unknown>

    return success({
      projectTitle: journey?.projectTitle || '',
      visionStatement: (visionAnswers.visionStatement as string) || '',
      objectives: (visionAnswers.objectives as Array<{ id: string; title: string; description: string; deadline?: string; priority?: string }>) || [],
      coreValues: (visionAnswers.coreValues as string[]) || [],
      milestones: (visionAnswers.milestones as {
        sixMonths?: { goals: string[] }
        oneYear?: { goals: string[] }
        threeYears?: { goals: string[] }
        fiveYears?: { goals: string[] }
      }) || {
        sixMonths: { goals: [] },
        oneYear: { goals: [] },
        threeYears: { goals: [] },
        fiveYears: { goals: [] },
      },
      motivation: (visionAnswers.motivation as string) || '',
      desiredImpact: (visionAnswers.desiredImpact as string) || '',
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PUT: Save/update vision data ───────────

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return
    const { payload } = auth

    const body = await request.json()
    const data = VisionBody.parse(body)

    // Merge with existing visionAnswers (preserve profile data)
    const existing = await db.creatorJourney.findUnique({
      where: { userId: payload.userId },
      select: { visionAnswers: true },
    })
    const existingAnswers = (existing?.visionAnswers || {}) as Record<string, unknown>

    const updatedAnswers = {
      ...existingAnswers,
      visionStatement: data.visionStatement ?? existingAnswers.visionStatement,
      objectives: data.objectives ?? existingAnswers.objectives,
      coreValues: data.coreValues ?? existingAnswers.coreValues,
      milestones: data.milestones ?? existingAnswers.milestones,
      motivation: data.motivation ?? existingAnswers.motivation,
      desiredImpact: data.desiredImpact ?? existingAnswers.desiredImpact,
    }

    // Calculate completion percentage
    const sections = [
      data.visionStatement,
      data.objectives?.length ? 'filled' : null,
      data.coreValues?.length ? 'filled' : null,
      data.milestones ? 'filled' : null,
      data.motivation,
      data.desiredImpact,
    ]
    const filledCount = sections.filter(Boolean).length
    const completionPercent = Math.round((filledCount / 6) * 100)

    await db.creatorJourney.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        visionAnswers: updatedAnswers as Record<string, unknown>,
        progressPercent: completionPercent,
        currentPhase: 'DISCOVERY',
      },
      update: {
        visionAnswers: updatedAnswers as Record<string, unknown>,
        progressPercent: completionPercent,
      },
    })

    return success(
      { updated: true, completion: completionPercent },
      'Vision sauvegardée avec succès'
    )
  } catch (err) {
    return handleApiError(err)
  }
}
