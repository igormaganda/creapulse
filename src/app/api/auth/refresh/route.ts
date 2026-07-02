// ============================================
// CreaPulse V2 — Refresh Token Endpoint
// POST /api/auth/refresh
// Accepts refresh token from httpOnly cookie, rotates it,
// and issues a new access token + refresh token pair.
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAccessToken, createRefreshToken, verifyRefreshToken, revokeAccessToken } from '@/lib/auth'
import { success, Errors, handleApiError } from '@/lib/api-response'

// ─── Rate limiting (in-memory, 5 refreshes/minute per IP) ───
const refreshRateLimit = new Map<string, { count: number; resetAt: number }>()
function checkRefreshRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = refreshRateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    refreshRateLimit.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  entry.count++
  return entry.count <= 5
}
function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    // 1. Read refresh token from httpOnly cookie
    const refreshTokenStr = request.cookies.get('refresh')?.value

    if (!refreshTokenStr) {
      return Errors.unauthorized('Refresh token manquant')
    }

    // Rate limiting
    const clientIp = getClientIp(request)
    if (!checkRefreshRateLimit(clientIp)) {
      return Errors.tooManyRequests('Trop de tentatives de rafraîchissement')
    }

    // 2. Verify it's a valid refresh token (checks type, expiry, and blocklist)
    let payload
    try {
      payload = await verifyRefreshToken(refreshTokenStr)
    } catch {
      // Clear both cookies if refresh token is invalid
      const response = Errors.unauthorized('Refresh token invalide ou expiré')
      response.cookies.set('session', '', { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0 })
      response.cookies.set('refresh', '', { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0 })
      return response
    }

    // 3. Verify the user still exists and is active
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true, email: true, role: true, tenantId: true },
    })

    if (!user || !user.isActive) {
      return Errors.unauthorized('Utilisateur introuvable ou inactif')
    }

    // 4. Revoke the old refresh token (rotation)
    if (payload.jti && payload.exp) {
      revokeAccessToken(payload.jti, payload.exp)
    }

    // 5. Create new access token + new refresh token
    const [newAccessToken, newRefreshToken] = await Promise.all([
      createAccessToken({
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
      }),
      createRefreshToken({
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
      }),
    ])

    // 6. Set both as httpOnly cookies
    const response = success({ message: 'Tokens refreshed' })

    response.cookies.set('session', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    response.cookies.set('refresh', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (err) {
    return handleApiError(err)
  }
}
