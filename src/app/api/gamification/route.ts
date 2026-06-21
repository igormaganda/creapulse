import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { success, Errors, handleApiError } from '@/lib/api-response'

// ─── Mock leaderboard data ───

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Sophie Martin', avatar: 'SM', level: 'Maître', xp: 1850 },
  { rank: 2, name: 'Lucas Bernard', avatar: 'LB', level: 'Expert', xp: 1420 },
  { rank: 3, name: 'Camille Dubois', avatar: 'CD', level: 'Expert', xp: 1280 },
  { rank: 4, name: 'Thomas Petit', avatar: 'TP', level: 'Avancé', xp: 980 },
  { rank: 5, name: 'Emma Leroy', avatar: 'EL', level: 'Avancé', xp: 870 },
  { rank: 6, name: 'Hugo Moreau', avatar: 'HM', level: 'Avancé', xp: 756 },
  { rank: 7, name: 'Léa Laurent', avatar: 'LL', level: 'Confirmé', xp: 620 },
  { rank: 8, name: 'Nathan Simon', avatar: 'NS', level: 'Confirmé', xp: 540 },
  { rank: 9, name: 'Chloé Michel', avatar: 'CM', level: 'Confirmé', xp: 475 },
  { rank: 10, name: 'Maxime Garcia', avatar: 'MG', level: 'Confirmé', xp: 410 },
  { rank: 11, name: 'Jade Thomas', avatar: 'JT', level: 'Confirmé', xp: 350 },
  { rank: 12, name: 'Louis Roux', avatar: 'LR', level: 'Débutant', xp: 280 },
  { rank: 13, name: 'Inès Robert', avatar: 'IR', level: 'Débutant', xp: 195 },
  { rank: 14, name: 'Raphaël Richard', avatar: 'RR', level: 'Débutant', xp: 120 },
  { rank: 15, name: 'Alice Durand', avatar: 'AD', level: 'Débutant', xp: 85 },
  { rank: 16, name: 'Gabriel Fournier', avatar: 'GF', level: 'Débutant', xp: 45 },
  { rank: 17, name: 'Manon Girard', avatar: 'MG', level: 'Débutant', xp: 30 },
]

// ─── GET: Return leaderboard + user stats ───

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return auth

    // Mock user stats (in production, fetch from DB)
    const userStats = {
      xp: 0,
      level: 'Débutant',
      streak: 0,
      achievementsUnlocked: 0,
      challengesCompleted: 0,
    }

    return success({
      leaderboard: MOCK_LEADERBOARD,
      userStats,
    }, 'Données de gamification chargées')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Accept a challenge ───

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return auth

    const body = await request.json()
    const { challengeId } = body as { challengeId?: string }

    if (!challengeId || typeof challengeId !== 'string') {
      return Errors.validation({ challengeId: 'challengeId is required' }, 'Identifiant de défi manquant')
    }

    // Mock: in production, persist to DB
    return success({
      challengeId,
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    }, 'Défi accepté avec succès')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PUT: Update challenge progress ───

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return auth

    const body = await request.json()
    const { challengeId, progress, xpGained } = body as {
      challengeId?: string
      progress?: number
      xpGained?: number
    }

    if (!challengeId || typeof challengeId !== 'string') {
      return Errors.validation({ challengeId: 'challengeId is required' }, 'Identifiant de défi manquant')
    }

    if (typeof progress !== 'number' || progress < 0) {
      return Errors.validation({ progress: 'progress must be a non-negative number' }, 'Progression invalide')
    }

    // Mock: in production, persist to DB
    return success({
      challengeId,
      progress,
      xpGained: xpGained ?? 0,
      updatedAt: new Date().toISOString(),
    }, 'Progression mise à jour')
  } catch (err) {
    return handleApiError(err)
  }
}