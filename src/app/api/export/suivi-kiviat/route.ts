// ============================================
// CreaPulse V2 — Suivi Kiviat PDF Export
// GET /api/export/suivi-kiviat
// Generates a branded PDF with Kiviat radar results
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'
import {
  generatePdfBuffer,
  drawCoverPage,
  drawFooter,
  addSectionHeader,
  addTable,
  addSubSectionHeader,
  addParagraph,
  addBullet,
  addKeyValueBlock,
  addSpacing,
  checkNewPage,
  scoreBar,
  finalizeWithFooters,
  type TableColumn,
  type TableRow,
} from '@/lib/pdf-utils'
import { getEnrollmentIdFromRequest, buildCompositeKey } from '@/lib/enrollment-context'

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
    const enrollmentId = getEnrollmentIdFromRequest(request)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    })
    if (!user) return Errors.notFound('Utilisateur')

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email

    // Fetch journey
    const journey = await db.creatorJourney.findUnique({
      where: { userId: userId },
      select: { projectTitle: true, currentPhase: true },
    })

    // Fetch Kiviat results
    const kiviatResults = await db.kiviatResult.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    })

    if (kiviatResults.length === 0) {
      return Errors.notFound('Résultats Kiviat')
    }

    // Generate PDF
    const pdfBuffer = await generatePdfBuffer((doc) => {
      // ── Cover Page ──
      drawCoverPage(
        doc,
        'Suivi — Compétences Kiviat',
        'Analyse radar des compétences entrepreneuriales',
        fullName,
      )

      // ── Profile Summary ──
      let y = addSectionHeader(doc, 'Profil du bénéficiaire')
      y = addKeyValueBlock(
        doc,
        [
          { key: 'Nom :', value: fullName },
          { key: 'Projet :', value: journey?.projectTitle || 'Non défini' },
          { key: 'Phase :', value: journey?.currentPhase || 'Non définie' },
          { key: 'Nombre de dimensions :', value: `${kiviatResults.length}` },
        ],
        y,
      )
      addSpacing(doc, 10)

      // ── Kiviat Scores Table ──
      checkNewPage(doc, 260)
      y = addSectionHeader(doc, 'Résultats par dimension')

      const scoreColumns: TableColumn[] = [
        { header: 'Dimension', width: 180, align: 'left' },
        { header: 'Note /10', width: 80, align: 'center' },
        { header: 'Évaluation', width: 185, align: 'left' },
      ]

      const scoreRows: TableRow[] = kiviatResults.map((k) => {
        const score = k.score
        let label = 'À renforcer'
        if (score >= 8) label = 'Excellent'
        else if (score >= 6) label = 'Bon'
        else if (score >= 4) label = 'Moyen'
        else if (score >= 2) label = 'Faible'

        return {
          cells: [k.category, score.toFixed(1), scoreBar(score, k.maxScore || 10)],
          textColor: score >= 6 ? '#2E7D32' : score >= 4 ? '#F57F17' : '#C62828',
        }
      })

      y = addTable(doc, scoreColumns, scoreRows, y)
      addSpacing(doc, 10)

      // ── Global Average ──
      checkNewPage(doc, 100)
      const totalScore = kiviatResults.reduce((sum, k) => sum + k.score, 0)
      const avgScore = totalScore / kiviatResults.length
      const maxScore = kiviatResults[0]?.maxScore || 10

      y = addSectionHeader(doc, 'Score global moyen')
      y = addKeyValueBlock(
        doc,
        [
          { key: 'Moyenne générale :', value: `${avgScore.toFixed(1)} / ${maxScore}` },
          { key: 'Barre de progression :', value: scoreBar(avgScore, maxScore, 20) },
        ],
        y,
      )
      addSpacing(doc, 10)

      // ── Strengths ──
      const strengths = kiviatResults
        .filter((k) => k.score >= 7)
        .sort((a, b) => b.score - a.score)

      if (strengths.length > 0) {
        checkNewPage(doc, 60 + strengths.length * 24)
        y = addSectionHeader(doc, 'Points forts')
        for (const s of strengths) {
          y = addBullet(doc, `${s.category} : ${s.score.toFixed(1)}/10`, y)
        }
        addSpacing(doc, 10)
      }

      // ── Areas to improve ──
      const improvements = kiviatResults
        .filter((k) => k.score < 5)
        .sort((a, b) => a.score - b.score)

      if (improvements.length > 0) {
        checkNewPage(doc, 60 + improvements.length * 24)
        y = addSectionHeader(doc, 'Axes d\'amélioration')
        for (const imp of improvements) {
          y = addBullet(doc, `${imp.category} : ${imp.score.toFixed(1)}/10 — à renforcer`, y)
        }
        addSpacing(doc, 10)
      }

      // ── Recommendations ──
      checkNewPage(doc, 80)
      y = addSectionHeader(doc, 'Recommandations')
      y = addSubSectionHeader(doc, 'Actions suggérées', y)

      if (improvements.length > 0) {
        y = addParagraph(
          doc,
          `Nous vous recommandons de vous concentrer sur les ${improvements.length} dimension(s) en dessous de la moyenne. Formez-vous sur ces compétences et pratiquez des exercices ciblés.`,
          y,
        )
      } else {
        y = addParagraph(
          doc,
          'Félicitations ! Vos compétences entrepreneuriales sont équilibrées. Continuez à les développer régulièrement.',
          y,
        )
      }

      y = addSubSectionHeader(doc, 'Prochaines étapes', y)
      y = addBullet(doc, 'Réévaluez vos compétences dans 3 mois pour mesurer votre progression.', y)
      y = addBullet(doc, 'Consultez les ressources de formation dans les dimensions à renforcer.', y)
      y = addBullet(doc, 'Partagez vos résultats avec votre conseiller lors du prochain entretien.', y)

      // ── Footer on all content pages ──
      finalizeWithFooters(doc)
    })

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="suivi-kiviat-${fullName.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
