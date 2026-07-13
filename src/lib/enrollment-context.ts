// ============================================
// CreaPulse V2 — Enrollment Context Helper
// Provides utilities for enrollment-scoped business data queries
// All 7 business data tables use @@unique([userId, enrollmentId])
// ============================================

import { NextRequest } from 'next/server'

// ─── Types ───────────────────────────────────

export interface EnrollmentContext {
  userId: string
  enrollmentId: string | null  // null = legacy/default project data
}

// ─── Extract enrollment context from request ──

/**
 * Extract the enrollment ID from the request.
 * Looks for:
 * 1. Query param `enrollmentId`
 * 2. Header `X-Enrollment-Id`
 * 3. Returns null for legacy/default behavior
 */
export function getEnrollmentIdFromRequest(request: NextRequest): string | null {
  // Check query param first
  const queryEnrollmentId = request.nextUrl.searchParams.get('enrollmentId')
  if (queryEnrollmentId) return queryEnrollmentId

  // Check header
  const headerEnrollmentId = request.headers.get('X-Enrollment-Id')
  if (headerEnrollmentId) return headerEnrollmentId

  return null
}

// ─── Composite unique key builders ───────────
// Prisma generates composite unique names as: field1_field2
// For @@unique([userId, enrollmentId]) → userId_enrollmentId

/**
 * Build the `where` clause for findUnique on business data models.
 * Usage: db.businessModelCanvas.findUnique({ where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) } })
 */
export function buildCompositeKey(userId: string, enrollmentId: string | null) {
  return { userId, enrollmentId }
}

/**
 * Build the `where` clause for findFirst on business data models.
 * Usage: db.businessModelCanvas.findFirst({ where: buildWhereClause(userId, enrollmentId) })
 */
export function buildWhereClause(userId: string, enrollmentId: string | null) {
  return { userId, enrollmentId }
}

// ─── Business data model names for type-safe upsert/delete ──

export const BUSINESS_DATA_MODELS = [
  'creatorJourney',
  'financialForecast',
  'creaSimSimulation',
  'juridiqueAnalysis',
  'marketAnalysis',
  'tremplin',
  'businessModelCanvas',
  'zeroDraft',
] as const

export type BusinessDataModel = typeof BUSINESS_DATA_MODELS[number]

/**
 * Check if any project data exists for a user+enrollment combination.
 * Returns true if at least one of the 7 business data tables has a record.
 */
export async function hasProjectData(
  db: any,
  userId: string,
  enrollmentId: string | null,
): Promise<boolean> {
  const where = { userId, enrollmentId }

  // Check the most commonly populated table first (CreatorJourney)
  const journey = await db.creatorJourney.findFirst({ where, select: { id: true } })
  if (journey) return true

  // Check remaining tables in parallel
  const [bmc, forecast, market, juridique, creasim, tremplin, zeroDraft] = await Promise.all([
    db.businessModelCanvas.findFirst({ where, select: { id: true } }),
    db.financialForecast.findFirst({ where, select: { id: true } }),
    db.marketAnalysis.findFirst({ where, select: { id: true } }),
    db.juridiqueAnalysis.findFirst({ where, select: { id: true } }),
    db.creaSimSimulation.findFirst({ where, select: { id: true } }),
    db.tremplin.findFirst({ where, select: { id: true } }),
    db.zeroDraft.findFirst({ where, select: { id: true } }),
  ])

  return !!(bmc || forecast || market || juridique || creasim || tremplin || zeroDraft)
}

/**
 * Deep-clone all business data records from one enrollment to another.
 * Returns the count of records cloned.
 */
export async function cloneProjectData(
  db: any,
  userId: string,
  sourceEnrollmentId: string | null,
  targetEnrollmentId: string,
): Promise<{ cloned: number; errors: string[] }> {
  const errors: string[] = []
  let cloned = 0

  const sourceWhere = { userId, enrollmentId: sourceEnrollmentId }

  try {
    // Clone CreatorJourney
    const journey = await db.creatorJourney.findFirst({ where: sourceWhere })
    if (journey) {
      const { id, userId: _u, enrollmentId: _e, createdAt, updatedAt, ...data } = journey
      await db.creatorJourney.create({
        data: { ...data, userId, enrollmentId: targetEnrollmentId },
      })
      cloned++
    }
  } catch (e: any) {
    errors.push(`CreatorJourney: ${e.message}`)
  }

  try {
    // Clone FinancialForecast
    const forecast = await db.financialForecast.findFirst({ where: sourceWhere })
    if (forecast) {
      const { id, userId: _u, enrollmentId: _e, createdAt, updatedAt, ...data } = forecast
      await db.financialForecast.create({
        data: { ...data, userId, enrollmentId: targetEnrollmentId },
      })
      cloned++
    }
  } catch (e: any) {
    errors.push(`FinancialForecast: ${e.message}`)
  }

  try {
    // Clone CreaSimSimulation
    const sim = await db.creaSimSimulation.findFirst({ where: sourceWhere })
    if (sim) {
      const { id, userId: _u, enrollmentId: _e, createdAt, updatedAt, ...data } = sim
      await db.creaSimSimulation.create({
        data: { ...data, userId, enrollmentId: targetEnrollmentId },
      })
      cloned++
    }
  } catch (e: any) {
    errors.push(`CreaSimSimulation: ${e.message}`)
  }

  try {
    // Clone JuridiqueAnalysis
    const juridique = await db.juridiqueAnalysis.findFirst({ where: sourceWhere })
    if (juridique) {
      const { id, userId: _u, enrollmentId: _e, createdAt, updatedAt, ...data } = juridique
      await db.juridiqueAnalysis.create({
        data: { ...data, userId, enrollmentId: targetEnrollmentId },
      })
      cloned++
    }
  } catch (e: any) {
    errors.push(`JuridiqueAnalysis: ${e.message}`)
  }

  try {
    // Clone MarketAnalysis
    const market = await db.marketAnalysis.findFirst({ where: sourceWhere })
    if (market) {
      const { id, userId: _u, enrollmentId: _e, createdAt, updatedAt, ...data } = market
      await db.marketAnalysis.create({
        data: { ...data, userId, enrollmentId: targetEnrollmentId },
      })
      cloned++
    }
  } catch (e: any) {
    errors.push(`MarketAnalysis: ${e.message}`)
  }

  try {
    // Clone Tremplin
    const tremplin = await db.tremplin.findFirst({ where: sourceWhere })
    if (tremplin) {
      const { id, userId: _u, enrollmentId: _e, createdAt, updatedAt, ...data } = tremplin
      await db.tremplin.create({
        data: { ...data, userId, enrollmentId: targetEnrollmentId },
      })
      cloned++
    }
  } catch (e: any) {
    errors.push(`Tremplin: ${e.message}`)
  }

  try {
    // Clone BusinessModelCanvas
    const bmc = await db.businessModelCanvas.findFirst({ where: sourceWhere })
    if (bmc) {
      const { id, userId: _u, enrollmentId: _e, createdAt, updatedAt, ...data } = bmc
      await db.businessModelCanvas.create({
        data: { ...data, userId, enrollmentId: targetEnrollmentId },
      })
      cloned++
    }
  } catch (e: any) {
    errors.push(`BusinessModelCanvas: ${e.message}`)
  }

  try {
    // Clone ZeroDraft
    const zeroDraft = await db.zeroDraft.findFirst({ where: sourceWhere })
    if (zeroDraft) {
      const { id, userId: _u, enrollmentId: _e, createdAt, updatedAt, ...data } = zeroDraft
      await db.zeroDraft.create({
        data: { ...data, userId, enrollmentId: targetEnrollmentId },
      })
      cloned++
    }
  } catch (e: any) {
    errors.push(`ZeroDraft: ${e.message}`)
  }

  return { cloned, errors }
}

/**
 * Get a summary of project data for a user across all enrollments.
 * Used by the init-project dialog to show available projects to import.
 */
export async function getAvailableProjectsForClone(
  db: any,
  userId: string,
  excludeEnrollmentId: string,
) {
  // Get all enrollments for the user
  const enrollments = await db.userEnrollment.findMany({
    where: {
      userId,
      id: { not: excludeEnrollmentId },
      status: 'ACTIF',
    },
    include: {
      dispositif: {
        select: { id: true, code: true, name: true, color: true, icon: true },
      },
    },
  })

  // Check each enrollment for project data
  const projectsWith = await Promise.all(
    enrollments.map(async (enrollment: any) => {
      const hasData = await hasProjectData(db, userId, enrollment.id)
      return {
        enrollmentId: enrollment.id,
        dispositifCode: enrollment.dispositif.code,
        dispositifName: enrollment.dispositif.name,
        dispositifColor: enrollment.dispositif.color,
        dispositifIcon: enrollment.dispositif.icon,
        projectTitle: enrollment.projectTitle,
        hasData,
      }
    }),
  )

  // Also check legacy (null enrollmentId) project data
  const hasLegacy = await hasProjectData(db, userId, null)
  if (hasLegacy) {
    projectsWith.unshift({
      enrollmentId: null as any,
      dispositifCode: 'default',
      dispositifName: 'Projet principal',
      dispositifColor: '#6366f1',
      dispositifIcon: 'Briefcase',
      projectTitle: null,
      hasData: true,
    })
  }

  return projectsWith.filter((p) => p.hasData)
}