// ============================================
// CreaPulse V2 — Assignments API
// GET /api/assignments  — List assignments (counselors or beneficiaries)
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'

// ─── GET: List assignments ──────────────

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentification requise', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)
    const { searchParams } = new URL(request.url)
    const roleParam = searchParams.get('role')

    // If no role param, infer from user role
    const effectiveRole =
      roleParam || (payload.role === 'COUNSELOR' ? 'counselor' : payload.role === 'BENEFICIARY' ? 'beneficiary' : null)

    if (!effectiveRole) {
      return Errors.validation(null, 'Paramètre "role" requis (counselor ou beneficiary)')
    }

    // ── Counselor perspective: return assigned beneficiaries ──
    if (effectiveRole === 'counselor') {
      if (payload.role !== 'COUNSELOR' && payload.role !== 'ADMIN') {
        return Errors.forbidden('Accès réservé aux conseillers')
      }

      // Find counselor profile
      const counselor = await db.counselor.findFirst({
        where: { userId: payload.userId },
      })

      if (!counselor) {
        return Errors.notFound('Profil conseiller')
      }

      const assignments = await db.counselorAssignment.findMany({
        where: {
          counselorId: counselor.id,
          status: 'ACTIVE',
        },
        include: {
          beneficiary: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
              },
              organization: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      })

      const formatted = assignments.map((a) => ({
        id: a.id,
        beneficiaryId: a.beneficiaryId,
        beneficiary: {
          id: a.beneficiary.id,
          userId: a.beneficiary.userId,
          firstName: a.beneficiary.user.firstName,
          lastName: a.beneficiary.user.lastName,
          email: a.beneficiary.user.email,
          avatarUrl: a.beneficiary.user.avatarUrl,
          employmentStatus: a.beneficiary.employmentStatus,
          progressScore: a.beneficiary.progressScore,
          organizationName: a.beneficiary.organization?.name || null,
          user: {
            id: a.beneficiary.user.id,
            firstName: a.beneficiary.user.firstName,
            lastName: a.beneficiary.user.lastName,
          },
        },
        role: a.role,
        status: a.status,
        assignedAt: a.assignedAt,
      }))

      return success(formatted)
    }

    // ── Beneficiary perspective: return assigned counselors ──
    if (effectiveRole === 'beneficiary') {
      if (payload.role !== 'BENEFICIARY' && payload.role !== 'ADMIN') {
        return Errors.forbidden('Accès réservé aux bénéficiaires')
      }

      // Find beneficiary profile
      const beneficiary = await db.beneficiary.findFirst({
        where: { userId: payload.userId },
      })

      if (!beneficiary) {
        return Errors.notFound('Profil bénéficiaire')
      }

      const assignments = await db.counselorAssignment.findMany({
        where: {
          beneficiaryId: beneficiary.id,
          status: 'ACTIVE',
        },
        include: {
          counselor: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
              },
              organization: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      })

      const formatted = assignments.map((a) => ({
        id: a.id,
        counselorId: a.counselorId,
        counselor: {
          id: a.counselor.id,
          userId: a.counselor.userId,
          firstName: a.counselor.user.firstName,
          lastName: a.counselor.user.lastName,
          email: a.counselor.user.email,
          avatarUrl: a.counselor.user.avatarUrl,
          specialities: a.counselor.specialities,
          certifications: a.counselor.certifications,
          organizationName: a.counselor.organization?.name || null,
          user: {
            id: a.counselor.user.id,
            firstName: a.counselor.user.firstName,
            lastName: a.counselor.user.lastName,
          },
        },
        role: a.role,
        status: a.status,
        assignedAt: a.assignedAt,
      }))

      return success(formatted)
    }

    return Errors.validation(null, 'Valeur de "role" non reconnue. Utilisez "counselor" ou "beneficiary".')
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
