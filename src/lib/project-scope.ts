// ============================================
// CreaPulse V2 — Project Scope Helper
// SHIM: enrollmentId not yet in schema — all functions return { userId } only.
// ============================================

/**
 * Build a Prisma `where` clause for enrollment-scoped project data.
 * SHIM: ignores enrollmentId since schema doesn't have it yet.
 */
export function projectWhere(userId: string, _enrollmentId?: string | null) {
  return { userId }
}

/**
 * Build a Prisma `where` clause for upsert operations.
 * SHIM: returns { userId } since the unique constraint is just [userId].
 */
export function projectUpsertKey(userId: string, _enrollmentId?: string | null) {
  return { userId }
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