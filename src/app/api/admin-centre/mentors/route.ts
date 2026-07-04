// ============================================
// CreaPulse V2 — Admin Centre: Mentors API
// GET    /api/admin-centre/mentors   — List mentors (COUNSELOR/ADMIN)
// POST   /api/admin-centre/mentors   — Create mentor profile (ADMIN)
// PATCH  /api/admin-centre/mentors   — Update mentor profile (ADMIN)
// DELETE /api/admin-centre/mentors   — Delete mentor profile (ADMIN)
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, error, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/admin-centre/mentors')

// ─── Zod schemas ────────────────────────────

const MentorAvailabilityValues = ['AVAILABLE', 'LIMITED', 'UNAVAILABLE'] as const

const CreateMentorSchema = z.object({
  userId: z.string().min(1, 'L\'identifiant utilisateur est requis'),
  bio: z.string().max(2000).default(''),
  expertise: z.array(z.string()).default([]),
  sectors: z.array(z.string()).default([]),
  location: z.string().max(200).default(''),
  availability: z.enum(MentorAvailabilityValues).default('AVAILABLE'),
  maxMentees: z.number().int().min(1).max(50).default(3),
})

const UpdateMentorSchema = z.object({
  mentorId: z.string().min(1, 'L\'identifiant du mentor est requis'),
  bio: z.string().max(2000).optional(),
  expertise: z.array(z.string()).optional(),
  sectors: z.array(z.string()).optional(),
  location: z.string().max(200).optional(),
  availability: z.enum(MentorAvailabilityValues).optional(),
  maxMentees: z.number().int().min(1).max(50).optional(),
})

const DeleteMentorSchema = z.object({
  mentorId: z.string().min(1, 'L\'identifiant du mentor est requis'),
})

// ─── GET: List all mentors ─────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['COUNSELOR', 'ADMIN'] })
    if (!auth || auth instanceof Response) return auth
    const { tenantId } = auth

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    // Build where clause scoped to tenant
    const where: Record<string, unknown> = {
      user: { tenantId },
    }

    if (search) {
      where.OR = [
        { bio: { contains: search, mode: 'insensitive' } },
        { expertise: { hasSome: [search] } },
        { sectors: { hasSome: [search] } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [mentors, total] = await Promise.all([
      db.mentor.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              mentorships: {
                where: { status: 'ACTIVE' },
              },
              requests: {
                where: { status: 'PENDING' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.mentor.count({ where }),
    ])

    const formattedMentors = mentors.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim(),
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      bio: m.bio,
      expertise: m.expertise,
      sectors: m.sectors,
      location: m.location,
      availability: m.availability,
      maxMentees: m.maxMentees,
      rating: m.rating,
      reviewCount: m.reviewCount,
      activeMentorshipCount: m._count.mentorships,
      pendingRequestCount: m._count.requests,
      isActive: m.user.isActive,
      lastLoginAt: m.user.lastLoginAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }))

    return success(
      {
        mentors: formattedMentors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      `${total} mentor(s) trouvé(s)`,
    )
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Create mentor profile ───────────

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['ADMIN'] })
    if (!auth || auth instanceof Response) return auth
    const { tenantId, userId: adminUserId } = auth

    const body = await request.json()
    const parsed = CreateMentorSchema.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      )
    }

    const { userId, bio, expertise, sectors, location, availability, maxMentees } = parsed.data

    // Verify user exists and belongs to the same tenant
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true, firstName: true, lastName: true, mentorProfile: { select: { id: true } } },
    })

    if (!user) {
      return Errors.notFound('Utilisateur')
    }

    if (user.tenantId !== tenantId) {
      return error('TENANT_MISMATCH', 'Cet utilisateur n\'appartient pas à votre organisation', 403)
    }

    if (user.mentorProfile) {
      return error('MENTOR_EXISTS', 'Cet utilisateur possède déjà un profil mentor', 409)
    }

    // Create mentor profile
    const mentor = await db.mentor.create({
      data: {
        userId,
        bio,
        expertise,
        sectors,
        location,
        availability,
        maxMentees,
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    })

    // Fire-and-forget: notify the user
    import('@/lib/notifications').then(({ createNotification }) => {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Utilisateur'
      createNotification({
        userId: user.id,
        title: 'Profil mentor créé',
        content: `Votre profil mentor a été créé par l'administrateur. Vous pouvez maintenant recevoir des demandes de mentorat.`,
        type: 'SUCCESS',
        link: '/bureau/mentorat',
      }).catch(() => {})
    }).catch(() => {})

    log.info('Mentor profile created', { mentorId: mentor.id, userId, adminId: adminUserId })

    return success(
      {
        id: mentor.id,
        userId: mentor.userId,
        name: `${mentor.user.firstName || ''} ${mentor.user.lastName || ''}`.trim(),
        bio: mentor.bio,
        expertise: mentor.expertise,
        sectors: mentor.sectors,
        location: mentor.location,
        availability: mentor.availability,
        maxMentees: mentor.maxMentees,
        createdAt: mentor.createdAt,
      },
      'Profil mentor créé avec succès',
      201,
    )
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PATCH: Update mentor profile ──────────

export async function PATCH(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['ADMIN'] })
    if (!auth || auth instanceof Response) return auth
    const { userId: adminUserId } = auth

    const body = await request.json()
    const parsed = UpdateMentorSchema.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      )
    }

    const { mentorId, ...updateData } = parsed.data

    // Verify mentor exists
    const existing = await db.mentor.findUnique({
      where: { id: mentorId },
      include: {
        user: { select: { id: true, tenantId: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    })

    if (!existing) {
      return Errors.notFound('Mentor')
    }

    // Build the update payload (only include provided fields)
    const data: Record<string, unknown> = {}
    if (updateData.bio !== undefined) data.bio = updateData.bio
    if (updateData.expertise !== undefined) data.expertise = updateData.expertise
    if (updateData.sectors !== undefined) data.sectors = updateData.sectors
    if (updateData.location !== undefined) data.location = updateData.location
    if (updateData.availability !== undefined) data.availability = updateData.availability
    if (updateData.maxMentees !== undefined) data.maxMentees = updateData.maxMentees

    const updated = await db.mentor.update({
      where: { id: mentorId },
      data,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    })

    log.info('Mentor profile updated', { mentorId, adminId: adminUserId, fields: Object.keys(data) })

    return success(
      {
        id: updated.id,
        userId: updated.userId,
        name: `${updated.user.firstName || ''} ${updated.user.lastName || ''}`.trim(),
        bio: updated.bio,
        expertise: updated.expertise,
        sectors: updated.sectors,
        location: updated.location,
        availability: updated.availability,
        maxMentees: updated.maxMentees,
        rating: updated.rating,
        reviewCount: updated.reviewCount,
        updatedAt: updated.updatedAt,
      },
      'Profil mentor mis à jour',
    )
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── DELETE: Remove mentor profile ─────────

export async function DELETE(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['ADMIN'] })
    if (!auth || auth instanceof Response) return auth
    const { userId: adminUserId } = auth

    const body = await request.json()
    const parsed = DeleteMentorSchema.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      )
    }

    const { mentorId } = parsed.data

    // Verify mentor exists
    const mentor = await db.mentor.findUnique({
      where: { id: mentorId },
      include: {
        user: { select: { id: true, tenantId: true, firstName: true, lastName: true } },
        _count: {
          select: {
            mentorships: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    })

    if (!mentor) {
      return Errors.notFound('Mentor')
    }

    // Prevent deletion if there are active mentorships
    if (mentor._count.mentorships > 0) {
      return error(
        'ACTIVE_MENTORSHIPS',
        `Impossible de supprimer ce mentor : ${mentor._count.mentorships} mentorat(s) actif(s) en cours`,
        409,
      )
    }

    // Delete the mentor profile (cascades to requests)
    await db.mentor.delete({
      where: { id: mentorId },
    })

    // Fire-and-forget: notify the user
    import('@/lib/notifications').then(({ createNotification }) => {
      const name = [mentor.user.firstName, mentor.user.lastName].filter(Boolean).join(' ') || 'Utilisateur'
      createNotification({
        userId: mentor.user.id,
        title: 'Profil mentor supprimé',
        content: 'Votre profil mentor a été supprimé par l\'administrateur.',
        type: 'WARNING',
      }).catch(() => {})
    }).catch(() => {})

    log.info('Mentor profile deleted', { mentorId, userId: mentor.user.id, adminId: adminUserId })

    return success(null, 'Profil mentor supprimé')
  } catch (err) {
    return handleApiError(err)
  }
}