import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [
      totalUsers,
      totalOrgs,
      totalBeneficiaries,
      totalCounselors,
      activeOrgs,
      activeModules,
      recentCreations,
    ] = await Promise.all([
      db.user.count(),
      db.tenant.count(),
      db.beneficiary.count(),
      db.counselor.count(),
      db.tenant.count({ where: { isActive: true } }),
      db.appModule.count({ where: { isActive: true } }),
      db.creatorJourney.count({
        where: { currentPhase: { in: ['CREATED', 'REGISTERED'] } },
      }),
    ])

    const stats = {
      totalUsers,
      totalOrgs,
      totalBeneficiaries,
      totalCounselors,
      activeOrgs,
      activeModules,
      recentCreations,
      userRoles: {
        admins: await db.user.count({ where: { role: 'ADMIN' } }),
        counselors: await db.user.count({ where: { role: 'COUNSELOR' } }),
        beneficiaries: await db.user.count({ where: { role: 'BENEFICIARY' } }),
      },
    }

    return success(stats, 'Statistiques globales de la plateforme')
  } catch (err) {
    return Errors.internal('Impossible de recuperer les statistiques')
  }
}
