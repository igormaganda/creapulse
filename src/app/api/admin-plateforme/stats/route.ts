import { NextRequest } from 'next/server'
import { success, Errors, getTokenFromHeader, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

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

    // Exécuter toutes les requêtes en parallèle pour la performance
    const [
      usersByRole,
      orgsByType,
      activeModulesCount,
      totalModulesCount,
      journeysByPhase,
      totalUsers,
      totalOrgs,
      totalTenants,
      totalAuditLogs,
      totalNotifications,
      totalDiscussions,
      totalReplies,
      totalModuleResults,
      totalAppointments,
    ] = await Promise.all([
      // Utilisateurs par rôle
      db.user.groupBy({
        by: ['role'],
        _count: { role: true },
        where: { isActive: true },
      }),
      // Organisations par type
      db.organization.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      // Modules actifs
      db.appModule.count({ where: { isActive: true } }),
      // Total modules
      db.appModule.count(),
      // Parcours par phase
      db.creatorJourney.groupBy({
        by: ['currentPhase'],
        _count: { currentPhase: true },
      }),
      // Totaux globaux
      db.user.count(),
      db.organization.count(),
      db.tenant.count(),
      db.auditLog.count(),
      db.notification.count(),
      db.discussion.count(),
      db.reply.count(),
      db.moduleResult.count(),
      db.appointment.count(),
    ])

    // Croissance mensuelle — 12 derniers mois
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    twelveMonthsAgo.setDate(1)
    twelveMonthsAgo.setHours(0, 0, 0, 0)

    const monthlyGrowthRaw = await db.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: twelveMonthsAgo },
      },
      _count: { id: true },
    })

    // Regrouper par mois (YYYY-MM)
    const monthlyGrowthMap: Record<string, number> = {}
    for (const item of monthlyGrowthRaw) {
      const key = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}`
      monthlyGrowthMap[key] = (monthlyGrowthMap[key] || 0) + item._count.id
    }

    // Remplir les mois manquants
    const monthlyGrowth: { month: string; count: number }[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
      ]
      monthlyGrowth.push({
        month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        count: monthlyGrowthMap[key] || 0,
      })
    }

    // Top organisations par nombre de bénéficiaires
    const topOrganizations = await db.organization.findMany({
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
      },
      orderBy: {
        beneficiaries: { _count: 'desc' },
      },
      take: 10,
    })

    // Formater les résultats
    const roleMap: Record<string, number> = {}
    for (const item of usersByRole) {
      roleMap[item.role] = item._count.role
    }

    const orgTypeMap: Record<string, number> = {}
    for (const item of orgsByType) {
      orgTypeMap[item.type] = item._count.type
    }

    const journeyPhaseMap: Record<string, number> = {}
    for (const item of journeysByPhase) {
      journeyPhaseMap[item.currentPhase] = item._count.currentPhase
    }

    // Santé du système — totaux par entité
    const systemHealth = {
      utilisateurs: totalUsers,
      organisations: totalOrgs,
      tenants: totalTenants,
      modules: totalModulesCount,
      parcours: Object.values(journeyPhaseMap).reduce((a, b) => a + b, 0),
      journauxAudit: totalAuditLogs,
      notifications: totalNotifications,
      discussions: totalDiscussions,
      reponses: totalReplies,
      resultatsModules: totalModuleResults,
      rendezVous: totalAppointments,
    }

    const stats = {
      // Synthèse
      resume: {
        totalUtilisateurs: totalUsers,
        totalOrganisations: totalOrgs,
        totalTenants,
        modulesActifs: activeModulesCount,
        modulesTotal: totalModulesCount,
      },
      // Utilisateurs par rôle
      utilisateursParRole: {
        ADMIN: roleMap['ADMIN'] || 0,
        COUNSELOR: roleMap['COUNSELOR'] || 0,
        BENEFICIARY: roleMap['BENEFICIARY'] || 0,
      },
      // Organisations par type
      organisationsParType: {
        FORMATION_CENTER: orgTypeMap['FORMATION_CENTER'] || 0,
        GIDEF_AGENCY: orgTypeMap['GIDEF_AGENCY'] || 0,
        INCUBATOR: orgTypeMap['INCUBATOR'] || 0,
        PEPITE: orgTypeMap['PEPITE'] || 0,
        CO_WORKING: orgTypeMap['CO_WORKING'] || 0,
      },
      // Parcours par phase
      parcoursParPhase: {
        DISCOVERY: journeyPhaseMap['DISCOVERY'] || 0,
        PROFILING: journeyPhaseMap['PROFILING'] || 0,
        MODELING: journeyPhaseMap['MODELING'] || 0,
        STRATEGY: journeyPhaseMap['STRATEGY'] || 0,
        ECOSYSTEM: journeyPhaseMap['ECOSYSTEM'] || 0,
        LAUNCH: journeyPhaseMap['LAUNCH'] || 0,
        POST_CREATION: journeyPhaseMap['POST_CREATION'] || 0,
      },
      // Croissance mensuelle
      croissanceMensuelle: monthlyGrowth,
      // Top organisations
      topOrganisations: topOrganizations.map((org) => ({
        id: org.id,
        nom: org.name,
        type: org.type,
        ville: org.city,
        conseillersActifs: org._count.counselors,
        beneficiaires: org._count.beneficiaries,
      })),
      // Santé du système
      santeSysteme: systemHealth,
    }

    return success(stats, 'Statistiques globales de la plateforme')
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return err.message === 'Unauthorized'
        ? Errors.unauthorized('Authentification requise')
        : Errors.forbidden('Accès réservé aux administrateurs')
    }
    return handleApiError(err)
  }
}
