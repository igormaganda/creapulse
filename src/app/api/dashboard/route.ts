import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'

// Helper to get token from cookie or header
function getToken(request: NextRequest): string | null {
  // Try cookie first
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/session=([^;]+)/)
  if (match) return match[1]
  // Try Authorization header
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

    const [user, journey, moduleResults, notifications, appointments] = await Promise.all([
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
    const progression = Math.round((modulesCompleted / totalModules) * 100)

    return success({
      user,
      journey,
      stats: {
        modulesCompleted,
        totalModules,
        progression,
        unreadNotifications: notifications,
        upcomingAppointments: appointments,
        recentActivity: appointments.slice(0, 3).map(a => ({
          type: 'appointment',
          title: a.title,
          date: a.scheduledAt,
          with: a.counselor.name
        }))
      }
    })
  } catch (err) {
    return handleApiError(err)
  }
}
