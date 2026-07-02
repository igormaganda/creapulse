import { NextRequest } from 'next/server'
import { success, handleApiError } from '@/lib/api-response'
import { withAdminAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'

// ─── Limites de plans ──────────────────────

const PLAN_LIMITS: Record<string, { maxUsers: number; maxOrganizations: number; maxModules: number }> = {
  STARTER: { maxUsers: 50, maxOrganizations: 2, maxModules: 10 },
  PROFESSIONAL: { maxUsers: 500, maxOrganizations: 10, maxModules: 30 },
  ENTERPRISE: { maxUsers: 9999, maxOrganizations: 999, maxModules: 999 },
}

export async function GET(request: NextRequest) {
  try {
    const auth = await withAdminAuth(request)
    if (!auth) return auth

    const tenants = await db.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        isActive: true,
        primaryColor: true,
        createdAt: true,
        _count: {
          select: {
            users: { where: { isActive: true } },
            organizations: true,
            modules: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculer les métriques d'utilisation par tenant
    const tenantBilling = tenants.map((tenant) => {
      const limits = PLAN_LIMITS[tenant.plan] || PLAN_LIMITS.STARTER
      const userCount = tenant._count.users
      const orgCount = tenant._count.organizations
      const moduleCount = tenant._count.modules

      const userUsagePercent = limits.maxUsers > 0 ? Math.round((userCount / limits.maxUsers) * 100) : 0
      const orgUsagePercent = limits.maxOrganizations > 0 ? Math.round((orgCount / limits.maxOrganizations) * 100) : 0
      const moduleUsagePercent = limits.maxModules > 0 ? Math.round((moduleCount / limits.maxModules) * 100) : 0

      return {
        id: tenant.id,
        nom: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        actif: tenant.isActive,
        dateCreation: tenant.createdAt,
        couleurPrincipale: tenant.primaryColor,
        utilisation: {
          utilisateurs: {
            actuels: userCount,
            limite: limits.maxUsers,
            pourcentage: userUsagePercent,
            depasse: userCount >= limits.maxUsers,
          },
          organisations: {
            actuelles: orgCount,
            limite: limits.maxOrganizations,
            pourcentage: orgUsagePercent,
            depasse: orgCount >= limits.maxOrganizations,
          },
          modules: {
            actifs: moduleCount,
            limite: limits.maxModules,
            pourcentage: moduleUsagePercent,
            depasse: moduleCount >= limits.maxModules,
          },
        },
        recommandation: !tenant.actif
          ? 'Tenant inactif — envisager la résiliation'
          : userUsagePercent >= 80 && tenant.plan !== 'ENTERPRISE'
            ? 'Utilisation élevée — recommander la mise à niveau'
            : tenant.plan === 'STARTER' && userCount > 20
              ? 'Croissance soutenue — envisager le plan Professionnel'
              : 'Utilisation normale',
      }
    })

    // Synthèse globale
    const planDistribution = {
      STARTER: tenantBilling.filter((t) => t.plan === 'STARTER').length,
      PROFESSIONAL: tenantBilling.filter((t) => t.plan === 'PROFESSIONAL').length,
      ENTERPRISE: tenantBilling.filter((t) => t.plan === 'ENTERPRISE').length,
    }

    const totalActiveTenants = tenantBilling.filter((t) => t.actif).length
    const tenantsAtCapacity = tenantBilling.filter(
      (t) => t.utilisation.utilisateurs.pourcentage >= 80 || t.utilisation.organisations.pourcentage >= 80,
    ).length
    const inactiveTenants = tenantBilling.filter((t) => !t.actif).length

    return success(
      {
        tenants: tenantBilling,
        synthese: {
          totalTenants: tenants.length,
          tenantsActifs: totalActiveTenants,
          tenantsInactifs: inactiveTenants,
          tenantsACapacite: tenantsAtCapacity,
          distributionPlans: planDistribution,
        },
      },
      'Données de facturation de la plateforme',
    )
  } catch (err) {
    return handleApiError(err)
  }
}
