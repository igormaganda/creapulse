// ============================================
// CreaPulse V2 — PDF Proxy Utility
// Proxies PDF generation to standalone mini-service
// (pdfkit's __dirname breaks in Turbopack)
// ============================================

import { NextRequest } from 'next/server'
import { getTokenFromHeader, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'

const PDF_SERVICE = 'http://127.0.0.1:3099'

export async function proxyToPdfService(
  request: NextRequest,
  pdfPath: string, // e.g. '/pdf/bilan'
): Promise<Response> {
  try {
    // ── Authentication ──
    let token = request.cookies.get('session')?.value
    if (!token) token = getTokenFromHeader(request)
    if (!token) return Errors.unauthorized()

    try {
      await verifyToken(token)
    } catch (err) {
      if (err instanceof AuthError) return Errors.unauthorized(err.message)
      throw err
    }

    // ── Build proxy URL ──
    const url = new URL(request.url)
    const params = new URLSearchParams()
    params.set('token', token)

    // Forward specific query params
    const beneficiaryId = url.searchParams.get('beneficiaryId')
    if (beneficiaryId) params.set('beneficiaryId', beneficiaryId)

    const sessionId = url.searchParams.get('sessionId')
    if (sessionId) params.set('sessionId', sessionId)

    // ── Fetch from PDF service ──
    const proxyUrl = `${PDF_SERVICE}${pdfPath}?${params.toString()}`
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(60000) })

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error')
      return new Response(errorText, { status: res.status, headers: { 'Content-Type': 'application/json' } })
    }

    const pdfBuffer = await res.arrayBuffer()

    // ── Return PDF ──
    const contentDisposition = res.headers.get('content-disposition') ||
      `attachment; filename="${pdfPath.split('/').pop()}.pdf"`

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
