// ============================================
// CréaScope — Questions/Answers API
// GET  /api/swipe/questions  — Get available questions (static data)
// POST /api/swipe/questions  — Save question answers + recompute Kiviat
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'
import { SWIPE_QUESTIONS } from '@/data/swipe-questions'
import {
  computeQuestionScores,
  computeSwipeScores,
  computeCombinedKiviat,
  toKiviatResults,
  DIMENSION_CODES,
} from '@/lib/kiviat-scoring'
import type { SwipeResult } from '@/lib/kiviat-scoring'

// ─── Validation schemas ────────────────────

const QuestionAnswerSchema = z.object({
  questionCode: z.string().min(1),
  category: z.string().min(1),
  type: z.string().min(1),
  value: z.union([z.string(), z.number()]),
})

const SaveAnswersBody = z.object({
  answers: z.array(QuestionAnswerSchema).min(1).max(300),
})

// ─── GET: Retrieve available questions ──────

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)

    // Parse query params for filtering
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')    // scale | choice | scenario | ranking | open | behavioral
    const category = searchParams.get('category')  // leadership | stress | communication | etc.
    const difficulty = searchParams.get('difficulty') // 1 | 2 | 3
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Get already-answered question codes to exclude
    const answeredResults = await db.swipeAnswer.findMany({
      where: { userId: payload.userId },
      select: { questionId: true },
    })
    const answeredIds = new Set(answeredResults.map((a) => a.questionId))

    // Also get question codes from DB for mapping
    const allDbQuestions = await db.swipeQuestion.findMany({
      select: { id: true, code: true },
    })
    const answeredCodes = new Set(
      allDbQuestions
        .filter((q) => answeredIds.has(q.id))
        .map((q) => q.code)
    )

    // Filter questions from static data
    let filtered = [...SWIPE_QUESTIONS]

    // Exclude already answered
    filtered = filtered.filter((q) => !answeredCodes.has(q.code))

    if (type) {
      filtered = filtered.filter((q) => q.type === type)
    }
    if (category) {
      filtered = filtered.filter((q) => q.category === category)
    }
    if (difficulty) {
      const diff = parseInt(difficulty, 10)
      if (!isNaN(diff)) {
        filtered = filtered.filter((q) => q.difficulty === diff)
      }
    }

    // Randomize and limit
    filtered.sort(() => Math.random() - 0.5)
    filtered = filtered.slice(0, limit)

    return success({
      questions: filtered,
      totalAvailable: filtered.length,
      totalAnswered: answeredCodes.size,
      filters: { type, category, difficulty, limit },
    })
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}

// ─── POST: Save question answers ───────────

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)

    const payload = await verifyToken(token)

    const body = await request.json()
    const { answers } = SaveAnswersBody.parse(body)

    // 1. Look up all SwipeQuestions by code to get their IDs
    const questionCodes = answers.map((a) => a.questionCode)
    const questions = await db.swipeQuestion.findMany({
      where: { code: { in: questionCodes } },
      select: { id: true, code: true, type: true, category: true, scoring: true },
    })

    const questionMap = new Map(questions.map((q) => [q.code, q]))

    // Validate all question codes exist
    const missingCodes = questionCodes.filter((code) => !questionMap.has(code))
    if (missingCodes.length > 0) {
      return Errors.validation(
        { missingQuestions: missingCodes },
        `Les questions suivantes n'existent pas : ${missingCodes.join(', ')}`
      )
    }

    // 2. Upsert SwipeAnswers in a transaction
    //    For each answer, compute the score
    const upsertOps = answers.map((answer) => {
      const dbQuestion = questionMap.get(answer.questionCode)!
      const questionData = SWIPE_QUESTIONS.find((q) => q.code === answer.questionCode)

      // Compute score for this answer
      let computedScore: number
      const type = dbQuestion.type

      if (type === 'scale') {
        const numValue = typeof answer.value === 'number' ? answer.value : parseFloat(String(answer.value))
        computedScore = isNaN(numValue) ? 50 : Math.round((numValue / 5) * 100)
      } else if (type === 'ranking' || type === 'open') {
        computedScore = 50
      } else if (type === 'choice' || type === 'scenario' || type === 'behavioral') {
        // Look up scoring from question data
        const scoring = (questionData?.scoring ?? dbQuestion.scoring) as Record<string, number> | null
        if (scoring) {
          const strValue = String(answer.value).toUpperCase()
          const optionScore = scoring[strValue]
          computedScore = optionScore !== undefined ? Math.round((optionScore / 4) * 100) : 50
        } else {
          computedScore = 50
        }
      } else {
        computedScore = 50
      }

      return db.swipeAnswer.upsert({
        where: {
          userId_questionId: {
            userId: payload.userId,
            questionId: dbQuestion.id,
          },
        },
        create: {
          userId: payload.userId,
          questionId: dbQuestion.id,
          value: String(answer.value),
          score: computedScore,
        },
        update: {
          value: String(answer.value),
          score: computedScore,
          answeredAt: new Date(),
        },
      })
    })

    await db.$transaction(upsertOps)

    // 3. Recompute combined Kiviat scores
    //    Fetch all swipe answers for this user grouped by dimension
    const allUserAnswers = await db.swipeAnswer.findMany({
      where: { userId: payload.userId },
      include: { question: { select: { code: true, category: true, type: true } } },
    })

    // Build QuestionAnswer array from all saved answers
    const allQuestionAnswers = allUserAnswers.map((a) => ({
      questionCode: a.question.code,
      category: a.question.category,
      type: a.question.type,
      value: a.value,
    }))

    const questionScores = computeQuestionScores(allQuestionAnswers)

    // Also fetch swipe results for combined scoring
    const userSwipeResults = await db.swipeGameResult.findMany({
      where: { userId: payload.userId },
    })

    let swipeScores: Record<string, number> | null = null
    if (userSwipeResults.length > 0) {
      const swipeData: SwipeResult[] = userSwipeResults.map((r) => ({
        cardCode: r.cardCode,
        cardTitle: r.cardTitle,
        kept: r.kept,
        superPepite: r.superPepite,
        confidence: r.confidence ?? undefined,
      }))
      swipeScores = computeSwipeScores(swipeData)
    }

    // Compute combined Kiviat
    const combined = computeCombinedKiviat(swipeScores, questionScores, null)
    const kiviatResults = toKiviatResults(combined)

    // 4. Update KiviatResult for each dimension
    const kiviatOps = kiviatResults.map((kr) => {
      return db.kiviatResult.upsert({
        where: {
          userId_category: {
            userId: payload.userId,
            category: kr.category,
          },
        },
        create: {
          userId: payload.userId,
          category: kr.category,
          score: kr.score,
          maxScore: 10,
        },
        update: {
          score: kr.score,
        },
      })
    })

    await db.$transaction(kiviatOps)

    // 5. Update ModuleResult for 'pepites' module
    const avgScore = combined.reduce((sum, c) => sum + c.combinedScore, 0) / combined.length

    // Get total answered counts per source
    const totalSwipe = userSwipeResults.length
    const totalQuestions = allUserAnswers.length
    const sources: string[] = []
    if (totalSwipe > 0) sources.push('swipe')
    if (totalQuestions > 0) sources.push('question')

    // Build combined scores summary for response
    const combinedScoresMap: Record<string, { score: number; sources: string[] }> = {}
    for (const c of combined) {
      combinedScoresMap[c.dimension] = {
        score: c.combinedScore,
        sources: c.sources,
      }
    }

    await db.moduleResult.upsert({
      where: {
        userId_moduleCode: {
          userId: payload.userId,
          moduleCode: 'pepites',
        },
      },
      create: {
        userId: payload.userId,
        moduleCode: 'pepites',
        score: Math.round(avgScore),
        maxScore: 100,
        answers: {
          combinedScores: Object.fromEntries(combined.map((c) => [c.dimension, c.combinedScore])),
          swipeScores: swipeScores ?? {},
          questionScores,
          sources,
          totalSwipe,
          totalQuestions,
        } as Record<string, unknown>,
        completedAt: new Date(),
      },
      update: {
        score: Math.round(avgScore),
        answers: {
          combinedScores: Object.fromEntries(combined.map((c) => [c.dimension, c.combinedScore])),
          swipeScores: swipeScores ?? {},
          questionScores,
          sources,
          totalSwipe,
          totalQuestions,
        } as Record<string, unknown>,
        completedAt: new Date(),
      },
    })

    return success(
      {
        saved: answers.length,
        updatedKiviat: true,
        dimensionScores: questionScores,
        combinedScores: combinedScoresMap,
        globalAverage: Math.round(avgScore),
        totalQuestions: allUserAnswers.length,
        totalSwipe: userSwipeResults.length,
      },
      'Réponses sauvegardées et Kiviat mis à jour avec succès'
    )
  } catch (err) {
    if (err instanceof AuthError) return Errors.unauthorized(err.message)
    return handleApiError(err)
  }
}
