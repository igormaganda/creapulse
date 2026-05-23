// ============================================
// CreaPulse V2 — Conseiller Dashboard Stats
// GET /api/conseiller/stats
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { getCounselor, AuthRequiredError, AuthForbiddenError, AuthNotFoundError } from '../_lib/auth'

export async function GET(_request: NextRequest) {
  try {
    const { counselor } = await getCounselor(_request)

    // 1. Count active assigned beneficiaries
    const beneficiairesActifs = await db.counselorAssignment.count({
      where: {
        counselorId: counselor.id,
        status: 'ACTIVE',
      },
    })

    // 2. Count upcoming appointments this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const entretiensCeMois = await db.appointment.count({
      where: {
        counselorId: counselor.id,
        scheduledAt: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    const entretiensPrevus = await db.appointment.count({
      where: {
        counselorId: counselor.id,
        scheduledAt: { gte: now },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
    })

    // 3. Average beneficiary progress
    const assignedBeneficiaries = await db.counselorAssignment.findMany({
      where: {
        counselorId: counselor.id,
        status: 'ACTIVE',
      },
      select: { beneficiaryId: true },
    })

    const beneficiaryIds = assignedBeneficiaries.map((a) => a.beneficiaryId)

    let progressionMoyenne = 0
    if (beneficiaryIds.length > 0) {
      const avgResult = await db.beneficiary.aggregate({
        where: { id: { in: beneficiaryIds } },
        _avg: { progressScore: true },
      })
      progressionMoyenne = Math.round(avgResult._avg.progressScore ?? 0)
    }

    // 4. Count completed modules across assigned beneficiaries
    const completedModules = await db.moduleResult.count({
      where: {
        userId: { in: beneficiaryIds },
        completedAt: { not: null },
      },
    })

    // 5. Livrables en attente (status = READY, waiting for validation)
    const livrablesEnAttente = await db.livrable.count({
      where: {
        counselorId: counselor.id,
        status: 'READY',
      },
    })

    // 6. New beneficiaries this month
    const nouveauxCeMois = await db.counselorAssignment.count({
      where: {
        counselorId: counselor.id,
        assignedAt: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    // 7. Repartition type entretiens
    const entretiensParType = await db.appointment.groupBy({
      by: ['type'],
      where: {
        counselorId: counselor.id,
        scheduledAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _count: { type: true },
    })

    const typeColors: Record<string, string> = {
      BILAN: '#00838F',
      FOLLOW_UP: '#FFB74D',
      WORKSHOP: '#FF6B35',
      OTHER: '#94A3B8',
    }

    const repartitionTypeEntretiens = entretiensParType.map((t) => ({
      type: t.type === 'BILAN' ? 'Bilan' : t.type === 'FOLLOW_UP' ? 'Suivi' : t.type === 'WORKSHOP' ? 'Atelier' : 'Autre',
      count: t._count.type,
      color: typeColors[t.type] || '#94A3B8',
    }))

    // 8. Repartition statut entretiens
    const entretiensParStatut = await db.appointment.groupBy({
      by: ['status'],
      where: {
        counselorId: counselor.id,
        scheduledAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _count: { status: true },
    })

    const statusLabels: Record<string, string> = {
      SCHEDULED: 'Planifié',
      CONFIRMED: 'Confirmé',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
    }

    const repartitionStatut = entretiensParStatut.map((s) => ({
      statut: statusLabels[s.status] || s.status,
      count: s._count.status,
    }))

    // 9. Beneficiaires par phase
    let beneficiairesParPhase: { phase: string; count: number }[] = []
    if (beneficiaryIds.length > 0) {
      const journeysByPhase = await db.creatorJourney.groupBy({
        by: ['currentPhase'],
        where: { userId: { in: beneficiaryIds } },
        _count: { currentPhase: true },
      })

      const phaseLabels: Record<string, string> = {
        DISCOVERY: 'Découverte',
        PROFILING: 'Profilage',
        MODELING: 'Modélisation',
        STRATEGY: 'Stratégie',
        ECOSYSTEM: 'Écosystème',
        LAUNCH: 'Lancement',
        POST_CREATION: 'Post-création',
      }

      beneficiairesParPhase = journeysByPhase.map((p) => ({
        phase: phaseLabels[p.currentPhase] || p.currentPhase,
        count: p._count.currentPhase,
      }))
    }

    // 10. Recent activity (last 5 completed appointments/interviews)
    const recentAppointments = await db.appointment.findMany({
      where: {
        counselorId: counselor.id,
        status: 'COMPLETED',
      },
      include: {
        beneficiary: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    const recentInterviews = await db.interviewSession.findMany({
      where: {
        counselorId: counselor.id,
        status: 'completed',
      },
      include: {
        beneficiary: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    // Merge and sort recent activity by date
    const activiteRecente = [
      ...recentAppointments.map((a) => ({
        id: a.id,
        type: 'entretien' as const,
        message: `Rendez-vous ${a.type === 'BILAN' ? 'de bilan' : a.type === 'WORKSHOP' ? 'atelier' : 'de suivi'} terminé avec ${a.beneficiary.user.firstName || ''} ${a.beneficiary.user.lastName || ''}`,
        time: formatTimeAgo(a.updatedAt),
        date: a.updatedAt,
      })),
      ...recentInterviews.map((i) => ({
        id: i.id,
        type: 'entretien' as const,
        message: `Entretien de ${i.type} terminé avec ${i.beneficiary.user.firstName || ''} ${i.beneficiary.user.lastName || ''}`,
        time: formatTimeAgo(i.updatedAt),
        date: i.updatedAt,
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .map(({ date: _d, ...rest }) => rest)

    // 11. Upcoming appointments (next 4)
    const prochainsRdv = await db.appointment.findMany({
      where: {
        counselorId: counselor.id,
        scheduledAt: { gte: now },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: {
        beneficiary: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 4,
    })

    const joursSemaine = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

    const prochainsRdvFormatted = prochainsRdv.map((rdv) => ({
      id: rdv.id,
      beneficiary: `${rdv.beneficiary.user.firstName || ''} ${rdv.beneficiary.user.lastName || ''}`.trim(),
      type: rdv.type === 'BILAN' ? 'Bilan' : rdv.type === 'WORKSHOP' ? 'Atelier' : 'Suivi',
      date: `${joursSemaine[rdv.scheduledAt.getDay()]} ${rdv.scheduledAt.getDate()} ${mois[rdv.scheduledAt.getMonth()]}`,
      time: rdv.scheduledAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }))

    const stats = {
      kpis: {
        beneficiairesActifs,
        entretiensCeMois,
        entretiensPrevus,
        livrablesEnAttente,
        progressionMoyenne,
        nouveauxCeMois,
      },
      repartitionTypeEntretiens,
      repartitionStatut,
      beneficiairesParPhase,
      activiteRecente,
      prochainsRdv: prochainsRdvFormatted,
    }

    return success(stats, 'Statistiques du conseiller')
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}

// ─── Helpers ──────────────────────────────────

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 60) return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`
  if (diffH < 24) return `Il y a ${diffH} heure${diffH > 1 ? 's' : ''}`
  if (diffD < 7) return `Il y a ${diffD} jour${diffD > 1 ? 's' : ''}`
  return `Il y a ${Math.floor(diffD / 7)} semaine${Math.floor(diffD / 7) > 1 ? 's' : ''}`
}
