// ============================================
// CreaPulse V2 — Pitch Deck PPTX Export API
// GET /api/export/pitch-deck — Generates .pptx file
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import PptxGenJS from 'pptxgenjs'
import { getEnrollmentIdFromRequest, buildCompositeKey } from '@/lib/enrollment-context'

// ─── Auth helper ─────────────────────────────

async function authenticate(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const authHeader = request.headers.get('authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
  if (!token) return null
  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}

// ─── Slide definitions ──────────────────────

interface SlideDef {
  key: string
  title: string
  color: string
  icon: string
}

const SLIDE_DEFS: SlideDef[] = [
  { key: 'probleme', title: 'Problème', color: 'EF4444', icon: '⚠️' },
  { key: 'solution', title: 'Solution', color: 'F59E0B', icon: '💡' },
  { key: 'marche', title: 'Marché', color: '00838F', icon: '📈' },
  { key: 'businessModel', title: 'Business Model', color: '22C55E', icon: '💰' },
  { key: 'traction', title: 'Traction', color: '8B5CF6', icon: '🎯' },
  { key: 'equipe', title: 'Équipe', color: '0EA5E9', icon: '👥' },
  { key: 'financier', title: 'Financier', color: 'FF6B35', icon: '📊' },
  { key: 'ask', title: 'Ask', color: 'EC4899', icon: '✨' },
]

const TEAL = '00838F'
const TEAL_DARK = '006064'
const DARK_BG = '1A1A2E'
const WHITE = 'FFFFFF'
const LIGHT_GRAY = 'F1F5F9'
const TEXT_DARK = '1E293B'
const TEXT_MUTED = '64748B'

// ─── Content formatting ─────────────────────

function formatTextForPptx(text: string): string[] {
  if (!text) return ['Non renseigné']
  // Split into paragraphs, limit each to reasonable length for slide readability
  const paragraphs = text.split('\n').filter(p => p.trim().length > 0)
  // Limit to ~8 lines for readability
  return paragraphs.slice(0, 8).map(p => p.trim().replace(/^[-•]\s+/, '• '))
}

// ─── GET: Generate PPTX ─────────────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized()
    }
    const enrollmentId = getEnrollmentIdFromRequest(request)

    // Fetch pitch deck data from ZeroDraft
    const draft = await db.zeroDraft.findUnique({
      where: { userId_enrollmentId: buildCompositeKey(payload.userId, enrollmentId) },
    })

    // Fetch project info
    const journey = await db.creatorJourney.findUnique({
      where: { userId_enrollmentId: buildCompositeKey(payload.userId, enrollmentId) },
      select: {
        projectTitle: true,
        projectDescription: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    const projectTitle = journey?.projectTitle || draft?.projectTitle || 'Mon Pitch Deck'
    const projectDescription = journey?.projectDescription || ''
    const userName = journey?.user
      ? `${journey.user.firstName || ''} ${journey.user.lastName || ''}`.trim()
      : 'Entrepreneur'

    // Parse slides from ZeroDraft content
    let slideData: Record<string, string> = {}
    if (draft?.content) {
      try {
        const parsed = JSON.parse(draft.content) as {
          slides?: Array<{ id: string; content?: string; title?: string }>
        }
        if (parsed.slides) {
          for (const s of parsed.slides) {
            if (s.content) {
              slideData[s.id] = s.content
            }
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    // Also check for direct content mapping (legacy format)
    if (Object.keys(slideData).length === 0 && draft?.content) {
      try {
        const parsed = JSON.parse(draft.content)
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          slideData = parsed as Record<string, string>
        }
      } catch {
        // ignore
      }
    }

    // ── Build PPTX ──
    const pptx = new PptxGenJS()
    pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 inches (16:9)
    pptx.author = 'CreaPulse V2'
    pptx.subject = projectTitle
    pptx.title = `Pitch Deck — ${projectTitle}`

    // ── Slide 1: Title Slide ──
    const titleSlide = pptx.addSlide()
    // Dark background
    titleSlide.background = { color: DARK_BG }
    // Teal accent bar at top
    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.08,
      fill: { color: TEAL },
    })
    // Teal accent bar at bottom
    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 7.42, w: '100%', h: 0.08,
      fill: { color: TEAL },
    })
    // Left accent bar
    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 0.8, y: 1.8, w: 0.06, h: 1.2,
      fill: { color: TEAL },
    })
    // Project title
    titleSlide.addText(projectTitle, {
      x: 1.1, y: 1.8, w: 8, h: 1.2,
      fontSize: 36,
      fontFace: 'Arial',
      color: WHITE,
      bold: true,
      valign: 'middle',
    })
    // Subtitle / description (truncated)
    if (projectDescription) {
      const desc = projectDescription.length > 120
        ? projectDescription.substring(0, 120) + '...'
        : projectDescription
      titleSlide.addText(desc, {
        x: 1.1, y: 3.1, w: 8, h: 0.6,
        fontSize: 14,
        fontFace: 'Arial',
        color: '94A3B8',
        valign: 'top',
      })
    }
    // Author
    titleSlide.addText(`Présenté par ${userName}`, {
      x: 1.1, y: 4.0, w: 6, h: 0.5,
      fontSize: 13,
      fontFace: 'Arial',
      color: '94A3B8',
    })
    // Branding bottom-right
    titleSlide.addText('CreaPulse V2 × GIDEF', {
      x: 8.5, y: 6.5, w: 4, h: 0.5,
      fontSize: 11,
      fontFace: 'Arial',
      color: '4FB3BF',
      align: 'right',
    })

    // ── Slides 2-9: Content slides ──
    for (const def of SLIDE_DEFS) {
      const content = slideData[def.key] || slideData['probleme'] === undefined && Object.keys(slideData).length > 0
        ? slideData[def.key] || ''
        : ''
      const lines = formatTextForPptx(content)

      const slide = pptx.addSlide()
      slide.background = { color: WHITE }

      // Top color bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: 0.06,
        fill: { color: def.color },
      })

      // Slide number indicator (top right)
      const slideIndex = SLIDE_DEFS.indexOf(def) + 1
      slide.addText(`${slideIndex} / ${SLIDE_DEFS.length}`, {
        x: 11, y: 0.2, w: 2, h: 0.4,
        fontSize: 10,
        fontFace: 'Arial',
        color: TEXT_MUTED,
        align: 'right',
      })

      // Title area
      slide.addText(def.title, {
        x: 0.8, y: 0.4, w: 8, h: 0.7,
        fontSize: 26,
        fontFace: 'Arial',
        color: def.color,
        bold: true,
        valign: 'middle',
      })

      // Separator line under title
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: 1.15, w: 1.5, h: 0.03,
        fill: { color: def.color },
      })

      // Content area
      const contentText = lines.join('\n')
      slide.addText(contentText, {
        x: 0.8, y: 1.4, w: 11.7, h: 5.2,
        fontSize: 14,
        fontFace: 'Arial',
        color: TEXT_DARK,
        lineSpacing: 22,
        valign: 'top',
        shrinkText: true,
        paraSpaceAfter: 8,
      })

      // Branding footer
      slide.addText('CreaPulse V2 — Bureau Virtuel', {
        x: 0.8, y: 6.9, w: 6, h: 0.35,
        fontSize: 8,
        fontFace: 'Arial',
        color: TEXT_MUTED,
      })

      // Project name footer right
      slide.addText(projectTitle, {
        x: 8, y: 6.9, w: 4.5, h: 0.35,
        fontSize: 8,
        fontFace: 'Arial',
        color: TEXT_MUTED,
        align: 'right',
      })
    }

    // ── Generate the file ──
    const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer

    const safeProjectName = projectTitle
      .replace(/[^a-zA-Z0-9À-ÿ\s-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="pitch-deck-${safeProjectName}.pptx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée')
      }
    }
    return handleApiError(err)
  }
}
