// ============================================
// CreaPulse V2 — PAA Milestones API
// GET   /api/paa/milestones  — Get milestones for user's program
// PATCH /api/paa/milestones  — Update a milestone
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import { createNotification } from '@/lib/notifications'

// ─── Validation schemas ────────────────────

const MilestoneStatusValues = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] as const

const UpdateMilestoneBody = z.object({
  milestoneId: z.string().min(1),
  status: z.enum(MilestoneStatusValues).optional(),
  completedAt: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().max(5000).optional(),
})

// ─── GET: Get milestones ───────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const program = await db.paaProgram.findFirst({
      where: {
        userId: payload.userId,
        tenantId: payload.tenantId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!program) {
      return Errors.notFound('Programme PAA')
    }

    const milestones = await db.paaMilestone.findMany({
      where: { programId: program.id },
      orderBy: { plannedDate: 'asc' },
    })

    const completed = milestones.filter((m) => m.status === 'COMPLETED').length
    const total = milestones.length
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0

    return success({
      milestones,
      total,
      completed,
      completionPercent,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PATCH: Update a milestone ─────────────

export async function PATCH(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const body = await request.json()
    const { milestoneId, ...updates } = UpdateMilestoneBody.parse(body)

    // Verify the milestone belongs to the user's program
    const program = await db.paaProgram.findFirst({
      where: {
        userId: payload.userId,
        tenantId: payload.tenantId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!program) {
      return Errors.notFound('Programme PAA')
    }

    const milestone = await db.paaMilestone.findFirst({
      where: {
        id: milestoneId,
        programId: program.id,
      },
    })

    if (!milestone) {
      return Errors.notFound('Jalon')
    }

    // Build update payload
    const updateData: Record<string, unknown> = {}

    if (updates.status !== undefined) {
      updateData.status = updates.status
      // Auto-set completedAt when marking as COMPLETED
      if (updates.status === 'COMPLETED' && !updates.completedAt) {
        updateData.completedAt = new Date()
      }
      // Clear completedAt if no longer completed
      if (updates.status !== 'COMPLETED') {
        updateData.completedAt = null
      }
    }

    if (updates.completedAt !== undefined) {
      updateData.completedAt = updates.completedAt ? new Date(updates.completedAt) : null
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes
    }

    const updated = await db.paaMilestone.update({
      where: { id: milestoneId },
      data: updateData,
    })

    // Fire-and-forget: notify on milestone completion
    if (updated.status === 'COMPLETED') {
      createNotification({
        userId: payload.userId,
        title: 'Jalon atteint',
        content: `Jalon atteint : ${updated.label || 'Jalon PAA'}`,
        type: 'MILESTONE',
        link: '/bureau/paa',
      }).catch(() => {})
    }

    return success(updated, 'Jalon mis à jour')
  } catch (err) {
    return handleApiError(err)
  }
}
