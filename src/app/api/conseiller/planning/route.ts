// ============================================
// CreaPulse V2 — Conseiller Planning
// GET  /api/conseiller/planning — List appointments
// POST /api/conseiller/planning — Create appointment
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { getCounselor, AuthRequiredError, AuthForbiddenError, AuthNotFoundError } from '../_lib/auth'
import { z } from 'zod'

// ─── Zod schemas ─────────────────────────────

const createAppointmentSchema = z.object({
  beneficiaryId: z.string().min(1, 'L\'identifiant du bénéficiaire est requis'),
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  type: z.enum(['BILAN', 'FOLLOW_UP', 'WORKSHOP', 'OTHER'], {
    errorMap: () => ({ message: 'Type invalide (BILAN, FOLLOW_UP, WORKSHOP, OTHER)' }),
  }),
  scheduledAt: z.string().min(1, 'La date planifiée est requise'),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  mode: z.enum(['PHYSICAL', 'VIDEO', 'PHONE'], {
    errorMap: () => ({ message: 'Mode invalide (PHYSICAL, VIDEO, PHONE)' }),
  }).default('PHYSICAL'),
  location: z.string().optional(),
  notes: z.string().optional(),
})

// ─── GET ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { counselor } = await getCounselor(request)

    // Parse query params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')

    // Build where clause
    const where: Record<string, unknown> = {
      counselorId: counselor.id,
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {}
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)
      where.scheduledAt = dateFilter
    }

    if (type) {
      where.type = type
    }

    const appointments = await db.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        beneficiary: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    })

    const typeLabels: Record<string, string> = {
      BILAN: 'Bilan',
      FOLLOW_UP: 'Suivi',
      WORKSHOP: 'Atelier',
      OTHER: 'Autre',
    }

    const modeLabels: Record<string, string> = {
      PHYSICAL: 'physique',
      VIDEO: 'vidéo',
      PHONE: 'téléphone',
    }

    const statusLabels: Record<string, string> = {
      SCHEDULED: 'Planifié',
      CONFIRMED: 'Confirmé',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
    }

    // Group appointments by day
    const groupedByDay: Record<string, typeof appointments> = {}

    const formattedAppointments = appointments.map((a) => {
      const dayKey = a.scheduledAt.toISOString().split('T')[0]

      if (!groupedByDay[dayKey]) {
        groupedByDay[dayKey] = []
      }
      groupedByDay[dayKey].push(a)

      const scheduledDate = new Date(a.scheduledAt)
      const endTime = new Date(scheduledDate.getTime() + a.durationMinutes * 60000)

      return {
        id: a.id,
        date: dayKey,
        startTime: scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        endTime: endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        beneficiaryId: a.beneficiaryId,
        beneficiaryName: `${a.beneficiary.user.firstName || ''} ${a.beneficiary.user.lastName || ''}`.trim(),
        beneficiaryInitials: `${(a.beneficiary.user.firstName || '')[0] || ''}${(a.beneficiary.user.lastName || '')[0] || ''}`.toUpperCase(),
        type: a.type,
        typeLabel: typeLabels[a.type] || a.type,
        mode: a.mode,
        modeLabel: modeLabels[a.mode] || a.mode,
        status: a.status,
        statusLabel: statusLabels[a.status] || a.status,
        location: a.location,
        videoLink: a.videoLink,
        notes: a.notes,
        durationMinutes: a.durationMinutes,
      }
    })

    // Build the days array from grouped data
    const joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const moisLabels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

    const days = Object.entries(groupedByDay).map(([dateKey, dayAppointments]) => {
      const date = new Date(dateKey)
      return {
        date: dateKey,
        label: `${joursSemaine[date.getDay()]} ${date.getDate()} ${moisLabels[date.getMonth()]}`,
        appointments: formattedAppointments.filter((a) => a.date === dateKey),
      }
    }).sort((a, b) => a.date.localeCompare(b.date))

    return success({
      appointments: formattedAppointments,
      days,
    }, 'Liste des rendez-vous')
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}

// ─── POST ────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { counselor } = await getCounselor(request)

    const body = await request.json()
    const parsed = createAppointmentSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      )
    }

    const { beneficiaryId, title, type, scheduledAt, durationMinutes, mode, location, notes } = parsed.data

    // Verify beneficiary is assigned to this counselor
    const assignment = await db.counselorAssignment.findFirst({
      where: {
        counselorId: counselor.id,
        beneficiaryId,
        status: 'ACTIVE',
      },
    })

    if (!assignment) {
      return Errors.notFound('Affectation bénéficiaire')
    }

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        counselorId: counselor.id,
        beneficiaryId,
        title,
        type,
        scheduledAt: new Date(scheduledAt),
        durationMinutes,
        mode,
        location,
        notes,
      },
      include: {
        beneficiary: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    const scheduledDate = new Date(appointment.scheduledAt)
    const endTime = new Date(scheduledDate.getTime() + appointment.durationMinutes * 60000)

    return success(
      {
        id: appointment.id,
        beneficiaryId: appointment.beneficiaryId,
        beneficiaryName: `${appointment.beneficiary.user.firstName || ''} ${appointment.beneficiary.user.lastName || ''}`.trim(),
        title: appointment.title,
        type: appointment.type,
        scheduledAt: appointment.scheduledAt.toISOString(),
        startTime: scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        endTime: endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        durationMinutes: appointment.durationMinutes,
        mode: appointment.mode,
        status: appointment.status,
      },
      'Rendez-vous créé avec succès',
      201,
    )
  } catch (err) {
    if (err instanceof AuthRequiredError) return Errors.unauthorized(err.message)
    if (err instanceof AuthForbiddenError) return Errors.forbidden(err.message)
    if (err instanceof AuthNotFoundError) return Errors.notFound('Profil conseiller')
    return handleApiError(err)
  }
}
