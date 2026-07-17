-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#00838F',
    "domain" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT {},
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siret" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FORMATION_CENTER',
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "region" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Organization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'BENEFICIARY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Counselor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialities" JSONB NOT NULL DEFAULT [],
    "certifications" JSONB NOT NULL DEFAULT [],
    "maxBeneficiaries" INTEGER NOT NULL DEFAULT 30,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Counselor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Counselor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "externalId" TEXT,
    "employmentStatus" TEXT,
    "educationLevel" TEXT,
    "lastDiploma" TEXT,
    "skills" JSONB NOT NULL DEFAULT [],
    "hasDisability" BOOLEAN NOT NULL DEFAULT false,
    "disabilityRate" INTEGER,
    "rqthStatus" BOOLEAN NOT NULL DEFAULT false,
    "progressScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Beneficiary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Beneficiary_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CounselorAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "counselorId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PRIMARY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "CounselorAssignment_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "Counselor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CounselorAssignment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreatorJourney" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currentPhase" TEXT NOT NULL DEFAULT 'DISCOVERY',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "projectTitle" TEXT,
    "projectDescription" TEXT,
    "projectSector" TEXT,
    "projectStage" TEXT,
    "creationMotivation" TEXT,
    "targetAudience" TEXT,
    "valueProposition" TEXT,
    "estimatedRevenue" TEXT,
    "estimatedInvestment" TEXT,
    "visionAnswers" JSONB,
    "bpStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "bpSections" JSONB DEFAULT {},
    "bpSectionMeta" JSONB,
    "bpScore" INTEGER,
    "bpGeneratedAt" DATETIME,
    "bpValidatedAt" DATETIME,
    "bpValidatedBy" TEXT,
    "tremplinStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "tremplinScore" INTEGER,
    "passportGeneratedAt" DATETIME,
    "passportAttestations" JSONB DEFAULT [],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreatorJourney_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BpSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "creatorJourneyId" TEXT NOT NULL,
    "bpSections" JSONB DEFAULT {},
    "bpProjectContext" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT,
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "sectionCount" INTEGER NOT NULL DEFAULT 0,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BpSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BpSnapshot_creatorJourneyId_fkey" FOREIGN KEY ("creatorJourneyId") REFERENCES "CreatorJourney" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModuleResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "moduleCode" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "answers" JSONB NOT NULL DEFAULT {},
    "feedback" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModuleResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KiviatResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "maxScore" REAL NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KiviatResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiasecResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "profileType" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "isDominant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiasecResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MotivationAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "scores" JSONB NOT NULL DEFAULT {},
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MotivationAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialForecast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sector" TEXT,
    "year1Revenue" REAL,
    "year2Revenue" REAL,
    "year3Revenue" REAL,
    "year1Expenses" REAL,
    "year2Expenses" REAL,
    "year3Expenses" REAL,
    "breakevenMonth" INTEGER,
    "initialInvestment" REAL,
    "aiSynthesis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialForecast_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreaSimSimulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "monthlyRevenue" REAL,
    "fixedCharges" JSONB,
    "variableChargesRate" REAL,
    "averageSellingPrice" REAL,
    "unitCost" REAL,
    "targetMarginRate" REAL,
    "initialInvestment" REAL,
    "fixedChargesTotal" REAL,
    "variableChargesAmount" REAL,
    "totalCharges" REAL,
    "grossMarginAmount" REAL,
    "grossMarginRate" REAL,
    "netMarginAmount" REAL,
    "netMarginRate" REAL,
    "monthlyBreakeven" REAL,
    "breakevenMonths" REAL,
    "profitability1Y" REAL,
    "profitability2Y" REAL,
    "profitability3Y" REAL,
    "year1Revenue" REAL,
    "year1Expenses" REAL,
    "year2Revenue" REAL,
    "year2Expenses" REAL,
    "year3Revenue" REAL,
    "year3Expenses" REAL,
    "aiAnalysis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreaSimSimulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JuridiqueAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recommendedStatus" TEXT,
    "fiscalRegime" TEXT,
    "legalStructure" TEXT,
    "socialCharges" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JuridiqueAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sector" TEXT,
    "marketSize" TEXT,
    "targetAudience" TEXT,
    "trends" JSONB,
    "competitors" JSONB,
    "opportunities" TEXT,
    "threats" TEXT,
    "aiSynthesis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tremplin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "responses" JSONB NOT NULL DEFAULT {},
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "score" INTEGER,
    "decision" TEXT,
    "summary" TEXT,
    "recommendations" JSONB NOT NULL DEFAULT [],
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tremplin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessModelCanvas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "partenairesCles" TEXT DEFAULT '',
    "activitesCles" TEXT DEFAULT '',
    "ressourcesCles" TEXT DEFAULT '',
    "propositionValeur" TEXT DEFAULT '',
    "relationsClients" TEXT DEFAULT '',
    "canaux" TEXT DEFAULT '',
    "segmentsClients" TEXT DEFAULT '',
    "structureCouts" TEXT DEFAULT '',
    "sourcesRevenus" TEXT DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generatedFromBp" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessModelCanvas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ZeroDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectTitle" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ZeroDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Actor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "description" TEXT,
    "services" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "successRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Actor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favorite_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscussionCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Discussion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT [],
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Discussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Discussion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DiscussionCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discussionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reply_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Reply" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mentor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "expertise" JSONB NOT NULL DEFAULT [],
    "sectors" JSONB NOT NULL DEFAULT [],
    "location" TEXT NOT NULL DEFAULT '',
    "availability" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "maxMentees" INTEGER NOT NULL DEFAULT 3,
    "rating" REAL NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mentor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MentorshipRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "objectives" JSONB NOT NULL DEFAULT [],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MentorshipRequest_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MentorshipRequest_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mentorship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "rating" REAL,
    "review" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mentorship_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mentorship_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'DIAGNOSTIC',
    "phase" TEXT NOT NULL DEFAULT 'DISCOVERY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT {},
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AppModule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" JSONB NOT NULL DEFAULT {},
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT,
    "fileData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CvUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fileName" TEXT,
    "cvText" TEXT,
    "parsedSkills" JSONB,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CvUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Livrable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "counselorId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT {},
    "fileUrl" TEXT,
    "fileName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generatedBy" TEXT,
    "generatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Livrable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Livrable_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "Counselor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "counselorId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FOLLOW_UP',
    "mode" TEXT NOT NULL DEFAULT 'PHYSICAL',
    "scheduledAt" DATETIME NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "videoLink" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "Counselor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "counselorId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'bilan',
    "phase" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "synthesis" TEXT,
    "recommendations" JSONB NOT NULL DEFAULT [],
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InterviewSession_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "Counselor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InterviewSession_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterviewNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interviewId" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'general',
    "category" TEXT NOT NULL DEFAULT 'observation',
    "content" TEXT NOT NULL,
    "isKeyPoint" BOOLEAN NOT NULL DEFAULT false,
    "isActionItem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterviewNote_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "InterviewSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessibilitySetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "textSize" INTEGER NOT NULL DEFAULT 100,
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "readingLine" BOOLEAN NOT NULL DEFAULT false,
    "dyslexicFont" BOOLEAN NOT NULL DEFAULT false,
    "pauseAnimations" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccessibilitySetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Network" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Network_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonalizedPath" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "steps" JSONB NOT NULL DEFAULT [],
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PersonalizedPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectType" TEXT,
    "projectDescription" TEXT,
    "projectStage" TEXT,
    "motivations" TEXT,
    "needs" JSONB NOT NULL DEFAULT [],
    "supportType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SwipeCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SwipeGameResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "cardCode" TEXT NOT NULL,
    "cardTitle" TEXT NOT NULL,
    "kept" BOOLEAN NOT NULL,
    "superPepite" BOOLEAN NOT NULL DEFAULT false,
    "confidence" INTEGER,
    "swipedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SwipeGameResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SwipeGameResult_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "SwipeCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SwipeQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "type" TEXT NOT NULL DEFAULT 'scale',
    "options" JSONB,
    "helpText" TEXT,
    "scoring" JSONB,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SwipeAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" INTEGER,
    "score" REAL,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SwipeAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SwipeAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SwipeQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "participant1Id" TEXT NOT NULL,
    "participant2Id" TEXT NOT NULL,
    "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Conversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedNews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "title" TEXT,
    "excerpt" TEXT,
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedNews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'Inspiration',
    "imageGradient" TEXT,
    "imageUrl" TEXT,
    "authorName" TEXT NOT NULL DEFAULT 'Équipe CreaPulse',
    "authorRole" TEXT NOT NULL DEFAULT 'GIDEF Île-de-France',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "readTime" INTEGER NOT NULL DEFAULT 5,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuizLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "ville" TEXT,
    "age" INTEGER,
    "category" TEXT NOT NULL,
    "quizResults" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Dispositif" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'BASE',
    "color" TEXT NOT NULL DEFAULT '#00838F',
    "icon" TEXT NOT NULL DEFAULT 'Briefcase',
    "durationDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "moduleConfig" JSONB NOT NULL DEFAULT {"include":null,"exclude":[]},
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dispositif_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dispositifId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIF',
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "pausedAt" DATETIME,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "projectTitle" TEXT,
    "settings" JSONB NOT NULL DEFAULT {},
    CONSTRAINT "UserEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserEnrollment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserEnrollment_dispositifId_fkey" FOREIGN KEY ("dispositifId") REFERENCES "Dispositif" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreascopeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "beneficiaryId" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANIFIEE',
    "currentStep" TEXT NOT NULL DEFAULT 'ACCUEIL',
    "scheduledAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 240,
    "stepProgress" JSONB NOT NULL DEFAULT {},
    "counselorNotes" TEXT,
    "aiInsights" JSONB,
    "actionPlan" JSONB,
    "globalScore" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreascopeSession_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CreascopeSession_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "Counselor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GRANTED',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" TEXT NOT NULL DEFAULT 'web',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" DATETIME,
    CONSTRAINT "ConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataExportRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "format" TEXT NOT NULL DEFAULT 'json',
    "filePath" TEXT,
    "expiresAt" DATETIME,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "error" TEXT,
    CONSTRAINT "DataExportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataDeletionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "processedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "DataDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaaProgram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIF',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plannedEndAt" DATETIME NOT NULL,
    "followUpAt" DATETIME,
    "followUpDone" BOOLEAN NOT NULL DEFAULT false,
    "conclusion" TEXT,
    "conclusionNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaaProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaaProgram_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaaMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "plannedDate" DATETIME,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PLANIFIE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaaMilestone_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PaaProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaaAtelierSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "atelierCode" TEXT NOT NULL,
    "atelierName" TEXT NOT NULL,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NON_SUIVI',
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaaAtelierSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PaaProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SmartObjective" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "specific" TEXT NOT NULL,
    "measurable" TEXT NOT NULL,
    "achievable" TEXT NOT NULL,
    "relevant" TEXT NOT NULL,
    "timeBound" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'EN_COURS',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SmartObjective_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PaaProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SatisfactionFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "nps" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SatisfactionFeedback_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PaaProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SatisfactionFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MindMap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Sans titre',
    "nodes" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MindMap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MindMap_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_name_key" ON "Tenant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_siret_key" ON "Organization"("siret");

-- CreateIndex
CREATE INDEX "Organization_tenantId_idx" ON "Organization"("tenantId");

-- CreateIndex
CREATE INDEX "User_tenantId_role_idx" ON "User"("tenantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Counselor_userId_key" ON "Counselor"("userId");

-- CreateIndex
CREATE INDEX "Counselor_organizationId_idx" ON "Counselor"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiary_userId_key" ON "Beneficiary"("userId");

-- CreateIndex
CREATE INDEX "Beneficiary_organizationId_idx" ON "Beneficiary"("organizationId");

-- CreateIndex
CREATE INDEX "CounselorAssignment_counselorId_idx" ON "CounselorAssignment"("counselorId");

-- CreateIndex
CREATE INDEX "CounselorAssignment_beneficiaryId_idx" ON "CounselorAssignment"("beneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "CounselorAssignment_counselorId_beneficiaryId_key" ON "CounselorAssignment"("counselorId", "beneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorJourney_userId_key" ON "CreatorJourney"("userId");

-- CreateIndex
CREATE INDEX "BpSnapshot_userId_idx" ON "BpSnapshot"("userId");

-- CreateIndex
CREATE INDEX "BpSnapshot_tenantId_idx" ON "BpSnapshot"("tenantId");

-- CreateIndex
CREATE INDEX "BpSnapshot_creatorJourneyId_idx" ON "BpSnapshot"("creatorJourneyId");

-- CreateIndex
CREATE INDEX "BpSnapshot_userId_createdAt_idx" ON "BpSnapshot"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ModuleResult_userId_idx" ON "ModuleResult"("userId");

-- CreateIndex
CREATE INDEX "ModuleResult_moduleCode_idx" ON "ModuleResult"("moduleCode");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleResult_userId_moduleCode_key" ON "ModuleResult"("userId", "moduleCode");

-- CreateIndex
CREATE INDEX "KiviatResult_userId_idx" ON "KiviatResult"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KiviatResult_userId_category_key" ON "KiviatResult"("userId", "category");

-- CreateIndex
CREATE INDEX "RiasecResult_userId_idx" ON "RiasecResult"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RiasecResult_userId_profileType_key" ON "RiasecResult"("userId", "profileType");

-- CreateIndex
CREATE UNIQUE INDEX "MotivationAssessment_userId_key" ON "MotivationAssessment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialForecast_userId_key" ON "FinancialForecast"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreaSimSimulation_userId_key" ON "CreaSimSimulation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JuridiqueAnalysis_userId_key" ON "JuridiqueAnalysis"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketAnalysis_userId_key" ON "MarketAnalysis"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tremplin_userId_key" ON "Tremplin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessModelCanvas_userId_key" ON "BusinessModelCanvas"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ZeroDraft_userId_key" ON "ZeroDraft"("userId");

-- CreateIndex
CREATE INDEX "Actor_tenantId_type_idx" ON "Actor"("tenantId", "type");

-- CreateIndex
CREATE INDEX "Actor_city_idx" ON "Actor"("city");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_actorId_key" ON "Favorite"("userId", "actorId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionCategory_slug_key" ON "DiscussionCategory"("slug");

-- CreateIndex
CREATE INDEX "Discussion_categoryId_idx" ON "Discussion"("categoryId");

-- CreateIndex
CREATE INDEX "Discussion_authorId_idx" ON "Discussion"("authorId");

-- CreateIndex
CREATE INDEX "Reply_discussionId_idx" ON "Reply"("discussionId");

-- CreateIndex
CREATE INDEX "Reply_authorId_idx" ON "Reply"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "Mentor_userId_key" ON "Mentor"("userId");

-- CreateIndex
CREATE INDEX "MentorshipRequest_mentorId_idx" ON "MentorshipRequest"("mentorId");

-- CreateIndex
CREATE INDEX "Mentorship_mentorId_idx" ON "Mentorship"("mentorId");

-- CreateIndex
CREATE UNIQUE INDEX "Mentorship_mentorId_menteeId_key" ON "Mentorship"("mentorId", "menteeId");

-- CreateIndex
CREATE INDEX "AppModule_tenantId_isActive_idx" ON "AppModule"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AppModule_tenantId_code_key" ON "AppModule"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "UserFile_userId_idx" ON "UserFile"("userId");

-- CreateIndex
CREATE INDEX "UserFile_category_idx" ON "UserFile"("category");

-- CreateIndex
CREATE INDEX "CvUpload_userId_idx" ON "CvUpload"("userId");

-- CreateIndex
CREATE INDEX "Livrable_userId_idx" ON "Livrable"("userId");

-- CreateIndex
CREATE INDEX "Livrable_counselorId_idx" ON "Livrable"("counselorId");

-- CreateIndex
CREATE INDEX "Appointment_counselorId_scheduledAt_idx" ON "Appointment"("counselorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_beneficiaryId_scheduledAt_idx" ON "Appointment"("beneficiaryId", "scheduledAt");

-- CreateIndex
CREATE INDEX "InterviewSession_counselorId_idx" ON "InterviewSession"("counselorId");

-- CreateIndex
CREATE INDEX "InterviewSession_beneficiaryId_idx" ON "InterviewSession"("beneficiaryId");

-- CreateIndex
CREATE INDEX "InterviewNote_interviewId_idx" ON "InterviewNote"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessibilitySetting_userId_key" ON "AccessibilitySetting"("userId");

-- CreateIndex
CREATE INDEX "Network_userId_idx" ON "Network"("userId");

-- CreateIndex
CREATE INDEX "PersonalizedPath_userId_idx" ON "PersonalizedPath"("userId");

-- CreateIndex
CREATE INDEX "Registration_userId_idx" ON "Registration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SwipeCard_code_key" ON "SwipeCard"("code");

-- CreateIndex
CREATE INDEX "SwipeCard_category_idx" ON "SwipeCard"("category");

-- CreateIndex
CREATE INDEX "SwipeCard_isActive_sortOrder_idx" ON "SwipeCard"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "SwipeGameResult_userId_idx" ON "SwipeGameResult"("userId");

-- CreateIndex
CREATE INDEX "SwipeGameResult_cardCode_idx" ON "SwipeGameResult"("cardCode");

-- CreateIndex
CREATE UNIQUE INDEX "SwipeGameResult_userId_cardId_key" ON "SwipeGameResult"("userId", "cardId");

-- CreateIndex
CREATE UNIQUE INDEX "SwipeQuestion_code_key" ON "SwipeQuestion"("code");

-- CreateIndex
CREATE INDEX "SwipeQuestion_category_type_idx" ON "SwipeQuestion"("category", "type");

-- CreateIndex
CREATE INDEX "SwipeQuestion_isActive_sortOrder_idx" ON "SwipeQuestion"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "SwipeAnswer_userId_idx" ON "SwipeAnswer"("userId");

-- CreateIndex
CREATE INDEX "SwipeAnswer_questionId_idx" ON "SwipeAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "SwipeAnswer_userId_questionId_key" ON "SwipeAnswer"("userId", "questionId");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_idx" ON "Conversation"("tenantId");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_participant1Id_participant2Id_key" ON "Conversation"("participant1Id", "participant2Id");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "SavedNews_userId_idx" ON "SavedNews"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedNews_userId_newsId_key" ON "SavedNews"("userId", "newsId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_slug_key" ON "NewsArticle"("slug");

-- CreateIndex
CREATE INDEX "NewsArticle_category_idx" ON "NewsArticle"("category");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "NewsArticle_isPublished_idx" ON "NewsArticle"("isPublished");

-- CreateIndex
CREATE INDEX "QuizLead_category_idx" ON "QuizLead"("category");

-- CreateIndex
CREATE INDEX "QuizLead_email_idx" ON "QuizLead"("email");

-- CreateIndex
CREATE INDEX "Dispositif_tenantId_idx" ON "Dispositif"("tenantId");

-- CreateIndex
CREATE INDEX "Dispositif_isActive_idx" ON "Dispositif"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Dispositif_tenantId_code_key" ON "Dispositif"("tenantId", "code");

-- CreateIndex
CREATE INDEX "UserEnrollment_userId_idx" ON "UserEnrollment"("userId");

-- CreateIndex
CREATE INDEX "UserEnrollment_tenantId_idx" ON "UserEnrollment"("tenantId");

-- CreateIndex
CREATE INDEX "UserEnrollment_dispositifId_idx" ON "UserEnrollment"("dispositifId");

-- CreateIndex
CREATE INDEX "UserEnrollment_status_idx" ON "UserEnrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserEnrollment_userId_dispositifId_key" ON "UserEnrollment"("userId", "dispositifId");

-- CreateIndex
CREATE INDEX "CreascopeSession_beneficiaryId_idx" ON "CreascopeSession"("beneficiaryId");

-- CreateIndex
CREATE INDEX "CreascopeSession_counselorId_idx" ON "CreascopeSession"("counselorId");

-- CreateIndex
CREATE INDEX "CreascopeSession_status_scheduledAt_idx" ON "CreascopeSession"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "ConsentLog_userId_idx" ON "ConsentLog"("userId");

-- CreateIndex
CREATE INDEX "ConsentLog_consentType_status_idx" ON "ConsentLog"("consentType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentLog_userId_consentType_key" ON "ConsentLog"("userId", "consentType");

-- CreateIndex
CREATE INDEX "DataExportRequest_userId_idx" ON "DataExportRequest"("userId");

-- CreateIndex
CREATE INDEX "DataExportRequest_status_idx" ON "DataExportRequest"("status");

-- CreateIndex
CREATE INDEX "DataDeletionRequest_userId_idx" ON "DataDeletionRequest"("userId");

-- CreateIndex
CREATE INDEX "DataDeletionRequest_status_idx" ON "DataDeletionRequest"("status");

-- CreateIndex
CREATE INDEX "PaaProgram_userId_idx" ON "PaaProgram"("userId");

-- CreateIndex
CREATE INDEX "PaaProgram_tenantId_idx" ON "PaaProgram"("tenantId");

-- CreateIndex
CREATE INDEX "PaaProgram_status_idx" ON "PaaProgram"("status");

-- CreateIndex
CREATE INDEX "PaaMilestone_programId_idx" ON "PaaMilestone"("programId");

-- CreateIndex
CREATE INDEX "PaaMilestone_type_idx" ON "PaaMilestone"("type");

-- CreateIndex
CREATE INDEX "PaaAtelierSession_programId_idx" ON "PaaAtelierSession"("programId");

-- CreateIndex
CREATE INDEX "PaaAtelierSession_atelierCode_idx" ON "PaaAtelierSession"("atelierCode");

-- CreateIndex
CREATE INDEX "SmartObjective_programId_idx" ON "SmartObjective"("programId");

-- CreateIndex
CREATE INDEX "SatisfactionFeedback_programId_idx" ON "SatisfactionFeedback"("programId");

-- CreateIndex
CREATE INDEX "SatisfactionFeedback_userId_idx" ON "SatisfactionFeedback"("userId");

-- CreateIndex
CREATE INDEX "SatisfactionFeedback_type_idx" ON "SatisfactionFeedback"("type");

-- CreateIndex
CREATE INDEX "MindMap_userId_idx" ON "MindMap"("userId");

-- CreateIndex
CREATE INDEX "MindMap_tenantId_idx" ON "MindMap"("tenantId");
