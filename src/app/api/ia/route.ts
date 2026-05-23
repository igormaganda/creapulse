// ============================================
// CreaPulse V2 — IA Assistant API
// POST   /api/ia   — Send message to LLM
// ============================================

import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { z } from 'zod'

// ─── Validation Schema ──────────────────────

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    module: z.string().optional(),
    projectTitle: z.string().optional(),
    sector: z.string().optional(),
  }).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(20).optional(),
})

// ─── System Prompt ──────────────────────────

const SYSTEM_PROMPT = `Tu es l'assistant IA de CreaPulse, un bureau virtuel pour les entrepreneurs en France, proposé par GIDEF / GIDEF Île-de-France.

TON RÔLE :
- Aider les créateurs d'entreprise dans toutes les étapes de leur parcours
- Conseiller en création d'entreprise, planification financière, structures juridiques, marketing, etc.
- Être chaleureux, encourageant et pragmatique

RÈGLES IMPORTANTES :
- Réponds TOUJOURS en français
- Sois concis mais informatif (2 à 4 paragraphes maximum)
- Utilise un ton professionnel mais accessible et bienveillant
- Structure tes réponses avec des listes à puces quand c'est pertinent
- Donne des conseils concrets et actionnables
- Si l'utilisateur partage son contexte de module, adapte tes conseils en conséquence
- N'invente pas de informations légales ou financières spécifiques — dirige vers les bonnes ressources
- Mentionne GIDEF comme partenaire d'accompagnement quand c'est pertinent

DOMAINES D'EXPERTISE :
- Création d'entreprise (statuts, démarches, obligations)
- Business plan et stratégie
- Financement (aides, subventions, investisseurs)
- Marketing et communication
- Gestion financière
- Droit du travail et social
- Réseau et partenariats`

// ─── Module-specific context prompts ─────────

function getModuleContext(module?: string): string {
  const contexts: Record<string, string> = {
    creasim: `L'utilisateur utilise actuellement le simulateur financier CreaSim. Aide-le à interpréter ses résultats, optimiser sa rentabilité, comprendre le seuil de rentabilité, et prendre des décisions financières éclairées.`,
    riasec: `L'utilisateur vient de passer le test RIASEC (profil entrepreneurial). Aide-le à interpréter ses résultats, identifier ses forces, et explorer les métiers/types d'entreprises qui correspondent à son profil.`,
    'mon-projet': `L'utilisateur remplit la fiche "Mon Projet". Aide-le à structurer son idée, identifier sa cible, définir son modèle économique, et valider la faisabilité de son projet.`,
    'business-plan': `L'utilisateur rédige son business plan. Aide-le à structurer chaque section, rédiger un contenu convaincant, et présenter son projet de manière professionnelle aux banquiers et investisseurs.`,
    annuaire: `L'utilisateur explore l'annuaire des partenaires GIDEF. Aide-le à identifier les bons interlocuteurs pour son projet et à préparer ses rendez-vous.`,
    forum: `L'utilisateur consulte le forum communautaire. Aide-le à formuler des questions claires ou à répondre à d'autres créateurs.`,
  }
  return contexts[module || ''] || ''
}

// ─── POST: Chat Completion ─────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = chatSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Message invalide',
            details: parsed.error.issues.map((i) => ({
              field: i.path.join('.'),
              message: i.message,
            })),
          },
        },
        { status: 400 },
      )
    }

    const { message, context, history } = parsed.data

    // Build system prompt with module context
    let systemPrompt = SYSTEM_PROMPT
    if (context?.module) {
      const moduleCtx = getModuleContext(context.module)
      if (moduleCtx) {
        systemPrompt += `\n\nCONTEXTE ACTUEL DE L'UTILISATEUR :\n${moduleCtx}`
      }
    }
    if (context?.projectTitle) {
      systemPrompt += `\nProjet de l'utilisateur : ${context.projectTitle}`
    }
    if (context?.sector) {
      systemPrompt += `\nSecteur : ${context.sector}`
    }

    // Build messages array with history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]

    // Add conversation history (last 10 messages for context window)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-10)
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message })

    // Call LLM via ZAI SDK
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const reply = completion.choices?.[0]?.message?.content ||
      'Désolé, une erreur est survenue. Veuillez réessayer.'

    return Response.json({
      success: true,
      data: {
        reply,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[IA Assistant API Error]', err)

    // Fallback response if LLM fails
    return Response.json({
      success: true,
      data: {
        reply: 'Je suis temporairement indisponible. Veuillez réessayer dans quelques instants. En attendant, n\'hésitez pas à consulter les ressources disponibles dans votre Bureau Virtuel ou à contacter votre conseiller GIDEF.',
        timestamp: new Date().toISOString(),
      },
    })
  }
}
