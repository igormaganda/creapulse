// ============================================
// CreaPulse V2 — Profile (Profil Créateur) API
// GET  /api/profil  — Retrieve profile data
// PUT  /api/profil  — Save/update profile data
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'

// ─── Validation schemas ────────────────────

const ProfilBody = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  birthdate: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  employmentStatus: z.enum(['EMPLOYED', 'UNEMPLOYED', 'SELF_EMPLOYED', 'STUDENT', 'RETIRED', 'INACTIVE', 'OTHER']).nullable().optional(),
  educationLevel: z.string().nullable().optional(),
  lastDiploma: z.string().nullable().optional(),
  skills: z.array(z.string()).optional(),
  creationMotivation: z.string().nullable().optional(),
  previousExperience: z.boolean().nullable().optional(),
  previousExperienceDetails: z.string().nullable().optional(),
  availableTimePerWeek: z.number().min(0).max(80).nullable().optional(),
  hasDisability: z.boolean().optional(),
  rqthStatus: z.boolean().optional(),
  disabilityRate: z.number().min(0).max(100).nullable().optional(),
  supportNeeds: z.array(z.string()).optional(),
})

// ─── GET: Retrieve profile ──────────────────

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)

    const [user, beneficiary, journey] = await Promise.all([
      db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          avatarUrl: true, createdAt: true,
        },
      }),
      db.beneficiary.findUnique({
        where: { userId: payload.userId },
      }),
      db.creatorJourney.findUnique({
        where: { userId: payload.userId },
        select: { id: true, visionAnswers: true, creationMotivation: true },
      }),
    ])

    if (!user) return Errors.userNotFound()

    const visionAnswers = (journey?.visionAnswers || {}) as Record<string, unknown>

    return success({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      birthdate: (visionAnswers.birthdate as string) || null,
      phone: (visionAnswers.phone as string) || null,
      address: (visionAnswers.address as string) || null,
      employmentStatus: beneficiary?.employmentStatus || null,
      educationLevel: beneficiary?.educationLevel || null,
      lastDiploma: beneficiary?.lastDiploma || null,
      skills: (beneficiary?.skills as string[]) || [],
      hasDisability: beneficiary?.hasDisability || false,
      rqthStatus: beneficiary?.rqthStatus || false,
      disabilityRate: beneficiary?.disabilityRate || null,
      creationMotivation: journey?.creationMotivation || (visionAnswers.creationMotivation as string) || null,
      previousExperience: (visionAnswers.previousExperience as boolean) ?? null,
      previousExperienceDetails: (visionAnswers.previousExperienceDetails as string) || null,
      availableTimePerWeek: (visionAnswers.availableTimePerWeek as number) ?? null,
      supportNeeds: (visionAnswers.supportNeeds as string[]) || [],
    })
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}

// ─── PUT: Save/update profile ───────────────

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)

    const body = await request.json()
    const data = ProfilBody.parse(body)

    // Build extended profile data for visionAnswers
    const extendedProfile: Record<string, unknown> = {
      birthdate: data.birthdate,
      phone: data.phone,
      address: data.address,
      previousExperience: data.previousExperience,
      previousExperienceDetails: data.previousExperienceDetails,
      availableTimePerWeek: data.availableTimePerWeek,
      supportNeeds: data.supportNeeds,
    }

    // Get existing visionAnswers to merge
    const existing = await db.creatorJourney.findUnique({
      where: { userId: payload.userId },
      select: { visionAnswers: true },
    })
    const existingAnswers = (existing?.visionAnswers || {}) as Record<string, unknown>

    const mergedAnswers = { ...existingAnswers, ...extendedProfile }

    await Promise.all([
      // Update User personal info
      db.user.update({
        where: { id: payload.userId },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
        },
      }),

      // Update or create Beneficiary profile
      db.beneficiary.upsert({
        where: { userId: payload.userId },
        create: {
          userId: payload.userId,
          employmentStatus: data.employmentStatus || undefined,
          educationLevel: data.educationLevel || undefined,
          lastDiploma: data.lastDiploma || undefined,
          skills: data.skills || [],
          hasDisability: data.hasDisability ?? false,
          rqthStatus: data.rqthStatus ?? false,
          disabilityRate: data.disabilityRate ?? undefined,
        },
        update: {
          ...(data.employmentStatus !== undefined && { employmentStatus: data.employmentStatus }),
          ...(data.educationLevel !== undefined && { educationLevel: data.educationLevel }),
          ...(data.lastDiploma !== undefined && { lastDiploma: data.lastDiploma }),
          ...(data.skills !== undefined && { skills: data.skills }),
          ...(data.hasDisability !== undefined && { hasDisability: data.hasDisability }),
          ...(data.rqthStatus !== undefined && { rqthStatus: data.rqthStatus }),
          ...(data.disabilityRate !== undefined && { disabilityRate: data.disabilityRate }),
        },
      }),

      // Update CreatorJourney
      db.creatorJourney.upsert({
        where: { userId: payload.userId },
        create: {
          userId: payload.userId,
          creationMotivation: data.creationMotivation || undefined,
          visionAnswers: mergedAnswers,
        },
        update: {
          ...(data.creationMotivation !== undefined && { creationMotivation: data.creationMotivation }),
          visionAnswers: mergedAnswers,
        },
      }),
    ])

    return success({ updated: true }, 'Profil mis à jour avec succès')
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
