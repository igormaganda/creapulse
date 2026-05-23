import { NextRequest } from 'next/server'
import { success, error, Errors } from '@/lib/api-response'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const modules = await db.appModule.findMany({
      orderBy: { order: 'asc' },
    })

    return success(modules, 'Liste des modules')
  } catch (err) {
    return Errors.internal('Impossible de recuperer les modules')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { moduleId, isActive } = body

    if (!moduleId || typeof isActive !== 'boolean') {
      return Errors.validation({ moduleId, isActive }, 'moduleId et isActive requis')
    }

    const updated = await db.appModule.update({
      where: { id: moduleId },
      data: { isActive },
    })

    return success(updated, 'Module mis a jour')
  } catch (err) {
    return Errors.internal('Impossible de mettre a jour le module')
  }
}
