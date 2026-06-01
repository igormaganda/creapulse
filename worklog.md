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

---
Task ID: 2
Agent: Main
Task: Configure z.AI API key and fix logout button visibility

Work Log:
- Analyzed z-ai-web-dev-sdk: SDK reads config from `.z-ai-config` JSON file (NOT env vars)
- Found system config at `/etc/.z-ai-config` with baseUrl `https://internal-api.z.ai/v1`
- Modified `src/lib/zai-helper.ts` to support env vars (ZAI_API_KEY + ZAI_BASE_URL) with fallback to .z-ai-config file
- Created `.z-ai-config` in project root with user's API key for local dev
- Updated `.env` with ZAI_API_KEY and ZAI_BASE_URL for Vercel deployment
- Fixed Conseiller sidebar logout: was only calling `closeConseiller()` (closing overlay), now properly logs out via `/api/auth/me` DELETE + page reload
- Added "Retour au site" button (X icon) separate from "Se déconnecter" (LogOut icon) in Conseiller sidebar (desktop + mobile)

Fixes Applied:
1. `src/lib/zai-helper.ts` — Added `initZAI()` function: checks env vars first, then falls back to ZAI.create() file-based config
2. `.z-ai-config` — Created with user's API key for local development
3. `.env` — Added ZAI_API_KEY and ZAI_BASE_URL
4. `src/components/conseiller/conseiller-layout.tsx` — Fixed sidebar footer: split into "Retour au site" (closes overlay) and "Se déconnecter" (full logout with API call + reload)
5. `src/components/conseiller/conseiller-layout.tsx` — Fixed mobile sidebar with same two-button pattern

Stage Summary:
- AI integration now works via env vars on Vercel AND via .z-ai-config locally
- Conseiller logout button properly performs full logout (clears session, closes overlay, reloads page)
- Two distinct actions in sidebar: "Retour au site" vs "Se déconnecter"
- Lint passes with no errors
