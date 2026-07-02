// CreaPulse V2 — CRM API Route
import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { callZAI } from '@/lib/zai-helper'
import { z } from 'zod'

const crmAiAnalyzeSchema = z.object({
  action: z.literal('ai-analyze'),
  contacts: z.array(z.record(z.string(), z.unknown())).optional(),
  deals: z.array(z.record(z.string(), z.unknown())).optional(),
})

const crmSaveSchema = z.object({
  action: z.literal('save'),
  contacts: z.array(z.record(z.string(), z.unknown())),
  deals: z.array(z.record(z.string(), z.unknown())),
})

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

    // Validate body based on action
    if (body.action === 'ai-analyze') {
      const parsed = crmAiAnalyzeSchema.safeParse(body)
      if (!parsed.success) return Errors.validation(parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })))
      const { contacts, deals } = parsed.data
      const contactCount = contacts?.length || 0
      const dealCount = deals?.length || 0
      const pipelineValue = (deals || []).reduce((s: number, d: Record<string, unknown>) => s + (typeof d.valeur === 'number' ? d.valeur : 0), 0)
      const clientCount = (deals || []).filter((d: Record<string, unknown>) => d.stage === 'client').length

      const messages: Array<{ role: 'system' | 'user'; content: string }> = [
        { role: 'system', content: `Tu es un expert en CRM pour entrepreneurs français. Réponds en français, de façon concise et actionnable (max 300 mots).` },
        { role: 'user', content: `Mon CRM: ${contactCount} contacts, ${dealCount} opportunités, pipeline ${pipelineValue.toLocaleString('fr-FR')} €, ${clientCount} clients. ${deals?.length ? `Deals: ${JSON.stringify(deals.slice(0, 10).map((d: Record<string, unknown>) => `${d.contactName}: ${d.valeur}€ (${d.stage})`))}` : ''} Donne 3-5 recommandations concrètes.` },
      ]

      const result = await callZAI(messages)
      if (result.success) return success({ suggestion: result.content })
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