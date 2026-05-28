---
Task ID: P0-Infra-Fix
Agent: Main Agent
Task: P0 — Fix infrastructure: Prisma PostgreSQL, env vars, build, server startup

Work Log:
- Reverted prisma/schema.prisma from SQLite back to PostgreSQL provider
- Restored all String[] fields (Counselor.specialities/certifications, Discussion.tags, Mentor.expertise/sectors, MentorshipRequest.objectives, InterviewSession.recommendations, Registration.needs)
- Downgraded Prisma from 7.8.0 to 6.19.3 (7.x prisma.config.ts parsing broken in sandbox)
- Installed @prisma/adapter-pg@6 + pg@8.21.0
- Fixed src/lib/db.ts to use PrismaPg adapter
- Fixed .env: DATABASE_URL=PostgreSQL, NEXTAUTH_SECRET (32+ chars), ANTHROPIC credentials
- Fixed package.json db:push script (removed hardcoded SQLite path)
- Removed prisma.config.ts (not needed for Prisma 6)
- Removed test-db.cjs (4 lint errors from require())
- Verified `prisma db push` — "database already in sync"
- Verified seed data: 1 tenant, 6 users, 60 swipe cards, 300 questions
- Fixed Next.js dev server: must use -H 0.0.0.0 for network access
- Ran `next build` — 0 errors, all 74+ API routes compiled
- Started standalone server, tested all critical APIs:
  - /api/health → 200, DB connected (1.3s latency)
  - /api/auth/login → 200, JWT cookie set
  - /api/dashboard → 200, KPIs + activities
  - /api/profil → 200, full user profile
  - /api/progress → 200, parcours + strategie progress
  - /api/annuaire → 200, 25 actors
  - /api/articles → 200, 76 articles
  - /api/forum → 200, 15 discussions
- Ran `bun run lint` → 0 errors

Stage Summary:
- Prisma 6.19.3 + PostgreSQL fully operational
- All P0 infrastructure fixed: schema, env, DB connection, build, server
- All critical API routes verified and working
- 0 lint errors, 0 build errors
- Known limitation: dev mode (Turbopack) crashes in sandbox; production/standalone mode works perfectly
- Server currently running on port 3000 via standalone mode
