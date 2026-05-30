import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken, hasMinRole } from '@/lib/auth'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'

// ─── Zod Schemas ──────────────────────────────

const createDeletionSchema = z.object({
  reason: z.string().max(2000).optional(),
})

const reviewDeletionSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    message: 'L\'action doit être "approve" ou "reject"',
  }),
  notes: z.string().max(2000).optional(),
})

// ─── POST: Créer une demande de suppression (utilisateur) ─────────

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) return Errors.unauthorized('Token manquant')

    const payload = await verifyToken(token)
    const userId = payload.userId

    const body = await request.json().catch(() => ({}))
    const parsed = createDeletionSchema.safeParse(body)
    if (!parsed.success) return Errors.validation(parsed.error.issues)

    const { reason } = parsed.data

    // Vérifier qu'il n'y a pas déjà une demande en cours
    const existingPending = await db.dataDeletionRequest.findFirst({
      where: {
        userId,
        status: 'pending',
      },
    })

    if (existingPending) {
      return Errors.validation(
        { field: 'status', message: 'Une demande de suppression est déjà en cours' },
        'Une demande de suppression est déjà en attente',
      )
    }

    const deletionRequest = await db.dataDeletionRequest.create({
      data: {
        userId,
        reason: reason || null,
        status: 'pending',
      },
    })

    return success(
      {
        id: deletionRequest.id,
        status: deletionRequest.status,
        requestedAt: deletionRequest.requestedAt || deletionRequest.createdAt,
      },
      'Demande de suppression créée avec succès',
      201,
    )
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PATCH: Approuver ou rejeter une demande (conseiller/admin) ───

export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) return Errors.unauthorized('Token manquant')

    const payload = await verifyToken(token)

    // Vérifier les droits : conseiller ou admin uniquement
    if (!hasMinRole(payload.role, 'COUNSELOR')) {
      return Errors.forbidden(
        'Seuls les conseillers et administrateurs peuvent examiner les demandes de suppression',
      )
    }

    const body = await request.json()
    const parsed = reviewDeletionSchema.safeParse(body)
    if (!parsed.success) return Errors.validation(parsed.error.issues)

    const { action, notes } = parsed.data
    const reviewerId = payload.userId

    // Trouver la demande à examiner
    // On accepte l'ID dans le body pour cibler une demande spécifique
    const requestIdSchema = z.object({
      requestId: z.string().min(1, 'ID de demande requis'),
    })
    const requestIdParsed = requestIdSchema.safeParse(body)
    if (!requestIdParsed.success) {
      return Errors.validation(
        requestIdParsed.error.issues,
        'L\'identifiant de la demande (requestId) est requis',
      )
    }

    const requestId = requestIdParsed.data.requestId

    const deletionRequest = await db.dataDeletionRequest.findUnique({
      where: { id: requestId },
    })

    if (!deletionRequest) {
      return Errors.notFound('Demande de suppression')
    }

    if (deletionRequest.status !== 'pending') {
      return Errors.validation(
        { field: 'status', message: 'Cette demande n\'est plus en attente' },
        'La demande a déjà été traitée',
      )
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const updated = await db.dataDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        notes: notes || null,
        ...(action === 'approve' ? { processedAt: new Date() } : {}),
      },
    })

    const message =
      action === 'approve'
        ? 'Demande de suppression approuvée'
        : 'Demande de suppression rejetée'

    return success(
      {
        id: updated.id,
        userId: updated.userId,
        status: updated.status,
        reviewedAt: updated.reviewedAt,
        notes: updated.notes,
      },
      message,
    )
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── GET: Lister les demandes de suppression (utilisateur ou admin) ─

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) return Errors.unauthorized('Token manquant')

    const payload = await verifyToken(token)
    const userId = payload.userId

    // Les conseillers et admins voient toutes les demandes
    if (hasMinRole(payload.role, 'COUNSELOR')) {
      const allRequests = await db.dataDeletionRequest.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      })

      return success(allRequests, 'Toutes les demandes de suppression récupérées')
    }

    // Un utilisateur ne voit que ses propres demandes
    const userRequests = await db.dataDeletionRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        reason: true,
        reviewedAt: true,
        processedAt: true,
        notes: true,
        createdAt: true,
      },
    })

    return success(userRequests, 'Demandes de suppression récupérées avec succès')
  } catch (err) {
    return handleApiError(err)
  }
}
