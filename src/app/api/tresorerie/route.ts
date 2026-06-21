import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { callZAI } from '@/lib/zai-helper'

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
      const { solde, entreesThis, sortiesThis, joursCouverture } = body
      const messages = [
        { role: 'system', content: 'Tu es un expert en gestion de trésorerie pour entrepreneurs français. Donne 3-5 recommandations concrètes en français (max 250 mots).' },
        { role: 'user', content: `Solde: ${solde}€, Encaissements ce mois: ${entreesThis}€, Décaissements ce mois: ${sortiesThis}€, Jours de couverture: ${joursCouverture} jours.` },
      ]
      const result = await callZAI(messages)
      if (result.success) return success({ suggestion: result.data.content })
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