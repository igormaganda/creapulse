// ============================================
// CreaPulse V2 — Mentorat API
// GET    /api/mentorat           — List available mentors + user requests
// POST   /api/mentorat           — Send mentorship request
// PATCH  /api/mentorat           — Accept/reject request, end mentorship
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, error } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import { createNotification } from '@/lib/notifications'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/mentorat')

// ─── Validation schemas ────────────────────

const MentorRequestSchema = z.object({
  mentorId: z.string().min(1),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
  objectives: z.array(z.string()).min(1, 'Sélectionnez au moins un objectif'),
})

// ─── GET: List mentors + user requests ─────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['BENEFICIARY', 'COUNSELOR', 'ADMIN'] })
    if (!auth || auth instanceof NextResponse) return auth
    const { payload } = auth

    // Fetch mentors scoped to the user's tenant
    const mentors = await db.mentor.findMany({
      where: { user: { tenantId: payload.tenantId } },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { rating: 'desc' },
    })

    // Check active mentorships for this user
    const activeMentorships = await db.mentorship.findMany({
      where: { menteeId: payload.userId, status: 'ACTIVE' },
      include: {
        mentor: {
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    })

    // Check pending/recent requests
    const myRequests = await db.mentorshipRequest.findMany({
      where: { menteeId: payload.userId },
      include: {
        mentor: {
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const mentorData = mentors.map((m) => ({
      id: m.id,
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
    }))

    const requestsData = myRequests.map((r) => ({
      id: r.id,
      mentorId: r.mentorId,
      mentorName: `${r.mentor.user.firstName || ''} ${r.mentor.user.lastName || ''}`.trim(),
      mentorAvatarUrl: r.mentor.user.avatarUrl,
      message: r.message,
      objectives: r.objectives,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))

    const activeMentorshipData = activeMentorships.map((ms) => ({
      id: ms.id,
      mentorId: ms.mentorId,
      mentorName: `${ms.mentor.user.firstName || ''} ${ms.mentor.user.lastName || ''}`.trim(),
      mentorAvatarUrl: ms.mentor.user.avatarUrl,
      status: ms.status,
      startedAt: ms.startedAt,
    }))

    return success({
      mentors: mentorData,
      myRequests: requestsData,
      activeMentorships: activeMentorshipData,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Send mentorship request ─────────

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['BENEFICIARY', 'COUNSELOR', 'ADMIN'] })
    if (!auth || auth instanceof NextResponse) return auth
    const { payload } = auth

    const body = await request.json()
    const { mentorId, message, objectives } = MentorRequestSchema.parse(body)

    // Check mentor exists
    const mentor = await db.mentor.findUnique({ where: { id: mentorId } })
    if (!mentor) {
      return Errors.notFound('Mentor')
    }

    // Check for existing pending request
    const existingRequest = await db.mentorshipRequest.findFirst({
      where: {
        mentorId,
        menteeId: payload.userId,
        status: 'PENDING',
      },
    })

    if (existingRequest) {
      return error('DUPLICATE_REQUEST', 'Vous avez déjà une demande en attente auprès de ce mentor', 409)
    }

    // Check for existing active mentorship
    const existingMentorship = await db.mentorship.findFirst({
      where: {
        mentorId,
        menteeId: payload.userId,
        status: 'ACTIVE',
      },
    })

    if (existingMentorship) {
      return error('ACTIVE_MENTORSHIP', 'Vous avez déjà un mentorat actif avec ce mentor', 409)
    }

    // Check maxMentees limit
    const activeCount = await db.mentorship.count({
      where: { mentorId, status: 'ACTIVE' },
    })
    if (activeCount >= mentor.maxMentees) {
      return error('MENTOR_FULL', 'Ce mentor a atteint sa limite de mentorés', 409)
    }

    // Create request (using transaction for data integrity)
    let mentorRequest
    try {
      mentorRequest = await db.$transaction(async (tx) => {
        // Re-check duplicate inside transaction
        const dup = await tx.mentorshipRequest.findFirst({
          where: { mentorId, menteeId: payload.userId, status: 'PENDING' },
        })
        if (dup) {
          const err = new Error('DUPLICATE') as Error & { code: string }
          err.code = 'DUPLICATE'
          throw err
        }

        return tx.mentorshipRequest.create({
          data: {
            mentorId,
            menteeId: payload.userId,
            message,
            objectives,
          },
        })
      })
    } catch (txErr: unknown) {
      if (txErr instanceof Error && (txErr as Error & { code?: string }).code === 'DUPLICATE') {
        return error('DUPLICATE_REQUEST', 'Vous avez déjà une demande en attente auprès de ce mentor', 409)
      }
      throw txErr
    }

    // Fire-and-forget: notify the mentor about the new request
    db.user.findUnique({ where: { id: payload.userId }, select: { firstName: true, lastName: true } })
      .then((u) => {
        const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ') || 'Un bénéficiaire'
        return createNotification({
          userId: mentor.userId,
          title: 'Nouvelle demande de mentorat',
          content: `${name} vous a envoyé une demande de mentorat`,
          type: 'ACTION_REQUIRED',
          link: '/bureau/mentorat',
        })
      }).catch(() => {})

    return success(
      { id: mentorRequest.id, status: mentorRequest.status },
      'Demande de mentorat envoyée avec succès'
    )
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PATCH: Accept/reject request, end mentorship ──

const patchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('accept-request'),
    requestId: z.string().min(1),
  }),
  z.object({
    action: z.literal('reject-request'),
    requestId: z.string().min(1),
  }),
  z.object({
    action: z.literal('end-mentorship'),
    mentorshipId: z.string().min(1),
  }),
])

export async function PATCH(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['COUNSELOR', 'ADMIN'] })
    if (!auth || auth instanceof NextResponse) return auth
    const { payload } = auth

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })))
    }

    if (parsed.data.action === 'accept-request') {
      const { requestId } = parsed.data

      const mentorshipRequest = await db.mentorshipRequest.findUnique({
        where: { id: requestId },
        include: {
          mentor: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
          mentee: { select: { id: true, firstName: true, lastName: true, email: true, tenantId: true } },
        },
      })
      if (!mentorshipRequest) return Errors.notFound('Demande de mentorat')
      if (mentorshipRequest.status !== 'PENDING') {
        return error('INVALID_STATUS', 'Cette demande a déjà été traitée', 409)
      }

      // Accept the request
      await db.mentorshipRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      })

      // Create active mentorship
      const mentorship = await db.mentorship.create({
        data: {
          mentorId: mentorshipRequest.mentorId,
          menteeId: mentorshipRequest.menteeId,
          status: 'ACTIVE',
        },
      })

      const mentorName = [mentorshipRequest.mentor.user.firstName, mentorshipRequest.mentor.user.lastName].filter(Boolean).join(' ')
      const menteeName = [mentorshipRequest.mentee.firstName, mentorshipRequest.mentee.lastName].filter(Boolean).join(' ')

      // Fire-and-forget: notify the beneficiary
      createNotification({
        userId: mentorshipRequest.menteeId,
        title: 'Mentor assigné',
        content: 'Un mentor vous a été assigné',
        type: 'SUCCESS',
        link: '/bureau/mentorat',
      }).catch(() => {})

      // Fire-and-forget: notify the mentor
      createNotification({
        userId: mentorshipRequest.mentor.user.id,
        title: 'Nouveau mentoré',
        content: `Vous avez accepté la demande de ${menteeName || 'un bénéficiaire'}`,
        type: 'SUCCESS',
        link: '/bureau/mentorat',
      }).catch(() => {})

      // Fire-and-forget: email to beneficiary
      import('@/lib/email').then(({ sendMentorAssignedEmail }) => {
        sendMentorAssignedEmail(mentorshipRequest.mentee.email, mentorName).catch(() => {})
      }).catch(() => {})

      log.info('Mentorship request accepted', { requestId, mentorId: mentorshipRequest.mentorId, menteeId: mentorshipRequest.menteeId })

      return success({ id: mentorship.id }, 'Mentorat accepté avec succès')
    }

    if (parsed.data.action === 'reject-request') {
      const { requestId } = parsed.data

      const mentorshipRequest = await db.mentorshipRequest.findUnique({
        where: { id: requestId },
        include: { mentee: { select: { id: true, firstName: true, lastName: true } } },
      })
      if (!mentorshipRequest) return Errors.notFound('Demande de mentorat')
      if (mentorshipRequest.status !== 'PENDING') {
        return error('INVALID_STATUS', 'Cette demande a déjà été traitée', 409)
      }

      await db.mentorshipRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      })

      // Fire-and-forget: notify the mentee
      createNotification({
        userId: mentorshipRequest.menteeId,
        title: 'Demande de mentorat',
        content: 'Votre demande de mentorat a été refusée',
        type: 'WARNING',
        link: '/bureau/mentorat',
      }).catch(() => {})

      return success(null, 'Demande refusée')
    }

    if (parsed.data.action === 'end-mentorship') {
      const { mentorshipId } = parsed.data

      const mentorship = await db.mentorship.findUnique({
        where: { id: mentorshipId },
        include: {
          mentor: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          mentee: { select: { id: true, firstName: true, lastName: true } },
        },
      })
      if (!mentorship) return Errors.notFound('Mentorat')
      if (mentorship.status !== 'ACTIVE') {
        return error('INVALID_STATUS', 'Ce mentorat n\'est pas actif', 409)
      }

      await db.mentorship.update({
        where: { id: mentorshipId },
        data: { status: 'ENDED', endedAt: new Date() },
      })

      // Fire-and-forget: notify both parties
      const mentorName = [mentorship.mentor.user.firstName, mentorship.mentor.user.lastName].filter(Boolean).join(' ')
      const menteeName = [mentorship.mentee.firstName, mentorship.mentee.lastName].filter(Boolean).join(' ')

      createNotification({
        userId: mentorship.menteeId,
        title: 'Mentorat terminé',
        content: `Votre mentorat avec ${mentorName} est terminé`,
        type: 'INFO',
        link: '/bureau/mentorat',
      }).catch(() => {})

      createNotification({
        userId: mentorship.mentor.user.id,
        title: 'Mentorat terminé',
        content: `Votre mentorat avec ${menteeName} est terminé`,
        type: 'INFO',
        link: '/bureau/mentorat',
      }).catch(() => {})

      log.info('Mentorship ended', { mentorshipId })

      return success(null, 'Mentorat terminé')
    }

    return Errors.validation([])
  } catch (err) {
    return handleApiError(err)
  }
}
