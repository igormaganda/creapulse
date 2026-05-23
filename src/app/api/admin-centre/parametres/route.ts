// ============================================
// CreaPulse V2 — Admin Centre: Paramètres API
// GET /api/admin-centre/parametres
// PUT /api/admin-centre/parametres
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

// ─── Admin Auth Helper ──────────────────────

async function getAdminOrg(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const headerToken = getTokenFromHeader(request)
  const token = cookieToken || headerToken
  if (!token) throw new Error('Unauthorized')
  const payload = await verifyToken(token)
  if (payload.role !== 'ADMIN') throw new Error('Forbidden')
  return { userId: payload.userId, tenantId: payload.tenantId }
}

// ─── Zod Schema for PUT ────────────────────

const updateOrgSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  website: z.string().optional(),
})

// ─── GET: Return center settings ───────────

export async function GET(request: NextRequest) {
  try {
    const { userId, tenantId } = await getAdminOrg(request)

    // Find admin's counselor profile to get org, or find any org for this tenant
    const adminCounselor = await db.counselor.findUnique({
      where: { userId },
      select: { organizationId: true },
    })

    // Get first organization for this tenant
    let organization = null
    if (adminCounselor) {
      organization = await db.organization.findUnique({
        where: { id: adminCounselor.organizationId },
      })
    }
    if (!organization) {
      organization = await db.organization.findFirst({
        where: { tenantId },
      })
    }

    if (!organization) {
      return Errors.notFound('Organisation')
    }

    // Get center statistics summary
    const [totalBeneficiaires, totalCounselors, totalAppointments] = await Promise.all([
      db.user.count({
        where: { tenantId, role: 'BENEFICIARY' },
      }),
      db.counselor.count({
        where: { organizationId: organization.id },
      }),
      db.appointment.count({
        where: { counselor: { organizationId: organization.id } },
      }),
    ])

    return success({
      center: {
        id: organization.id,
        name: organization.name,
        siret: organization.siret || '',
        address: organization.address || '',
        city: organization.city || '',
        postalCode: organization.postalCode || '',
        region: organization.region || '',
        phone: organization.phone || '',
        email: organization.email || '',
        website: organization.website || '',
        type: organization.type,
        isActive: organization.isActive,
      },
      stats: {
        totalBeneficiaires,
        totalCounselors,
        totalAppointments,
      },
    }, 'Paramètres du centre')
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return Errors.unauthorized('Authentification requise')
    }
    return handleApiError(err)
  }
}

// ─── PUT: Update center settings ───────────

export async function PUT(request: NextRequest) {
  try {
    const { userId, tenantId } = await getAdminOrg(request)

    const body = await request.json()
    const parsed = updateOrgSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(parsed.error.issues)
    }

    // Find admin's organization
    const adminCounselor = await db.counselor.findUnique({
      where: { userId },
      select: { organizationId: true },
    })

    if (!adminCounselor) {
      return Errors.notFound('Profil conseiller de l\'administrateur')
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.name) updateData.name = parsed.data.name
    if (parsed.data.address !== undefined) updateData.address = parsed.data.address || null
    if (parsed.data.city !== undefined) updateData.city = parsed.data.city || null
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email || null
    if (parsed.data.website !== undefined) updateData.website = parsed.data.website || null

    // Update organization
    const updated = await db.organization.update({
      where: { id: adminCounselor.organizationId },
      data: updateData,
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'SETTINGS_UPDATE',
        entityType: 'Organization',
        entityId: updated.id,
        details: { changes: updateData },
      },
    })

    return success({
      center: {
        id: updated.id,
        name: updated.name,
        siret: updated.siret || '',
        address: updated.address || '',
        city: updated.city || '',
        postalCode: updated.postalCode || '',
        region: updated.region || '',
        phone: updated.phone || '',
        email: updated.email || '',
        website: updated.website || '',
        type: updated.type,
        isActive: updated.isActive,
      },
    }, 'Paramètres mis à jour avec succès')
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return Errors.unauthorized('Authentification requise')
    }
    return handleApiError(err)
  }
}
