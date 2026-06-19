// ============================================
// CreaPulse V2 — PAA Program API
// GET   /api/paa/program  — Get or create PAA program
// POST  /api/paa/program  — Create PAA program (admin/conseiller)
// PATCH /api/paa/program  — Update program status/conclusion
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'

// ─── Validation schemas ────────────────────

const ProgramStatusValues = ['ACTIVE', 'COMPLETED', 'ABANDONED'] as const

const CreateProgramBody = z.object({
  userId: z.string().min(1),
})

const UpdateProgramBody = z.object({
  status: z.enum(ProgramStatusValues).optional(),
  conclusion: z.string().max(2000).optional(),
  conclusionNotes: z.string().max(5000).optional(),
  followUpDone: z.boolean().optional(),
})

// ─── Helpers ───────────────────────────────

const MILESTONE_TYPES = [
  { type: 'DIAGNOSTIC', label: 'Diagnostic initial', daysOffset: 10 },
  { type: 'SUIVI', label: 'Suivi intermédiaire', daysOffset: 30 },
  { type: 'CONCLUSION', label: 'Conclusion du programme', daysOffset: 60 },
  { type: 'SUIVI_3MOIS', label: 'Suivi à 3 mois', daysOffset: 90 },
] as const

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

async function createProgramWithMilestones(userId: string, tenantId: string) {
  const now = new Date()
  const plannedEndAt = addDays(now, 60)

  return db.$transaction(async (tx) => {
    const program = await tx.paaProgram.create({
      data: {
        userId,
        tenantId,
        status: 'ACTIVE',
        startedAt: now,
        plannedEndAt,
      },
    })

    await Promise.all(
      MILESTONE_TYPES.map((m) =>
        tx.paaMilestone.create({
          data: {
            programId: program.id,
            type: m.type,
            label: m.label,
            plannedDate: addDays(now, m.daysOffset),
            status: 'PENDING',
          },
        })
      )
    )

    return program
  })
}

// ─── GET: Get or create PAA program ──────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    let program = await db.paaProgram.findFirst({
      where: {
        userId: payload.userId,
        tenantId: payload.tenantId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      include: {
        milestones: true,
        atelierSessions: true,
        objectives: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Auto-create if no active program exists
    if (!program) {
      program = await createProgramWithMilestones(
        payload.userId,
        payload.tenantId,
      )
      // Re-fetch with includes
      program = await db.paaProgram.findUniqueOrThrow({
        where: { id: program.id },
        include: {
          milestones: true,
          atelierSessions: true,
          objectives: true,
        },
      })
    }

    const completedMilestones = program.milestones.filter((m) => m.status === 'COMPLETED').length
    const totalMilestones = program.milestones.length

    return success({
      ...program,
      milestonesCount: totalMilestones,
      completedMilestonesCount: completedMilestones,
      ateliersCount: program.atelierSessions.length,
      objectivesCount: program.objectives.length,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Create PAA program ─────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['ADMIN', 'COUNSELOR'] })
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const body = await request.json()
    const { userId } = CreateProgramBody.parse(body)

    // Check if user already has an active program
    const existing = await db.paaProgram.findFirst({
      where: {
        userId,
        tenantId: payload.tenantId,
        status: 'ACTIVE',
      },
    })

    if (existing) {
      return Errors.validation(
        { userId },
        'Cet utilisateur a déjà un programme PAA actif.',
      )
    }

    const program = await createProgramWithMilestones(
      userId,
      payload.tenantId,
    )

    // Fetch with includes
    const created = await db.paaProgram.findUniqueOrThrow({
      where: { id: program.id },
      include: { milestones: true },
    })

    return success(created, 'Programme PAA créé avec succès', 201)
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PATCH: Update program ─────────────────

export async function PATCH(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const body = await request.json()
    const updates = UpdateProgramBody.parse(body)

    // Find the user's active program
    const program = await db.paaProgram.findFirst({
      where: {
        userId: payload.userId,
        tenantId: payload.tenantId,
        status: 'ACTIVE',
      },
    })

    if (!program) {
      return Errors.notFound('Programme PAA')
    }

    const updated = await db.paaProgram.update({
      where: { id: program.id },
      data: {
        ...updates,
        // If status changed to COMPLETED, set completedAt
        ...(updates.status === 'COMPLETED' && {
          completedAt: new Date(),
        }),
      },
    })

    return success(updated, 'Programme PAA mis à jour')
  } catch (err) {
    return handleApiError(err)
  }
}
