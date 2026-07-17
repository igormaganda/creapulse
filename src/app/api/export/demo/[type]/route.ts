// ============================================
// CreaPulse V2 — Public Demo PDF Export
// GET /api/export/demo/[type]
// No authentication required — uses demo beneficiary
// Supported types: suivi-kiviat, suivi-tremplin, suivi-creasim, suivi-parcours, bmc
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/api-response'
import { buildCompositeKey } from '@/lib/enrollment-context'
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
const DEMO_ENROLLMENT_ID: string | null = null // Demo uses legacy (null) enrollment

const VALID_TYPES = [
  'suivi-kiviat',
  'suivi-tremplin',
  'suivi-creasim',
  'suivi-parcours',
  'bmc',
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
    addSpacing(doc, 12)

    // ── Monthly Simulation Summary ──
    checkNewPage(doc, 180)
    y = addSectionHeader(doc, 'Simulation mensuelle')

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
    addSpacing(doc, 10)

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
    addSpacing(doc, 12)

    // ── 3-Year Projection ──
    checkNewPage(doc, 180)
    y = addSectionHeader(doc, 'Projection sur 3 ans')

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
      addSpacing(doc, 8)
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
    addSpacing(doc, 12)

    // ── Break-even Analysis ──
    checkNewPage(doc, 120)
    y = addSectionHeader(doc, 'Analyse du seuil de rentabilité')

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
      addSpacing(doc, 6)
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
    addSpacing(doc, 12)

    // ── Fixed charges detail ──
    if (fixedChargesArray.length > 0) {
      checkNewPage(doc, 80 + fixedChargesArray.length * 22)
      y = addSectionHeader(doc, 'Détail des charges fixes')

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
      addSpacing(doc, 12)
    }

    // ── AI Synthesis ──
    if (creasim.aiAnalysis) {
      checkNewPage(doc, 120)
      y = addSectionHeader(doc, 'Synthèse IA')
      y = addParagraph(doc, creasim.aiAnalysis, y)
      addSpacing(doc, 12)
    }

    // ── Recommendations ──
    checkNewPage(doc, 120)
    y = addSectionHeader(doc, 'Recommandations')
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
    addSpacing(doc, 14)

    // ── Kiviat Radar Summary ──
    if (kiviatResults.length > 0) {
      checkNewPage(doc, 260)
      y = addSectionHeader(doc, 'Compétences Kiviat — Résumé')

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
      addSpacing(doc, 14)
    }

    // ── RIASEC Profile ──
    if (riasecResults.length > 0) {
      checkNewPage(doc, 180)
      y = addSectionHeader(doc, 'Profil RIASEC')

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
      addSpacing(doc, 14)
    }

    // ═══════════════════════════════════════
    // PAGE 3: Module Completion + Tremplin
    // ═══════════════════════════════════════

    // ── Module Completion Status ──
    checkNewPage(doc, 260)
    y = addSectionHeader(doc, 'Avancement des modules')

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
    addSpacing(doc, 14)

    // ── Tremplin Status ──
    checkNewPage(doc, 120)
    y = addSectionHeader(doc, 'Statut Tremplin')

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
    addSpacing(doc, 14)

    // ═══════════════════════════════════════
    // PAGE 4: CreaSim + BMC + Interviews
    // ═══════════════════════════════════════

    // ── CreaSim Brief ──
    if (creasim) {
      checkNewPage(doc, 100)
      y = addSectionHeader(doc, 'Simulation financière (CreaSim)')
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
      addSpacing(doc, 14)
    }

    // ── BMC Status ──
    if (bmc) {
      checkNewPage(doc, 80)
      y = addSectionHeader(doc, 'Business Model Canvas')
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
      addSpacing(doc, 14)
    }

    // ── Key Interview Notes ──
    if (interviewNotes.length > 0) {
      checkNewPage(doc, 80 + interviewNotes.length * 24)
      y = addSectionHeader(doc, 'Notes clés des entretiens')

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
      addSpacing(doc, 14)
    }

    // ═══════════════════════════════════════
    // PAGE 5: Recommendations
    // ═══════════════════════════════════════

    checkNewPage(doc, 200)
    y = addSectionHeader(doc, 'Recommandations et actions')

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

    addSpacing(doc, 12)

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
    addSpacing(doc, 14)

    // ── BMC Blocks ──
    const bmcRecord = bmc as unknown as Record<string, string | null | undefined>

    for (const block of BMC_BLOCKS) {
      const content = bmcRecord[block.key] || ''
      checkNewPage(doc, 80)
      y = addSectionHeader(doc, block.label)

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
      addSpacing(doc, 8)
    }

    addSpacing(doc, 12)

    // ── Completion Summary ──
    const filledCount = BMC_BLOCKS.filter(
      (b) => bmcRecord[b.key] && bmcRecord[b.key]!.trim().length > 0,
    ).length

    y = addSectionHeader(doc, 'Complétion')
    y = addKeyValueBlock(
      doc,
      [
        { key: 'Blocs remplis :', value: `${filledCount}/${BMC_BLOCKS.length}` },
        { key: 'Taux de complétion :', value: `${Math.round((filledCount / BMC_BLOCKS.length) * 100)}%` },
      ],
      y,
    )
    addSpacing(doc, 12)

    // ── Recommendations ──
    checkNewPage(doc, 80)
    y = addSectionHeader(doc, 'Recommandations')
    if (filledCount < BMC_BLOCKS.length) {
      y = addBullet(doc, 'Complétez les blocs manquants pour avoir une vision complète de votre modèle.', y)
    }
    y = addBullet(doc, 'Partagez votre BMC avec votre conseiller pour validation.', y)
    y = addBullet(doc, 'Révisez régulièrement votre canvas au fur et à mesure de l\'avancement du projet.', y)

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
    addSpacing(doc, 20)

    y = addSectionHeader(doc, 'Que faire ?')
    y = addBullet(doc, 'Vérifiez que la base de données est accessible et contient les données de démonstration.', y)
    y = addBullet(doc, 'Relancez le script de peuplement (seed) si nécessaire.', y)
    y = addBullet(doc, 'Consultez les logs du serveur pour plus de détails.', y)
    addSpacing(doc, 20)

    y = addSectionHeader(doc, 'Support')
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

    // Validate type
    if (!VALID_TYPES.includes(type as DemoExportType)) {
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
          const result = await buildKiviatPdf(fullName, email)
          if (!result) {
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
          const result = await buildTremplinPdf(fullName)
          if (!result) {
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
          const result = await buildCreaSimPdf(fullName)
          if (!result) {
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
          pdfBuffer = await buildParcoursPdf(
            fullName,
            email,
            createdAt,
          )
          filename = `demo-suivi-parcours.pdf`
          break
        }

        case 'bmc': {
          const result = await buildBmcPdf(fullName)
          if (!result) {
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
