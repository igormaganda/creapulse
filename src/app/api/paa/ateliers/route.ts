// ============================================
// CreaPulse V2 — PAA Ateliers API
// GET  /api/paa/ateliers  — Get atelier sessions + available ateliers
// POST /api/paa/ateliers  — Start/complete an atelier
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'

// ─── Validation schemas ────────────────────

const AtelierStatusValues = ['IN_PROGRESS', 'COMPLETE'] as const

const CreateAtelierSessionBody = z.object({
  atelierCode: z.string().min(1),
  atelierName: z.string().min(1).max(200),
  status: z.enum(AtelierStatusValues),
})

// ─── Available ateliers catalog ────────────
// These codes represent the standard PAA atelier catalog.
// In a real implementation, this could come from a database table.

const AVAILABLE_ATELIERS = [
  { code: 'CREA_VISION', name: 'Vision créative' },
  { code: 'CREA_BUSINESS_MODEL', name: 'Modèle économique créatif' },
  { code: 'CREA_MARKETING', name: 'Marketing créatif' },
  { code: 'CREA_FINANCE', name: 'Finance et gestion' },
  { code: 'CREA_JURIDIQUE', name: 'Juridique et statuts' },
  { code: 'CREA_NETWORKING', name: 'Réseautage et partenariats' },
  { code: 'CREA_PITCH', name: 'Pitch et présentation' },
  { code: 'CREA_DIGITAL', name: 'Présence digitale' },
] as const

// ─── GET: Get atelier sessions ───────────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const program = await db.paaProgram.findFirst({
      where: {
        userId: payload.userId,
        tenantId: payload.tenantId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!program) {
      return Errors.notFound('Programme PAA')
    }

    const sessions = await db.paaAtelierSession.findMany({
      where: { programId: program.id },
      orderBy: { createdAt: 'desc' },
    })

    // Determine which ateliers from the catalog have not yet been completed
    const completedCodes = new Set(
      sessions.filter((s) => s.status === 'COMPLETE').map((s) => s.atelierCode),
    )
    const available = AVAILABLE_ATELIERS.filter((a) => !completedCodes.has(a.code))

    return success({
      sessions,
      completedCount: completedCodes.size,
      totalCount: AVAILABLE_ATELIERS.length,
      available,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Start/complete an atelier ──────

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const { payload } = auth

    const body = await request.json()
    const { atelierCode, atelierName, status } = CreateAtelierSessionBody.parse(body)

    const program = await db.paaProgram.findFirst({
      where: {
        userId: payload.userId,
        tenantId: payload.tenantId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!program) {
      return Errors.notFound('Programme PAA')
    }

    // Upsert: create or update existing session for this atelier
    const existing = await db.paaAtelierSession.findFirst({
      where: {
        programId: program.id,
        atelierCode,
      },
    })

    if (existing) {
      // Update existing session
      const updated = await db.paaAtelierSession.update({
        where: { id: existing.id },
        data: {
          atelierName,
          status,
          completedAt: status === 'COMPLETE' ? new Date() : null,
        },
      })

      return success(updated, 'Atelier mis à jour')
    }

    // Create new session
    const session = await db.paaAtelierSession.create({
      data: {
        programId: program.id,
        atelierCode,
        atelierName,
        status,
        completedAt: status === 'COMPLETE' ? new Date() : null,
      },
    })

    return success(session, 'Session atelier créée', 201)
  } catch (err) {
    return handleApiError(err)
  }
}
