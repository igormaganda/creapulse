// ============================================
// CreaPulse V2 — Suivi Parcours Complet PDF Export
// GET /api/export/suivi-parcours
// Generates a comprehensive 3-5 page follow-up PDF
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
  scoreBar,
  finalizeWithFooters,
  formatDate,
  type TableColumn,
  type TableRow,
  COLORS,
} from '@/lib/pdf-utils'

// ─── Module code labels ──────────────────────

const MODULE_LABELS: Record<string, string> = {
  'profil-createur': 'Profil Créateur',
  riasec: 'Test RIASEC',
  kiviat: 'Compétences Kiviat',
  'mon-projet': 'Mon Projet',
  marche: 'Analyse de Marché',
  juridique: 'Analyse Juridique',
  creasim: 'Plan Financier',
  'business-plan': 'Business Plan',
  tremplin: 'Tremplin',
}

function getModuleLabel(code: string): string {
  return MODULE_LABELS[code] || code
}

// ─── RIASEC labels ───────────────────────────

const RIASEC_LABELS: Record<string, string> = {
  R: 'Réaliste',
  I: 'Investigateur',
  A: 'Artistique',
  S: 'Social',
  E: 'Entrepreneur',
  C: 'Conventionnel',
}

// ─── Phase labels ────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  DISCOVERY: 'Découverte',
  PROFILING: 'Profiling',
  MODELING: 'Modélisation',
  STRATEGY: 'Stratégie',
  ECOSYSTEM: 'Écosystème',
  LAUNCH: 'Lancement',
  POST_CREATION: 'Post-création',
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
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    })
    if (!user) return Errors.notFound('Utilisateur')

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email

    // Fetch journey
    const journey = await db.creatorJourney.findUnique({
      where: { userId },
    })

    // Fetch Kiviat results
    const kiviatResults = await db.kiviatResult.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    })

    // Fetch RIASEC results
    const riasecResults = await db.riasecResult.findMany({
      where: { userId },
      orderBy: [{ isDominant: 'desc' }, { score: 'desc' }],
    })

    // Fetch module results
    const moduleResults = await db.moduleResult.findMany({
      where: { userId },
      orderBy: { completedAt: 'asc' },
    })

    // Fetch Tremplin
    const tremplin = await db.tremplin.findUnique({
      where: { userId },
    })

    // Fetch CreaSim (brief info)
    const creasim = await db.creaSimSimulation.findUnique({
      where: { userId },
      select: {
        monthlyRevenue: true,
        grossMarginRate: true,
        netMarginRate: true,
        year1Revenue: true,
        year1Expenses: true,
      },
    })

    // Fetch BMC (existence check)
    const bmc = await db.businessModelCanvas.findUnique({
      where: { userId },
      select: { status: true, generatedAt: true },
    })

    // Fetch interviews
    const interviews = await db.interviewSession.findMany({
      where: { beneficiaryId: userId },
      orderBy: { scheduledAt: 'desc' },
      take: 5,
    })

    // Fetch interview notes
    const interviewIds = interviews.map((i) => i.id)
    const interviewNotes = interviewIds.length > 0
      ? await db.interviewNote.findMany({
          where: { interviewId: { in: interviewIds }, isKeyPoint: true },
          include: { interview: { select: { scheduledAt: true, type: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
      : []

    // Generate PDF
    const pdfBuffer = await generatePdfBuffer((doc) => {
      // ── Cover Page ──
      drawCoverPage(
        doc,
        'Suivi de Parcours Complet',
        'Bilan global du parcours créateur',
        fullName,
      )

      // ═══════════════════════════════════════
      // PAGE 2: Profile + Kiviat Summary
      // ═══════════════════════════════════════

      // ── Profile Summary ──
      let y = addSectionHeader(doc, 'Résumé du profil')
      y = addKeyValueBlock(
        doc,
        [
          { key: 'Nom :', value: fullName },
          { key: 'Email :', value: user.email },
          { key: 'Projet :', value: journey?.projectTitle || 'Non défini' },
          { key: 'Secteur :', value: journey?.projectSector || 'Non défini' },
          {
            key: 'Phase actuelle :',
            value: PHASE_LABELS[journey?.currentPhase || ''] || journey?.currentPhase || '—',
          },
          {
            key: 'Progression :',
            value: `${journey?.progressPercent || 0}%`,
          },
          {
            key: 'Date d\'inscription :',
            value: formatDate(user.createdAt),
          },
        ],
        y,
      )
      y = addSpacing(doc, 14, y)

      // ── Kiviat Radar Summary ──
      if (kiviatResults.length > 0) {
        y = checkNewPage(doc, 260, y)
        y = addSectionHeader(doc, 'Compétences Kiviat — Résumé', y)

        const kiviatColumns: TableColumn[] = [
          { header: 'Dimension', width: 200, align: 'left' },
          { header: 'Score', width: 70, align: 'center' },
          { header: 'Barre', width: 175, align: 'left' },
        ]

        const totalScore = kiviatResults.reduce((sum, k) => sum + k.score, 0)
        const avgScore = totalScore / kiviatResults.length
        const maxScore = kiviatResults[0]?.maxScore || 10

        const kiviatRows: TableRow[] = kiviatResults.map((k) => ({
          cells: [k.category, k.score.toFixed(1), scoreBar(k.score, maxScore)],
        }))

        // Add average row
        kiviatRows.push({
          cells: ['MOYENNE GÉNÉRALE', avgScore.toFixed(1), scoreBar(avgScore, maxScore)],
          fillColor: COLORS.lightGray,
          textColor: COLORS.primary,
        })

        y = addTable(doc, kiviatColumns, kiviatRows, y)
        y = addSpacing(doc, 14, y)
      }

      // ── RIASEC Profile ──
      if (riasecResults.length > 0) {
        y = checkNewPage(doc, 180, y)
        y = addSectionHeader(doc, 'Profil RIASEC', y)

        const dominant = riasecResults.filter((r) => r.isDominant)
        if (dominant.length > 0) {
          y = addParagraph(
            doc,
            `Profil(s) dominant(s) : ${dominant.map((r) => RIASEC_LABELS[r.profileType] || r.profileType).join(', ')}`,
            y,
          )
        }

        const riasecColumns: TableColumn[] = [
          { header: 'Type', width: 160, align: 'left' },
          { header: 'Score', width: 70, align: 'center' },
          { header: 'Dominant', width: 100, align: 'center' },
          { header: 'Description', width: 115, align: 'left' },
        ]

        const riasecRows: TableRow[] = riasecResults.map((r) => ({
          cells: [
            RIASEC_LABELS[r.profileType] || r.profileType,
            r.score.toFixed(0),
            r.isDominant ? '★ Oui' : 'Non',
            r.isDominant ? 'Profil principal' : 'Secondaire',
          ],
          textColor: r.isDominant ? COLORS.primary : COLORS.dark,
        }))

        y = addTable(doc, riasecColumns, riasecRows, y)
        y = addSpacing(doc, 14, y)
      }

      // ═══════════════════════════════════════
      // PAGE 3: Module Completion + Tremplin
      // ═══════════════════════════════════════

      // ── Module Completion Status ──
      y = checkNewPage(doc, 260, y)
      y = addSectionHeader(doc, 'Avancement des modules', y)

      const moduleColumns: TableColumn[] = [
        { header: 'Module', width: 200, align: 'left' },
        { header: 'Statut', width: 90, align: 'center' },
        { header: 'Score', width: 70, align: 'center' },
        { header: 'Date', width: 85, align: 'center' },
      ]

      const moduleRows: TableRow[] = Object.keys(MODULE_LABELS).map((code) => {
        const result = moduleResults.find((r) => r.moduleCode === code)
        const status = result?.completedAt ? 'Terminé' : result ? 'En cours' : 'Non commencé'
        return {
          cells: [
            MODULE_LABELS[code],
            status,
            result ? `${result.score}/${result.maxScore}` : '—',
            result?.completedAt ? formatDate(result.completedAt) : '—',
          ],
          fillColor: result?.completedAt ? '#E8F5E9' : undefined,
        }
      })

      y = addTable(doc, moduleColumns, moduleRows, y)

      const completedCount = moduleResults.filter((m) => m.completedAt).length
      y = addParagraph(
        doc,
        `Progression : ${completedCount}/${Object.keys(MODULE_LABELS).length} modules terminés (${Math.round((completedCount / Object.keys(MODULE_LABELS).length) * 100)}%).`,
        y,
      )
      y = addSpacing(doc, 14, y)

      // ── Tremplin Status ──
      y = checkNewPage(doc, 120, y)
      y = addSectionHeader(doc, 'Statut Tremplin', y)

      if (tremplin) {
        const decisionStr = tremplin.decision || 'PENDING'
        y = addDecisionBadge(doc, decisionStr, y)

        if (tremplin.score != null) {
          y = addKeyValueBlock(
            doc,
            [
              { key: 'Score :', value: `${tremplin.score}/100` },
              { key: 'Complété :', value: tremplin.isCompleted ? 'Oui' : 'Non' },
              {
                key: 'Date :',
                value: tremplin.completedAt ? formatDate(tremplin.completedAt) : '—',
              },
            ],
            y,
          )
        }
      } else {
        y = addParagraph(doc, 'Tremplin non encore commencé.', y)
      }
      y = addSpacing(doc, 14, y)

      // ═══════════════════════════════════════
      // PAGE 4: CreaSim + BMC + Interviews
      // ═══════════════════════════════════════

      // ── CreaSim Brief ──
      if (creasim) {
        y = checkNewPage(doc, 100, y)
        y = addSectionHeader(doc, 'Simulation financière (CreaSim)', y)
        y = addKeyValueBlock(
          doc,
          [
            {
              key: 'CA mensuel estimé :',
              value: creasim.monthlyRevenue != null
                ? `${creasim.monthlyRevenue.toLocaleString('fr-FR')} €`
                : '—',
            },
            {
              key: 'Marge brute :',
              value: creasim.grossMarginRate != null
                ? `${creasim.grossMarginRate.toFixed(1)} %`
                : '—',
            },
            {
              key: 'Marge nette :',
              value: creasim.netMarginRate != null
                ? `${creasim.netMarginRate.toFixed(1)} %`
                : '—',
            },
            {
              key: 'CA Année 1 :',
              value: creasim.year1Revenue != null
                ? `${Math.round(creasim.year1Revenue).toLocaleString('fr-FR')} €`
                : '—',
            },
          ],
          y,
        )
        y = addSpacing(doc, 14, y)
      }

      // ── BMC Status ──
      if (bmc) {
        y = checkNewPage(doc, 80, y)
        y = addSectionHeader(doc, 'Business Model Canvas', y)
        y = addKeyValueBlock(
          doc,
          [
            { key: 'Statut :', value: bmc.status },
            {
              key: 'Généré le :',
              value: bmc.generatedAt ? formatDate(bmc.generatedAt) : '—',
            },
          ],
          y,
        )
        y = addSpacing(doc, 14, y)
      }

      // ── Key Interview Notes ──
      if (interviewNotes.length > 0) {
        y = checkNewPage(doc, 80 + interviewNotes.length * 24, y)
        y = addSectionHeader(doc, 'Notes clés des entretiens', y)

        for (const note of interviewNotes) {
          const dateStr = note.interview?.scheduledAt
            ? formatDate(note.interview.scheduledAt)
            : ''
          const typeStr = note.interview?.type ? ` (${note.interview.type})` : ''
          y = addBullet(
            doc,
            `[${dateStr}${typeStr}] ${note.content}`,
            y,
          )
        }
        y = addSpacing(doc, 14, y)
      }

      // ═══════════════════════════════════════
      // PAGE 5: Recommendations
      // ═══════════════════════════════════════

      y = checkNewPage(doc, 200, y)
      y = addSectionHeader(doc, 'Recommandations et actions', y)

      y = addSubSectionHeader(doc, 'Actions prioritaires', y)

      // Generate contextual recommendations
      if (kiviatResults.length > 0) {
        const weakDims = kiviatResults.filter((k) => k.score < 5)
        if (weakDims.length > 0) {
          y = addBullet(
            doc,
            `Renforcer les compétences en ${weakDims.map((d) => d.category).join(', ')} via les formations recommandées.`,
            y,
          )
        }
      }

      const incompleteModules = moduleResults.filter((m) => !m.completedAt)
      if (incompleteModules.length > 0) {
        y = addBullet(
          doc,
          `Terminer les modules en cours : ${incompleteModules.map((m) => getModuleLabel(m.moduleCode)).join(', ')}.`,
          y,
        )
      }

      if (tremplin && !tremplin.isCompleted) {
        y = addBullet(doc, 'Finaliser l\'évaluation Tremplin pour valider le projet.', y)
      }

      if (!bmc) {
        y = addBullet(doc, 'Générer le Business Model Canvas pour structurer votre modèle.', y)
      }

      if (journey?.progressPercent && journey.progressPercent < 100) {
        y = addBullet(
          doc,
          `Continuer le parcours pour atteindre 100% de progression (actuel : ${journey.progressPercent}%).`,
          y,
        )
      }

      y = addSpacing(doc, 12, y)

      y = addSubSectionHeader(doc, 'Rappel du contact', y)
      y = addParagraph(
        doc,
        'Prenez rendez-vous avec votre conseiller GIDEF pour faire le point sur votre progression et ajuster votre plan d\'action.',
        y,
      )

      // ── Footer ──
      finalizeWithFooters(doc)
    })

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="suivi-parcours-${fullName.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
