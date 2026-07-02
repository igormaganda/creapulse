// ============================================
// CreaPulse V2 — Admin Centre: Planning API
// GET  /api/admin-centre/planning — All appointments
// POST /api/admin-centre/planning — Create appointment
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import { z } from 'zod'

// ─── Zod Schema for POST ───────────────────

const createAppointmentSchema = z.object({
  counselorId: z.string().min(1, 'Conseiller requis'),
  beneficiaryId: z.string().min(1, 'Bénéficiaire requis'),
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  type: z.enum(['BILAN', 'FOLLOW_UP', 'WORKSHOP', 'OTHER']).default('FOLLOW_UP'),
  scheduledAt: z.string().min(1, 'Date requise'),
  durationMinutes: z.number().min(15).max(480).default(60),
  mode: z.enum(['PHYSICAL', 'VIDEO', 'PHONE']).default('PHYSICAL'),
  location: z.string().optional(),
  description: z.string().optional(),
  videoLink: z.string().optional(),
  notes: z.string().optional(),
})

// ─── Day labels in French ──────────────────

const dayLabels: Record<number, string> = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
}

const monthNames = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]

// ─── GET: All appointments for the center ──

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['COUNSELOR', 'ADMIN'] })
    if (!auth || auth instanceof NextResponse) return auth
    const { tenantId } = auth

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start') || ''
    const endDate = searchParams.get('end') || ''
    const counselorId = searchParams.get('counselor') || ''

    // Build where clause
    const where: Record<string, unknown> = {
      counselor: { organization: { tenantId } },
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {}
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)
      where.scheduledAt = dateFilter
    }

    if (counselorId) {
      where.counselorId = counselorId
    }

    // Query appointments with includes
    const appointments = await db.appointment.findMany({
      where,
      include: {
        counselor: {
          select: {
            id: true,
            name: true,
            specialities: true,
          },
        },
        beneficiary: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    })

    // Group by day of week
    const groupedByDay: Record<string, typeof appointments> = {}
    for (const apt of appointments) {
      const date = new Date(apt.scheduledAt)
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      if (!groupedByDay[dayKey]) groupedByDay[dayKey] = []
      groupedByDay[dayKey].push(apt)
    }

    // Format grouped data
    const days = Object.entries(groupedByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, apts]) => {
        const date = new Date(dateKey + 'T12:00:00')
        return {
          date: dateKey,
          dayLabel: dayLabels[date.getDay()],
          dayOfMonth: date.getDate(),
          monthLabel: monthNames[date.getMonth()],
          appointments: apts.map((apt) => ({
            id: apt.id,
            title: apt.title,
            type: apt.type,
            mode: apt.mode,
            scheduledAt: apt.scheduledAt.toISOString(),
            startTime: apt.scheduledAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            durationMinutes: apt.durationMinutes,
            status: apt.status,
            location: apt.location || '',
            videoLink: apt.videoLink || '',
            notes: apt.notes || '',
            counselor: {
              id: apt.counselor.id,
              name: apt.counselor.name,
            },
            beneficiary: {
              id: apt.beneficiary.id,
              name: `${apt.beneficiary.user.firstName || ''} ${apt.beneficiary.user.lastName || ''}`.trim() || apt.beneficiary.user.email,
              email: apt.beneficiary.user.email,
            },
          })),
        }
      })

    // Also return flat list for convenience
    const flatAppointments = appointments.map((apt) => ({
      id: apt.id,
      title: apt.title,
      type: apt.type,
      mode: apt.mode,
      scheduledAt: apt.scheduledAt.toISOString(),
      durationMinutes: apt.durationMinutes,
      status: apt.status,
      location: apt.location || '',
      videoLink: apt.videoLink || '',
      notes: apt.notes || '',
      counselor: {
        id: apt.counselor.id,
        name: apt.counselor.name,
      },
      beneficiary: {
        id: apt.beneficiary.id,
        name: `${apt.beneficiary.user.firstName || ''} ${apt.beneficiary.user.lastName || ''}`.trim() || apt.beneficiary.user.email,
        email: apt.beneficiary.user.email,
      },
    }))

    return success({
      appointments: flatAppointments,
      groupedByDay: days,
      total: appointments.length,
    }, `${appointments.length} rendez-vous trouvé(s)`)
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Create appointment ──────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { roles: ['COUNSELOR', 'ADMIN'] })
    if (!auth || auth instanceof NextResponse) return auth
    const { userId, tenantId } = auth

    const body = await request.json()
    const parsed = createAppointmentSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(parsed.error.issues)
    }

    const data = parsed.data

    // Verify counselor exists and belongs to same tenant
    const counselor = await db.counselor.findFirst({
      where: {
        id: data.counselorId,
        organization: { tenantId },
      },
    })
    if (!counselor) {
      return Errors.notFound('Conseiller')
    }

    // Verify beneficiary exists in same tenant
    const beneficiary = await db.beneficiary.findFirst({
      where: {
        id: data.beneficiaryId,
        user: { tenantId },
      },
    })
    if (!beneficiary) {
      return Errors.notFound('Bénéficiaire')
    }

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        counselorId: data.counselorId,
        beneficiaryId: data.beneficiaryId,
        title: data.title,
        type: data.type,
        scheduledAt: new Date(data.scheduledAt),
        durationMinutes: data.durationMinutes,
        mode: data.mode,
        location: data.location || null,
        videoLink: data.videoLink || null,
        description: data.description || null,
        notes: data.notes || null,
      },
      include: {
        counselor: {
          select: { id: true, name: true },
        },
        beneficiary: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'SETTINGS_UPDATE',
        entityType: 'Appointment',
        entityId: appointment.id,
        details: {
          title: appointment.title,
          type: appointment.type,
          scheduledAt: appointment.scheduledAt.toISOString(),
        },
      },
    })

    return success(
      {
        id: appointment.id,
        title: appointment.title,
        type: appointment.type,
        mode: appointment.mode,
        scheduledAt: appointment.scheduledAt.toISOString(),
        durationMinutes: appointment.durationMinutes,
        status: appointment.status,
        counselor: {
          id: appointment.counselor.id,
          name: appointment.counselor.name,
        },
        beneficiary: {
          id: appointment.beneficiary.id,
          name: `${appointment.beneficiary.user.firstName || ''} ${appointment.beneficiary.user.lastName || ''}`.trim(),
          email: appointment.beneficiary.user.email,
        },
      },
      'Rendez-vous créé avec succès',
      201,
    )
  } catch (err) {
    return handleApiError(err)
  }
}
