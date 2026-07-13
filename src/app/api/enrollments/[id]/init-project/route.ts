// ============================================
// CreaPulse V2 — Init Project API
// POST /api/enrollments/[id]/init-project
// Initialize project data for an enrollment:
//   mode: 'new'     → empty project (just mark as initialized)
//   mode: 'import'  → clone project data from another enrollment
//   mode: 'legacy'  → clone from legacy (enrollmentId=null) data
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import { cloneProjectData, hasProjectData, getAvailableProjectsForClone } from '@/lib/enrollment-context'

// ─── Validation ─────────────────────────────

const InitProjectBody = z.object({
  mode: z.enum(['new', 'import', 'legacy']),
  sourceEnrollmentId: z.string().optional(),
  projectTitle: z.string().max(200).optional(),
})

// ─── GET: Available projects for cloning ────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof NextResponse) return auth

    const { userId } = auth
    const { id: enrollmentId } = await params

    // Verify the enrollment belongs to the user
    const enrollment = await db.userEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, userId: true, projectTitle: true },
    })

    if (!enrollment || enrollment.userId !== userId) {
      return Errors.notFound('Inscription')
    }

    // Check if already initialized
    const alreadyHasData = await hasProjectData(db, userId, enrollmentId)

    // Get available projects for cloning
    const availableProjects = await getAvailableProjectsForClone(db, userId, enrollmentId)

    return success({
      enrollmentId,
      projectTitle: enrollment.projectTitle,
      isInitialized: alreadyHasData,
      availableProjects,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Initialize project ───────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof NextResponse) return auth

    const { userId, tenantId } = auth
    const { id: enrollmentId } = await params

    // Parse & validate
    const body = await request.json()
    const parsed = InitProjectBody.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(parsed.error.issues)
    }
    const { mode, sourceEnrollmentId, projectTitle } = parsed.data

    // Verify the enrollment belongs to the user
    const enrollment = await db.userEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        dispositif: { select: { id: true, code: true, name: true } },
      },
    })

    if (!enrollment || enrollment.userId !== userId) {
      return Errors.notFound('Inscription')
    }

    // Check if already initialized
    const alreadyHasData = await hasProjectData(db, userId, enrollmentId)
    if (alreadyHasData) {
      return Errors.badRequest('Ce dispositif a déjà des données de projet. Vous ne pouvez pas le réinitialiser depuis cette interface.')
    }

    // ─── Mode: NEW (empty project) ──────────
    if (mode === 'new') {
      // Create an empty CreatorJourney as the project anchor
      await db.creatorJourney.create({
        data: {
          userId,
          enrollmentId,
          phase: 'DISCOVERY',
        },
      })

      // Update project title if provided
      if (projectTitle) {
        await db.userEnrollment.update({
          where: { id: enrollmentId },
          data: { projectTitle },
        })
      }

      return success({
        enrollmentId,
        mode: 'new',
        projectTitle: projectTitle ?? enrollment.dispositif.name,
        cloned: 0,
      }, 'Nouveau projet créé avec succès.', 201)
    }

    // ─── Mode: LEGACY (import from null enrollmentId) ──
    if (mode === 'legacy') {
      // Check if legacy data exists
      const hasLegacy = await hasProjectData(db, userId, null)
      if (!hasLegacy) {
        return Errors.badRequest('Aucune donnée de projet existante à importer.')
      }

      const { cloned, errors } = await cloneProjectData(
        db, userId, null, enrollmentId,
      )

      if (cloned === 0) {
        return Errors.badRequest('Aucune donnée n\'a pu être importée.')
      }

      return success({
        enrollmentId,
        mode: 'legacy',
        cloned,
        errors: errors.length > 0 ? errors : undefined,
      }, `${cloned} élément(s) importé(s) depuis votre projet principal.`, 201)
    }

    // ─── Mode: IMPORT (clone from another enrollment) ──
    if (mode === 'import') {
      if (!sourceEnrollmentId) {
        return Errors.validation([{ path: ['sourceEnrollmentId'], message: 'L\'enrollment source est requis pour le mode import.' }])
      }

      // Verify source enrollment exists and belongs to user
      const sourceEnrollment = await db.userEnrollment.findUnique({
        where: { id: sourceEnrollmentId },
        select: { id: true, userId: true },
      })

      if (!sourceEnrollment || sourceEnrollment.userId !== userId) {
        return Errors.notFound('Enrollment source')
      }

      // Check source has data
      const sourceHasData = await hasProjectData(db, userId, sourceEnrollmentId)
      if (!sourceHasData) {
        return Errors.badRequest('L\'enrollment source n\'a pas de données de projet à cloner.')
      }

      const { cloned, errors } = await cloneProjectData(
        db, userId, sourceEnrollmentId, enrollmentId,
      )

      if (cloned === 0) {
        return Errors.badRequest('Aucune donnée n\'a pu être clonée.')
      }

      return success({
        enrollmentId,
        mode: 'import',
        sourceEnrollmentId,
        cloned,
        errors: errors.length > 0 ? errors : undefined,
      }, `${cloned} élément(s) cloné(s) depuis l'autre dispositif.`, 201)
    }

    return Errors.badRequest('Mode non reconnu.')
  } catch (err) {
    return handleApiError(err)
  }
}