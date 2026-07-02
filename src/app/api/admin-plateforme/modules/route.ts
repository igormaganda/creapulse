import { NextRequest } from 'next/server'
import { success, Errors, getTokenFromHeader, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { AuditAction } from '@prisma/client'

// ─── Admin guard ────────────────────────────

async function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request)
  if (!token) throw new Error('Unauthorized')
  const payload = await verifyToken(token)
  if (payload.role !== 'ADMIN') throw new Error('Forbidden')
  return { userId: payload.userId, tenantId: payload.tenantId }
}

// ─── Zod schemas ────────────────────────────

const toggleModuleSchema = z.object({
  moduleId: z.string().min(1, 'moduleId requis'),
  isActive: z.boolean(),
})

// ─── GET — Lister les modules ──────────────

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || ''
    const category = searchParams.get('category') || ''
    const activeOnly = searchParams.get('active') === 'true'

    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    if (category) where.category = category
    if (activeOnly) where.isActive = true

    const modules = await db.appModule.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        code: true,
        name: true,
        description: true,
        category: true,
        phase: true,
        isActive: true,
        sortOrder: true,
        config: true,
        createdAt: true,
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })

    // Statistiques d'utilisation par module (ModuleResult count)
    const moduleCodes = modules.map((m) => m.code)
    const usageStats = moduleCodes.length > 0
      ? await db.moduleResult.groupBy({
          where: { moduleCode: { in: moduleCodes } },
          by: ['moduleCode'],
          _count: { id: true },
          _avg: { score: true },
        })
      : []

    const usageMap: Record<string, { completions: number; scoreMoyen: number }> = {}
    for (const stat of usageStats) {
      usageMap[stat.moduleCode] = {
        completions: stat._count.id,
        scoreMoyen: Math.round(stat._avg.score || 0),
      }
    }

    const formattedModules = modules.map((mod) => ({
      id: mod.id,
      tenantId: mod.tenantId,
      code: mod.code,
      nom: mod.name,
      description: mod.description,
      categorie: mod.category,
      phase: mod.phase,
      actif: mod.isActive,
      ordre: mod.sortOrder,
      configuration: mod.config,
      dateCreation: mod.createdAt,
      tenant: mod.tenant ? { id: mod.tenant.id, nom: mod.tenant.name } : null,
      utilisation: usageMap[mod.code] || { completions: 0, scoreMoyen: 0 },
    }))

    return success(formattedModules, 'Liste des modules')
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return err.message === 'Unauthorized'
        ? Errors.unauthorized('Authentification requise')
        : Errors.forbidden('Accès réservé aux administrateurs')
    }
    return handleApiError(err)
  }
}

// ─── PUT — Activer / désactiver un module ──

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const data = toggleModuleSchema.parse(body)

    // Vérifier que le module existe
    const existingModule = await db.appModule.findUnique({
      where: { id: data.moduleId },
      include: { tenant: { select: { id: true } } },
    })
    if (!existingModule) {
      return Errors.notFound('Module')
    }

    // Verify tenant ownership
    if (existingModule.tenantId !== admin.tenantId) {
      return Errors.forbidden('Vous ne pouvez pas modifier un module d\'une autre organisation')
    }

    const updatedModule = await db.$transaction(async (tx) => {
      const mod = await tx.appModule.update({
        where: { id: data.moduleId },
        data: { isActive: data.isActive },
      })

      await tx.auditLog.create({
        data: {
          tenantId: existingModule.tenantId,
          userId: admin.userId,
          action: AuditAction.MODULE_TOGGLE,
          entityType: 'AppModule',
          entityId: data.moduleId,
          details: {
            moduleCode: existingModule.code,
            moduleName: existingModule.name,
            isActive: data.isActive,
          },
        },
      })

      return mod
    })

    return success(
      {
        id: updatedModule.id,
        code: updatedModule.code,
        nom: updatedModule.name,
        actif: updatedModule.isActive,
      },
      `Module ${data.isActive ? 'activé' : 'désactivé'} avec succès`,
    )
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return err.message === 'Unauthorized'
        ? Errors.unauthorized('Authentification requise')
        : Errors.forbidden('Accès réservé aux administrateurs')
    }
    return handleApiError(err)
  }
}
