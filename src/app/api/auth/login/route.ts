import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { generateAuthResponse, verifyPassword } from '@/lib/auth'
import { success, Errors, handleApiError } from '@/lib/api-response'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

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

    // Zod validation
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0])
        if (!fieldErrors[key]) fieldErrors[key] = []
        fieldErrors[key].push(issue.message)
      }
      return Errors.validation(fieldErrors, 'Données de connexion invalides')
    }

    const { email, password } = parsed.data

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

    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return Errors.invalidCredentials('Identifiants invalides')
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

    // Set session cookie (token only in httpOnly cookie, never in response body)
    const response = NextResponse.json({
      success: true,
      data: {
        user: authTokens.user,
      },
    })

    response.cookies.set('session', authTokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: authTokens.expiresIn,
    })

    return response
  } catch (err) {
    return handleApiError(err)
  }
}
