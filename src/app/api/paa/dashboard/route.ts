// ============================================
// CreaPulse V2 — PAA Dashboard API
// GET /api/paa/dashboard — Conseiller/admin aggregate stats
//   ?userId=X  — Return that user's detailed PAA data
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'

// ─── GET: Dashboard data ──────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['ADMIN', 'COUNSELOR'] })
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    // ── Per-user detailed view ──
    if (targetUserId) {
      const userProgram = await db.paaProgram.findFirst({
        where: { userId: targetUserId },
        include: {
          milestones: { orderBy: { plannedDate: 'asc' } },
          atelierSessions: { orderBy: { createdAt: 'desc' } },
          objectives: { orderBy: { createdAt: 'desc' } },
          satisfactionFeedbacks: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!userProgram) {
        return Errors.notFound('Programme PAA pour cet utilisateur')
      }

      const completedMilestones = userProgram.milestones.filter(
        (m) => m.status === 'COMPLETED',
      ).length
      const completedObjectives = userProgram.objectives.filter(
        (o) => o.status === 'COMPLETED',
      ).length
      const completedAteliers = userProgram.atelierSessions.filter(
        (a) => a.status === 'COMPLETE',
      ).length

      return success({
        program: userProgram,
        summary: {
          milestonesTotal: userProgram.milestones.length,
          milestonesCompleted: completedMilestones,
          objectivesTotal: userProgram.objectives.length,
          objectivesCompleted: completedObjectives,
          ateliersTotal: userProgram.atelierSessions.length,
          ateliersCompleted: completedAteliers,
          feedbackCount: userProgram.satisfactionFeedbacks.length,
        },
      })
    }

    // ── Aggregate dashboard stats ──
    const tenantId = (payload as Record<string, unknown>).tenantId as string | null | undefined

    const where = tenantId ? { tenantId } : {}

    const [totalActive, totalCompleted, totalAbandoned] = await Promise.all([
      db.paaProgram.count({ where: { ...where, status: 'ACTIVE' } }),
      db.paaProgram.count({ where: { ...where, status: 'COMPLETED' } }),
      db.paaProgram.count({ where: { ...where, status: 'ABANDONED' } }),
    ])

    // Average satisfaction rating
    const allFeedbacks = await db.satisfactionFeedback.findMany({
      where: { rating: { not: null } },
      select: { rating: true, nps: true },
    })
    const avgRating =
      allFeedbacks.length > 0
        ? Math.round(
            (allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length) * 10,
          ) / 10
        : null
    const npsScores = allFeedbacks.filter((f) => f.nps !== null).map((f) => f.nps!)
    const avgNps =
      npsScores.length > 0
        ? Math.round((npsScores.reduce((sum, n) => sum + n, 0) / npsScores.length) * 10) / 10
        : null

    // Most followed ateliers
    const atelierCounts = await db.paaAtelierSession.groupBy({
      by: ['atelierCode', 'atelierName'],
      where: { status: 'COMPLETE' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    // Milestones completion rates
    const milestoneCounts = await db.paaMilestone.groupBy({
      by: ['type'],
      _count: { id: true },
    })
    const milestoneCompletedCounts = await db.paaMilestone.groupBy({
      by: ['type'],
      where: { status: 'COMPLETED' },
      _count: { id: true },
    })

    const milestoneStats = milestoneCounts.map((mc) => {
      const completed = milestoneCompletedCounts.find((cmc) => cmc.type === mc.type)
      return {
        type: mc.type,
        total: mc._count.id,
        completed: completed?._count.id ?? 0,
        completionRate:
          mc._count.id > 0
            ? Math.round(((completed?._count.id ?? 0) / mc._count.id) * 100)
            : 0,
      }
    })

    return success({
      programs: {
        active: totalActive,
        completed: totalCompleted,
        abandoned: totalAbandoned,
        total: totalActive + totalCompleted + totalAbandoned,
      },
      satisfaction: {
        avgRating,
        avgNps,
        totalFeedbacks: allFeedbacks.length,
      },
      topAteliers: atelierCounts.map((ac) => ({
        code: ac.atelierCode,
        name: ac.atelierName,
        completedCount: ac._count.id,
      })),
      milestones: milestoneStats,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
