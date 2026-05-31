// ============================================
// CreaPulse V2 — CréaScope Statistics (Counselor)
// GET /api/conseiller/creascope-stats
// Returns aggregate CréaScope statistics for a counselor
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError, checkRole } from '@/lib/auth'

// ─── Dimension label mapping ────────────────

const DIMENSION_KEYS = ['leadership', 'stress', 'communication', 'resolution', 'creativity', 'adaptability'] as const
const DIMENSION_LABELS: Record<string, string> = {
  leadership: 'Leadership',
  stress: 'Gestion du Stress',
  communication: 'Communication',
  resolution: 'Résolution de Problèmes',
  creativity: 'Créativité',
  adaptability: 'Adaptabilité',
}

// ─── GET: Stats ──────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // ── Auth: Counselor or Admin ──
    let token = request.cookies.get('session')?.value
    if (!token) token = getTokenFromHeader(request)
    if (!token) return Errors.unauthorized('Non authentifié')

    const payload = await verifyToken(token)

    if (payload.role !== 'COUNSELOR' && payload.role !== 'ADMIN') {
      return Errors.forbidden('Accès réservé aux conseillers et administrateurs')
    }

    // ── Resolve counselor ID ──
    let counselorId: string

    if (payload.role === 'ADMIN') {
      // Admin can optionally pass counselorId query param, otherwise get own
      const { searchParams } = new URL(request.url)
      const targetCounselorId = searchParams.get('counselorId')
      if (!targetCounselorId) return Errors.validation(null, 'Paramètre counselorId requis pour un administrateur')
      counselorId = targetCounselorId
    } else {
      const counselor = await db.counselor.findUnique({
        where: { userId: payload.userId },
        select: { id: true },
      })
      if (!counselor) return Errors.forbidden('Profil conseiller non trouvé')
      counselorId = counselor.id
    }

    // ── Fetch all sessions for this counselor ──
    const sessions = await db.creascopeSession.findMany({
      where: { counselorId },
      include: {
        beneficiary: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    })

    // ── Compute session aggregates ──
    const totalSessions = sessions.length
    const completedSessions = sessions.filter((s) => s.status === 'TERMINEE').length
    const inProgressSessions = sessions.filter((s) => s.status === 'EN_COURS' || s.status === 'PAUSEE').length
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

    // Average duration (from stepProgress)
    let totalDuration = 0
    let sessionsWithDuration = 0
    for (const session of sessions) {
      const stepProgress = session.stepProgress as Record<string, Record<string, unknown>> | null
      if (stepProgress) {
        let duration = 0
        for (const step of Object.values(stepProgress)) {
          if (step.durationMinutes && typeof step.durationMinutes === 'number') {
            duration += step.durationMinutes
          }
        }
        if (duration > 0) {
          totalDuration += duration
          sessionsWithDuration++
        }
      }
    }
    const averageDuration = sessionsWithDuration > 0 ? Math.round(totalDuration / sessionsWithDuration) : 0

    // Average global score
    const scoredSessions = sessions.filter((s) => s.globalScore != null)
    const averageGlobalScore = scoredSessions.length > 0
      ? Math.round(scoredSessions.reduce((sum, s) => sum + (s.globalScore ?? 0), 0) / scoredSessions.length)
      : 0

    // ── Sessions by month (last 12 months) ──
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const sessionsLastYear = sessions.filter((s) => s.scheduledAt >= twelveMonthsAgo)

    const monthMap = new Map<string, number>()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, 0)
    }

    for (const s of sessionsLastYear) {
      const key = `${s.scheduledAt.getFullYear()}-${String(s.scheduledAt.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, (monthMap.get(key) || 0) + 1)
    }

    const moisNoms = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
    ]

    const sessionsByMonth = Array.from(monthMap.entries()).map(([month, count]) => {
      const [year, monthNum] = month.split('-')
      return {
        month: `${moisNoms[parseInt(monthNum, 10) - 1]} ${year}`,
        count,
      }
    })

    // ── Dimension averages (Kiviat) ──
    // Collect all beneficiary user IDs from sessions
    const beneficiaryUserIds = [...new Set(sessions.map((s) => s.beneficiary.userId))]

    const dimensionAverages: Record<string, number> = {}
    for (const dim of DIMENSION_KEYS) {
      dimensionAverages[dim] = 0
    }

    if (beneficiaryUserIds.length > 0) {
      const allKiviatResults = await db.kiviatResult.findMany({
        where: { userId: { in: beneficiaryUserIds } },
      })

      // Group by category and compute averages
      const dimSums: Record<string, { total: number; count: number }> = {}

      for (const kr of allKiviatResults) {
        // Map category to dimension key (case-insensitive)
        const categoryLower = kr.category.toLowerCase()
        let matchedKey: string | null = null

        for (const dim of DIMENSION_KEYS) {
          if (categoryLower.includes(dim) || dim.includes(categoryLower)) {
            matchedKey = dim
            break
          }
        }

        if (!matchedKey) {
          // Try label matching
          for (const [key, label] of Object.entries(DIMENSION_LABELS)) {
            if (kr.category.toLowerCase().includes(label.toLowerCase())) {
              matchedKey = key
              break
            }
          }
        }

        if (matchedKey) {
          if (!dimSums[matchedKey]) dimSums[matchedKey] = { total: 0, count: 0 }
          dimSums[matchedKey].total += kr.score
          dimSums[matchedKey].count++
        }
      }

      for (const dim of DIMENSION_KEYS) {
        if (dimSums[dim] && dimSums[dim].count > 0) {
          dimensionAverages[dim] = Math.round((dimSums[dim].total / dimSums[dim].count) * 10) / 10
        }
      }
    }

    // ── Recent sessions (last 10) ──
    const recentSessions = sessions.slice(0, 10).map((s) => ({
      id: s.id,
      beneficiaryName:
        `${s.beneficiary.user.firstName || ''} ${s.beneficiary.user.lastName || ''}`.trim() || 'Inconnu',
      status: s.status,
      currentStep: s.currentStep,
      globalScore: s.globalScore,
      completedAt: s.completedAt,
    }))

    // ── Build response ──
    const stats = {
      totalSessions,
      completedSessions,
      inProgressSessions,
      averageDuration,
      averageGlobalScore,
      sessionsByMonth,
      dimensionAverages,
      recentSessions,
      completionRate,
    }

    return success(stats, 'Statistiques CréaScope')
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
