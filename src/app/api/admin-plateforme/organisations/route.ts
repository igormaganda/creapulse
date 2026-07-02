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

const createOrgSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  type: z.enum(['FORMATION_CENTER', 'GIDEF_AGENCY', 'INCUBATOR', 'PEPITE', 'CO_WORKING']),
  tenantId: z.string().min(1, 'Le tenant est requis'),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  region: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
})

// ─── GET — Lister les organisations ────────

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const city = searchParams.get('city') || ''
    const tenantId = searchParams.get('tenantId') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10))

    // Construire la clause where
    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (type) where.type = type
    if (status === 'actif') where.isActive = true
    if (status === 'inactif') where.isActive = false
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (tenantId) where.tenantId = tenantId

    const [organizations, total] = await Promise.all([
      db.organization.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          address: true,
          city: true,
          postalCode: true,
          region: true,
          phone: true,
          email: true,
          website: true,
          isActive: true,
          createdAt: true,
          tenantId: true,
          tenant: { select: { id: true, name: true, plan: true } },
          _count: {
            select: {
              counselors: true,
              beneficiaries: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.organization.count({ where }),
    ])

    // Statistiques par organisation
    const orgIds = organizations.map((o) => o.id)

    const beneficiaryStats = orgIds.length > 0
      ? await db.beneficiary.groupBy({
          where: { organizationId: { in: orgIds } },
          by: ['organizationId'],
          _avg: { progressScore: true },
        })
      : []

    const statsMap: Record<string, number> = {}
    for (const stat of beneficiaryStats) {
      statsMap[stat.organizationId] = Math.round(stat._avg.progressScore || 0)
    }

    const formattedOrgs = organizations.map((org) => ({
      id: org.id,
      nom: org.name,
      type: org.type,
      adresse: org.address,
      ville: org.city,
      codePostal: org.postalCode,
      region: org.region,
      telephone: org.phone,
      email: org.email,
      siteWeb: org.website,
      actif: org.isActive,
      dateCreation: org.createdAt,
      tenant: org.tenant ? { id: org.tenant.id, nom: org.tenant.name, plan: org.tenant.plan } : null,
      statistiques: {
        conseillers: org._count.counselors,
        beneficiaires: org._count.beneficiaries,
        scoreMoyenBeneficiaires: statsMap[org.id] || 0,
      },
    }))

    return success(
      {
        organisations: formattedOrgs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      'Liste des organisations',
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

// ─── POST — Créer une organisation ─────────

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const data = createOrgSchema.parse(body)

    // Vérifier que le tenant existe
    const tenant = await db.tenant.findUnique({ where: { id: data.tenantId } })
    if (!tenant) {
      return Errors.notFound('Tenant')
    }

    // Créer l'organisation avec journal d'audit
    const organization = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          tenantId: data.tenantId,
          name: data.name,
          type: data.type,
          address: data.address || null,
          city: data.city || null,
          postalCode: data.postalCode || null,
          region: data.region || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
        },
      })

      await tx.auditLog.create({
        data: {
          tenantId: data.tenantId,
          userId: admin.userId,
          action: AuditAction.SETTINGS_UPDATE,
          entityType: 'Organization',
          entityId: org.id,
          details: {
            name: data.name,
            type: data.type,
            city: data.city,
          },
        },
      })

      return org
    })

    return success(
      {
        id: organization.id,
        nom: organization.name,
        type: organization.type,
        ville: organization.city,
        actif: organization.isActive,
        dateCreation: organization.createdAt,
      },
      'Organisation créée avec succès',
      201,
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
