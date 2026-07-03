// ============================================
// CreaPulse V4 — Business Plan Versioning (Snapshots)
// GET    /api/business-plan/snapshots        — List snapshots (desc)
// POST   /api/business-plan/snapshots        — Create snapshot
// POST   /api/business-plan/snapshots        — action=restore  — Restore from snapshot
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

// ─── Validation ───

const restoreSchema = z.object({
  action: z.literal('restore'),
  snapshotId: z.string().min(1),
})

const createSnapshotSchema = z.object({
  trigger: z.enum(['manual', 'auto', 'sync', 'ai-generate']).optional().default('manual'),
})

// ─── Helpers ───

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') {
    return Object.values(value).some((v) =>
      typeof v === 'string' && v.trim().length > 0 ||
      typeof v === 'number' && v !== 0 ||
      Array.isArray(v) && v.length > 0
    )
  }
  return false
}

function computeWordCount(value: unknown): number {
  if (typeof value === 'string') return value.trim().split(/\s+/).filter(Boolean).length
  return 0
}

function formatFrenchDate(date: Date): string {
  return `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

// ─── Restore handler ───

async function handleRestore(auth: { userId: string; tenantId: string }, snapshotId: string) {
  // Find the snapshot (must belong to current user)
  const snapshot = await db.bpSnapshot.findUnique({
    where: { id: snapshotId, userId: auth.userId },
    select: {
      id: true,
      version: true,
      label: true,
      bpSections: true,
      bpProjectContext: true,
    },
  })

  if (!snapshot) {
    return Errors.notFound('Snapshot')
  }

  // Get current journey state
  const journey = await db.creatorJourney.findUnique({
    where: { userId: auth.userId },
    select: { id: true, bpSections: true },
  })

  if (!journey) {
    return Errors.notFound('Parcours créatif')
  }

  // 1. Auto-save current state before restoring
  const currentSections = (journey.bpSections as Record<string, unknown>) ?? {}
  const currentSectionCount = Object.values(currentSections).filter(isFilled).length
  const currentWordCount = Object.values(currentSections).reduce<number>(
    (sum, v) => sum + computeWordCount(v), 0,
  )

  const lastSnapshot = await db.bpSnapshot.findFirst({
    where: { userId: auth.userId },
    orderBy: { version: 'desc' },
    select: { version: true },
  })
  const preRestoreVersion = (lastSnapshot?.version ?? 0) + 1

  await db.bpSnapshot.create({
    data: {
      userId: auth.userId,
      tenantId: auth.tenantId,
      creatorJourneyId: journey.id,
      bpSections: journey.bpSections as Prisma.InputJsonValue,
      bpProjectContext: {},
      version: preRestoreVersion,
      label: `V${preRestoreVersion} — ${formatFrenchDate(new Date())} (auto-save avant restauration)`,
      trigger: 'auto',
      sectionCount: currentSectionCount,
      wordCount: currentWordCount,
    },
  })

  // 2. Restore snapshot data to CreatorJourney
  const restoredSections = snapshot.bpSections as Record<string, unknown>
  const restoredCount = Object.values(restoredSections).filter(isFilled).length
  const restoredBpScore = Math.min(100, Math.round((restoredCount / 24) * 100))

  await db.creatorJourney.update({
    where: { userId: auth.userId },
    data: {
      bpSections: snapshot.bpSections as Prisma.InputJsonValue,
      bpScore: restoredBpScore,
      bpGeneratedAt: new Date(),
    },
  })

  return success(
    {
      restoredFrom: {
        id: snapshot.id,
        version: snapshot.version,
        label: snapshot.label,
      },
      preRestoreSnapshotVersion: preRestoreVersion,
      bpScore: restoredBpScore,
      sectionCount: restoredCount,
    },
    `BP restauré depuis ${snapshot.label}`,
  )
}

// ─── GET: List snapshots ────────────────────

export async function GET(request: NextRequest) {
  const auth = await withAuth(request)
  if (!('userId' in auth)) return auth

  try {
    const snapshots = await db.bpSnapshot.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        version: true,
        label: true,
        trigger: true,
        sectionCount: true,
        wordCount: true,
        createdAt: true,
      },
    })

    const total = await db.bpSnapshot.count({
      where: { userId: auth.userId },
    })

    return success(
      { snapshots, total },
      `${snapshots.length} snapshot(s) chargé(s)`,
    )
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Create snapshot or Restore ────────

export async function POST(request: NextRequest) {
  const auth = await withAuth(request)
  if (!('userId' in auth)) return auth

  try {
    const body = await request.json()

    // ── action=restore ──
    if (body.action === 'restore') {
      const parsed = restoreSchema.safeParse(body)
      if (!parsed.success) {
        return Errors.validation(
          parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        )
      }
      return handleRestore(auth as { userId: string; tenantId: string }, parsed.data.snapshotId)
    }

    // ── Create snapshot (default) ──
    const parsed = createSnapshotSchema.safeParse(body)
    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
      )
    }

    const trigger = parsed.data.trigger

    // Read current BP data
    const journey = await db.creatorJourney.findUnique({
      where: { userId: auth.userId },
      select: {
        id: true,
        bpSections: true,
        projectTitle: true,
        projectSector: true,
        projectDescription: true,
        targetAudience: true,
        valueProposition: true,
      },
    })

    if (!journey) {
      return Errors.notFound('Parcours créatif')
    }

    const bpSections = (journey.bpSections as Record<string, unknown>) ?? {}

    // Compute stats
    const sectionCount = Object.values(bpSections).filter(isFilled).length
    const wordCount = Object.values(bpSections).reduce<number>(
      (sum, v) => sum + computeWordCount(v), 0,
    )

    // Compute version
    const lastSnapshot = await db.bpSnapshot.findFirst({
      where: { userId: auth.userId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const version = (lastSnapshot?.version ?? 0) + 1

    // Auto-generate label
    const now = new Date()
    const label = `V${version} — ${formatFrenchDate(now)}`

    // Build project context snapshot
    const bpProjectContext = {
      projectTitle: journey.projectTitle,
      projectSector: journey.projectSector,
      projectDescription: journey.projectDescription,
      targetAudience: journey.targetAudience,
      valueProposition: journey.valueProposition,
    }

    const snapshot = await db.bpSnapshot.create({
      data: {
        userId: auth.userId,
        tenantId: auth.tenantId,
        creatorJourneyId: journey.id,
        bpSections: bpSections as Prisma.InputJsonValue,
        bpProjectContext: bpProjectContext as Prisma.InputJsonValue,
        version,
        label,
        trigger,
        sectionCount,
        wordCount,
      },
    })

    return success(
      {
        id: snapshot.id,
        version: snapshot.version,
        label: snapshot.label,
        trigger: snapshot.trigger,
        sectionCount: snapshot.sectionCount,
        wordCount: snapshot.wordCount,
        createdAt: snapshot.createdAt,
      },
      `Snapshot V${version} créé`,
    )
  } catch (err) {
    return handleApiError(err)
  }
}