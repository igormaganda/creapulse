// ============================================
// CreaPulse V2 — Business Plan IA API
// GET    /api/business-plan           — Retrieve saved BP sections
// PUT    /api/business-plan           — Save BP sections
// POST   /api/business-plan           — AI suggestion (action=ai-suggest)
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import ZAI from 'z-ai-web-dev-sdk'

// ─── Validation Schemas ──────────────────────

const aiSuggestSchema = z.object({
  action: z.literal('ai-suggest'),
  sectionId: z.string(),
  sectionTitle: z.string(),
  existingContent: z.string().optional(),
  projectContext: z.string().optional(),
})

const saveBpSchema = z.object({
  sections: z.record(z.string(), z.unknown()).optional(),
  bpStatus: z.string().optional(),
})

// ─── Helper: Auth from request ───────────────

async function getAuth(request: NextRequest) {
  const cookieToken = request.cookies.get('session')?.value
  const headerToken = getTokenFromHeader(request)
  const token = cookieToken || headerToken
  if (!token) throw Object.assign(new Error('No session token found'), { code: 'UNAUTHORIZED' })
  return verifyToken(token)
}

// ─── GET: Retrieve business plan ─────────────

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request)

    const journey = await db.creatorJourney.findUnique({
      where: { userId: payload.userId },
      select: {
        bpSections: true,
        bpStatus: true,
        bpScore: true,
        bpGeneratedAt: true,
        bpValidatedAt: true,
        bpValidatedBy: true,
        projectTitle: true,
        projectSector: true,
        projectStage: true,
        targetAudience: true,
        valueProposition: true,
      },
    })

    if (!journey) {
      return success(
        {
          sections: {},
          bpStatus: 'NOT_STARTED',
          bpScore: null,
          projectContext: null,
        },
        'Aucun business plan enregistré',
      )
    }

    return success(
      {
        sections: journey.bpSections ?? {},
        bpStatus: journey.bpStatus,
        bpScore: journey.bpScore,
        bpGeneratedAt: journey.bpGeneratedAt,
        bpValidatedAt: journey.bpValidatedAt,
        projectContext: {
          projectTitle: journey.projectTitle,
          projectSector: journey.projectSector,
          projectStage: journey.projectStage,
          targetAudience: journey.targetAudience,
          valueProposition: journey.valueProposition,
        },
      },
      'Business plan chargé',
    )
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée — veuillez vous reconnecter')
      }
    }
    return handleApiError(err)
  }
}

// ─── PUT: Save business plan ─────────────────

export async function PUT(request: NextRequest) {
  try {
    const payload = await getAuth(request)

    const body = await request.json()
    const parsed = saveBpSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      )
    }

    const { sections, bpStatus } = parsed.data

    // Calculate completion
    const filledSections = sections
      ? Object.values(sections).filter(
          (v) =>
            typeof v === 'string' && v.trim().length > 0 ||
            typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 0 ||
            Array.isArray(v) && v.length > 0,
        ).length
      : 0
    const totalSections = 22
    const bpScore = Math.round((filledSections / totalSections) * 100)

    // Determine status
    let status = (bpStatus ?? 'IN_PROGRESS') as string
    if (filledSections === 0) status = 'NOT_STARTED'
    else if (filledSections === totalSections) status = 'DRAFT'
    else status = 'IN_PROGRESS'

    // Upsert CreatorJourney bp fields
    const journey = await db.creatorJourney.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        bpSections: (sections ?? {}) as Prisma.InputJsonValue,
        bpStatus: status as 'NOT_STARTED' | 'IN_PROGRESS' | 'GENERATING' | 'DRAFT' | 'REVIEW' | 'VALIDATED' | 'EXPORTED',
        bpScore,
      },
      update: {
        bpSections: (sections ?? {}) as Prisma.InputJsonValue,
        bpStatus: status as 'NOT_STARTED' | 'IN_PROGRESS' | 'GENERATING' | 'DRAFT' | 'REVIEW' | 'VALIDATED' | 'EXPORTED',
        bpScore,
        bpGeneratedAt: new Date(),
      },
    })

    return success(
      {
        id: journey.id,
        bpStatus: status,
        bpScore,
        filledSections,
        totalSections,
      },
      'Business plan sauvegardé avec succès',
    )
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée — veuillez vous reconnecter')
      }
    }
    return handleApiError(err)
  }
}

// ─── POST: AI Suggestion ─────────────────────

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request)

    const body = await request.json()
    const parsed = aiSuggestSchema.safeParse(body)

    if (!parsed.success) {
      return Errors.validation(
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      )
    }

    const { sectionId, sectionTitle, existingContent, projectContext } = parsed.data

    // Fetch project context if not provided
    let context = projectContext || ''
    if (!context) {
      const journey = await db.creatorJourney.findUnique({
        where: { userId: payload.userId },
        select: {
          projectTitle: true,
          projectSector: true,
          projectStage: true,
          targetAudience: true,
          valueProposition: true,
          projectDescription: true,
        },
      })
      if (journey) {
        const parts: string[] = []
        if (journey.projectTitle) parts.push(`Projet: ${journey.projectTitle}`)
        if (journey.projectSector) parts.push(`Secteur: ${journey.projectSector}`)
        if (journey.projectStage) parts.push(`Stade: ${journey.projectStage}`)
        if (journey.targetAudience) parts.push(`Cible: ${journey.targetAudience}`)
        if (journey.valueProposition) parts.push(`Valeur: ${journey.valueProposition}`)
        if (journey.projectDescription) parts.push(`Description: ${journey.projectDescription}`)
        context = parts.join('\n')
      }
    }

    // Build system prompt
    const systemPrompt = `Tu es un expert en création d'entreprise et en rédaction de business plans. Tu aides des entrepreneurs francophones à rédiger un business plan professionnel et convaincant.

RÈGLES IMPORTANTES :
- Réponds TOUJOURS en français
- Sois concis mais professionnel (200-400 mots par section)
- Utilise un ton formel et encourageant
- Structure le contenu avec des paragraphes clairs
- Adapte les conseils au contexte du projet fourni
- Si du contenu existe déjà, améliore-le et complète-le plutôt que de le remplacer
- Utilise des données concrètes et des exemples quand c'est pertinent

${context ? `CONTEXTE DU PROJET :\n${context}` : 'Aucun contexte de projet fourni. Génére un contenu générique adaptable.'}`

    // Build user prompt
    let userPrompt = `Génère un contenu professionnel pour la section "${sectionTitle}" d'un business plan.`

    if (existingContent && existingContent.trim()) {
      userPrompt += `\n\nContenu actuel de l'utilisateur :\n"${existingContent}"\n\nAméliore et complète ce contenu. Garde les informations importantes déjà présentes.`
    } else {
      userPrompt += `\n\nRédige un contenu complet et structuré pour cette section. L'utilisateur n'a encore rien écrit.`
    }

    userPrompt += `\n\nSection ID: ${sectionId}`

    // Call LLM via ZAI SDK
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    })

    const suggestion = completion.choices?.[0]?.message?.content || 'Désolé, une erreur est survenue lors de la génération. Veuillez réessayer.'

    return success(
      {
        sectionId,
        suggestion,
      },
      'Suggestion IA générée avec succès',
    )
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) {
      const authErr = err as { code: string }
      if (authErr.code === 'TOKEN_EXPIRED' || authErr.code === 'UNAUTHORIZED') {
        return Errors.unauthorized('Session expirée — veuillez vous reconnecter')
      }
    }
    return handleApiError(err)
  }
}
