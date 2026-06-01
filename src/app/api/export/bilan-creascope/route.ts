// ============================================
// CreaPulse V2 — CréaScope Bilan PDF Export
// POST /api/export/bilan-creascope
// Generates a comprehensive PDF bilan for a CréaScope session
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'
import {
  generatePdfBuffer,
  drawCoverPage,
  addSectionHeader,
  addSubSectionHeader,
  addTable,
  addParagraph,
  addBullet,
  addKeyValueBlock,
  addSpacing,
  checkNewPage,
  scoreBar,
  finalizeWithFooters,
  formatDate,
  type TableColumn,
} from '@/lib/pdf-utils'

// ─── Validation ──────────────────────────────

const BodySchema = z.object({
  sessionId: z.string().min(1),
})

// ─── Step labels (French) ────────────────────

const STEP_LABELS: Record<string, string> = {
  ACCUEIL: 'Accueil & Présentation',
  FLASH_SWIPE: 'Flash Pépites (Swipe)',
  ANALYSE_INTERMEDIAIRE: 'Analyse Intermédiaire',
  QUESTIONNAIRE: 'Questionnaire Approfondi',
  CHALLENGE_SCENARIO: 'Challenge Scénario',
  BILAN_IA: 'Bilan IA',
  PLAN_ACTION: 'Plan d\'Action',
  TERMINEE: 'Session Terminée',
}

const STATUS_LABELS: Record<string, string> = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  PAUSEE: 'En pause',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
}

// ─── POST: Generate PDF ──────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──
    let token = request.cookies.get('session')?.value
    if (!token) token = getTokenFromHeader(request)
    if (!token) return Errors.unauthorized('Non authentifié')

    const payload = await verifyToken(token)
    const userId = payload.userId

    // ── Parse body ──
    const body = await request.json()
    const { sessionId } = BodySchema.parse(body)

    // ── Fetch session with full relations ──
    const session = await db.creascopeSession.findUnique({
      where: { id: sessionId },
      include: {
        beneficiary: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        counselor: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    })

    if (!session) return Errors.notFound('Session CréaScope')

    // ── Verify access: counselor of session, beneficiary, or admin ──
    const isCounselor = session.counselor.userId === userId
    const isBeneficiary = session.beneficiary.userId === userId
    const isAdmin = payload.role === 'ADMIN'

    if (!isCounselor && !isBeneficiary && !isAdmin) {
      return Errors.forbidden('Vous n\'avez pas accès à cette session')
    }

    // ── Fetch beneficiary related data ──
    const beneficiaryUserId = session.beneficiary.userId

    const [kiviatResults, riasecResults, creatorJourney, moduleResults] = await Promise.all([
      db.kiviatResult.findMany({
        where: { userId: beneficiaryUserId },
        orderBy: { category: 'asc' },
      }),
      db.riasecResult.findMany({
        where: { userId: beneficiaryUserId },
        orderBy: { score: 'desc' },
      }),
      db.creatorJourney.findUnique({
        where: { userId: beneficiaryUserId },
      }),
      db.moduleResult.findMany({
        where: { userId: beneficiaryUserId, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
      }),
    ])

    // ── Build PDF ──
    const beneficiaryName =
      `${session.beneficiary.user.firstName || ''} ${session.beneficiary.user.lastName || ''}`.trim()
      || session.beneficiary.user.email
    const counselorName =
      `${session.counselor.user.firstName || ''} ${session.counselor.user.lastName || ''}`.trim()

    const pdfBuffer = await generatePdfBuffer((doc) => {
      // ── Page 1: Cover ──
      drawCoverPage(
        doc,
        'Bilan CréaScope',
        'Évaluation Entrepreneuriale Complète — GIDEF Île-de-France',
        beneficiaryName,
      )

      // ── Page 2: Synthèse de Session ──
      let y = addSectionHeader(doc, 'Synthèse de Session')

      const stepProgress =
        (session.stepProgress as Record<string, Record<string, unknown>>) || {}

      // Calculate total duration from step progress
      let totalDuration = 0
      for (const step of Object.values(stepProgress)) {
        if (step.durationMinutes && typeof step.durationMinutes === 'number') {
          totalDuration += step.durationMinutes
        }
      }

      y = addSubSectionHeader(doc, 'Informations de la Session', y)
      y = addKeyValueBlock(
        doc,
        [
          { key: 'Date prévue :', value: formatDate(session.scheduledAt) },
          { key: 'Date début :', value: formatDate(session.startedAt) },
          { key: 'Date fin :', value: formatDate(session.completedAt) },
          {
            key: 'Durée totale :',
            value: totalDuration > 0
              ? `${totalDuration} min`
              : session.estimatedMinutes
                ? `${session.estimatedMinutes} min (estimée)`
                : '—',
          },
          {
            key: 'Score global :',
            value: session.globalScore != null ? `${session.globalScore}/100` : 'Non calculé',
          },
          { key: 'Statut :', value: STATUS_LABELS[session.status] || session.status },
          { key: 'Conseiller :', value: counselorName },
        ],
        y,
      )
      y = addSpacing(doc, 10, y)

      // Steps table
      y = checkNewPage(doc, 200, y)
      y = addSubSectionHeader(doc, 'Étapes Complétées', y)

      const stepsColumns: TableColumn[] = [
        { header: 'Étape', width: 180, align: 'left' },
        { header: 'Durée (min)', width: 80, align: 'center' },
        { header: 'Statut', width: 100, align: 'center' },
        { header: 'Notes', width: 95, align: 'left' },
      ]

      const stepEntries = Object.entries(stepProgress)
      let stepsRows: { cells: string[]; textColor?: string }[] = []

      if (stepEntries.length > 0) {
        stepsRows = stepEntries.map(([stepKey, stepData]) => {
          const isCompleted = stepData.completedAt != null
          const isStarted = stepData.startedAt != null
          let statusLabel = 'Non démarré'
          if (isCompleted) statusLabel = 'Terminé'
          else if (isStarted) statusLabel = 'En cours'

          const duration = stepData.durationMinutes as number | undefined
          const notes = (stepData.notes as string | undefined) || ''

          return {
            cells: [
              STEP_LABELS[stepKey] || stepKey,
              duration ? `${duration}` : '—',
              statusLabel,
              notes.length > 20 ? `${notes.substring(0, 20)}…` : notes,
            ],
            textColor: isCompleted ? '#2E7D32' : isStarted ? '#F57F17' : '#666666',
          }
        })
      } else {
        stepsRows = [{
          cells: ['Aucune étape complétée', '—', '—', '—'],
          textColor: '#666666',
        }]
      }

      y = addTable(doc, stepsColumns, stepsRows, y)
      y = addSpacing(doc, 10, y)

      // ── Page 3+: Résultats Kiviat ──
      if (kiviatResults.length > 0) {
        y = checkNewPage(doc, 200, y)
        y = addSectionHeader(doc, 'Profil Compétences — Kiviat', y)

        const kiviatColumns: TableColumn[] = [
          { header: 'Dimension', width: 140, align: 'left' },
          { header: 'Score', width: 305, align: 'left' },
        ]

        const kiviatRows = kiviatResults.map((k) => ({
          cells: [
            k.category,
            scoreBar(k.score, k.maxScore || 10, 20),
          ],
          textColor: k.score >= 7 ? '#2E7D32' : k.score >= 4 ? '#F57F17' : '#C62828',
        }))

        y = addTable(doc, kiviatColumns, kiviatRows, y)
        y = addSpacing(doc, 10, y)

        // Kiviat average
        const avgKiviat = kiviatResults.reduce((s, k) => s + k.score, 0) / kiviatResults.length
        y = checkNewPage(doc, 60, y)
        y = addKeyValueBlock(
          doc,
          [{ key: 'Score moyen Kiviat :', value: `${avgKiviat.toFixed(1)} / 10` }],
          y,
        )
        y = addSpacing(doc, 10, y)

        // AI insights — strengths / areas to work
        const aiInsights = session.aiInsights as Record<string, unknown> | null
        if (aiInsights && typeof aiInsights === 'object') {
          const strengths = aiInsights.strengths as string[] | undefined
          const areasToWork = aiInsights.areasToWork as string[] | undefined

          if (strengths && Array.isArray(strengths) && strengths.length > 0) {
            y = checkNewPage(doc, 60 + strengths.length * 24, y)
            y = addSubSectionHeader(doc, 'Points Forts Identifiés', y)
            for (const s of strengths) {
              y = addBullet(doc, s, y)
            }
            y = addSpacing(doc, 10, y)
          }

          if (areasToWork && Array.isArray(areasToWork) && areasToWork.length > 0) {
            y = checkNewPage(doc, 60 + areasToWork.length * 24, y)
            y = addSubSectionHeader(doc, 'Axes d\'Amélioration', y)
            for (const a of areasToWork) {
              y = addBullet(doc, a, y)
            }
            y = addSpacing(doc, 10, y)
          }
        }
      }

      // ── Page: Profil RIASEC ──
      if (riasecResults.length > 0) {
        y = checkNewPage(doc, 200, y)
        y = addSectionHeader(doc, 'Profil d\'Intérêts RIASEC', y)

        const riasecColumns: TableColumn[] = [
          { header: 'Profil', width: 140, align: 'left' },
          { header: 'Score', width: 100, align: 'center' },
          { header: 'Dominant', width: 100, align: 'center' },
        ]

        const riasecRows = riasecResults.map((r) => ({
          cells: [
            r.profileType,
            r.score.toFixed(1),
            r.isDominant ? '★ Oui' : 'Non',
          ],
          textColor: r.isDominant ? '#00838F' : '#333333',
          fillColor: r.isDominant ? '#E0F7FA' : undefined,
        }))

        y = addTable(doc, riasecColumns, riasecRows, y)

        // Dominant profiles summary
        const dominantProfiles = riasecResults.filter((r) => r.isDominant)
        if (dominantProfiles.length > 0) {
          y = addSpacing(doc, 10, y)
          y = checkNewPage(doc, 60, y)
          y = addSubSectionHeader(doc, 'Profil(s) Dominant(s)', y)
          y = addParagraph(
            doc,
            `Votre profil dominant est : ${dominantProfiles.map((p) => p.profileType).join(', ')}`,
            y,
          )
        }
        y = addSpacing(doc, 10, y)
      }

      // ── Page: Parcours Créateur ──
      y = checkNewPage(doc, 250, y)
      y = addSectionHeader(doc, 'Parcours de Création', y)

      if (creatorJourney) {
        const phaseLabels: Record<string, string> = {
          DISCOVERY: 'Découverte',
          PROFILING: 'Profilage',
          MODELING: 'Modélisation',
          STRATEGY: 'Stratégie',
          ECOSYSTEM: 'Écosystème',
          LAUNCH: 'Lancement',
          POST_CREATION: 'Post-création',
        }

        const tremplinLabels: Record<string, string> = {
          NOT_STARTED: 'Non démarré',
          IN_PROGRESS: 'En cours',
          READY: 'Prêt',
          VALIDATED: 'Validé',
          REJECTED: 'Refusé',
        }

        y = addKeyValueBlock(
          doc,
          [
            { key: 'Phase :', value: phaseLabels[creatorJourney.currentPhase] || creatorJourney.currentPhase },
            { key: 'Titre projet :', value: creatorJourney.projectTitle || 'Non défini' },
            { key: 'Secteur :', value: creatorJourney.projectSector || 'Non défini' },
            { key: 'Score BP :', value: creatorJourney.bpScore != null ? `${creatorJourney.bpScore}/100` : 'Non évalué' },
            { key: 'Statut Tremplin :', value: tremplinLabels[creatorJourney.tremplinStatus] || creatorJourney.tremplinStatus },
          ],
          y,
        )
      } else {
        y = addParagraph(doc, 'Aucun parcours créateur disponible pour ce bénéficiaire.', y)
      }
      y = addSpacing(doc, 10, y)

      // Module results table
      if (moduleResults.length > 0) {
        y = checkNewPage(doc, 200, y)
        y = addSubSectionHeader(doc, 'Résultats Modules', y)

        const moduleColumns: TableColumn[] = [
          { header: 'Module', width: 180, align: 'left' },
          { header: 'Score / Max', width: 100, align: 'center' },
          { header: 'Complété le', width: 145, align: 'center' },
        ]

        const moduleRows = moduleResults.map((m) => ({
          cells: [
            m.moduleCode,
            `${m.score}/${m.maxScore}`,
            formatDate(m.completedAt),
          ],
        }))

        y = addTable(doc, moduleColumns, moduleRows, y)
      }
      y = addSpacing(doc, 10, y)

      // ── Page: Insights IA ──
      const aiInsights = session.aiInsights as Record<string, unknown> | null
      if (aiInsights && typeof aiInsights === 'object' && Object.keys(aiInsights).length > 0) {
        y = checkNewPage(doc, 200, y)
        y = addSectionHeader(doc, 'Analyse Intelligente', y)

        // Summary
        const summary = aiInsights.summary as string | undefined
        if (summary) {
          y = addParagraph(doc, summary, y)
          y = addSpacing(doc, 6, y)
        }

        // Strengths
        const strengths = aiInsights.strengths as string[] | undefined
        if (strengths && Array.isArray(strengths) && strengths.length > 0) {
          y = checkNewPage(doc, 60 + strengths.length * 24, y)
          y = addSubSectionHeader(doc, 'Points Forts', y)
          for (const s of strengths) {
            y = addBullet(doc, s, y)
          }
          y = addSpacing(doc, 6, y)
        }

        // Areas to work
        const areasToWork = aiInsights.areasToWork as string[] | undefined
        if (areasToWork && Array.isArray(areasToWork) && areasToWork.length > 0) {
          y = checkNewPage(doc, 60 + areasToWork.length * 24, y)
          y = addSubSectionHeader(doc, 'Axes d\'Amélioration', y)
          for (const a of areasToWork) {
            y = addBullet(doc, a, y)
          }
          y = addSpacing(doc, 6, y)
        }

        // Recommendations
        const recommendations = aiInsights.recommendations as string[] | undefined
        if (recommendations && Array.isArray(recommendations) && recommendations.length > 0) {
          y = checkNewPage(doc, 60 + recommendations.length * 24, y)
          y = addSubSectionHeader(doc, 'Recommandations', y)
          for (const r of recommendations) {
            y = addBullet(doc, r, y)
          }
          y = addSpacing(doc, 6, y)
        }

        // Next step focus
        const nextStepFocus = aiInsights.nextStepFocus as string | undefined
        if (nextStepFocus) {
          y = checkNewPage(doc, 60, y)
          y = addSubSectionHeader(doc, 'Prochaine Étape', y)
          y = addParagraph(doc, nextStepFocus, y)
        }
        y = addSpacing(doc, 10, y)
      }

      // ── Page: Plan d'Action ──
      const actionPlan = session.actionPlan as Record<string, unknown> | null
      const hasCounselorNotes = !!session.counselorNotes?.trim()

      if (
        (actionPlan && typeof actionPlan === 'object' && Object.keys(actionPlan).length > 0)
        || hasCounselorNotes
      ) {
        y = checkNewPage(doc, 200, y)
        y = addSectionHeader(doc, 'Plan d\'Action Personnalisé', y)

        if (actionPlan && typeof actionPlan === 'object') {
          for (const [key, value] of Object.entries(actionPlan)) {
            if (value == null) continue

            y = checkNewPage(doc, 60, y)

            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (s) => s.toUpperCase())
              .trim()

            y = addSubSectionHeader(doc, label, y)

            if (Array.isArray(value)) {
              for (const item of value) {
                if (typeof item === 'string') {
                  y = addBullet(doc, item, y)
                } else if (typeof item === 'object' && item !== null) {
                  const obj = item as Record<string, unknown>
                  if (obj.title) {
                    y = addBullet(
                      doc,
                      `${obj.title}${obj.description ? ` — ${obj.description}` : ''}`,
                      y,
                    )
                  } else {
                    y = addBullet(doc, JSON.stringify(item), y)
                  }
                }
              }
            } else if (typeof value === 'string') {
              y = addParagraph(doc, value, y)
            } else if (typeof value === 'object') {
              const entries = Object.entries(value)
              const kvData = entries.map(([k, v]) => ({
                key: `${k} :`,
                value: typeof v === 'string' ? v : v != null ? String(v) : '—',
              }))
              if (kvData.length > 0) {
                y = addKeyValueBlock(doc, kvData, y)
              }
            }
            y = addSpacing(doc, 6, y)
          }
        }

        if (hasCounselorNotes) {
          y = checkNewPage(doc, 80, y)
          y = addSubSectionHeader(doc, 'Notes du Conseiller', y)
          y = addParagraph(doc, session.counselorNotes!, y)
        }
        y = addSpacing(doc, 10, y)
      }

      // ── Final: Add footers to all pages except cover ──
      finalizeWithFooters(doc)
    })

    // ── Return PDF ──
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bilan-creascope-${sessionId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
