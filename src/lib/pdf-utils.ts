// ============================================
// CreaPulse V2 — PDF Generation Utilities
// Wraps PDFKit with branded templates and helpers
// All labels in French
//
// ⚠️  VERCEL COMPATIBILITY NOTE:
// PDFKit uses fs internally for font loading. Default fonts (Helvetica, Courier,
// Times-Roman) are embedded in the library and work without filesystem.
// If you add custom fonts, they MUST be loaded from a URL or embedded as base64.
// For production Vercel deployments, consider moving PDF generation to an
// external micro-service (Railway/Fly.io) and routing via pdf-proxy.ts.
// ============================================

import PDFDocument from 'pdfkit'

// ─── Fix PDFKit font path resolution in Turbopack (self-hosted only) ──
// This patch is ONLY needed in the Turbopack sandbox where __dirname resolves
// to /ROOT/. On Vercel serverless, paths are correct by default.
const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME

if (!IS_SERVERLESS) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path')

    const _readFileSyncOriginal = fs.readFileSync.bind(fs)
    const _projectRoot = path.dirname(path.dirname(path.dirname(new URL(import.meta.url).pathname)))

    const _PDF_UTILS_PATCHED = Symbol.for('creapulse:fs-patch-applied')

    if (!(fs[_PDF_UTILS_PATCHED])) {
      fs[_PDF_UTILS_PATCHED] = true

      function patchedReadFileSync(filePath, ...args) {
        if (typeof filePath === 'string' && filePath.startsWith('/ROOT/')) {
          const corrected = filePath.replace(/^\/ROOT/, _projectRoot)
          return _readFileSyncOriginal(corrected, ...args)
        }
        return _readFileSyncOriginal(filePath, ...args)
      }

      fs.readFileSync = patchedReadFileSync
      console.warn('[pdf-utils] Patched fs.readFileSync to redirect /ROOT/ paths to project root')
    }
  } catch {
    // fs not available — skip patch, PDFKit default fonts will work
  }
}

// ─── Constants ─────────────────────────────────

export const COLORS = {
  primary: '#00838F',
  dark: '#1a1a1a',
  gray: '#666666',
  lightGray: '#f0f0f0',
  white: '#FFFFFF',
  success: '#2E7D32',
  warning: '#F57F17',
  danger: '#C62828',
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_TOP = 50
const MARGIN_BOTTOM = 50
const MARGIN_LEFT = 50
const MARGIN_RIGHT = 50
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const HEADER_HEIGHT = 40
const FOOTER_HEIGHT = 40

// ─── PDF Generation Helper ────────────────────

/**
 * Collect a PDFDocument into a Buffer.
 * Calls the provided `buildFn(doc)` synchronously, then waits for all data chunks.
 */
export function generatePdfBuffer(
  buildFn: (doc: PDFDocument) => void,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
      bufferPages: true,
    })

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Setup page events
    let pageCount = 0

    doc.on('pageAdded', () => {
      pageCount++
      // Don't draw header/footer on the very first page (buildFn handles cover)
      if (pageCount > 1) {
        drawPageHeader(doc)
      }
    })

    buildFn(doc)
    doc.end()
  })
}

// ─── Page Header / Footer ─────────────────────

function drawPageHeader(doc: PDFDocument): void {
  // Teal bar at top
  doc
    .save()
    .rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT)
    .fill(COLORS.primary)

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.white)
    .text('CreaPulse V2', MARGIN_LEFT, 14, { width: CONTENT_WIDTH, align: 'left' })

  doc.restore()
}

export function drawFooter(doc: PDFDocument, pageNum: number): void {
  const y = PAGE_HEIGHT - MARGIN_BOTTOM + 10

  // Thin line
  doc
    .save()
    .moveTo(MARGIN_LEFT, y - 5)
    .lineTo(PAGE_WIDTH - MARGIN_RIGHT, y - 5)
    .strokeColor(COLORS.lightGray)
    .lineWidth(0.5)
    .stroke()

  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(COLORS.gray)
    .text(
      'CreaPulse V2 — GIDEF Île-de-France — Document confidentiel',
      MARGIN_LEFT,
      y,
      { width: CONTENT_WIDTH - 60, align: 'left' },
    )

  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(COLORS.gray)
    .text(`Page ${pageNum}`, PAGE_WIDTH - MARGIN_RIGHT - 50, y, {
      width: 50,
      align: 'right',
    })

  doc.restore()
}

// ─── Cover Page ───────────────────────────────

export function drawCoverPage(
  doc: PDFDocument,
  title: string,
  subtitle: string,
  beneficiaryName: string,
): void {
  // Full teal background top section
  doc
    .save()
    .rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT * 0.45)
    .fill(COLORS.primary)

  // GIDEF logo placeholder (orange badge)
  const logoX = PAGE_WIDTH / 2
  const logoY = 80
  const logoW = 100
  const logoH = 28
  doc
    .roundedRect(logoX - logoW / 2, logoY - logoH / 2, logoW, logoH, 4)
    .fill('#FF6B35')
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.white)
    .text('GIDEF', logoX - logoW / 2, logoY - 6, {
      width: logoW,
      align: 'center',
      lineBreak: false,
    })

  // CreaPulse branding under logo
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('rgba(255,255,255,0.7)')
    .text('Île-de-France', logoX - logoW / 2, logoY + 6, {
      width: logoW,
      align: 'center',
      lineBreak: false,
    })

  // Title
  doc
    .font('Helvetica-Bold')
    .fontSize(28)
    .fillColor(COLORS.white)
    .text(title, MARGIN_LEFT, 160, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  // Subtitle
  doc
    .font('Helvetica')
    .fontSize(14)
    .fillColor(COLORS.white)
    .text(subtitle, MARGIN_LEFT, 210, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  doc.restore()

  // Beneficiary info below the teal section
  const infoY = PAGE_HEIGHT * 0.45 + 60

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(COLORS.primary)
    .text('Bénéficiaire', MARGIN_LEFT, infoY, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  doc
    .font('Helvetica')
    .fontSize(16)
    .fillColor(COLORS.dark)
    .text(beneficiaryName, MARGIN_LEFT, infoY + 22, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  // Date
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(COLORS.gray)
    .text(`Date : ${today}`, MARGIN_LEFT, infoY + 60, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  // Confidentiality notice
  doc
    .font('Helvetica-Oblique')
    .fontSize(8)
    .fillColor(COLORS.gray)
    .text(
      'Ce document est confidentiel et destiné exclusivement au bénéficiaire et à son conseiller.',
      MARGIN_LEFT,
      PAGE_HEIGHT - 120,
      { width: CONTENT_WIDTH, align: 'center' },
    )

  // Add new page for content
  doc.addPage()
}

// ─── Section Headers ──────────────────────────

export function addSectionHeader(doc: PDFDocument, title: string, y?: number): number {
  const startY = y ?? doc.y

  // Teal left accent bar
  doc
    .save()
    .rect(MARGIN_LEFT, startY, 4, 20)
    .fill(COLORS.primary)

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(COLORS.primary)
    .text(title, MARGIN_LEFT + 12, startY + 2)

  doc.restore()

  return startY + 30
}

// ─── Sub-Section Headers ──────────────────────

export function addSubSectionHeader(doc: PDFDocument, title: string, y?: number): number {
  const startY = y ?? doc.y

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORS.dark)
    .text(title, MARGIN_LEFT, startY)

  return doc.y + 4
}

// ─── Simple Table ─────────────────────────────

export interface TableColumn {
  header: string
  width: number
  align?: 'left' | 'center' | 'right'
}

export interface TableRow {
  cells: string[]
  fillColor?: string
  textColor?: string
}

/**
 * Draw a simple table. Returns the Y position after the table.
 */
export function addTable(
  doc: PDFDocument,
  columns: TableColumn[],
  rows: TableRow[],
  y?: number,
): number {
  let currentY = y ?? doc.y
  const startX = MARGIN_LEFT
  const rowHeight = 22
  const headerHeight = 26
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0)

  // Check if we need a new page for at least header + 2 rows
  if (currentY + headerHeight + rowHeight * 2 > PAGE_HEIGHT - MARGIN_BOTTOM) {
    doc.addPage()
    currentY = MARGIN_TOP + 10
  }

  // Draw header row
  doc.save()
  doc.rect(startX, currentY, totalWidth, headerHeight).fill(COLORS.primary)

  let cellX = startX
  for (const col of columns) {
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(COLORS.white)
      .text(col.header, cellX + 4, currentY + 8, {
        width: col.width - 8,
        align: col.align ?? 'left',
        lineBreak: false,
      })
    cellX += col.width
  }
  doc.restore()

  currentY += headerHeight

  // Draw data rows
  for (const row of rows) {
    if (currentY + rowHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage()
      currentY = MARGIN_TOP + 10
    }

    // Alternate row background
    const rowIdx = rows.indexOf(row)
    if (row.fillColor) {
      doc.rect(startX, currentY, totalWidth, rowHeight).fill(row.fillColor)
    } else if (rowIdx % 2 === 1) {
      doc.rect(startX, currentY, totalWidth, rowHeight).fill(COLORS.lightGray)
    }

    // Cell borders
    doc
      .save()
      .rect(startX, currentY, totalWidth, rowHeight)
      .strokeColor('#DDDDDD')
      .lineWidth(0.5)
      .stroke()

    cellX = startX
    for (const col of columns) {
      doc
        .moveTo(cellX, currentY)
        .lineTo(cellX, currentY + rowHeight)
        .strokeColor('#DDDDDD')
        .lineWidth(0.3)
        .stroke()
      cellX += col.width
    }
    doc.restore()

    // Cell text
    cellX = startX
    const cellColor = row.textColor ?? COLORS.dark
    for (let i = 0; i < columns.length && i < row.cells.length; i++) {
      const col = columns[i]
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(cellColor)
        .text(row.cells[i], cellX + 4, currentY + 6, {
          width: col.width - 8,
          align: col.align ?? 'left',
          lineBreak: false,
        })
      cellX += col.width
    }

    currentY += rowHeight
  }

  return currentY + 10
}

// ─── Key-Value Data Block ──────────────────────

export function addKeyValueBlock(
  doc: PDFDocument,
  data: Array<{ key: string; value: string }>,
  y?: number,
): number {
  let currentY = y ?? doc.y
  const labelWidth = 160
  const rowHeight = 20

  for (const item of data) {
    if (currentY + rowHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage()
      currentY = MARGIN_TOP + 10
    }

    // Key (label)
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(COLORS.gray)
      .text(item.key, MARGIN_LEFT, currentY, {
        width: labelWidth,
        lineBreak: false,
      })

    // Value
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.dark)
      .text(item.value, MARGIN_LEFT + labelWidth, currentY, {
        width: CONTENT_WIDTH - labelWidth,
        lineBreak: false,
      })

    currentY += rowHeight
  }

  return currentY + 8
}

// ─── Text Paragraph Wrapping ─────────────────

/**
 * Add a wrapped paragraph. Returns the Y position after the text.
 */
export function addParagraph(
  doc: PDFDocument,
  text: string,
  y?: number,
  options?: { fontSize?: number; color?: string; indent?: number },
): number {
  const startY = y ?? doc.y
  const fontSize = options?.fontSize ?? 9
  const color = options?.color ?? COLORS.dark
  const indent = options?.indent ?? 0

  doc
    .font('Helvetica')
    .fontSize(fontSize)
    .fillColor(color)
    .text(text, MARGIN_LEFT + indent, startY, {
      width: CONTENT_WIDTH - indent,
      align: 'left',
      lineGap: 3,
    })

  return doc.y + 8
}

/**
 * Add a bullet point paragraph. Returns the Y position after the text.
 */
export function addBullet(
  doc: PDFDocument,
  text: string,
  y?: number,
): number {
  let startY = y ?? doc.y

  if (startY + 18 > PAGE_HEIGHT - MARGIN_BOTTOM) {
    doc.addPage()
    startY = doc.y
  }

  const bulletY = startY

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.primary)
    .text('•', MARGIN_LEFT, bulletY, {
      continued: false,
      width: 12,
      lineBreak: false,
    })

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.dark)
    .text(text, MARGIN_LEFT + 14, bulletY, {
      width: CONTENT_WIDTH - 14,
      lineGap: 2,
    })

  return doc.y + 4
}

// ─── Score Bar (visual text chars) ────────────

/**
 * Returns a text-based progress bar string like [██████░░░░] 6.0/10
 */
export function scoreBar(score: number, maxScore: number = 10, barWidth: number = 15): string {
  const ratio = Math.max(0, Math.min(1, score / maxScore))
  const filled = Math.round(ratio * barWidth)
  const empty = barWidth - filled
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${score.toFixed(1)}/${maxScore}`
}

// ─── Badge for Decision ───────────────────────

export function addDecisionBadge(doc: PDFDocument, decision: string, y?: number): number {
  const startY = y ?? doc.y
  let bgColor = COLORS.gray
  let label = decision

  switch (decision) {
    case 'GO':
      bgColor = COLORS.success
      label = '✓ GO'
      break
    case 'GO_CONDITIONAL':
      bgColor = COLORS.warning
      label = '⚠ GO CONDITIONNEL'
      break
    case 'NO_GO':
      bgColor = COLORS.danger
      label = '✗ NO GO'
      break
    case 'PENDING':
      bgColor = COLORS.gray
      label = 'EN ATTENTE'
      break
    default:
      label = decision
  }

  const badgeWidth = doc.font('Helvetica-Bold').fontSize(12).widthOfString(label) + 24

  doc
    .save()
    .roundedRect(MARGIN_LEFT + (CONTENT_WIDTH - badgeWidth) / 2, startY, badgeWidth, 28, 4)
    .fill(bgColor)

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.white)
    .text(
      label,
      MARGIN_LEFT + (CONTENT_WIDTH - badgeWidth) / 2 + 12,
      startY + 7,
      { width: badgeWidth - 24, align: 'center' },
    )

  doc.restore()

  return startY + 44
}

// ─── Spacing Helpers ──────────────────────────

export function addSpacing(doc: PDFDocument, points: number): void {
  doc.y += points
}

export function checkNewPage(doc: PDFDocument, neededHeight: number): void {
  if (doc.y + neededHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
    doc.addPage()
  }
}

// ─── Utility: Format Currency ──────────────────

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toFixed(1)} %`
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─── Utility: Paginate and finalize ──────────

/**
 * After building all content, iterate buffered pages to add footers.
 * Must be called BEFORE doc.end() when using bufferPages: true.
 * Instead, we use a post-processing approach: generate with bufferPages,
 * then manually add footers to each page.
 */
export function finalizeWithFooters(doc: PDFDocument): void {
  const pages = doc.bufferedPageRange()
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i)
    // Skip cover page (page 0)
    if (i > 0) {
      drawFooter(doc, i)
    }
  }
}
