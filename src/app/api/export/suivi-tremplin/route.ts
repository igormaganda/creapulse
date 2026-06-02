// ============================================
// CreaPulse V2 — Suivi Tremplin PDF Export
// GET /api/export/suivi-tremplin
// Generates a branded PDF with Tremplin assessment results
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'
import {
  generatePdfBuffer,
  drawCoverPage,
  addSectionHeader,
  addSubSectionHeader,
  addTable,
  addKeyValueBlock,
  addBullet,
  addParagraph,
  addSpacing,
  checkNewPage,
  addDecisionBadge,
  finalizeWithFooters,
  type TableColumn,
  type TableRow,
} from '@/lib/pdf-utils'

// ─── Tremplin step labels ────────────────────

const TREMPLIN_STEPS: Record<string, string> = {
  step0: '1. Motivation et vision',
  step1: '2. Adéquation marché',
  step2: '3. Viabilité financière',
  step3: '4. Compétences clés',
  step4: '5. Réseau et écosystème',
  step5: '6. Plan d\'action',
  step6: '7. Préparation au pitch',
  step7: '8. Validation finale',
}

function getStepLabel(stepKey: string): string {
  return TREMPLIN_STEPS[stepKey] || stepKey
}

export async function GET(request: NextRequest) {
  try {
    // Auth
    let token = request.cookies.get('session')?.value
    if (!token) {
      token = getTokenFromHeader(request)
    }
    if (!token) return Errors.unauthorized('Non authentifié')

    const payload = await verifyToken(token)
    const userId = payload.userId

    // Fetch user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    })
    if (!user) return Errors.notFound('Utilisateur')

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email

    // Fetch journey
    const journey = await db.creatorJourney.findUnique({
      where: { userId },
      select: { projectTitle: true },
    })

    // Fetch Tremplin
    const tremplin = await db.tremplin.findUnique({
      where: { userId },
    })

    if (!tremplin) {
      return Errors.notFound('Évaluation Tremplin')
    }

    // Generate PDF
    const pdfBuffer = await generatePdfBuffer((doc) => {
      // ── Cover Page ──
      drawCoverPage(
        doc,
        'Suivi — Évaluation Tremplin',
        'Bilan de préparation au lancement',
        fullName,
      )

      // ── Profile ──
      let y = addSectionHeader(doc, 'Informations')
      y = addKeyValueBlock(
        doc,
        [
          { key: 'Bénéficiaire :', value: fullName },
          { key: 'Projet :', value: journey?.projectTitle || 'Non défini' },
          { key: 'Étape courante :', value: `${tremplin.currentStep + 1}/8` },
          { key: 'Complétée :', value: tremplin.isCompleted ? 'Oui' : 'Non' },
          {
            key: 'Date de complétion :',
            value: tremplin.completedAt
              ? tremplin.completedAt.toLocaleDateString('fr-FR')
              : '—',
          },
        ],
        y,
      )
      addSpacing(doc, 12)

      // ── Decision Badge ──
      checkNewPage(doc, 100)
      y = addSectionHeader(doc, 'Décision')

      const decisionStr = tremplin.decision || 'PENDING'
      y = addDecisionBadge(doc, decisionStr, y)

      if (tremplin.score != null) {
        y = addKeyValueBlock(
          doc,
          [
            { key: 'Score global :', value: `${tremplin.score}/100` },
          ],
          y,
        )
      }

      if (tremplin.summary) {
        addSpacing(doc, 6)
        y = addParagraph(doc, tremplin.summary, y)
      }

      addSpacing(doc, 12)

      // ── Step-by-step responses ──
      checkNewPage(doc, 260)
      y = addSectionHeader(doc, 'Détail des étapes')

      const responses = tremplin.responses as Record<string, unknown> | null
      const stepEntries = responses ? Object.entries(responses) : []

      if (stepEntries.length > 0) {
        const stepColumns: TableColumn[] = [
          { header: 'Étape', width: 180, align: 'left' },
          { header: 'Statut', width: 80, align: 'center' },
          { header: 'Notes', width: 185, align: 'left' },
        ]

        const stepRows: TableRow[] = stepEntries.map(([key, value]) => {
          const val = value as Record<string, unknown> | null
          const completed = val?.completed === true || val?.done === true
          const notes = val?.notes as string | null || val?.comment as string | null || ''

          return {
            cells: [
              getStepLabel(key),
              completed ? '✓ Validée' : 'En cours',
              notes.length > 50 ? notes.substring(0, 50) + '...' : notes || '—',
            ],
            fillColor: completed ? '#E8F5E9' : undefined,
          }
        })

        y = addTable(doc, stepColumns, stepRows, y)
      } else {
        y = addParagraph(doc, 'Aucune réponse détaillée enregistrée pour les étapes.', y)
      }

      addSpacing(doc, 12)

      // ── Recommendations ──
      const recommendations = tremplin.recommendations as string[] | null
      if (recommendations && recommendations.length > 0) {
        checkNewPage(doc, 60 + recommendations.length * 24)
        y = addSectionHeader(doc, 'Recommandations')
        for (const rec of recommendations) {
          y = addBullet(doc, rec, y)
        }
        addSpacing(doc, 10)
      }

      // ── Next steps ──
      checkNewPage(doc, 80)
      y = addSectionHeader(doc, 'Prochaines étapes')
      y = addBullet(doc, 'Revoir les étapes incomplètes avec votre conseiller.', y)
      y = addBullet(doc, 'Préparer les arguments pour le passage en commission.', y)
      y = addBullet(doc, 'Finaliser votre pitch et votre business plan.', y)

      // ── Footer ──
      finalizeWithFooters(doc)
    })

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="suivi-tremplin-${fullName.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
