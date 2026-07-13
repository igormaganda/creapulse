// ============================================
// CreaPulse V2 — Project Scope Helper
// Handles enrollment-scoped project data queries.
// After migration: business data tables use @@unique([userId, enrollmentId])
// enrollmentId = null means "default/legacy" project
// ============================================

/**
 * Build a Prisma `where` clause for enrollment-scoped project data.
 *
 * Usage:
 *   import { projectWhere } from '@/lib/project-scope'
 *   db.businessModelCanvas.findFirst({ where: projectWhere(userId, enrollmentId) })
 *
 * - If enrollmentId is provided → scope to that enrollment
 * - If enrollmentId is null/undefined → fallback to legacy null enrollment (default project)
 */
export function projectWhere(userId: string, enrollmentId?: string | null) {
  return { userId, enrollmentId: enrollmentId ?? null }
}

/**
 * Build a Prisma `where` clause for upsert operations.
 * Since the unique constraint is [userId, enrollmentId], upsert needs the compound key.
 */
export function projectUpsertKey(userId: string, enrollmentId?: string | null) {
  return { userId_enrollmentId: { userId, enrollmentId: enrollmentId ?? null } }
}

/**
 * Extract enrollmentId from request (query param or header).
 * API routes pass it as ?enrollmentId=xxx or X-Enrollment-Id header.
 */
export function getEnrollmentIdFromRequest(request: Request): string | null {
  const url = new URL(request.url)
  const fromQuery = url.searchParams.get('enrollmentId')
  if (fromQuery) return fromQuery
  const fromHeader = request.headers.get('x-enrollment-id')
  return fromHeader
}