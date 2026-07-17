// ============================================
// CreaPulse V2 — Bilan IA API
// GET   /api/bilan     — Collecter données + générer bilan IA
// POST  /api/bilan     — Régénérer le bilan IA (force refresh)
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors } from '@/lib/api-response'
import { withAuth } from '@/lib/api-auth'
import { callZAI, parseJSONFromAI, getZAIErrorMessage, aiUnavailableResponse } from '@/lib/zai-helper'
import { getEnrollmentIdFromRequest, buildCompositeKey } from '@/lib/enrollment-context'

// ─── Rate limiter (5 per hour per user) ──────

const bilanRateLimit = new Map<string, { count: number; resetAt: number }>()
function checkBilanRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = bilanRateLimit.get(userId)
  if (!entry || now > entry.resetAt) {
    bilanRateLimit.set(userId, { count: 1, resetAt: now + 3600000 }) // 1 hour window
    return true
  }
  if (entry.count >= 5) return false // max 5 per hour
  entry.count++
  return true
}

// ─── Types ──────────────────────────────────

interface ParcoursData {
  profil: {
    firstName: string | null
    lastName: string | null
    email: string
    employmentStatus: string | null
    educationLevel: string | null
    skills: string[]
    creationMotivation: string | null
    previousExperience: boolean | null
    previousExperienceDetails: string | null
    availableTimePerWeek: number | null
    hasDisability: boolean
    rqthStatus: boolean
    supportNeeds: string[]
    completionPercent: number
  }
  projet: {
    projectTitle: string | null
    projectSector: string | null
    projectDescription: string | null
    projectStage: string | null
    targetAudience: string | null
    valueProposition: string | null
    estimatedRevenue: string | null
    estimatedInvestment: string | null
    completionPercent: number
  }
  vision: {
    visionStatement: string | null
    objectivesCount: number
    coreValues: string[]
    milestonesCount: number
    motivation: string | null
    desiredImpact: string | null
    completionPercent: number
  }
  riasec: {
    completed: boolean
    scores: Record<string, { score: number; isDominant: boolean }>
    dominantTypes: string[]
    totalScore: number
    moduleScore: number
  }
  kiviat: {
    completed: boolean
    scores: Record<string, number>
    average: number
    strengths: string[]
    weaknesses: string[]
    moduleScore: number
  }
  bilanSaved: boolean
}

interface BilanAIGenerated {
  synthesis: string
  coherenceAnalysis: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  priorityActions: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }>
  globalScore: number
  globalScoreLabel: string
}

// ─── Helper: Token extraction ──────────────
// Uses centralized withAuth from api-auth (no local duplication)

// ─── Helper: Build parcours data (resilient) ──

async function collectParcoursData(userId: string, tenantId: string, enrollmentId: string | null): Promise<ParcoursData> {
  // Fetch all data using safe queries — individual failures won't crash the whole thing
  // Each query is wrapped in try/catch so partial data is always returned
  let user: Awaited<ReturnType<typeof db.user.findUnique>> = null
  let beneficiary: Awaited<ReturnType<typeof db.beneficiary.findUnique>> = null
  let journey: Awaited<ReturnType<typeof db.creatorJourney.findUnique>> = null
  let riasecResults: Awaited<ReturnType<typeof db.riasecResult.findMany>> = []
  let kiviatResults: Awaited<ReturnType<typeof db.kiviatResult.findMany>> = []
  let bilanModuleResult: Awaited<ReturnType<typeof db.moduleResult.findUnique>> = null
  let profilModuleResult: Awaited<ReturnType<typeof db.moduleResult.findUnique>> = null
  let projetModuleResult: Awaited<ReturnType<typeof db.moduleResult.findUnique>> = null
  let visionModuleResult: Awaited<ReturnType<typeof db.moduleResult.findUnique>> = null

  await Promise.allSettled([
    db.user.findUnique({ where: { id: userId, tenantId: payload.tenantId } }).then(r => { user = r }).catch(() => {}),
    db.beneficiary.findUnique({ where: { userId } }).then(r => { beneficiary = r }).catch(() => {}),
    db.creatorJourney.findUnique({ where: { userId: userId } }).then(r => { journey = r }).catch(() => {}),
    db.riasecResult.findMany({ where: { userId }, orderBy: { profileType: 'asc' } }).then(r => { riasecResults = r }).catch(() => {}),
    db.kiviatResult.findMany({ where: { userId }, orderBy: { category: 'asc' } }).then(r => { kiviatResults = r }).catch(() => {}),
    db.moduleResult.findUnique({ where: { userId_moduleCode: { userId, moduleCode: 'bilan-ia' } } }).then(r => { bilanModuleResult = r }).catch(() => {}),
    db.moduleResult.findUnique({ where: { userId_moduleCode: { userId, moduleCode: 'profil-createur' } } }).then(r => { profilModuleResult = r }).catch(() => {}),
    db.moduleResult.findUnique({ where: { userId_moduleCode: { userId, moduleCode: 'mon-projet' } } }).then(r => { projetModuleResult = r }).catch(() => {}),
    db.moduleResult.findUnique({ where: { userId_moduleCode: { userId, moduleCode: 'vision' } } }).then(r => { visionModuleResult = r }).catch(() => {}),
  ])

  // Parse vision answers from JSON blob
  const visionAnswers = (journey?.visionAnswers as Record<string, unknown>) || {}

  // ─── Profil Créateur ───
  const profilData = {
    firstName: user?.firstName || null,
    lastName: user?.lastName || null,
    email: user?.email || '',
    employmentStatus: (beneficiary?.employmentStatus as string) || null,
    educationLevel: beneficiary?.educationLevel || null,
    skills: Array.isArray(beneficiary?.skills) ? (beneficiary.skills as string[]) : [],
    creationMotivation: journey?.creationMotivation || null,
    previousExperience: (visionAnswers.previousExperience as boolean) || null,
    previousExperienceDetails: (visionAnswers.previousExperienceDetails as string) || null,
    availableTimePerWeek: (visionAnswers.availableTimePerWeek as number) || null,
    hasDisability: beneficiary?.hasDisability || false,
    rqthStatus: beneficiary?.rqthStatus || false,
    supportNeeds: Array.isArray(visionAnswers.supportNeeds) ? (visionAnswers.supportNeeds as string[]) : [],
    completionPercent: profilModuleResult?.score || 0,
  }

  // ─── Mon Projet ───
  const projetData = {
    projectTitle: journey?.projectTitle || null,
    projectSector: journey?.projectSector || null,
    projectDescription: journey?.projectDescription || null,
    projectStage: journey?.projectStage || null,
    targetAudience: journey?.targetAudience || null,
    valueProposition: journey?.valueProposition || null,
    estimatedRevenue: journey?.estimatedRevenue || null,
    estimatedInvestment: journey?.estimatedInvestment || null,
    completionPercent: projetModuleResult?.score || 0,
  }

  // ─── Vision ───
  const objectives = Array.isArray(visionAnswers.objectives) ? visionAnswers.objectives as unknown[] : []
  const milestones = (visionAnswers.milestones || {}) as Record<string, { goals?: string[] }>
  const totalMilestones = Object.values(milestones).reduce((s, m) => s + (m?.goals?.length || 0), 0)

  const visionData = {
    visionStatement: (visionAnswers.visionStatement as string) || null,
    objectivesCount: objectives.length,
    coreValues: Array.isArray(visionAnswers.coreValues) ? (visionAnswers.coreValues as string[]) : [],
    milestonesCount: totalMilestones,
    motivation: (visionAnswers.motivation as string) || null,
    desiredImpact: (visionAnswers.desiredImpact as string) || null,
    completionPercent: visionModuleResult?.score || 0,
  }

  // ─── RIASEC ───
  const riasecScores: Record<string, { score: number; isDominant: boolean }> = {}
  let riasecTotal = 0
  let riasecModuleScore = 0

  for (const r of riasecResults) {
    riasecScores[r.profileType] = { score: r.score, isDominant: r.isDominant }
    riasecTotal += r.score
  }

  const riasecDominantTypes = Object.entries(riasecScores)
    .filter(([, v]) => v.isDominant)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([k]) => k)

  if (riasecResults.length === 6) {
    riasecModuleScore = Math.round((riasecTotal / 150) * 100)
  }

  // ─── Kiviat ───
  const kiviatScores: Record<string, number> = {}
  let kiviatTotal = 0
  const kiviatStrengths: string[] = []
  const kiviatWeaknesses: string[] = []

  const DIMENSION_LABELS: Record<string, string> = {
    creativite: 'Créativité',
    leadership: 'Leadership',
    gestion_financiere: 'Gestion financière',
    communication: 'Communication',
    resolution_problemes: 'Résolution de problèmes',
    perseverance: 'Persévérance',
    adaptabilite: 'Adaptabilité',
    organisation: 'Organisation',
  }

  for (const r of kiviatResults) {
    kiviatScores[r.category] = r.score
    kiviatTotal += r.score
    if (r.score >= 7) kiviatStrengths.push(DIMENSION_LABELS[r.category] || r.category)
    if (r.score <= 4) kiviatWeaknesses.push(DIMENSION_LABELS[r.category] || r.category)
  }

  const kiviatAverage = kiviatResults.length > 0
    ? Math.round((kiviatTotal / kiviatResults.length) * 10) / 10
    : 0

  return {
    profil: profilData,
    projet: projetData,
    vision: visionData,
    riasec: {
      completed: riasecResults.length === 6,
      scores: riasecScores,
      dominantTypes: riasecDominantTypes,
      totalScore: riasecTotal,
      moduleScore: riasecModuleScore,
    },
    kiviat: {
      completed: kiviatResults.length === 8,
      scores: kiviatScores,
      average: kiviatAverage,
      strengths: kiviatStrengths,
      weaknesses: kiviatWeaknesses,
      moduleScore: Math.round(kiviatAverage * 10),
    },
    bilanSaved: !!bilanModuleResult?.completedAt,
  }
}

// ─── Helper: Build AI prompt ────────────────

function buildBilanPrompt(data: ParcoursData): string {
  const RIASEC_LABELS: Record<string, string> = {
    R: 'Réaliste', I: 'Investigateur', A: 'Artistique',
    S: 'Social', E: 'Entreprenant', C: 'Conventionnel',
  }

  const riasecSummary = data.riasec.completed
    ? `\n  - Types dominants : ${data.riasec.dominantTypes.map(t => RIASEC_LABELS[t] || t).join(', ')}
  - Scores détaillés : ${Object.entries(data.riasec.scores).map(([k, v]) => `${RIASEC_LABELS[k] || k}: ${v.score}/25${v.isDominant ? ' ★' : ''}`).join(', ')}
  - Score global : ${data.riasec.totalScore}/150`
    : '\n  - Non complété'

  const kiviatSummary = data.kiviat.completed
    ? `\n  - Score moyen : ${data.kiviat.average}/10
  - Points forts : ${data.kiviat.strengths.join(', ') || 'Aucun'}
  - Axes d\'amélioration : ${data.kiviat.weaknesses.join(', ') || 'Aucun'}`
    : '\n  - Non complété'

  return `Tu es un expert en accompagnement entrepreneurial. Tu dois générer un BILAN COMPLET et PERSONNALISÉ pour un créateur d'entreprise sur la plateforme CreaPulse (GIDEF).

Tu dois analyser TOUTES les données ci-dessous et produire un bilan structuré en JSON.

═══ DONNÉES DU CRÉATEUR ═══

👤 PROFIL CRÉATEUR (${data.profil.completionPercent}% complété) :
  - Nom : ${data.profil.firstName || '?'} ${data.profil.lastName || '?'}
  - Statut professionnel : ${data.profil.employmentStatus || 'Non renseigné'}
  - Niveau d'études : ${data.profil.educationLevel || 'Non renseigné'}
  - Compétences : ${data.profil.skills.join(', ') || 'Aucune'}
  - Motivation : ${data.profil.creationMotivation || 'Non renseignée'}
  - Expérience entrepreneuriale : ${data.profil.previousExperience ? `Oui — ${data.profil.previousExperienceDetails || ''}` : 'Non'}
  - Temps disponible : ${data.profil.availableTimePerWeek || '?'}h/semaine
  - RQTH : ${data.profil.rqthStatus ? 'Oui' : 'Non'}
  - Besoins : ${data.profil.supportNeeds.join(', ') || 'Aucun'}

💡 PROJET (${data.projet.completionPercent}% complété) :
  - Titre : ${data.projet.projectTitle || 'Non défini'}
  - Secteur : ${data.projet.projectSector || 'Non défini'}
  - Stade : ${data.projet.projectStage || 'Non défini'}
  - Description : ${data.projet.projectDescription || 'Non renseignée'}
  - Client cible : ${data.projet.targetAudience || 'Non défini'}
  - Proposition de valeur : ${data.projet.valueProposition || 'Non définie'}
  - Revenus estimés : ${data.projet.estimatedRevenue || '?'}
  - Investissement : ${data.projet.estimatedInvestment || '?'}

🔭 VISION (${data.vision.completionPercent}% complété) :
  - Vision à 5 ans : ${data.vision.visionStatement || 'Non définie'}
  - Objectifs : ${data.vision.objectivesCount} défini(s)
  - Valeurs : ${data.vision.coreValues.join(', ') || 'Aucune'}
  - Jalons : ${data.vision.milestonesCount} défini(s)
  - Impact souhaité : ${data.vision.desiredImpact || 'Non défini'}

🧪 TEST RIASEC :${riasecSummary}

📊 TEST KIVIAT :${kiviatSummary}

═══ FORMAT DE RÉPONSE ═══

Tu DOIS répondre UNIQUEMENT avec un JSON valide (pas de markdown, pas de \`\`\`) respectant cette structure :

{
  "synthesis": "Paragraphes synthétiques personnalisés (3-4 phrases max) qui résument le profil, le projet et les résultats des tests. Utilise le prénom du créateur.",
  "coherenceAnalysis": "Analyse de la cohérence entre le profil RIASEC/Kiviat et le projet choisi. Met en évidence les alignements et les écarts. 2-3 phrases.",
  "strengths": ["Force 1", "Force 2", "Force 3", "Force 4", "Force 5"],
  "weaknesses": ["Faiblesse 1", "Faiblesse 2", "Faiblesse 3"],
  "recommendations": ["Recommandation concrète 1", "Recommandation concrète 2", "Recommandation concrète 3", "Recommandation concrète 4", "Recommandation concrète 5"],
  "priorityActions": [
    {"title": "Action prioritaire 1", "description": "Description courte", "priority": "high"},
    {"title": "Action 2", "description": "Description courte", "priority": "medium"},
    {"title": "Action 3", "description": "Description courte", "priority": "low"}
  ],
  "globalScore": 75,
  "globalScoreLabel": "Profil Prometteur"
}

RÈGLES :
- "strengths" : minimum 3, maximum 6. Basé sur RIASEC + Kiviat + Profil + Projet.
- "weaknesses" : minimum 2, maximum 5. Basé sur les faiblesses Kiviat + écarts RIASEC/projet.
- "recommendations" : minimum 3, maximum 7. Chaque recommandation doit être CONCRÈTE et ACTIONNABLE.
- "priorityActions" : exactement 3 actions, avec priorities "high", "medium", "low".
- "globalScore" : score global de préparation entrepreneuriale de 0 à 100. Calculé en pondérant : Profil(20%) + Projet(25%) + RIASEC(20%) + Kiviat(25%) + Vision(10%).
- "globalScoreLabel" : "Profil Émergent" (0-30), "Profil en Développement" (31-50), "Profil Prometteur" (51-70), "Profil Avancé" (71-85), "Profil Complet" (86-100).
- "coherenceAnalysis" : identifie les compatibilités et incompatibilités entre profil et projet.
- Utilise TOUJOURS le français.
- Sois encourageant mais honnête sur les axes d'amélioration.`
}

// ─── Helper: Default fallback bilan ──────────

function getFallbackBilan(data: ParcoursData, reason: string): BilanAIGenerated {
  const isAiDown = reason === 'sdk_init' || reason === 'ai_call'
  return {
    synthesis: `Bonjour ${data.profil.firstName || ''}, ${isAiDown
      ? "votre bilan est en cours de préparation. L'IA n'est pas disponible pour le moment, mais vos données de parcours sont bien enregistrées."
      : "votre bilan a été généré avec des données partielles. Complétez davantage de modules pour un bilan plus précis."
    }`,
    coherenceAnalysis: '',
    strengths: ['Parcours entrepreneurial initié', ...data.riasec.completed ? ['Test RIASEC complété'] : [], ...data.kiviat.completed ? ['Test Kiviat complété'] : []],
    weaknesses: isAiDown
      ? ['Service IA temporairement indisponible']
      : ['Complétez les modules du parcours pour un bilan détaillé'],
    recommendations: isAiDown
      ? ['Réessayez dans quelques instants', 'Complétez les modules du parcours en attendant']
      : ['Complétez votre Profil Créateur', 'Remplissez la fiche Mon Projet', 'Passez le test RIASEC', 'Passez le test Kiviat'],
    priorityActions: [
      { title: 'Compléter le profil', description: 'Remplissez vos informations entrepreneuriales', priority: 'high' },
      { title: 'Définir le projet', description: 'Décrivez votre projet en détail', priority: 'medium' },
      { title: isAiDown ? 'Réessayer le bilan' : 'Passer les tests', description: isAiDown ? 'Le service IA sera bientôt disponible' : 'Complétez les tests RIASEC et Kiviat', priority: 'low' },
    ],
    globalScore: calculateLocalGlobalScore(data),
    globalScoreLabel: getScoreLabel(calculateLocalGlobalScore(data)),
  }
}

// ─── Helper: Call LLM via shared helper ──────

async function generateBilanAI(data: ParcoursData): Promise<BilanAIGenerated> {
  const prompt = buildBilanPrompt(data)

  // Use the shared ZAI helper — never throws
  const result = await callZAI([
    { role: 'system', content: 'Tu es un assistant IA expert en bilan entrepreneurial. Tu réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.' },
    { role: 'user', content: prompt },
  ], { temperature: 0.5, max_tokens: 2000 })

  if (!result.success) {
    console.error('[Bilan IA] AI generation failed:', result.reason, result.error)
    return getFallbackBilan(data, result.reason)
  }

  // Parse the JSON response
  const parsed = parseJSONFromAI<BilanAIGenerated>(result.content)
  if (!parsed) {
    console.error('[Bilan IA] JSON parsing failed')
    return getFallbackBilan(data, 'empty_response')
  }

  // Validate and sanitize
  return {
    synthesis: typeof parsed.synthesis === 'string' ? parsed.synthesis : 'Bilan en cours de génération.',
    coherenceAnalysis: typeof parsed.coherenceAnalysis === 'string' ? parsed.coherenceAnalysis : '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 6) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 5) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 7) : [],
    priorityActions: Array.isArray(parsed.priorityActions) ? parsed.priorityActions.slice(0, 3).map(a => ({
      title: String(a.title || ''),
      description: String(a.description || ''),
      priority: ['high', 'medium', 'low'].includes(a.priority) ? a.priority : 'medium' as const,
    })) : [],
    globalScore: typeof parsed.globalScore === 'number' ? Math.min(100, Math.max(0, Math.round(parsed.globalScore))) : calculateLocalGlobalScore(data),
    globalScoreLabel: typeof parsed.globalScoreLabel === 'string' ? parsed.globalScoreLabel : getScoreLabel(calculateLocalGlobalScore(data)),
  }
}

// ─── Helper: Calculate local score ──────────

function calculateLocalGlobalScore(data: ParcoursData): number {
  const profilWeight = 0.20
  const projetWeight = 0.25
  const riasecWeight = 0.20
  const kiviatWeight = 0.25
  const visionWeight = 0.10

  const profilScore = data.profil.completionPercent
  const projetScore = data.projet.completionPercent
  const riasecScore = data.riasec.completed ? data.riasec.moduleScore : 0
  const kiviatScore = data.kiviat.completed ? data.kiviat.moduleScore : 0
  const visionScore = data.vision.completionPercent

  return Math.round(
    profilScore * profilWeight +
    projetScore * projetWeight +
    riasecScore * riasecWeight +
    kiviatScore * kiviatWeight +
    visionScore * visionWeight
  )
}

function getScoreLabel(score: number): string {
  if (score >= 86) return 'Profil Complet'
  if (score >= 71) return 'Profil Avancé'
  if (score >= 51) return 'Profil Prometteur'
  if (score >= 31) return 'Profil en Développement'
  return 'Profil Émergent'
}

// ─── GET: Collecter données + bilan ─────────

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    if (authResult instanceof Response) return authResult
    const { payload } = authResult

    // Collect parcours data (resilient — individual query failures won't crash)
    const parcoursData = await collectParcoursData(payload.userId, payload.tenantId, getEnrollmentIdFromRequest(request))

    // Check if a bilan already exists in ModuleResult
    let existingBilan: Awaited<ReturnType<typeof db.moduleResult.findUnique>> = null
    try {
      existingBilan = await db.moduleResult.findUnique({
        where: { userId_moduleCode: { userId: payload.userId, moduleCode: 'bilan-ia' } },
      })
    } catch { /* non-critical */ }

    // If bilan already saved, return it with parcours data
    if (existingBilan?.feedback) {
      try {
        const savedBilan = JSON.parse(existingBilan.feedback) as BilanAIGenerated
        return success({
          parcours: parcoursData,
          bilan: savedBilan,
          localScore: calculateLocalGlobalScore(parcoursData),
          localScoreLabel: getScoreLabel(calculateLocalGlobalScore(parcoursData)),
          generatedAt: existingBilan.completedAt,
          isStale: false,
        })
      } catch {
        // feedback JSON corrupted, will return no bilan below
      }
    }

    // Otherwise return parcours data + local score (no AI bilan yet)
    return success({
      parcours: parcoursData,
      bilan: null,
      localScore: calculateLocalGlobalScore(parcoursData),
      localScoreLabel: getScoreLabel(calculateLocalGlobalScore(parcoursData)),
      generatedAt: existingBilan?.completedAt || null,
      isStale: false,
    })
  } catch (err) {
    if (err instanceof Error && err.message.includes('unauthorized')) {
      return Errors.unauthorized(err.message)
    }
    // Never return 500 — return partial/empty data on unexpected errors
    console.error('[Bilan GET] Unexpected error:', err)
    return success({
      parcours: null,
      bilan: null,
      localScore: 0,
      localScoreLabel: 'Profil Émergent',
      generatedAt: null,
      isStale: false,
      error: 'Impossible de charger les données du parcours. Veuillez réessayer.',
    })
  }
}

// ─── POST: Générer / régénérer bilan IA ───

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    if (authResult instanceof Response) return authResult
    const { payload } = authResult

    // Rate limit: max 5 AI bilan generations per hour per user
    if (!checkBilanRateLimit(payload.userId)) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Trop de requêtes. Veuillez réessayer dans une heure.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 429 },
      )
    }

    // Collect parcours data (resilient)
    const parcoursData = await collectParcoursData(payload.userId, payload.tenantId, getEnrollmentIdFromRequest(request))

    // Check minimum data available
    const hasSomeData =
      parcoursData.profil.completionPercent > 0 ||
      parcoursData.projet.completionPercent > 0 ||
      parcoursData.riasec.completed ||
      parcoursData.kiviat.completed

    if (!hasSomeData) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_DATA',
            message: 'Veuillez compléter au moins un module du parcours avant de générer votre bilan.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    // Generate AI bilan (uses shared ZAI helper — never throws)
    const bilan = await generateBilanAI(parcoursData)

    // Save to ModuleResult (safe — non-critical)
    const bilanJson = JSON.stringify(bilan)
    const localScore = calculateLocalGlobalScore(parcoursData)

    try {
      await db.moduleResult.upsert({
        where: {
          userId_moduleCode: {
            userId: payload.userId,
            moduleCode: 'bilan-ia',
          },
        },
        create: {
          userId: payload.userId,
          moduleCode: 'bilan-ia',
          score: localScore,
          maxScore: 100,
          answers: {
            profilCompletion: parcoursData.profil.completionPercent,
            projetCompletion: parcoursData.projet.completionPercent,
            riasecCompleted: parcoursData.riasec.completed,
            kiviatCompleted: parcoursData.kiviat.completed,
            riasecModuleScore: parcoursData.riasec.moduleScore,
            kiviatModuleScore: parcoursData.kiviat.moduleScore,
          },
          feedback: bilanJson,
          completedAt: new Date(),
        },
        update: {
          score: localScore,
          answers: {
            profilCompletion: parcoursData.profil.completionPercent,
            projetCompletion: parcoursData.projet.completionPercent,
            riasecCompleted: parcoursData.riasec.completed,
            kiviatCompleted: parcoursData.kiviat.completed,
            riasecModuleScore: parcoursData.riasec.moduleScore,
            kiviatModuleScore: parcoursData.kiviat.moduleScore,
          },
          feedback: bilanJson,
          completedAt: new Date(),
        },
      })
    } catch { /* non-critical: bilan was generated even if save fails */ }

    return success({
      parcours: parcoursData,
      bilan,
      localScore,
      localScoreLabel: getScoreLabel(localScore),
      generatedAt: new Date().toISOString(),
    }, 'Bilan IA généré avec succès')
  } catch (err) {
    if (err instanceof Error && err.message.includes('unauthorized')) {
      return Errors.unauthorized(err.message)
    }
    // Never return 500 — return the generated bilan with a warning
    console.error('[Bilan POST] Unexpected error:', err)
    return success({
      parcours: null,
      bilan: {
        synthesis: 'Une erreur inattendue est survenue. Veuillez réessayer.',
        coherenceAnalysis: '',
        strengths: [],
        weaknesses: ['Erreur de serveur'],
        recommendations: ['Réessayez de générer le bilan'],
        priorityActions: [
          { title: 'Réessayer', description: 'Relancez la génération du bilan IA', priority: 'high' },
        ],
        globalScore: 0,
        globalScoreLabel: 'Profil Émergent',
      },
      localScore: 0,
      localScoreLabel: 'Profil Émergent',
      generatedAt: new Date().toISOString(),
    }, 'Erreur lors de la sauvegarde — le bilan a été généré partiellement')
  }
}
