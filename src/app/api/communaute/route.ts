import { NextRequest } from 'next/server'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { withAuth } from '@/lib/auth-helper'
import { callZAI } from '@/lib/zai-helper'

export const GET = withAuth(async (req) => {
  try {
    return success(null, 'Données communautaires récupérées depuis le client')
  } catch (error) {
    return handleApiError(error)
  }
})

export const PUT = withAuth(async (req) => {
  try {
    return success(null, 'Données communautaires sauvegardées')
  } catch (error) {
    return handleApiError(error)
  }
})

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json()
    const { action, myGroups } = body

    if (action === 'ai-suggest') {
      const groupNames = myGroups && myGroups.length > 0
        ? `L'utilisateur a rejoint ${myGroups.length} groupes.`
        : "L'utilisateur n'a rejoint aucun groupe encore."

      const prompt = `Tu es un assistant communautaire pour la plateforme CreaPulse d'accompagnement à la création d'entreprise.
${groupNames}
Suggère 2-3 groupes thématiques pertinents pour cet utilisateur en fonction de son parcours entrepreneurial.
Format: une seule phrase concise par suggestion, séparées par des sauts de ligne. Maximum 200 mots.`

      const result = await callZAI(prompt, 'communaute-ai-suggest')

      if (!result) {
        return Errors.aiError()
      }

      return success({ suggestion: result })
    }

    return Errors.invalidAction()
  } catch (error) {
    return handleApiError(error)
  }
})