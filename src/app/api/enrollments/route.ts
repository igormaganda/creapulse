// ============================================
// CreaPulse V2 — Enrollments API
// GET  /api/enrollments  — Fetch user's active enrollments
// POST /api/enrollments  — Enroll user in a dispositif
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import { hasProjectData } from '@/lib/enrollment-context'

// ─── Validation ─────────────────────────────

const EnrollBody = z.object({
  dispositifCode: z.string().min(1, 'Le code du dispositif est requis'),
})

// ─── GET: Fetch user's enrollments ──────────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof NextResponse) return auth

    const { userId, tenantId } = auth

    const enrollments = await db.userEnrollment.findMany({
      where: {
        userId,
        tenantId,
        status: 'ACTIF',
      },
      include: {
        dispositif: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            type: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: {
        dispositif: { sortOrder: 'asc' },
      },
    })

    // Enrich with project data status
    const enriched = await Promise.all(enrollments.map(async (e) => ({
      id: e.dispositif.id,
      code: e.dispositif.code,
      name: e.dispositif.name,
      description: e.dispositif.description,
      type: e.dispositif.type,
      color: e.dispositif.color,
      icon: e.dispositif.icon,
      progress: e.progress,
      status: e.status,
      projectTitle: e.projectTitle,
      hasProjectData: await hasProjectData(db, userId, e.id),
    })))

    // Active ID: prefer BASE type, otherwise first enrollment
    const activeId =
      enriched.find((e) => e.type === 'BASE')?.id
      ?? enriched[0]?.id
      ?? null

    return success({ enrollments: enriched, activeId })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Enroll in a dispositif ───────────

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof NextResponse) return auth

    const { userId, tenantId } = auth

    // Parse & validate body
    const body = await request.json()
    const parsed = EnrollBody.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(parsed.error.issues)
    }
    const { dispositifCode } = parsed.data

    // 1. Find the dispositif for this tenant
    const dispositif = await db.dispositif.findFirst({
      where: {
        tenantId,
        code: dispositifCode,
        isActive: true,
      },
    })

    if (!dispositif) {
      return Errors.notFound('Dispositif')
    }

    // 2. Check if already enrolled
    const existing = await db.userEnrollment.findUnique({
      where: {
        userId_dispositifId: {
          userId,
          dispositifId: dispositif.id,
        },
      },
    })

    if (existing) {
      // If already ACTIF, just return it
      if (existing.status === 'ACTIF') {
        return success({
          enrollment: {
            id: dispositif.id,
            code: dispositif.code,
            name: dispositif.name,
            description: dispositif.description,
            type: dispositif.type,
            color: dispositif.color,
            icon: dispositif.icon,
            progress: existing.progress,
            status: existing.status,
            projectTitle: existing.projectTitle,
          },
          activeId: dispositif.type === 'BASE' ? dispositif.id : null,
        }, 'Déjà inscrit à ce dispositif.')
      }

      // If suspended/abandoned, reactivate
      const reactivated = await db.userEnrollment.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIF',
          startedAt: existing.startedAt ?? new Date(),
          pausedAt: null,
        },
      })

      return success({
        enrollment: {
          id: dispositif.id,
          code: dispositif.code,
          name: dispositif.name,
          description: dispositif.description,
          type: dispositif.type,
          color: dispositif.color,
          icon: dispositif.icon,
          progress: reactivated.progress,
          status: reactivated.status,
          projectTitle: reactivated.projectTitle,
        },
        activeId: dispositif.type === 'BASE' ? dispositif.id : null,
      }, 'Dispositif réactivé avec succès.')
    }

    // 3. Create new enrollment
    const enrollment = await db.userEnrollment.create({
      data: {
        userId,
        tenantId,
        dispositifId: dispositif.id,
        status: 'ACTIF',
        startedAt: new Date(),
      },
    })

    return success(
      {
        enrollment: {
          id: dispositif.id,
          code: dispositif.code,
          name: dispositif.name,
          description: dispositif.description,
          type: dispositif.type,
          color: dispositif.color,
          icon: dispositif.icon,
          progress: enrollment.progress,
          status: enrollment.status,
          projectTitle: enrollment.projectTitle,
        },
        activeId: dispositif.type === 'BASE' ? dispositif.id : null,
      },
      'Inscription au dispositif réussie.',
      201,
    )
  } catch (err) {
    return handleApiError(err)
  }
}