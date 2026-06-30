import { NextRequest } from 'next/server'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return
    const { payload } = auth
    const userId = payload.userId

    // Try to fetch real data from DB; gracefully degrade if unavailable
    let user: { id: string; email: string; firstName: string | null; lastName: string | null; role: string; avatarUrl: string | null } | null = null
    let modulesCompleted = 0
    let totalModules = 38
    let progression = 0
    let scoreBP: number | null = null
    let activities: Array<{ id: string; action: string; detail: string; time: string; icon: string; color: string }> = []
    let appointments: Array<{ id: string; title: string; description: string; date: string; type: string }> = []

    try {
      // Dynamic import to avoid crash if Prisma isn't initialized
      const { db } = await import('@/lib/db')

      const [dbUser, journey, moduleCount, unreadNotifs, dbAppointments] = await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, firstName: true, lastName: true, role: true, avatarUrl: true },
        }),
        db.creatorJourney.findUnique({ where: { userId } }).catch(() => null),
        db.moduleResult.count({ where: { userId, completedAt: { not: null } } }).catch(() => 0),
        db.notification.count({ where: { userId, isRead: false } }).catch(() => 0),
        db.appointment.findMany({
          where: { beneficiary: { userId }, scheduledAt: { gte: new Date() }, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
          include: { counselor: { select: { name: true } } },
          orderBy: { scheduledAt: 'asc' },
          take: 3,
        }).catch(() => []),
      ])

      user = dbUser
      modulesCompleted = moduleCount
      progression = journey?.progressPercent ?? Math.round((modulesCompleted / totalModules) * 100)
      scoreBP = journey?.bpScore ?? null

      // Build activity feed
      if (journey?.projectTitle) {
        activities.push({
          id: '1',
          action: `Projet : ${journey.projectTitle}`,
          detail: `Progression ${progression}%`,
          time: 'En cours',
          icon: 'trending',
          color: 'text-teal-500',
        })
      }

      if (dbAppointments.length > 0) {
        const a = dbAppointments[0]
        activities.push({
          id: '2',
          action: 'Rendez-vous planifié',
          detail: `${a.title} — ${a.counselor?.name ?? 'Conseiller'}`,
          time: formatAppointmentDate(a.scheduledAt),
          icon: 'calendar',
          color: 'text-coral-500',
        })
        appointments = dbAppointments.map((appt) => ({
          id: appt.id,
          title: appt.title,
          description: `${appt.counselor?.name ?? 'Conseiller'} — ${appt.type === 'PHYSICAL' ? 'Physique' : appt.type === 'VIDEO' ? 'En ligne' : appt.type}`,
          date: formatAppointmentDate(appt.scheduledAt),
          type: appt.type === 'PHYSICAL' ? 'Physique' : appt.type === 'VIDEO' ? 'En ligne' : appt.type,
        }))
      }

      if (unreadNotifs > 0) {
        activities.push({
          id: '3',
          action: `${unreadNotifs} notification${unreadNotifs > 1 ? 's' : ''} non lue${unreadNotifs > 1 ? 's' : ''}`,
          detail: 'Consultez votre boîte de notifications',
          time: 'À vérifier',
          icon: 'check',
          color: 'text-amber-500',
        })
      }
    } catch {
      // DB unavailable — return defaults (client-side scanner handles real progress)
      activities = [{
        id: '1',
        action: 'Parcours en cours',
        detail: 'Connectez vos modules pour suivre votre progression',
        time: 'Maintenant',
        icon: 'trending',
        color: 'text-teal-500',
      }]
    }

    if (!user) return Errors.userNotFound()

    return success({
      kpis: {
        progression,
        modulesCompleted,
        totalModules,
        prochainRDV: appointments.length > 0 ? appointments[0].date : null,
        scoreBP,
      },
      activities,
      appointments,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

function formatAppointmentDate(date: Date): string {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Demain'
  if (days <= 7) return `Dans ${days} jours`

  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}