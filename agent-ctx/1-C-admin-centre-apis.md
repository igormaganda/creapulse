# Task 1-C — Admin Centre API Converter

## Summary of Changes

### Files Rewritten (4) + Created (1) in `/src/app/api/admin-centre/`:

1. **`conseillers/route.ts`** — GET with real Prisma
   - Admin auth (JWT cookie/header + ADMIN role check)
   - Counselor + User + Organization includes with `_count` of active assignments
   - Search by name, email, firstName, lastName, specialities
   - Status filter (isAvailable: active/inactive)
   - Pagination (page, limit) with total count

2. **`beneficiaires/route.ts`** — GET with real Prisma
   - Beneficiary + User + CreatorJourney + CounselorAssignment includes
   - Search by firstName, lastName, email, projectTitle
   - Conseiller filter (CounselorAssignment.counselorId)
   - Phase filter (CreatorJourney.currentPhase)
   - Pagination with metadata

3. **`stats/route.ts`** — GET with 11 parallel Prisma aggregates
   - Total beneficiaries, active counselors, interviews this month
   - Average completion rate, new registrations, validated livrables
   - Beneficiaries per phase (groupBy), monthly trend (last 12 months)
   - Counselor completion rates, recent activity (AuditLogs + Appointments)

4. **`parametres/route.ts`** — GET + PUT with real Prisma
   - GET: Organization info + center statistics summary
   - PUT: Zod validation, Organization update, AuditLog entry

5. **`planning/route.ts`** — NEW GET + POST
   - GET: All appointments, date range/counselor filters, grouped by day
   - POST: Create appointment with Zod validation, counselor/beneficiary verification

## Lint Results
- `npx eslint src/app/api/admin-centre/` — **0 errors, 0 warnings**
- 1 pre-existing error in unrelated `use-api-data.ts` (not our files)

## Patterns Used
- `getAdminOrg()` helper: cookie-first, then header JWT verification, ADMIN role check
- Tenant isolation on all queries
- Standardized `success()` / `Errors` response helpers
- `handleApiError()` catch-all for Zod + Prisma + generic errors
- Zod validation on all mutating endpoints (PUT, POST)
- AuditLog entries on settings updates and appointment creation
- All text in French
