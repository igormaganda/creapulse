// ============================================
// CreaPulse V2 — Admin Centre: Bénéficiaires API
// GET /api/admin-centre/beneficiaires
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import { Prisma } from '@prisma/client'

// ─── GET: List beneficiaries with filters ───

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['COUNSELOR', 'ADMIN'] })
    if (!auth || auth instanceof NextResponse) return auth
    const { tenantId } = auth

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const counselorId = searchParams.get('conseiller') || ''
    const phase = searchParams.get('phase') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.BeneficiaryWhereInput = {
      user: { tenantId },
    }

    // Search by name, email, projectTitle
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        {
          user: {
            creatorJourney: {
              projectTitle: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ]
    }

    // Filter by counselor (via CounselorAssignment)
    if (counselorId) {
      where.assignments = {
        some: {
          counselorId,
          status: 'ACTIVE',
        },
      }
    }

    // Filter by phase (via CreatorJourney.currentPhase)
    if (phase) {
      where.user = {
        ...((where.user as Prisma.UserWhereInput) || {}),
        creatorJourney: {
          currentPhase: phase as never,
        },
      }
    }

    // Query with includes
    const [beneficiaries, total] = await Promise.all([
      db.beneficiary.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
              createdAt: true,
              creatorJourney: {
                select: {
                  id: true,
                  projectTitle: true,
                  currentPhase: true,
                  progressPercent: true,
                  bpStatus: true,
                  projectSector: true,
                },
              },
            },
          },
          assignments: {
            where: { status: 'ACTIVE', role: 'PRIMARY' },
            include: {
              counselor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            take: 1,
          },
          organization: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.beneficiary.count({ where }),
    ])

    // Format response
    const formattedBeneficiaires = beneficiaries.map((b) => ({
      id: b.id,
      userId: b.userId,
      name: `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() || b.user.email,
      firstName: b.user.firstName,
      lastName: b.user.lastName,
      email: b.user.email,
      project: b.user.creatorJourney?.projectTitle || '',
      projectSector: b.user.creatorJourney?.projectSector || '',
      phase: b.user.creatorJourney?.currentPhase || 'DISCOVERY',
      progress: b.user.creatorJourney?.progressPercent ?? b.progressScore,
      bpStatus: b.user.creatorJourney?.bpStatus || 'NOT_STARTED',
      conseiller: b.assignments[0]?.counselor?.name || 'Non assigné',
      counselorId: b.assignments[0]?.counselor?.id || null,
      employmentStatus: b.employmentStatus,
      isActive: b.user.isActive,
      organization: b.organization,
      registrationDate: b.createdAt,
    }))

    return success(
      {
        beneficiaires: formattedBeneficiaires,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      `${total} beneficiaire(s) trouve(s)`,
    )
  } catch (err) {
    return handleApiError(err)
  }
}
