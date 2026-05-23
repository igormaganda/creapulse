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

// ─── Zod schema pour la mise à jour ─────────

const updateConfigSchema = z.object({
  tenantId: z.string().min(1, 'tenantId requis'),
  settings: z.record(z.unknown()).refine(
    (val) => {
      try {
        JSON.parse(JSON.stringify(val))
        return true
      } catch {
        return false
      }
    },
    { message: 'Les paramètres doivent être un objet JSON valide' },
  ),
  primaryColor: z.string().optional(),
  isActive: z.boolean().optional(),
})

// ─── GET — Récupérer la configuration ──────

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || admin.tenantId

    // Si pas de tenantId spécifié, retourner tous les tenants avec leur config
    if (!searchParams.get('tenantId')) {
      const tenants = await db.tenant.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          primaryColor: true,
          isActive: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      return success(tenants, 'Configurations de tous les tenants')
    }

    // Récupérer un tenant spécifique
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        primaryColor: true,
        isActive: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        organizations: {
          select: { id: true, name: true, type: true, city: true },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            users: { where: { isActive: true } },
            organizations: true,
            modules: { where: { isActive: true } },
          },
        },
      },
    })

    if (!tenant) {
      return Errors.notFound('Tenant')
    }

    return success(tenant, 'Configuration du tenant')
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return err.message === 'Unauthorized'
        ? Errors.unauthorized('Authentification requise')
        : Errors.forbidden('Accès réservé aux administrateurs')
    }
    return handleApiError(err)
  }
}

// ─── PUT — Mettre à jour la configuration ──

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const data = updateConfigSchema.parse(body)

    // Vérifier que le tenant existe
    const existingTenant = await db.tenant.findUnique({
      where: { id: data.tenantId },
    })
    if (!existingTenant) {
      return Errors.notFound('Tenant')
    }

    const updatedTenant = await db.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        settings: data.settings,
      }
      if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor
      if (data.isActive !== undefined) updateData.isActive = data.isActive

      const tenant = await tx.tenant.update({
        where: { id: data.tenantId },
        data: updateData,
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          primaryColor: true,
          isActive: true,
          settings: true,
          updatedAt: true,
        },
      })

      await tx.auditLog.create({
        data: {
          tenantId: data.tenantId,
          userId: admin.userId,
          action: AuditAction.SETTINGS_UPDATE,
          entityType: 'Tenant',
          entityId: data.tenantId,
          details: {
            updatedFields: Object.keys(updateData),
            settings: data.settings,
          },
        },
      })

      return tenant
    })

    return success(updatedTenant, 'Configuration mise à jour avec succès')
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return err.message === 'Unauthorized'
        ? Errors.unauthorized('Authentification requise')
        : Errors.forbidden('Accès réservé aux administrateurs')
    }
    return handleApiError(err)
  }
}
