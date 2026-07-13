// ============================================
// CreaPulse V2 — Suivi CreaSim PDF Export
// GET /api/export/suivi-creasim
// Generates a branded PDF with CreaSim financial simulation
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
  formatCurrency,
  formatPercent,
  finalizeWithFooters,
  type TableColumn,
  type TableRow,
  COLORS,
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

    // Fetch user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    })
    if (!user) return Errors.notFound('Utilisateur')

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email

    // Fetch journey
    const journey = await db.creatorJourney.findUnique({
      where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) },
      select: { projectTitle: true, projectSector: true },
    })

    // Fetch CreaSim simulation
    const creasim = await db.creaSimSimulation.findUnique({
      where: { userId_enrollmentId: buildCompositeKey(userId, enrollmentId) },
    })

    if (!creasim) {
      return Errors.notFound('Simulation CreaSim')
    }

    // Generate PDF
    const pdfBuffer = await generatePdfBuffer((doc) => {
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

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="suivi-creasim-${fullName.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
