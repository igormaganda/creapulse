// ============================================
// CreaPulse V2 — PAA SMART Objectives API
// GET    /api/paa/objectifs  — Get SMART objectives
// POST   /api/paa/objectifs  — Create a SMART objective
// PATCH  /api/paa/objectifs  — Update a SMART objective
// DELETE /api/paa/objectifs  — Delete a SMART objective
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'

// ─── Validation schemas ────────────────────

const ObjectiveStatusValues = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'] as const

const CreateObjectiveBody = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  specific: z.string().min(1).max(1000),
  measurable: z.string().min(1).max(1000),
  achievable: z.string().min(1).max(1000),
  relevant: z.string().min(1).max(1000),
  timeBound: z.string().min(1).max(1000),
})

const UpdateObjectiveBody = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  specific: z.string().min(1).max(1000).optional(),
  measurable: z.string().min(1).max(1000).optional(),
  achievable: z.string().min(1).max(1000).optional(),
  relevant: z.string().min(1).max(1000).optional(),
  timeBound: z.string().min(1).max(1000).optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(ObjectiveStatusValues).optional(),
})

const DeleteObjectiveBody = z.object({
  id: z.string().min(1),
})

// ─── Helpers ───────────────────────────────

async function getUserActiveProgram(userId: string) {
  return db.paaProgram.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'COMPLETED'] },
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── GET: Get SMART objectives ────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const program = await getUserActiveProgram(payload.userId)
    if (!program) {
      return Errors.notFound('Programme PAA')
    }

    const objectives = await db.smartObjective.findMany({
      where: { programId: program.id },
      orderBy: { createdAt: 'desc' },
    })

    return success({
      objectives,
      count: objectives.length,
      avgProgress:
        objectives.length > 0
          ? Math.round(objectives.reduce((sum, o) => sum + (o.progress ?? 0), 0) / objectives.length)
          : 0,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Create SMART objective ──────────

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const body = await request.json()
    const data = CreateObjectiveBody.parse(body)

    const program = await getUserActiveProgram(payload.userId)
    if (!program) {
      return Errors.notFound('Programme PAA')
    }

    const objective = await db.smartObjective.create({
      data: {
        programId: program.id,
        title: data.title,
        description: data.description,
        specific: data.specific,
        measurable: data.measurable,
        achievable: data.achievable,
        relevant: data.relevant,
        timeBound: data.timeBound,
        status: 'NOT_STARTED',
        progress: 0,
      },
    })

    return success(objective, 'Objectif SMART créé', 201)
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PATCH: Update SMART objective ──────────

export async function PATCH(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const body = await request.json()
    const { id, ...updates } = UpdateObjectiveBody.parse(body)

    const program = await getUserActiveProgram(payload.userId)
    if (!program) {
      return Errors.notFound('Programme PAA')
    }

    // Verify the objective belongs to the user's program
    const existing = await db.smartObjective.findFirst({
      where: {
        id,
        programId: program.id,
      },
    })

    if (!existing) {
      return Errors.notFound('Objectif SMART')
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.specific !== undefined) updateData.specific = updates.specific
    if (updates.measurable !== undefined) updateData.measurable = updates.measurable
    if (updates.achievable !== undefined) updateData.achievable = updates.achievable
    if (updates.relevant !== undefined) updateData.relevant = updates.relevant
    if (updates.timeBound !== undefined) updateData.timeBound = updates.timeBound
    if (updates.progress !== undefined) updateData.progress = updates.progress
    if (updates.status !== undefined) {
      updateData.status = updates.status
      if (updates.status === 'COMPLETED') {
        updateData.completedAt = new Date()
        updateData.progress = 100
      }
    }

    const updated = await db.smartObjective.update({
      where: { id },
      data: updateData,
    })

    return success(updated, 'Objectif SMART mis à jour')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── DELETE: Delete SMART objective ─────────

export async function DELETE(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const body = await request.json()
    const { id } = DeleteObjectiveBody.parse(body)

    const program = await getUserActiveProgram(payload.userId)
    if (!program) {
      return Errors.notFound('Programme PAA')
    }

    // Verify the objective belongs to the user's program
    const existing = await db.smartObjective.findFirst({
      where: {
        id,
        programId: program.id,
      },
    })

    if (!existing) {
      return Errors.notFound('Objectif SMART')
    }

    await db.smartObjective.delete({
      where: { id },
    })

    return success({ deleted: id }, 'Objectif SMART supprimé')
  } catch (err) {
    return handleApiError(err)
  }
}
