// ============================================
// CreaPulse V2 — Logout Endpoint
// POST /api/auth/logout
// Revokes the current access token (via JTI blocklist)
// and clears both session + refresh cookies.
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, revokeAccessToken } from '@/lib/auth'
import { success, Errors, handleApiError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    // 1. Read session cookie
    const sessionToken = request.cookies.get('session')?.value

    // 2. If token exists, verify and revoke its JTI
    if (sessionToken) {
      try {
        const payload = await verifyToken(sessionToken)
        if (payload.jti && payload.exp) {
          revokeAccessToken(payload.jti, payload.exp)
        }
      } catch {
        // Token is already invalid/expired — that's fine, still clear cookies
      }
    }

    // Also try to revoke the refresh token if present
    const refreshToken = request.cookies.get('refresh')?.value
    if (refreshToken) {
      try {
        const { verifyRefreshToken } = await import('@/lib/auth')
        const refreshPayload = await verifyRefreshToken(refreshToken)
        if (refreshPayload.jti && refreshPayload.exp) {
          revokeAccessToken(refreshPayload.jti, refreshPayload.exp)
        }
      } catch {
        // Refresh token invalid — fine, just clear the cookie
      }
    }

    // 3. Clear both cookies
    const response = success({ message: 'Déconnexion réussie' })

    response.cookies.set('session', '', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
    })

    response.cookies.set('refresh', '', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
    })

    return response
  } catch (err) {
    return handleApiError(err)
  }
}
