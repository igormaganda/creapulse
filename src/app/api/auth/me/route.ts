// ============================================
// CreaPulse V2 — Get Current User Endpoint
// GET /api/auth/me
// Returns authenticated user profile with role-specific data
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, checkRole, createClearSessionCookie, revokeAccessToken } from '@/lib/auth'
import type { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // 1. Extract token — try cookie first, then Authorization header
    const cookieToken = request.cookies.get('session')?.value
    const headerToken = getTokenFromHeader(request)
    const token = cookieToken || headerToken

    if (!token) {
      return Errors.unauthorized('No session token found')
    }

    // 2. Verify token
    const payload = await verifyToken(token)

    // 3. Fetch user with role-specific data
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        // Role-specific data
        counselorProfile: {
          select: {
            id: true,
            name: true,
            specialities: true,
            certifications: true,
            maxBeneficiaries: true,
            isAvailable: true,
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
                city: true,
              },
            },
          },
        },
        beneficiaryProfile: {
          select: {
            id: true,
            progressScore: true,
            employmentStatus: true,
            educationLevel: true,
            hasDisability: true,
            organization: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        },
        creatorJourney: {
          select: {
            currentPhase: true,
            progressPercent: true,
            projectTitle: true,
            bpStatus: true,
            status: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            primaryColor: true,
            logoUrl: true,
          },
        },
        _count: {
          select: {
            notifications: {
              where: { isRead: false },
            },
          },
        },
      },
    })

    if (!user) {
      // User was deleted — clear session
      const response = Errors.userNotFound()
      response.headers.append('Set-Cookie', createClearSessionCookie())
      return response
    }

    if (!user.isActive) {
      const response = Errors.userInactive()
      response.headers.append('Set-Cookie', createClearSessionCookie())
      return response
    }

    // 4. Build role-specific response
    const responseData = {
      ...user,
      unreadNotifications: user._count.notifications,
      _count: undefined,
    }

    return success(responseData, 'Profile loaded')
  } catch (err) {
    // If token verification fails, return unauthorized
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expired — please log in again')
      }
    }
    return handleApiError(err)
  }
}

// ─── Logout (DELETE session) ────────────────

export async function DELETE(_request: NextRequest) {
  try {
    // Get token for audit logging
    const cookieToken = _request.cookies.get('session')?.value
    const refreshCookieToken = _request.cookies.get('refresh')?.value

    if (cookieToken) {
      try {
        const payload = await verifyToken(cookieToken)
        // Create logout audit log
        await db.auditLog.create({
          data: {
            tenantId: payload.tenantId,
            userId: payload.userId,
            action: 'LOGOUT',
            entityType: 'User',
            entityId: payload.userId,
          },
        })

        // Revoke the refresh token JTI if present in session token payload
        if (payload.jti && payload.exp) {
          revokeAccessToken(payload.jti, payload.exp)
        }
      } catch {
        // Token may be invalid/expired — just clear cookies
      }
    }

    // Also try to revoke the refresh token directly
    if (refreshCookieToken) {
      try {
        const { verifyRefreshToken } = await import('@/lib/auth')
        const refreshPayload = await verifyRefreshToken(refreshCookieToken)
        if (refreshPayload.jti && refreshPayload.exp) {
          revokeAccessToken(refreshPayload.jti, refreshPayload.exp)
        }
      } catch {
        // Refresh token may be invalid/expired
      }
    }

    // Return success with cleared cookies
    const response = success(null, 'Déconnecté avec succès')
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    response.cookies.set('refresh', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (err) {
    return handleApiError(err)
  }
}
