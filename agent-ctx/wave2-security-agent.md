# wave2-security — Security Infrastructure Agent

## Tasks Completed

### Task 1: Refresh Tokens + JWT Blocklist ✅
- **token-blocklist.ts**: In-memory Map<jti, expiryMs>, hourly auto-cleanup, lazy expiry
- **auth.ts**: Added createRefreshToken, verifyRefreshToken, revokeAccessToken. Modified createAccessToken (jti), verifyToken (blocklist check), generateAuthResponse (both tokens)
- **refresh/route.ts**: POST endpoint — cookie-based refresh, rotation, new token pair
- **logout/route.ts**: POST endpoint — revokes both tokens, clears both cookies
- **login/route.ts**: Added refresh cookie (30-day max-age)
- **auth-fetch.ts**: Auto-refresh on 401, concurrent refresh prevention, retry once

### Task 2: CSRF Protection ✅
- **middleware.ts**: Generates csrf_token cookie (non-httpOnly, 24h) + X-CSRF-Token header
- **csrf.ts**: validateCsrf() with timing-safe comparison
- **api-csrf.ts**: withAuthCsrf() — CSRF check on mutating requests only
- **auth-fetch.ts**: Reads csrf_token cookie, attaches as X-CSRF-Token header on POST/PUT/PATCH/DELETE

### Task 3: Multi-Tenant Scoping ✅
- **api-auth.ts**: AuthResult now includes userId, tenantId, role convenience fields
- **9 API routes scoped**: forum, notifications, articles (auth only, global data), bilan, paa/program, paa/milestones, paa/objectifs, paa/satisfaction, paa/ateliers

## Key Decisions
- NewsArticle model has no tenantId field — added auth but left data global
- Forum POST simplified to use centralized withAuth instead of manual token extraction
- Notifications POST verifies target user belongs to same tenant
- Used crypto.randomUUID() for JTIs (available in Node.js 19+, edge-compatible)
