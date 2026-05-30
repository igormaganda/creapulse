// ============================================================
// CréaScope — 3-Source Kiviat Scoring Algorithm (CDC Formula)
// Combines Swipe + Questionnaire + Scenario scores
// ============================================================

import { KIVIAT_DIMENSIONS } from '@/data/swipe-cards'
import { SWIPE_QUESTIONS } from '@/data/swipe-questions'

// ─── Types ───────────────────────────────────

export interface SwipeResult {
  cardCode: string      // e.g. "ldr-01", "str-05"
  cardTitle: string
  kept: boolean
  superPepite: boolean
  confidence?: number   // 1-5
}

export interface QuestionAnswer {
  questionCode: string  // e.g. "ldr-q01"
  category: string      // dimension code
  type: string          // scale | choice | scenario | ranking | open | behavioral
  value: string | number
  // For choice/scenario/behavioral: the option index "A", "B", "C", "D"
}

export interface ScenarioAnswer {
  questionCode: string
  category: string
  value: string | number
}

export interface CombinedKiviatResult {
  dimension: string
  dimensionLabel: string
  swipeScore: number | null
  questionScore: number | null
  scenarioScore: number | null
  combinedScore: number
  sources: string[]  // e.g. ["swipe", "question"]
}

// ─── Constants ───────────────────────────────

/** Card code prefix → dimension code */
const CARD_PREFIX_MAP: Record<string, string> = {
  ldr: 'leadership',
  str: 'stress',
  com: 'communication',
  res: 'resolution',
  cre: 'creativity',
  ada: 'adaptability',
}

/** Question code prefix → dimension code */
const QUESTION_PREFIX_MAP: Record<string, string> = {
  'ldr-q': 'leadership',
  'str-q': 'stress',
  'com-q': 'communication',
  'res-q': 'resolution',
  'cre-q': 'creativity',
  'ada-q': 'adaptability',
}

/** CDC Weights for 3-source combination */
const SWIPE_WEIGHT = 0.40    // Mode 1: Flash Swipe
const QUESTION_WEIGHT = 0.35  // Mode 2: Questionnaire
const SCENARIO_WEIGHT = 0.25  // Mode 3: Challenge Scénario

/** Cards per dimension in the swipe game */
const CARDS_PER_DIMENSION = 10

/** Max possible points per dimension (all kept + all superPepite) */
const MAX_SWIPE_POINTS = CARDS_PER_DIMENSION * 1.5

/** Max option score in choice/scenario/behavioral scoring maps */
const MAX_OPTION_SCORE = 4

/** 6 dimension codes */
export const DIMENSION_CODES = [
  'leadership',
  'stress',
  'communication',
  'resolution',
  'creativity',
  'adaptability',
] as const

// ─── Helpers ─────────────────────────────────

/**
 * Extract dimension code from a card code (e.g. "ldr-01" → "leadership")
 */
export function getDimensionFromCardCode(cardCode: string): string | null {
  const prefix = cardCode.slice(0, 3)
  return CARD_PREFIX_MAP[prefix] ?? null
}

/**
 * Extract dimension code from a question code (e.g. "ldr-q01" → "leadership")
 */
export function getDimensionFromQuestionCode(questionCode: string): string | null {
  const prefix = questionCode.slice(0, 5)
  return QUESTION_PREFIX_MAP[prefix] ?? null
}

/**
 * Get dimension label from code
 */
export function getDimensionLabel(code: string): string {
  const dim = KIVIAT_DIMENSIONS.find((d) => d.code === code)
  return dim?.label ?? code
}

// ─── 1. Swipe Scoring ────────────────────────

/**
 * Compute the swipe ratio for a single dimension.
 *
 * Scoring:
 *   kept = 1 point, superPepite = 1.5 points (includes the kept point)
 *   Swipe_Ratio = (sum of points / max possible points) × 100
 *
 * Max possible = 10 cards × 1.5 = 15 points
 */
export function computeDimensionSwipeRatio(
  dimension: string,
  results: { cardCode: string; kept: boolean; superPepite: boolean }[]
): number {
  const dimResults = results.filter((r) => {
    const dim = getDimensionFromCardCode(r.cardCode)
    return dim === dimension
  })

  if (dimResults.length === 0) return 0

  let totalPoints = 0
  for (const r of dimResults) {
    if (r.superPepite) {
      totalPoints += 1.5
    } else if (r.kept) {
      totalPoints += 1.0
    }
  }

  return Math.round((totalPoints / MAX_SWIPE_POINTS) * 100)
}

/**
 * Compute dimension scores from swipe results.
 * Returns 0-100 per dimension.
 */
export function computeSwipeScores(
  results: SwipeResult[]
): Record<string, number> {
  const scores: Record<string, number> = {}

  for (const dim of DIMENSION_CODES) {
    scores[dim] = computeDimensionSwipeRatio(dim, results)
  }

  return scores
}

// ─── 2. Question Scoring ─────────────────────

/**
 * Compute the score for a single question answer.
 *
 * Scale: score = (value / 5) × 100
 * Choice/Scenario/Behavioral: score = (optionScore / MAX_OPTION_SCORE) × 100
 * Ranking/Open: 50 (neutral)
 */
export function computeQuestionAnswerScore(
  questionCode: string,
  type: string,
  value: string | number
): number {
  // Scale type: value is 1-5
  if (type === 'scale') {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value))
    if (isNaN(numValue) || numValue < 1 || numValue > 5) return 50
    return Math.round((numValue / 5) * 100)
  }

  // Ranking and Open: neutral score
  if (type === 'ranking' || type === 'open') {
    return 50
  }

  // Choice / Scenario / Behavioral: look up scoring map
  if (type === 'choice' || type === 'scenario' || type === 'behavioral') {
    const questionData = SWIPE_QUESTIONS.find((q) => q.code === questionCode)

    if (!questionData?.scoring) {
      // Fallback: no scoring map available
      return 50
    }

    const strValue = String(value).toUpperCase()
    const optionScore = questionData.scoring[strValue]

    if (optionScore === undefined) {
      return 50
    }

    return Math.round((optionScore / MAX_OPTION_SCORE) * 100)
  }

  // Unknown type: neutral
  return 50
}

/**
 * Compute dimension scores from question answers.
 * Returns 0-100 per dimension.
 *
 * For each dimension, averages all answered question scores.
 */
export function computeQuestionScores(
  answers: QuestionAnswer[]
): Record<string, number> {
  const scores: Record<string, number> = {}
  const dimTotals: Record<string, number> = {}
  const dimCounts: Record<string, number> = {}

  for (const dim of DIMENSION_CODES) {
    dimTotals[dim] = 0
    dimCounts[dim] = 0
  }

  for (const answer of answers) {
    // Determine dimension from question code if category is not directly set
    const dimension = answer.category || getDimensionFromQuestionCode(answer.questionCode)
    if (!dimension || !(dimension in dimTotals)) continue

    const score = computeQuestionAnswerScore(answer.questionCode, answer.type, answer.value)
    dimTotals[dimension] += score
    dimCounts[dimension]++
  }

  for (const dim of DIMENSION_CODES) {
    if (dimCounts[dim] === 0) {
      scores[dim] = 0
    } else {
      scores[dim] = Math.round(dimTotals[dim] / dimCounts[dim])
    }
  }

  return scores
}

// ─── 3. Scenario Scoring ─────────────────────

/**
 * Compute dimension scores from scenario answers.
 * Uses the same scoring logic as questions (choices/scenarios with scoring maps).
 * Returns 0-100 per dimension.
 */
export function computeScenarioScores(
  answers: ScenarioAnswer[]
): Record<string, number> {
  const scores: Record<string, number> = {}
  const dimTotals: Record<string, number> = {}
  const dimCounts: Record<string, number> = {}

  for (const dim of DIMENSION_CODES) {
    dimTotals[dim] = 0
    dimCounts[dim] = 0
  }

  for (const answer of answers) {
    const dimension = answer.category || getDimensionFromQuestionCode(answer.questionCode)
    if (!dimension || !(dimension in dimTotals)) continue

    // Find the question data to get the type and scoring
    const questionData = SWIPE_QUESTIONS.find((q) => q.code === answer.questionCode)
    const type = questionData?.type ?? 'choice'

    const score = computeQuestionAnswerScore(answer.questionCode, type, answer.value)
    dimTotals[dimension] += score
    dimCounts[dimension]++
  }

  for (const dim of DIMENSION_CODES) {
    if (dimCounts[dim] === 0) {
      scores[dim] = 0
    } else {
      scores[dim] = Math.round(dimTotals[dim] / dimCounts[dim])
    }
  }

  return scores
}

// ─── 4. Combined 3-Source Kiviat ─────────────

/**
 * Compute combined 3-source Kiviat scores.
 *
 * Weight redistribution when sources are missing:
 *   - All 3: 40% swipe + 35% question + 25% scenario
 *   - Only 2: remaining weights redistribute proportionally
 *   - Only 1: that source = 100%
 *
 * Returns array of CombinedKiviatResult with per-dimension breakdown.
 */
export function computeCombinedKiviat(
  swipeScores: Record<string, number> | null,
  questionScores: Record<string, number> | null,
  scenarioScores: Record<string, number> | null
): CombinedKiviatResult[] {
  const results: CombinedKiviatResult[] = []

  for (const dim of DIMENSION_CODES) {
    const swipe = swipeScores?.[dim] ?? null
    const question = questionScores?.[dim] ?? null
    const scenario = scenarioScores?.[dim] ?? null

    // Determine available sources
    const sources: string[] = []
    if (swipe !== null && swipe !== undefined) sources.push('swipe')
    if (question !== null && question !== undefined) sources.push('question')
    if (scenario !== null && scenario !== undefined) sources.push('scenario')

    let combinedScore: number

    if (sources.length === 0) {
      combinedScore = 0
    } else if (sources.length === 1) {
      // Single source = 100%
      const s = swipe ?? question ?? scenario ?? 0
      combinedScore = s
    } else if (sources.length === 2) {
      // Two sources: redistribute weights proportionally
      const weightMap: Record<string, number> = {
        swipe: SWIPE_WEIGHT,
        question: QUESTION_WEIGHT,
        scenario: SCENARIO_WEIGHT,
      }

      const availableWeight = sources.reduce((sum, s) => sum + (weightMap[s] ?? 0), 0)
      const scale = availableWeight > 0 ? 1 / availableWeight : 1

      combinedScore = 0
      if (swipe !== null && swipe !== undefined) {
        combinedScore += swipe * (SWIPE_WEIGHT * scale)
      }
      if (question !== null && question !== undefined) {
        combinedScore += question * (QUESTION_WEIGHT * scale)
      }
      if (scenario !== null && scenario !== undefined) {
        combinedScore += scenario * (SCENARIO_WEIGHT * scale)
      }

      combinedScore = Math.round(combinedScore)
    } else {
      // All 3 sources: use standard weights
      combinedScore = Math.round(
        (swipe! * SWIPE_WEIGHT) +
        (question! * QUESTION_WEIGHT) +
        (scenario! * SCENARIO_WEIGHT)
      )
    }

    results.push({
      dimension: dim,
      dimensionLabel: getDimensionLabel(dim),
      swipeScore: swipe,
      questionScore: question,
      scenarioScore: scenario,
      combinedScore,
      sources,
    })
  }

  return results
}

// ─── 5. Conversion to KiviatResult Format ────

/**
 * Convert combined scores to KiviatResult format (scale 1-10 for existing API).
 * Used to persist into the KiviatResult table.
 */
export function toKiviatResults(
  combined: CombinedKiviatResult[]
): { category: string; score: number }[] {
  return combined.map((c) => ({
    category: c.dimension,
    score: Math.round((c.combinedScore / 100) * 10 * 10) / 10,  // Scale 0-100 → 0-10, one decimal
  }))
}

/**
 * Convert a 0-100 score to the 1-10 Kiviat scale
 */
export function toKiviatScale(score0to100: number): number {
  return Math.round((score0to100 / 100) * 10 * 10) / 10
}

/**
 * Convert a 1-10 Kiviat score to 0-100 scale
 */
export function fromKiviatScale(score1to10: number): number {
  return Math.round((score1to10 / 10) * 100)
}
