# Task 1-B: Conseiller APIs — Mock to Real Prisma Conversion

## Summary
All 6 Conseiller API routes converted from mock data to real Prisma PostgreSQL queries.

## Files Created/Rewritten (7 total, all in `src/app/api/conseiller/`)

### New: `_lib/auth.ts` — Shared Auth Helper
- `getCounselor(request)` — Extracts JWT from cookie/header, verifies COUNSELOR role, resolves Counselor profile
- Custom error classes: `AuthRequiredError`, `AuthForbiddenError`, `AuthNotFoundError`

### Rewritten: `stats/route.ts` — GET Dashboard Stats
- KPIs: active beneficiaries, monthly appointments, upcoming appointments, average progress, modules completed, livrables awaiting, new this month
- Distributions: interview types, appointment statuses, beneficiary phases
- Recent activity (last 5 completed appointments/interviews)
- Upcoming 4 appointments with formatted French dates

### Rewritten: `beneficiaires/route.ts` — GET Beneficiaries List
- Pagination (page, limit, total, totalPages)
- Search by firstName/lastName (insensitive)
- Filter by journey phase
- Sort by name/progress/createdAt
- Includes CreatorJourney data (project title, sector, phase, progress)

### Rewritten: `entretiens/route.ts` — GET + POST
- GET: InterviewSession list with filters (type, status, search), pagination
- POST: Create InterviewSession with Zod validation, verifies beneficiary assignment, optionally creates InterviewNote

### Rewritten: `livrables/route.ts` — GET + PUT
- GET: Livrable list with owner (User) includes, filters (status, type, search), pagination
- PUT: Validate/reject livrable (DRAFT/VALIDATED), verifies counselor ownership, stores notes in JSON content

### Rewritten: `planning/route.ts` — GET + POST
- GET: Appointment list with beneficiary+user includes, date range/type filters, grouped by day
- POST: Create Appointment with Zod validation, verifies beneficiary assignment, calculates end time

### Rewritten: `rapports/route.ts` — GET Reports
- Period filter (mois/trimestre/annee)
- KPIs: completed interviews, validated livrables, average progress
- groupBy queries for phases, types, statuses
- 6-month activity trend with parallel queries
- Top 8 beneficiaries by progress

## Patterns Used
- **Auth**: `getCounselor()` on every endpoint, cookie-first then Authorization header
- **Validation**: Zod schemas on all POST/PUT endpoints
- **Errors**: `handleApiError()` catch-all + custom auth error classes
- **Response**: Standardized `ApiSuccess/ApiError` format via `success()`/`Errors.*`
- **Language**: All text in French
- **Security**: Role check (COUNSELOR only), ownership verification on mutations

## Lint Results
- `src/app/api/conseiller/` — **0 errors** ✅
- 1 pre-existing error in `src/lib/hooks/use-api-data.ts` (outside task scope, not modified)
