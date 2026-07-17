// ============================================
// CreaPulse V2 — Conseiller Beneficiaires List
// GET /api/conseiller/beneficiaires
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { getCounselor, AuthRequiredError, AuthForbiddenError, AuthNotFoundError } from '../_lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { counselor } = await getCounselor(request)

    // Parse query params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const phase = searchParams.get('phase') || ''
    const sort = searchParams.get('sort') || 'name' // name | progress | createdAt
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    // Get assigned beneficiary IDs
    const assignments = await db.counselorAssignment.findMany({
      where: {
        counselorId: counselor.id,
        status: 'ACTIVE',
      },
      select: { beneficiaryId: true },
    })

    const beneficiaryIds = assignments.map((a) => a.beneficiaryId)

    if (beneficiaryIds.length === 0) {
      return success({
        beneficiaires: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      }, 'Liste des bénéficiaires du conseiller')
    }

    // Build where clause
    const where: Prisma.BeneficiaryWhereInput = {
      id: { in: beneficiaryIds },
    }

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    if (phase) {
      where.user = {
        ...where.user,
        creatorJourney: {
          currentPhase: phase as Prisma.EnumJourneyPhaseFilter['equals'],
        },
      }
    }

    // Build orderBy
    let orderBy: Prisma.BeneficiaryOrderByWithRelationInput
    switch (sort) {
      case 'progress':
        orderBy = { progressScore: 'desc' }
        break
      case 'createdAt':
        orderBy = { createdAt: 'desc' }
        break
      default:
        orderBy = { user: { lastName: 'asc' } }
    }

    // Query with pagination
    const [total, beneficiaires] = await Promise.all([
      db.beneficiary.count({ where }),
      db.beneficiary.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              isActive: true,
              createdAt: true,
              creatorJourney: {
                select: {
                  currentPhase: true,
                  progressPercent: true,
                  projectTitle: true,
                  projectSector: true,
                  bpStatus: true,
                },
              },
            },
          },
        },
      }),
    ])

    const phaseLabels: Record<string, string> = {
      DISCOVERY: 'Découverte',
      PROFILING: 'Profilage',
      MODELING: 'Modélisation',
      STRATEGY: 'Stratégie',
      ECOSYSTEM: 'Écosystème',
      LAUNCH: 'Lancement',
      POST_CREATION: 'Post-création',
    }

    const formattedBeneficiaires = beneficiaires.map((b) => {
      const journey = b.user.creatorJourney
      return {
        id: b.id,
        firstName: b.user.firstName || '',
        lastName: b.user.lastName || '',
        email: b.user.email,
        avatarUrl: b.user.avatarUrl,
        projectTitle: journey?.projectTitle || '',
        sector: journey?.projectSector || '',
        journeyPhase: journey ? (phaseLabels[journey.currentPhase] || journey.currentPhase) : '',
        journeyPhaseRaw: journey?.currentPhase || '',
        progress: journey?.progressPercent ?? b.progressScore,
        lastActivity: b.updatedAt.toISOString(),
        status: b.user.isActive ? (b.progressScore > 0 ? 'actif' : 'en_attente') : 'inactif',
        createdAt: b.createdAt.toISOString(),
      }
    })

    return success({
      beneficiaires: formattedBeneficiaires,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, 'Liste des bénéficiaires du conseiller')
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}
