import { NextRequest } from 'next/server'
import { success, Errors, getTokenFromHeader, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── Admin guard ────────────────────────────

async function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request)
  if (!token) throw new Error('Unauthorized')
  const payload = await verifyToken(token)
  if (payload.role !== 'ADMIN') throw new Error('Forbidden')
  return { userId: payload.userId, tenantId: payload.tenantId }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    // Exécuter toutes les requêtes en parallèle
    const [
      // DAU — 30 derniers jours (utilisateurs ayant un lastLoginAt récent)
      dailyActiveUsers,
      // Utilisation des modules
      featureUsage,
      // Engagement contenu — discussions
      discussionStats,
      // Engagement contenu — réponses
      replyStats,
      // Tunnel de conversion — parcours par phase
      funnelData,
      // Top organisations par performance
      topOrgs,
    ] = await Promise.all([
      // DAU : utilisateurs connectés dans les 30 derniers jours
      db.user.groupBy({
        by: ['lastLoginAt'],
        where: {
          lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          isActive: true,
        },
        _count: { id: true },
      }),

      // Utilisation des modules — compteur par moduleCode
      db.moduleResult.groupBy({
        by: ['moduleCode'],
        _count: { id: true },
        _avg: { score: true },
      }),

      // Discussions créées par jour (7 derniers jours)
      db.discussion.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { id: true },
      }),

      // Réponses par jour (7 derniers jours)
      db.reply.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { id: true },
      }),

      // Tunnel de conversion — parcours par phase
      db.creatorJourney.groupBy({
        by: ['currentPhase'],
        _count: { currentPhase: true },
      }),

      // Top organisations par performance bénéficiaires
      db.organization.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          _count: {
            select: {
              counselors: { where: { isAvailable: true } },
              beneficiaries: true,
            },
          },
          beneficiaries: {
            select: { progressScore: true },
            take: 100,
          },
        },
        orderBy: {
          beneficiaries: { _count: 'desc' },
        },
        take: 10,
      }),
    ])

    // Formater DAU par jour (30 derniers jours)
    const dauMap: Record<string, number> = {}
    for (const item of dailyActiveUsers) {
      if (item.lastLoginAt) {
        const key = item.lastLoginAt.toISOString().split('T')[0]
        dauMap[key] = (dauMap[key] || 0) + item._count.id
      }
    }
    const dauChart: { date: string; utilisateurs: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      dauChart.push({
        date: key,
        utilisateurs: dauMap[key] || 0,
      })
    }

    // Formater l'utilisation des modules
    const moduleUsage = featureUsage.map((item) => ({
      module: item.moduleCode,
      completions: item._count.id,
      scoreMoyen: Math.round(item._avg.score || 0),
    })).sort((a, b) => b.completions - a.completions)

    // Formater les discussions par jour
    const discMap: Record<string, number> = {}
    for (const item of discussionStats) {
      const key = item.createdAt.toISOString().split('T')[0]
      discMap[key] = (discMap[key] || 0) + item._count.id
    }

    // Formater les réponses par jour
    const replyMap: Record<string, number> = {}
    for (const item of replyStats) {
      const key = item.createdAt.toISOString().split('T')[0]
      replyMap[key] = (replyMap[key] || 0) + item._count.id
    }

    const engagementChart: { date: string; discussions: number; reponses: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      engagementChart.push({
        date: key,
        discussions: discMap[key] || 0,
        reponses: replyMap[key] || 0,
      })
    }

    // Tunnel de conversion — phases ordonnées
    const phaseOrder = ['DISCOVERY', 'PROFILING', 'MODELING', 'STRATEGY', 'ECOSYSTEM', 'LAUNCH', 'POST_CREATION']
    const funnel: { phase: string; label: string; count: number }[] = phaseOrder.map((phase) => {
      const found = funnelData.find((f) => f.currentPhase === phase)
      const phaseLabels: Record<string, string> = {
        DISCOVERY: 'Découverte',
        PROFILING: 'Profilage',
        MODELING: 'Modélisation',
        STRATEGY: 'Stratégie',
        ECOSYSTEM: 'Écosystème',
        LAUNCH: 'Lancement',
        POST_CREATION: 'Post-création',
      }
      return {
        phase,
        label: phaseLabels[phase],
        count: found ? found._count.currentPhase : 0,
      }
    })

    // Top organisations par performance
    const topOrganizations = topOrgs.map((org) => {
      const avgScore = org.beneficiaries.length > 0
        ? Math.round(org.beneficiaries.reduce((sum, b) => sum + b.progressScore, 0) / org.beneficiaries.length)
        : 0
      return {
        id: org.id,
        nom: org.name,
        type: org.type,
        ville: org.city,
        conseillersActifs: org._count.counselors,
        beneficiaires: org._count.beneficiaries,
        scoreMoyen: avgScore,
      }
    }).sort((a, b) => b.scoreMoyen - a.scoreMoyen)

    const analytics = {
      utilisateursActifsJournaliers: {
        dernier30Jours: dauChart,
        totalDistinct: new Set(dauChart.map((d) => d.date)).size > 0
          ? dauChart.reduce((sum, d) => sum + d.utilisateurs, 0)
          : 0,
      },
      utilisationModules: moduleUsage,
      engagementContenu: {
        dernier7Jours: engagementChart,
        totalDiscussions: discussionStats.reduce((sum, d) => sum + d._count.id, 0),
        totalReponses: replyStats.reduce((sum, r) => sum + r._count.id, 0),
      },
      tunnelConversion: {
        phases: funnel,
        totalParcours: funnel.reduce((sum, f) => sum + f.count, 0),
      },
      topOrganisations: topOrganizations,
    }

    return success(analytics, 'Analytiques de la plateforme')
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return err.message === 'Unauthorized'
        ? Errors.unauthorized('Authentification requise')
        : Errors.forbidden('Accès réservé aux administrateurs')
    }
    return handleApiError(err)
  }
}
