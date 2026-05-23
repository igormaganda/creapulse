// ============================================
// CreaPulse V2 — Mentorat API
// GET  /api/mentorat           — List available mentors + user requests
// POST /api/mentorat           — Send mentorship request
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'

// ─── Validation schemas ────────────────────

const MentorRequestSchema = z.object({
  mentorId: z.string().min(1),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
  objectives: z.array(z.string()).min(1, 'Sélectionnez au moins un objectif'),
})

// ─── GET: List mentors + user requests ─────

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)
    }

    const payload = await verifyToken(token)

    // Fetch all mentors with their user profiles
    const mentors = await db.mentor.findMany({
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
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}

// ─── POST: Send mentorship request ─────────

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)
    }

    const payload = await verifyToken(token)

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

    // Create request
    const mentorRequest = await db.mentorshipRequest.create({
      data: {
        mentorId,
        menteeId: payload.userId,
        message,
        objectives,
      },
    })

    return success(
      { id: mentorRequest.id, status: mentorRequest.status },
      'Demande de mentorat envoyée avec succès'
    )
  } catch (err) {
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}

function error(code: string, message: string, status: number) {
  return Errors.validation({ code, message }, message)
}
