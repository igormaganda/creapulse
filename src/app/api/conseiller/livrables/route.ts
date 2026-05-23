// ============================================
// CreaPulse V2 — Conseiller Livrables
// GET /api/conseiller/livrables — List livrables
// PUT /api/conseiller/livrables — Update livrable status
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { getCounselor, AuthRequiredError, AuthForbiddenError, AuthNotFoundError } from '../_lib/auth'
import { z } from 'zod'

// ─── Zod schemas ─────────────────────────────

const updateLivrableSchema = z.object({
  id: z.string().min(1, 'L\'identifiant du livrable est requis'),
  status: z.enum(['DRAFT', 'VALIDATED'], {
    errorMap: () => ({ message: 'Statut invalide (DRAFT ou VALIDATED)' }),
  }),
  notes: z.string().optional(),
})

// ─── GET ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { counselor } = await getCounselor(request)

    // Parse query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    // Build where clause
    const where: Record<string, unknown> = {
      counselorId: counselor.id,
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { owner: { firstName: { contains: search, mode: 'insensitive' } } },
        { owner: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [total, livrables] = await Promise.all([
      db.livrable.count({ where }),
      db.livrable.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ])

    const statusLabels: Record<string, string> = {
      DRAFT: 'Brouillon',
      GENERATING: 'En cours de génération',
      READY: 'Prêt',
      VALIDATED: 'Validé',
      EXPORTED: 'Exporté',
    }

    const formattedLivrables = livrables.map((l) => {
      const ownerName = l.owner
        ? `${l.owner.firstName || ''} ${l.owner.lastName || ''}`.trim()
        : 'Utilisateur inconnu'
      const initials = l.owner
        ? `${(l.owner.firstName || '')[0] || ''}${(l.owner.lastName || '')[0] || ''}`.toUpperCase()
        : '??'

      return {
        id: l.id,
        userId: l.userId,
        beneficiaryId: l.userId,
        beneficiaryName: ownerName,
        beneficiaryInitials: initials,
        type: l.type,
        title: l.title,
        status: l.status,
        statusLabel: statusLabels[l.status] || l.status,
        createdAt: l.createdAt.toISOString(),
        generatedAt: l.generatedAt?.toISOString() || null,
        content: l.content,
        fileUrl: l.fileUrl,
        fileName: l.fileName,
      }
    })

    return success({
      livrables: formattedLivrables,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, 'Liste des livrables')
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}

// ─── PUT ─────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const { counselor } = await getCounselor(request)

    const body = await request.json()
    const parsed = updateLivrableSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      )
    }

    const { id, status, notes } = parsed.data

    // Verify livrable belongs to this counselor
    const livrable = await db.livrable.findUnique({
      where: { id },
    })

    if (!livrable) {
      return Errors.notFound('Livrable')
    }

    if (livrable.counselorId !== counselor.id) {
      return Errors.forbidden('Ce livrable ne vous est pas assigné')
    }

    // Update livrable
    const updated = await db.livrable.update({
      where: { id },
      data: {
        status,
        ...(notes !== undefined && {
          content: { ...(typeof livrable.content === 'object' ? livrable.content : {}), counselorNotes: notes },
        }),
      },
    })

    return success(
      {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      },
      status === 'VALIDATED' ? 'Livrable validé avec succès' : 'Livrable renvoyé en brouillon',
    )
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}
