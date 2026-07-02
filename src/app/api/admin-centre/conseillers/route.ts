// ============================================
// CreaPulse V2 — Admin Centre: Conseillers API
// GET /api/admin-centre/conseillers
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import { Prisma } from '@prisma/client'

// ─── GET: List counselors with filters ──────

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['COUNSELOR', 'ADMIN'] })
    if (!auth || auth instanceof NextResponse) return auth
    const { tenantId } = auth

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.CounselorWhereInput = {
      organization: { tenantId },
    }

    // Search by name, email, specialities
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { specialities: { hasSome: [search] } },
      ]
    }

    // Status filter (isAvailable)
    if (statusFilter === 'active') {
      where.isAvailable = true
    } else if (statusFilter === 'inactive') {
      where.isAvailable = false
    }

    // Query with includes and count
    const [counselors, total] = await Promise.all([
      db.counselor.findMany({
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
              lastLoginAt: true,
              createdAt: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              city: true,
              type: true,
            },
          },
          _count: {
            select: {
              assignments: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.counselor.count({ where }),
    ])

    // Format response
    const formattedCounselors = counselors.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.user.email,
      firstName: c.user.firstName,
      lastName: c.user.lastName,
      specialities: c.specialities,
      certifications: c.certifications,
      beneficiairesCount: c._count.assignments,
      maxCapacity: c.maxBeneficiaries,
      isAvailable: c.isAvailable,
      status: c.isAvailable ? 'active' : 'inactive',
      organization: c.organization,
      lastLoginAt: c.user.lastLoginAt,
      createdAt: c.user.createdAt,
    }))

    return success(
      {
        conseillers: formattedCounselors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      `${total} conseiller(s) trouve(s)`,
    )
  } catch (err) {
    return handleApiError(err)
  }
}
