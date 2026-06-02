// ============================================
// CreaPulse V2 — PDF Service (Standalone)
// Runs on plain Bun/Node.js (not Turbopack)
// Port 3099
// ============================================

import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { jwtVerify } from 'jose'

// ─── Database Connection ─────────────────────
const DB_URL = 'postgresql://bureau_virtuelle_user:bureau_virtuelle_pass2026@213.199.38.41:5432/bureau_virtuelle'

function createDbClient(): PrismaClient {
  const pool = new pg.Pool({ connectionString: DB_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

// Lazy singleton
let _db: PrismaClient | null = null
async function getDb(): Promise<PrismaClient> {
  if (!_db) {
    _db = createDbClient()
    await _db.$connect()
  }
  return _db
}

// ─── JWT Configuration ──────────────────────
const JWT_SECRET = new TextEncoder().encode('creapulse-v2-secret-key-2024-very-long-and-secure')

// ─── JSON Helper (PrismaPg returns JSON as strings) ──
function parseJson<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'string') {
    try { return JSON.parse(val) as T } catch { return fallback }
  }
  return val as T
}

async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return payload as { userId: string; email: string; role: string }
}

// ─── Brand Colors ────────────────────────────
const COLORS = {
  primary: '#00838F',
  primaryDark: '#005662',
  primaryLight: '#4FB3BF',
  secondary: '#F59E0B',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  bg: '#F9FAFB',
  bgCard: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',
}

const FONT = 'Helvetica'
const FONT_BOLD = 'Helvetica-Bold'
const FONT_ITALIC = 'Helvetica-Oblique'
const FONT_BOLD_ITALIC = 'Helvetica-BoldOblique'

// ─── PDF Helper Functions ─────────────────────

function createPDFDoc(title: string): { doc: PDFDocument; stream: PassThrough } {
  const stream = new PassThrough()
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 50, right: 50 },
    info: {
      Title: title,
      Author: 'Echo Entreprendre — CreaPulse',
      Subject: title,
      Creator: 'CreaPulse V2 — PDF Service',
    },
    bufferPages: true,
  })
  doc.pipe(stream)
  return { doc, stream }
}

function drawHeader(doc: PDFDocument, title: string, subtitle?: string): void {
  doc.rect(0, 0, doc.page.width, 8).fill(COLORS.primary)

  doc.fontSize(14).font(FONT_BOLD).fillColor(COLORS.primary)
    .text('CreaPulse', 50, 25, { continued: true })
    .font(FONT).fontSize(9).fillColor(COLORS.textLight)
    .text('  |  Echo Entreprendre', { align: 'left' })

  doc.fontSize(20).font(FONT_BOLD).fillColor(COLORS.text)
    .text(title, 50, 55, { align: 'left' })

  if (subtitle) {
    doc.fontSize(11).font(FONT).fillColor(COLORS.textLight)
      .text(subtitle, 50, 78)
  }

  const sepY = subtitle ? 95 : 80
  doc.moveTo(50, sepY).lineTo(doc.page.width - 50, sepY)
    .strokeColor(COLORS.primaryLight).lineWidth(1.5).stroke()

  doc.y = sepY + 15
  doc.x = 50
}

function drawFooter(doc: PDFDocument, pageNum: number, totalPages: number): void {
  const bottom = doc.page.height - 40
  doc.moveTo(50, bottom - 5).lineTo(doc.page.width - 50, bottom - 5)
    .strokeColor(COLORS.border).lineWidth(0.5).stroke()

  doc.fontSize(7).font(FONT).fillColor(COLORS.textMuted)
    .text('Document g\u00e9n\u00e9r\u00e9 par CreaPulse V2 \u2014 Echo Entreprendre', 50, bottom)
    .text(`Page ${pageNum} / ${totalPages}`, doc.page.width - 130, bottom, { width: 80, align: 'right' })
}

function sectionHeader(doc: PDFDocument, title: string, icon?: string): void {
  checkPageSpace(doc, 50)
  const y = doc.y

  doc.rect(50, y, doc.page.width - 100, 28).fill(COLORS.bg)
  doc.rect(50, y, 4, 28).fill(COLORS.primary)

  doc.fontSize(12).font(FONT_BOLD).fillColor(COLORS.primary)
    .text(`${icon ? icon + '  ' : ''}${title}`, 62, y + 7)

  doc.y = y + 38
  doc.x = 50
}

function subHeader(doc: PDFDocument, title: string): void {
  checkPageSpace(doc, 35)
  doc.fontSize(10).font(FONT_BOLD).fillColor(COLORS.text)
    .text(`\u2022 ${title}`, 50, doc.y, { continued: false })
  doc.moveDown(0.2)
}

function bodyText(doc: PDFDocument, text: string): void {
  checkPageSpace(doc, 25)
  doc.fontSize(9).font(FONT).fillColor(COLORS.text)
    .text(text, 50, doc.y, { width: doc.page.width - 100, lineGap: 3 })
  doc.moveDown(0.3)
}

function bullet(doc: PDFDocument, text: string, indent: number = 70): void {
  checkPageSpace(doc, 22)
  const y = doc.y
  doc.fontSize(9).font(FONT).fillColor(COLORS.primary)
    .text('\u2022', indent - 12, y)
  doc.fillColor(COLORS.text)
    .text(text, indent, y, { width: doc.page.width - indent - 50, lineGap: 2 })
  doc.moveDown(0.15)
}

function infoBox(doc: PDFDocument, text: string, type: 'info' | 'success' | 'warning' = 'info'): void {
  checkPageSpace(doc, 55)
  const color = type === 'success' ? COLORS.success : type === 'warning' ? COLORS.warning : COLORS.info
  const boxY = doc.y
  const boxWidth = doc.page.width - 100

  const textHeight = doc.fontSize(9).font(FONT).heightOfString(text, { width: boxWidth - 30 })
  const boxHeight = textHeight + 20

  doc.roundedRect(50, boxY, boxWidth, boxHeight, 4)
    .fillAndStroke(type === 'info' ? '#EFF6FF' : type === 'success' ? '#ECFDF5' : '#FFFBEB', color)

  doc.rect(50, boxY, 4, boxHeight).fill(color)

  doc.fontSize(9).font(FONT).fillColor(COLORS.text)
    .text(text, 68, boxY + 10, { width: boxWidth - 30 })

  doc.y = boxY + boxHeight + 10
}

function metricCard(doc: PDFDocument, label: string, value: string, x: number, y: number, width: number, height: number): void {
  doc.roundedRect(x, y, width, height, 6).fillAndStroke(COLORS.bgCard, COLORS.border)
  doc.rect(x, y, width, 3).fill(COLORS.primary)

  doc.fontSize(18).font(FONT_BOLD).fillColor(COLORS.primary)
    .text(value, x + 10, y + 12, { width: width - 20, align: 'center' })
  doc.fontSize(7).font(FONT).fillColor(COLORS.textLight)
    .text(label, x + 10, y + 35, { width: width - 20, align: 'center' })
}

function simpleTable(doc: PDFDocument, headers: string[], rows: (string | number)[][], colWidths?: number[]): void {
  const tableWidth = doc.page.width - 100
  const rowHeight = 22
  const colW = colWidths || headers.map(() => tableWidth / headers.length)
  let y = doc.y

  checkPageSpace(doc, rowHeight * 3 + 10)

  // Header
  doc.rect(50, y, tableWidth, rowHeight).fill(COLORS.primary)
  let x = 50
  for (let i = 0; i < headers.length; i++) {
    doc.fontSize(8).font(FONT_BOLD).fillColor(COLORS.white)
      .text(headers[i], x + 5, y + 6, { width: colW[i] - 10, height: rowHeight })
    x += colW[i]
  }
  y += rowHeight

  // Rows
  for (let r = 0; r < rows.length; r++) {
    if (y + rowHeight > doc.page.height - 80) {
      doc.addPage()
      y = 60
    }
    const bgColor = r % 2 === 0 ? COLORS.bgCard : COLORS.bg
    doc.rect(50, y, tableWidth, rowHeight).fill(bgColor)
    doc.moveTo(50, y + rowHeight).lineTo(50 + tableWidth, y + rowHeight)
      .strokeColor(COLORS.border).lineWidth(0.5).stroke()

    x = 50
    for (let c = 0; c < rows[r].length; c++) {
      doc.fontSize(8).font(FONT).fillColor(COLORS.text)
        .text(String(rows[r][c]), x + 5, y + 6, { width: colW[c] - 10, height: rowHeight })
      x += colW[c]
    }
    y += rowHeight
  }

  doc.y = y + 10
  doc.x = 50
}

function progressBar(doc: PDFDocument, label: string, value: number, max: number, x: number, y: number, width: number): void {
  const barHeight = 12
  const percentage = Math.min(value / max, 1)
  const filledWidth = width * percentage

  doc.fontSize(8).font(FONT).fillColor(COLORS.textLight)
    .text(label, x, y - 12)

  doc.roundedRect(x, y, width, barHeight, 3).fill('#E5E7EB')
  if (filledWidth > 0) {
    const color = percentage >= 0.7 ? COLORS.success : percentage >= 0.4 ? COLORS.warning : COLORS.danger
    doc.roundedRect(x, y, Math.max(filledWidth, 6), barHeight, 3).fill(color)
  }
  doc.fontSize(7).font(FONT_BOLD).fillColor(COLORS.white)
    .text(`${Math.round(percentage * 100)}%`, x + 4, y + 2, { width: Math.max(filledWidth - 8, 0) })
  if (filledWidth < 30) {
    doc.fontSize(7).font(FONT_BOLD).fillColor(COLORS.text)
      .text(`${Math.round(percentage * 100)}%`, x + filledWidth + 5, y + 2)
  }
}

function drawRadarChart(
  doc: PDFDocument,
  categories: string[],
  scores: number[],
  maxScore: number,
  centerX: number,
  centerY: number,
  radius: number,
): void {
  const n = categories.length
  if (n < 3) return

  // Grid rings
  for (let ring = 1; ring <= 5; ring++) {
    const r = (radius * ring) / 5
    doc.strokeColor(COLORS.border).lineWidth(0.3)
    for (let i = 0; i < n; i++) {
      const angle1 = (Math.PI * 2 * i) / n - Math.PI / 2
      const angle2 = (Math.PI * 2 * (i + 1)) / n - Math.PI / 2
      doc.moveTo(centerX + r * Math.cos(angle1), centerY + r * Math.sin(angle1))
        .lineTo(centerX + r * Math.cos(angle2), centerY + r * Math.sin(angle2))
        .stroke()
    }
  }

  // Axes
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    doc.moveTo(centerX, centerY)
      .lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle))
      .strokeColor(COLORS.border).lineWidth(0.3).stroke()
  }

  // Polygon
  doc.fillOpacity(0.25).strokeOpacity(1)
  doc.fillAndStroke(COLORS.primary, COLORS.primary)
  for (let i = 0; i <= n; i++) {
    const idx = i % n
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2
    const r = (scores[idx] / maxScore) * radius
    const px = centerX + r * Math.cos(angle)
    const py = centerY + r * Math.sin(angle)
    if (i === 0) doc.moveTo(px, py)
    else doc.lineTo(px, py)
  }
  doc.fillOpacity(1).strokeOpacity(1)

  // Dots and labels
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const r = (scores[i] / maxScore) * radius
    const px = centerX + r * Math.cos(angle)
    const py = centerY + r * Math.sin(angle)

    doc.circle(px, py, 4).fill(COLORS.primaryDark)

    const labelR = radius + 20
    const lx = centerX + labelR * Math.cos(angle)
    const ly = centerY + labelR * Math.sin(angle)
    const isRight = angle > -Math.PI / 2 && angle < Math.PI / 2
    const isBottom = Math.abs(angle) < Math.PI / 4 || Math.abs(angle) > 3 * Math.PI / 4

    doc.fontSize(7).font(FONT_BOLD).fillColor(COLORS.text)
    const labelWidth = doc.widthOfString(categories[i])
    const finalX = isRight ? lx : lx - labelWidth
    const finalY = isBottom ? ly + 2 : ly - 10

    doc.text(categories[i], finalX, finalY)

    doc.fontSize(6).font(FONT).fillColor(COLORS.primary)
    doc.text(`${scores[i].toFixed(1)}`, isRight ? lx : lx - 20, finalY + 10)
  }
}

function checkPageSpace(doc: PDFDocument, needed: number): void {
  if (doc.y + needed > doc.page.height - 80) {
    doc.addPage()
  }
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '\u2014'
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '\u2014'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function addPageNumbers(doc: PDFDocument): void {
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    drawFooter(doc, i + 1, range.count)
  }
}

function decisionBadge(doc: PDFDocument, decision: string, x: number, y: number): void {
  const color = decision === 'GO' ? COLORS.success : decision === 'GO_CONDITIONNEL' || decision === 'GO_CONDITIONAL' ? COLORS.warning : COLORS.danger
  const label = decision === 'GO' ? 'GO' : decision === 'GO_CONDITIONNEL' || decision === 'GO_CONDITIONAL' ? 'GO CONDITIONNEL' : 'NO GO'
  const textWidth = doc.fontSize(10).font(FONT_BOLD).widthOfString(label)

  doc.roundedRect(x, y, textWidth + 24, 24, 4).fill(color)
  doc.fontSize(10).font(FONT_BOLD).fillColor(COLORS.white)
    .text(label, x + 12, y + 7, { width: textWidth + 10, align: 'center' })
}

// ─── HTTP Helpers ────────────────────────────

function parseQuery(url: string): Record<string, string> {
  const query: Record<string, string> = {}
  const idx = url.indexOf('?')
  if (idx === -1) return query
  const params = url.slice(idx + 1).split('&')
  for (const param of params) {
    const [key, val] = param.split('=')
    if (key && val) {
      query[decodeURIComponent(key)] = decodeURIComponent(val.replace(/\+/g, ' '))
    }
  }
  return query
}

function json(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function sendPDF(res: ServerResponse, doc: PDFDocument, stream: PassThrough, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = []
    stream.on('data', (chunk: Buffer) => buffers.push(chunk))
    stream.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers)
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length,
      })
      res.end(pdfBuffer)
      resolve()
    })
    stream.on('error', reject)
    doc.end()
  })
}

function error(res: ServerResponse, message: string, status = 500): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: message }))
}

// ─── Kiviat Dimension Labels ─────────────────

const KIVIAT_DIMENSIONS = [
  'Leadership',
  'Gestion du stress',
  'Communication',
  'R\u00e9solution de probl\u00e8mes',
  'Cr\u00e9ativit\u00e9',
  'Adaptabilit\u00e9',
  'Autonomie',
  'Pers\u00e9v\u00e9rance',
]

const KIVIAT_DIM_MAP: Record<string, string> = {
  leadership: 'Leadership',
  stress: 'Gestion du stress',
  communication: 'Communication',
  resolution: 'R\u00e9solution de probl\u00e8mes',
  creativity: 'Cr\u00e9ativit\u00e9',
  adaptability: 'Adaptabilit\u00e9',
  autonomie: 'Autonomie',
  autonomia: 'Autonomie',
  perseverance: 'Pers\u00e9v\u00e9rance',
}

// ─── PDF: Cover Page ─────────────────────────

function drawCoverPage(doc: PDFDocument, title: string, subtitle: string, beneficiaryName: string, date: string): void {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg)

  // Top accent bar
  doc.rect(0, 0, doc.page.width, 10).fill(COLORS.primary)

  // Teal sidebar
  doc.rect(0, 0, 12, doc.page.height).fill(COLORS.primary)

  // Logo area
  doc.fontSize(28).font(FONT_BOLD).fillColor(COLORS.primary)
    .text('CreaPulse', 50, 120)
  doc.fontSize(12).font(FONT).fillColor(COLORS.textLight)
    .text('Echo Entreprendre — GIDEF', 50, 155)

  // Horizontal line
  doc.moveTo(50, 185).lineTo(doc.page.width - 50, 185)
    .strokeColor(COLORS.primaryLight).lineWidth(2).stroke()

  // Document title
  doc.fontSize(26).font(FONT_BOLD).fillColor(COLORS.text)
    .text(title, 50, 220, { width: doc.page.width - 100, align: 'left' })

  doc.moveDown(0.5)
  doc.fontSize(14).font(FONT_ITALIC).fillColor(COLORS.primary)
    .text(subtitle, 50, doc.y, { width: doc.page.width - 100 })

  // Info cards
  const cardY = 380
  const cardW = 200
  const cardH = 70

  // Beneficiary card
  doc.roundedRect(50, cardY, cardW, cardH, 8).fillAndStroke(COLORS.bgCard, COLORS.border)
  doc.rect(50, cardY, cardW, 4).fill(COLORS.primary)
  doc.fontSize(7).font(FONT).fillColor(COLORS.textMuted)
    .text('B\u00e9n\u00e9ficiaire', 60, cardY + 14)
  doc.fontSize(12).font(FONT_BOLD).fillColor(COLORS.text)
    .text(beneficiaryName || '\u2014', 60, cardY + 30, { width: cardW - 20 })

  // Date card
  doc.roundedRect(50 + cardW + 20, cardY, cardW, cardH, 8).fillAndStroke(COLORS.bgCard, COLORS.border)
  doc.rect(50 + cardW + 20, cardY, cardW, 4).fill(COLORS.secondary)
  doc.fontSize(7).font(FONT).fillColor(COLORS.textMuted)
    .text('Date du rapport', 60 + cardW + 20, cardY + 14)
  doc.fontSize(12).font(FONT_BOLD).fillColor(COLORS.text)
    .text(date, 60 + cardW + 20, cardY + 30, { width: cardW - 20 })

  // Confidentiality
  doc.fontSize(8).font(FONT_ITALIC).fillColor(COLORS.textMuted)
    .text('Document confidentiel — Usage interne uniquement', 50, doc.page.height - 100, {
      width: doc.page.width - 100,
      align: 'center'
    })

  // Footer
  doc.fontSize(7).font(FONT).fillColor(COLORS.textMuted)
    .text('G\u00e9n\u00e9r\u00e9 par CreaPulse V2 — PDF Service', 50, doc.page.height - 60, {
      width: doc.page.width - 100,
      align: 'center'
    })
}

// ─── PDF Generation: Bilan ───────────────────

async function generateBilanPDF(beneficiaryId: string): Promise<{ doc: PDFDocument; stream: PassThrough }> {
  const { doc, stream } = createPDFDoc('Bilan Diagnostique Complet')
  const db = await getDb()

  // Fetch all related data
  const user = await db.user.findUnique({
    where: { id: beneficiaryId },
    include: {
      beneficiaryProfile: true,
      creatorJourney: true,
      kiviatResults: true,
      riasecResults: true,
      moduleResults: true,
      motivations: true,
      tremplin: true,
      creasimSimulation: true,
      financialForecast: true,
      marketAnalysis: true,
      juridiqueAnalysis: true,
      businessModelCanvas: true,
    },
  })

  if (!user) throw new Error('Beneficiary not found')

  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Non renseign\u00e9'
  const journey = user.creatorJourney
  const today = formatDate(new Date())

  // ─── Page 1: Cover ─────────────────────
  drawCoverPage(doc, 'Bilan Diagnostique', 'Rapport complet du parcours cr\u00e9ateur', name, today)

  // ─── Page 2: Scores Overview ───────────
  doc.addPage()
  drawHeader(doc, 'Vue d\'ensemble des scores', 'R\u00e9sultats par module et progression')
  doc.moveDown(0.5)

  const modules = user.moduleResults || []
  if (modules.length > 0) {
    sectionHeader(doc, 'R\u00e9sultats des modules')
    const tableWidth = doc.page.width - 100
    simpleTable(
      doc,
      ['Module', 'Score', 'Maximum', 'Progression', 'Compl\u00e9t\u00e9 le'],
      modules.map((m) => [
        m.moduleCode,
        `${m.score}/${m.maxScore}`,
        `${m.maxScore}`,
        `${Math.round((m.score / m.maxScore) * 100)}%`,
        formatDate(m.completedAt),
      ]),
      [120, 80, 80, 80, tableWidth - 360],
    )

    // Progress bars
    doc.moveDown(0.5)
    sectionHeader(doc, 'Barres de progression')
    let barY = doc.y + 5
    modules.forEach((m) => {
      if (barY > doc.page.height - 100) {
        doc.addPage()
        barY = 60
      }
      progressBar(doc, m.moduleCode, m.score, m.maxScore, 60, barY + 12, doc.page.width - 120)
      barY += 35
    })
    doc.y = barY + 10
  } else {
    infoBox(doc, 'Aucun r\u00e9sultat de module disponible pour le moment.', 'info')
  }

  // Journey progress
  if (journey) {
    doc.moveDown(0.5)
    sectionHeader(doc, 'Progression du parcours')
    const journeyProgress = journey.progressPercent || 0
    progressBar(doc, 'Progression globale', journeyProgress, 100, 60, doc.y + 12, doc.page.width - 120)
    doc.y += 40

    bodyText(doc, `Phase actuelle : ${journey.currentPhase}`)
    bodyText(doc, `Projet : ${journey.projectTitle || '\u2014'}`)
    if (journey.projectDescription) {
      bodyText(doc, `Description : ${journey.projectDescription}`)
    }
  }

  // ─── Page 3: Kiviat Radar ────────────────
  doc.addPage()
  drawHeader(doc, 'Profil Kiviat', 'Radar des 8 dimensions entrepreneuriales')
  doc.moveDown(0.5)

  const kiviatResults = user.kiviatResults || []
  const categories: string[] = []
  const scores: number[] = []

  for (const dim of KIVIAT_DIMENSIONS) {
    const found = kiviatResults.find((kr) => KIVIAT_DIM_MAP[kr.category.toLowerCase()] === dim)
    categories.push(dim)
    scores.push(found ? found.score : 0)
  }

  const centerX = (doc.page.width) / 2
  const centerY = 280
  drawRadarChart(doc, categories, scores, 10, centerX, centerY, 150)

  // Score table
  doc.moveDown(2)
  sectionHeader(doc, 'D\u00e9tail des scores Kiviat')
  simpleTable(
    doc,
    ['Dimension', 'Score', 'Niveau'],
    categories.map((cat, i) => {
      const s = scores[i]
      let level = 'Besoin d\'accompagnement'
      if (s >= 8) level = 'Force majeure'
      else if (s >= 6) level = 'Comp\u00e9tence acquise'
      else if (s >= 4) level = 'Point d\'am\u00e9lioration'
      return [cat, s.toFixed(1), level]
    }),
    [200, 80, doc.page.width - 380],
  )

  // Interpretation
  doc.moveDown(0.5)
  sectionHeader(doc, 'Interpr\u00e9tation')
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  if (avgScore >= 7) {
    infoBox(doc, 'Le profil entrepreneurial est solide. Le b\u00e9n\u00e9ficiaire poss\u00e8de des comp\u00e9tences entrepreneuriales bien d\u00e9velopp\u00e9es et une bonne maturit\u00e9 pour la cr\u00e9ation d\'entreprise.', 'success')
  } else if (avgScore >= 5) {
    infoBox(doc, 'Le profil est encourageant avec des points forts identifi\u00e9s. Un accompagnement cibl\u00e9 sur les dimensions en dessous de 5/10 est recommand\u00e9.', 'info')
  } else {
    infoBox(doc, 'Le profil n\u00e9cessite un accompagnement renforc\u00e9. Plusieurs dimensions sont en dessous du seuil de 5/10, indiquant un besoin de formation pr\u00e9alable.', 'warning')
  }

  // ─── Page 4: RIASEC Profile ────────────
  doc.addPage()
  drawHeader(doc, 'Profil RIASEC', 'Int\u00e9r\u00eats et orientations professionnelles')
  doc.moveDown(0.5)

  const riasecResults = user.riasecResults || []
  if (riasecResults.length > 0) {
    // Dominant types
    const dominant = riasecResults.filter((r) => r.isDominant).map((r) => r.profileType)
    if (dominant.length > 0) {
      sectionHeader(doc, 'Types dominants')
      dominant.forEach((d) => bullet(doc, `Profil ${d} (dominant)`))
    }

    // All scores
    doc.moveDown(0.3)
    sectionHeader(doc, 'Scores RIASEC')
    simpleTable(
      doc,
      ['Type', 'Score', 'Dominant'],
      riasecResults.map((r) => [
        r.profileType,
        r.score.toFixed(1),
        r.isDominant ? 'Oui' : 'Non',
      ]),
      [120, 100, doc.page.width - 320],
    )

    // Progress bars
    doc.moveDown(0.5)
    let rY = doc.y + 5
    riasecResults.forEach((r) => {
      if (rY > doc.page.height - 100) {
        doc.addPage()
        rY = 60
      }
      progressBar(doc, r.profileType, r.score, 10, 60, rY + 12, doc.page.width - 120)
      rY += 35
    })
    doc.y = rY + 10
  } else {
    infoBox(doc, 'Aucun r\u00e9sultat RIASEC disponible. Le test d\'orientation n\'a pas encore \u00e9t\u00e9 pass\u00e9.', 'info')
  }

  // ─── Page 5: Tremplin ──────────────────
  doc.addPage()
  drawHeader(doc, 'Tremplin — D\u00e9cision GO / NO GO', 'Analyse de faisabilit\u00e9 du projet')
  doc.moveDown(0.5)

  const tremplin = user.tremplin
  if (tremplin) {
    // Decision badge
    const decisionStr = tremplin.decision || 'PENDING'
    decisionBadge(doc, decisionStr, 50, doc.y)
    doc.y += 40

    sectionHeader(doc, 'Score et progression')
    bodyText(doc, `Score global : ${tremplin.score ?? '\u2014'} / 100`)
    bodyText(doc, `\u00c9tape actuelle : ${tremplin.currentStep || 0}`)
    bodyText(doc, `Compl\u00e9t\u00e9 : ${tremplin.isCompleted ? 'Oui' : 'Non'}`)
    bodyText(doc, `Date de compl\u00e9tion : ${formatDate(tremplin.completedAt)}`)

    if (tremplin.summary) {
      doc.moveDown(0.3)
      sectionHeader(doc, 'Synth\u00e8se')
      bodyText(doc, tremplin.summary)
    }

    // Recommendations
    const recs = parseJson<string[]>(tremplin.recommendations, [])
    if (recs.length > 0) {
      doc.moveDown(0.3)
      sectionHeader(doc, 'Recommandations')
      recs.forEach((rec) => bullet(doc, String(rec)))
    }
  } else {
    infoBox(doc, 'Le questionnaire Tremplin n\'a pas encore \u00e9t\u00e9 compl\u00e9t\u00e9.', 'info')
  }

  // ─── Page 6: Financial Summary ──────────
  doc.addPage()
  drawHeader(doc, 'Synth\u00e8se financi\u00e8re', 'Pr\u00e9visions sur 3 ans')
  doc.moveDown(0.5)

  const financial = user.financialForecast
  if (financial) {
    // Metric cards
    const cardW = (doc.page.width - 100 - 20) / 3
    const cardH = 50
    metricCard(doc, 'Investissement initial', formatCurrency(financial.initialInvestment), 50, doc.y, cardW, cardH)
    metricCard(doc, 'Seuil de rentabilit\u00e9', financial.breakevenMonth ? `Mois ${financial.breakevenMonth}` : '\u2014', 50 + cardW + 10, doc.y, cardW, cardH)
    metricCard(doc, 'CA Ann\u00e9e 1', formatCurrency(financial.year1Revenue), 50 + (cardW + 10) * 2, doc.y, cardW, cardH)
    doc.y += cardH + 15

    sectionHeader(doc, 'Pr\u00e9visions triennales')
    simpleTable(
      doc,
      ['', 'Ann\u00e9e 1', 'Ann\u00e9e 2', 'Ann\u00e9e 3'],
      [
        ['Chiffre d\'affaires', formatCurrency(financial.year1Revenue), formatCurrency(financial.year2Revenue), formatCurrency(financial.year3Revenue)],
        ['Charges', formatCurrency(financial.year1Expenses), formatCurrency(financial.year2Expenses), formatCurrency(financial.year3Expenses)],
      ],
      [130, (doc.page.width - 230) / 3, (doc.page.width - 230) / 3, (doc.page.width - 230) / 3],
    )

    if (financial.aiSynthesis) {
      doc.moveDown(0.3)
      sectionHeader(doc, 'Analyse IA')
      bodyText(doc, financial.aiSynthesis)
    }
  } else {
    infoBox(doc, 'Aucune pr\u00e9vision financi\u00e8re disponible.', 'info')
  }

  // ─── Page 7: Motivation Assessment ──────
  doc.addPage()
  drawHeader(doc, '\u00c9valuation de la motivation', 'Analyse des motivations \u00e0 la cr\u00e9ation')
  doc.moveDown(0.5)

  const motivation = user.motivations
  if (motivation) {
    const scoresData = parseJson<Record<string, number>>(motivation.scores, {})
    const scoreEntries = Object.entries(scoresData)

    if (scoreEntries.length > 0) {
      sectionHeader(doc, 'Scores de motivation')
      simpleTable(
        doc,
        ['Dimension', 'Score'],
        scoreEntries.map(([key, val]) => [key, `${val}/10`]),
        [250, doc.page.width - 350],
      )

      let mY = doc.y + 5
      scoreEntries.forEach(([key, val]) => {
        if (mY > doc.page.height - 100) {
          doc.addPage()
          mY = 60
        }
        progressBar(doc, key, val, 10, 60, mY + 12, doc.page.width - 120)
        mY += 35
      })
      doc.y = mY + 10
    }

    if (motivation.summary) {
      sectionHeader(doc, 'Synth\u00e8se')
      bodyText(doc, motivation.summary)
    }
  } else {
    infoBox(doc, 'L\'\u00e9valuation de la motivation n\'a pas encore \u00e9t\u00e9 effectu\u00e9e.', 'info')
  }

  // ─── Page 8: CreaScope ─────────────────
  doc.addPage()
  drawHeader(doc, 'CreaScope', 'Notes de session et synth\u00e8ses')
  doc.moveDown(0.5)

  const creascopeSessions = await db.creaScopeSession.findMany({
    where: { beneficiaryId },
    orderBy: { scheduledAt: 'desc' },
    take: 5,
  })

  if (creascopeSessions.length > 0) {
    creascopeSessions.forEach((session, idx) => {
      sectionHeader(doc, `Session ${idx + 1} — ${formatDate(session.scheduledAt)}`)
      bodyText(doc, `Statut : ${session.status}`)
      bodyText(doc, `Phase : ${session.currentPhase || '\u2014'}`)

      const phaseNotes = parseJson<Record<string, string>>(session.phaseNotes, {})
      const noteEntries = Object.entries(phaseNotes)
      if (noteEntries.length > 0) {
        subHeader(doc, 'Notes par phase')
        noteEntries.forEach(([phase, note]) => {
          if (note) bullet(doc, `${phase} : ${note}`)
        })
      }

      if (session.counselorSynthesis) {
        subHeader(doc, 'Synth\u00e8se conseiller')
        bodyText(doc, session.counselorSynthesis)
      }

      const actionPlan = parseJson<Array<{ action: string; deadline?: string; responsible?: string; status?: string }>>(session.actionPlan, [])
      if (actionPlan.length > 0) {
        subHeader(doc, 'Plan d\'action')
        actionPlan.forEach((item) => {
          bullet(doc, `${item.action}${item.deadline ? ` (\u00e9ch\u00e9ance: ${item.deadline})` : ''}`)
        })
      }

      doc.moveDown(0.5)
    })
  } else {
    infoBox(doc, 'Aucune session CreaScope disponible pour ce b\u00e9n\u00e9ficiaire.', 'info')
  }

  // ─── Page 9: Action Plan ────────────────
  doc.addPage()
  drawHeader(doc, 'Plan d\'action', 'Prochaines \u00e9tapes recommand\u00e9es')
  doc.moveDown(0.5)

  // Gather action items from tremplin and creascope
  const allActions: string[] = []

  if (tremplin) {
    const recs = parseJson<string[]>(tremplin.recommendations, [])
    recs.forEach((r) => allActions.push(String(r)))
  }

  creascopeSessions.forEach((session) => {
    const plan = parseJson<Array<{ action: string }>>(session.actionPlan, [])
    plan.forEach((item) => allActions.push(item.action))
  })

  if (allActions.length > 0) {
    sectionHeader(doc, 'Actions identifi\u00e9es')
    allActions.forEach((action, idx) => {
      bullet(doc, `${idx + 1}. ${action}`)
    })
  } else {
    infoBox(doc, 'Aucune action identifi\u00e9e pour le moment. Compl\u00e9tez les modules pour g\u00e9n\u00e9rer des recommandations.', 'info')
  }

  // Next steps template
  doc.moveDown(1)
  sectionHeader(doc, '\u00c9tapes suivantes recommand\u00e9es')
  const nextSteps = [
    'Compl\u00e9ter les modules diagnostics en attente',
    'Passer le test Kiviat si pas encore fait',
    'Finaliser le questionnaire Tremplin',
    'R\u00e9aliser les pr\u00e9visions financi\u00e8res',
    'Planifier une session CreaScope avec le conseiller',
    'G\u00e9n\u00e9rer le Business Plan',
  ]
  nextSteps.forEach((step) => bullet(doc, step))

  // Add page numbers and finalize
  addPageNumbers(doc)

  return { doc, stream }
}

// ─── PDF Generation: Kiviat ─────────────────

async function generateKiviatPDF(beneficiaryId: string): Promise<{ doc: PDFDocument; stream: PassThrough }> {
  const { doc, stream } = createPDFDoc('Profil Kiviat')
  const db = await getDb()

  const user = await db.user.findUnique({
    where: { id: beneficiaryId },
    include: {
      kiviatResults: true,
      swipeResults: true,
      swipeAnswers: true,
    },
  })

  if (!user) throw new Error('Beneficiary not found')

  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Non renseign\u00e9'
  const today = formatDate(new Date())

  // Cover
  drawCoverPage(doc, 'Profil Kiviat', 'Radar des comp\u00e9tences entrepreneuriales', name, today)

  // Main radar page
  doc.addPage()
  drawHeader(doc, 'Radar Kiviat', '8 dimensions \u00e9valu\u00e9es sur 10')
  doc.moveDown(0.5)

  const kiviatResults = user.kiviatResults || []
  const categories: string[] = []
  const scores: number[] = []

  for (const dim of KIVIAT_DIMENSIONS) {
    const found = kiviatResults.find((kr) => KIVIAT_DIM_MAP[kr.category.toLowerCase()] === dim)
    categories.push(dim)
    scores.push(found ? found.score : 0)
  }

  const centerX = doc.page.width / 2
  const centerY = 250
  drawRadarChart(doc, categories, scores, 10, centerX, centerY, 150)

  doc.y = centerY + 180

  // Score detail table
  sectionHeader(doc, 'D\u00e9tail des scores')
  simpleTable(
    doc,
    ['Dimension', 'Score / 10', 'Niveau', 'Interpr\u00e9tation'],
    categories.map((cat, i) => {
      const s = scores[i]
      let level = 'Besoin d\'accompagnement'
      let interp = 'Formation ou accompagnement intensif n\u00e9cessaire'
      if (s >= 8) {
        level = 'Force majeure'
        interp = 'Comp\u00e9tence tr\u00e8s d\u00e9velopp\u00e9e, atout majeur'
      } else if (s >= 6) {
        level = 'Comp\u00e9tence acquise'
        interp = 'Bon niveau, consolidation possible'
      } else if (s >= 4) {
        level = 'Point d\'am\u00e9lioration'
        interp = 'Formation ou pratique recommand\u00e9e'
      }
      return [cat, s.toFixed(1), level, interp]
    }),
    [110, 60, 120, doc.page.width - 390],
  )

  // Global analysis
  doc.moveDown(0.5)
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  sectionHeader(doc, 'Analyse globale')
  metricCard(doc, 'Score moyen', avgScore.toFixed(1) + ' / 10', 50, doc.y, 100, 50)
  const maxIdx = scores.indexOf(Math.max(...scores))
  const minIdx = scores.indexOf(Math.min(...scores))
  metricCard(doc, 'Point fort', categories[maxIdx] || '\u2014', 160, doc.y, 120, 50)
  metricCard(doc, 'Point faible', categories[minIdx] || '\u2014', 290, doc.y, 120, 50)
  doc.y += 65

  // Detailed analysis per level
  doc.moveDown(0.5)
  sectionHeader(doc, 'R\u00e9partition par niveau')
  const levelCounts = { 'Force majeure': 0, 'Comp\u00e9tence acquise': 0, 'Point d\'am\u00e9lioration': 0, 'Besoin d\'accompagnement': 0 }
  categories.forEach((_, i) => {
    const s = scores[i]
    if (s >= 8) levelCounts['Force majeure']++
    else if (s >= 6) levelCounts['Comp\u00e9tence acquise']++
    else if (s >= 4) levelCounts['Point d\'am\u00e9lioration']++
    else levelCounts['Besoin d\'accompagnement']++
  })

  simpleTable(
    doc,
    ['Niveau', 'Plage', 'Nombre de dimensions', 'Couleur'],
    [
      ['Force majeure', '8 — 10', String(levelCounts['Force majeure']), '\u2588 Vert'],
      ['Comp\u00e9tence acquise', '6 — 7.9', String(levelCounts['Comp\u00e9tence acquise']), '\u2588 Jaune'],
      ['Point d\'am\u00e9lioration', '4 — 5.9', String(levelCounts['Point d\'am\u00e9lioration']), '\u2588 Orange'],
      ['Besoin d\'accompagnement', '0 — 3.9', String(levelCounts['Besoin d\'accompagnement']), '\u2588 Rouge'],
    ],
    [130, 80, 150, doc.page.width - 460],
  )

  // Swipe game data (if available)
  const swipeResults = user.swipeResults || []
  if (swipeResults.length > 0) {
    doc.addPage()
    drawHeader(doc, 'D\u00e9tails — Jeu de cartes', 'R\u00e9sultats du jeu de p\u00e9pites')
    doc.moveDown(0.5)

    sectionHeader(doc, 'Cartes conserv\u00e9es (P\u00e9pites)')
    const kept = swipeResults.filter((r) => r.kept)
    const superPepites = kept.filter((r) => r.superPepite)

    bodyText(doc, `Total : ${kept.length} cartes conserv\u00e9es sur ${swipeResults.length}`)
    bodyText(doc, `Super-p\u00e9pites : ${superPepites.length}`)

    if (kept.length > 0) {
      sectionHeader(doc, 'Liste des p\u00e9pites')
      const tableWidth = doc.page.width - 100
      simpleTable(
        doc,
        ['Comp\u00e9tence', 'Cat\u00e9gorie', 'Confiance', 'Super'],
        kept.slice(0, 20).map((r) => [
          r.cardTitle,
          r.cardCode.split('-')[0],
          r.confidence ? `${r.confidence}/5` : '\u2014',
          r.superPepite ? '\u2b50' : '',
        ]),
        [150, 100, 80, tableWidth - 330],
      )
    }
  }

  addPageNumbers(doc)
  return { doc, stream }
}

// ─── PDF Generation: Tremplin ───────────────

async function generateTremplinPDF(beneficiaryId: string): Promise<{ doc: PDFDocument; stream: PassThrough }> {
  const { doc, stream } = createPDFDoc('Tremplin — GO / NO GO')
  const db = await getDb()

  const user = await db.user.findUnique({
    where: { id: beneficiaryId },
    include: {
      tremplin: true,
      creatorJourney: true,
      kiviatResults: true,
      financialForecast: true,
    },
  })

  if (!user) throw new Error('Beneficiary not found')

  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Non renseign\u00e9'
  const today = formatDate(new Date())

  // Cover
  drawCoverPage(doc, 'Tremplin', 'D\u00e9cision de faisabilit\u00e9 du projet', name, today)

  // Decision page
  doc.addPage()
  drawHeader(doc, 'D\u00e9cision Tremplin', 'R\u00e9sultat de l\'analyse de faisabilit\u00e9')
  doc.moveDown(1)

  const tremplin = user.tremplin
  if (!tremplin) {
    infoBox(doc, 'Le questionnaire Tremplin n\'a pas encore \u00e9t\u00e9 compl\u00e9t\u00e9. Veuillez r\u00e9pondre aux 6 \u00e9tapes pour obtenir la d\u00e9cision.', 'warning')
    addPageNumbers(doc)
    return { doc, stream }
  }

  // Large decision badge
  const decisionStr = tremplin.decision || 'PENDING'
  const badgeX = (doc.page.width - 200) / 2
  const badgeY = doc.y

  // Big badge background
  const badgeColor = decisionStr === 'GO' ? COLORS.success : decisionStr === 'GO_CONDITIONNEL' || decisionStr === 'GO_CONDITIONAL' ? COLORS.warning : COLORS.danger
  doc.roundedRect(badgeX, badgeY, 200, 60, 10).fill(badgeColor)
  doc.fontSize(22).font(FONT_BOLD).fillColor(COLORS.white)
  const label = decisionStr === 'GO' ? 'GO' : decisionStr === 'GO_CONDITIONNEL' || decisionStr === 'GO_CONDITIONAL' ? 'GO CONDITIONNEL' : 'NO GO'
  doc.text(label, badgeX, badgeY + 18, { width: 200, align: 'center' })
  doc.y = badgeY + 80

  // Score
  sectionHeader(doc, 'Score global')
  const score = tremplin.score || 0
  progressBar(doc, 'Score Tremplin', score, 100, 60, doc.y + 12, doc.page.width - 120)
  doc.y += 35
  bodyText(doc, `Score : ${score} / 100 — \u00c9tape ${tremplin.currentStep || 0} / 6`)

  // 6-step breakdown
  doc.moveDown(0.5)
  sectionHeader(doc, 'D\u00e9tail par \u00e9tape')
  const responses = parseJson<Record<string, unknown>>(tremplin.responses, {})
  const stepLabels = [
    '1. Motivation et passion',
    '2. Comp\u00e9tences et exp\u00e9rience',
    '3. March\u00e9 et concurrence',
    '4. Mod\u00e8le \u00e9conomique',
    '5. Ressources financi\u00e8res',
    '6. Soutien et r\u00e9seau',
  ]

  stepLabels.forEach((stepLabel, idx) => {
    checkPageSpace(doc, 40)
    const stepData = responses[`step${idx + 1}`]
    const stepScore = typeof stepData === 'object' && stepData !== null
      ? (stepData as Record<string, unknown>).score as number | undefined
      : undefined
    const stepY = doc.y

    doc.roundedRect(50, stepY, doc.page.width - 100, 30, 4)
      .fillAndStroke(COLORS.bgCard, COLORS.border)

    doc.rect(50, stepY, 4, 30).fill(idx < tremplin.currentStep ? COLORS.success : COLORS.border)

    doc.fontSize(9).font(FONT_BOLD).fillColor(COLORS.text)
      .text(stepLabel, 62, stepY + 8)

    if (stepScore !== undefined) {
      doc.fontSize(9).font(FONT_BOLD).fillColor(COLORS.primary)
        .text(`${stepScore}/20`, doc.page.width - 100, stepY + 8, { width: 40, align: 'right' })
    }

    doc.y = stepY + 38
  })

  // AI Synthesis
  if (tremplin.summary) {
    doc.moveDown(0.5)
    sectionHeader(doc, 'Synth\u00e8se IA')
    bodyText(doc, tremplin.summary)
  }

  // Recommendations
  doc.moveDown(0.5)
  sectionHeader(doc, 'Recommandations')
  const recs = parseJson<string[]>(tremplin.recommendations, [])
  if (recs.length > 0) {
    recs.forEach((rec) => bullet(doc, String(rec)))
  } else {
    bodyText(doc, 'Aucune recommandation sp\u00e9cifique pour le moment.')
  }

  addPageNumbers(doc)
  return { doc, stream }
}

// ─── PDF Generation: CreaScope ──────────────

async function generateCreaScopePDF(sessionId: string): Promise<{ doc: PDFDocument; stream: PassThrough }> {
  const { doc, stream } = createPDFDoc('Rapport CreaScope')
  const db = await getDb()

  const session = await db.creaScopeSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) throw new Error('Session not found')

  // Fetch beneficiary and counselor names separately
  const beneficiary = session.beneficiaryId ? await db.user.findUnique({ where: { id: session.beneficiaryId } }) : null
  const counselor = session.counselorId ? await db.user.findUnique({ where: { id: session.counselorId } }) : null

  const beneficiaryName = beneficiary
    ? `${beneficiary.firstName || ''} ${beneficiary.lastName || ''}`.trim()
    : 'Non renseign\u00e9'
  const counselorName = counselor
    ? `${counselor.firstName || ''} ${counselor.lastName || ''}`.trim()
    : 'Non renseign\u00e9'

  // Cover
  drawCoverPage(doc, 'Rapport CreaScope', `Session du ${formatDate(session.scheduledAt)}`, beneficiaryName, formatDate(new Date()))

  // Session timeline
  doc.addPage()
  drawHeader(doc, 'D\u00e9roulement de la session', `Conseiller : ${counselorName}`)
  doc.moveDown(0.5)

  sectionHeader(doc, 'Informations de la session')
  bodyText(doc, `Date planifi\u00e9e : ${formatDate(session.scheduledAt)}`)
  bodyText(doc, `Date de d\u00e9but : ${formatDate(session.startedAt)}`)
  bodyText(doc, `Date de fin : ${formatDate(session.completedAt)}`)
  bodyText(doc, `Statut : ${session.status}`)
  bodyText(doc, `Phase actuelle : ${session.currentPhase || '\u2014'}`)
  bodyText(doc, `Score de satisfaction : ${session.feedbackScore ? `${session.feedbackScore}/5` : '\u2014'}`)

  // Phase durations
  const phaseDurations = parseJson<Record<string, number>>(session.phaseDurations, {})
  if (Object.keys(phaseDurations).length > 0) {
    doc.moveDown(0.3)
    sectionHeader(doc, 'Dur\u00e9e par phase')
    simpleTable(
      doc,
      ['Phase', 'Dur\u00e9e (minutes)'],
      Object.entries(phaseDurations).map(([phase, dur]) => [phase, `${dur} min`]),
      [250, doc.page.width - 350],
    )
  }

  // Per-phase notes
  const phaseNotes = parseJson<Record<string, string>>(session.phaseNotes, {})
  if (Object.keys(phaseNotes).length > 0) {
    doc.moveDown(0.3)
    sectionHeader(doc, 'Notes par phase')
    Object.entries(phaseNotes).forEach(([phase, note]) => {
      if (note) {
        subHeader(doc, phase)
        bodyText(doc, note)
      }
    })
  }

  // Kiviat scores from session
  const kiviatScores = parseJson<Record<string, number>>(session.kiviatScores, {})
  if (Object.keys(kiviatScores).length > 0) {
    doc.addPage()
    drawHeader(doc, 'Scores Kiviat de la session', '\u00c9valuation en temps r\u00e9el')
    doc.moveDown(0.5)

    const categories: string[] = []
    const scores: number[] = []
    for (const [key, val] of Object.entries(kiviatScores)) {
      categories.push(key)
      scores.push(val)
    }

    if (categories.length >= 3) {
      const centerX = doc.page.width / 2
      const centerY = 250
      drawRadarChart(doc, categories, scores, 10, centerX, centerY, 130)
      doc.y = centerY + 170
    }

    sectionHeader(doc, 'Tableau des scores')
    simpleTable(
      doc,
      ['Dimension', 'Score'],
      categories.map((cat, i) => [cat, scores[i].toFixed(1)]),
      [250, doc.page.width - 350],
    )
  }

  // Tremplin decision from session
  if (session.tremplinDecision) {
    doc.moveDown(0.5)
    sectionHeader(doc, 'D\u00e9cision Tremplin')
    decisionBadge(doc, session.tremplinDecision, 50, doc.y)
    doc.y += 40
  }

  // Syntheses
  doc.addPage()
  drawHeader(doc, 'Synth\u00e8ses', 'Analyse et recommandations')
  doc.moveDown(0.5)

  if (session.bilanAiSynthesis) {
    sectionHeader(doc, 'Synth\u00e8se IA')
    bodyText(doc, session.bilanAiSynthesis)
  }

  if (session.counselorSynthesis) {
    sectionHeader(doc, 'Synth\u00e8se du conseiller')
    bodyText(doc, session.counselorSynthesis)
  }

  // Action plan
  const actionPlan = parseJson<Array<{ action: string; deadline?: string; responsible?: string; status?: string }>>(session.actionPlan, [])
  if (actionPlan.length > 0) {
    doc.moveDown(0.5)
    sectionHeader(doc, 'Plan d\'action')
    const tableWidth = doc.page.width - 100
    simpleTable(
      doc,
      ['Action', 'Responsable', '\u00c9ch\u00e9ance', 'Statut'],
      actionPlan.map((item) => [
        item.action,
        item.responsible || '\u2014',
        item.deadline || '\u2014',
        item.status || '\u2014',
      ]),
      [tableWidth * 0.4, tableWidth * 0.2, tableWidth * 0.2, tableWidth * 0.2],
    )
  }

  // Notes
  const notes = parseJson<string[]>(session.notes, [])
  if (notes.length > 0) {
    doc.moveDown(0.5)
    sectionHeader(doc, 'Notes libres')
    notes.forEach((note) => bullet(doc, String(note)))
  }

  addPageNumbers(doc)
  return { doc, stream }
}

// ─── PDF Generation: CreaSim ────────────────

async function generateCreaSimPDF(beneficiaryId: string): Promise<{ doc: PDFDocument; stream: PassThrough }> {
  const { doc, stream } = createPDFDoc('Simulation CreaSim')
  const db = await getDb()

  const user = await db.user.findUnique({
    where: { id: beneficiaryId },
    include: {
      creasimSimulation: true,
      creatorJourney: true,
    },
  })

  if (!user) throw new Error('Beneficiary not found')

  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Non renseign\u00e9'
  const today = formatDate(new Date())

  // Cover
  drawCoverPage(doc, 'Simulation CreaSim', 'Simulateur de rentabilit\u00e9', name, today)

  // Inputs page
  doc.addPage()
  drawHeader(doc, 'Param\u00e8tres de la simulation', 'Donn\u00e9es d\'entr\u00e9e')
  doc.moveDown(0.5)

  const sim = user.creasimSimulation
  if (!sim) {
    infoBox(doc, 'Aucune simulation CreaSim disponible. Lancez une simulation pour g\u00e9n\u00e9rer ce rapport.', 'warning')
    addPageNumbers(doc)
    return { doc, stream }
  }

  sectionHeader(doc, 'Chiffre d\'affaires mensuel')
  bodyText(doc, `Revenu mensuel estim\u00e9 : ${formatCurrency(sim.monthlyRevenue)}`)
  bodyText(doc, `Prix de vente moyen : ${formatCurrency(sim.averageSellingPrice)}`)
  bodyText(doc, `Co\u00fbt unitaire : ${formatCurrency(sim.unitCost)}`)

  sectionHeader(doc, 'Charges')
  bodyText(doc, `Taux de charges variables : ${sim.variableChargesRate ?? '\u2014'}%`)
  const fixedCharges = parseJson<Array<{ name: string; amount: number }>>(sim.fixedCharges, [])
  if (fixedCharges.length > 0) {
    subHeader(doc, 'Charges fixes d\u00e9taill\u00e9es')
    simpleTable(
      doc,
      ['Charge', 'Montant'],
      fixedCharges.map((fc) => [fc.name, formatCurrency(fc.amount)]),
      [250, doc.page.width - 350],
    )
  }
  bodyText(doc, `Total charges fixes : ${formatCurrency(sim.fixedChargesTotal)}`)
  bodyText(doc, `Objectif de marge : ${sim.targetMarginRate ?? '\u2014'}%`)

  sectionHeader(doc, 'Investissement')
  bodyText(doc, `Investissement initial : ${formatCurrency(sim.initialInvestment)}`)

  // Results page
  doc.addPage()
  drawHeader(doc, 'R\u00e9sultats', 'Indicateurs cl\u00e9s de la simulation')
  doc.moveDown(0.5)

  const cardW = (doc.page.width - 100 - 30) / 4
  const cardH = 50

  metricCard(doc, 'Marge brute', formatCurrency(sim.grossMarginAmount), 50, doc.y, cardW, cardH)
  metricCard(doc, 'Taux marge brute', `${sim.grossMarginRate?.toFixed(1) ?? '\u2014'}%`, 50 + cardW + 10, doc.y, cardW, cardH)
  metricCard(doc, 'Marge nette', formatCurrency(sim.netMarginAmount), 50 + (cardW + 10) * 2, doc.y, cardW, cardH)
  metricCard(doc, 'Seuil rentabilit\u00e9', `${sim.monthlyBreakeven ? formatCurrency(sim.monthlyBreakeven) : '\u2014'}`, 50 + (cardW + 10) * 3, doc.y, cardW, cardH)
  doc.y += cardH + 15

  // Second row of cards
  metricCard(doc, 'Mois pour seuil', `${sim.breakevenMonths?.toFixed(1) ?? '\u2014'}`, 50, doc.y, cardW, cardH)
  metricCard(doc, 'Rentabilit\u00e9 A1', `${sim.profitability1Y?.toFixed(1) ?? '\u2014'}%`, 50 + cardW + 10, doc.y, cardW, cardH)
  metricCard(doc, 'Rentabilit\u00e9 A2', `${sim.profitability2Y?.toFixed(1) ?? '\u2014'}%`, 50 + (cardW + 10) * 2, doc.y, cardW, cardH)
  metricCard(doc, 'Rentabilit\u00e9 A3', `${sim.profitability3Y?.toFixed(1) ?? '\u2014'}%`, 50 + (cardW + 10) * 3, doc.y, cardW, cardH)
  doc.y += cardH + 15

  // 3-year projections table
  sectionHeader(doc, 'Pr\u00e9visions sur 3 ans')
  const tableWidth = doc.page.width - 100
  simpleTable(
    doc,
    ['', 'Ann\u00e9e 1', 'Ann\u00e9e 2', 'Ann\u00e9e 3'],
    [
      ['Chiffre d\'affaires', formatCurrency(sim.year1Revenue), formatCurrency(sim.year2Revenue), formatCurrency(sim.year3Revenue)],
      ['Charges', formatCurrency(sim.year1Expenses), formatCurrency(sim.year2Expenses), formatCurrency(sim.year3Expenses)],
      ['Total charges', formatCurrency(sim.totalCharges), '', ''],
      ['Charges variables', formatCurrency(sim.variableChargesAmount), '', ''],
    ],
    [130, (tableWidth - 130) / 3, (tableWidth - 130) / 3, (tableWidth - 130) / 3],
  )

  // AI Analysis
  if (sim.aiAnalysis) {
    doc.addPage()
    drawHeader(doc, 'Analyse IA', 'Interpr\u00e9tation intelligente des r\u00e9sultats')
    doc.moveDown(0.5)
    sectionHeader(doc, 'Synth\u00e8se IA')
    bodyText(doc, sim.aiAnalysis)

    // Verdict
    doc.moveDown(0.5)
    const netMargin = sim.netMarginRate || 0
    if (netMargin >= 15) {
      infoBox(doc, 'Verdict : Le projet est rentable. La marge nette est suffisante pour assurer la viabilit\u00e9 de l\'entreprise.', 'success')
    } else if (netMargin >= 5) {
      infoBox(doc, 'Verdict : Le projet est viable mais la marge est serr\u00e9e. Optimisation des charges recommand\u00e9e.', 'info')
    } else {
      infoBox(doc, 'Verdict : Le projet pr\u00e9sente un risque de non-rentabilit\u00e9. Revoyez votre mod\u00e8le \u00e9conomique.', 'warning')
    }
  }

  addPageNumbers(doc)
  return { doc, stream }
}

// ─── PDF Generation: Financial ──────────────

async function generateFinancialPDF(beneficiaryId: string): Promise<{ doc: PDFDocument; stream: PassThrough }> {
  const { doc, stream } = createPDFDoc('Pr\u00e9visions Financi\u00e8res')
  const db = await getDb()

  const user = await db.user.findUnique({
    where: { id: beneficiaryId },
    include: {
      financialForecast: true,
      creasimSimulation: true,
      creatorJourney: true,
      marketAnalysis: true,
    },
  })

  if (!user) throw new Error('Beneficiary not found')

  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Non renseign\u00e9'
  const today = formatDate(new Date())

  // Cover
  drawCoverPage(doc, 'Pr\u00e9visions Financi\u00e8res', 'Plan financier sur 3 ans', name, today)

  // Key metrics page
  doc.addPage()
  drawHeader(doc, 'Indicateurs cl\u00e9s', 'M\u00e9triques financi\u00e8res principales')
  doc.moveDown(0.5)

  const fin = user.financialForecast
  if (!fin) {
    infoBox(doc, 'Aucune pr\u00e9vision financi\u00e8re disponible. Compl\u00e9tez le module financier pour g\u00e9n\u00e9rer ce rapport.', 'warning')
    addPageNumbers(doc)
    return { doc, stream }
  }

  // Metric cards
  const cardW = (doc.page.width - 100 - 20) / 3
  const cardH = 55

  metricCard(doc, 'Investissement', formatCurrency(fin.initialInvestment), 50, doc.y, cardW, cardH)
  metricCard(doc, 'Seuil rentabilit\u00e9', fin.breakevenMonth ? `Mois ${fin.breakevenMonth}` : '\u2014', 50 + cardW + 10, doc.y, cardW, cardH)
  metricCard(doc, 'Secteur', fin.sector || '\u2014', 50 + (cardW + 10) * 2, doc.y, cardW, cardH)
  doc.y += cardH + 15

  // Revenue vs Expenses table
  sectionHeader(doc, 'Revenus vs Charges')
  const tableWidth = doc.page.width - 100
  simpleTable(
    doc,
    ['', 'Ann\u00e9e 1', 'Ann\u00e9e 2', 'Ann\u00e9e 3'],
    [
      ['Chiffre d\'affaires', formatCurrency(fin.year1Revenue), formatCurrency(fin.year2Revenue), formatCurrency(fin.year3Revenue)],
      ['Charges totales', formatCurrency(fin.year1Expenses), formatCurrency(fin.year2Expenses), formatCurrency(fin.year3Expenses)],
      [
        'R\u00e9sultat net',
        formatCurrency((fin.year1Revenue || 0) - (fin.year1Expenses || 0)),
        formatCurrency((fin.year2Revenue || 0) - (fin.year2Expenses || 0)),
        formatCurrency((fin.year3Revenue || 0) - (fin.year3Expenses || 0)),
      ],
    ],
    [140, (tableWidth - 140) / 3, (tableWidth - 140) / 3, (tableWidth - 140) / 3],
  )

  // Profitability bars
  doc.moveDown(0.5)
  sectionHeader(doc, 'Barres de rentabilit\u00e9')

  const years = [
    { label: 'Ann\u00e9e 1', rev: fin.year1Revenue || 0, exp: fin.year1Expenses || 0 },
    { label: 'Ann\u00e9e 2', rev: fin.year2Revenue || 0, exp: fin.year2Expenses || 0 },
    { label: 'Ann\u00e9e 3', rev: fin.year3Revenue || 0, exp: fin.year3Expenses || 0 },
  ]

  const maxVal = Math.max(...years.map((y) => Math.max(y.rev, y.exp)), 1)
  let barY = doc.y + 5

  years.forEach((year) => {
    if (barY > doc.page.height - 100) {
      doc.addPage()
      barY = 60
    }

    const barW = (doc.page.width - 120) / 2
    // Revenue bar
    doc.fontSize(8).font(FONT).fillColor(COLORS.textLight)
      .text(year.label, 50, barY - 12)

    doc.roundedRect(60, barY, barW * (year.rev / maxVal), 14, 3).fill(COLORS.success)
    doc.fontSize(7).font(FONT_BOLD).fillColor(COLORS.text)
      .text(formatCurrency(year.rev), 60 + barW * (year.rev / maxVal) + 5, barY + 3)

    // Expense bar
    doc.roundedRect(60, barY + 20, barW * (year.exp / maxVal), 14, 3).fill(COLORS.danger)
    doc.fontSize(7).font(FONT_BOLD).fillColor(COLORS.text)
      .text(formatCurrency(year.exp), 60 + barW * (year.exp / maxVal) + 5, barY + 23)

    // Legend
    doc.fontSize(6).font(FONT).fillColor(COLORS.success)
      .text('\u2588 Revenus', 60 + barW + 20, barY + 2)
    doc.fillColor(COLORS.danger)
      .text('\u2588 Charges', 60 + barW + 20, barY + 22)

    barY += 55
  })
  doc.y = barY + 10

  // AI Synthesis
  if (fin.aiSynthesis) {
    doc.moveDown(0.5)
    sectionHeader(doc, 'Synth\u00e8se IA')
    bodyText(doc, fin.aiSynthesis)
  }

  // Market Analysis cross-ref
  const market = user.marketAnalysis
  if (market) {
    doc.addPage()
    drawHeader(doc, 'Analyse de march\u00e9', 'Contexte concurrentiel')
    doc.moveDown(0.5)

    if (market.sector) bodyText(doc, `Secteur : ${market.sector}`)
    if (market.marketSize) bodyText(doc, `Taille du march\u00e9 : ${market.marketSize}`)
    if (market.targetAudience) bodyText(doc, `Cible : ${market.targetAudience}`)

    if (market.opportunities) {
      sectionHeader(doc, 'Opportunit\u00e9s')
      bodyText(doc, market.opportunities)
    }
    if (market.threats) {
      sectionHeader(doc, 'Menaces')
      bodyText(doc, market.threats)
    }
    if (market.aiSynthesis) {
      sectionHeader(doc, 'Synth\u00e8se IA March\u00e9')
      bodyText(doc, market.aiSynthesis)
    }
  }

  addPageNumbers(doc)
  return { doc, stream }
}

// ─── HTTP Server ────────────────────────────

const PORT = 3099

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = req.url || '/'
  const method = req.method || 'GET'
  const query = parseQuery(url)

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  try {
    // ─── Health Check ─────────────────────
    if (url === '/health' || url === '/health/') {
      json(res, { status: 'ok', service: 'pdf-service', timestamp: new Date().toISOString() })
      return
    }

    // ─── JWT Verification for all PDF routes ──
    const token = query.token
    if (!token) {
      error(res, 'Token JWT manquant. Ajoutez ?token=<votre_jwt> \u00e0 l\'URL.', 401)
      return
    }

    let payload: { userId: string; email: string; role: string }
    try {
      payload = await verifyToken(token)
    } catch {
      error(res, 'Token JWT invalide ou expir\u00e9.', 401)
      return
    }

    // ─── Bilan PDF ────────────────────────
    if (url.startsWith('/pdf/bilan')) {
      const beneficiaryId = query.beneficiaryId || payload.userId
      const { doc, stream } = await generateBilanPDF(beneficiaryId)
      await sendPDF(res, doc, stream, `bilan-${beneficiaryId}.pdf`)
      return
    }

    // ─── Kiviat PDF ───────────────────────
    if (url.startsWith('/pdf/kiviat')) {
      const beneficiaryId = query.beneficiaryId || payload.userId
      const { doc, stream } = await generateKiviatPDF(beneficiaryId)
      await sendPDF(res, doc, stream, `kiviat-${beneficiaryId}.pdf`)
      return
    }

    // ─── Tremplin PDF ─────────────────────
    if (url.startsWith('/pdf/tremplin')) {
      const beneficiaryId = query.beneficiaryId || payload.userId
      const { doc, stream } = await generateTremplinPDF(beneficiaryId)
      await sendPDF(res, doc, stream, `tremplin-${beneficiaryId}.pdf`)
      return
    }

    // ─── CreaScope PDF ────────────────────
    if (url.startsWith('/pdf/creascope')) {
      const sessionId = query.sessionId
      if (!sessionId) {
        error(res, 'sessionId requis. Ajoutez ?sessionId=<id_session> \u00e0 l\'URL.', 400)
        return
      }
      const { doc, stream } = await generateCreaScopePDF(sessionId)
      await sendPDF(res, doc, stream, `creascope-${sessionId}.pdf`)
      return
    }

    // ─── CreaSim PDF ─────────────────────
    if (url.startsWith('/pdf/creasim')) {
      const beneficiaryId = query.beneficiaryId || payload.userId
      const { doc, stream } = await generateCreaSimPDF(beneficiaryId)
      await sendPDF(res, doc, stream, `creasim-${beneficiaryId}.pdf`)
      return
    }

    // ─── Financial PDF ───────────────────
    if (url.startsWith('/pdf/financial')) {
      const beneficiaryId = query.beneficiaryId || payload.userId
      const { doc, stream } = await generateFinancialPDF(beneficiaryId)
      await sendPDF(res, doc, stream, `financial-${beneficiaryId}.pdf`)
      return
    }

    // ─── 404 ──────────────────────────────
    error(res, `Route non trouv\u00e9e: ${url}`, 404)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur'
    console.error(`[PDF Service] Error: ${message}`)
    if (message.includes('not found')) {
      error(res, message, 404)
    } else {
      error(res, message, 500)
    }
  }
})

server.listen(PORT, () => {
  console.log(`[PDF Service] Running on port ${PORT}`)
  console.log(`[PDF Service] Endpoints:`)
  console.log(`  GET /health`)
  console.log(`  GET /pdf/bilan?token=<jwt>&beneficiaryId=<id>`)
  console.log(`  GET /pdf/kiviat?token=<jwt>&beneficiaryId=<id>`)
  console.log(`  GET /pdf/tremplin?token=<jwt>&beneficiaryId=<id>`)
  console.log(`  GET /pdf/creascope?token=<jwt>&sessionId=<id>`)
  console.log(`  GET /pdf/creasim?token=<jwt>&beneficiaryId=<id>`)
  console.log(`  GET /pdf/financial?token=<jwt>&beneficiaryId=<id>`)
})
