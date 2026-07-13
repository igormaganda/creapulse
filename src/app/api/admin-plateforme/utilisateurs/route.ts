import { NextRequest } from 'next/server'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAdminAuth } from '@/lib/api-auth'
import { hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { AuditAction, UserRole } from '@prisma/client'

// ─── Zod schemas ────────────────────────────

const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  role: z.enum(['ADMIN', 'COUNSELOR', 'BENEFICIARY']),
  tenantId: z.string().min(1, 'Le tenant est requis'),
  organizationId: z.string().optional(),
})

const updateUserSchema = z.object({
  userId: z.string().min(1, 'userId requis'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Email invalide').optional(),
  role: z.enum(['ADMIN', 'COUNSELOR', 'BENEFICIARY']).optional(),
  isActive: z.boolean().optional(),
  organizationId: z.string().optional(),
})

const deleteUserSchema = z.object({
  userId: z.string().min(1, 'userId requis'),
})

// ─── GET — Lister les utilisateurs ──────────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAdminAuth(request)
    if (!auth) return auth

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const tenantId = searchParams.get('tenantId') || ''
    const organizationId = searchParams.get('organizationId') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10))

    // Construire la clause where dynamiquement
    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role) where.role = role
    if (status === 'actif') where.isActive = true
    if (status === 'inactif') where.isActive = false
    if (tenantId) where.tenantId = tenantId
    if (organizationId) {
      if (role === 'COUNSELOR') {
        where.counselorProfile = { is: { organizationId } }
      } else if (role === 'BENEFICIARY') {
        where.beneficiaryProfile = { is: { organizationId } }
      }
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          tenantId: true,
          tenant: { select: { id: true, name: true, slug: true } },
          counselorProfile: {
            select: {
              id: true,
              name: true,
              isAvailable: true,
              organization: { select: { id: true, name: true } },
            },
          },
          beneficiaryProfile: {
            select: {
              id: true,
              progressScore: true,
              organization: { select: { id: true, name: true } },
            },
          },
          creatorJourneys: {
            select: {
              id: true,
              currentPhase: true,
              progressPercent: true,
              bpStatus: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    const formattedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      prenom: u.firstName,
      nom: u.lastName,
      role: u.role,
      actif: u.isActive,
      derniereConnexion: u.lastLoginAt,
      dateCreation: u.createdAt,
      tenant: u.tenant ? { id: u.tenant.id, nom: u.tenant.name } : null,
      organisation: u.counselorProfile?.organization
        ? { id: u.counselorProfile.organization.id, nom: u.counselorProfile.organization.name }
        : u.beneficiaryProfile?.organization
          ? { id: u.beneficiaryProfile.organization.id, nom: u.beneficiaryProfile.organization.name }
          : null,
      profilConseiller: u.counselorProfile
        ? { nom: u.counselorProfile.name, disponible: u.counselorProfile.isAvailable }
        : null,
      profilBeneficiaire: u.beneficiaryProfile
        ? { scoreProgression: u.beneficiaryProfile.progressScore }
        : null,
      parcours: u.creatorJourneys?.[0]
        ? {
            phase: u.creatorJourneys[0].currentPhase,
            progression: u.creatorJourneys[0].progressPercent,
            statutBP: u.creatorJourneys[0].bpStatus,
          }
        : null,
    }))

    return success(
      {
        utilisateurs: formattedUsers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      'Liste des utilisateurs',
    )
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST — Créer un utilisateur ───────────

export async function POST(request: NextRequest) {
  try {
    const auth = await withAdminAuth(request)
    if (!auth) return auth
    const { userId } = auth
    const body = await request.json()
    const data = createUserSchema.parse(body)

    // Vérifier l'unicité de l'email dans le tenant
    const existingUser = await db.user.findUnique({
      where: { tenantId_email: { tenantId: data.tenantId, email: data.email } },
    })
    if (existingUser) {
      return Errors.validation(null, 'Un utilisateur avec cet email existe déjà dans ce tenant')
    }

    // Vérifier que le tenant existe
    const tenant = await db.tenant.findUnique({ where: { id: data.tenantId } })
    if (!tenant) {
      return Errors.notFound('Tenant')
    }

    const passwordHash = await hashPassword(data.password)
    const fullName = `${data.firstName} ${data.lastName}`

    // Créer l'utilisateur et le profil de rôle dans une transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          tenantId: data.tenantId,
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
        },
      })

      // Créer le profil de rôle
      if (data.role === 'COUNSELOR') {
        if (!data.organizationId || data.organizationId.trim() === '') {
          return Errors.validation(
            { field: 'organizationId', message: 'L\'organisation est requise pour un conseiller' },
            'organizationId est requis pour le rôle COUNSELOR',
          )
        }
        await tx.counselor.create({
          data: {
            userId: newUser.id,
            organizationId: data.organizationId,
            name: fullName,
          },
        })
      } else if (data.role === 'BENEFICIARY') {
        await tx.beneficiary.create({
          data: {
            userId: newUser.id,
            organizationId: data.organizationId || null,
          },
        })
        // Créer le parcours créateur
        await tx.creatorJourney.create({
          data: { userId: newUser.id, enrollmentId: null },
        })
      }

      // Journal d'audit
      await tx.auditLog.create({
        data: {
          tenantId: data.tenantId,
          userId,
          action: AuditAction.USER_CREATE,
          entityType: 'User',
          entityId: newUser.id,
          details: {
            email: data.email,
            role: data.role,
            firstName: data.firstName,
            lastName: data.lastName,
          },
        },
      })

      return newUser
    })

    return success(
      {
        id: user.id,
        email: user.email,
        prenom: user.firstName,
        nom: user.lastName,
        role: user.role,
        actif: user.isActive,
        dateCreation: user.createdAt,
      },
      'Utilisateur créé avec succès',
      201,
    )
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PUT — Mettre à jour un utilisateur ─────

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAdminAuth(request)
    if (!auth) return auth
    const { userId, tenantId } = auth
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // Vérifier que l'utilisateur existe
    const existingUser = await db.user.findUnique({
      where: { id: data.userId },
      include: { counselorProfile: true, beneficiaryProfile: true },
    })
    if (!existingUser) {
      return Errors.notFound('Utilisateur')
    }

    // Cross-tenant check
    if (existingUser.tenantId !== tenantId) {
      return Errors.forbidden('Vous ne pouvez pas modifier un utilisateur d\'une autre organisation')
    }

    // Si changement d'email, vérifier l'unicité
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { tenantId_email: { tenantId: existingUser.tenantId, email: data.email } },
      })
      if (emailExists) {
        return Errors.validation(null, 'Un utilisateur avec cet email existe déjà dans ce tenant')
      }
    }

    const updateData: Record<string, unknown> = {}
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.email !== undefined) updateData.email = data.email
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.role !== undefined) updateData.role = data.role

    const updatedUser = await db.$transaction(async (tx) => {
      // Gérer les changements de rôle
      if (data.role && data.role !== existingUser.role) {
        const oldRole = existingUser.role

        // Supprimer l'ancien profil
        if (oldRole === 'COUNSELOR' && existingUser.counselorProfile) {
          await tx.counselor.delete({ where: { id: existingUser.counselorProfile.id } })
        } else if (oldRole === 'BENEFICIARY') {
          if (existingUser.beneficiaryProfile) {
            await tx.beneficiary.delete({ where: { id: existingUser.beneficiaryProfile.id } })
          }
          await tx.creatorJourney.deleteMany({ where: { userId: existingUser.id } })
        }

        // Créer le nouveau profil
        if (data.role === 'COUNSELOR') {
          await tx.counselor.create({
            data: {
              userId: existingUser.id,
              organizationId: data.organizationId || existingUser.counselorProfile?.organizationId || '',
              name: `${data.firstName || existingUser.firstName} ${data.lastName || existingUser.lastName}`,
            },
          })
        } else if (data.role === 'BENEFICIARY') {
          await tx.beneficiary.create({
            data: {
              userId: existingUser.id,
              organizationId: data.organizationId || null,
            },
          })
          await tx.creatorJourney.create({
            data: { userId: existingUser.id, enrollmentId: null },
          })
        }
      }

      // Mettre à jour le profil organisation si nécessaire
      if (data.organizationId && !data.role) {
        if (existingUser.role === 'COUNSELOR' && existingUser.counselorProfile) {
          await tx.counselor.update({
            where: { id: existingUser.counselorProfile.id },
            data: { organizationId: data.organizationId },
          })
        } else if (existingUser.role === 'BENEFICIARY' && existingUser.beneficiaryProfile) {
          await tx.beneficiary.update({
            where: { id: existingUser.beneficiaryProfile.id },
            data: { organizationId: data.organizationId },
          })
        }
      }

      const user = await tx.user.update({
        where: { id: data.userId },
        data: updateData,
      })

      // Journal d'audit
      await tx.auditLog.create({
        data: {
          tenantId: existingUser.tenantId,
          userId,
          action: AuditAction.USER_UPDATE,
          entityType: 'User',
          entityId: data.userId,
          details: updateData,
        },
      })

      return user
    })

    return success(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        prenom: updatedUser.firstName,
        nom: updatedUser.lastName,
        role: updatedUser.role,
        actif: updatedUser.isActive,
      },
      'Utilisateur mis à jour avec succès',
    )
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── DELETE — Désactiver un utilisateur ─────

export async function DELETE(request: NextRequest) {
  try {
    const auth = await withAdminAuth(request)
    if (!auth) return auth
    const { userId: adminUserId, tenantId } = auth

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''
    if (!userId) {
      return Errors.validation(null, 'userId requis en paramètre de requête')
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return Errors.notFound('Utilisateur')
    }

    // Cross-tenant check
    if (user.tenantId !== tenantId) {
      return Errors.forbidden('Vous ne pouvez pas modifier un utilisateur d\'une autre organisation')
    }

    if (!user.isActive) {
      return Errors.validation(null, 'Cet utilisateur est déjà désactivé')
    }

    // Désactivation (soft delete)
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: false },
      })

      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: adminUserId,
          action: AuditAction.USER_DELETE,
          entityType: 'User',
          entityId: userId,
          details: {
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        },
      })
    })

    return success({ userId, actif: false }, 'Utilisateur désactivé avec succès')
  } catch (err) {
    return handleApiError(err)
  }
}
