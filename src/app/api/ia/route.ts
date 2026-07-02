// ============================================
// CreaPulse V2 — IA Assistant API
// POST   /api/ia   — Send message to LLM
//   - action: 'chat' (default)  → chat completion
//   - action: 'suggestions'     → contextual suggestion chips
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { callZAI } from '@/lib/zai-helper'
import { buildFTContext, contextToPrompt } from '@/lib/ft-enrichment'
import { withAuth } from '@/lib/api-auth'
import { aiRateLimit } from '@/lib/rate-limit'
import { Errors } from '@/lib/api-response'

// ─── Validation Schemas ──────────────────────

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    module: z.string().optional(),
    moduleDescription: z.string().optional(),
    moduleData: z.record(z.string()).optional(),
    projectTitle: z.string().optional(),
    sector: z.string().optional(),
  }).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(20).optional(),
  action: z.enum(['chat', 'suggestions']).optional().default('chat'),
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

// ─── Module-specific context prompts (all 35 modules) ─────────

function getModuleContext(module?: string): string {
  const contexts: Record<string, string> = {
    // ═══ PARCOURS (8) ═══
    'profil-createur': `L'utilisateur configure son profil créateur entrepreneurial. Aide-le à définir son parcours, ses motivations et ses compétences clés pour un accompagnement personnalisé.`,
    'mon-projet': `L'utilisateur remplit la fiche "Mon Projet". Aide-le à structurer son idée, identifier sa cible, définir son modèle économique, et valider la faisabilité de son projet.`,
    'vision': `L'utilisateur structure sa vision à long terme et ses objectifs stratégiques. Aide-le à clarifier sa vision, ses ambitions et les étapes clés de son parcours entrepreneurial.`,
    'pepites': `L'utilisateur joue au Pépites Game (évaluation des soft skills entrepreneuriaux). Aide-le à comprendre ses résultats, identifier ses compétences clés et découvrir ses axes de progression.`,
    'riasec': `L'utilisateur vient de passer le test RIASEC (profil entrepreneurial). Aide-le à interpréter ses résultats, identifier ses forces, et explorer les métiers/types d'entreprises qui correspondent à son profil.`,
    'kiviat': `L'utilisateur consulte son radar Kiviat (évaluation de compétences entrepreneuriales). Aide-le à analyser ses forces et faiblesses sur chaque dimension et à définir un plan de progression.`,
    'bilan-ia': `L'utilisateur consulte son bilan IA — une synthèse intelligente de son parcours entrepreneurial. Aide-le à interpréter les recommandations et à prioriser ses prochaines actions.`,
    'creascope': `L'utilisateur est dans une session CréaScope (pipeline diagnostique entrepreneurial). Aide-le dans son parcours de création d'entreprise avec des conseils contextualisés à chaque étape du pipeline.`,

    // ═══ STRATÉGIE (12) ═══
    'marche': `L'utilisateur étudie son marché cible, ses concurrents et son positionnement. Aide-le à analyser le marché, identifier sa niche, comprendre ses concurrents et définir un avantage compétitif.`,
    'juridique': `L'utilisateur choisit le statut juridique adapté à son projet. Aide-le à comparer les options (auto-entrepreneur, SAS, SARL, etc.) en fonction de sa situation et de ses objectifs.`,
    'financier': `L'utilisateur structure son plan financier prévisionnel. Aide-le à estimer ses charges, revenus, besoin en fonds de roulement et à construire des prévisions réalistes.`,
    'creasim': `L'utilisateur utilise le simulateur financier CreaSim. Aide-le à interpréter ses résultats, optimiser sa rentabilité, comprendre le seuil de rentabilité, et prendre des décisions financières éclairées.`,
    'bmc': `L'utilisateur construit son Business Model Canvas. Aide-le à remplir les 9 blocs du BMC de manière cohérente et à identifier les points faibles de son modèle d'affaires.`,
    'business-plan': `L'utilisateur rédige son business plan. Aide-le à structurer chaque section, rédiger un contenu convaincant, et présenter son projet de manière professionnelle aux banquiers et investisseurs.`,
    'pitch-deck': `L'utilisateur crée un pitch deck pour présenter son projet. Aide-le à structurer ses slides, raconter une histoire convaincante et préparer ses arguments pour les investisseurs.`,
    'swot': `L'utilisateur réalise une analyse SWOT de son projet. Aide-le à identifier de manière exhaustive ses forces, faiblesses, opportunités et menaces, et à en tirer des actions concrètes.`,
    'gestion-temps': `L'utilisateur utilise la matrice d'Eisenhower pour gérer son temps. Aide-le à prioriser ses tâches, identifier les activités à déléguer ou éliminer, et optimiser sa productivité entrepreneuriale.`,
    'gestion-crise': `L'utilisateur identifie les risques et prépare un plan de résilience. Aide-le à cartographier les menaces, définir des plans d'action de crise et construire un business continuity plan.`,
    'marketing-commerciale': `L'utilisateur planifie sa stratégie marketing et commerciale. Aide-le à définir ses personas, choisir ses canaux d'acquisition, élaborer son mix marketing et fixer ses KPIs.`,
    'mind-map': `L'utilisateur organise ses idées avec une carte mentale. Aide-le à structurer sa pensée, explorer des connexions entre ses idées et identifier les axes de développement de son projet.`,

    // ═══ ÉCOSYSTÈME (4) ═══
    'annuaire': `L'utilisateur explore l'annuaire des partenaires GIDEF. Aide-le à identifier les bons interlocuteurs pour son projet et à préparer ses rendez-vous avec les experts et organismes partenaires.`,
    'forum': `L'utilisateur consulte le forum communautaire. Aide-le à formuler des questions claires, à engager la discussion avec d'autres créateurs et à tirer parti de l'intelligence collective.`,
    'messages': `L'utilisateur consulte ses messages avec son conseiller. Aide-le à préparer ses échanges, structurer ses questions et maximiser la valeur de ses séances de suivi.`,
    'mentorat': `L'utilisateur explore le programme de mentorat. Aide-le à comprendre les bénéfices du mentorat, à identifier le profil de mentor adapté et à préparer sa demande.`,

    // ═══ PILOTAGE (11) ═══
    'tremplin': `L'utilisateur recherche des dispositifs d'aide pour lancer son activité. Aide-le à identifier les aides, subventions et financements disponibles (ARE, ACCRE, BPI, etc.) adaptés à sa situation.`,
    'passeport': `L'utilisateur consulte son passeport entrepreneurial pour certifier son parcours. Aide-le à valoriser ses compétences acquises et à préparer sa certification.`,
    'certifications': `L'utilisateur gère ses certifications obtenues. Aide-le à comprendre la valeur de chaque certification et à identifier les prochaines étapes de qualification.`,
    'telechargements': `L'utilisateur télécharge ses documents de suivi. Aide-le à identifier les documents utiles pour ses démarches administratives, bancaires ou de présentation.`,
    'vie-privee': `L'utilisateur gère ses données personnelles et consentements RGPD. Aide-le à comprendre ses droits, à exporter ses données ou à demander leur suppression.`,
    'objectifs-smart': `L'utilisateur définit des objectifs SMART pour son projet. Aide-le à formuler des objectifs Spécifiques, Mesurables, Atteignables, Pertinents et Temporels, et à suivre leur avancement.`,
    'cloture-rebond': `L'utilisateur gère une clôture d'entreprise ou un rebond professionnel. Aide-le avec les formalités de fermeture, les alternatives (reprise, pivot) et les dispositifs de soutien au rebond.`,
    'satisfaction-feedback': `L'utilisateur remplit une enquête de satisfaction NPS. Aide-le à fournir un retour constructif sur son parcours et son accompagnement dans le programme PAA.`,
    'gamification': `L'utilisateur consulte sa progression gamifiée. Aide-le à comprendre les mécaniques de progression, les classements et à rester motivé dans son parcours entrepreneurial.`,
  }
  return contexts[module || ''] || ''
}

// ─── Pre-defined suggestion fallbacks (for suggestions action) ───

const SUGGESTION_FALLBACKS: Record<string, string[]> = {
  // ═══ PARCOURS ═══
  'profil-createur': [
    'Quelles informations dois-je renseigner dans mon profil ?',
    'Comment mon profil influence-t-il mon accompagnement ?',
    'Comment valoriser mes compétences dans mon profil ?',
  ],
  'mon-projet': [
    'Comment valider mon idée de projet ?',
    'Quels sont les erreurs courantes à éviter ?',
    'Comment trouver mon client cible ?',
  ],
  'vision': [
    'Comment définir une vision claire pour mon entreprise ?',
    'Quels objectifs stratégiques fixer pour les 3 prochaines années ?',
    'Comment aligner ma vision avec mon business model ?',
  ],
  'pepites': [
    'Comment améliorer mes scores Kiviat ?',
    'Que signifient mes résultats Pépites ?',
    'Quelles compétences dois-je développer en priorité ?',
  ],
  'riasec': [
    'Que signifie mon profil RIASEC ?',
    'Quels métiers me correspondent le mieux ?',
    'Comment utiliser mes forces dans mon projet ?',
  ],
  'kiviat': [
    'Comment interpréter mon radar Kiviat ?',
    'Quelles sont mes compétences les plus fortes ?',
    'Comment améliorer mes axes faibles ?',
  ],
  'bilan-ia': [
    'Que dit mon bilan IA sur mon parcours ?',
    'Quelles sont mes priorités d\'action recommandées ?',
    'Comment améliorer mon score global ?',
  ],
  'creascope': [
    'Comment préparer ma session CréaScope ?',
    'Que se passe-t-il pendant le pipeline diagnostique ?',
    'Comment utiliser le plan d\'action CréaScope ?',
  ],

  // ═══ STRATÉGIE ═══
  'marche': [
    'Comment réaliser une étude de marché efficace ?',
    'Quels outils pour analyser mes concurrents ?',
    'Comment identifier ma niche de marché ?',
  ],
  'juridique': [
    'Quel statut juridique choisir pour mon projet ?',
    'Auto-entrepreneur ou SAS : que privilégier ?',
    'Quelles sont mes obligations légales de départ ?',
  ],
  'financier': [
    'Comment estimer mon besoin en fonds de roulement ?',
    'Quels postes de charges prévoir dans mon prévisionnel ?',
    'Comment construire un plan de trésorerie réaliste ?',
  ],
  'creasim': [
    'Comment améliorer ma rentabilité ?',
    'Quel seuil de rentabilité viser ?',
    'Comment réduire mes charges fixes ?',
  ],
  'bmc': [
    'Comment bien remplir le bloc "Proposition de valeur" ?',
    'Quels canaux de distribution choisir ?',
    'Comment identifier mes segments de clientèle ?',
  ],
  'business-plan': [
    'Comment structurer mon business plan ?',
    'Quelles sections sont essentielles ?',
    'Comment convaincre un banquier avec mon BP ?',
  ],
  'pitch-deck': [
    'Combien de slides pour un bon pitch deck ?',
    'Comment captiver l\'attention dès la première slide ?',
    'Quels chiffres clés inclure dans mon pitch ?',
  ],
  'swot': [
    'Comment différencier forces et opportunités ?',
    'Quelles menaces examiner en priorité ?',
    'Comment transformer mes faiblesses en opportunités ?',
  ],
  'gestion-temps': [
    'Comment prioriser mes tâches avec Eisenhower ?',
    'Quelles tâches dois-je déléguer en priorité ?',
    'Comment éviter la procrastination ?',
  ],
  'gestion-crise': [
    'Quels sont les risques les plus courants pour une startup ?',
    'Comment construire un plan de continuité d\'activité ?',
    'Quelle trésorerie de secours prévoir ?',
  ],
  'marketing-commerciale': [
    'Comment définir mes personas clients ?',
    'Quels canaux marketing pour un petit budget ?',
    'Comment mesurer l\'efficacité de mes actions marketing ?',
  ],
  'mind-map': [
    'Comment structurer ma carte mentale efficacement ?',
    'Quelles branches principales pour mon projet ?',
    'Comment passer de la carte mentale au plan d\'action ?',
  ],

  // ═══ ÉCOSYSTÈME ═══
  'annuaire': [
    'Quel partenaire contacter en premier ?',
    'Comment préparer mon rendez-vous avec un expert ?',
    'Quels organismes peuvent m\'aider au financement ?',
  ],
  'forum': [
    'Comment poser une question efficace sur le forum ?',
    'Quels sujets abordent les autres créateurs ?',
    'Comment trouver un partenaire via le forum ?',
  ],
  'messages': [
    'Comment préparer ma session avec mon conseiller ?',
    'Quels documents avoir sous la main pour le suivi ?',
    'Comment suivre l\'avancement de mon dossier ?',
  ],
  'mentorat': [
    'Comment trouver le bon mentor pour mon projet ?',
    'Quels bénéfices puis-je tirer du mentorat ?',
    'Comment préparer ma première rencontre avec un mentor ?',
  ],

  // ═══ PILOTAGE ═══
  'tremplin': [
    'Quelles aides suis-je éligible de demander ?',
    'Comment obtenir l\'ARE et l\'ACCRE simultanément ?',
    'Quels financements BPI France pour mon secteur ?',
  ],
  'passeport': [
    'Comment valoriser mon passeport entrepreneurial ?',
    'Quelles certifications puis-je obtenir ?',
    'Mon passeport est-il reconnu par les banques ?',
  ],
  'certifications': [
    'Quelle certification est la plus valorisante pour mon projet ?',
    'Comment préparer une certification compétences ?',
    'Mes certifications sont-elles utiles pour obtenir un financement ?',
  ],
  'telechargements': [
    'Quels documents télécharger pour ma demande de prêt ?',
    'Comment générer un résumé de mon projet en PDF ?',
    'Quels documents préparer pour le Créancier ou le CFE ?',
  ],
  'vie-privee': [
    'Comment exporter toutes mes données ?',
    'Quels sont mes droits RGPD sur la plateforme ?',
    'Comment supprimer définitivement mon compte ?',
  ],
  'objectifs-smart': [
    'Comment formuler un objectif SMART efficace ?',
    'Quels objectifs prioritaires pour les 3 prochains mois ?',
    'Comment suivre et ajuster mes objectifs ?',
  ],
  'cloture-rebond': [
    'Quelles sont les formalités pour fermer mon entreprise ?',
    'Comment rebondir après un échec entrepreneurial ?',
    'Quels dispositifs existent pour le rebond ?',
  ],
  'satisfaction-feedback': [
    'Comment donner un retour constructif ?',
    'Mon avis influence-t-il le programme PAA ?',
    'Comment accéder aux résultats de l\'enquête ?',
  ],
  'gamification': [
    'Comment gagner plus de points sur la plateforme ?',
    'Quels défis sont disponibles pour progresser ?',
    'Comment monter dans le classement ?',
  ],
}

const DEFAULT_SUGGESTIONS = [
  'Comment créer mon entreprise ?',
  'Quelles aides sont disponibles ?',
  'Comment trouver un conseiller ?',
]

// ─── FT enrichment keywords ─────────────────

const FT_ENRICH_KEYWORDS = [
  'offre', 'aide', 'formation', 'marché', 'emploi',
  'recrutement', 'salaire', 'contrat', 'embauche',
  'subvention', 'financement', 'stage', 'alternance',
]

function shouldEnrichWithFT(message: string, module?: string): boolean {
  const lowerMsg = message.toLowerCase()
  const lowerModule = (module || '').toLowerCase()
  if (lowerModule === 'creascope' || lowerModule === 'pipeline') return true
  return FT_ENRICH_KEYWORDS.some(kw => lowerMsg.includes(kw))
}

// ─── POST: Main handler ─────────────────

export async function POST(request: NextRequest) {
  try {
    // Authentication required
    const auth = await withAuth(request)
    if (!auth) return Errors.unauthorized()

    // Rate limit: 20 AI requests per minute per user
    const rl = aiRateLimit.check(auth.userId)
    if (!rl.allowed) {
      return Response.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Trop de requêtes IA. Réessayez dans une minute.' } },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        },
      )
    }

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

    const { message, context, history, action } = parsed.data

    // ─── Action: suggestions ───
    if (action === 'suggestions') {
      const modCode = context?.module || ''
      const fallback = SUGGESTION_FALLBACKS[modCode] || DEFAULT_SUGGESTIONS

      // Try LLM for dynamic suggestions, fallback to pre-defined
      try {
        const moduleLabel = context?.moduleDescription || modCode || 'le module actuel'
        const suggestionPrompt = `Tu es l'assistant IA de CreaPulse. L'utilisateur se trouve dans le module "${moduleLabel}".
Génère exactement 3 suggestions de questions courtes et utiles (15-20 mots max chacune) que l'utilisateur pourrait poser à l'assistant IA dans ce contexte.
Réponds UNIQUEMENT sous forme de JSON array de strings, sans markdown, sans explication.
Exemple : ["Question 1 ?", "Question 2 ?", "Question 3 ?"]`

        const result = await callZAI(
          [{ role: 'user', content: suggestionPrompt }],
          { temperature: 0.6, max_tokens: 200 },
        )

        if (result.success && result.content) {
          // Parse JSON array from response
          let parsed: string[] | null = null
          try {
            const clean = result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
            parsed = JSON.parse(clean)
            if (Array.isArray(parsed) && parsed.length >= 3) {
              return Response.json({
                success: true,
                data: {
                  suggestions: parsed.slice(0, 3),
                },
              })
            }
          } catch { /* fall through to fallback */ }
        }
      } catch {
        // Fall through to fallback
      }

      return Response.json({
        success: true,
        data: { suggestions: fallback },
      })
    }

    // ─── Action: chat (default) ───
    // Build system prompt with module context
    let systemPrompt = SYSTEM_PROMPT
    if (context?.module) {
      const moduleCtx = getModuleContext(context.module)
      if (moduleCtx) {
        systemPrompt += `\n\nCONTEXTE ACTUEL DE L'UTILISATEUR :\n${moduleCtx}`
      }
    }

    // Append module description if provided
    if (context?.moduleDescription) {
      systemPrompt += `\nDescription du module : ${context.moduleDescription}`
    }

    // Append module data if provided
    if (context?.moduleData && Object.keys(context.moduleData).length > 0) {
      const formattedData = Object.entries(context.moduleData)
        .map(([key, value]) => `  - ${key}: ${value}`)
        .join('\n')
      systemPrompt += `\n\nDONNÉES ACTUELLES DE L'UTILISATEUR DANS CE MODULE :\n${formattedData}\n\nUtilise ces données pour personnaliser tes conseils. Si des données sont incomplètes, guide l'utilisateur pour les compléter.`
    }

    if (context?.projectTitle) {
      systemPrompt += `\nProjet de l'utilisateur : ${context.projectTitle}`
    }
    if (context?.sector) {
      systemPrompt += `\nSecteur : ${context.sector}`
    }

    // If authenticated, add user context to system prompt
    if (auth) {
      systemPrompt += `\n\nUtilisateur connecté : ${auth.payload.email} (${auth.payload.role})`
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

    // ─── FT enrichment for relevant queries ───
    if (shouldEnrichWithFT(message, context?.module) && context?.sector) {
      try {
        const ftCtx = await buildFTContext({
          secteur: context.sector,
          region: '11' /* IDF default */,
        })
        const ftText = contextToPrompt(ftCtx)
        const ftMessage = `---
Données France Travail pour enrichir ta réponse (secteur : ${context.sector}) :
${ftText}
---

En te basant sur ces données réelles du marché du travail, réponds à la question de l'utilisateur.`
        messages.push({ role: 'user', content: ftMessage })
      } catch (ftErr) {
        console.warn('[IA FT Enrichment] France Travail enrichment failed, continuing without:',
          ftErr instanceof Error ? ftErr.message : ftErr)
        messages.push({ role: 'user', content: message })
      }
    } else {
      messages.push({ role: 'user', content: message })
    }

    // Call LLM via shared ZAI helper (never throws)
    const result = await callZAI(messages, { temperature: 0.7, max_tokens: 1000 })

    const reply = result.success
      ? result.content || 'Désolé, une erreur est survenue. Veuillez réessayer.'
      : 'Je suis temporairement indisponible. Veuillez réessayer dans quelques instants. En attendant, n\'hésitez pas à consulter les ressources disponibles dans votre Bureau Virtuel ou à contacter votre conseiller GIDEF.'

    return Response.json({
      success: true,
      data: {
        reply,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[IA Assistant API Error]', err)

    return Response.json({
      success: false,
      error: {
        code: 'AI_UNAVAILABLE',
        message: 'Le service IA est temporairement indisponible. Veuillez réessayer dans quelques instants.',
      },
    })
  }
}