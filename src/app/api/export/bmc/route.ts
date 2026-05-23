// ============================================
// CreaPulse V2 — BMC PDF Export API
// GET /api/export/bmc — Returns print-to-PDF HTML page
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'

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

// ─── BMC block definitions ──────────────────

interface BmcBlock {
  key: string
  label: string
  content: string
  color: string
  icon: string
}

const BMC_BLOCK_ORDER: { key: string; label: string; color: string; icon: string }[] = [
  { key: 'partenairesCles', label: 'Partenaires Clés', color: '#00838F', icon: '🤝' },
  { key: 'activitesCles', label: 'Activités Clés', color: '#00838F', icon: '⚙️' },
  { key: 'ressourcesCles', label: 'Ressources Clés', color: '#00838F', icon: '📦' },
  { key: 'propositionValeur', label: 'Proposition de Valeur', color: '#FF8F00', icon: '💡' },
  { key: 'relationsClients', label: 'Relations Clients', color: '#00838F', icon: '💝' },
  { key: 'canaux', label: 'Canaux', color: '#00838F', icon: '📣' },
  { key: 'segmentsClients', label: 'Segments Clients', color: '#00838F', icon: '👥' },
  { key: 'structureCouts', label: 'Structure des Coûts', color: '#FF6B35', icon: '💸' },
  { key: 'sourcesRevenus', label: 'Sources de Revenus', color: '#FF6B35', icon: '💰' },
]

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatContent(content: string): string {
  if (!content) return '<span style="color:#999;font-style:italic;">Non renseigné</span>'
  const escaped = escapeHtml(content)
  // Convert bullet points (- item) to styled list
  const formatted = escaped
    .replace(/^[-•]\s+(.+)$/gm, '<li style="margin-left:16px;margin-bottom:2px;">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
  return formatted
}

// ─── GET: Generate print-to-PDF HTML ────────

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) {
      return Errors.unauthorized()
    }

    // Fetch BMC data
    const bmc = await db.businessModelCanvas.findUnique({
      where: { userId: payload.userId },
    })

    // Fetch project info for header
    const journey = await db.creatorJourney.findUnique({
      where: { userId: payload.userId },
      select: {
        projectTitle: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    const projectTitle = journey?.projectTitle || 'Mon Projet'
    const userName = journey?.user
      ? `${journey.user.firstName || ''} ${journey.user.lastName || ''}`.trim()
      : 'Entrepreneur'

    // Build blocks data
    const blocks: BmcBlock[] = BMC_BLOCK_ORDER.map(def => ({
      key: def.key,
      label: def.label,
      content: (bmc as Record<string, string | null | undefined> | null)?.[def.key] || '',
      color: def.color,
      icon: def.icon,
    }))

    const filledCount = blocks.filter(b => b.content && b.content.trim().length > 0).length
    const generationDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Build the HTML page designed for print
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Business Model Canvas — ${escapeHtml(projectTitle)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #fff;
      color: #1a1a2e;
      padding: 0;
      line-height: 1.5;
    }

    @page {
      size: A4 landscape;
      margin: 12mm;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      .bmc-page { box-shadow: none !important; border: none !important; }
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%);
      color: #fff;
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-logo {
      font-size: 22px;
      font-weight: 700;
      color: #4FB3BF;
      letter-spacing: -0.5px;
    }

    .header-logo span {
      color: #fff;
      font-weight: 300;
    }

    .header-partner {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      border-left: 1px solid rgba(255,255,255,0.2);
      padding-left: 12px;
    }

    .header-right {
      text-align: right;
    }

    .header-project {
      font-size: 16px;
      font-weight: 600;
    }

    .header-meta {
      font-size: 11px;
      color: rgba(255,255,255,0.6);
      margin-top: 2px;
    }

    /* ── Title Bar ── */
    .title-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding: 0 4px;
    }

    .title-bar h1 {
      font-size: 20px;
      font-weight: 700;
      color: #1A1A2E;
    }

    .title-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: rgba(0,131,143,0.08);
      color: #00838F;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    /* ── BMC Grid ── */
    .bmc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: auto auto auto;
      gap: 8px;
      min-height: 70vh;
    }

    .bmc-block {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #fff;
    }

    .bmc-block.full-width {
      grid-column: 1 / -1;
    }

    .bmc-block.half-width {
      grid-column: span 1;
    }

    .bmc-block-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #fff;
    }

    .bmc-block-header .icon {
      font-size: 14px;
    }

    .bmc-block-content {
      padding: 10px 14px;
      font-size: 11px;
      line-height: 1.6;
      color: #334155;
      flex: 1;
      overflow: hidden;
    }

    .bmc-block-content ul {
      list-style: none;
      padding: 0;
    }

    /* ── Footer ── */
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 20px;
      padding: 10px 0;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
    }

    .footer-brand {
      font-weight: 600;
      color: #00838F;
    }

    /* ── Print button (screen only) ── */
    .print-btn-container {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .print-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 32px;
      background: linear-gradient(135deg, #00838F, #006064);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 4px 14px rgba(0,131,143,0.3);
    }

    .print-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0,131,143,0.4);
    }
  </style>
</head>
<body>
  <div class="bmc-page" style="max-width:1120px;margin:20px auto;padding:24px;">

    <!-- Print button -->
    <div class="print-btn-container no-print">
      <button class="print-btn" onclick="window.print()">
        🖨️  Imprimer / Enregistrer en PDF
      </button>
    </div>

    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="header-logo">CreaPulse<span> V2</span></div>
        <div class="header-partner">en partenariat avec GIDEF</div>
      </div>
      <div class="header-right">
        <div class="header-project">${escapeHtml(projectTitle)}</div>
        <div class="header-meta">${escapeHtml(userName)} · ${generationDate}</div>
      </div>
    </div>

    <!-- Title Bar -->
    <div class="title-bar">
      <h1>Business Model Canvas</h1>
      <div class="title-badge">${filledCount}/9 blocs remplis</div>
    </div>

    <!-- BMC Grid -->
    <div class="bmc-grid">
      ${blocks.map((block, i) => {
        // Layout: Row 1 (0,1,2), Row 2 (3 full), Row 3 (4,5,6), Row 4 (7,8)
        let gridClass = ''
        if (i === 3) gridClass = 'full-width'
        else if (i >= 7) gridClass = 'half-width'

        return `
      <div class="bmc-block ${gridClass}">
        <div class="bmc-block-header" style="background:${block.color};">
          <span class="icon">${block.icon}</span>
          ${block.label}
        </div>
        <div class="bmc-block-content">
          ${formatContent(block.content)}
        </div>
      </div>`
      }).join('\n')}
    </div>

    <!-- Footer -->
    <div class="footer">
      <span><span class="footer-brand">CreaPulse V2</span> — Bureau Virtuel pour Entrepreneurs</span>
      <span>Document généré le ${generationDate}</span>
    </div>

  </div>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
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
