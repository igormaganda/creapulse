// ============================================
// CreaPulse V2 — Business Plan IA API
// GET    /api/business-plan           — Retrieve saved BP sections
// PUT    /api/business-plan           — Save BP sections (bulk or single)
// POST   /api/business-plan           — AI actions:
//   action=ai-suggest                — Section-level AI suggestion
//   action=generate-from-parcours    — Generate full BP from Parcours data
//   action=sync-simulators           — Sync simulator data into BP sections
// ============================================
// Pipeline V4 additions: bpSectionMeta, per-section timestamps,
//   auto-snapshots, save-section action
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { callZAI, parseJSONFromAI, getZAIErrorMessage, aiUnavailableResponse, aiErrorResponse } from '@/lib/zai-helper'
import type { DataSource } from '@/lib/pipeline-types'
import { createNotification } from '@/lib/notifications'
import { createLogger } from '@/lib/logger'
import { getEnrollmentIdFromRequest, buildCompositeKey } from '@/lib/enrollment-context'

const log = createLogger('api/business-plan')

// ─── Validation Schemas ──────────────────────

const aiSuggestSchema = z.object({
  action: z.literal('ai-suggest'),
  sectionId: z.string(),
  sectionTitle: z.string(),
  existingContent: z.string().optional(),
  projectContext: z.string().optional(),
})

const generateFromParcoursSchema = z.object({
  action: z.literal('generate-from-parcours'),
})

const syncSimulatorsSchema = z.object({
  action: z.literal('sync-simulators'),
})

const bpActionSchema = z.discriminatedUnion('action', [
  aiSuggestSchema,
  generateFromParcoursSchema,
  syncSimulatorsSchema,
])

const saveBpSchema = z.object({
  sections: z.record(z.string(), z.unknown()).optional(),
  bpStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DRAFT', 'SUBMITTED']).optional(),
})

// ─── bpSectionMeta Types (Pipeline V4) ───────

export interface SectionMetaEntry {
  source: DataSource
  lastModified: string
  manuallyEditedAt: string | null
  syncedAt: string | null
  wordCount: number
  version: number
}

export type BpSectionMeta = Record<string, SectionMetaEntry>

// ─── Helpers ─────────────────────────────────

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

const SYNC_SOURCES: DataSource[] = ['marche', 'financier', 'juridique', 'creasim', 'parcours']

function buildSectionMetaForManual(
  existingMeta: BpSectionMeta,
  sectionId: string,
  content: unknown,
): SectionMetaEntry {
  const prev = existingMeta[sectionId]
  return {
    source: 'manual' as DataSource,
    lastModified: new Date().toISOString(),
    manuallyEditedAt: new Date().toISOString(),
    syncedAt: prev?.syncedAt ?? null,
    wordCount: computeWordCount(content),
    version: (prev?.version ?? 0) + 1,
  }
}

function buildSectionMetaForSync(
  existingMeta: BpSectionMeta,
  sectionId: string,
  content: unknown,
  source: 'marche' | 'financier' | 'juridique' | 'creasim' | 'parcours',
): SectionMetaEntry {
  const prev = existingMeta[sectionId]
  return {
    source,
    lastModified: new Date().toISOString(),
    manuallyEditedAt: prev?.manuallyEditedAt ?? null,
    syncedAt: new Date().toISOString(),
    wordCount: computeWordCount(content),
    version: (prev?.version ?? 0) + 1,
  }
}

/** Auto-create a snapshot if last one is older than 5 minutes (debounce) */
async function maybeAutoSnapshot(
  userId: string,
  journeyId: string,
  tenantId: string,
  bpSections: Record<string, unknown>,
  bpProjectContext: Record<string, unknown> | null,
  trigger: 'auto' | 'ai-generate' = 'auto',
) {
  try {
    const lastSnapshot = await db.bpSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, version: true },
    })
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000)
    if (lastSnapshot && lastSnapshot.createdAt > fiveMinAgo) return

    const sectionCount = Object.values(bpSections).filter(isFilled).length
    const wordCount = Object.values(bpSections).reduce(
      (sum: number, v) => sum + computeWordCount(v), 0,
    )
    const version: number = (lastSnapshot?.version ?? 0) + 1
    const now = new Date()
    const label = `V${version} — ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`

    await db.bpSnapshot.create({
      data: {
        userId,
        tenantId,
        creatorJourneyId: journeyId,
        bpSections: bpSections as Prisma.InputJsonValue,
        bpProjectContext: (bpProjectContext ?? {}) as Prisma.InputJsonValue,
        version,
        label,
        trigger,
        sectionCount,
        wordCount,
      },
    })
  } catch (err) {
    // Non-critical: log but don't fail the parent operation
    console.error('[AutoSnapshot] Failed to create auto-snapshot:', err)
  }
}

// ─── Helper: Auth from request ───────────────

async function getAuth(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const headerToken = getTokenFromHeader(request)
  const token = cookieToken || headerToken
  if (!token) throw Object.assign(new Error('No session token found'), { code: 'UNAUTHORIZED' })
  return verifyToken(token)
}

// ─── Helper: Parse JSON from LLM response ───

function parseJsonFromLLM(text: string): Record<string, string> | null {
  // Try direct JSON parse first
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed === 'object' && parsed !== null) return parsed
  } catch {}

  // Try matching JSON block
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (typeof parsed === 'object' && parsed !== null) return parsed
    } catch {}
  }

  return null
}

// ─── GET: Retrieve business plan ─────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request)
    const enrollmentId = getEnrollmentIdFromRequest(request)

    const journey = await db.creatorJourney.findUnique({
      where: { userId_enrollmentId: buildCompositeKey(payload.userId, enrollmentId) },
      select: {
        bpSections: true,
        bpStatus: true,
        bpScore: true,
        bpGeneratedAt: true,
        bpValidatedAt: true,
        bpValidatedBy: true,
        projectTitle: true,
        projectSector: true,
        projectStage: true,
        targetAudience: true,
        valueProposition: true,
      },
    })

    if (!journey) {
      return success(
        {
          sections: {},
          bpStatus: 'NOT_STARTED',
          bpScore: null,
          projectContext: null,
        },
        'Aucun business plan enregistré',
      )
    }

    return success(
      {
        sections: journey.bpSections ?? {},
        bpStatus: journey.bpStatus,
        bpScore: journey.bpScore,
        bpGeneratedAt: journey.bpGeneratedAt,
        bpValidatedAt: journey.bpValidatedAt,
        projectContext: {
          projectTitle: journey.projectTitle,
          projectSector: journey.projectSector,
          projectStage: journey.projectStage,
          targetAudience: journey.targetAudience,
          valueProposition: journey.valueProposition,
        },
      },
      'Business plan chargé',
    )
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée — veuillez vous reconnecter')
      }
    }
    return handleApiError(err)
  }
}

// ─── PUT: Save business plan (bulk or single) ──

export async function PUT(request: NextRequest) {
  try {
    const payload = await getAuth(request)
    const enrollmentId = getEnrollmentIdFromRequest(request)
    const body = await request.json()

    // ── Single-section save: action=save-section ──
    if (body.action === 'save-section') {
      const { sectionId, content } = body
      if (!sectionId || content === undefined) {
        return Errors.validation([{ field: 'sectionId/content', message: 'sectionId et content sont requis' }])
      }

      const existingJourney = await db.creatorJourney.findUnique({
        where: { userId_enrollmentId: buildCompositeKey(payload.userId, enrollmentId) },
        select: {
          id: true, bpSections: true, bpSectionMeta: true,
          bpStatus: true, bpScore: true, userId: true,
          user: { select: { tenantId: true } },
        },
      })

      const existingSections = (existingJourney?.bpSections as Record<string, unknown>) ?? {}
      const existingMeta = (existingJourney?.bpSectionMeta as unknown as BpSectionMeta) ?? {}

      // Update the section
      existingSections[sectionId] = content

      // Update metadata for this section only
      existingMeta[sectionId] = buildSectionMetaForManual(existingMeta, sectionId, content)

      // Recalculate bpScore
      const filledSections = Object.values(existingSections).filter(isFilled).length
      const bpScore = Math.min(100, Math.round((filledSections / 24) * 100))

      let status = existingJourney?.bpStatus ?? 'IN_PROGRESS'
      if (filledSections === 0) status = 'NOT_STARTED'
      else if (filledSections === 24) status = 'DRAFT'
      else status = 'IN_PROGRESS'

      const journey = await db.creatorJourney.upsert({
        where: { userId_enrollmentId: buildCompositeKey(payload.userId, enrollmentId) },
        create: {
          userId: payload.userId,
          enrollmentId,
          bpSections: existingSections as Prisma.InputJsonValue,
          bpSectionMeta: existingMeta as unknown as Prisma.InputJsonValue,
          bpStatus: status as 'NOT_STARTED' | 'IN_PROGRESS' | 'GENERATING' | 'DRAFT' | 'REVIEW' | 'VALIDATED' | 'EXPORTED',
          bpScore,
        },
        update: {
          bpSections: existingSections as Prisma.InputJsonValue,
          bpSectionMeta: existingMeta as unknown as Prisma.InputJsonValue,
          bpStatus: status as 'NOT_STARTED' | 'IN_PROGRESS' | 'GENERATING' | 'DRAFT' | 'REVIEW' | 'VALIDATED' | 'EXPORTED',
          bpScore,
        },
      })

      // ── Auto-snapshot: debounced to 5 min ──
      const sectionTenantId = existingJourney?.user?.tenantId
      if (sectionTenantId) {
        maybeAutoSnapshot(payload.userId, journey.id, sectionTenantId, existingSections, null, 'auto')
      }

      return success(
        {
          id: journey.id,
          sectionId,
          meta: existingMeta[sectionId],
          bpScore,
          filledSections,
          totalSections: 24,
        },
        'Section sauvegardée avec succès',
      )
    }

    // ── Bulk save (existing logic) ──
    const parsed = saveBpSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      )
    }

    const { sections, bpStatus } = parsed.data

    // Read existing bpSectionMeta for metadata merge
    const previousJourney = await db.creatorJourney.findUnique({
      where: { userId_enrollmentId: buildCompositeKey(payload.userId, enrollmentId) },
      select: {
        bpSectionMeta: true, bpStatus: true, bpSections: true, userId: true,
        user: { select: { tenantId: true, firstName: true, lastName: true } },
      },
    })
    const existingMeta = (previousJourney?.bpSectionMeta as unknown as BpSectionMeta) ?? {}
    const updatedMeta: BpSectionMeta = { ...existingMeta }
    const previousStatus = previousJourney?.bpStatus ?? null
    const userTenantId = previousJourney?.user?.tenantId

    // Calculate completion & update metadata for all provided sections
    const filledSections = sections
      ? Object.values(sections).filter(isFilled).length
      : 0
    const totalSections = 24
    const bpScore = Math.min(100, Math.round((filledSections / totalSections) * 100))

    // Update bpSectionMeta for each non-empty section
    if (sections) {
      for (const [sectionId, content] of Object.entries(sections)) {
        if (isFilled(content)) {
          updatedMeta[sectionId] = buildSectionMetaForManual(existingMeta, sectionId, content)
        }
      }
    }

    // Determine status — preserve SUBMITTED when explicitly requested
    let status: string = bpStatus ?? 'IN_PROGRESS'
    if (status !== 'SUBMITTED') {
      if (filledSections === 0) status = 'NOT_STARTED'
      else if (filledSections === totalSections) status = 'DRAFT'
      else status = 'IN_PROGRESS'
    }

    // Upsert CreatorJourney bp fields (now includes bpSectionMeta)
    const journey = await db.creatorJourney.upsert({
      where: { userId_enrollmentId: buildCompositeKey(payload.userId, enrollmentId) },
      create: {
        userId: payload.userId,
        enrollmentId,
        bpSections: (sections ?? {}) as Prisma.InputJsonValue,
        bpSectionMeta: updatedMeta as unknown as Prisma.InputJsonValue,
        bpStatus: status as 'NOT_STARTED' | 'IN_PROGRESS' | 'GENERATING' | 'DRAFT' | 'REVIEW' | 'VALIDATED' | 'EXPORTED',
        bpScore,
      },
      update: {
        bpSections: (sections ?? {}) as Prisma.InputJsonValue,
        bpSectionMeta: updatedMeta as unknown as Prisma.InputJsonValue,
        bpStatus: status as 'NOT_STARTED' | 'IN_PROGRESS' | 'GENERATING' | 'DRAFT' | 'REVIEW' | 'VALIDATED' | 'EXPORTED',
        bpScore,
        bpGeneratedAt: new Date(),
      },
    })

    // ── Auto-snapshot: debounced to 5 min ──
    if (sections && Object.keys(sections).length > 0 && userTenantId) {
      const projectContext = previousJourney ? {
        projectTitle: (previousJourney as any).projectTitle ?? null,
        projectSector: (previousJourney as any).projectSector ?? null,
      } : null
      maybeAutoSnapshot(payload.userId, journey.id, userTenantId, sections ?? {}, projectContext, 'auto')
    }

    // ── Fire-and-forget notifications on status change ──
    if (previousStatus && previousStatus !== status) {
      const statusLabel = status === 'NOT_STARTED' ? 'Non démarré'
        : status === 'IN_PROGRESS' ? 'En cours'
        : status === 'DRAFT' ? 'Brouillon'
        : status === 'SUBMITTED' ? 'Soumis'
        : status

      createNotification({
        userId: payload.userId,
        title: 'Business plan mis à jour',
        content: `Votre business plan a été mis à jour — statut : ${statusLabel}`,
        type: 'INFO',
        link: '/bureau/business-plan',
      }).catch(() => {})

      // If SUBMITTED, notify all COUNSELOR users in the same tenant
      if (status === 'SUBMITTED' && userTenantId) {
        const beneficiaryName = [previousJourney?.user?.firstName, previousJourney?.user?.lastName].filter(Boolean).join(' ') || 'Un bénéficiaire'

        // Fetch counselors + send notifications (fire-and-forget)
        db.user.findMany({
          where: { tenantId: userTenantId, role: 'COUNSELOR', isActive: true },
          select: { id: true, email: true, firstName: true },
        }).then((counselors) => {
          const notificationPromises = counselors.map((c) =>
            createNotification({
              userId: c.id,
              title: 'Business plan à reviewer',
              content: `${beneficiaryName} a soumis son business plan pour review`,
              type: 'ACTION_REQUIRED',
              link: '/admin-centre/business-plan',
            })
          )
          return Promise.all(notificationPromises)
        }).catch(() => {})

        // Send email to counselors (fire-and-forget)
        import('@/lib/email').then(({ sendBpSubmittedEmail }) => {
          db.user.findMany({
            where: { tenantId: userTenantId, role: 'COUNSELOR', isActive: true },
            select: { email: true, firstName: true },
          }).then((counselors) => {
            const beneficiaryFirstName = previousJourney?.user?.firstName || ''
            counselors.forEach((c) => {
              sendBpSubmittedEmail(beneficiaryFirstName, c.email, c.firstName || '').catch(() => {})
            })
          }).catch(() => {})
        }).catch(() => {})

        log.info('BP submitted', { userId: payload.userId, beneficiaryName })
      }
    }

    return success(
      {
        id: journey.id,
        bpStatus: status,
        bpScore,
        filledSections,
        totalSections,
      },
      'Business plan sauvegardé avec succès',
    )
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée — veuillez vous reconnecter')
      }
    }
    return handleApiError(err)
  }
}

// ─── POST: Multi-action handler ──────────────

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request)
    const enrollmentId = getEnrollmentIdFromRequest(request)

    const body = await request.json()
    const parsed = bpActionSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      )
    }

    switch (parsed.data.action) {
      case 'ai-suggest':
        return handleAiSuggest(parsed.data, payload.userId, enrollmentId)
      case 'generate-from-parcours':
        return handleGenerateFromParcours(payload.userId, enrollmentId)
      case 'sync-simulators':
        return handleSyncSimulators(payload.userId, enrollmentId)
    }
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée — veuillez vous reconnecter')
      }
    }
    return handleApiError(err)
  }
}

// ─── POST action: AI Suggest (existing) ──────

async function handleAiSuggest(
  data: z.infer<typeof aiSuggestSchema>,
  userId: string,
  enrollmentId: string | null,
) {
  const { sectionId, sectionTitle, existingContent, projectContext } = data

  // Fetch project context if not provided
  let context = projectContext || ''
  if (!context) {
    const journey = await db.creatorJourney.findUnique({
      where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) },
      select: {
        projectTitle: true,
        projectSector: true,
        projectStage: true,
        targetAudience: true,
        valueProposition: true,
        projectDescription: true,
      },
    })
    if (journey) {
      const parts: string[] = []
      if (journey.projectTitle) parts.push(`Projet: ${journey.projectTitle}`)
      if (journey.projectSector) parts.push(`Secteur: ${journey.projectSector}`)
      if (journey.projectStage) parts.push(`Stade: ${journey.projectStage}`)
      if (journey.targetAudience) parts.push(`Cible: ${journey.targetAudience}`)
      if (journey.valueProposition) parts.push(`Valeur: ${journey.valueProposition}`)
      if (journey.projectDescription) parts.push(`Description: ${journey.projectDescription}`)
      context = parts.join('\n')
    }
  }

  // Build system prompt
  const systemPrompt = `Tu es un expert en création d'entreprise et en rédaction de business plans. Tu aides des entrepreneurs francophones à rédiger un business plan professionnel et convaincant.

RÈGLES IMPORTANTES :
- Réponds TOUJOURS en français
- Sois concis mais professionnel (200-400 mots par section)
- Utilise un ton formel et encourageant
- Structure le contenu avec des paragraphes clairs
- Adapte les conseils au contexte du projet fourni
- Si du contenu existe déjà, améliore-le et complète-le plutôt que de le remplacer
- Utilise des données concrètes et des exemples quand c'est pertinent

${context ? `CONTEXTE DU PROJET :\n${context}` : 'Aucun contexte de projet fourni. Génére un contenu générique adaptable.'}`

  // Build user prompt
  let userPrompt = `Génère un contenu professionnel pour la section "${sectionTitle}" d'un business plan.`

  if (existingContent && existingContent.trim()) {
    userPrompt += `\n\nContenu actuel de l'utilisateur :\n"${existingContent}"\n\nAméliore et complète ce contenu. Garde les informations importantes déjà présentes.`
  } else {
    userPrompt += `\n\nRédige un contenu complet et structuré pour cette section. L'utilisateur n'a encore rien écrit.`
  }

  userPrompt += `\n\nSection ID: ${sectionId}`

  // Call LLM via shared ZAI helper (never throws)
  const result = await callZAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.7, max_tokens: 1200 })

  if (!result.success) {
    return aiUnavailableResponse(getZAIErrorMessage(result))
  }

  const suggestion = result.content || 'Désolé, une erreur est survenue lors de la génération. Veuillez réessayer.'

  return success(
    {
      sectionId,
      suggestion,
    },
    'Suggestion IA générée avec succès',
  )
}

// ─── POST action: Generate from Parcours (P1-1) ──

async function handleGenerateFromParcours(userId: string, enrollmentId: string | null) {
  // 1. Fetch all Parcours data in parallel
  const [
    user,
    beneficiary,
    journey,
    riasecResults,
    kiviatResults,
    moduleResults,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    }),
    db.beneficiary.findUnique({
      where: { userId },
      select: { skills: true, educationLevel: true, employmentStatus: true },
    }),
    db.creatorJourney.findUnique({
      where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) },
      select: {
        projectTitle: true,
        projectDescription: true,
        projectSector: true,
        projectStage: true,
        targetAudience: true,
        valueProposition: true,
        creationMotivation: true,
        visionAnswers: true,
        bpSections: true,
        bpSectionMeta: true,
      },
    }),
    db.riasecResult.findMany({
      where: { userId },
      select: { profileType: true, score: true, isDominant: true },
      orderBy: { score: 'desc' },
    }),
    db.kiviatResult.findMany({
      where: { userId },
      select: { category: true, score: true, maxScore: true },
      orderBy: { score: 'desc' },
    }),
    db.moduleResult.findMany({
      where: { userId },
      select: { moduleCode: true, score: true, maxScore: true, feedback: true },
    }),
  ])

  if (!user) {
    return Errors.notFound('Utilisateur')
  }

  // 2. Build comprehensive context for the LLM
  const contextParts: string[] = []

  // User info
  contextParts.push(`## PORTEUR DE PROJET`)
  contextParts.push(`- Nom complet : ${user.firstName || ''} ${user.lastName || ''}`)
  contextParts.push(`- Email : ${user.email}`)

  // Beneficiary profile
  if (beneficiary) {
    contextParts.push(`\n## PROFIL BÉNÉFICIAIRE`)
    if (beneficiary.educationLevel) contextParts.push(`- Niveau d'études : ${beneficiary.educationLevel}`)
    if (beneficiary.employmentStatus) contextParts.push(`- Statut professionnel : ${beneficiary.employmentStatus}`)
    const skills = Array.isArray(beneficiary.skills) ? beneficiary.skills : []
    if (skills.length > 0) contextParts.push(`- Compétences : ${skills.join(', ')}`)
  }

  // Creator Journey project info
  if (journey) {
    contextParts.push(`\n## DESCRIPTION DU PROJET`)
    if (journey.projectTitle) contextParts.push(`- Titre : ${journey.projectTitle}`)
    if (journey.projectDescription) contextParts.push(`- Description : ${journey.projectDescription}`)
    if (journey.projectSector) contextParts.push(`- Secteur : ${journey.projectSector}`)
    if (journey.projectStage) contextParts.push(`- Stade : ${journey.projectStage}`)
    if (journey.targetAudience) contextParts.push(`- Clientèle cible : ${journey.targetAudience}`)
    if (journey.valueProposition) contextParts.push(`- Proposition de valeur : ${journey.valueProposition}`)
    if (journey.creationMotivation) contextParts.push(`- Motivation de création : ${journey.creationMotivation}`)

    // Vision answers
    const visionAnswers = journey.visionAnswers as Record<string, string> | null
    if (visionAnswers && typeof visionAnswers === 'object' && Object.keys(visionAnswers).length > 0) {
      contextParts.push(`\n## VISION / RÉPONSES AUX QUESTIONS DE VISION`)
      for (const [key, value] of Object.entries(visionAnswers)) {
        contextParts.push(`- ${key} : ${value}`)
      }
    }
  }

  // RIASEC results
  if (riasecResults.length > 0) {
    contextParts.push(`\n## RÉSULTATS RIASEC (Profil de personnalité)`)
    for (const r of riasecResults) {
      const dominant = r.isDominant ? ' ⭐ DOMINANT' : ''
      contextParts.push(`- ${r.profileType} : ${r.score}/100${dominant}`)
    }
  }

  // Kiviat results
  if (kiviatResults.length > 0) {
    contextParts.push(`\n## RÉSULTATS KIVIAT (Compétences entrepreneuriales)`)
    for (const k of kiviatResults) {
      contextParts.push(`- ${k.category} : ${k.score}/${k.maxScore}`)
    }
  }

  // Module results
  if (moduleResults.length > 0) {
    contextParts.push(`\n## MODULES COMPLÉTÉS`)
    for (const m of moduleResults) {
      contextParts.push(`- ${m.moduleCode} : ${m.score}/${m.maxScore}`)
    }
  }

  const fullContext = contextParts.join('\n')

  // 3. Build system prompt
  const systemPrompt = `Tu es un expert en création d'entreprise et en rédaction de business plans professionnels. Tu travailles pour CreaPulse, une plateforme d'accompagnement entrepreneurial GIDEF.

MISSION : À partir des données du parcours entrepreneur d'un porteur de projet (profil, tests de personnalité, compétences, vision, description de projet), tu dois générer les premières sections de son Business Plan.

RÈGLES IMPORTANTES :
- Réponds TOUJOURS en français
- Ton professionnel et encourageant
- Adapte le contenu aux données fournies (ne pas inventer des données qui ne sont pas dans le contexte)
- Chaque section doit faire entre 150 et 350 mots
- Structure chaque section avec des paragraphes clairs
- Pour les sections impliquant l'équipe, utilise les résultats RIASEC et Kiviat pour décrire les forces et compétences du porteur
- Les objectifs doivent être basés sur les réponses de vision si disponibles

FORMAT DE RÉPONSE :
Tu dois répondre UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de commentaires) contenant les clés suivantes :
{
  "resumeOperationnel": "...",
  "presentationPorteur": "...",
  "descriptionProjet": "...",
  "conceptProposition": "...",
  "clienteleCible": "...",
  "positionnement": "...",
  "equipeProjet": "...",
  "objectifs": "..."
}

- resumeOperationnel : Résumé opérationnel du projet (vue d'ensemble)
- presentationPorteur : Présentation du porteur de projet (profil, compétences, motivations)
- descriptionProjet : Description détaillée du projet
- conceptProposition : Concept et proposition de valeur
- clienteleCible : Description de la clientèle cible
- positionnement : Positionnement sur le marché
- equipeProjet : Description de l'équipe et des compétences (basé sur RIASEC+Kiviat)
- objectifs : Objectifs à court, moyen et long terme (basé sur la vision)`

  const userPrompt = `Voici les données complètes du parcours entrepreneur :\n\n${fullContext}\n\nGénère les 8 sections du business plan en JSON comme spécifié.`

  // 4. Call LLM via shared ZAI helper (never throws)
  const result = await callZAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.7, max_tokens: 3000 })

  if (!result.success) {
    return aiUnavailableResponse(getZAIErrorMessage(result))
  }

  // 5. Parse JSON response
  const generatedSections = parseJsonFromLLM(result.content)

  if (!generatedSections) {
    return aiErrorResponse("La réponse IA n'a pas pu être interprétée. Veuillez réessayer.")
  }

  // 6. Merge into existing bpSections (don't overwrite filled sections)
  const existingSections = (journey?.bpSections as Record<string, unknown>) ?? {}
  const existingMeta = (journey?.bpSectionMeta as unknown as BpSectionMeta) ?? {}
  const mergedSections = { ...existingSections }
  const updatedMeta = { ...existingMeta }

  for (const [key, value] of Object.entries(generatedSections)) {
    const existing = mergedSections[key]
    const isEmpty = existing === null || existing === undefined ||
      (typeof existing === 'string' && existing.trim() === '') ||
      (typeof existing === 'object' && !Array.isArray(existing) && Object.keys(existing as object).length === 0)

    if (isEmpty && typeof value === 'string' && value.trim()) {
      mergedSections[key] = value
      // Mark as generated from parcours
      updatedMeta[key] = buildSectionMetaForSync(existingMeta, key, value, 'parcours')
    }
  }

  // 7. Recalculate bpScore
  const filledCount = Object.values(mergedSections).filter(isFilled).length
  const bpScore = Math.min(100, Math.round((filledCount / 24) * 100))

  // 8. Update CreatorJourney (including bpSectionMeta)
  const savedJourney = await db.creatorJourney.upsert({
    where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) },
    create: {
      userId,
      enrollmentId,
      bpSections: mergedSections as Prisma.InputJsonValue,
      bpSectionMeta: updatedMeta as unknown as Prisma.InputJsonValue,
      bpStatus: 'DRAFT',
      bpScore,
      bpGeneratedAt: new Date(),
    },
    update: {
      bpSections: mergedSections as Prisma.InputJsonValue,
      bpSectionMeta: updatedMeta as unknown as Prisma.InputJsonValue,
      bpStatus: 'DRAFT',
      bpScore,
      bpGeneratedAt: new Date(),
    },
  })

  // Auto-snapshot after AI generation
  const userForTenant = await db.user.findUnique({ where: { id: userId }, select: { tenantId: true } })
  if (userForTenant?.tenantId) {
    maybeAutoSnapshot(userId, savedJourney.id, userForTenant.tenantId, mergedSections, {
      projectTitle: journey?.projectTitle,
      projectSector: journey?.projectSector,
    }, 'ai-generate')
  }

  // 9. Count what was generated vs skipped
  const generatedKeys = Object.keys(generatedSections).filter(
    (k) => typeof generatedSections[k] === 'string' && generatedSections[k].trim(),
  )
  const skippedKeys = generatedKeys.filter(
    (k) => mergedSections[k] !== generatedSections[k],
  )

  return success(
    {
      sections: mergedSections,
      generated: generatedKeys,
      skipped: skippedKeys,
      bpStatus: 'DRAFT',
      bpScore,
    },
    `Business plan généré à partir du parcours (${generatedKeys.length} sections)`,
  )
}

// ─── POST action: Sync Simulators (P1-2) ────

async function handleSyncSimulators(userId: string, enrollmentId: string | null) {
  // 1. Fetch existing BP sections and metadata
  const journey = await db.creatorJourney.findUnique({
    where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) },
    select: { bpSections: true, bpSectionMeta: true },
  })

  const existingSections = (journey?.bpSections as Record<string, unknown>) ?? {}
  const mergedSections = { ...existingSections }
  const sectionMeta = (journey?.bpSectionMeta as unknown as BpSectionMeta) ?? {}

  // Track what was synced vs skipped (with source key for meta)
  const synced: { section: string; source: string; sourceKey?: DataSource }[] = []
  const skipped: { section: string; source: string; reason: string }[] = []

  // Helper: only fill empty sections
  function fillSection(key: string, value: string, source: string, sourceKey?: DataSource) {
    const existing = mergedSections[key]
    const isEmpty = existing === null || existing === undefined ||
      (typeof existing === 'string' && existing.trim() === '')

    if (isEmpty && value.trim()) {
      mergedSections[key] = value
      synced.push({ section: key, source, sourceKey })
      // Update section metadata with sync source
      if (sourceKey) {
        sectionMeta[key] = buildSectionMetaForSync(sectionMeta, key, value, sourceKey as 'marche' | 'juridique' | 'financier' | 'creasim' | 'parcours')
      }
    } else if (!isEmpty) {
      skipped.push({ section: key, source, reason: 'Déjà renseigné par l\'utilisateur' })
    }
  }

  // 2. Fetch ALL simulator data in parallel
  const [
    marketAnalysis,
    financialForecast,
    creaSim,
    juridiqueAnalysis,
    businessModelCanvas,
  ] = await Promise.all([
    db.marketAnalysis.findUnique({ where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) } }),
    db.financialForecast.findUnique({ where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) } }),
    db.creaSimSimulation.findUnique({ where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) } }),
    db.juridiqueAnalysis.findUnique({ where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) } }),
    db.businessModelCanvas.findUnique({ where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) } }),
  ])

  // 3. Map marketAnalysis → etudeMarche, concurrence, swot
  if (marketAnalysis) {
    const parts: string[] = []
    if (marketAnalysis.sector) parts.push(`**Secteur** : ${marketAnalysis.sector}`)
    if (marketAnalysis.marketSize) parts.push(`**Taille du marché** : ${marketAnalysis.marketSize}`)
    if (marketAnalysis.targetAudience) parts.push(`**Audience cible** : ${marketAnalysis.targetAudience}`)
    if (marketAnalysis.opportunities) parts.push(`**Opportunités** : ${marketAnalysis.opportunities}`)
    if (marketAnalysis.threats) parts.push(`**Menaces** : ${marketAnalysis.threats}`)
    if (marketAnalysis.aiSynthesis) parts.push(`**Synthèse IA** : ${marketAnalysis.aiSynthesis}`)

    const trends = marketAnalysis.trends as unknown[]
    if (Array.isArray(trends) && trends.length > 0) {
      parts.push(`**Tendances** : ${trends.join(', ')}`)
    }

    if (parts.length > 0) {
      fillSection('etude-marche', `## Étude de marché\n\n${parts.join('\n\n')}`, 'Analyse de marché', 'marche')
    } else {
      skipped.push({ section: 'etude-marche', source: 'Analyse de marché', reason: 'Données insuffisantes' })
    }

    // Competition
    const competitors = marketAnalysis.competitors as unknown[]
    if (Array.isArray(competitors) && competitors.length > 0) {
      const compParts = competitors.map((c: unknown, i: number) => {
        const comp = c as Record<string, string>
        return `### Concurrent ${i + 1}\n${Object.entries(comp).map(([k, v]) => `- **${k}** : ${v}`).join('\n')}`
      })
      fillSection('concurrence', `## Analyse concurrentielle\n\n${compParts.join('\n\n')}`, 'Analyse de marché', 'marche')
    } else {
      skipped.push({ section: 'concurrence', source: 'Analyse de marché', reason: 'Aucun concurrent identifié' })
    }

    // SWOT
    const swotParts: string[] = []
    if (marketAnalysis.opportunities) swotParts.push(`### Opportunités\n${marketAnalysis.opportunities}`)
    if (marketAnalysis.threats) swotParts.push(`### Menaces\n${marketAnalysis.threats}`)
    if (swotParts.length > 0) {
      fillSection('swot', `## Analyse SWOT\n\n${swotParts.join('\n\n')}`, 'Analyse de marché', 'marche')
    } else {
      skipped.push({ section: 'swot', source: 'Analyse de marché', reason: 'Données insuffisantes' })
    }
  } else {
    skipped.push({ section: 'etude-marche', source: 'Analyse de marché', reason: 'Simulation non complétée' })
    skipped.push({ section: 'concurrence', source: 'Analyse de marché', reason: 'Simulation non complétée' })
    skipped.push({ section: 'swot', source: 'Analyse de marché', reason: 'Simulation non complétée' })
  }

  // 4. Map financialForecast → planFinancier, compteResultat, investissements
  if (financialForecast) {
    // Financial plan summary
    const finParts: string[] = []
    if (financialForecast.sector) finParts.push(`**Secteur** : ${financialForecast.sector}`)
    if (financialForecast.year1Revenue) finParts.push(`**CA Année 1** : ${financialForecast.year1Revenue.toLocaleString('fr-FR')} €`)
    if (financialForecast.year2Revenue) finParts.push(`**CA Année 2** : ${financialForecast.year2Revenue.toLocaleString('fr-FR')} €`)
    if (financialForecast.year3Revenue) finParts.push(`**CA Année 3** : ${financialForecast.year3Revenue.toLocaleString('fr-FR')} €`)
    if (financialForecast.year1Expenses) finParts.push(`**Charges Année 1** : ${financialForecast.year1Expenses.toLocaleString('fr-FR')} €`)
    if (financialForecast.year2Expenses) finParts.push(`**Charges Année 2** : ${financialForecast.year2Expenses.toLocaleString('fr-FR')} €`)
    if (financialForecast.year3Expenses) finParts.push(`**Charges Année 3** : ${financialForecast.year3Expenses.toLocaleString('fr-FR')} €`)
    if (financialForecast.breakevenMonth) finParts.push(`**Seuil de rentabilité** : Mois ${financialForecast.breakevenMonth}`)
    if (financialForecast.initialInvestment) finParts.push(`**Investissement initial** : ${financialForecast.initialInvestment.toLocaleString('fr-FR')} €`)

    if (finParts.length > 0) {
      fillSection('financement', `## Plan financier (synthèse)\n\n${finParts.join('\n\n')}`, 'Prévisions financières', 'financier')
    } else {
      skipped.push({ section: 'financement', source: 'Prévisions financières', reason: 'Données insuffisantes' })
    }

    // P&L summary
    const plParts: string[] = []
    const fmtEur = (n: number) => n.toLocaleString('fr-FR')
    const years = [
      { year: 1, rev: financialForecast.year1Revenue, exp: financialForecast.year1Expenses },
      { year: 2, rev: financialForecast.year2Revenue, exp: financialForecast.year2Expenses },
      { year: 3, rev: financialForecast.year3Revenue, exp: financialForecast.year3Expenses },
    ]
    for (const y of years) {
      if (y.rev != null || y.exp != null) {
        const rev = y.rev ?? 0
        const exp = y.exp ?? 0
        const result = rev - exp
        plParts.push(`### Année ${y.year}\n- Chiffre d'affaires : ${fmtEur(rev)} €\n- Charges : ${fmtEur(exp)} €\n- **Résultat net** : ${fmtEur(result)} € ${result >= 0 ? '✅' : '⚠️'}`)
      }
    }
    if (plParts.length > 0) {
      fillSection('compte-resultat', `## Compte de résultat prévisionnel (3 ans)\n\n${plParts.join('\n\n')}`, 'Prévisions financières', 'financier')
    } else {
      skipped.push({ section: 'compte-resultat', source: 'Prévisions financières', reason: 'Données insuffisantes' })
    }

    // Investments
    if (financialForecast.initialInvestment) {
      fillSection(
        'investissements',
        `## Investissements\n\n**Investissement initial** : ${financialForecast.initialInvestment.toLocaleString('fr-FR')} €\n\n*Cette donnée provient du module Prévisions Financières. Détaillez les postes d'investissement (matériel, logiciel, caution, etc.) pour compléter cette section.*`,
        'Prévisions financières',
        'financier',
      )
    } else {
      skipped.push({ section: 'investissements', source: 'Prévisions financières', reason: 'Aucun investissement renseigné' })
    }
  } else {
    skipped.push({ section: 'financement', source: 'Prévisions financières', reason: 'Simulation non complétée' })
    skipped.push({ section: 'compte-resultat', source: 'Prévisions financières', reason: 'Simulation non complétée' })
    skipped.push({ section: 'investissements', source: 'Prévisions financières', reason: 'Simulation non complétée' })
  }

  // 5. Map creaSim → rentabilite
  if (creaSim) {
    const rentParts: string[] = []
    const fmtEur = (n: number) => n.toLocaleString('fr-FR')
    const fmtPct = (n: number) => `${n.toFixed(1)}%`

    if (creaSim.monthlyRevenue) rentParts.push(`**CA mensuel** : ${fmtEur(creaSim.monthlyRevenue)} €`)
    if (creaSim.grossMarginRate) rentParts.push(`**Marge brute** : ${fmtPct(creaSim.grossMarginRate)}`)
    if (creaSim.netMarginRate) rentParts.push(`**Marge nette** : ${fmtPct(creaSim.netMarginRate)}`)
    if (creaSim.monthlyBreakeven) rentParts.push(`**Seuil de rentabilité mensuel** : ${fmtEur(creaSim.monthlyBreakeven)} €`)
    if (creaSim.breakevenMonths) rentParts.push(`**Point mort** : ${creaSim.breakevenMonths.toFixed(1)} mois`)

    if (creaSim.profitability1Y != null) {
      rentParts.push(`**Rentabilité Année 1** : ${fmtEur(creaSim.profitability1Y)} € ${creaSim.profitability1Y >= 0 ? '✅' : '⚠️'}`)
    }
    if (creaSim.profitability2Y != null) {
      rentParts.push(`**Rentabilité Année 2** : ${fmtEur(creaSim.profitability2Y)} € ${creaSim.profitability2Y >= 0 ? '✅' : '⚠️'}`)
    }
    if (creaSim.profitability3Y != null) {
      rentParts.push(`**Rentabilité Année 3** : ${fmtEur(creaSim.profitability3Y)} € ${creaSim.profitability3Y >= 0 ? '✅' : '⚠️'}`)
    }

    // Margin analysis
    if (creaSim.averageSellingPrice && creaSim.unitCost) {
      const marginPerUnit = creaSim.averageSellingPrice - creaSim.unitCost
      rentParts.push(`**Marge unitaire** : ${fmtEur(marginPerUnit)} € (PV ${fmtEur(creaSim.averageSellingPrice)} € - Coût ${fmtEur(creaSim.unitCost)} €)`)
    }
    if (creaSim.targetMarginRate) {
      rentParts.push(`**Objectif de marge** : ${fmtPct(creaSim.targetMarginRate)}`)
      if (creaSim.grossMarginRate) {
        const gap = creaSim.grossMarginRate - creaSim.targetMarginRate
        rentParts.push(`**Écart par rapport à l'objectif** : ${gap >= 0 ? '+' : ''}${fmtPct(gap)} ${gap >= 0 ? '✅ Atteint' : '⚠️ Non atteint'}`)
      }
    }

    if (rentParts.length > 0) {
      fillSection('seuil-rentabilite', `## Analyse de rentabilité (CreaSim)\n\n${rentParts.join('\n\n')}`, 'CreaSim', 'creasim')
    } else {
      skipped.push({ section: 'seuil-rentabilite', source: 'CreaSim', reason: 'Données insuffisantes' })
    }
  } else {
    skipped.push({ section: 'seuil-rentabilite', source: 'CreaSim', reason: 'Simulation non complétée' })
  }

  // 6. Map juridiqueAnalysis → statutJuridique
  if (juridiqueAnalysis) {
    const jurParts: string[] = []
    if (juridiqueAnalysis.recommendedStatus) jurParts.push(`**Statut recommandé** : ${juridiqueAnalysis.recommendedStatus}`)
    if (juridiqueAnalysis.fiscalRegime) jurParts.push(`**Régime fiscal** : ${juridiqueAnalysis.fiscalRegime}`)
    if (juridiqueAnalysis.legalStructure) jurParts.push(`**Structure juridique** : ${juridiqueAnalysis.legalStructure}`)

    const charges = juridiqueAnalysis.socialCharges as unknown[]
    if (Array.isArray(charges) && charges.length > 0) {
      const chargeItems = charges.map((c: unknown) => {
        const charge = c as Record<string, string>
        return `- ${charge.name || charge.type || 'Charge'} : ${charge.amount || charge.rate || ''}`
      })
      jurParts.push(`**Charges sociales** :\n${chargeItems.join('\n')}`)
    }

    if (jurParts.length > 0) {
      fillSection('statut-juridique', `## Statut juridique\n\n${jurParts.join('\n\n')}`, 'Analyse juridique', 'juridique')
    } else {
      skipped.push({ section: 'statut-juridique', source: 'Analyse juridique', reason: 'Données insuffisantes' })
    }
  } else {
    skipped.push({ section: 'statut-juridique', source: 'Analyse juridique', reason: 'Simulation non complétée' })
  }

  // 7. Map businessModelCanvas → businessModelCanvas
  if (businessModelCanvas) {
    const bmcParts: string[] = []
    const bmcLabels: Record<string, string> = {
      partenairesCles: 'Partenaires clés',
      activitesCles: 'Activités clés',
      ressourcesCles: 'Ressources clés',
      propositionValeur: 'Proposition de valeur',
      relationsClients: 'Relations clients',
      canaux: 'Canaux de distribution',
      segmentsClients: 'Segments de clientèle',
      structureCouts: 'Structure des coûts',
      sourcesRevenus: 'Sources de revenus',
    }

    let hasContent = false
    for (const [field, label] of Object.entries(bmcLabels)) {
      const value = businessModelCanvas[field as keyof typeof businessModelCanvas]
      if (value && typeof value === 'string' && value.trim()) {
        bmcParts.push(`### ${label}\n${value}`)
        hasContent = true
      }
    }

    // BMC has no matching section in the BP — data is available in the BMC module
    skipped.push({ section: 'businessModelCanvas', source: 'Business Model Canvas', reason: 'Aucune section correspondante dans le BP' })
  } else {
    skipped.push({ section: 'businessModelCanvas', source: 'Business Model Canvas', reason: 'Simulation non complétée' })
  }

  // 8. Recalculate bpScore and save (including bpSectionMeta)
  const filledCount = Object.values(mergedSections).filter(isFilled).length
  const totalSections = 24
  const bpScore = Math.min(100, Math.round((filledCount / totalSections) * 100))

  await db.creatorJourney.upsert({
    where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) },
    create: {
      userId,
      enrollmentId,
      bpSections: mergedSections as Prisma.InputJsonValue,
      bpSectionMeta: sectionMeta as unknown as Prisma.InputJsonValue,
      bpScore,
      bpGeneratedAt: new Date(),
    },
    update: {
      bpSections: mergedSections as Prisma.InputJsonValue,
      bpSectionMeta: sectionMeta as unknown as Prisma.InputJsonValue,
      bpScore,
      bpGeneratedAt: new Date(),
    },
  })

  // Derive syncedSources from synced array
  const syncedSources: Record<string, boolean> = {}
  for (const item of synced) {
    const source = item.source as string
    if (source === 'Analyse de marché') syncedSources.marche = true
    if (source === 'Prévisions financières' || source === 'CreaSim') syncedSources.financier = true
    if (source === 'Analyse juridique') syncedSources.juridique = true
    if (source === 'CreaSim') syncedSources.creasim = true
  }
  const summary = `${synced.length} sections synchronisées depuis ${[...new Set(synced.map(s => s.source))].join(', ')}`

  return success(
    {
      sections: mergedSections,
      synced,
      skipped,
      bpScore,
      totalSections,
      syncedSources,
      summary,
    },
    `Synchronisation terminée : ${synced.length} sections ajoutées, ${skipped.length} ignorées`,
  )
}
