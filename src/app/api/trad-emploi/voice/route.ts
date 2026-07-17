import { NextRequest, NextResponse } from 'next/server'
import { callZAI, type ZAIMessage, aiUnavailableResponse, aiErrorResponse } from '@/lib/zai-helper'

// ─── Types ──────────────────────────────────

interface VoiceRequest {
  message: string
  context: {
    module: string
    section?: string
    projectData?: Record<string, unknown>
  }
}

// ─── Context-aware system prompts ───────────

const BMC_SECTION_LABELS: Record<string, string> = {
  'partenaires-cles': 'Partenaires Clés',
  'activites-cles': 'Activités Clés',
  'ressources-cles': 'Ressources Clés',
  'proposition-valeur': 'Proposition de Valeur',
  'relations-clients': 'Relations Clients',
  'canaux': 'Canaux',
  'segments-clients': 'Segments Clients',
  'structure-couts': 'Structure des Coûts',
  'sources-revenus': 'Sources de Revenus',
}

const BP_SECTION_LABELS: Record<string, string> = {
  resume: 'Résumé opérationnel',
  equipe: "Présentation de l'équipe",
  historique: 'Historique et contexte',
  vision: 'Vision et mission',
  valeurs: 'Valeurs et engagements',
  'etude-marche': 'Étude de marché',
  segmentation: 'Segmentation client',
  concurrence: 'Analyse concurrentielle',
  'strategie-marketing': 'Stratégie marketing',
  'plan-commercial': 'Plan commercial',
  swot: 'Analyse SWOT',
  financement: 'Plan de financement initial',
  'compte-resultat': 'Compte de résultat prévisionnel',
  tresorerie: 'Plan de trésorerie',
  'seuil-rentabilite': 'Seuil de rentabilité',
  investissements: 'Investissements',
  bilan: 'Bilan prévisionnel',
  'statut-juridique': 'Statut juridique',
  localisation: 'Localisation et implantation',
  organisation: 'Organisation et moyens humains',
  production: 'Catalogue produits / services',
  associes: 'Associés et répartition du capital',
  cogerants: 'Co-gérance',
  calendrier: 'Calendrier de réalisation',
}

function buildSystemPrompt(ctx: VoiceRequest['context']): string {
  const { module, section, projectData } = ctx

  // ─── BMC Module ─────────────────────────
  if (module === 'bmc') {
    const sectionLabel = section ? (BMC_SECTION_LABELS[section] || section) : 'le Business Model Canvas'
    return `Tu es un expert en Business Model Canvas. L'utilisateur travaille sur le bloc "${sectionLabel}" de son BMC.
Aide-le à remplir et améliorer ce bloc de manière concrète et actionnable.
Réponds en français, de façon concise (3-5 phrases max), avec des exemples concrets si pertinent.
${projectData ? `\nDonnées actuelles du bloc : ${JSON.stringify(projectData)}` : ''}`
  }

  // ─── Business Plan Module ───────────────
  if (module === 'business-plan') {
    const sectionLabel = section ? (BP_SECTION_LABELS[section] || section) : 'son Business Plan'
    return `Tu es un conseiller en création d'entreprise. L'utilisateur rédige la section "${sectionLabel}" de son business plan.
Aide-le à structurer, compléter ou améliorer cette section.
Réponds en français, de façon concise (3-5 phrases max), avec des conseils pratiques.
${projectData ? `\nContenu actuel de la section : ${JSON.stringify(projectData)}` : ''}`
  }

  // ─── Discovery / CreaScope Module ──────
  if (module === 'creascope' || module === 'creascope-pipeline') {
    return `Tu es un accompagnateur pour créateurs d'entreprise. Aide l'utilisateur à explorer son projet de création.
Pose des questions stimulantes, aide à clarifier l'idée, identifie les points forts et les zones de doute.
Réponds en français, de façon bienveillante et concise (3-5 phrases max).
${section ? `Phase actuelle : ${section}` : ''}
${projectData ? `\nContexte du projet : ${JSON.stringify(projectData)}` : ''}`
  }

  // ─── Counselor Workshop / Atelier ──────
  if (module === 'tremplin') {
    return `Tu es un assistant pour les ateliers avec un conseiller. Aide le créateur à préparer ses réponses et ses arguments.
Réponds en français, de façon concise (3-5 phrases max).
${section ? `Thème de l'atelier : ${section}` : ''}
${projectData ? `\nDonnées du projet : ${JSON.stringify(projectData)}` : ''}`
  }

  // ─── Financial Forecast ────────────────
  if (module === 'financier' || module === 'tresorerie') {
    return `Tu es un expert en prévisionnel financier pour la création d'entreprise.
Aide l'utilisateur à comprendre et construire ses prévisions financières (charges, revenus, trésorerie, seuil de rentabilité).
Réponds en français, de façon concise (3-5 phrases max), avec des chiffres ou formules si pertinent.
${section ? `Section : ${section}` : ''}
${projectData ? `\nDonnées financières actuelles : ${JSON.stringify(projectData)}` : ''}`
  }

  // ─── Market Analysis ───────────────────
  if (module === 'marche') {
    return `Tu es un analyste de marché spécialisé dans la création d'entreprise.
Aide l'utilisateur à analyser son marché, sa clientèle cible, sa concurrence et son positionnement.
Réponds en français, de façon concise (3-5 phrases max), avec des exemples concrets.
${section ? `Section : ${section}` : ''}
${projectData ? `\nDonnées de marché : ${JSON.stringify(projectData)}` : ''}`
  }

  // ─── Legal / Juridique ─────────────────
  if (module === 'juridique') {
    return `Tu es un conseiller juridique pour créateurs d'entreprise.
Aide l'utilisateur à comprendre les formes juridiques, les obligations légales et les démarches administratives.
Réponds en français, de façon concise (3-5 phrases max). Précise que tes conseils sont informatifs et ne remplacent pas un avis juridique formel.
${section ? `Sujet : ${section}` : ''}
${projectData ? `\nContexte : ${JSON.stringify(projectData)}` : ''}`
  }

  // ─── Default: General entrepreneurial support ──
  return `Tu es un assistant vocal TradEmploi pour CreaPulse, un outil d'accompagnement à la création d'entreprise.
Aide l'utilisateur dans sa démarche entrepreneuriale avec des conseils pratiques et concrets.
Réponds en français, de façon concise (3-5 phrases max).
${module ? `Module actuel : ${module}` : ''}
${section ? `Section : ${section}` : ''}`
}

// ─── POST Handler ───────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VoiceRequest

    const { message, context } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return aiErrorResponse('Le message est requis.', 'EMPTY_MESSAGE')
    }

    if (!context || !context.module) {
      // Allow requests without module context — use default
      const ctx: VoiceRequest['context'] = { module: '', section: context?.section, projectData: context?.projectData }
      return handleVoiceRequest(message, ctx)
    }

    return handleVoiceRequest(message, context)
  } catch (err) {
    console.error('[TradEmploi Voice API] Error:', err)
    return aiErrorResponse('Erreur serveur interne.', 'INTERNAL_ERROR')
  }
}

async function handleVoiceRequest(message: string, context: VoiceRequest['context']) {
  const systemPrompt = buildSystemPrompt(context)

  const messages: ZAIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message.trim() },
  ]

  const result = await callZAI(messages, {
    temperature: 0.7,
    max_tokens: 500,
  })

  if (!result.success) {
    return aiUnavailableResponse()
  }

  return NextResponse.json({
    success: true,
    data: {
      response: result.content,
    },
  })
}