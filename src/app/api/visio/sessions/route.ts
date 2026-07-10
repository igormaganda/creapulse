// ============================================
// CreaPulse V2 — Sessions de Visioconférence
// GET  /api/visio/sessions        — Lister les sessions visio
// POST /api/visio/sessions        — Créer une session visio
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { getCounselor, AuthRequiredError, AuthForbiddenError, AuthNotFoundError } from '@/app/api/conseiller/_lib/auth'
import { z } from 'zod'
// No external dependency — use built-in crypto.randomUUID() (Node.js 19+)
function createId(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

// ─── Zod schemas ─────────────────────────────

const createVisioSchema = z.object({
  beneficiaryId: z.string().min(1, "L'identifiant du bénéficiaire est requis"),
  interviewId: z.string().optional(),
  appointmentId: z.string().optional(),
  roomSubject: z.string().max(255).optional(),
})

// ─── Helpers ─────────────────────────────────

function getJitsiBaseUrl(): string {
  // In production, prefer self-hosted URL if configured
  if (process.env.JITSI_SELF_HOSTED_URL) {
    return process.env.JITSI_SELF_HOSTED_URL.replace(/\/+$/, '')
  }
  return (process.env.JITSI_SERVER_URL || 'https://meet.jit.si').replace(/\/+$/, '')
}

function generateRoomName(tenantSlug: string): string {
  // Format: {tenant.slug}-{cuid(8 chars)} — all lowercase, no spaces
  const shortId = createId().slice(0, 8).toLowerCase()
  const slug = tenantSlug.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return `${slug}-${shortId}`
}

// ─── GET ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { counselor, tenantId } = await getCounselor(request)

    // Parse query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    // Build where clause
    const where: Record<string, unknown> = {
      tenantId,
      counselorId: counselor.id,
    }

    if (status) {
      const validStatuses = ['WAITING', 'ACTIVE', 'ENDED', 'CANCELLED']
      if (validStatuses.includes(status.toUpperCase())) {
        where.status = status.toUpperCase()
      }
    }

    const [total, sessions] = await Promise.all([
      db.visioSession.count({ where }),
      db.visioSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          counselor: {
            select: { name: true },
          },
          beneficiary: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),
    ])

    const baseUrl = getJitsiBaseUrl()

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      roomName: s.roomName,
      roomSubject: s.roomSubject,
      status: s.status,
      counselorName: s.counselor.name,
      beneficiaryName: `${s.beneficiary.user.firstName || ''} ${s.beneficiary.user.lastName || ''}`.trim(),
      startedAt: s.startedAt?.toISOString() || null,
      endedAt: s.endedAt?.toISOString() || null,
      durationSeconds: s.durationSeconds,
      joinUrl: `${baseUrl}/${s.roomName}`,
      createdAt: s.createdAt.toISOString(),
    }))

    return success({
      sessions: formattedSessions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, 'Liste des sessions de visioconférence')
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}

// ─── POST ────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { counselor, tenantId } = await getCounselor(request)

    const body = await request.json()
    const parsed = createVisioSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      )
    }

    const { beneficiaryId, interviewId, appointmentId, roomSubject } = parsed.data

    // Verify beneficiary exists and belongs to the same tenant
    const beneficiary = await db.beneficiary.findUnique({
      where: { id: beneficiaryId },
      include: {
        user: { select: { firstName: true, lastName: true, tenantId: true } },
      },
    })

    if (!beneficiary) {
      return Errors.notFound('Bénéficiaire')
    }

    if (beneficiary.user.tenantId !== tenantId) {
      return Errors.forbidden('Ce bénéficiaire ne fait pas partie de votre organisation')
    }

    // Get tenant slug for room name
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    })

    if (!tenant) {
      return Errors.notFound('Tenant')
    }

    // Generate unique room name
    const roomName = generateRoomName(tenant.slug)

    // Build default subject if not provided
    const defaultSubject = `Entretien suivi - ${beneficiary.user.firstName || ''} ${beneficiary.user.lastName || ''}`.trim()

    // Create visio session
    const session = await db.visioSession.create({
      data: {
        tenantId,
        counselorId: counselor.id,
        beneficiaryId,
        interviewId: interviewId || null,
        appointmentId: appointmentId || null,
        roomName,
        roomSubject: roomSubject || defaultSubject,
        status: 'WAITING',
        jitsiRoomConfig: {},
      },
      include: {
        counselor: {
          select: { name: true },
        },
        beneficiary: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    const baseUrl = getJitsiBaseUrl()

    return success(
      {
        session: {
          id: session.id,
          roomName: session.roomName,
          roomSubject: session.roomSubject,
          status: session.status,
          counselorName: session.counselor.name,
          beneficiaryName: `${session.beneficiary.user.firstName || ''} ${session.beneficiary.user.lastName || ''}`.trim(),
          startedAt: session.startedAt,
          createdAt: session.createdAt.toISOString(),
        },
        joinUrl: `${baseUrl}/${session.roomName}`,
      },
      'Session de visioconférence créée avec succès',
      201,
    )
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}
