import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { createLogger } from '@/lib/logger'

const logger = createLogger('RegisterAPI')

// ─── Validation ──────────────────────────────

const RegisterSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128)
    .refine(pw => /[A-Z]/.test(pw), 'Le mot de passe doit contenir au moins une majuscule')
    .refine(pw => /[0-9]/.test(pw), 'Le mot de passe doit contenir au moins un chiffre')
    .refine(pw => /[^A-Za-z0-9]/.test(pw), 'Le mot de passe doit contenir au moins un caractère spécial'),
})

// ─── Rate limiting (in-memory, per-IP) ────────

const registerAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_REGISTER_ATTEMPTS_PER_HOUR = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = registerAttempts.get(ip)

  if (!record || now > record.resetAt) {
    registerAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }

  if (record.count >= MAX_REGISTER_ATTEMPTS_PER_HOUR) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) }
  }

  record.count++
  return { allowed: true }
}

// ─── POST Handler ───────────────────────────

export async function POST(request: Request) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateCheck = checkRateLimit(ip)
    if (!rateCheck.allowed) {
      return Errors.validation(
        { retryAfter: rateCheck.retryAfter },
        `Trop de tentatives d'inscription. Réessayez dans ${rateCheck.retryAfter} secondes.`,
      )
    }

    // Parse and validate body
    const body = await request.json()
    const { firstName, lastName, email, password } = RegisterSchema.parse(body)

    const normalizedEmail = email.trim().toLowerCase()

    // Check email uniqueness (composite unique: tenantId + email)
    const existingUser = await db.user.findFirst({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return Errors.emailExists()
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Ensure default tenant exists
    const tenant = await db.tenant.upsert({
      where: { slug: 'gidef' },
      create: {
        name: 'GIDEF',
        slug: 'gidef',
        isActive: true,
      },
      update: {},
    })

    // Create user + beneficiary + creator journey in a transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: 'BENEFICIARY',
          tenantId: tenant.id,
          isActive: true,
        },
      })

      await tx.beneficiary.create({
        data: {
          userId: newUser.id,
        },
      })

      await tx.creatorJourney.create({
        data: {
          userId: newUser.id,
          currentPhase: 'DISCOVERY',
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          action: 'USER_CREATE',
          entityType: 'User',
          entityId: newUser.id,
          details: { email: normalizedEmail, firstName: firstName.trim() },
          ipAddress: ip,
        },
      })

      return newUser
    })

    logger.info('Nouvel utilisateur inscrit', { userId: user.id, email: normalizedEmail })

    return success(
      {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      },
      'Compte créé avec succès. Connectez-vous pour continuer.',
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Errors.validation(
        err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        'Données invalides',
      )
    }
    return handleApiError(err)
  }
}
