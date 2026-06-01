// ============================================
// Tests for src/lib/kiviat-scoring.ts
// ============================================

import { describe, it, expect } from 'vitest'
import {
  getDimensionFromCardCode,
  getDimensionFromQuestionCode,
  getDimensionLabel,
  computeDimensionSwipeRatio,
  computeSwipeScores,
  computeQuestionAnswerScore,
  computeQuestionScores,
  computeScenarioScores,
  computeCombinedKiviat,
  toKiviatResults,
  toKiviatScale,
  fromKiviatScale,
  DIMENSION_CODES,
} from '@/lib/kiviat-scoring'
import type { SwipeResult, QuestionAnswer, ScenarioAnswer } from '@/lib/kiviat-scoring'

describe('kiviat-scoring', () => {
  describe('getDimensionFromCardCode()', () => {
    it('maps ldr prefix to leadership', () => {
      expect(getDimensionFromCardCode('ldr-01')).toBe('leadership')
    })

    it('maps str prefix to stress', () => {
      expect(getDimensionFromCardCode('str-05')).toBe('stress')
    })

    it('maps com prefix to communication', () => {
      expect(getDimensionFromCardCode('com-03')).toBe('communication')
    })

    it('maps res prefix to resolution', () => {
      expect(getDimensionFromCardCode('res-10')).toBe('resolution')
    })

    it('maps cre prefix to creativity', () => {
      expect(getDimensionFromCardCode('cre-07')).toBe('creativity')
    })

    it('maps ada prefix to adaptability', () => {
      expect(getDimensionFromCardCode('ada-02')).toBe('adaptability')
    })

    it('returns null for unknown prefix', () => {
      expect(getDimensionFromCardCode('xyz-01')).toBeNull()
    })
  })

  describe('getDimensionFromQuestionCode()', () => {
    it('maps ldr-q prefix to leadership', () => {
      expect(getDimensionFromQuestionCode('ldr-q01')).toBe('leadership')
    })

    it('maps str-q prefix to stress', () => {
      expect(getDimensionFromQuestionCode('str-q15')).toBe('stress')
    })

    it('returns null for unknown prefix', () => {
      expect(getDimensionFromQuestionCode('xyz-q01')).toBeNull()
    })
  })

  describe('getDimensionLabel()', () => {
    it('returns label for leadership', () => {
      expect(getDimensionLabel('leadership')).toBe('Leadership & Vision')
    })

    it('returns label for stress', () => {
      expect(getDimensionLabel('stress')).toBe('Gestion du stress')
    })

    it('returns code itself for unknown dimension', () => {
      expect(getDimensionLabel('unknown')).toBe('unknown')
    })
  })

  describe('DIMENSION_CODES', () => {
    it('contains exactly 6 dimensions', () => {
      expect(DIMENSION_CODES).toHaveLength(6)
    })

    it('contains all expected dimension codes', () => {
      expect(DIMENSION_CODES).toContain('leadership')
      expect(DIMENSION_CODES).toContain('stress')
      expect(DIMENSION_CODES).toContain('communication')
      expect(DIMENSION_CODES).toContain('resolution')
      expect(DIMENSION_CODES).toContain('creativity')
      expect(DIMENSION_CODES).toContain('adaptability')
    })
  })

  describe('computeDimensionSwipeRatio()', () => {
    it('returns 0 for no results', () => {
      expect(computeDimensionSwipeRatio('leadership', [])).toBe(0)
    })

    it('returns 0 for results from different dimension', () => {
      const results = [
        { cardCode: 'str-01', kept: true, superPepite: false },
        { cardCode: 'str-02', kept: true, superPepite: true },
      ]
      expect(computeDimensionSwipeRatio('leadership', results)).toBe(0)
    })

    it('scores kept cards correctly (1 point each)', () => {
      // Max = 15 points (10 cards × 1.5)
      // 5 kept = 5 points → (5/15) × 100 = 33
      const results = [1, 2, 3, 4, 5].map((n) => ({
        cardCode: `ldr-${String(n).padStart(2, '0')}`,
        kept: true,
        superPepite: false,
      }))
      expect(computeDimensionSwipeRatio('leadership', results)).toBe(33)
    })

    it('scores superPepite cards correctly (1.5 points each)', () => {
      // 3 superPepite = 4.5 points → (4.5/15) × 100 = 30
      const results = [1, 2, 3].map((n) => ({
        cardCode: `ldr-${String(n).padStart(2, '0')}`,
        kept: true,
        superPepite: true,
      }))
      expect(computeDimensionSwipeRatio('leadership', results)).toBe(30)
    })

    it('scores mix of kept and superPepite', () => {
      // 5 kept (5pts) + 3 superPepite (4.5pts) = 9.5 → (9.5/15) × 100 = 63
      const results: SwipeResult[] = [
        ...[1, 2, 3, 4, 5].map((n) => ({
          cardCode: `ldr-${String(n).padStart(2, '0')}`,
          cardTitle: `Card ${n}`,
          kept: true,
          superPepite: false,
        })),
        ...[6, 7, 8].map((n) => ({
          cardCode: `ldr-${String(n).padStart(2, '0')}`,
          cardTitle: `Card ${n}`,
          kept: true,
          superPepite: true,
        })),
      ]
      expect(computeDimensionSwipeRatio('leadership', results)).toBe(63)
    })

    it('max score when all 10 cards are superPepite', () => {
      // 10 × 1.5 = 15 → (15/15) × 100 = 100
      const results = Array.from({ length: 10 }, (_, i) => ({
        cardCode: `ldr-${String(i + 1).padStart(2, '0')}`,
        kept: true,
        superPepite: true,
      }))
      expect(computeDimensionSwipeRatio('leadership', results)).toBe(100)
    })

    it('ignored rejected (not kept) cards', () => {
      const results = [
        { cardCode: 'ldr-01', kept: false, superPepite: false },
        { cardCode: 'ldr-02', kept: true, superPepite: false },
      ]
      expect(computeDimensionSwipeRatio('leadership', results)).toBe(7) // (1/15)*100 = 6.67 → 7
    })
  })

  describe('computeSwipeScores()', () => {
    it('returns scores for all 6 dimensions', () => {
      const results = [1, 2, 3, 4, 5].map((n) => ({
        cardCode: `ldr-${String(n).padStart(2, '0')}`,
        cardTitle: 'Card',
        kept: true,
        superPepite: false,
      }))
      const scores = computeSwipeScores(results)

      expect(Object.keys(scores)).toHaveLength(6)
      expect(scores.leadership).toBe(33)
      // Other dimensions should be 0 since no cards for them
      expect(scores.stress).toBe(0)
    })
  })

  describe('computeQuestionAnswerScore()', () => {
    it('scale type: score 5/5 = 100', () => {
      expect(computeQuestionAnswerScore('ldr-q01', 'scale', 5)).toBe(100)
    })

    it('scale type: score 1/5 = 20', () => {
      expect(computeQuestionAnswerScore('ldr-q01', 'scale', 1)).toBe(20)
    })

    it('scale type: score 3/5 = 60', () => {
      expect(computeQuestionAnswerScore('ldr-q01', 'scale', 3)).toBe(60)
    })

    it('scale type: handles string numbers', () => {
      expect(computeQuestionAnswerScore('ldr-q01', 'scale', '4')).toBe(80)
    })

    it('scale type: returns 50 for out-of-range value', () => {
      expect(computeQuestionAnswerScore('ldr-q01', 'scale', 10)).toBe(50)
    })

    it('scale type: returns 50 for NaN', () => {
      expect(computeQuestionAnswerScore('ldr-q01', 'scale', 'abc')).toBe(50)
    })

    it('ranking type: always returns 50 (neutral)', () => {
      expect(computeQuestionAnswerScore('ldr-q35', 'ranking', 'any')).toBe(50)
    })

    it('open type: always returns 50 (neutral)', () => {
      expect(computeQuestionAnswerScore('ldr-q27', 'open', 'some text')).toBe(50)
    })

    it('choice type: score A for ldr-q09 (scoring A:4) = 100', () => {
      expect(computeQuestionAnswerScore('ldr-q09', 'choice', 'A')).toBe(100)
    })

    it('choice type: score B for ldr-q09 (scoring B:2) = 50', () => {
      expect(computeQuestionAnswerScore('ldr-q09', 'choice', 'B')).toBe(50)
    })

    it('choice type: score D for ldr-q09 (scoring D:1) = 25', () => {
      expect(computeQuestionAnswerScore('ldr-q09', 'choice', 'D')).toBe(25)
    })

    it('unknown type: returns 50', () => {
      expect(computeQuestionAnswerScore('ldr-q01', 'unknown_type', 'x')).toBe(50)
    })
  })

  describe('computeQuestionScores()', () => {
    it('returns 0 for dimensions with no answers', () => {
      const answers: QuestionAnswer[] = []
      const scores = computeQuestionScores(answers)

      expect(scores.leadership).toBe(0)
      expect(scores.stress).toBe(0)
    })

    it('averages multiple answers per dimension', () => {
      const answers: QuestionAnswer[] = [
        { questionCode: 'ldr-q01', category: 'leadership', type: 'scale', value: 5 },  // 100
        { questionCode: 'ldr-q02', category: 'leadership', type: 'scale', value: 1 },  // 20
      ]
      const scores = computeQuestionScores(answers)
      // Average: (100 + 20) / 2 = 60
      expect(scores.leadership).toBe(60)
    })

    it('uses category from answer when set', () => {
      const answers: QuestionAnswer[] = [
        { questionCode: 'custom-q01', category: 'stress', type: 'scale', value: 5 },
      ]
      const scores = computeQuestionScores(answers)
      expect(scores.stress).toBe(100)
    })
  })

  describe('computeScenarioScores()', () => {
    it('returns 0 for dimensions with no answers', () => {
      const answers: ScenarioAnswer[] = []
      const scores = computeScenarioScores(answers)
      expect(scores.leadership).toBe(0)
    })

    it('computes scores from scenario answers', () => {
      const answers: ScenarioAnswer[] = [
        { questionCode: 'ldr-q18', category: 'leadership', value: 'A' }, // scoring A:4 → 100
        { questionCode: 'ldr-q19', category: 'leadership', value: 'B' }, // scoring B:3 → 75
      ]
      const scores = computeScenarioScores(answers)
      // Average: (100 + 75) / 2 = 88 (rounded)
      expect(scores.leadership).toBe(88)
    })
  })

  describe('computeCombinedKiviat()', () => {
    it('returns results for all 6 dimensions', () => {
      const result = computeCombinedKiviat(null, null, null)
      expect(result).toHaveLength(6)
    })

    it('returns 0 combined score when no sources', () => {
      const result = computeCombinedKiviat(null, null, null)
      for (const r of result) {
        expect(r.combinedScore).toBe(0)
        expect(r.sources).toHaveLength(0)
      }
    })

    it('uses single source at 100% when only one available', () => {
      const swipeScores = { leadership: 80, stress: 60 }
      const result = computeCombinedKiviat(swipeScores, null, null)
      const leadershipResult = result.find((r) => r.dimension === 'leadership')!
      expect(leadershipResult.combinedScore).toBe(80)
      expect(leadershipResult.sources).toEqual(['swipe'])
    })

    it('applies standard weights when all 3 sources available', () => {
      // Swipe: 100, Question: 100, Scenario: 100 → all 100
      const swipeScores: Record<string, number> = {
        leadership: 100, stress: 100, communication: 100,
        resolution: 100, creativity: 100, adaptability: 100,
      }
      const questionScores = { ...swipeScores }
      const scenarioScores = { ...swipeScores }

      const result = computeCombinedKiviat(swipeScores, questionScores, scenarioScores)
      for (const r of result) {
        expect(r.combinedScore).toBe(100)
        expect(r.sources).toEqual(['swipe', 'question', 'scenario'])
      }
    })

    it('applies correct CDC formula: Swipe 40% + Question 35% + Scenario 25%', () => {
      const swipeScores: Record<string, number> = {
        leadership: 100, stress: 0, communication: 0,
        resolution: 0, creativity: 0, adaptability: 0,
      }
      const questionScores: Record<string, number> = {
        leadership: 0, stress: 100, communication: 0,
        resolution: 0, creativity: 0, adaptability: 0,
      }
      const scenarioScores: Record<string, number> = {
        leadership: 0, stress: 0, communication: 100,
        resolution: 0, creativity: 0, adaptability: 0,
      }

      const result = computeCombinedKiviat(swipeScores, questionScores, scenarioScores)

      // leadership: 100*0.4 + 0*0.35 + 0*0.25 = 40
      const ldr = result.find((r) => r.dimension === 'leadership')!
      expect(ldr.combinedScore).toBe(40)

      // stress: 0*0.4 + 100*0.35 + 0*0.25 = 35
      const str = result.find((r) => r.dimension === 'stress')!
      expect(str.combinedScore).toBe(35)

      // communication: 0*0.4 + 0*0.35 + 100*0.25 = 25
      const com = result.find((r) => r.dimension === 'communication')!
      expect(com.combinedScore).toBe(25)
    })

    it('redistributes weights when only 2 sources available', () => {
      // Only swipe + question: weights should redistribute proportionally
      // Swipe: 0.40 / (0.40 + 0.35) = 0.40/0.75 ≈ 0.5333
      // Question: 0.35 / (0.40 + 0.35) = 0.35/0.75 ≈ 0.4667
      const swipeScores: Record<string, number> = {
        leadership: 100, stress: 100, communication: 100,
        resolution: 100, creativity: 100, adaptability: 100,
      }
      const questionScores: Record<string, number> = {
        leadership: 0, stress: 0, communication: 0,
        resolution: 0, creativity: 0, adaptability: 0,
      }

      const result = computeCombinedKiviat(swipeScores, questionScores, null)
      const ldr = result.find((r) => r.dimension === 'leadership')!
      // 100 * 0.5333 ≈ 53
      expect(ldr.combinedScore).toBe(53)
      expect(ldr.sources).toEqual(['swipe', 'question'])
    })

    it('result includes dimension labels', () => {
      const result = computeCombinedKiviat(null, null, null)
      const ldr = result.find((r) => r.dimension === 'leadership')!
      expect(ldr.dimensionLabel).toBe('Leadership & Vision')
    })
  })

  describe('toKiviatResults()', () => {
    it('converts 0-100 scores to 0-10 scale', () => {
      const combined = [
        {
          dimension: 'leadership',
          dimensionLabel: 'Leadership & Vision',
          swipeScore: 100,
          questionScore: null,
          scenarioScore: null,
          combinedScore: 100,
          sources: ['swipe'],
        },
        {
          dimension: 'stress',
          dimensionLabel: 'Gestion du stress',
          swipeScore: 50,
          questionScore: null,
          scenarioScore: null,
          combinedScore: 50,
          sources: ['swipe'],
        },
      ]

      const results = toKiviatResults(combined)
      expect(results).toHaveLength(2)
      expect(results[0].category).toBe('leadership')
      expect(results[0].score).toBe(10)
      expect(results[1].category).toBe('stress')
      expect(results[1].score).toBe(5)
    })
  })

  describe('toKiviatScale()', () => {
    it('converts 100 to 10', () => {
      expect(toKiviatScale(100)).toBe(10)
    })

    it('converts 0 to 0', () => {
      expect(toKiviatScale(0)).toBe(0)
    })

    it('converts 55 to 5.5', () => {
      expect(toKiviatScale(55)).toBe(5.5)
    })
  })

  describe('fromKiviatScale()', () => {
    it('converts 10 to 100', () => {
      expect(fromKiviatScale(10)).toBe(100)
    })

    it('converts 0 to 0', () => {
      expect(fromKiviatScale(0)).toBe(0)
    })

    it('converts 5.5 to 55', () => {
      expect(fromKiviatScale(5.5)).toBe(55)
    })
  })
})
