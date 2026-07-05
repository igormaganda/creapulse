// CreaPulse V2 — Visioconférence API Route
import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { success, Errors, handleApiError } from '@/lib/api-response'
import { callZAI } from '@/lib/zai-helper'

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()
    return success({ message: 'Visioconférence data loaded from localStorage on client' })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()

    const body = await request.json()

    if (body.action === 'ai-summary') {
      const { notes, title, type } = body

      if (!notes || !notes.trim()) {
        return Errors.badRequest('Notes de réunion requises pour générer un résumé')
      }

      const messages = [
        {
          role: 'system' as const,
          content: `Tu es un assistant IA spécialisé dans le résumé de réunions pour entrepreneurs français. Réponds en français, de façon concise et structurée (max 250 mots). Formate avec des tirets pour les points clés.`,
        },
        {
          role: 'user' as const,
          content: `Génère un résumé structuré de cette réunion :\n\nTitre : ${title || 'Sans titre'}\nType : ${type || 'Non spécifié'}\n\nNotes :\n${notes}\n\nFournis :\n- Les points clés discutés\n- Les décisions prises\n- Les recommandations`,
        },
      ]

      const result = await callZAI(messages)
      if (result.success) return success({ summary: result.data.content })
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
    return success({ message: 'Visioconférence data saved' })
  } catch (err) {
    return handleApiError(err)
  }
}