import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import type { ConsentType, ConsentStatus } from '@prisma/client'

// ─── Zod Schemas ──────────────────────────────

const consentTypes: string[] = [
  'COOKIES',
  'CGU',
  'DONNEES_PERSONNELLES',
  'MARKETING',
  'CREASCOPE',
  'FRANCE_TRAVAIL',
]

const consentStatuses: string[] = ['GRANTED', 'DENIED', 'WITHDRAWN']

const createConsentSchema = z.object({
  consentType: z.enum(consentTypes as [string, ...string[]], {
    message: 'Type de consentement invalide',
  }),
  status: z.enum(consentStatuses as [string, ...string[]]).default('GRANTED'),
  source: z.string().max(50).default('web'),
})

const withdrawConsentSchema = z.object({
  consentType: z.enum(consentTypes as [string, ...string[]], {
    message: 'Type de consentement invalide',
  }),
})

// ─── Helpers ──────────────────────────────────

function getClientInfo(request: NextRequest) {
  return {
    ipAddress:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || null,
  }
}

// ─── GET: Liste tous les consentements de l'utilisateur ────────────

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('session')?.value
    const headerToken = getTokenFromHeader(request)
    const token = cookieToken || headerToken
    if (!token) return Errors.unauthorized('Token manquant')

    const payload = await verifyToken(token)
    const userId = payload.userId

    const consents = await db.consentLog.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
      select: {
        id: true,
        consentType: true,
        status: true,
        source: true,
        version: true,
        grantedAt: true,
        withdrawnAt: true,
      },
    })

    return success(consents, 'Consentements récupérés avec succès')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Enregistrer un nouveau consentement ────────────────────

export async function POST(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('session')?.value
    const headerToken = getTokenFromHeader(request)
    const token = cookieToken || headerToken
    if (!token) return Errors.unauthorized('Token manquant')

    const payload = await verifyToken(token)
    const userId = payload.userId

    const body = await request.json()
    const parsed = createConsentSchema.safeParse(body)
    if (!parsed.success) return Errors.validation(parsed.error.issues)

    const { consentType, status, source } = parsed.data
    const { ipAddress, userAgent } = getClientInfo(request)

    // Upsert : met à jour le consentement existant ou en crée un nouveau
    const consent = await db.consentLog.upsert({
      where: {
        userId_consentType: {
          userId,
          consentType: consentType as ConsentType,
        },
      },
      create: {
        userId,
        consentType: consentType as ConsentType,
        status: (status || 'GRANTED') as ConsentStatus,
        ipAddress,
        userAgent,
        source,
      },
      update: {
        status: (status || 'GRANTED') as ConsentStatus,
        ipAddress,
        userAgent,
        source,
        grantedAt: new Date(),
        withdrawnAt: null,
      },
    })

    return success(consent, 'Consentement enregistré avec succès', 201)
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── DELETE: Retirer un consentement ──────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('session')?.value
    const headerToken = getTokenFromHeader(request)
    const token = cookieToken || headerToken
    if (!token) return Errors.unauthorized('Token manquant')

    const payload = await verifyToken(token)
    const userId = payload.userId

    const body = await request.json()
    const parsed = withdrawConsentSchema.safeParse(body)
    if (!parsed.success) return Errors.validation(parsed.error.issues)

    const { consentType } = parsed.data

    // Vérifie que le consentement existe
    const existing = await db.consentLog.findUnique({
      where: {
        userId_consentType: {
          userId,
          consentType: consentType as ConsentType,
        },
      },
    })

    if (!existing) {
      return Errors.notFound('Consentement')
    }

    // Met à jour le statut à WITHDRAWN
    const updated = await db.consentLog.update({
      where: {
        userId_consentType: {
          userId,
          consentType: consentType as ConsentType,
        },
      },
      data: {
        status: 'WITHDRAWN' as ConsentStatus,
        withdrawnAt: new Date(),
      },
    })

    return success(updated, 'Consentement retiré avec succès')
  } catch (err) {
    return handleApiError(err)
  }
}
