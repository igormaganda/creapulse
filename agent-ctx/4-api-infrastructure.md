# Task 4 — API Infrastructure — Work Record

## Agent: API Infrastructure

## Task: Build complete API infrastructure for CreaPulse V2

## Work Log:

### 1. Dependencies Installed
- `jose@6.2.3` — Edge-compatible JWT library (sign/verify)
- `bcryptjs@3.0.3` — Password hashing
- `@types/bcryptjs@3.0.0` — TypeScript types

### 2. Files Created

#### `src/lib/api-response.ts` — Standardized API Response Factory
- Types: `ApiSuccess<T>`, `ApiError`, `ApiResponse<T>`
- `ErrorCode` constant object with 15 standard error codes
- `success(data, message?, status?)` — Success response helper
- `error(code, message, status?, details?)` — Error response helper
- `Errors` — Pre-built common error responses (unauthorized, validation, etc.)
- `handleApiError(err)` — Catch-all handler for Zod + Prisma + generic errors
- `getTokenFromHeader(request)` — Bearer token extraction

#### `src/lib/auth.ts` — Server-Side Authentication Utilities
- `hashPassword(password)` — bcryptjs with salt rounds 12
- `verifyPassword(password, hash)` — bcryptjs compare
- `createAccessToken(payload)` — JWT signed with jose (HS256, 7-day expiry)
- `verifyToken(token)` — JWT verification with jose
- `generateAuthResponse(userData)` — Full auth response (token + user data)
- `createSessionCookie(token)` / `createClearSessionCookie()` — Cookie helpers
- `checkRole(userRole, allowedRoles)` — RBAC helper
- `hasMinRole(userRole, minRole)` — Role hierarchy (ADMIN > COUNSELOR > BENEFICIARY)
- `AuthError` class — Custom error for auth failures

#### `src/lib/auth-edge.ts` — Edge-Compatible Auth (Middleware)
- `verifyEdgeToken(token)` — JWT verification (Edge Runtime safe, no Node.js APIs)
- `getSessionToken(request)` — Cookie parsing + session token extraction
- `isProtectedPath(pathname)` — Route protection checker (/bureau, /conseiller, /admin)
- `getRequiredRole(pathname)` — Role requirements per route
- `isAuthorizedForPath(role, pathname)` — Authorization check
- `getHomePathForRole(role)` — Post-login redirect path

#### `src/middleware.ts` — Next.js Middleware
- Protects /bureau, /conseiller, /admin routes
- Verifies JWT session cookie
- Redirects unauthenticated users to `/` with redirect param
- Redirects unauthorized roles to their appropriate home
- Skips API routes, static files, Next.js internals
- Sets x-user-id, x-user-role, x-tenant-id headers for downstream

#### `src/app/api/health/route.ts` — Health Check (GET /api/health)
- Database connectivity check (raw SQL query)
- Returns: status, version, environment, uptime, database latency
- Response time measurement

#### `src/app/api/auth/register/route.ts` — Registration (POST /api/auth/register)
- Zod validation: email, password (8+ chars), firstName, lastName
- Upserts default GIDEF Île-de-France tenant
- Checks for existing email (tenant-scoped uniqueness)
- Creates User + Beneficiary + CreatorJourney in transaction
- Creates USER_CREATE audit log entry
- Returns JWT token + sets session cookie

#### `src/app/api/auth/login/route.ts` — Login (POST /api/auth/login)
- Zod validation: email, password
- Finds user by email, verifies password
- Checks user isActive status
- Updates lastLoginAt, creates LOGIN audit log
- Returns JWT token + sets session cookie

#### `src/app/api/auth/me/route.ts` — Current User (GET/DELETE /api/auth/me)
- GET: Verifies JWT (cookie or header), returns user with role-specific data
  - Counselor: organization, specialities, certifications
  - Beneficiary: progress score, employment status, creator journey
  - Both: tenant info, unread notification count
- DELETE: Logout — clears session cookie, creates LOGOUT audit log

#### `src/lib/zustand/store.ts` — Zustand Stores
- `useAuthStore`: user, token, isAuthenticated, isLoading
  - login(), logout(), setUser(), setLoading(), getFullName(), getInitials()
  - Persisted to localStorage under 'creapulse-auth'
- `useNotificationStore`: notifications, unreadCount
  - setNotifications(), addNotification(), markAsRead(), markAllAsRead()
  - removeNotification(), clearAll()
  - Persisted to localStorage under 'creapulse-notifications'

#### `src/lib/providers.tsx` — Client Providers Wrapper
- QueryClientProvider (TanStack Query) with optimized config
- ThemeProvider (next-themes) with class attribute, system detection
- Server-safe QueryClient instantiation pattern

#### Updated `src/components/providers.tsx`
- Enhanced QueryClient configuration (gcTime, retry, refetchOnWindowFocus)

### 3. Verification
- ESLint: 0 errors
- All TypeScript types properly referenced from Prisma schema
- All API routes use standardized response format
- JWT uses jose (Edge Runtime compatible)
- Password hashing uses bcryptjs (server-side only)

## Stage Summary:
- 10 new files created, 1 file updated
- Complete auth flow: register → login → get profile → logout
- JWT-based session management with httpOnly cookies
- Edge-compatible middleware for route protection
- Role-based access control (ADMIN, COUNSELOR, BENEFICIARY)
- Zustand stores for client-side state persistence
- QueryClient + ThemeProvider configured
