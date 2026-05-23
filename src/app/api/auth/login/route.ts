import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateAuthResponse, verifyPassword } from '@/lib/auth'
import { success, Errors, handleApiError } from '@/lib/api-response'

// ─── Login rate limiting (in-memory, per-IP) ──

const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_LOGIN_ATTEMPTS_PER_15MIN = 10
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS_PER_15MIN) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) }
  }

  record.count++
  return { allowed: true }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return Errors.validation({ email: ['Email requis'], password: ['Mot de passe requis'] }, 'Champs manquants')
    }

    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateCheck = checkLoginRateLimit(ip)
    if (!rateCheck.allowed) {
      return Errors.validation(
        { retryAfter: rateCheck.retryAfter },
        `Trop de tentatives de connexion. Réessayez dans ${rateCheck.retryAfter} secondes.`,
      )
    }

    // Find user by email (composite unique: tenantId + email)
    const normalizedEmail = email.trim().toLowerCase()
    const user = await db.user.findFirst({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return Errors.invalidCredentials('Aucun compte trouvé avec cet email')
    }

    if (!user.passwordHash) {
      return Errors.invalidCredentials('Méthode de connexion invalide')
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return Errors.invalidCredentials('Mot de passe incorrect')
    }

    // Get tenant ID from user record
    const tenantId = user.tenantId || 'default'

    // Generate auth tokens
    const authTokens = await generateAuthResponse({
      id: user.id,
      tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    })

    // Set session cookie (with Secure flag in production)
    const isProduction = process.env.NODE_ENV === 'production'
    const sessionCookie = `session=${authTokens.accessToken}; Path=/; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Max-Age=${authTokens.expiresIn}`

    return NextResponse.json({
      success: true,
      data: {
        user: authTokens.user,
        accessToken: authTokens.accessToken,
      },
    }, {
 headers: {
        'Set-Cookie': sessionCookie,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
