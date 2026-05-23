import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const organizations = await db.organization.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        plan: true,
        isActive: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return success(organizations, 'Liste des organisations')
  } catch (err) {
    return Errors.internal('Impossible de recuperer les organisations')
  }
}
