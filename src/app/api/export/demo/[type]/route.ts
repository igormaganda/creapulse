// ============================================
// CreaPulse V2 — Public Demo PDF Export
// GET /api/export/demo/[type]
// No authentication required — uses demo beneficiary
// Supported types: suivi-kiviat, suivi-tremplin, suivi-creasim, suivi-parcours, bmc
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/api-response'
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
  formatCurrency,
  formatPercent,
  type TableColumn,
  type TableRow,
  COLORS,
} from '@/lib/pdf-utils'

// ─── Constants ────────────────────────────────

const DEMO_USER_ID = 'beneficiaire-demo-001'

const VALID_TYPES = [
  'suivi-kiviat',
  'suivi-tremplin',
  'suivi-creasim',
  'suivi-parcours',
  'bmc',
  'business-plan',
] as const

export type DemoExportType = (typeof VALID_TYPES)[number]

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

// ─── BMC block definitions ───────────────────

const BMC_BLOCKS: { key: string; label: string }[] = [
  { key: 'partenairesCles', label: 'Partenaires Clés' },
  { key: 'activitesCles', label: 'Activités Clés' },
  { key: 'ressourcesCles', label: 'Ressources Clés' },
  { key: 'propositionValeur', label: 'Proposition de Valeur' },
  { key: 'relationsClients', label: 'Relations Clients' },
  { key: 'canaux', label: 'Canaux' },
  { key: 'segmentsClients', label: 'Segments Clients' },
  { key: 'structureCouts', label: 'Structure des Coûts' },
  { key: 'sourcesRevenus', label: 'Sources de Revenus' },
]

// ─── Helper: fetch common demo user ─────────

async function fetchDemoUser() {
  const user = await db.user.findUnique({
    where: { id: DEMO_USER_ID },
    select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
  })
  if (!user) {
    throw new Error('Demo beneficiary not found. Please seed the database.')
  }
  return {
    ...user,
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
  }
}

// ─── PDF Builders ────────────────────────────

async function buildKiviatPdf(
  fullName: string,
  email: string,
) {
  // Fetch journey
  const journey = await db.creatorJourney.findUnique({
    where: { userId: DEMO_USER_ID },
    select: { projectTitle: true, currentPhase: true },
  })

  // Fetch Kiviat results
  const kiviatResults = await db.kiviatResult.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: { category: 'asc' },
  })

  if (kiviatResults.length === 0) {
    return null
  }

  return generatePdfBuffer((doc) => {
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
    y = addSpacing(doc, 10, y)

    // ── Kiviat Scores Table ──
    y = checkNewPage(doc, 260, y)
    y = addSectionHeader(doc, 'Résultats par dimension', y)

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
    y = addSpacing(doc, 10, y)

    // ── Global Average ──
    y = checkNewPage(doc, 100, y)
    const totalScore = kiviatResults.reduce((sum, k) => sum + k.score, 0)
    const avgScore = totalScore / kiviatResults.length
    const maxScore = kiviatResults[0]?.maxScore || 10

    y = addSectionHeader(doc, 'Score global moyen', y)
    y = addKeyValueBlock(
      doc,
      [
        { key: 'Moyenne générale :', value: `${avgScore.toFixed(1)} / ${maxScore}` },
        { key: 'Barre de progression :', value: scoreBar(avgScore, maxScore, 20) },
      ],
      y,
    )
    y = addSpacing(doc, 10, y)

    // ── Strengths ──
    const strengths = kiviatResults
      .filter((k) => k.score >= 7)
      .sort((a, b) => b.score - a.score)

    if (strengths.length > 0) {
      y = checkNewPage(doc, 60 + strengths.length * 24, y)
      y = addSectionHeader(doc, 'Points forts', y)
      for (const s of strengths) {
        y = addBullet(doc, `${s.category} : ${s.score.toFixed(1)}/10`, y)
      }
      y = addSpacing(doc, 10, y)
    }

    // ── Areas to improve ──
    const improvements = kiviatResults
      .filter((k) => k.score < 5)
      .sort((a, b) => a.score - b.score)

    if (improvements.length > 0) {
      y = checkNewPage(doc, 60 + improvements.length * 24, y)
      y = addSectionHeader(doc, 'Axes d\'amélioration', y)
      for (const imp of improvements) {
        y = addBullet(doc, `${imp.category} : ${imp.score.toFixed(1)}/10 — à renforcer`, y)
      }
      y = addSpacing(doc, 10, y)
    }

    // ── Recommendations ──
    y = checkNewPage(doc, 80, y)
    y = addSectionHeader(doc, 'Recommandations', y)
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
}

async function buildTremplinPdf(
  fullName: string,
) {
  // Fetch journey
  const journey = await db.creatorJourney.findUnique({
    where: { userId: DEMO_USER_ID },
    select: { projectTitle: true },
  })

  // Fetch Tremplin
  const tremplin = await db.tremplin.findUnique({
    where: { userId: DEMO_USER_ID },
  })

  if (!tremplin) {
    return null
  }

  return generatePdfBuffer((doc) => {
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
    y = addSpacing(doc, 12, y)

    // ── Decision Badge ──
    y = checkNewPage(doc, 100, y)
    y = addSectionHeader(doc, 'Décision', y)

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
      y = addSpacing(doc, 6, y)
      y = addParagraph(doc, tremplin.summary, y)
    }

    y = addSpacing(doc, 12, y)

    // ── Step-by-step responses ──
    y = checkNewPage(doc, 260, y)
    y = addSectionHeader(doc, 'Détail des étapes', y)

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

    y = addSpacing(doc, 12, y)

    // ── Recommendations ──
    const recommendations = tremplin.recommendations as string[] | null
    if (recommendations && recommendations.length > 0) {
      y = checkNewPage(doc, 60 + recommendations.length * 24, y)
      y = addSectionHeader(doc, 'Recommandations', y)
      for (const rec of recommendations) {
        y = addBullet(doc, rec, y)
      }
      y = addSpacing(doc, 10, y)
    }

    // ── Next steps ──
    y = checkNewPage(doc, 80, y)
    y = addSectionHeader(doc, 'Prochaines étapes', y)
    y = addBullet(doc, 'Revoir les étapes incomplètes avec votre conseiller.', y)
    y = addBullet(doc, 'Préparer les arguments pour le passage en commission.', y)
    y = addBullet(doc, 'Finaliser votre pitch et votre business plan.', y)

    // ── Footer ──
    finalizeWithFooters(doc)
  })
}

async function buildCreaSimPdf(
  fullName: string,
) {
  // Fetch journey
  const journey = await db.creatorJourney.findUnique({
    where: { userId: DEMO_USER_ID },
    select: { projectTitle: true, projectSector: true },
  })

  // Fetch CreaSim simulation
  const creasim = await db.creaSimSimulation.findUnique({
    where: { userId: DEMO_USER_ID },
  })

  if (!creasim) {
    return null
  }

  return generatePdfBuffer((doc) => {
    // ── Cover Page ──
    drawCoverPage(
      doc,
      'Suivi — Simulation Financière',
      'CreaSim — Prévisionnel financier',
      fullName,
    )

    // ── Project Info ──
    let y = addSectionHeader(doc, 'Informations du projet')
    y = addKeyValueBlock(
      doc,
      [
        { key: 'Bénéficiaire :', value: fullName },
        { key: 'Projet :', value: journey?.projectTitle || 'Non défini' },
        { key: 'Secteur :', value: journey?.projectSector || 'Non défini' },
      ],
      y,
    )
    y = addSpacing(doc, 12, y)

    // ── Monthly Simulation Summary ──
    y = checkNewPage(doc, 180, y)
    y = addSectionHeader(doc, 'Simulation mensuelle', y)

    y = addSubSectionHeader(doc, 'Chiffre d\'affaires et charges', y)

    const monthlyColumns: TableColumn[] = [
      { header: 'Indicateur', width: 220, align: 'left' },
      { header: 'Montant', width: 225, align: 'right' },
    ]

    const fixedChargesArray = (creasim.fixedCharges as Array<{ name: string; amount: number }>) || []
    const fixedChargesTotal = creasim.fixedChargesTotal ?? fixedChargesArray.reduce((s, c) => s + c.amount, 0)
    const variableCharges = creasim.variableChargesAmount
      ?? (creasim.monthlyRevenue != null && creasim.variableChargesRate != null
        ? (creasim.monthlyRevenue * creasim.variableChargesRate) / 100
        : 0)
    const totalCharges = creasim.totalCharges ?? fixedChargesTotal + variableCharges
    const grossMargin = creasim.grossMarginAmount
      ?? (creasim.monthlyRevenue != null ? creasim.monthlyRevenue - variableCharges : 0)
    const netMargin = creasim.netMarginAmount
      ?? (grossMargin - fixedChargesTotal)

    const monthlyRows: TableRow[] = [
      {
        cells: ['Chiffre d\'affaires (CA)', formatCurrency(creasim.monthlyRevenue)],
        textColor: COLORS.dark,
      },
      {
        cells: ['Charges variables', formatCurrency(variableCharges)],
        textColor: COLORS.gray,
      },
      {
        cells: ['Charges fixes', formatCurrency(fixedChargesTotal)],
        textColor: COLORS.gray,
      },
      {
        cells: ['Total des charges', formatCurrency(totalCharges)],
        textColor: COLORS.danger,
        fillColor: '#FFF3E0',
      },
      {
        cells: ['Marge brute', formatCurrency(grossMargin)],
        textColor: grossMargin >= 0 ? COLORS.success : COLORS.danger,
      },
      {
        cells: ['Marge nette', formatCurrency(netMargin)],
        textColor: netMargin >= 0 ? COLORS.success : COLORS.danger,
        fillColor: netMargin >= 0 ? '#E8F5E9' : '#FFEBEE',
      },
    ]

    y = addTable(doc, monthlyColumns, monthlyRows, y)
    y = addSpacing(doc, 10, y)

    // Margins percentages
    y = addSubSectionHeader(doc, 'Taux de marge', y)
    y = addKeyValueBlock(
      doc,
      [
        {
          key: 'Taux de marge brute :',
          value: formatPercent(creasim.grossMarginRate),
        },
        {
          key: 'Taux de marge nette :',
          value: formatPercent(creasim.netMarginRate),
        },
        {
          key: 'Objectif de marge :',
          value: formatPercent(creasim.targetMarginRate),
        },
      ],
      y,
    )
    y = addSpacing(doc, 12, y)

    // ── 3-Year Projection ──
    y = checkNewPage(doc, 180, y)
    y = addSectionHeader(doc, 'Projection sur 3 ans', y)

    const projectionColumns: TableColumn[] = [
      { header: 'Indicateur', width: 160, align: 'left' },
      { header: 'Année 1', width: 90, align: 'right' },
      { header: 'Année 2', width: 90, align: 'right' },
      { header: 'Année 3', width: 105, align: 'right' },
    ]

    const y1r = creasim.year1Revenue ?? 0
    const y1e = creasim.year1Expenses ?? 0
    const y2r = creasim.year2Revenue ?? 0
    const y2e = creasim.year2Expenses ?? 0
    const y3r = creasim.year3Revenue ?? 0
    const y3e = creasim.year3Expenses ?? 0

    const projectionRows: TableRow[] = [
      {
        cells: ['Revenus', formatCurrency(y1r), formatCurrency(y2r), formatCurrency(y3r)],
        textColor: COLORS.dark,
      },
      {
        cells: ['Charges', formatCurrency(y1e), formatCurrency(y2e), formatCurrency(y3e)],
        textColor: COLORS.danger,
      },
      {
        cells: [
          'Résultat net',
          formatCurrency(y1r - y1e),
          formatCurrency(y2r - y2e),
          formatCurrency(y3r - y3e),
        ],
        textColor: (y1r - y1e) >= 0 ? COLORS.success : COLORS.danger,
        fillColor: '#E8F5E9',
      },
    ]

    y = addTable(doc, projectionColumns, projectionRows, y)

    // Profitability summary
    if (creasim.profitability1Y != null || creasim.profitability2Y != null || creasim.profitability3Y != null) {
      y = addSpacing(doc, 8, y)
      y = addSubSectionHeader(doc, 'Rentabilité cumulée', y)
      y = addKeyValueBlock(
        doc,
          [
            { key: 'Année 1 :', value: formatPercent(creasim.profitability1Y) },
            { key: 'Année 2 :', value: formatPercent(creasim.profitability2Y) },
            { key: 'Année 3 :', value: formatPercent(creasim.profitability3Y) },
          ],
        y,
      )
    }
    y = addSpacing(doc, 12, y)

    // ── Break-even Analysis ──
    y = checkNewPage(doc, 120, y)
    y = addSectionHeader(doc, 'Analyse du seuil de rentabilité', y)

    y = addKeyValueBlock(
      doc,
      [
        {
          key: 'CA de seuil (mensuel) :',
          value: formatCurrency(creasim.monthlyBreakeven),
        },
        {
          key: 'Délai avant rentabilité :',
          value: creasim.breakevenMonths != null
            ? `${Math.round(creasim.breakevenMonths)} mois`
            : '—',
        },
        {
          key: 'Investissement initial :',
          value: formatCurrency(creasim.initialInvestment),
        },
      ],
      y,
    )

    if (creasim.monthlyBreakeven != null && creasim.monthlyRevenue != null) {
      y = addSpacing(doc, 6, y)
      if (creasim.monthlyRevenue >= creasim.monthlyBreakeven) {
        y = addParagraph(
          doc,
          `Le CA mensuel estimé (${formatCurrency(creasim.monthlyRevenue)}) est supérieur au seuil de rentabilité (${formatCurrency(creasim.monthlyBreakeven)}). Le projet est financièrement viable sur cette base.`,
          y,
          { color: COLORS.success },
        )
      } else {
        y = addParagraph(
          doc,
          `Le CA mensuel estimé (${formatCurrency(creasim.monthlyRevenue)}) est inférieur au seuil de rentabilité (${formatCurrency(creasim.monthlyBreakeven)}). Il est nécessaire d'augmenter le CA ou de réduire les charges.`,
          y,
          { color: COLORS.danger },
        )
      }
    }
    y = addSpacing(doc, 12, y)

    // ── Fixed charges detail ──
    if (fixedChargesArray.length > 0) {
      y = checkNewPage(doc, 80 + fixedChargesArray.length * 22, y)
      y = addSectionHeader(doc, 'Détail des charges fixes', y)

      const chargesColumns: TableColumn[] = [
        { header: 'Poste de charge', width: 280, align: 'left' },
        { header: 'Montant mensuel', width: 165, align: 'right' },
      ]

      const chargesRows: TableRow[] = fixedChargesArray.map((c) => ({
        cells: [c.name, formatCurrency(c.amount)],
      }))

      // Total row
      chargesRows.push({
        cells: ['TOTAL', formatCurrency(fixedChargesTotal)],
        fillColor: COLORS.lightGray,
        textColor: COLORS.primary,
      })

      y = addTable(doc, chargesColumns, chargesRows, y)
      y = addSpacing(doc, 12, y)
    }

    // ── AI Synthesis ──
    if (creasim.aiAnalysis) {
      y = checkNewPage(doc, 120, y)
      y = addSectionHeader(doc, 'Synthèse IA', y)
      y = addParagraph(doc, creasim.aiAnalysis, y)
      y = addSpacing(doc, 12, y)
    }

    // ── Recommendations ──
    y = checkNewPage(doc, 120, y)
    y = addSectionHeader(doc, 'Recommandations', y)
    y = addBullet(doc, 'Affinez vos prévisions régulièrement avec les données réelles.', y)
    y = addBullet(doc, 'Prévoyez une trésorerie de sécurité de 3 mois minimum.', y)
    y = addBullet(doc, 'Identifiez les leviers d\'augmentation du CA et de réduction des charges.', y)
    y = addBullet(doc, 'Consultez votre conseiller pour valider les hypothèses financières.', y)

    // ── Footer ──
    finalizeWithFooters(doc)
  })
}

async function buildParcoursPdf(
  fullName: string,
  email: string,
  createdAt: Date,
) {
  // Fetch journey
  const journey = await db.creatorJourney.findUnique({
    where: { userId: DEMO_USER_ID },
  })

  // Fetch Kiviat results
  const kiviatResults = await db.kiviatResult.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: { category: 'asc' },
  })

  // Fetch RIASEC results
  const riasecResults = await db.riasecResult.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: [{ isDominant: 'desc' }, { score: 'desc' }],
  })

  // Fetch module results
  const moduleResults = await db.moduleResult.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: { completedAt: 'asc' },
  })

  // Fetch Tremplin
  const tremplin = await db.tremplin.findUnique({
    where: { userId: DEMO_USER_ID },
  })

  // Fetch CreaSim (brief info)
  const creasim = await db.creaSimSimulation.findUnique({
    where: { userId: DEMO_USER_ID },
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
    where: { userId: DEMO_USER_ID },
    select: { status: true, generatedAt: true },
  })

  // Fetch interviews
  const interviews = await db.interviewSession.findMany({
    where: { beneficiaryId: DEMO_USER_ID },
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

  return generatePdfBuffer((doc) => {
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
        { key: 'Email :', value: email },
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
          value: formatDate(createdAt),
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
        `Terminer les modules en cours : ${incompleteModules.map((m) => MODULE_LABELS[m.moduleCode] || m.moduleCode).join(', ')}.`,
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
}

async function buildBmcPdf(
  fullName: string,
) {
  // Fetch journey for project title
  const journey = await db.creatorJourney.findUnique({
    where: { userId: DEMO_USER_ID },
    select: { projectTitle: true },
  })

  // Fetch BMC
  const bmc = await db.businessModelCanvas.findUnique({
    where: { userId: DEMO_USER_ID },
  })

  if (!bmc) {
    return null
  }

  return generatePdfBuffer((doc) => {
    // ── Cover Page ──
    drawCoverPage(
      doc,
      'Business Model Canvas',
      'Modèle économique du projet',
      fullName,
    )

    // ── Project Info ──
    let y = addSectionHeader(doc, 'Informations du projet')
    y = addKeyValueBlock(
      doc,
      [
        { key: 'Bénéficiaire :', value: fullName },
        { key: 'Projet :', value: journey?.projectTitle || 'Non défini' },
        { key: 'Statut :', value: bmc.status || 'Brouillon' },
        {
          key: 'Généré le :',
          value: bmc.generatedAt ? formatDate(bmc.generatedAt) : '—',
        },
      ],
      y,
    )
    y = addSpacing(doc, 14, y)

    // ── BMC Blocks ──
    const bmcRecord = bmc as unknown as Record<string, string | null | undefined>

    for (const block of BMC_BLOCKS) {
      const content = bmcRecord[block.key] || ''
      y = checkNewPage(doc, 80, y)
      y = addSectionHeader(doc, block.label, y)

      if (content && content.trim().length > 0) {
        // Display content: replace newlines with bullets for readability
        const lines = content.split('\n').filter((l) => l.trim().length > 0)
        for (const line of lines) {
          const trimmed = line.trim().replace(/^[-•]\s*/, '')
          y = addBullet(doc, trimmed, y)
        }
      } else {
        y = addParagraph(doc, 'Non renseigné', y, { color: COLORS.gray })
      }
      y = addSpacing(doc, 8, y)
    }

    y = addSpacing(doc, 12, y)

    // ── Completion Summary ──
    const filledCount = BMC_BLOCKS.filter(
      (b) => bmcRecord[b.key] && bmcRecord[b.key]!.trim().length > 0,
    ).length

    y = addSectionHeader(doc, 'Complétion', y)
    y = addKeyValueBlock(
      doc,
      [
        { key: 'Blocs remplis :', value: `${filledCount}/${BMC_BLOCKS.length}` },
        { key: 'Taux de complétion :', value: `${Math.round((filledCount / BMC_BLOCKS.length) * 100)}%` },
      ],
      y,
    )
    y = addSpacing(doc, 12, y)

    // ── Recommendations ──
    y = checkNewPage(doc, 80, y)
    y = addSectionHeader(doc, 'Recommandations', y)
    if (filledCount < BMC_BLOCKS.length) {
      y = addBullet(doc, 'Complétez les blocs manquants pour avoir une vision complète de votre modèle.', y)
    }
    y = addBullet(doc, 'Partagez votre BMC avec votre conseiller pour validation.', y)
    y = addBullet(doc, 'Révisez régulièrement votre canvas au fur et à mesure de l\'avancement du projet.', y)

    // ── Footer ──
    finalizeWithFooters(doc)
  })
}

// ─── Business Plan Chapter Labels ─────────────

const BP_CHAPTER_LABELS: { key: string; label: string }[] = [
  { key: 'resumeOperationnel', label: 'Résumé Opérationnel' },
  { key: 'presentationPorteur', label: 'Présentation du Porteur' },
  { key: 'descriptionProjet', label: 'Description du Projet' },
  { key: 'conceptProposition', label: 'Concept et Proposition de Valeur' },
  { key: 'clienteleCible', label: 'Clientèle Cible' },
  { key: 'positionnement', label: 'Positionnement' },
  { key: 'equipeProjet', label: 'Équipe du Projet' },
  { key: 'objectifs', label: 'Objectifs' },
  { key: 'etude-marche', label: 'Étude de Marché' },
  { key: 'concurrence', label: 'Concurrence' },
  { key: 'swot', label: 'Analyse SWOT' },
  { key: 'strategieMarketing', label: 'Stratégie Marketing' },
  { key: 'strategieCommercial', label: 'Stratégie Commerciale' },
  { key: 'planCommunication', label: 'Plan de Communication' },
  { key: 'financement', label: 'Plan de Financement' },
  { key: 'compte-resultat', label: 'Compte de Résultat' },
  { key: 'investissements', label: 'Investissements' },
  { key: 'seuil-rentabilite', label: 'Seuil de Rentabilité' },
  { key: 'statut-juridique', label: 'Statut Juridique' },
  { key: 'previsionnel-social', label: 'Prévisionnel Social' },
  { key: 'structure-organisationnelle', label: 'Structure Organisationnelle' },
  { key: 'plan-operatoire', label: 'Plan Opératoire' },
  { key: 'risques', label: 'Analyse des Risques' },
  { key: 'annexes', label: 'Annexes' },
]

// Aliases for seed data keys that may differ
const BP_KEY_ALIASES: Record<string, string> = {
  resume: 'resumeOperationnel',
  'resume-operationnel': 'resumeOperationnel',
  presentation: 'presentationPorteur',
  'presentation-porteur': 'presentationPorteur',
  equipe: 'equipeProjet',
  'equipe-projet': 'equipeProjet',
  description: 'descriptionProjet',
  'description-projet': 'descriptionProjet',
  concept: 'conceptProposition',
  'concept-proposition': 'conceptProposition',
  clientele: 'clienteleCible',
  'clientele-cible': 'clienteleCible',
  segmentation: 'clienteleCible',
  objectifs: 'objectifs',
  'etude-marche': 'etude-marche',
  'etude_de-marche': 'etude-marche',
  concurrence: 'concurrence',
  swot: 'swot',
  'strategie-marketing': 'strategieMarketing',
  'strategie-marketing-2': 'strategieMarketing',
  'strategie-commercial': 'strategieCommercial',
  'plan-commercial': 'strategieCommercial',
  'plan-communication': 'planCommunication',
  financement: 'financement',
  'compte-resultat': 'compte-resultat',
  'compte_de-resultat': 'compte-resultat',
  investissements: 'investissements',
  'seuil-rentabilite': 'seuil-rentabilite',
  seuil_rentabilite: 'seuil-rentabilite',
  'statut-juridique': 'statut-juridique',
  'statut_juridique': 'statut-juridique',
  'previsionnel-social': 'previsionnel-social',
  'structure-organisationnelle': 'structure-organisationnelle',
  'plan-operatoire': 'plan-operatoire',
  calendrier: 'plan-operatoire',
  risques: 'risques',
  annexes: 'annexes',
}

/**
 * Render markdown-like content into PDF paragraphs and bullets.
 * Handles ## headers, ### sub-headers, **bold**, - bullets, and plain text.
 */
function renderMarkdownContent(
  doc: PDFDocument,
  content: string,
  startY: number,
): number {
  const lines = content.split('\n')
  let y = startY

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // ### Sub-header
    if (line.startsWith('###')) {
      const text = line.replace(/^###\s+/, '').replace(/\*\*/g, '')
      if (text) {
        y = addSubSectionHeader(doc, text, y)
      }
      continue
    }

    // ## Section header (within a chapter)
    if (line.startsWith('##')) {
      const text = line.replace(/^##\s+/, '').replace(/\*\*/g, '')
      if (text) {
        y = addSubSectionHeader(doc, text, y)
      }
      continue
    }

    // Bullet list item
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const text = line.replace(/^[-•]\s+/, '').replace(/\*\*/g, '')
      if (text) {
        y = checkNewPage(doc, 40, y)
        y = addBullet(doc, text, y)
      }
      continue
    }

    // Plain paragraph (strip ** bold markers)
    const cleanText = line.replace(/\*\*/g, '')
    if (cleanText) {
      y = checkNewPage(doc, 30, y)
      y = addParagraph(doc, cleanText, y)
    }
  }

  return y
}

/**
 * Render structured data (arrays/objects) from bpSections as PDF content.
 */
function renderStructuredContent(
  doc: PDFDocument,
  data: unknown,
  startY: number,
): number {
  let y = startY

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'string') {
        y = checkNewPage(doc, 30, y)
        y = addParagraph(doc, item, y)
      } else if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>
        // Extract a label and value
        const parts: string[] = []
        if (obj.name || obj.title || obj.source) {
          parts.push(String(obj.name || obj.title || obj.source))
        }
        if (obj.amount || obj.montant) {
          parts.push(formatCurrency(Number(obj.amount || obj.montant)))
        }
        if (obj.date || obj.completed !== undefined) {
          const status = obj.completed === true ? '✓' : '○'
          parts.push(`${status} ${String(obj.date || '')}`)
        }
        if (parts.length > 0) {
          y = checkNewPage(doc, 30, y)
          y = addBullet(doc, parts.join(' — '), y)
        }
      }
    }
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    // SWOT-like object
    const swotKeys: Record<string, string> = {
      strengths: 'Forces',
      weaknesses: 'Faiblesses',
      opportunities: 'Opportunités',
      threats: 'Menaces',
    }
    const isSwot = Object.keys(obj).some((k) => k in swotKeys)
    if (isSwot) {
      for (const [key, label] of Object.entries(swotKeys)) {
        const value = obj[key]
        if (value && typeof value === 'string') {
          y = checkNewPage(doc, 60, y)
          y = addSubSectionHeader(doc, label, y)
          const items = value.split(',').map((s: string) => s.trim()).filter(Boolean)
          for (const item of items) {
            y = checkNewPage(doc, 30, y)
            y = addBullet(doc, item, y)
          }
        }
      }
    } else {
      // compte-resultat like object with year1, year2, year3
      const yearKeys = ['year1', 'year2', 'year3']
      const hasYears = yearKeys.some((k) => k in obj)
      if (hasYears) {
        const columns: TableColumn[] = [
          { header: 'Indicateur', width: 160, align: 'left' },
          { header: 'Année 1', width: 90, align: 'right' },
          { header: 'Année 2', width: 90, align: 'right' },
          { header: 'Année 3', width: 105, align: 'right' },
        ]
        const year1 = obj.year1 as Record<string, unknown> | undefined
        const year2 = obj.year2 as Record<string, unknown> | undefined
        const year3 = obj.year3 as Record<string, unknown> | undefined
        const indicateurKeys = ['ca', 'charges', 'resultat']
        const labels: Record<string, string> = { ca: 'Chiffre d\'affaires', charges: 'Charges', resultat: 'Résultat net' }
        const rows: TableRow[] = indicateurKeys
          .filter((k) => year1?.[k] !== undefined || year2?.[k] !== undefined || year3?.[k] !== undefined)
          .map((k) => {
            const v1 = Number(year1?.[k] ?? 0)
            const v2 = Number(year2?.[k] ?? 0)
            const v3 = Number(year3?.[k] ?? 0)
            return {
              cells: [labels[k], formatCurrency(v1), formatCurrency(v2), formatCurrency(v3)],
              textColor: k === 'resultat' ? (v1 >= 0 ? COLORS.success : COLORS.danger) : COLORS.dark,
              fillColor: k === 'resultat' ? '#E8F5E9' : undefined,
            }
          })
        if (rows.length > 0) {
          y = addTable(doc, columns, rows, y)
        }
      } else {
        // Generic object — render key-value as bullets
        for (const [k, v] of Object.entries(obj)) {
          y = checkNewPage(doc, 30, y)
          if (typeof v === 'string') {
            y = addBullet(doc, `${k} : ${v}`, y)
          } else {
            y = addBullet(doc, `${k} : ${JSON.stringify(v)}`, y)
          }
        }
      }
    }
  }

  return y
}

async function buildBusinessPlanPdf(fullName: string) {
  // ── Fetch journey with bpSections ──
  const journey = await db.creatorJourney.findUnique({
    where: { userId: DEMO_USER_ID },
    select: {
      bpSections: true,
      bpStatus: true,
      bpScore: true,
      projectTitle: true,
      projectSector: true,
    },
  })

  if (!journey?.bpSections || (typeof journey.bpSections === 'object' && Object.keys(journey.bpSections as object).length === 0)) {
    return null
  }

  const bpSections = journey.bpSections as Record<string, unknown>

  // ── Fetch supplementary data ──
  const financialForecast = await db.financialForecast.findUnique({
    where: { userId: DEMO_USER_ID },
  })

  const creasim = await db.creaSimSimulation.findUnique({
    where: { userId: DEMO_USER_ID },
    select: {
      monthlyBreakeven: true,
      breakevenMonths: true,
      year1Revenue: true, year1Expenses: true,
      year2Revenue: true, year2Expenses: true,
      year3Revenue: true, year3Expenses: true,
    },
  })

  const juridique = await db.juridiqueAnalysis.findUnique({
    where: { userId: DEMO_USER_ID },
  })

  const riasecResults = await db.riasecResult.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: [{ isDominant: 'desc' }, { score: 'desc' }],
    take: 3,
  })

  return generatePdfBuffer((doc) => {
    // ── Cover Page ──
    const projectTitle = journey.projectTitle || 'Projet Entrepreneurial'
    drawCoverPage(
      doc,
      'Business Plan Complet',
      `Plan d\'affaires détaillé — ${projectTitle}`,
      fullName,
    )

    // ── Project Summary ──
    let y = addSectionHeader(doc, 'Résumé du projet')
    y = addKeyValueBlock(
      doc,
      [
        { key: 'Bénéficiaire :', value: fullName },
        { key: 'Projet :', value: projectTitle },
        { key: 'Secteur :', value: journey.projectSector || 'Non défini' },
        { key: 'Statut BP :', value: journey.bpStatus || 'Non démarré' },
        {
          key: 'Score de complétion :',
          value: journey.bpScore != null ? `${journey.bpScore}/100` : '—',
        },
      ],
      y,
    )

    if (journey.bpScore != null) {
      y = addSpacing(doc, 6, y)
      y = checkNewPage(doc, 60, y)
      y = addKeyValueBlock(
        doc,
        [{ key: 'Progression :', value: scoreBar(journey.bpScore, 100, 30) }],
        y,
      )
    }
    y = addSpacing(doc, 14, y)

    // ── Team Skills Summary (RIASEC) ──
    if (riasecResults.length > 0) {
      y = checkNewPage(doc, 100, y)
      y = addSectionHeader(doc, 'Compétences de l\'équipe (RIASEC)', y)
      const dominantProfiles = riasecResults.filter((r) => r.isDominant)
      if (dominantProfiles.length > 0) {
        y = addParagraph(
          doc,
          `Profil(s) dominant(s) : ${dominantProfiles.map((r) => RIASEC_LABELS[r.profileType] || r.profileType).join(', ')}`,
          y,
        )
      }
      for (const r of riasecResults) {
        y = addBullet(
          doc,
          `${RIASEC_LABELS[r.profileType] || r.profileType} : ${r.score.toFixed(0)}/10${r.isDominant ? ' ★' : ''}`,
          y,
        )
      }
      y = addSpacing(doc, 14, y)
    }

    // ── Business Plan Chapters ──
    // Build a normalized map: canonical key → content
    const sectionMap = new Map<string, unknown>()
    for (const [key, value] of Object.entries(bpSections)) {
      const canonical = BP_KEY_ALIASES[key] || key
      if (!sectionMap.has(canonical)) {
        sectionMap.set(canonical, value)
      }
    }

    for (const chapter of BP_CHAPTER_LABELS) {
      const content = sectionMap.get(chapter.key)
      if (content == null) continue

      y = checkNewPage(doc, 60, y)
      y = addSectionHeader(doc, chapter.label, y)

      if (typeof content === 'string') {
        y = renderMarkdownContent(doc, content, y)
      } else {
        y = renderStructuredContent(doc, content, y)
      }

      y = addSpacing(doc, 10, y)
    }

    // ── Legal Status (from juridique analysis) ──
    if (juridique) {
      y = checkNewPage(doc, 100, y)
      y = addSectionHeader(doc, 'Détail du Statut Juridique', y)
      y = addKeyValueBlock(
        doc,
        [
          {
            key: 'Forme juridique :',
            value: juridique.legalStructure || juridique.recommendedStatus || 'Non défini',
          },
          { key: 'Régime fiscal :', value: juridique.fiscalRegime || '—' },
        ],
        y,
      )
      y = addSpacing(doc, 14, y)
    }

    // ── Financial Summary (3-year projection) ──
    if (financialForecast || creasim) {
      y = checkNewPage(doc, 180, y)
      y = addSectionHeader(doc, 'Prévisions Financières — Synthèse', y)

      const y1r = financialForecast?.year1Revenue ?? creasim?.year1Revenue ?? 0
      const y1e = financialForecast?.year1Expenses ?? creasim?.year1Expenses ?? 0
      const y2r = financialForecast?.year2Revenue ?? creasim?.year2Revenue ?? 0
      const y2e = financialForecast?.year2Expenses ?? creasim?.year2Expenses ?? 0
      const y3r = financialForecast?.year3Revenue ?? creasim?.year3Revenue ?? 0
      const y3e = financialForecast?.year3Expenses ?? creasim?.year3Expenses ?? 0

      const projectionColumns: TableColumn[] = [
        { header: 'Indicateur', width: 160, align: 'left' },
        { header: 'Année 1', width: 90, align: 'right' },
        { header: 'Année 2', width: 90, align: 'right' },
        { header: 'Année 3', width: 105, align: 'right' },
      ]

      const projectionRows: TableRow[] = [
        {
          cells: ['Revenus', formatCurrency(y1r), formatCurrency(y2r), formatCurrency(y3r)],
          textColor: COLORS.dark,
        },
        {
          cells: ['Charges', formatCurrency(y1e), formatCurrency(y2e), formatCurrency(y3e)],
          textColor: COLORS.danger,
        },
        {
          cells: [
            'Résultat net',
            formatCurrency(y1r - y1e),
            formatCurrency(y2r - y2e),
            formatCurrency(y3r - y3e),
          ],
          textColor: (y1r - y1e) >= 0 ? COLORS.success : COLORS.danger,
          fillColor: '#E8F5E9',
        },
      ]

      y = addTable(doc, projectionColumns, projectionRows, y)

      // Breakeven info
      const breakeven = financialForecast?.breakevenMonth ?? creasim?.breakevenMonths ?? null
      const initialInvestment = financialForecast?.initialInvestment ?? null
      if (breakeven != null || initialInvestment != null) {
        y = addSpacing(doc, 10, y)
        y = addSubSectionHeader(doc, 'Indicateurs clés', y)
        const kvs: { key: string; value: string }[] = []
        if (breakeven != null) {
          kvs.push({ key: 'Seuil de rentabilité :', value: `Mois ${breakeven}` })
        }
        if (initialInvestment != null) {
          kvs.push({ key: 'Investissement initial :', value: formatCurrency(initialInvestment) })
        }
        if (kvs.length > 0) {
          y = addKeyValueBlock(doc, kvs, y)
        }
      }
      y = addSpacing(doc, 14, y)
    }

    // ── Completion Score ──
    y = checkNewPage(doc, 120, y)
    y = addSectionHeader(doc, 'Score de Complétion du Business Plan', y)
    if (journey.bpScore != null) {
      y = addKeyValueBlock(
        doc,
        [
          { key: 'Score global :', value: `${journey.bpScore}/100` },
          { key: 'Barre :', value: scoreBar(journey.bpScore, 100, 30) },
        ],
        y,
      )
      y = addSpacing(doc, 6, y)
      const totalChapters = BP_CHAPTER_LABELS.length
      const filledChapters = BP_CHAPTER_LABELS.filter((c) => sectionMap.has(c.key)).length
      y = addParagraph(
        doc,
        `${filledChapters}/${totalChapters} chapitres rédigés (${Math.round((filledChapters / totalChapters) * 100)}%).`,
        y,
      )
    } else {
      y = addParagraph(doc, 'Score non encore calculé.', y)
    }
    y = addSpacing(doc, 14, y)

    // ── Recommendations ──
    y = checkNewPage(doc, 200, y)
    y = addSectionHeader(doc, 'Recommandations', y)
    y = addSubSectionHeader(doc, 'Pour finaliser votre Business Plan', y)

    const filledChapters = BP_CHAPTER_LABELS.filter((c) => sectionMap.has(c.key))
    const missingChapters = BP_CHAPTER_LABELS.filter((c) => !sectionMap.has(c.key))

    if (missingChapters.length > 0) {
      y = addParagraph(
        doc,
        `Il reste ${missingChapters.length} chapitre(s) à compléter : ${missingChapters.map((c) => c.label).join(', ')}.`,
        y,
      )
      y = addSpacing(doc, 6, y)
    }

    y = addBullet(doc, 'Relisez chaque chapitre pour vérifier la cohérence globale du plan.', y)
    y = addBullet(doc, 'Actualisez les données financières avec les derniers chiffres disponibles.', y)
    y = addBullet(doc, 'Faites relire votre Business Plan par votre conseiller GIDEF.', y)
    y = addBullet(doc, 'Préparez une version executive summary pour les investisseurs.', y)

    // ── Footer ──
    finalizeWithFooters(doc)
  })
}

// ─── Fallback PDF Builder ─────────────────────

/**
 * Generate a simple fallback PDF when the main PDF builder fails.
 * Shows a branded cover page with an error message instead of crashing.
 */
async function buildFallbackPdf(
  title: string,
  message: string,
  fullName: string,
): Promise<Buffer> {
  return generatePdfBuffer((doc) => {
    drawCoverPage(doc, title, 'CreaPulse V2 — Document de démonstration', fullName)

    let y = addSectionHeader(doc, 'Information')
    y = addParagraph(doc, message, y, { color: COLORS.warning, fontSize: 11 })
    y = addSpacing(doc, 20, y)

    y = addSectionHeader(doc, 'Que faire ?', y)
    y = addBullet(doc, 'Vérifiez que la base de données est accessible et contient les données de démonstration.', y)
    y = addBullet(doc, 'Relancez le script de peuplement (seed) si nécessaire.', y)
    y = addBullet(doc, 'Consultez les logs du serveur pour plus de détails.', y)
    y = addSpacing(doc, 20, y)

    y = addSectionHeader(doc, 'Support', y)
    y = addParagraph(doc, 'Si le problème persiste, contactez votre conseiller GIDEF Île-de-France.', y)

    finalizeWithFooters(doc)
  })
}

// ─── Route Handler ───────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const isDev = process.env.NODE_ENV === 'development'

  try {
    const { type } = await params

    console.error(`[DemoPDF] Request received: type=${type}`)

    // Validate type
    if (!VALID_TYPES.includes(type as DemoExportType)) {
      console.error(`[DemoPDF] Invalid type: "${type}"`)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `Type "${type}" is not supported. Valid types: ${VALID_TYPES.join(', ')}`,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    // ── Step 1: Fetch demo user ──
    let fullName = 'Bénéficiaire Démo'
    let email = 'demo@creapulse.fr'
    let createdAt = new Date()

    try {
      const user = await fetchDemoUser()
      fullName = user.fullName
      email = user.email
      createdAt = user.createdAt
      console.error(`[DemoPDF] User fetched: ${fullName} (${email})`)
    } catch (dbErr) {
      const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr)
      console.error(`[DemoPDF] ❌ Failed to fetch demo user: ${errMsg}`)
      if (dbErr instanceof Error && dbErr.stack) {
        console.error(`[DemoPDF] Stack: ${dbErr.stack}`)
      }
      // Return fallback PDF — DB is unreachable or user not seeded
      const fallbackBuffer = await buildFallbackPdf(
        'Document Indisponible',
        `Impossible de se connecter à la base de données ou le bénéficiaire de démonstration est introuvable. ${isDev ? `Détail : ${errMsg}` : 'Veuillez réessayer plus tard.'}`,
        'Bénéficiaire Démo',
      )
      return new NextResponse(new Uint8Array(fallbackBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="demo-${type}-fallback.pdf"`,
          'Content-Length': fallbackBuffer.length.toString(),
          'Cache-Control': 'no-store',
        },
      })
    }

    // ── Step 2: Build PDF based on type ──
    let pdfBuffer: Buffer | null = null
    let filename = 'demo.pdf'

    try {
      switch (type) {
        case 'suivi-kiviat': {
          console.error(`[DemoPDF] Building Kiviat PDF for ${fullName}...`)
          const result = await buildKiviatPdf(fullName, email)
          if (!result) {
            console.error(`[DemoPDF] No Kiviat data found, returning 404`)
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'NO_DATA',
                  message: 'No Kiviat results found for the demo beneficiary.',
                },
                timestamp: new Date().toISOString(),
              },
              { status: 404 },
            )
          }
          pdfBuffer = result
          filename = `demo-suivi-kiviat.pdf`
          break
        }

        case 'suivi-tremplin': {
          console.error(`[DemoPDF] Building Tremplin PDF for ${fullName}...`)
          const result = await buildTremplinPdf(fullName)
          if (!result) {
            console.error(`[DemoPDF] No Tremplin data found, returning 404`)
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'NO_DATA',
                  message: 'No Tremplin assessment found for the demo beneficiary.',
                },
                timestamp: new Date().toISOString(),
              },
              { status: 404 },
            )
          }
          pdfBuffer = result
          filename = `demo-suivi-tremplin.pdf`
          break
        }

        case 'suivi-creasim': {
          console.error(`[DemoPDF] Building CreaSim PDF for ${fullName}...`)
          const result = await buildCreaSimPdf(fullName)
          if (!result) {
            console.error(`[DemoPDF] No CreaSim data found, returning 404`)
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'NO_DATA',
                  message: 'No CreaSim simulation found for the demo beneficiary.',
                },
                timestamp: new Date().toISOString(),
              },
              { status: 404 },
            )
          }
          pdfBuffer = result
          filename = `demo-suivi-creasim.pdf`
          break
        }

        case 'suivi-parcours': {
          console.error(`[DemoPDF] Building Parcours PDF for ${fullName}...`)
          pdfBuffer = await buildParcoursPdf(
            fullName,
            email,
            createdAt,
          )
          filename = `demo-suivi-parcours.pdf`
          break
        }

        case 'bmc': {
          console.error(`[DemoPDF] Building BMC PDF for ${fullName}...`)
          const result = await buildBmcPdf(fullName)
          if (!result) {
            console.error(`[DemoPDF] No BMC data found, returning 404`)
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'NO_DATA',
                  message: 'No Business Model Canvas found for the demo beneficiary.',
                },
                timestamp: new Date().toISOString(),
              },
              { status: 404 },
            )
          }
          pdfBuffer = result
          filename = `demo-bmc.pdf`
          break
        }

        case 'business-plan': {
          console.error(`[DemoPDF] Building Business Plan PDF for ${fullName}...`)
          pdfBuffer = await buildBusinessPlanPdf(fullName)
          filename = `Business_Plan_${fullName.replace(/\s+/g, '_')}.pdf`
          break
        }
      }
    } catch (buildErr) {
      const errMsg = buildErr instanceof Error ? buildErr.message : String(buildErr)
      console.error(`[DemoPDF] ❌ PDF build failed for type="${type}": ${errMsg}`)
      if (buildErr instanceof Error && buildErr.stack) {
        console.error(`[DemoPDF] Stack: ${buildErr.stack}`)
      }

      // Return a fallback PDF instead of a JSON error
      const fallbackBuffer = await buildFallbackPdf(
        'Erreur de Génération',
        `La génération du document "${type}" a échoué. ${isDev ? `Cause : ${errMsg}` : 'Veuillez réessayer plus tard ou contacter le support.'}`,
        fullName,
      )
      return new NextResponse(new Uint8Array(fallbackBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="demo-${type}-error.pdf"`,
          'Content-Length': fallbackBuffer.length.toString(),
          'Cache-Control': 'no-store',
        },
      })
    }

    if (!pdfBuffer) {
      console.error(`[DemoPDF] ❌ pdfBuffer is null after switch for type="${type}"`)
      const fallbackBuffer = await buildFallbackPdf(
        'Document Indisponible',
        `Aucun contenu PDF n'a pu être généré pour le type "${type}". Les données de démonstration sont peut-être incomplètes.`,
        fullName,
      )
      return new NextResponse(new Uint8Array(fallbackBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="demo-${type}-unavailable.pdf"`,
          'Content-Length': fallbackBuffer.length.toString(),
          'Cache-Control': 'no-store',
        },
      })
    }

    // ── Step 3: Return PDF ──
    console.error(`[DemoPDF] ✓ PDF generated successfully: ${filename} (${pdfBuffer.length} bytes)`)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    })
  } catch (err) {
    // Absolute last-resort catch (should rarely reach here now)
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`[DemoPDF] ❌❌ UNHANDLED error in GET handler: ${errMsg}`)
    if (err instanceof Error && err.stack) {
      console.error(`[DemoPDF] Stack: ${err.stack}`)
    }
    return handleApiError(err)
  }
}
