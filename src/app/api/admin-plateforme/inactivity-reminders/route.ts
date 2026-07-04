// ============================================
// CreaPulse V2 — Inactivity Reminder Trigger
// POST /api/admin-plateforme/inactivity-reminders
//   { daysInactive?: number }  — Send reminders to inactive users
//   Requires ADMIN role
// Designed to be called by an external cron (e.g. every 7 days)
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/api-auth'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { z } from 'zod'
import { sendInactivityReminder } from '@/lib/email'

const schema = z.object({
  daysInactive: z.number().int().min(3).max(90).optional().default(14),
  dryRun: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  const auth = await withAuth(request, { roles: ['ADMIN'] })
  if (!('userId' in auth)) return auth

  try {
    const body = await request.json()
    const { daysInactive, dryRun } = schema.parse(body)

    const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000)

    // Find active beneficiaries whose last login is before the cutoff
    const inactiveUsers = await db.user.findMany({
      where: {
        role: 'BENEFICIARY',
        isActive: true,
        lastLoginAt: { lt: cutoffDate },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastLoginAt: true,
      },
      take: 100,
    })

    if (dryRun) {
      return success(
        { daysInactive, cutoffDate, count: inactiveUsers.length, users: inactiveUsers.map(u => ({ id: u.id, email: u.email, lastLoginAt: u.lastLoginAt })) },
        `${inactiveUsers.length} utilisateur(s) inactif(s) détecté(s) (dry run, aucun email envoyé)`,
      )
    }

    let sent = 0
    for (const user of inactiveUsers) {
      await sendInactivityReminder(
        user.email,
        user.firstName || 'Créateur',
        daysInactive,
      ).then((ok) => { if (ok) sent++ }).catch(() => {})
    }

    return success(
      { daysInactive, cutoffDate: cutoffDate.toISOString(), totalInactive: inactiveUsers.length, emailsSent: sent },
      `${sent} email(s) d'inactivité envoyé(s) sur ${inactiveUsers.length} utilisateur(s) inactif(s)`,
    )
  } catch (err) {
    return handleApiError(err)
  }
}