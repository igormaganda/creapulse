import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { callZAI } from '@/lib/zai-helper'
import { z } from 'zod'

const tresorerieAiSchema = z.object({
  action: z.literal('ai-analyze'),
  solde: z.number().finite(),
  entreesThis: z.number().finite(),
  sortiesThis: z.number().finite(),
  joursCouverture: z.number().min(0).max(3650),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    return success({ message: 'Treasury data loaded from localStorage' })
  } catch (err) { return handleApiError(err) }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    const body = await request.json()
    if (body.action === 'ai-analyze') {
      const parsed = tresorerieAiSchema.safeParse(body)
      if (!parsed.success) return Errors.validation(parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })))
      const { solde, entreesThis, sortiesThis, joursCouverture } = parsed.data
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [
        { role: 'system', content: 'Tu es un expert en gestion de trésorerie pour entrepreneurs français. Donne 3-5 recommandations concrètes en français (max 250 mots).' },
        { role: 'user', content: `Solde: ${solde}€, Encaissements ce mois: ${entreesThis}€, Décaissements ce mois: ${sortiesThis}€, Jours de couverture: ${joursCouverture} jours.` },
      ]
      const result = await callZAI(messages)
      if (result.success) return success({ suggestion: result.content })
      return Errors.unprocessableEntity('IA indisponible')
    }
    return Errors.badRequest('Action non reconnue')
  } catch (err) { return handleApiError(err) }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    return success({ message: 'Treasury data saved' })
  } catch (err) { return handleApiError(err) }
}