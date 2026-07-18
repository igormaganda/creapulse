// ============================================
// CreaPulse V2 — Production Business Plan PDF Builder
// Builds a professional 24-section Business Plan PDF
// Uses ONLY helpers from pdf-utils.ts (no raw PDFKit)
// All text in French
// ============================================

import PDFDocument from 'pdfkit'
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
  finalizeWithFooters,
  formatCurrency,
  type TableColumn,
  type TableRow,
  COLORS,
} from '@/lib/pdf-utils'

// ─── Types ──────────────────────────────────

export interface BusinessPlanPdfData {
  entrepreneur: {
    fullName: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  project: {
    title: string
    description: string
    sector: string
    stage: string
    targetAudience: string
    motivation: string
    valueProposition: string
  }
  sections: Record<string, unknown>
  bpScore: number
  bpStatus: string
  financialForecast: {
    year1Revenue: number | null
    year1Expenses: number | null
    year2Revenue: number | null
    year2Expenses: number | null
    year3Revenue: number | null
    year3Expenses: number | null
    breakevenMonth: number | null
    initialInvestment: number | null
  } | null
  juridiqueAnalysis: {
    recommendedStatus: string | null
    fiscalRegime: string | null
    legalStructure: string | null
    socialCharges: unknown
  } | null
  marketAnalysis: {
    sector: string | null
    marketSize: string | null
    targetAudience: string | null
    trends: unknown
    competitors: unknown
    opportunities: string | null
    threats: string | null
    aiSynthesis: string | null
  } | null
}

// ─── Section Configuration ──────────────────

interface SectionDef {
  id: string
  title: string
  group: string
  type: 'text' | 'swot' | 'financing' | 'compte-resultat' | 'tresorerie' | 'investissements' | 'bilan' | 'statut' | 'production' | 'associes' | 'cogerants' | 'calendrier'
}

const ALL_SECTIONS: SectionDef[] = [
  // Groupe Présentation
  { id: 'resume', title: 'Résumé opérationnel', group: 'Présentation', type: 'text' },
  { id: 'equipe', title: 'Présentation de l\'équipe', group: 'Présentation', type: 'text' },
  { id: 'historique', title: 'Historique et contexte', group: 'Présentation', type: 'text' },
  { id: 'vision', title: 'Vision et mission', group: 'Présentation', type: 'text' },
  { id: 'valeurs', title: 'Valeurs et engagements', group: 'Présentation', type: 'text' },
  // Groupe Marché
  { id: 'etude-marche', title: 'Étude de marché', group: 'Marché', type: 'text' },
  { id: 'segmentation', title: 'Segmentation client', group: 'Marché', type: 'text' },
  { id: 'concurrence', title: 'Analyse concurrentielle', group: 'Marché', type: 'text' },
  { id: 'strategie-marketing', title: 'Stratégie marketing', group: 'Marché', type: 'text' },
  { id: 'plan-commercial', title: 'Plan commercial', group: 'Marché', type: 'text' },
  { id: 'swot', title: 'Analyse SWOT', group: 'Marché', type: 'swot' },
  // Groupe Finances
  { id: 'financement', title: 'Plan de financement', group: 'Finances', type: 'financing' },
  { id: 'compte-resultat', title: 'Compte de résultat prévisionnel', group: 'Finances', type: 'compte-resultat' },
  { id: 'tresorerie', title: 'Plan de trésorerie', group: 'Finances', type: 'tresorerie' },
  { id: 'seuil-rentabilite', title: 'Seuil de rentabilité', group: 'Finances', type: 'text' },
  { id: 'investissements', title: 'Investissements', group: 'Finances', type: 'investissements' },
  { id: 'bilan', title: 'Bilan prévisionnel', group: 'Finances', type: 'bilan' },
  // Groupe Opérations
  { id: 'statut-juridique', title: 'Statut juridique', group: 'Opérations', type: 'statut' },
  { id: 'localisation', title: 'Localisation et implantation', group: 'Opérations', type: 'text' },
  { id: 'organisation', title: 'Organisation et moyens humains', group: 'Opérations', type: 'text' },
  { id: 'production', title: 'Catalogue produits/services', group: 'Opérations', type: 'production' },
  { id: 'associes', title: 'Associés et répartition du capital', group: 'Opérations', type: 'associes' },
  { id: 'cogerants', title: 'Co-gérance', group: 'Opérations', type: 'cogerants' },
  { id: 'calendrier', title: 'Calendrier de réalisation', group: 'Opérations', type: 'calendrier' },
]

const STATUT_LABELS: Record<string, string> = {
  'auto-entrepreneur': 'Auto-entrepreneur (Micro-entreprise)',
  'eurl': 'EURL',
  'sas': 'SAS',
  'sasu': 'SASU',
  'sarl': 'SARL',
  'sa': 'SA',
  'sei': 'SEI',
  'association': 'Association loi 1901',
}

// ─── Content Helpers ────────────────────────

function getText(val: unknown): string {
  if (typeof val === 'string') return val
  if (val == null) return ''
  return String(val)
}

function hasContent(val: unknown): boolean {
  if (!val) return false
  if (typeof val === 'string') return val.trim().length > 0
  if (Array.isArray(val)) return val.length > 0
  if (typeof val === 'object') return Object.values(val as Record<string, unknown>).some(
    (v) => v !== null && v !== undefined && v !== '' && v !== 0,
  )
  return false
}

function getBpStatusLabel(status: string): string {
  switch (status) {
    case 'DRAFT': return 'Brouillon'
    case 'IN_PROGRESS': return 'En cours'
    case 'COMPLETED': return 'Terminé'
    case 'SUBMITTED': return 'Soumis'
    default: return 'Non commencé'
  }
}

// ─── SWOT Grid Drawing ─────────────────────
// Uses raw PDFKit for the 2x2 colored grid (no helper exists for this)
// This is a specific visual layout that cannot be achieved with addTable alone

function drawSwotGrid(doc: PDFDocument, swotData: {
  strengths: string
  weaknesses: string
  opportunities: string
  threats: string
}): void {
  const PAGE_WIDTH = 595.28
  const MARGIN_LEFT = 50
  const MARGIN_RIGHT = 50
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
  const MARGIN_BOTTOM = 50

  const boxW = (CONTENT_WIDTH - 6) / 2  // 6px gap between boxes
  const boxH = 120

  const quadrants = [
    { label: 'Forces', text: swotData.strengths || 'Non renseigné', bgColor: '#E8F5E9', borderColor: '#2E7D32', textColor: '#1B5E20' },
    { label: 'Faiblesses', text: swotData.weaknesses || 'Non renseigné', bgColor: '#FFEBEE', borderColor: '#C62828', textColor: '#B71C1C' },
    { label: 'Opportunités', text: swotData.opportunities || 'Non renseigné', bgColor: '#E3F2FD', borderColor: '#1565C0', textColor: '#0D47A1' },
    { label: 'Menaces', text: swotData.threats || 'Non renseigné', bgColor: '#FFF8E1', borderColor: '#F57F17', textColor: '#E65100' },
  ]

  const startY = doc.y

  for (let i = 0; i < 4; i++) {
    const q = quadrants[i]
    const col = i % 2
    const row = i < 2 ? 0 : 1
    const x = MARGIN_LEFT + col * (boxW + 6)
    const y = startY + row * (boxH + 6)

    // If we need a new page for the bottom row
    if (row === 1 && y + boxH > 841.89 - MARGIN_BOTTOM) {
      doc.addPage()
      // Re-draw top row on new page (skip — just draw bottom row)
      const newX = MARGIN_LEFT + (i % 2) * (boxW + 6)
      const newY = doc.y
      drawSwotBox(doc, newX, newY, boxW, boxH, q)
      doc.y = newY + boxH + 10
      continue
    }

    drawSwotBox(doc, x, y, boxW, boxH, q)

    // Set doc.y after the grid
    if (i === 3) {
      doc.y = y + boxH + 10
    }
  }
}

function drawSwotBox(
  doc: PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  q: { label: string; text: string; bgColor: string; borderColor: string; textColor: string },
): void {
  // Background
  doc.save()
  doc.roundedRect(x, y, w, h, 4).fill(q.bgColor)

  // Border
  doc.roundedRect(x, y, w, h, 4).strokeColor(q.borderColor).lineWidth(1).stroke()

  // Label
  doc.font('Helvetica-Bold').fontSize(9).fillColor(q.textColor)
  doc.text(q.label, x + 8, y + 8, { width: w - 16, lineBreak: false })

  // Content — truncate if too long
  doc.font('Helvetica').fontSize(7.5).fillColor('#333333')
  const maxTextHeight = h - 28
  doc.text(q.text, x + 8, y + 22, { width: w - 16, height: maxTextHeight, lineGap: 1.5, ellipsis: true })

  doc.restore()
}

// ─── Main Builder ───────────────────────────

export async function buildBusinessPlanPdf(data: BusinessPlanPdfData): Promise<Buffer> {
  return generatePdfBuffer((doc) => {
    const sections = data.sections

    // ═══════════════════════════════════════════
    // COVER PAGE
    // ═══════════════════════════════════════════
    drawCoverPage(
      doc,
      'Business Plan',
      'Document de présentation du projet entrepreneurial',
      data.entrepreneur.fullName,
    )

    // Project info block after cover info
    if (data.project.title) {
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(COLORS.primary)
        .text(data.project.title, 0, doc.y + 2, {
          width: 595.28,
          align: 'center',
        })
    }

    // Project metadata below the title
    const metaItems: Array<{ key: string; value: string }> = []
    if (data.project.sector) metaItems.push({ key: 'Secteur', value: data.project.sector })
    if (data.project.stage) metaItems.push({ key: 'Stade', value: data.project.stage })
    if (data.juridiqueAnalysis?.recommendedStatus) {
      const label = STATUT_LABELS[data.juridiqueAnalysis.recommendedStatus] || data.juridiqueAnalysis.recommendedStatus
      metaItems.push({ key: 'Statut juridique', value: label })
    }

    if (metaItems.length > 0) {
      addSpacing(doc, 4)
      const metaY = doc.y
      const metaWidth = 280
      const startX = (595.28 - metaWidth) / 2

      for (const item of metaItems) {
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(COLORS.gray)
          .text(`${item.key} : `, startX, doc.y, {
            width: metaWidth,
            continued: true,
            align: 'center',
          })
        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(COLORS.dark)
          .text(item.value, { width: metaWidth, align: 'center' })
      }
    }

    // Completion indicator
    addSpacing(doc, 8)
    const statusLabel = getBpStatusLabel(data.bpStatus)
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.gray)
      .text(
        `Complétion : ${data.bpScore}% — ${statusLabel}`,
        0,
        doc.y,
        { width: 595.28, align: 'center' },
      )

    // ═══════════════════════════════════════════
    // TABLE OF CONTENTS
    // ═══════════════════════════════════════════
    let currentGroup = ''
    for (const sec of ALL_SECTIONS) {
      if (sec.group !== currentGroup) {
        if (currentGroup !== '') addSpacing(doc, 6)
        currentGroup = sec.group
        checkNewPage(doc, 80)
        addSubSectionHeader(doc, sec.group)
      }

      const isFilled = hasContent(sections[sec.id])
      const label = isFilled ? `✓  ${sec.title}` : `    ${sec.title}`
      const color = isFilled ? COLORS.dark : '#BBBBBB'

      addParagraph(doc, label, undefined, { fontSize: 9, color })
    }

    addSpacing(doc, 20)

    // ═══════════════════════════════════════════
    // RENDER ALL 24 SECTIONS
    // ═══════════════════════════════════════════
    for (const sec of ALL_SECTIONS) {
      checkNewPage(doc, 60)

      if (!hasContent(sections[sec.id])) {
        // Empty section — show placeholder
        addSectionHeader(doc, sec.title)
        addParagraph(doc, 'Section non renseignée', undefined, {
          fontSize: 9,
          color: '#BBBBBB',
        })
        addSpacing(doc, 10)
        continue
      }

      switch (sec.type) {
        case 'text':
          renderTextSection(doc, sec.title, getText(sections[sec.id]))
          break
        case 'swot':
          renderSwotSection(doc, sec.title, sections[sec.id] as Record<string, string>)
          break
        case 'financing':
          renderFinancingSection(doc, sec.title, sections[sec.id] as Array<{ id: string; source: string; montant: number }>)
          break
        case 'compte-resultat':
          renderCompteResultatSection(doc, sec.title, sections[sec.id] as Record<string, { ca: number; charges: number; resultat: number }>)
          break
        case 'tresorerie':
          renderTresorerieSection(doc, sec.title, sections[sec.id] as Array<{ month: string; encaissements: number; decaissements: number; solde: number }>)
          break
        case 'investissements':
          renderInvestissementsSection(doc, sec.title, sections[sec.id] as Array<{ id: string; name: string; amount: number }>)
          break
        case 'bilan':
          renderBilanSection(doc, sec.title, sections[sec.id] as {
            actif: { immobilisations: number; stocks: number; creances: number; tresorerie: number }
            passif: { capital: number; emprunts: number; fournisseurs: number; autresDettes: number }
          })
          break
        case 'statut':
          renderStatutSection(doc, sec.title, getText(sections[sec.id]))
          break
        case 'production':
          renderProductionSection(doc, sec.title, sections[sec.id] as Array<{
            id: string; nom: string; description: string; prixVente: number;
            coutUnitaire: number; quantiteMensuelle: number; marge: number
          }>)
          break
        case 'associes':
          renderAssociesSection(doc, sec.title, sections[sec.id] as Array<{
            id: string; nom: string; prenom: string; role: string;
            nombreParts: number; pourcentage: number; apportCapital: number
          }>)
          break
        case 'cogerants':
          renderCogerantsSection(doc, sec.title, sections[sec.id] as Array<{
            id: string; nom: string; prenom: string; fonction: string;
            email: string; telephone: string
          }>)
          break
        case 'calendrier':
          renderCalendrierSection(doc, sec.title, sections[sec.id] as Array<{
            id: string; title: string; date: string; completed: boolean
          }>)
          break
      }
    }

    // ═══════════════════════════════════════════
    // APPENDICES
    // ═══════════════════════════════════════════

    // Annexe A : Analyse de marché
    if (data.marketAnalysis) {
      checkNewPage(doc, 300)
      let y = addSectionHeader(doc, 'Annexe A : Analyse de marché')
      addSpacing(doc, 6)

      const ma = data.marketAnalysis
      const maData: Array<{ key: string; value: string }> = []
      if (ma.sector) maData.push({ key: 'Secteur', value: ma.sector })
      if (ma.marketSize) maData.push({ key: 'Taille du marché', value: ma.marketSize })
      if (ma.targetAudience) maData.push({ key: 'Cible', value: ma.targetAudience })
      if (ma.opportunities) maData.push({ key: 'Opportunités', value: ma.opportunities })
      if (ma.threats) maData.push({ key: 'Menaces', value: ma.threats })

      if (maData.length > 0) {
        y = addKeyValueBlock(doc, maData, y)
      }

      if (ma.aiSynthesis) {
        addSpacing(doc, 8)
        y = addSubSectionHeader(doc, 'Synthèse IA', y)
        addParagraph(doc, ma.aiSynthesis, y)
      }

      if (ma.trends && Array.isArray(ma.trends) && ma.trends.length > 0) {
        addSpacing(doc, 6)
        y = addSubSectionHeader(doc, 'Tendances du marché', y)
        for (const trend of ma.trends) {
          checkNewPage(doc, 20)
          const trendText = typeof trend === 'string' ? trend : (trend as Record<string, unknown>).label as string || JSON.stringify(trend)
          y = addBullet(doc, trendText, y)
        }
      }

      if (ma.competitors && Array.isArray(ma.competitors) && ma.competitors.length > 0) {
        addSpacing(doc, 6)
        y = addSubSectionHeader(doc, 'Concurrents identifiés', y)
        for (const comp of ma.competitors) {
          checkNewPage(doc, 20)
          const compObj = comp as Record<string, unknown>
          const compText = compObj.name
            ? `${compObj.name as string}${compObj.description ? ` — ${compObj.description as string}` : ''}`
            : JSON.stringify(comp)
          y = addBullet(doc, compText, y)
        }
      }

      addSpacing(doc, 10)
    }

    // Annexe B : Analyse financière
    if (data.financialForecast) {
      checkNewPage(doc, 300)
      let y = addSectionHeader(doc, 'Annexe B : Analyse financière')
      addSpacing(doc, 6)

      const ff = data.financialForecast
      const finData: Array<{ key: string; value: string }> = []

      if (ff.initialInvestment != null) finData.push({ key: 'Investissement initial', value: formatCurrency(ff.initialInvestment) })
      if (ff.breakevenMonth != null) finData.push({ key: 'Seuil de rentabilité', value: `Mois ${ff.breakevenMonth}` })

      if (finData.length > 0) {
        y = addKeyValueBlock(doc, finData, y)
        addSpacing(doc, 8)
      }

      // 3-year revenue/expense summary table
      const ffCols: TableColumn[] = [
        { header: 'Rubrique', width: 160, align: 'left' },
        { header: 'Année 1', width: 100, align: 'right' },
        { header: 'Année 2', width: 100, align: 'right' },
        { header: 'Année 3', width: 100, align: 'right' },
      ]

      const ffRows: TableRow[] = [
        {
          cells: [
            'Chiffre d\'affaires',
            formatCurrency(ff.year1Revenue),
            formatCurrency(ff.year2Revenue),
            formatCurrency(ff.year3Revenue),
          ],
        },
        {
          cells: [
            'Charges totales',
            formatCurrency(ff.year1Expenses),
            formatCurrency(ff.year2Expenses),
            formatCurrency(ff.year3Expenses),
          ],
          textColor: COLORS.gray,
        },
      ]

      // Calculate results
      const r1 = (ff.year1Revenue ?? 0) - (ff.year1Expenses ?? 0)
      const r2 = (ff.year2Revenue ?? 0) - (ff.year2Expenses ?? 0)
      const r3 = (ff.year3Revenue ?? 0) - (ff.year3Expenses ?? 0)

      ffRows.push({
        cells: [
          'Résultat net',
          formatCurrency(r1),
          formatCurrency(r2),
          formatCurrency(r3),
        ],
        fillColor: r3 >= 0 ? '#E8F5E9' : '#FFEBEE',
        textColor: r3 >= 0 ? COLORS.success : COLORS.danger,
      })

      y = addTable(doc, ffCols, ffRows, y)
      addSpacing(doc, 10)
    }

    // Annexe C : Structure juridique
    if (data.juridiqueAnalysis) {
      checkNewPage(doc, 200)
      let y = addSectionHeader(doc, 'Annexe C : Structure juridique')
      addSpacing(doc, 6)

      const ja = data.juridiqueAnalysis
      const jaData: Array<{ key: string; value: string }> = []

      if (ja.recommendedStatus) {
        const label = STATUT_LABELS[ja.recommendedStatus] || ja.recommendedStatus
        jaData.push({ key: 'Statut recommandé', value: label })
      }
      if (ja.legalStructure) jaData.push({ key: 'Structure juridique', value: ja.legalStructure })
      if (ja.fiscalRegime) jaData.push({ key: 'Régime fiscal', value: ja.fiscalRegime })

      if (jaData.length > 0) {
        y = addKeyValueBlock(doc, jaData, y)
      }

      if (ja.socialCharges && typeof ja.socialCharges === 'object') {
        addSpacing(doc, 8)
        y = addSubSectionHeader(doc, 'Charges sociales', y)
        const charges = ja.socialCharges as Record<string, unknown>
        const chargeItems: Array<{ key: string; value: string }> = []
        for (const [k, v] of Object.entries(charges)) {
          if (v != null && v !== '') {
            chargeItems.push({
              key: `${k.charAt(0).toUpperCase() + k.slice(1)} :`,
              value: String(v),
            })
          }
        }
        if (chargeItems.length > 0) {
          addKeyValueBlock(doc, chargeItems, y)
        }
      }

      addSpacing(doc, 10)
    }

    // ═══════════════════════════════════════════
    // CLOSING
    // ═══════════════════════════════════════════
    checkNewPage(doc, 80)
    addSectionHeader(doc, 'À propos de ce document')

    addParagraph(doc,
      `Ce business plan a été généré par la plateforme CreaPulse V2 — GIDEF Île-de-France. Les données proviennent du parcours de création entrepreneurial du bénéficiaire. Pour toute question, veuillez contacter votre conseiller.`,
      undefined,
      { fontSize: 8, color: COLORS.gray },
    )

    addSpacing(doc, 8)

    addParagraph(doc,
      `© ${new Date().getFullYear()} CreaPulse V2 — GIDEF Île-de-France — Document confidentiel`,
      undefined,
      { fontSize: 8, color: COLORS.gray },
    )

    // ═══════════════════════════════════════════
    // FINALIZE — Add footers to all content pages
    // ═══════════════════════════════════════════
    finalizeWithFooters(doc)
  })
}

// ─── Section Renderers ─────────────────────

function renderTextSection(doc: PDFDocument, title: string, text: string): void {
  addSectionHeader(doc, title)
  // Split by newlines and render as paragraphs
  const lines = text.split('\n').filter((l) => l.trim().length > 0)
  for (const line of lines) {
    checkNewPage(doc, 30)
    addParagraph(doc, line.trim())
  }
  addSpacing(doc, 10)
}

function renderSwotSection(doc: PDFDocument, title: string, swotData: Record<string, string>): void {
  addSectionHeader(doc, title)

  const data = {
    strengths: getText(swotData?.strengths),
    weaknesses: getText(swotData?.weaknesses),
    opportunities: getText(swotData?.opportunities),
    threats: getText(swotData?.threats),
  }

  addParagraph(doc, 'L\'analyse SWOT ci-dessous synthétise les forces, faiblesses, opportunités et menaces du projet.')
  addSpacing(doc, 6)

  drawSwotGrid(doc, data)
  addSpacing(doc, 10)
}

function renderFinancingSection(doc: PDFDocument, title: string, rows: Array<{ id: string; source: string; montant: number }>): void {
  addSectionHeader(doc, title)

  if (!rows || rows.length === 0) {
    addParagraph(doc, 'Section non renseignée', undefined, { fontSize: 9, color: '#BBBBBB' })
    addSpacing(doc, 10)
    return
  }

  const total = rows.reduce((s, r) => s + (r.montant || 0), 0)

  const cols: TableColumn[] = [
    { header: 'Source de financement', width: 360, align: 'left' },
    { header: 'Montant', width: 100, align: 'right' },
  ]

  const tableRows: TableRow[] = rows.map((r) => ({
    cells: [r.source || 'Non renseigné', formatCurrency(r.montant)],
  }))

  tableRows.push({
    cells: ['TOTAL', formatCurrency(total)],
    fillColor: COLORS.primary,
    textColor: COLORS.white,
  })

  addTable(doc, cols, tableRows)
  addSpacing(doc, 10)
}

function renderCompteResultatSection(doc: PDFDocument, title: string, data: Record<string, { ca: number; charges: number; resultat: number }>): void {
  addSectionHeader(doc, title)

  if (!data || Object.keys(data).length === 0) {
    addParagraph(doc, 'Section non renseignée', undefined, { fontSize: 9, color: '#BBBBBB' })
    addSpacing(doc, 10)
    return
  }

  const cols: TableColumn[] = [
    { header: 'Poste', width: 120, align: 'left' },
    { header: 'Année 1', width: 110, align: 'right' },
    { header: 'Année 2', width: 110, align: 'right' },
    { header: 'Année 3', width: 110, align: 'right' },
  ]

  const year1 = data.year1
  const year2 = data.year2
  const year3 = data.year3

  const tableRows: TableRow[] = [
    {
      cells: ['Chiffre d\'affaires', formatCurrency(year1?.ca), formatCurrency(year2?.ca), formatCurrency(year3?.ca)],
    },
    {
      cells: ['Charges', formatCurrency(year1?.charges), formatCurrency(year2?.charges), formatCurrency(year3?.charges)],
      textColor: COLORS.gray,
    },
  ]

  const r1 = (year1?.ca ?? 0) - (year1?.charges ?? 0)
  const r2 = (year2?.ca ?? 0) - (year2?.charges ?? 0)
  const r3 = (year3?.ca ?? 0) - (year3?.charges ?? 0)

  tableRows.push({
    cells: ['Résultat net', formatCurrency(r1), formatCurrency(r2), formatCurrency(r3)],
    fillColor: r3 >= 0 ? '#E8F5E9' : '#FFEBEE',
    textColor: r3 >= 0 ? COLORS.success : COLORS.danger,
  })

  addTable(doc, cols, tableRows)
  addSpacing(doc, 10)
}

function renderTresorerieSection(doc: PDFDocument, title: string, rows: Array<{ month: string; encaissements: number; decaissements: number; solde: number }>): void {
  addSectionHeader(doc, title)

  if (!rows || rows.length === 0) {
    addParagraph(doc, 'Section non renseignée', undefined, { fontSize: 9, color: '#BBBBBB' })
    addSpacing(doc, 10)
    return
  }

  const cols: TableColumn[] = [
    { header: 'Mois', width: 90, align: 'left' },
    { header: 'Encaissements', width: 115, align: 'right' },
    { header: 'Décaissements', width: 115, align: 'right' },
    { header: 'Solde cumulé', width: 130, align: 'right' },
  ]

  const tableRows: TableRow[] = rows.map((r) => ({
    cells: [
      r.month || '—',
      formatCurrency(r.encaissements),
      formatCurrency(r.decaissements),
      formatCurrency(r.solde),
    ],
    textColor: (r.solde ?? 0) < 0 ? COLORS.danger : COLORS.dark,
  }))

  addTable(doc, cols, tableRows)
  addSpacing(doc, 10)
}

function renderInvestissementsSection(doc: PDFDocument, title: string, rows: Array<{ id: string; name: string; amount: number }>): void {
  addSectionHeader(doc, title)

  if (!rows || rows.length === 0) {
    addParagraph(doc, 'Section non renseignée', undefined, { fontSize: 9, color: '#BBBBBB' })
    addSpacing(doc, 10)
    return
  }

  const total = rows.reduce((s, r) => s + (r.amount || 0), 0)

  const cols: TableColumn[] = [
    { header: 'Investissement', width: 360, align: 'left' },
    { header: 'Montant', width: 100, align: 'right' },
  ]

  const tableRows: TableRow[] = rows.map((r) => ({
    cells: [r.name || 'Non renseigné', formatCurrency(r.amount)],
  }))

  tableRows.push({
    cells: ['TOTAL', formatCurrency(total)],
    fillColor: COLORS.primary,
    textColor: COLORS.white,
  })

  addTable(doc, cols, tableRows)
  addSpacing(doc, 10)
}

function renderBilanSection(doc: PDFDocument, title: string, data: {
  actif: { immobilisations: number; stocks: number; creances: number; tresorerie: number }
  passif: { capital: number; emprunts: number; fournisseurs: number; autresDettes: number }
}): void {
  addSectionHeader(doc, title)

  if (!data) {
    addParagraph(doc, 'Section non renseignée', undefined, { fontSize: 9, color: '#BBBBBB' })
    addSpacing(doc, 10)
    return
  }

  const cols: TableColumn[] = [
    { header: 'Rubrique', width: 200, align: 'left' },
    { header: 'Actif', width: 120, align: 'right' },
    { header: 'Passif', width: 120, align: 'right' },
  ]

  const actif = data.actif || {}
  const passif = data.passif || {}

  const totalActif = (actif.immobilisations || 0) + (actif.stocks || 0) + (actif.creances || 0) + (actif.tresorerie || 0)
  const totalPassif = (passif.capital || 0) + (passif.emprunts || 0) + (passif.fournisseurs || 0) + (passif.autresDettes || 0)

  const tableRows: TableRow[] = [
    {
      cells: ['Immobilisations / Capital', formatCurrency(actif.immobilisations), formatCurrency(passif.capital)],
    },
    {
      cells: ['Stocks / Emprunts', formatCurrency(actif.stocks), formatCurrency(passif.emprunts)],
    },
    {
      cells: ['Créances / Fournisseurs', formatCurrency(actif.creances), formatCurrency(passif.fournisseurs)],
    },
    {
      cells: ['Trésorerie / Autres dettes', formatCurrency(actif.tresorerie), formatCurrency(passif.autresDettes)],
    },
    {
      cells: ['TOTAL', formatCurrency(totalActif), formatCurrency(totalPassif)],
      fillColor: COLORS.primary,
      textColor: COLORS.white,
    },
  ]

  addTable(doc, cols, tableRows)
  addSpacing(doc, 10)
}

function renderStatutSection(doc: PDFDocument, title: string, value: string): void {
  addSectionHeader(doc, title)

  const label = STATUT_LABELS[value] || value || 'Non défini'

  addKeyValueBlock(doc, [
    { key: 'Statut juridique choisi :', value: label },
  ])

  addSpacing(doc, 10)
}

function renderProductionSection(doc: PDFDocument, title: string, rows: Array<{
  id: string; nom: string; description: string; prixVente: number;
  coutUnitaire: number; quantiteMensuelle: number; marge: number
}>): void {
  addSectionHeader(doc, title)

  if (!rows || rows.length === 0) {
    addParagraph(doc, 'Section non renseignée', undefined, { fontSize: 9, color: '#BBBBBB' })
    addSpacing(doc, 10)
    return
  }

  const cols: TableColumn[] = [
    { header: 'Produit / Service', width: 140, align: 'left' },
    { header: 'Prix de vente', width: 80, align: 'right' },
    { header: 'Coût unitaire', width: 80, align: 'right' },
    { header: 'Qté / mois', width: 60, align: 'center' },
    { header: 'Marge', width: 80, align: 'right' },
  ]

  const tableRows: TableRow[] = rows.map((r) => ({
    cells: [
      r.nom || 'Non renseigné',
      formatCurrency(r.prixVente),
      formatCurrency(r.coutUnitaire),
      r.quantiteMensuelle != null ? String(r.quantiteMensuelle) : '—',
      r.marge != null ? `${r.marge.toFixed(1)}%` : '—',
    ],
  }))

  addTable(doc, cols, tableRows)

  // Show descriptions as bullets if available
  const withDesc = rows.filter((r) => r.description && r.description.trim().length > 0)
  if (withDesc.length > 0) {
    addSpacing(doc, 6)
    for (const r of withDesc) {
      checkNewPage(doc, 30)
      addBullet(doc, `${r.nom || 'Produit'} : ${r.description}`)
    }
  }

  addSpacing(doc, 10)
}

function renderAssociesSection(doc: PDFDocument, title: string, rows: Array<{
  id: string; nom: string; prenom: string; role: string;
  nombreParts: number; pourcentage: number; apportCapital: number
}>): void {
  addSectionHeader(doc, title)

  if (!rows || rows.length === 0) {
    addParagraph(doc, 'Section non renseignée', undefined, { fontSize: 9, color: '#BBBBBB' })
    addSpacing(doc, 10)
    return
  }

  const cols: TableColumn[] = [
    { header: 'Nom', width: 120, align: 'left' },
    { header: 'Rôle', width: 130, align: 'left' },
    { header: 'Parts', width: 60, align: 'center' },
    { header: '%', width: 50, align: 'center' },
    { header: 'Apport', width: 100, align: 'right' },
  ]

  const tableRows: TableRow[] = rows.map((r) => {
    const fullName = [r.prenom, r.nom].filter(Boolean).join(' ') || 'Non renseigné'
    return {
      cells: [
        fullName,
        r.role || '—',
        r.nombreParts != null ? String(r.nombreParts) : '—',
        r.pourcentage != null ? `${r.pourcentage.toFixed(1)}%` : '—',
        formatCurrency(r.apportCapital),
      ],
    }
  })

  // Total row
  const totalApport = rows.reduce((s, r) => s + (r.apportCapital || 0), 0)
  const totalPourcentage = rows.reduce((s, r) => s + (r.pourcentage || 0), 0)
  tableRows.push({
    cells: ['TOTAL', '', '', `${totalPourcentage.toFixed(1)}%`, formatCurrency(totalApport)],
    fillColor: COLORS.primary,
    textColor: COLORS.white,
  })

  addTable(doc, cols, tableRows)
  addSpacing(doc, 10)
}

function renderCogerantsSection(doc: PDFDocument, title: string, rows: Array<{
  id: string; nom: string; prenom: string; fonction: string;
  email: string; telephone: string
}>): void {
  addSectionHeader(doc, title)

  if (!rows || rows.length === 0) {
    addParagraph(doc, 'Section non renseignée', undefined, { fontSize: 9, color: '#BBBBBB' })
    addSpacing(doc, 10)
    return
  }

  const cols: TableColumn[] = [
    { header: 'Nom', width: 120, align: 'left' },
    { header: 'Fonction', width: 140, align: 'left' },
    { header: 'Email', width: 140, align: 'left' },
    { header: 'Téléphone', width: 80, align: 'left' },
  ]

  const tableRows: TableRow[] = rows.map((r) => {
    const fullName = [r.prenom, r.nom].filter(Boolean).join(' ') || 'Non renseigné'
    return {
      cells: [
        fullName,
        r.fonction || '—',
        r.email || '—',
        r.telephone || '—',
      ],
    }
  })

  addTable(doc, cols, tableRows)
  addSpacing(doc, 10)
}

function renderCalendrierSection(doc: PDFDocument, title: string, rows: Array<{
  id: string; title: string; date: string; completed: boolean
}>): void {
  addSectionHeader(doc, title)

  if (!rows || rows.length === 0) {
    addParagraph(doc, 'Section non renseignée', undefined, { fontSize: 9, color: '#BBBBBB' })
    addSpacing(doc, 10)
    return
  }

  // Render as timeline list with bullet dots
  for (let i = 0; i < rows.length; i++) {
    checkNewPage(doc, 30)
    const r = rows[i]
    const statusIcon = r.completed ? '●' : '○'
    const statusColor = r.completed ? COLORS.success : COLORS.gray
    const dateStr = r.date || ''

    const label = dateStr ? `${r.title} — ${dateStr}` : r.title

    // Use addBullet-like rendering with colored dot
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(statusColor)
      .text(statusIcon, 50, doc.y, {
        continued: false,
        width: 14,
        lineBreak: false,
      })

    addParagraph(doc, label)
  }

  addSpacing(doc, 10)
}