// ============================================
// CreaPulse V2 — Bilan IA API
// GET   /api/bilan     — Collecter données + générer bilan IA
// POST  /api/bilan     — Régénérer le bilan IA (force refresh)
// ============================================

import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'

// ─── Types ──────────────────────────────────

interface ParcoursData {
  // Profil Créateur
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
  // Mon Projet
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
  // Vision
  vision: {
    visionStatement: string | null
    objectivesCount: number
    coreValues: string[]
    milestonesCount: number
    motivation: string | null
    desiredImpact: string | null
    completionPercent: number
  }
  // RIASEC
  riasec: {
    completed: boolean
    scores: Record<string, { score: number; isDominant: boolean }>
    dominantTypes: string[]
    totalScore: number
    moduleScore: number
  }
  // Kiviat
  kiviat: {
    completed: boolean
    scores: Record<string, number>
    average: number
    strengths: string[]
    weaknesses: string[]
    moduleScore: number
  }
  // ModuleResult pour bilan
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

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = getTokenFromHeader(request)
  if (authHeader) return authHeader
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/session=([^;]+)/)
  return match ? match[1] : null
}

// ─── Helper: Build parcours data ───────────

async function collectParcoursData(userId: string): Promise<ParcoursData> {
  // Fetch all data in parallel
  const [
    user,
    beneficiary,
    journey,
    riasecResults,
    kiviatResults,
    bilanModuleResult,
    profilModuleResult,
    projetModuleResult,
    visionModuleResult,
  ] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.beneficiary.findUnique({ where: { userId } }),
    db.creatorJourney.findUnique({ where: { userId } }),
    db.riasecResult.findMany({ where: { userId }, orderBy: { profileType: 'asc' } }),
    db.kiviatResult.findMany({ where: { userId }, orderBy: { category: 'asc' } }),
    db.moduleResult.findUnique({ where: { userId_moduleCode: { userId, moduleCode: 'bilan-ia' } } }),
    db.moduleResult.findUnique({ where: { userId_moduleCode: { userId, moduleCode: 'profil-createur' } } }),
    db.moduleResult.findUnique({ where: { userId_moduleCode: { userId, moduleCode: 'mon-projet' } } }),
    db.moduleResult.findUnique({ where: { userId_moduleCode: { userId, moduleCode: 'vision' } } }),
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

// ─── Helper: Call LLM ───────────────────────

async function generateBilanAI(data: ParcoursData): Promise<BilanAIGenerated> {
  const prompt = buildBilanPrompt(data)

  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Tu es un assistant IA expert en bilan entrepreneurial. Tu réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 2000,
  })

  let raw = completion.choices?.[0]?.message?.content || ''

  // Clean JSON response (remove markdown code blocks if present)
  raw = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()

  try {
    const parsed = JSON.parse(raw) as BilanAIGenerated

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
      globalScore: typeof parsed.globalScore === 'number' ? Math.min(100, Math.max(0, Math.round(parsed.globalScore))) : 50,
      globalScoreLabel: typeof parsed.globalScoreLabel === 'string' ? parsed.globalScoreLabel : 'Profil Prometteur',
    }
  } catch {
    // Fallback if JSON parsing fails
    return {
      synthesis: 'Votre bilan est en cours de préparation. Les données de votre parcours sont en cours d\'analyse.',
      coherenceAnalysis: '',
      strengths: ['Parcours entrepreneurial initié'],
      weaknesses: ['Complétez les modules du parcours pour un bilan détaillé'],
      recommendations: ['Complétez votre Profil Créateur', 'Remplissez la fiche Mon Projet', 'Passez le test RIASEC', 'Passez le test Kiviat'],
      priorityActions: [
        { title: 'Compléter le profil', description: 'Remplissez vos informations personnelles et entrepreneuriales', priority: 'high' },
        { title: 'Définir le projet', description: 'Décrivez votre projet en détail', priority: 'medium' },
        { title: 'Passer les tests', description: 'Complétez les tests RIASEC et Kiviat', priority: 'low' },
      ],
      globalScore: 25,
      globalScoreLabel: 'Profil Émergent',
    }
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
    const token = getTokenFromRequest(request)
    if (!token) {
      throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)
    }

    const payload = await verifyToken(token)

    // Collect parcours data
    const parcoursData = await collectParcoursData(payload.userId)

    // Check if a bilan already exists in ModuleResult
    const existingBilan = await db.moduleResult.findUnique({
      where: { userId_moduleCode: { userId: payload.userId, moduleCode: 'bilan-ia' } },
    })

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
        // feedback JSON corrupted, regenerate
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
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}

// ─── POST: Générer / régénérer bilan IA ───

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)
    }

    const payload = await verifyToken(token)

    // Collect parcours data
    const parcoursData = await collectParcoursData(payload.userId)

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

    // Generate AI bilan
    const bilan = await generateBilanAI(parcoursData)

    // Save to ModuleResult
    const bilanJson = JSON.stringify(bilan)
    const localScore = calculateLocalGlobalScore(parcoursData)

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

    return success({
      parcours: parcoursData,
      bilan,
      localScore,
      localScoreLabel: getScoreLabel(localScore),
      generatedAt: new Date().toISOString(),
    }, 'Bilan IA généré avec succès')
  } catch (err) {
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}
