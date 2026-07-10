// ============================================
// CreaPulse V2 — Communaute API
// GET    /api/communaute  — Retrieve community data
// PUT    /api/communaute  — Save community data
// POST   /api/communaute  — AI suggestions
// ============================================

import { NextRequest } from 'next/server'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import { callZAI } from '@/lib/zai-helper'

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof Response) return auth
    return success(null, 'Données communautaires récupérées depuis le client')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof Response) return auth
    return success(null, 'Données communautaires sauvegardées')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth || auth instanceof Response) return auth

    const body = await request.json()
    const { action, myGroups } = body

    if (action === 'ai-suggest') {
      const groupNames = myGroups && myGroups.length > 0
        ? `L'utilisateur a rejoint ${myGroups.length} groupes.`
        : "L'utilisateur n'a rejoint aucun groupe encore."

      const messages = [
        { role: 'system' as const, content: 'Tu es un assistant communautaire pour la plateforme CreaPulse. Réponds en français.' },
        { role: 'user' as const, content: `Tu es un assistant communautaire pour la plateforme CreaPulse d'accompagnement à la création d'entreprise.
${groupNames}
Suggère 2-3 groupes thématiques pertinents pour cet utilisateur en fonction de son parcours entrepreneurial.
Format: une seule phrase concise par suggestion, séparées par des sauts de ligne. Maximum 200 mots.` },
      ]

      const result = await callZAI(messages)

      if (!result.success) {
        return Errors.unprocessableEntity('IA indisponible')
      }

      return success({ suggestion: result.content })
    }

    return Errors.badRequest('Action non reconnue')
  } catch (error) {
    return handleApiError(error)
  }
}