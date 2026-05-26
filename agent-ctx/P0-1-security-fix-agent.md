---
Task ID: P0-1
Agent: Security Fix Agent
Task: Secure all 11 France Travail API routes with auth, validation, rate limiting

Work Log:
- Created /src/lib/ft-guard.ts — shared FT route guard utility:
  - `withFTAuth(handler, httpMethod)` — wraps FT route handlers with optional JWT auth (via getTokenFromHeader + verifyToken), per-IP rate limiting (30 req/min anonymous, 120 req/min authenticated), Content-Type validation for POST routes, Zod error → 422, generic sanitized French error on catch
  - `validateFTPagination(params)` — caps page (min 1), per_page (max 150), limit (max 100); returns sanitized PaginationParams
  - `ftRateLimiter` — in-memory per-IP rate limiter with Map + TTL cleanup every 5 minutes
  - `ftSchemas` — reusable Zod schemas for common FT input types (codePostal /^\d{5}$/, departement /^\d{2,3}$/, region /^\d{2}$/, motsCles max 200 chars, siret /^\d{14}$/, siren /^\d{9}$/, etc.)
- Updated all 11 FT route files to use security wrapper:
  - offres/route.ts (POST) — Zod body validation, withFTAuth('POST'), validateFTPagination
  - aides/route.ts (GET) — Zod query validation, withFTAuth('GET'), validateFTPagination
  - formations/route.ts (GET) — Zod query validation, withFTAuth('GET'), validateFTPagination
  - evenements/route.ts (POST) — Zod body validation, withFTAuth('POST'), validateFTPagination
  - metiers/route.ts (GET) — Zod query validation, withFTAuth('GET'), validateFTPagination
  - entreprises/route.ts (GET) — Zod query validation (siret/siren regex), withFTAuth('GET'), validateFTPagination
  - statistiques/route.ts (GET) — Zod query validation, withFTAuth('GET')
  - agences/route.ts (GET) — Zod query validation, withFTAuth('GET'), validateFTPagination
  - communautes/route.ts (GET) — Zod query validation, withFTAuth('GET'), validateFTPagination
  - rome/route.ts (GET) — Zod query validation, withFTAuth('GET'), validateFTPagination
  - lbb/route.ts (GET) — Zod query validation, withFTAuth('GET'), validateFTPagination
- Fixed token cache race condition in /src/lib/france-travail.ts:
  - Added `pendingTokenRequests` Map to deduplicate concurrent getFTToken() calls for the same scope
  - If a pending request exists (<10s old), concurrent callers share the same promise
  - Pending entry is cleaned up in finally block after promise settles
- Sanitized FT error messages in /src/lib/france-travail.ts:
  - `getFTToken()`: raw FT auth response logged server-side, throws sanitized French message 'Service France Travail temporairement indisponible.'
  - `fetchFTAPI()`: raw FT API error response logged server-side, throws sanitized 'Erreur lors de la communication avec le service France Travail.'
- Lint: 0 new errors (4 pre-existing errors in test-db.cjs unrelated to this task)
- Verified: all FT route files pass eslint with zero errors

Stage Summary:
- 1 new file created: /src/lib/ft-guard.ts (withFTAuth, validateFTPagination, ftRateLimiter, ftSchemas)
- 1 file modified: /src/lib/france-travail.ts (race condition fix + error sanitization)
- 11 route files updated with security wrapper (Zod validation, optional JWT auth, rate limiting, pagination capping)
- All FT routes now protected with optional JWT auth + rate limiting + input validation
- No raw FT error responses leaked to clients
- Token fetch race condition eliminated with pending request lock pattern
