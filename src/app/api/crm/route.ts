// CreaPulse V2 — CRM API Route
import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { callZAI } from '@/lib/zai-helper'

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    return success({ message: 'CRM data loaded from localStorage on client' })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()

    const body = await request.json()

    if (body.action === 'ai-analyze') {
      const { contacts, deals } = body
      const contactCount = contacts?.length || 0
      const dealCount = deals?.length || 0
      const pipelineValue = (deals || []).reduce((s: number, d: { valeur: number }) => s + d.valeur, 0)
      const clientCount = (deals || []).filter((d: { stage: string }) => d.stage === 'client').length

      const messages = [
        { role: 'system', content: `Tu es un expert en CRM pour entrepreneurs français. Réponds en français, de façon concise et actionnable (max 300 mots).` },
        { role: 'user', content: `Mon CRM: ${contactCount} contacts, ${dealCount} opportunités, pipeline ${pipelineValue.toLocaleString('fr-FR')} €, ${clientCount} clients. ${deals?.length > 0 ? `Deals: ${JSON.stringify(deals.slice(0, 10).map((d: { contactName: string; valeur: number; stage: string }) => `${d.contactName}: ${d.valeur}€ (${d.stage})`))}` : ''} Donne 3-5 recommandations concrètes.` },
      ]

      const result = await callZAI(messages)
      if (result.success) return success({ suggestion: result.data.content })
      return Errors.unprocessableEntity('IA indisponible')
    }

    return Errors.badRequest('Action non reconnue')
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    return success({ message: 'CRM data saved' })
  } catch (err) {
    return handleApiError(err)
  }
}