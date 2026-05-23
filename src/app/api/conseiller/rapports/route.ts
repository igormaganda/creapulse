// ============================================
// CreaPulse V2 — Conseiller Rapports
// GET /api/conseiller/rapports — Statistics & reports
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { getCounselor, AuthRequiredError, AuthForbiddenError, AuthNotFoundError } from '../_lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { counselor } = await getCounselor(request)

    // Parse query params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'mois' // mois | trimestre | annee

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'trimestre':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case 'annee':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        break
      default: // mois
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Get assigned beneficiary IDs
    const assignments = await db.counselorAssignment.findMany({
      where: {
        counselorId: counselor.id,
        status: 'ACTIVE',
      },
      select: { beneficiaryId: true },
    })

    const beneficiaryIds = assignments.map((a) => a.beneficiaryId)

    // ─── KPIs ───────────────────────────────

    const [entretiensRealises, livrablesValides] = await Promise.all([
      // Completed appointments in period
      db.appointment.count({
        where: {
          counselorId: counselor.id,
          status: 'COMPLETED',
          completedAt: { gte: startDate, lte: now },
        },
      }),
      // Validated livrables in period
      db.livrable.count({
        where: {
          counselorId: counselor.id,
          status: 'VALIDATED',
          createdAt: { gte: startDate, lte: now },
        },
      }),
    ])

    let progressionMoyenne = 0
    if (beneficiaryIds.length > 0) {
      const avgResult = await db.beneficiary.aggregate({
        where: { id: { in: beneficiaryIds } },
        _avg: { progressScore: true },
      })
      progressionMoyenne = Math.round(avgResult._avg.progressScore ?? 0)
    }

    // ─── Beneficiaires par phase ─────────────

    const phaseLabels: Record<string, string> = {
      DISCOVERY: 'Découverte',
      PROFILING: 'Profilage',
      MODELING: 'Modélisation',
      STRATEGY: 'Stratégie',
      ECOSYSTEM: 'Écosystème',
      LAUNCH: 'Lancement',
      POST_CREATION: 'Post-création',
    }

    const phaseColors: Record<string, string> = {
      DISCOVERY: '#F59E0B',
      PROFILING: '#00838F',
      MODELING: '#00838F',
      STRATEGY: '#FF6B35',
      ECOSYSTEM: '#059669',
      LAUNCH: '#059669',
      POST_CREATION: '#7C3AED',
    }

    let repartitionStatut: { name: string; value: number; color: string }[] = []
    if (beneficiaryIds.length > 0) {
      const journeysByPhase = await db.creatorJourney.groupBy({
        by: ['currentPhase'],
        where: { userId: { in: beneficiaryIds } },
        _count: { currentPhase: true },
      })

      repartitionStatut = journeysByPhase.map((p) => ({
        name: phaseLabels[p.currentPhase] || p.currentPhase,
        value: p._count.currentPhase,
        color: phaseColors[p.currentPhase] || '#94A3B8',
      }))
    }

    // ─── Entretiens par type (this period) ───

    const entretiensParType = await db.appointment.groupBy({
      by: ['type'],
      where: {
        counselorId: counselor.id,
        createdAt: { gte: startDate, lte: now },
      },
      _count: { type: true },
    })

    const typeLabels: Record<string, string> = {
      BILAN: 'Bilan',
      FOLLOW_UP: 'Suivi',
      WORKSHOP: 'Atelier',
      OTHER: 'Autre',
    }

    const entretiensParTypeFormatted = entretiensParType.map((t) => ({
      type: typeLabels[t.type] || t.type,
      count: t._count.type,
    }))

    // ─── Livrables par statut ────────────────

    const livrablesParStatut = await db.livrable.groupBy({
      by: ['status'],
      where: {
        counselorId: counselor.id,
      },
      _count: { status: true },
    })

    const livrableStatusLabels: Record<string, string> = {
      DRAFT: 'Brouillon',
      GENERATING: 'En génération',
      READY: 'Prêt',
      VALIDATED: 'Validé',
      EXPORTED: 'Exporté',
    }

    const livrablesParStatutFormatted = livrablesParStatut.map((l) => ({
      statut: livrableStatusLabels[l.status] || l.status,
      count: l._count.status,
    }))

    // ─── Monthly activity trend (last 6 months) ──

    const trendMonths: { month: string; entretiens: number; inscriptions: number }[] = []
    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

      const [monthEntretiens, monthInscriptions] = await Promise.all([
        db.appointment.count({
          where: {
            counselorId: counselor.id,
            status: 'COMPLETED',
            completedAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        db.counselorAssignment.count({
          where: {
            counselorId: counselor.id,
            assignedAt: { gte: monthStart, lte: monthEnd },
          },
        }),
      ])

      trendMonths.push({
        month: `${moisLabels[monthStart.getMonth()]} ${monthStart.getFullYear().toString().slice(2)}`,
        entretiens: monthEntretiens,
        inscriptions: monthInscriptions,
      })
    }

    // ─── Top beneficiaires ──────────────────

    let topBeneficiaires: { id: string; name: string; initials: string; progress: number; lastActivity: string; phase: string }[] = []
    if (beneficiaryIds.length > 0) {
      const topBeneficiariesData = await db.beneficiary.findMany({
        where: { id: { in: beneficiaryIds } },
        orderBy: { progressScore: 'desc' },
        take: 8,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              creatorJourney: {
                select: { currentPhase: true },
              },
            },
          },
        },
      })

      topBeneficiaires = topBeneficiariesData.map((b) => {
        const journey = b.user.creatorJourney
        return {
          id: b.id,
          name: `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim(),
          initials: `${(b.user.firstName || '')[0] || ''}${(b.user.lastName || '')[0] || ''}`.toUpperCase(),
          progress: b.progressScore,
          lastActivity: b.updatedAt.toISOString(),
          phase: journey ? (phaseLabels[journey.currentPhase] || journey.currentPhase) : '',
        }
      })
    }

    const data = {
      period,
      kpis: {
        entretiensRealises,
        beneficiairesActifs: beneficiaryIds.length,
        livrablesValides,
        progressionMoyenne,
      },
      repartitionStatut,
      entretiensParType: entretiensParTypeFormatted,
      livrablesParStatut: livrablesParStatutFormatted,
      trendMois: trendMonths,
      topBeneficiaires,
    }

    return success(data, `Rapport ${period}`)
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}
