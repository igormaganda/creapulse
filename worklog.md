# CreaPulse V2 — Worklog

---
Task ID: 1
Agent: Main
Task: Fix role-based routing — Conseiller users see Bureau instead of Conseiller interface

Work Log:
- Analyzed Prisma schema: UserRole enum has ADMIN, COUNSELOR, BENEFICIARY
- Found root cause in `src/app/page.tsx`: `handleLoginSuccess()` always calls `openBureau()` regardless of user role
- The API `/api/auth/login` correctly returns the `role` field in the response
- The `login-dialog.tsx` stores role in auth store via `useAuthStore.getState().login()`
- BUT the `onLoginSuccess` callback passed to `Navbar` didn't check the role

Fixes Applied:
1. `src/components/landing/landing-shared.tsx` — Added `role?: string` to `AuthUser` type
2. `src/app/page.tsx` — Updated `handleLoginSuccess` and `handleRegisterSuccess` to check role:
   - `COUNSELOR` → opens Conseiller interface + sets conseiller name
   - `ADMIN` → opens Admin Plateforme interface
   - `BENEFICIARY` (default) → opens Bureau interface
3. `src/app/page.tsx` — Added `useAdminCentreStore` import
4. `src/app/page.tsx` — Updated `handleLogout` to close ALL overlays (Bureau, Conseiller, AdminPlateforme, AdminCentre)

Stage Summary:
- Critical routing bug fixed: Conseiller users now see the Conseiller dashboard
- Conseiller name/initials are set from authenticated user data
- All overlays are properly closed on logout
- Lint passes with no errors
