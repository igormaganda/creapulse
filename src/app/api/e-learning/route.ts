import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { callZAI } from '@/lib/zai-helper'

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    return success({ message: 'E-Learning data loaded from localStorage' })
  } catch (err) { return handleApiError(err) }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const body = await request.json()
    if (body.action === 'ai-recommend') {
      const { completedModules, xp } = body
      const messages = [
        { role: 'system', content: 'Tu es un conseiller en formation entrepreneuriale. Propose 3-4 formations adaptées en français (max 200 mots).' },
        { role: 'user', content: `L'entrepreneur a ${xp || 0} XP et a complété : ${completedModules?.join(', ') || 'aucune'}. Recommande les prochaines formations.` },
      ]
      const result = await callZAI(messages)
      if (result.success) return success({ recommendation: result.data.content })
      return Errors.unprocessableEntity('IA indisponible')
    }
    return Errors.badRequest('Action non reconnue')
  } catch (err) { return handleApiError(err) }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    return success({ message: 'E-Learning data saved' })
  } catch (err) { return handleApiError(err) }
}