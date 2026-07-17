// ============================================
// CreaPulse — Manual DB Setup (bypasses Prisma JSONB bug)
// Creates all required tables with SQLite-compatible types
// Run: bunx tsx prisma/setup-db.ts
// ============================================

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.resolve(__dirname, '../db/creapulse.db')

// Ensure db directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

// Remove existing DB to start fresh
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH)
  console.log('  Removed existing database')
}

const db = new Database(DB_PATH)

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

console.log('🔧 Creating SQLite tables for CreaPulse...')

// ─── Tenant ─────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Tenant" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "name"         TEXT NOT NULL,
  "slug"         TEXT NOT NULL,
  "logoUrl"      TEXT,
  "primaryColor" TEXT NOT NULL DEFAULT '#00838F',
  "domain"       TEXT,
  "plan"         TEXT NOT NULL DEFAULT 'STARTER',
  "isActive"     INTEGER NOT NULL DEFAULT 1,
  "settings"     TEXT NOT NULL DEFAULT '{}',
  "createdAt"    TEXT NOT NULL,
  "updatedAt"    TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_domain_key" ON "Tenant"("domain");
`)

// ─── Organization ───────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Organization" (
  "id"         TEXT PRIMARY KEY NOT NULL,
  "tenantId"   TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "siret"      TEXT,
  "type"       TEXT NOT NULL DEFAULT 'FORMATION_CENTER',
  "address"    TEXT,
  "city"       TEXT,
  "postalCode" TEXT,
  "region"     TEXT,
  "phone"      TEXT,
  "email"      TEXT,
  "website"    TEXT,
  "isActive"   INTEGER NOT NULL DEFAULT 1,
  "createdAt"  TEXT NOT NULL,
  "updatedAt"  TEXT NOT NULL,
  CONSTRAINT "Organization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_siret_key" ON "Organization"("siret");
CREATE INDEX IF NOT EXISTS "Organization_tenantId_idx" ON "Organization"("tenantId");
`)

// ─── User ───────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "User" (
  "id"            TEXT PRIMARY KEY NOT NULL,
  "tenantId"      TEXT NOT NULL,
  "email"         TEXT NOT NULL,
  "passwordHash"  TEXT NOT NULL,
  "firstName"     TEXT,
  "lastName"      TEXT,
  "avatarUrl"     TEXT,
  "role"          TEXT NOT NULL DEFAULT 'BENEFICIARY',
  "isActive"      INTEGER NOT NULL DEFAULT 1,
  "emailVerified" INTEGER NOT NULL DEFAULT 0,
  "lastLoginAt"   TEXT,
  "createdAt"     TEXT NOT NULL,
  "updatedAt"     TEXT NOT NULL,
  CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_tenantId_email_key" ON "User"("tenantId", "email");
CREATE INDEX IF NOT EXISTS "User_tenantId_role_idx" ON "User"("tenantId", "role");
`)

// ─── Counselor ──────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Counselor" (
  "id"             TEXT PRIMARY KEY NOT NULL,
  "userId"         TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "specialities"   TEXT NOT NULL DEFAULT '[]',
  "certifications" TEXT NOT NULL DEFAULT '[]',
  "maxBeneficiaries" INTEGER NOT NULL DEFAULT 30,
  "isAvailable"    INTEGER NOT NULL DEFAULT 1,
  "createdAt"      TEXT NOT NULL,
  "updatedAt"      TEXT NOT NULL,
  CONSTRAINT "Counselor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Counselor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Counselor_userId_key" ON "Counselor"("userId");
CREATE INDEX IF NOT EXISTS "Counselor_organizationId_idx" ON "Counselor"("organizationId");
`)

// ─── Beneficiary ────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Beneficiary" (
  "id"               TEXT PRIMARY KEY NOT NULL,
  "userId"           TEXT NOT NULL,
  "organizationId"   TEXT,
  "externalId"       TEXT,
  "employmentStatus" TEXT,
  "educationLevel"   TEXT,
  "lastDiploma"      TEXT,
  "skills"           TEXT NOT NULL DEFAULT '[]',
  "hasDisability"    INTEGER NOT NULL DEFAULT 0,
  "disabilityRate"   INTEGER,
  "rqthStatus"       INTEGER NOT NULL DEFAULT 0,
  "progressScore"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"        TEXT NOT NULL,
  "updatedAt"        TEXT NOT NULL,
  CONSTRAINT "Beneficiary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Beneficiary_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Beneficiary_userId_key" ON "Beneficiary"("userId");
CREATE INDEX IF NOT EXISTS "Beneficiary_organizationId_idx" ON "Beneficiary"("organizationId");
`)

// ─── CounselorAssignment ────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "CounselorAssignment" (
  "id"            TEXT PRIMARY KEY NOT NULL,
  "counselorId"   TEXT NOT NULL,
  "beneficiaryId" TEXT NOT NULL,
  "role"          TEXT NOT NULL DEFAULT 'PRIMARY',
  "status"        TEXT NOT NULL DEFAULT 'ACTIVE',
  "assignedAt"    TEXT NOT NULL,
  "unassignedAt"  TEXT,
  "notes"         TEXT,
  CONSTRAINT "CounselorAssignment_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "Counselor"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CounselorAssignment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CounselorAssignment_counselorId_beneficiaryId_key" ON "CounselorAssignment"("counselorId", "beneficiaryId");
CREATE INDEX IF NOT EXISTS "CounselorAssignment_counselorId_idx" ON "CounselorAssignment"("counselorId");
CREATE INDEX IF NOT EXISTS "CounselorAssignment_beneficiaryId_idx" ON "CounselorAssignment"("beneficiaryId");
`)

// ─── CreatorJourney ─────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "CreatorJourney" (
  "id"                  TEXT PRIMARY KEY NOT NULL,
  "userId"              TEXT NOT NULL,
  "currentPhase"        TEXT NOT NULL DEFAULT 'DISCOVERY',
  "progressPercent"     INTEGER NOT NULL DEFAULT 0,
  "projectTitle"        TEXT,
  "projectDescription"  TEXT,
  "projectSector"       TEXT,
  "projectStage"        TEXT,
  "creationMotivation"  TEXT,
  "targetAudience"      TEXT,
  "valueProposition"    TEXT,
  "estimatedRevenue"    TEXT,
  "estimatedInvestment" TEXT,
  "visionAnswers"       TEXT,
  "bpStatus"            TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "bpSections"          TEXT DEFAULT '{}',
  "bpSectionMeta"       TEXT,
  "bpScore"             INTEGER,
  "bpGeneratedAt"       TEXT,
  "bpValidatedAt"       TEXT,
  "bpValidatedBy"       TEXT,
  "tremplinStatus"      TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "tremplinScore"       INTEGER,
  "passportGeneratedAt" TEXT,
  "passportAttestations" TEXT DEFAULT '[]',
  "status"              TEXT NOT NULL DEFAULT 'ACTIVE',
  "startedAt"           TEXT NOT NULL,
  "completedAt"         TEXT,
  "createdAt"           TEXT NOT NULL,
  "updatedAt"           TEXT NOT NULL,
  CONSTRAINT "CreatorJourney_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CreatorJourney_userId_key" ON "CreatorJourney"("userId");
`)

// ─── BpSnapshot ─────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "BpSnapshot" (
  "id"              TEXT PRIMARY KEY NOT NULL,
  "userId"          TEXT NOT NULL,
  "tenantId"        TEXT NOT NULL,
  "creatorJourneyId" TEXT NOT NULL,
  "bpSections"      TEXT DEFAULT '{}',
  "bpProjectContext" TEXT,
  "version"         INTEGER NOT NULL DEFAULT 1,
  "label"           TEXT,
  "trigger"         TEXT NOT NULL DEFAULT 'manual',
  "sectionCount"    INTEGER NOT NULL DEFAULT 0,
  "wordCount"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TEXT NOT NULL,
  CONSTRAINT "BpSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BpSnapshot_creatorJourneyId_fkey" FOREIGN KEY ("creatorJourneyId") REFERENCES "CreatorJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BpSnapshot_userId_idx" ON "BpSnapshot"("userId");
CREATE INDEX IF NOT EXISTS "BpSnapshot_tenantId_idx" ON "BpSnapshot"("tenantId");
CREATE INDEX IF NOT EXISTS "BpSnapshot_creatorJourneyId_idx" ON "BpSnapshot"("creatorJourneyId");
CREATE INDEX IF NOT EXISTS "BpSnapshot_userId_createdAt_idx" ON "BpSnapshot"("userId", "createdAt");
`)

// ─── ModuleResult ───────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "ModuleResult" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "userId"      TEXT NOT NULL,
  "moduleCode"  TEXT NOT NULL,
  "score"       INTEGER NOT NULL DEFAULT 0,
  "maxScore"    INTEGER NOT NULL DEFAULT 100,
  "answers"     TEXT NOT NULL DEFAULT '{}',
  "feedback"    TEXT,
  "completedAt" TEXT,
  "createdAt"   TEXT NOT NULL,
  CONSTRAINT "ModuleResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ModuleResult_userId_moduleCode_key" ON "ModuleResult"("userId", "moduleCode");
CREATE INDEX IF NOT EXISTS "ModuleResult_userId_idx" ON "ModuleResult"("userId");
CREATE INDEX IF NOT EXISTS "ModuleResult_moduleCode_idx" ON "ModuleResult"("moduleCode");
`)

// ─── KiviatResult ───────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "KiviatResult" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "userId"    TEXT NOT NULL,
  "category"  TEXT NOT NULL,
  "score"     REAL NOT NULL DEFAULT 0,
  "maxScore"  REAL NOT NULL DEFAULT 10,
  "createdAt" TEXT NOT NULL,
  CONSTRAINT "KiviatResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "KiviatResult_userId_category_key" ON "KiviatResult"("userId", "category");
CREATE INDEX IF NOT EXISTS "KiviatResult_userId_idx" ON "KiviatResult"("userId");
`)

// ─── RiasecResult ───────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "RiasecResult" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "userId"      TEXT NOT NULL,
  "profileType" TEXT NOT NULL,
  "score"       REAL NOT NULL DEFAULT 0,
  "isDominant"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TEXT NOT NULL,
  CONSTRAINT "RiasecResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "RiasecResult_userId_profileType_key" ON "RiasecResult"("userId", "profileType");
CREATE INDEX IF NOT EXISTS "RiasecResult_userId_idx" ON "RiasecResult"("userId");
`)

// ─── MotivationAssessment ───────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "MotivationAssessment" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "userId"    TEXT NOT NULL,
  "scores"    TEXT NOT NULL DEFAULT '{}',
  "summary"   TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "MotivationAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "MotivationAssessment_userId_key" ON "MotivationAssessment"("userId");
`)

// ─── FinancialForecast ──────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "FinancialForecast" (
  "id"                TEXT PRIMARY KEY NOT NULL,
  "userId"            TEXT NOT NULL,
  "sector"            TEXT,
  "year1Revenue"      REAL,
  "year2Revenue"      REAL,
  "year3Revenue"      REAL,
  "year1Expenses"     REAL,
  "year2Expenses"     REAL,
  "year3Expenses"     REAL,
  "breakevenMonth"    INTEGER,
  "initialInvestment" REAL,
  "aiSynthesis"       TEXT,
  "createdAt"         TEXT NOT NULL,
  "updatedAt"         TEXT NOT NULL,
  CONSTRAINT "FinancialForecast_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "FinancialForecast_userId_key" ON "FinancialForecast"("userId");
`)

// ─── CreaSimSimulation ──────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "CreaSimSimulation" (
  "id"                   TEXT PRIMARY KEY NOT NULL,
  "userId"               TEXT NOT NULL,
  "monthlyRevenue"       REAL,
  "fixedCharges"         TEXT,
  "variableChargesRate"  REAL,
  "averageSellingPrice"  REAL,
  "unitCost"             REAL,
  "targetMarginRate"     REAL,
  "initialInvestment"    REAL,
  "fixedChargesTotal"    REAL,
  "variableChargesAmount" REAL,
  "totalCharges"         REAL,
  "grossMarginAmount"    REAL,
  "grossMarginRate"      REAL,
  "netMarginAmount"      REAL,
  "netMarginRate"        REAL,
  "monthlyBreakeven"     REAL,
  "breakevenMonths"      REAL,
  "profitability1Y"      REAL,
  "profitability2Y"      REAL,
  "profitability3Y"      REAL,
  "year1Revenue"         REAL,
  "year1Expenses"        REAL,
  "year2Revenue"         REAL,
  "year2Expenses"        REAL,
  "year3Revenue"         REAL,
  "year3Expenses"        REAL,
  "aiAnalysis"           TEXT,
  "createdAt"            TEXT NOT NULL,
  "updatedAt"            TEXT NOT NULL,
  CONSTRAINT "CreaSimSimulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CreaSimSimulation_userId_key" ON "CreaSimSimulation"("userId");
`)

// ─── JuridiqueAnalysis ──────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "JuridiqueAnalysis" (
  "id"               TEXT PRIMARY KEY NOT NULL,
  "userId"           TEXT NOT NULL,
  "recommendedStatus" TEXT,
  "fiscalRegime"     TEXT,
  "legalStructure"   TEXT,
  "socialCharges"    TEXT,
  "createdAt"        TEXT NOT NULL,
  "updatedAt"        TEXT NOT NULL,
  CONSTRAINT "JuridiqueAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "JuridiqueAnalysis_userId_key" ON "JuridiqueAnalysis"("userId");
`)

// ─── MarketAnalysis ─────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "MarketAnalysis" (
  "id"             TEXT PRIMARY KEY NOT NULL,
  "userId"         TEXT NOT NULL,
  "sector"         TEXT,
  "marketSize"     TEXT,
  "targetAudience" TEXT,
  "trends"         TEXT,
  "competitors"    TEXT,
  "opportunities"  TEXT,
  "threats"        TEXT,
  "aiSynthesis"    TEXT,
  "createdAt"      TEXT NOT NULL,
  "updatedAt"      TEXT NOT NULL,
  CONSTRAINT "MarketAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "MarketAnalysis_userId_key" ON "MarketAnalysis"("userId");
`)

// ─── Tremplin ───────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Tremplin" (
  "id"              TEXT PRIMARY KEY NOT NULL,
  "userId"          TEXT NOT NULL,
  "currentStep"     INTEGER NOT NULL DEFAULT 0,
  "responses"       TEXT NOT NULL DEFAULT '{}',
  "isCompleted"     INTEGER NOT NULL DEFAULT 0,
  "completedAt"     TEXT,
  "score"           INTEGER,
  "decision"        TEXT,
  "summary"         TEXT,
  "recommendations" TEXT NOT NULL DEFAULT '[]',
  "createdAt"       TEXT NOT NULL,
  "updatedAt"       TEXT NOT NULL,
  CONSTRAINT "Tremplin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Tremplin_userId_key" ON "Tremplin"("userId");
`)

// ─── BusinessModelCanvas ────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "BusinessModelCanvas" (
  "id"                TEXT PRIMARY KEY NOT NULL,
  "userId"            TEXT NOT NULL,
  "partenairesCles"   TEXT DEFAULT '',
  "activitesCles"     TEXT DEFAULT '',
  "ressourcesCles"    TEXT DEFAULT '',
  "propositionValeur" TEXT DEFAULT '',
  "relationsClients"  TEXT DEFAULT '',
  "canaux"            TEXT DEFAULT '',
  "segmentsClients"   TEXT DEFAULT '',
  "structureCouts"    TEXT DEFAULT '',
  "sourcesRevenus"    TEXT DEFAULT '',
  "status"            TEXT NOT NULL DEFAULT 'DRAFT',
  "generatedFromBp"   INTEGER NOT NULL DEFAULT 0,
  "generatedAt"       TEXT,
  "createdAt"         TEXT NOT NULL,
  "updatedAt"         TEXT NOT NULL,
  CONSTRAINT "BusinessModelCanvas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessModelCanvas_userId_key" ON "BusinessModelCanvas"("userId");
`)

// ─── ZeroDraft ──────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "ZeroDraft" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "userId"       TEXT NOT NULL,
  "projectTitle" TEXT,
  "content"      TEXT NOT NULL DEFAULT '',
  "wordCount"    INTEGER NOT NULL DEFAULT 0,
  "status"       TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt"    TEXT NOT NULL,
  "updatedAt"    TEXT NOT NULL,
  CONSTRAINT "ZeroDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ZeroDraft_userId_key" ON "ZeroDraft"("userId");
`)

// ─── AppModule ──────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "AppModule" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "tenantId"    TEXT NOT NULL,
  "code"        TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "category"    TEXT NOT NULL DEFAULT 'DIAGNOSTIC',
  "phase"       TEXT NOT NULL DEFAULT 'DISCOVERY',
  "isActive"    INTEGER NOT NULL DEFAULT 1,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "config"      TEXT NOT NULL DEFAULT '{}',
  "createdAt"   TEXT NOT NULL,
  "updatedAt"   TEXT NOT NULL,
  CONSTRAINT "AppModule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AppModule_tenantId_code_key" ON "AppModule"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "AppModule_tenantId_isActive_idx" ON "AppModule"("tenantId", "isActive");
`)

// ─── Notification ───────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "userId"    TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "type"      TEXT NOT NULL DEFAULT 'INFO',
  "link"      TEXT,
  "isRead"    INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL,
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
`)

// ─── Session ────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Session" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "userId"    TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");
`)

// ─── Account ────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Account" (
  "id"         TEXT PRIMARY KEY NOT NULL,
  "userId"     TEXT NOT NULL,
  "provider"   TEXT NOT NULL,
  "providerId" TEXT,
  "createdAt"  TEXT NOT NULL,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
`)

// ─── InterviewSession ───────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "InterviewSession" (
  "id"             TEXT PRIMARY KEY NOT NULL,
  "counselorId"    TEXT NOT NULL,
  "beneficiaryId"  TEXT NOT NULL,
  "type"           TEXT NOT NULL DEFAULT 'bilan',
  "phase"          TEXT,
  "scheduledAt"    TEXT NOT NULL,
  "startedAt"      TEXT,
  "completedAt"    TEXT,
  "status"         TEXT NOT NULL DEFAULT 'scheduled',
  "synthesis"      TEXT,
  "recommendations" TEXT NOT NULL DEFAULT '[]',
  "createdAt"      TEXT NOT NULL,
  "updatedAt"      TEXT NOT NULL,
  CONSTRAINT "InterviewSession_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "Counselor"("id") ON UPDATE CASCADE,
  CONSTRAINT "InterviewSession_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "InterviewSession_counselorId_idx" ON "InterviewSession"("counselorId");
CREATE INDEX IF NOT EXISTS "InterviewSession_beneficiaryId_idx" ON "InterviewSession"("beneficiaryId");
`)

// ─── InterviewNote ──────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "InterviewNote" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "interviewId" TEXT NOT NULL,
  "phase"       TEXT NOT NULL DEFAULT 'general',
  "category"    TEXT NOT NULL DEFAULT 'observation',
  "content"     TEXT NOT NULL,
  "isKeyPoint"  INTEGER NOT NULL DEFAULT 0,
  "isActionItem" INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TEXT NOT NULL,
  CONSTRAINT "InterviewNote_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "InterviewNote_interviewId_idx" ON "InterviewNote"("interviewId");
`)

// ─── Actor ──────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Actor" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "tenantId"    TEXT,
  "name"        TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "category"    TEXT,
  "city"        TEXT NOT NULL,
  "region"      TEXT,
  "address"     TEXT,
  "phone"       TEXT,
  "email"       TEXT,
  "website"     TEXT,
  "description" TEXT,
  "services"    TEXT,
  "featured"    INTEGER NOT NULL DEFAULT 0,
  "successRate" REAL,
  "createdAt"   TEXT NOT NULL,
  "updatedAt"   TEXT NOT NULL,
  CONSTRAINT "Actor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Actor_tenantId_type_idx" ON "Actor"("tenantId", "type");
CREATE INDEX IF NOT EXISTS "Actor_city_idx" ON "Actor"("city");
`)

// ─── Dispositif ─────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Dispositif" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "tenantId"     TEXT NOT NULL,
  "code"         TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "description"  TEXT,
  "type"         TEXT NOT NULL DEFAULT 'BASE',
  "color"        TEXT NOT NULL DEFAULT '#00838F',
  "icon"         TEXT NOT NULL DEFAULT 'Briefcase',
  "durationDays" INTEGER,
  "isActive"     INTEGER NOT NULL DEFAULT 1,
  "sortOrder"    INTEGER NOT NULL DEFAULT 0,
  "moduleConfig" TEXT NOT NULL DEFAULT '{"include":null,"exclude":[]}',
  "createdAt"    TEXT NOT NULL,
  "updatedAt"    TEXT NOT NULL,
  CONSTRAINT "Dispositif_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Dispositif_tenantId_code_key" ON "Dispositif"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "Dispositif_tenantId_idx" ON "Dispositif"("tenantId");
CREATE INDEX IF NOT EXISTS "Dispositif_isActive_idx" ON "Dispositif"("isActive");
`)

// ─── UserEnrollment ─────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "UserEnrollment" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "userId"       TEXT NOT NULL,
  "tenantId"     TEXT NOT NULL,
  "dispositifId" TEXT NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'ACTIF',
  "enrolledAt"   TEXT NOT NULL,
  "startedAt"    TEXT,
  "completedAt"  TEXT,
  "pausedAt"     TEXT,
  "progress"     INTEGER NOT NULL DEFAULT 0,
  "projectTitle" TEXT,
  "settings"     TEXT NOT NULL DEFAULT '{}',
  "createdAt"    TEXT NOT NULL,
  "updatedAt"    TEXT NOT NULL,
  CONSTRAINT "UserEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserEnrollment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserEnrollment_dispositifId_fkey" FOREIGN KEY ("dispositifId") REFERENCES "Dispositif"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserEnrollment_userId_dispositifId_key" ON "UserEnrollment"("userId", "dispositifId");
CREATE INDEX IF NOT EXISTS "UserEnrollment_userId_idx" ON "UserEnrollment"("userId");
CREATE INDEX IF NOT EXISTS "UserEnrollment_tenantId_idx" ON "UserEnrollment"("tenantId");
CREATE INDEX IF NOT EXISTS "UserEnrollment_dispositifId_idx" ON "UserEnrollment"("dispositifId");
CREATE INDEX IF NOT EXISTS "UserEnrollment_status_idx" ON "UserEnrollment"("status");
`)

// ─── CreascopeSession ───────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "CreascopeSession" (
  "id"               TEXT PRIMARY KEY NOT NULL,
  "beneficiaryId"    TEXT NOT NULL,
  "counselorId"      TEXT NOT NULL,
  "status"           TEXT NOT NULL DEFAULT 'PLANIFIEE',
  "currentStep"      TEXT NOT NULL DEFAULT 'ACCUEIL',
  "scheduledAt"      TEXT NOT NULL,
  "startedAt"        TEXT,
  "completedAt"      TEXT,
  "estimatedMinutes" INTEGER NOT NULL DEFAULT 240,
  "stepProgress"     TEXT NOT NULL DEFAULT '{}',
  "counselorNotes"   TEXT,
  "aiInsights"       TEXT,
  "actionPlan"       TEXT,
  "globalScore"      INTEGER,
  "createdAt"        TEXT NOT NULL,
  "updatedAt"        TEXT NOT NULL,
  CONSTRAINT "CreascopeSession_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CreascopeSession_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "Counselor"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CreascopeSession_beneficiaryId_idx" ON "CreascopeSession"("beneficiaryId");
CREATE INDEX IF NOT EXISTS "CreascopeSession_counselorId_idx" ON "CreascopeSession"("counselorId");
CREATE INDEX IF NOT EXISTS "CreascopeSession_status_scheduledAt_idx" ON "CreascopeSession"("status", "scheduledAt");
`)

// ─── Appointment ────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Appointment" (
  "id"               TEXT PRIMARY KEY NOT NULL,
  "counselorId"      TEXT NOT NULL,
  "beneficiaryId"    TEXT NOT NULL,
  "title"            TEXT NOT NULL,
  "description"      TEXT,
  "type"             TEXT NOT NULL DEFAULT 'FOLLOW_UP',
  "mode"             TEXT NOT NULL DEFAULT 'PHYSICAL',
  "scheduledAt"      TEXT NOT NULL,
  "durationMinutes"  INTEGER NOT NULL DEFAULT 60,
  "status"           TEXT NOT NULL DEFAULT 'SCHEDULED',
  "location"         TEXT,
  "videoLink"        TEXT,
  "notes"            TEXT,
  "createdAt"        TEXT NOT NULL,
  "updatedAt"        TEXT NOT NULL,
  CONSTRAINT "Appointment_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "Counselor"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Appointment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Appointment_counselorId_scheduledAt_idx" ON "Appointment"("counselorId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "Appointment_beneficiaryId_scheduledAt_idx" ON "Appointment"("beneficiaryId", "scheduledAt");
`)

// ─── AuditLog ───────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"         TEXT PRIMARY KEY NOT NULL,
  "tenantId"   TEXT,
  "userId"     TEXT,
  "action"     TEXT NOT NULL,
  "entityType" TEXT,
  "entityId"   TEXT,
  "details"    TEXT NOT NULL DEFAULT '{}',
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "createdAt"  TEXT NOT NULL,
  CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
`)

// ─── Favorite ───────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Favorite" (
  "id"       TEXT PRIMARY KEY NOT NULL,
  "userId"   TEXT NOT NULL,
  "actorId"  TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Favorite_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_actorId_key" ON "Favorite"("userId", "actorId");
CREATE INDEX IF NOT EXISTS "Favorite_userId_idx" ON "Favorite"("userId");
`)

// ─── CvUpload ───────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "CvUpload" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "userId"       TEXT NOT NULL,
  "fileName"     TEXT,
  "cvText"       TEXT,
  "parsedSkills" TEXT,
  "fileUrl"      TEXT,
  "fileKey"      TEXT,
  "createdAt"    TEXT NOT NULL,
  "updatedAt"    TEXT NOT NULL,
  CONSTRAINT "CvUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CvUpload_userId_idx" ON "CvUpload"("userId");
`)

// ─── Livrable ───────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Livrable" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "userId"       TEXT,
  "counselorId"  TEXT,
  "type"         TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "content"      TEXT NOT NULL DEFAULT '{}',
  "fileUrl"      TEXT,
  "fileName"     TEXT,
  "status"       TEXT NOT NULL DEFAULT 'DRAFT',
  "generatedBy"  TEXT,
  "generatedAt"  TEXT,
  "createdAt"    TEXT NOT NULL,
  "updatedAt"    TEXT NOT NULL,
  CONSTRAINT "Livrable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Livrable_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "Counselor"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Livrable_userId_idx" ON "Livrable"("userId");
CREATE INDEX IF NOT EXISTS "Livrable_counselorId_idx" ON "Livrable"("counselorId");
`)

// ─── Network ────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Network" (
  "id"         TEXT PRIMARY KEY NOT NULL,
  "userId"     TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "type"       TEXT NOT NULL,
  "contact"    TEXT,
  "email"      TEXT,
  "phone"      TEXT,
  "notes"      TEXT,
  "createdAt"  TEXT NOT NULL,
  "updatedAt"  TEXT NOT NULL,
  CONSTRAINT "Network_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Network_userId_idx" ON "Network"("userId");
`)

// ─── UserFile ───────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "UserFile" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "userId"    TEXT NOT NULL,
  "fileName"  TEXT NOT NULL,
  "mimeType"  TEXT NOT NULL,
  "fileSize"  INTEGER NOT NULL,
  "category"  TEXT,
  "fileData"  TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "UserFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "UserFile_userId_idx" ON "UserFile"("userId");
CREATE INDEX IF NOT EXISTS "UserFile_category_idx" ON "UserFile"("category");
`)

// ─── Discussion / Reply / DiscussionCategory ───
db.exec(`
CREATE TABLE IF NOT EXISTS "DiscussionCategory" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "name"        TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "description" TEXT,
  "icon"        TEXT,
  "color"       TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TEXT NOT NULL,
  "updatedAt"   TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "DiscussionCategory_slug_key" ON "DiscussionCategory"("slug");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "Discussion" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "authorId"    TEXT NOT NULL,
  "categoryId"  TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "content"     TEXT NOT NULL,
  "tags"        TEXT NOT NULL DEFAULT '[]',
  "isPinned"    INTEGER NOT NULL DEFAULT 0,
  "isLocked"    INTEGER NOT NULL DEFAULT 0,
  "viewCount"   INTEGER NOT NULL DEFAULT 0,
  "likesCount"  INTEGER NOT NULL DEFAULT 0,
  "replyCount"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TEXT NOT NULL,
  "updatedAt"   TEXT NOT NULL,
  CONSTRAINT "Discussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Discussion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DiscussionCategory"("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Discussion_categoryId_idx" ON "Discussion"("categoryId");
CREATE INDEX IF NOT EXISTS "Discussion_authorId_idx" ON "Discussion"("authorId");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "Reply" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "discussionId" TEXT NOT NULL,
  "authorId"     TEXT NOT NULL,
  "parentId"     TEXT,
  "content"      TEXT NOT NULL,
  "isEdited"     INTEGER NOT NULL DEFAULT 0,
  "likesCount"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TEXT NOT NULL,
  "updatedAt"    TEXT NOT NULL,
  CONSTRAINT "Reply_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Reply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Reply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Reply_discussionId_idx" ON "Reply"("discussionId");
CREATE INDEX IF NOT EXISTS "Reply_authorId_idx" ON "Reply"("authorId");
`)

// ─── Conversation / Message ─────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Conversation" (
  "id"             TEXT PRIMARY KEY NOT NULL,
  "tenantId"       TEXT NOT NULL,
  "participant1Id" TEXT NOT NULL,
  "participant2Id" TEXT NOT NULL,
  "lastMessageAt"  TEXT NOT NULL,
  "lastMessage"    TEXT,
  "createdAt"      TEXT NOT NULL,
  "updatedAt"      TEXT NOT NULL,
  CONSTRAINT "Conversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_participant1Id_participant2Id_key" ON "Conversation"("participant1Id", "participant2Id");
CREATE INDEX IF NOT EXISTS "Conversation_tenantId_idx" ON "Conversation"("tenantId");
CREATE INDEX IF NOT EXISTS "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "Message" (
  "id"             TEXT PRIMARY KEY NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId"       TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "isRead"         INTEGER NOT NULL DEFAULT 0,
  "readAt"         TEXT,
  "createdAt"      TEXT NOT NULL,
  CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "Message_senderId_idx" ON "Message"("senderId");
`)

// ─── Mentor / Mentorship ────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Mentor" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "userId"       TEXT NOT NULL,
  "bio"          TEXT NOT NULL DEFAULT '',
  "expertise"    TEXT NOT NULL DEFAULT '[]',
  "sectors"      TEXT NOT NULL DEFAULT '[]',
  "location"     TEXT NOT NULL DEFAULT '',
  "availability" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "maxMentees"   INTEGER NOT NULL DEFAULT 3,
  "rating"       REAL NOT NULL DEFAULT 0,
  "reviewCount"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TEXT NOT NULL,
  "updatedAt"    TEXT NOT NULL,
  CONSTRAINT "Mentor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Mentor_userId_key" ON "Mentor"("userId");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "MentorshipRequest" (
  "id"         TEXT PRIMARY KEY NOT NULL,
  "mentorId"   TEXT NOT NULL,
  "menteeId"   TEXT NOT NULL,
  "message"    TEXT NOT NULL DEFAULT '',
  "objectives" TEXT NOT NULL DEFAULT '[]',
  "status"     TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt"  TEXT NOT NULL,
  "updatedAt"  TEXT NOT NULL,
  CONSTRAINT "MentorshipRequest_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MentorshipRequest_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "MentorshipRequest_mentorId_idx" ON "MentorshipRequest"("mentorId");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "Mentorship" (
  "id"         TEXT PRIMARY KEY NOT NULL,
  "mentorId"   TEXT NOT NULL,
  "menteeId"   TEXT NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'ACTIVE',
  "startedAt"  TEXT NOT NULL,
  "endedAt"    TEXT,
  "rating"     REAL,
  "review"     TEXT,
  "createdAt"  TEXT NOT NULL,
  "updatedAt"  TEXT NOT NULL,
  CONSTRAINT "Mentorship_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Mentorship_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Mentorship_mentorId_menteeId_key" ON "Mentorship"("mentorId", "menteeId");
CREATE INDEX IF NOT EXISTS "Mentorship_mentorId_idx" ON "Mentorship"("mentorId");
`)

// ─── AccessibilitySetting ───────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "AccessibilitySetting" (
  "id"              TEXT PRIMARY KEY NOT NULL,
  "userId"          TEXT NOT NULL,
  "textSize"        INTEGER NOT NULL DEFAULT 100,
  "highContrast"    INTEGER NOT NULL DEFAULT 0,
  "readingLine"     INTEGER NOT NULL DEFAULT 0,
  "dyslexicFont"    INTEGER NOT NULL DEFAULT 0,
  "pauseAnimations" INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TEXT NOT NULL,
  "updatedAt"       TEXT NOT NULL,
  CONSTRAINT "AccessibilitySetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AccessibilitySetting_userId_key" ON "AccessibilitySetting"("userId");
`)

// ─── PersonalizedPath ───────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "PersonalizedPath" (
  "id"         TEXT PRIMARY KEY NOT NULL,
  "userId"     TEXT NOT NULL,
  "title"      TEXT NOT NULL,
  "steps"      TEXT NOT NULL DEFAULT '[]',
  "status"     TEXT NOT NULL DEFAULT 'active',
  "createdAt"  TEXT NOT NULL,
  "updatedAt"  TEXT NOT NULL,
  CONSTRAINT "PersonalizedPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PersonalizedPath_userId_idx" ON "PersonalizedPath"("userId");
`)

// ─── Registration ───────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Registration" (
  "id"                 TEXT PRIMARY KEY NOT NULL,
  "userId"             TEXT NOT NULL,
  "projectType"        TEXT,
  "projectDescription" TEXT,
  "projectStage"       TEXT,
  "motivations"        TEXT,
  "needs"              TEXT NOT NULL DEFAULT '[]',
  "supportType"        TEXT,
  "createdAt"          TEXT NOT NULL,
  CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Registration_userId_idx" ON "Registration"("userId");
`)

// ─── SavedNews / NewsArticle ────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "SavedNews" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "userId"    TEXT NOT NULL,
  "newsId"    TEXT NOT NULL,
  "title"     TEXT,
  "excerpt"   TEXT,
  "sourceUrl" TEXT,
  "createdAt" TEXT NOT NULL,
  CONSTRAINT "SavedNews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "SavedNews_userId_newsId_key" ON "SavedNews"("userId", "newsId");
CREATE INDEX IF NOT EXISTS "SavedNews_userId_idx" ON "SavedNews"("userId");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "NewsArticle" (
  "id"            TEXT PRIMARY KEY NOT NULL,
  "slug"          TEXT NOT NULL,
  "title"         TEXT NOT NULL,
  "excerpt"       TEXT NOT NULL,
  "content"       TEXT NOT NULL DEFAULT '',
  "category"      TEXT NOT NULL DEFAULT 'Inspiration',
  "imageGradient" TEXT,
  "imageUrl"      TEXT,
  "authorName"    TEXT NOT NULL DEFAULT 'Équipe CreaPulse',
  "authorRole"    TEXT NOT NULL DEFAULT 'GIDEF Île-de-France',
  "isPublished"   INTEGER NOT NULL DEFAULT 1,
  "isFeatured"    INTEGER NOT NULL DEFAULT 0,
  "readTime"      INTEGER NOT NULL DEFAULT 5,
  "viewCount"     INTEGER NOT NULL DEFAULT 0,
  "publishedAt"   TEXT NOT NULL,
  "createdAt"     TEXT NOT NULL,
  "updatedAt"     TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "NewsArticle_slug_key" ON "NewsArticle"("slug");
CREATE INDEX IF NOT EXISTS "NewsArticle_category_idx" ON "NewsArticle"("category");
CREATE INDEX IF NOT EXISTS "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");
CREATE INDEX IF NOT EXISTS "NewsArticle_isPublished_idx" ON "NewsArticle"("isPublished");
`)

// ─── QuizLead ───────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "QuizLead" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "prenom"      TEXT NOT NULL,
  "email"       TEXT NOT NULL,
  "telephone"   TEXT,
  "ville"       TEXT,
  "age"         INTEGER,
  "category"    TEXT NOT NULL,
  "quizResults" TEXT,
  "createdAt"   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "QuizLead_category_idx" ON "QuizLead"("category");
CREATE INDEX IF NOT EXISTS "QuizLead_email_idx" ON "QuizLead"("email");
`)

// ─── ConsentLog ─────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "ConsentLog" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "userId"      TEXT NOT NULL,
  "consentType" TEXT NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'GRANTED',
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "source"      TEXT NOT NULL DEFAULT 'web',
  "version"     TEXT NOT NULL DEFAULT '1.0',
  "grantedAt"   TEXT NOT NULL,
  "withdrawnAt" TEXT,
  CONSTRAINT "ConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ConsentLog_userId_consentType_key" ON "ConsentLog"("userId", "consentType");
CREATE INDEX IF NOT EXISTS "ConsentLog_userId_idx" ON "ConsentLog"("userId");
CREATE INDEX IF NOT EXISTS "ConsentLog_consentType_status_idx" ON "ConsentLog"("consentType", "status");
`)

// ─── DataExportRequest / DataDeletionRequest ───
db.exec(`
CREATE TABLE IF NOT EXISTS "DataExportRequest" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "userId"      TEXT NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'pending',
  "format"      TEXT NOT NULL DEFAULT 'json',
  "filePath"    TEXT,
  "expiresAt"   TEXT,
  "requestedAt" TEXT NOT NULL,
  "completedAt" TEXT,
  "error"       TEXT,
  CONSTRAINT "DataExportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "DataExportRequest_userId_idx" ON "DataExportRequest"("userId");
CREATE INDEX IF NOT EXISTS "DataExportRequest_status_idx" ON "DataExportRequest"("status");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "DataDeletionRequest" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "userId"      TEXT NOT NULL,
  "reason"      TEXT,
  "status"      TEXT NOT NULL DEFAULT 'pending',
  "reviewedBy"  TEXT,
  "reviewedAt"  TEXT,
  "processedAt" TEXT,
  "notes"       TEXT,
  CONSTRAINT "DataDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "DataDeletionRequest_userId_idx" ON "DataDeletionRequest"("userId");
CREATE INDEX IF NOT EXISTS "DataDeletionRequest_status_idx" ON "DataDeletionRequest"("status");
`)

// ─── SwipeCard / SwipeGameResult / SwipeQuestion / SwipeAnswer ─
db.exec(`
CREATE TABLE IF NOT EXISTS "SwipeCard" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "code"        TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon"        TEXT NOT NULL,
  "category"    TEXT NOT NULL,
  "subcategory" TEXT,
  "difficulty"  INTEGER NOT NULL DEFAULT 1,
  "weight"      REAL NOT NULL DEFAULT 1.0,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "isActive"    INTEGER NOT NULL DEFAULT 1,
  "createdAt"   TEXT NOT NULL,
  "updatedAt"   TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "SwipeCard_code_key" ON "SwipeCard"("code");
CREATE INDEX IF NOT EXISTS "SwipeCard_category_idx" ON "SwipeCard"("category");
CREATE INDEX IF NOT EXISTS "SwipeCard_isActive_sortOrder_idx" ON "SwipeCard"("isActive", "sortOrder");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "SwipeGameResult" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "userId"      TEXT NOT NULL,
  "cardId"      TEXT NOT NULL,
  "cardCode"    TEXT NOT NULL,
  "cardTitle"   TEXT NOT NULL,
  "kept"        INTEGER NOT NULL,
  "superPepite" INTEGER NOT NULL DEFAULT 0,
  "confidence"  INTEGER,
  "swipedAt"    TEXT NOT NULL,
  CONSTRAINT "SwipeGameResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SwipeGameResult_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "SwipeCard"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "SwipeGameResult_userId_cardId_key" ON "SwipeGameResult"("userId", "cardId");
CREATE INDEX IF NOT EXISTS "SwipeGameResult_userId_idx" ON "SwipeGameResult"("userId");
CREATE INDEX IF NOT EXISTS "SwipeGameResult_cardCode_idx" ON "SwipeGameResult"("cardCode");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "SwipeQuestion" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "code"        TEXT NOT NULL,
  "question"    TEXT NOT NULL,
  "category"    TEXT NOT NULL,
  "subcategory" TEXT,
  "type"        TEXT NOT NULL DEFAULT 'scale',
  "options"     TEXT,
  "helpText"    TEXT,
  "scoring"     TEXT,
  "difficulty"  INTEGER NOT NULL DEFAULT 1,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "isActive"    INTEGER NOT NULL DEFAULT 1,
  "createdAt"   TEXT NOT NULL,
  "updatedAt"   TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "SwipeQuestion_code_key" ON "SwipeQuestion"("code");
CREATE INDEX IF NOT EXISTS "SwipeQuestion_category_type_idx" ON "SwipeQuestion"("category", "type");
CREATE INDEX IF NOT EXISTS "SwipeQuestion_isActive_sortOrder_idx" ON "SwipeQuestion"("isActive", "sortOrder");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "SwipeAnswer" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "userId"      TEXT NOT NULL,
  "questionId"  TEXT NOT NULL,
  "value"       TEXT NOT NULL,
  "confidence"  INTEGER,
  "score"       REAL,
  "answeredAt"  TEXT NOT NULL,
  CONSTRAINT "SwipeAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SwipeAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SwipeQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "SwipeAnswer_userId_questionId_key" ON "SwipeAnswer"("userId", "questionId");
CREATE INDEX IF NOT EXISTS "SwipeAnswer_userId_idx" ON "SwipeAnswer"("userId");
CREATE INDEX IF NOT EXISTS "SwipeAnswer_questionId_idx" ON "SwipeAnswer"("questionId");
`)

// ─── PAA ────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "PaaProgram" (
  "id"              TEXT PRIMARY KEY NOT NULL,
  "userId"          TEXT NOT NULL,
  "tenantId"        TEXT NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'ACTIF',
  "startedAt"       TEXT NOT NULL,
  "plannedEndAt"    TEXT NOT NULL,
  "followUpAt"      TEXT,
  "followUpDone"    INTEGER NOT NULL DEFAULT 0,
  "conclusion"      TEXT,
  "conclusionNotes" TEXT,
  "createdAt"       TEXT NOT NULL,
  "updatedAt"       TEXT NOT NULL,
  CONSTRAINT "PaaProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE,
  CONSTRAINT "PaaProgram_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PaaProgram_userId_idx" ON "PaaProgram"("userId");
CREATE INDEX IF NOT EXISTS "PaaProgram_tenantId_idx" ON "PaaProgram"("tenantId");
CREATE INDEX IF NOT EXISTS "PaaProgram_status_idx" ON "PaaProgram"("status");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "PaaMilestone" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "programId"   TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "label"       TEXT NOT NULL,
  "plannedDate" TEXT,
  "completedAt" TEXT,
  "status"      TEXT NOT NULL DEFAULT 'PLANIFIE',
  "notes"       TEXT,
  "createdAt"   TEXT NOT NULL,
  "updatedAt"   TEXT NOT NULL,
  CONSTRAINT "PaaMilestone_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PaaProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PaaMilestone_programId_idx" ON "PaaMilestone"("programId");
CREATE INDEX IF NOT EXISTS "PaaMilestone_type_idx" ON "PaaMilestone"("type");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "PaaAtelierSession" (
  "id"           TEXT PRIMARY KEY NOT NULL,
  "programId"    TEXT NOT NULL,
  "atelierCode"  TEXT NOT NULL,
  "atelierName"  TEXT NOT NULL,
  "completedAt"  TEXT,
  "status"       TEXT NOT NULL DEFAULT 'NON_SUIVI',
  "feedback"     TEXT,
  "createdAt"    TEXT NOT NULL,
  "updatedAt"    TEXT NOT NULL,
  CONSTRAINT "PaaAtelierSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PaaProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PaaAtelierSession_programId_idx" ON "PaaAtelierSession"("programId");
CREATE INDEX IF NOT EXISTS "PaaAtelierSession_atelierCode_idx" ON "PaaAtelierSession"("atelierCode");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "SmartObjective" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "programId"   TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "specific"    TEXT NOT NULL,
  "measurable"  TEXT NOT NULL,
  "achievable"  TEXT NOT NULL,
  "relevant"    TEXT NOT NULL,
  "timeBound"   TEXT NOT NULL,
  "progress"    INTEGER NOT NULL DEFAULT 0,
  "status"      TEXT NOT NULL DEFAULT 'EN_COURS',
  "completedAt" TEXT,
  "createdAt"   TEXT NOT NULL,
  "updatedAt"   TEXT NOT NULL,
  CONSTRAINT "SmartObjective_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PaaProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "SmartObjective_programId_idx" ON "SmartObjective"("programId");
`)

db.exec(`
CREATE TABLE IF NOT EXISTS "SatisfactionFeedback" (
  "id"          TEXT PRIMARY KEY NOT NULL,
  "programId"   TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "referenceId" TEXT,
  "rating"      INTEGER NOT NULL,
  "comment"     TEXT,
  "nps"         INTEGER,
  "createdAt"   TEXT NOT NULL,
  CONSTRAINT "SatisfactionFeedback_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PaaProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SatisfactionFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "SatisfactionFeedback_programId_idx" ON "SatisfactionFeedback"("programId");
CREATE INDEX IF NOT EXISTS "SatisfactionFeedback_userId_idx" ON "SatisfactionFeedback"("userId");
CREATE INDEX IF NOT EXISTS "SatisfactionFeedback_type_idx" ON "SatisfactionFeedback"("type");
`)

// ─── MindMap ────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "MindMap" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "userId"    TEXT NOT NULL,
  "tenantId"  TEXT NOT NULL,
  "title"     TEXT NOT NULL DEFAULT 'Sans titre',
  "nodes"     TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "MindMap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MindMap_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "MindMap_userId_idx" ON "MindMap"("userId");
CREATE INDEX IF NOT EXISTS "MindMap_tenantId_idx" ON "MindMap"("tenantId");
`)

// Verify all tables were created
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]
console.log(`\n✅ Database created successfully at ${DB_PATH}`)
console.log(`📊 ${tables.length} tables created:`)
tables.forEach(t => console.log(`   ✓ ${t.name}`))

db.close()