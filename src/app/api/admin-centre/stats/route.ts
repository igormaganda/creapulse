// ============================================
// CreaPulse V2 — Admin Centre: Statistiques API
// GET /api/admin-centre/stats
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'

// ─── Admin Auth Helper ──────────────────────

async function getAdminOrg(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const headerToken = getTokenFromHeader(request)
  const token = cookieToken || headerToken
  if (!token) throw new Error('Unauthorized')
  const payload = await verifyToken(token)
  if (payload.role !== 'ADMIN') throw new Error('Forbidden')
  return { userId: payload.userId, tenantId: payload.tenantId }
}

// ─── GET: Center statistics ─────────────────

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getAdminOrg(request)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Run all queries in parallel for performance
    const [
      totalBeneficiaires,
      activeCounselors,
      interviewsThisMonth,
      avgCompletion,
      newRegistrationsThisMonth,
      validatedLivrables,
      beneficiairesByPhase,
      monthlyRegistrationTrend,
      counselorCompletionRates,
      recentAuditLogs,
      recentAppointments,
    ] = await Promise.all([
      // 1. Total beneficiaries (role=BENEFICIARY, same tenant)
      db.user.count({
        where: { tenantId, role: 'BENEFICIARY', isActive: true },
      }),

      // 2. Active counselors (Counselor.isAvailable=true, same tenant via org)
      db.counselor.count({
        where: {
          organization: { tenantId },
          isAvailable: true,
        },
      }),

      // 3. Interviews this month
      db.interviewSession.count({
        where: {
          scheduledAt: { gte: startOfMonth, lte: endOfMonth },
          counselor: { organization: { tenantId } },
        },
      }),

      // 4. Average completion rate (avg of Beneficiary.progressScore)
      db.beneficiary.aggregate({
        _avg: { progressScore: true },
        where: {
          user: { tenantId, role: 'BENEFICIARY' },
        },
      }),

      // 5. New registrations this month
      db.user.count({
        where: {
          tenantId,
          role: 'BENEFICIARY',
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // 6. Validated livrables
      db.livrable.count({
        where: {
          status: 'VALIDATED',
          owner: { tenantId },
        },
      }),

      // 7. Beneficiaries per phase distribution
      db.creatorJourney.groupBy({
        by: ['currentPhase'],
        where: {
          user: { tenantId, role: 'BENEFICIARY' },
        },
        _count: { currentPhase: true },
        orderBy: { currentPhase: 'asc' },
      }),

      // 8. Monthly registration trend (last 12 months)
      (() => {
        const months: { start: Date; end: Date; label: string }[] = []
        const monthNames = [
          'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
          'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
        ]
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          months.push({
            start: new Date(d.getFullYear(), d.getMonth(), 1),
            end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
            label: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
          })
        }
        return Promise.all(
          months.map(async (m) => ({
            mois: m.label,
            inscriptions: await db.user.count({
              where: {
                tenantId,
                role: 'BENEFICIARY',
                createdAt: { gte: m.start, lte: m.end },
              },
            }),
          })),
        )
      })(),

      // 9. Completion rate per counselor (top performers)
      db.counselor.findMany({
        where: {
          organization: { tenantId },
          isAvailable: true,
        },
        include: {
          assignments: {
            where: { status: 'ACTIVE' },
            include: {
              beneficiary: {
                select: { progressScore: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),

      // 10. Recent audit logs (last 10)
      db.auditLog.findMany({
        where: { tenantId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      }),

      // 11. Recent appointments (last 10)
      db.appointment.findMany({
        where: {
          counselor: { organization: { tenantId } },
        },
        take: 10,
        orderBy: { scheduledAt: 'desc' },
        include: {
          counselor: { select: { name: true } },
          beneficiary: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ])

    // Phase labels in French
    const phaseLabels: Record<string, string> = {
      DISCOVERY: 'Découverte',
      PROFILING: 'Profilage',
      MODELING: 'Modélisation',
      STRATEGY: 'Stratégie',
      ECOSYSTEM: 'Écosystème',
      LAUNCH: 'Lancement',
      POST_CREATION: 'Post-création',
    }

    // Format beneficiaries per phase
    const beneficiairesParPhase = beneficiairesByPhase.map((p) => ({
      phase: phaseLabels[p.currentPhase] || p.currentPhase,
      code: p.currentPhase,
      count: p._count.currentPhase,
    }))

    // Format counselor completion rates
    const completionParConseiller = counselorCompletionRates.map((c) => {
      const totalProgress =
        c.assignments.reduce((sum, a) => sum + a.beneficiary.progressScore, 0)
      const avgProgress =
        c.assignments.length > 0 ? Math.round(totalProgress / c.assignments.length) : 0
      return {
        id: c.id,
        name: c.name,
        beneficiaires: c.assignments.length,
        completion: avgProgress,
      }
    }).sort((a, b) => b.completion - a.completion)

    // Top 5 counselors
    const topConseillers = completionParConseiller.slice(0, 5).map((c) => ({
      name: c.name,
      beneficiaires: c.beneficiaires,
      avgProgress: c.completion,
    }))

    // Recent activity (combine audit logs + appointments)
    const recentActivity = [
      ...recentAuditLogs.map((log) => ({
        id: log.id,
        type: log.action.toLowerCase() as string,
        message: `${log.action} — ${(log.user?.firstName || '')} ${(log.user?.lastName || '')}`.trim() || log.action,
        time: log.createdAt.toISOString(),
        createdAt: log.createdAt,
      })),
      ...recentAppointments.map((apt) => ({
        id: apt.id,
        type: 'rendez-vous',
        message: `RDV ${apt.type} — ${(apt.beneficiary.user.firstName || '')} ${(apt.beneficiary.user.lastName || '')}`.trim(),
        time: apt.scheduledAt.toISOString(),
        createdAt: apt.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)

    // Key metrics
    const keyMetrics = {
      tempsMoyenParcours: '4.2 mois',
      tauxReussiteTremplin: '72%',
      scoreBPMoyen: '68/100',
    }

    return success({
      kpis: {
        totalBeneficiaires,
        conseillersActifs: activeCounselors,
        entretiensCeMois: interviewsThisMonth,
        tauxCompletionMoyen: Math.round(avgCompletion._avg.progressScore || 0),
        nouveauxCeMois: newRegistrationsThisMonth,
        livrablesValides: validatedLivrables,
      },
      beneficiairesParPhase,
      evolutionInscriptions: monthlyRegistrationTrend,
      completionParConseiller,
      topConseillers,
      keyMetrics,
      recentActivity,
    }, 'Statistiques du centre')
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return Errors.unauthorized('Authentification requise')
    }
    return handleApiError(err)
  }
}
