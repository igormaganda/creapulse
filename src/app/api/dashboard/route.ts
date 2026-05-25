import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'

// Helper to get token from cookie or header
function getToken(request: NextRequest): string | null {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/session=([^;]+)/)
  if (match) return match[1]
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request)
    if (!token) return Errors.unauthorized()

    const payload = await verifyToken(token)
    const userId = payload.userId

    const [user, journey, moduleResults, unreadNotifs, appointments] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, avatarUrl: true }
      }),
      db.creatorJourney.findUnique({ where: { userId } }),
      db.moduleResult.count({ where: { userId, completedAt: { not: null } } }),
      db.notification.count({ where: { userId, isRead: false } }),
      db.appointment.findMany({
        where: { beneficiary: { userId }, scheduledAt: { gte: new Date() }, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
        include: { counselor: { select: { name: true } } },
        orderBy: { scheduledAt: 'asc' },
        take: 3
      })
    ])

    if (!user) return Errors.userNotFound()

    const totalModules = 20
    const modulesCompleted = moduleResults
    const progression = journey?.progressPercent ?? Math.round((modulesCompleted / totalModules) * 100)
    const scoreBP = journey?.bpScore ?? null

    const prochainRDV = appointments.length > 0
      ? formatAppointmentDate(appointments[0].scheduledAt)
      : null

    // Build response matching Dashboard component expected format
    return success({
      kpis: {
        progression,
        modulesCompleted,
        totalModules,
        prochainRDV,
        scoreBP,
      },
      activities: [
        {
          id: '1',
          action: `Progression parcours : ${progression}%`,
          detail: journey?.projectTitle || 'Démarrez votre parcours entrepreneurial',
          time: 'Maintenant',
          icon: 'trending',
          color: 'text-teal-500',
        },
        ...(appointments.length > 0 ? [{
          id: '2',
          action: 'Rendez-vous planifié',
          detail: `${appointments[0].title} — ${appointments[0].counselor.name}`,
          time: formatAppointmentDate(appointments[0].scheduledAt),
          icon: 'calendar' as const,
          color: 'text-coral-500',
        }] : []),
        ...(unreadNotifs > 0 ? [{
          id: '3',
          action: `${unreadNotifs} notification${unreadNotifs > 1 ? 's' : ''} non lue${unreadNotifs > 1 ? 's' : ''}`,
          detail: 'Consultez votre boîte de notifications',
          time: 'À vérifier',
          icon: 'check' as const,
          color: 'text-amber-500',
        }] : []),
      ],
      appointments: appointments.map((a) => ({
        id: a.id,
        title: a.title,
        description: `${a.counselor.name} — ${a.type === 'PHYSICAL' ? 'Physique' : a.type === 'VIDEO' ? 'En ligne' : a.type}`,
        date: formatAppointmentDate(a.scheduledAt),
        type: a.type === 'PHYSICAL' ? 'Physique' : a.type === 'VIDEO' ? 'En ligne' : a.type,
      })),
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
