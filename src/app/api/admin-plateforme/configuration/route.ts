import { NextRequest } from 'next/server'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth, withAdminAuth } from '@/lib/api-auth'
import type { AuthResult } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { AuditAction } from '@prisma/client'

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

// ─── Zod schema for PAA config (PATCH) ─────

const paaModulesSchema = z.record(z.boolean())
const paaSettingsSchema = z.object({
  programDurationDays: z.number().int().min(7).max(365).optional(),
  minAteliers: z.number().int().min(1).max(20).optional(),
  followUpDays: z.number().int().min(7).max(365).optional(),
  npsEnabled: z.boolean().optional(),
})
const patchPaaConfigSchema = z.object({
  tenantId: z.string().min(1, 'tenantId requis'),
  paa: z.object({
    enabled: z.boolean().optional(),
    modules: paaModulesSchema.optional(),
    settings: paaSettingsSchema.optional(),
  }),
})

// ─── Default PAA config ───────────────────

const DEFAULT_PAA_CONFIG = {
  enabled: false,
  modules: {
    'parcours-paa': true,
    'swot': true,
    'objectifs-smart': true,
    'gestion-temps': true,
    'gestion-crise': true,
    'cloture-rebond': true,
  },
  settings: {
    programDurationDays: 60,
    minAteliers: 3,
    followUpDays: 90,
    npsEnabled: true,
  },
}

// ─── GET — Récupérer la configuration ──────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    // PAA section: any authenticated user can read (needed by module config store)
    if (section === 'paa') {
      const auth: AuthResult | NextResponse = await withAuth(request)
      if (!auth || 'status' in auth) return auth as NextResponse
      const { tenantId } = auth as AuthResult

      const tenantForPaa = await db.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, settings: true },
      })
      if (!tenantForPaa) {
        // Tenant not found — return defaults instead of 404
        return success({ paa: DEFAULT_PAA_CONFIG }, 'Configuration PAA (défaut)')
      }

      const currentSettings = (tenantForPaa?.settings as Record<string, unknown>) || {}
      const paaConfig = (currentSettings.paa as Record<string, unknown>) || DEFAULT_PAA_CONFIG

      return success({ paa: paaConfig }, 'Configuration PAA')
    }

    // All other sections require ADMIN
    const auth = await withAdminAuth(request)
    if (!auth) return auth
    const { tenantId } = auth

    const effectiveTenantId = searchParams.get('tenantId') || tenantId

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
      where: { id: effectiveTenantId },
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
    return handleApiError(err)
  }
}

// ─── PATCH — Mettre à jour la config PAA ────

export async function PATCH(request: NextRequest) {
  try {
    const auth = await withAdminAuth(request)
    if (!auth) return auth
    const { userId, tenantId } = auth
    const body = await request.json()
    const data = patchPaaConfigSchema.parse(body)

    // Find tenant (use admin tenant or first available)
    let targetTenantId = data.tenantId
    if (targetTenantId === 'platform') {
      targetTenantId = tenantId
    }

    const existingTenant = await db.tenant.findUnique({
      where: { id: targetTenantId },
    })
    if (!existingTenant) {
      return Errors.notFound('Organisation')
    }

    const updatedPaaConfig = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: targetTenantId! },
        select: { settings: true },
      })

      const currentSettings = (tenant?.settings as Record<string, unknown>) || {}
      const currentPaa = (currentSettings.paa as typeof DEFAULT_PAA_CONFIG) || { ...DEFAULT_PAA_CONFIG }

      // Merge PAA config
      const newPaa = {
        enabled: data.paa.enabled !== undefined ? data.paa.enabled : currentPaa.enabled,
        modules: data.paa.modules
          ? { ...currentPaa.modules, ...data.paa.modules }
          : currentPaa.modules,
        settings: data.paa.settings
          ? { ...currentPaa.settings, ...data.paa.settings }
          : currentPaa.settings,
      }

      const newSettings = { ...currentSettings, paa: newPaa }

      const updated = await tx.tenant.update({
        where: { id: targetTenantId! },
        data: { settings: newSettings },
        select: { id: true, settings: true },
      })

      await tx.auditLog.create({
        data: {
          tenantId: targetTenantId!,
          userId,
          action: AuditAction.SETTINGS_UPDATE,
          entityType: 'Tenant',
          entityId: targetTenantId!,
          details: {
            updatedFields: ['settings.paa'],
            paa: newPaa,
          },
        },
      })

      return newPaa
    })

    return success({ paa: updatedPaaConfig }, 'Configuration PAA mise à jour avec succès')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PUT — Mettre à jour la configuration ──

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAdminAuth(request)
    if (!auth) return auth
    const { userId } = auth
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
          userId,
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
    return handleApiError(err)
  }
}
