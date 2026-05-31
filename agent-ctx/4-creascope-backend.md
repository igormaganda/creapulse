# Task: CréaScope Backend — API Routes + Scoring Algorithm

## Files Created

### 1. `src/lib/kiviat-scoring.ts` — 3-Source Kiviat Scoring Algorithm
- **Types exported**: `SwipeResult`, `QuestionAnswer`, `ScenarioAnswer`, `CombinedKiviatResult`
- **Functions exported**:
  - `computeDimensionSwipeRatio(dimension, results)` — 0-100 per dimension from swipe data
  - `computeSwipeScores(results)` — all 6 dimensions from swipe
  - `computeQuestionAnswerScore(questionCode, type, value)` — single question score
  - `computeQuestionScores(answers)` — all 6 dimensions from questions
  - `computeScenarioScores(answers)` — all 6 dimensions from scenarios
  - `computeCombinedKiviat(swipe, question, scenario)` — CDC formula with weight redistribution
  - `toKiviatResults(combined)` — 0-100 → 1-10 scale for KiviatResult table
  - `toKiviatScale(score)` / `fromKiviatScale(score)` — conversion helpers
  - `getDimensionFromCardCode(code)` / `getDimensionFromQuestionCode(code)` — prefix mapping
  - `getDimensionLabel(code)` — dimension code → French label

**Scoring rules**:
- Swipe: kept=1pt, superPepite=1.5pt, max 15pts/dim (10 cards), ratio × 100
- Question scale: (value/5) × 100
- Question choice/scenario/behavioral: (optionScore/4) × 100 from scoring map
- Question ranking/open: 50 (neutral)
- Combined weights: 40% swipe, 35% question, 25% scenario
- Missing source → proportional weight redistribution

### 2. `src/app/api/swipe/route.ts` — Swipe Game Results API
- **GET** `/api/swipe` — Retrieve all swipe results + computed dimension scores
- **POST** `/api/swipe` — Save batch swipe results (1-60 cards), auto-update KiviatResult + ModuleResult('pepites')
- **DELETE** `/api/swipe` — Reset all swipe results
- Zod validation on POST body
- Card code → SwipeCard DB lookup + upsert SwipeGameResult
- Auto-computes swipe dimension scores and updates KiviatResult (0-100 → 1-10 scale)

### 3. `src/app/api/swipe/questions/route.ts` — Questions/Answers API
- **GET** `/api/swipe/questions` — Get random questions filtered by type/category/difficulty, excluding already-answered
- **POST** `/api/swipe/questions` — Save question answers with auto-computed scores, recompute combined Kiviat
- Fetches all user answers + swipe results for combined scoring
- Updates KiviatResult and ModuleResult('pepites') with combined scores

## Key Decisions
- Used existing `db`, `auth`, `api-response` infrastructure (no new dependencies)
- Questions are served from static `SWIPE_QUESTIONS` data, not DB (DB only stores answers)
- KiviatResult uses existing 1-10 scale (0-100 internal → divided by 10)
- ModuleResult code 'pepites' stores combined scores with source metadata
- Weight redistribution: when only 2 of 3 sources available, remaining weights scale proportionally
- Lint passes clean (0 errors)
