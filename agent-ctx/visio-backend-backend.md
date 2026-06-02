---
Task ID: visio-backend
Agent: Backend Agent
Task: Implement VISIO MODULE BACKEND — Jitsi Meet integration for CreaPulse V2

Work Log:
- Added VisioSessionStatus enum to Prisma schema (WAITING, ACTIVE, ENDED, CANCELLED)
- Added VISIO_SESSION_START and VISIO_SESSION_END to AuditAction enum
- Added VisioSession model to Prisma schema with fields: id, tenantId, roomName (unique), roomSubject, counselorId, beneficiaryId, interviewId (optional), appointmentId (optional), status, startedAt, endedAt, durationSeconds, jitsiRoomConfig (Json)
- Added visioSessions relation to Tenant, Counselor, and Beneficiary models
- Added indexes: [tenantId, status], [counselorId, status], [beneficiaryId, status]
- Added Jitsi Meet environment variables to .env (JITSI_SERVER_URL, JITSI_APP_ID, JITSI_JWT_SECRET, JITSI_SELF_HOSTED_URL)
- Fixed DATABASE_URL from SQLite to PostgreSQL (postgresql://postgres@127.0.0.1:5433/creapulse)
- Bootstrapped local PostgreSQL 17 instance (extracted from Debian packages, initdb, started on port 5433)
- Downgraded prisma CLI from 7.8.0 to 6.19.3 to match @prisma/client version
- Ran prisma db push — schema synced successfully, Prisma Client regenerated
- Installed @paralleldrive/cuid2 for room name generation
- Created /api/visio/sessions/route.ts (GET + POST):
  - GET: List visio sessions with pagination, status filter, includes counselor/beneficiary names
  - POST: Create session with Zod validation, generates unique room name ({tenant.slug}-{cuid8}), returns join URL
- Created /api/visio/sessions/[id]/route.ts (GET + PATCH + DELETE):
  - GET: Session details with join URL, ownership check
  - PATCH: State machine for status transitions (start→ACTIVE, end→ENDED, cancel→CANCELLED), audit logging
  - DELETE: Remove WAITING/CANCELLED sessions (blocks ACTIVE deletion)
- All routes use existing auth pattern (getCounselor from conseiller/_lib/auth.ts)
- All routes use existing response helpers (success, Errors, handleApiError from @/lib/api-response)
- All text/labels in French
- ESLint: 0 errors on visio files, 0 errors project-wide

Stage Summary:
- VisioSession model added to Prisma schema with proper relations and indexes
- 2 API route files created: sessions list/create + session detail/update/delete
- Jitsi Meet integration ready with configurable server URL and self-hosted support
- Full state machine: WAITING → ACTIVE → ENDED (with cancel from WAITING/ACTIVE)
- Audit logging for session start/end events
- Duration auto-calculated on session end
- Room name format: {tenant.slug}-{cuid(8 chars)} — all lowercase, no spaces
- 0 lint errors, schema pushed successfully
- Note: Removed @@index([scheduledAt]) from task spec since VisioSession has no scheduledAt field

Files Created:
- /home/z/my-project/src/app/api/visio/sessions/route.ts
- /home/z/my-project/src/app/api/visio/sessions/[id]/route.ts

Files Modified:
- /home/z/my-project/prisma/schema.prisma (added enum, model, relations, audit actions)
- /home/z/my-project/.env (added Jitsi env vars, fixed DATABASE_URL)

Packages Added:
- @paralleldrive/cuid2@3.3.0 (room name generation)
