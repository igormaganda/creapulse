// ============================================
// CreaPulse V2 — Session Visioconférence (par ID)
// GET    /api/visio/sessions/:id — Détails de la session
// PATCH  /api/visio/sessions/:id — Mettre à jour le statut
// DELETE /api/visio/sessions/:id — Supprimer / annuler la session
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { getCounselor, AuthRequiredError, AuthForbiddenError, AuthNotFoundError } from '@/app/api/conseiller/_lib/auth'
import { z } from 'zod'

// ─── Zod schemas ─────────────────────────────

const updateStatusSchema = z.object({
  action: z.enum(['start', 'end', 'cancel'], {
    errorMap: () => ({ message: 'Action invalide (start, end, cancel)' }),
  }),
})

// ─── Helpers ─────────────────────────────────

function getJitsiBaseUrl(): string {
  if (process.env.JITSI_SELF_HOSTED_URL) {
    return process.env.JITSI_SELF_HOSTED_URL.replace(/\/+$/, '')
  }
  return (process.env.JITSI_SERVER_URL || 'https://meet.jit.si').replace(/\/+$/, '')
}

type RouteParams = {
  params: Promise<{ id: string }>
}

// ─── GET ─────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { counselor, tenantId } = await getCounselor(request)
    const { id } = await params

    const session = await db.visioSession.findUnique({
      where: { id },
      include: {
        counselor: {
          select: { id: true, name: true },
        },
        beneficiary: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        tenant: {
          select: { slug: true, name: true },
        },
      },
    })

    if (!session) {
      return Errors.notFound('Session de visioconférence')
    }

    // Ownership check: counselor must own the session or be in the same tenant
    if (session.counselorId !== counselor.id && session.tenantId !== tenantId) {
      return Errors.forbidden('Vous n\'êtes pas autorisé à accéder à cette session')
    }

    const baseUrl = getJitsiBaseUrl()

    return success({
      session: {
        id: session.id,
        roomName: session.roomName,
        roomSubject: session.roomSubject,
        status: session.status,
        counselorId: session.counselorId,
        counselorName: session.counselor.name,
        beneficiaryId: session.beneficiaryId,
        beneficiaryName: `${session.beneficiary.user.firstName || ''} ${session.beneficiary.user.lastName || ''}`.trim(),
        interviewId: session.interviewId,
        appointmentId: session.appointmentId,
        startedAt: session.startedAt?.toISOString() || null,
        endedAt: session.endedAt?.toISOString() || null,
        durationSeconds: session.durationSeconds,
        jitsiRoomConfig: session.jitsiRoomConfig,
        tenantName: session.tenant.name,
        joinUrl: `${baseUrl}/${session.roomName}`,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
    })
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}

// ─── PATCH ───────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { counselor } = await getCounselor(request)
    const { id } = await params

    const body = await request.json()
    const parsed = updateStatusSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      )
    }

    // Fetch session and check ownership
    const existingSession = await db.visioSession.findUnique({
      where: { id },
    })

    if (!existingSession) {
      return Errors.notFound('Session de visioconférence')
    }

    if (existingSession.counselorId !== counselor.id) {
      return Errors.forbidden('Vous n\'êtes pas autorisé à modifier cette session')
    }

    const { action } = parsed.data
    const now = new Date()

    // State machine: only allow valid transitions
    if (action === 'start') {
      if (existingSession.status !== 'WAITING') {
        return Errors.validation(
          [{ field: 'action', message: 'Impossible de démarrer une session qui n\'est pas en attente' }],
          'Transition de statut invalide',
        )
      }

      const updated = await db.visioSession.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          startedAt: now,
        },
      })

      // Log audit
      await db.auditLog.create({
        data: {
          tenantId: existingSession.tenantId,
          userId: counselor.userId,
          action: 'VISIO_SESSION_START',
          entityType: 'VisioSession',
          entityId: id,
          details: { roomName: existingSession.roomName },
        },
      })

      const baseUrl = getJitsiBaseUrl()

      return success({
        session: {
          id: updated.id,
          roomName: updated.roomName,
          status: updated.status,
          startedAt: updated.startedAt?.toISOString() || null,
          joinUrl: `${baseUrl}/${updated.roomName}`,
        },
      }, 'Session de visioconférence démarrée')

    } else if (action === 'end') {
      if (existingSession.status !== 'ACTIVE') {
        return Errors.validation(
          [{ field: 'action', message: 'Impossible de terminer une session qui n\'est pas active' }],
          'Transition de statut invalide',
        )
      }

      // Calculate duration
      const durationSeconds = existingSession.startedAt
        ? Math.round((now.getTime() - existingSession.startedAt.getTime()) / 1000)
        : null

      const updated = await db.visioSession.update({
        where: { id },
        data: {
          status: 'ENDED',
          endedAt: now,
          durationSeconds,
        },
      })

      // Log audit
      await db.auditLog.create({
        data: {
          tenantId: existingSession.tenantId,
          userId: counselor.userId,
          action: 'VISIO_SESSION_END',
          entityType: 'VisioSession',
          entityId: id,
          details: {
            roomName: existingSession.roomName,
            durationSeconds,
          },
        },
      })

      return success({
        session: {
          id: updated.id,
          roomName: updated.roomName,
          status: updated.status,
          endedAt: updated.endedAt?.toISOString() || null,
          durationSeconds: updated.durationSeconds,
        },
      }, 'Session de visioconférence terminée')

    } else if (action === 'cancel') {
      if (existingSession.status === 'ENDED') {
        return Errors.validation(
          [{ field: 'action', message: 'Impossible d\'annuler une session déjà terminée' }],
          'Transition de statut invalide',
        )
      }

      const updated = await db.visioSession.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          endedAt: now,
        },
      })

      return success({
        session: {
          id: updated.id,
          roomName: updated.roomName,
          status: updated.status,
        },
      }, 'Session de visioconférence annulée')
    }
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}

// ─── DELETE ──────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { counselor } = await getCounselor(request)
    const { id } = await params

    // Fetch session and check ownership
    const existingSession = await db.visioSession.findUnique({
      where: { id },
    })

    if (!existingSession) {
      return Errors.notFound('Session de visioconférence')
    }

    if (existingSession.counselorId !== counselor.id) {
      return Errors.forbidden('Vous n\'êtes pas autorisé à supprimer cette session')
    }

    // Only allow deletion of WAITING or CANCELLED sessions
    if (existingSession.status === 'ACTIVE') {
      return Errors.validation(
        [{ field: 'status', message: 'Impossible de supprimer une session active. Terminez ou annulez-la d\'abord.' }],
        'Suppression impossible',
      )
    }

    await db.visioSession.delete({
      where: { id },
    })

    return success(
      { deleted: true, id },
      'Session de visioconférence supprimée',
    )
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}
