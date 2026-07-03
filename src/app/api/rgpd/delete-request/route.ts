import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken, hasMinRole, hashPassword } from '@/lib/auth'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { createLogger } from '@/lib/logger'

const log = createLogger('RGPD-Delete')

// ─── Zod Schemas ──────────────────────────────

const createDeletionSchema = z.object({
  reason: z.string().max(2000).optional(),
})

const reviewDeletionSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    message: 'L\'action doit être "approve" ou "reject"',
  }),
  notes: z.string().max(2000).optional(),
})

// ─── Types ───────────────────────────────────

interface DeletionAuditLog {
  step: string
  model: string
  count: number
}

// ─── Helper: Perform cascading data deletion ────────────────────────

async function performUserDataDeletion(
  targetUserId: string,
  reviewerId: string,
): Promise<{ auditLog: DeletionAuditLog[]; anonymizedEmail: string }> {
  const auditLog: DeletionAuditLog[] = []

  // Use Prisma interactive transaction for atomicity
  await db.$transaction(async (tx) => {
    // ────────────────────────────────────────────────────
    // PHASE 1: Find linked profile IDs (needed for indirect FKs)
    // ────────────────────────────────────────────────────
    const [counselor, beneficiary] = await Promise.all([
      tx.counselor.findUnique({ where: { userId: targetUserId }, select: { id: true } }),
      tx.beneficiary.findUnique({ where: { userId: targetUserId }, select: { id: true } }),
    ])

    const counselorId = counselor?.id
    const beneficiaryId = beneficiary?.id

    // ────────────────────────────────────────────────────
    // PHASE 2: Delete Conversation data (no FK to User, plain string fields)
    // ────────────────────────────────────────────────────
    // Find conversations where user is a participant
    const conversations = await tx.conversation.findMany({
      where: {
        OR: [
          { participant1Id: targetUserId },
          { participant2Id: targetUserId },
        ],
      },
      select: { id: true },
    })
    const conversationIds = conversations.map((c) => c.id)

    if (conversationIds.length > 0) {
      // Delete messages in those conversations (cascade via conversationId)
      const msgResult = await tx.message.deleteMany({
        where: { conversationId: { in: conversationIds } },
      })
      if (msgResult.count > 0) {
        auditLog.push({ step: 'conversations', model: 'Message', count: msgResult.count })
      }

      // Delete the conversations themselves
      const convResult = await tx.conversation.deleteMany({
        where: { id: { in: conversationIds } },
      })
      if (convResult.count > 0) {
        auditLog.push({ step: 'conversations', model: 'Conversation', count: convResult.count })
      }
    }

    // ────────────────────────────────────────────────────
    // PHASE 3: Delete InterviewSessions BEFORE Counselor/Beneficiary
    // InterviewSession.counselorId has NO onDelete cascade
    // InterviewSession.beneficiaryId HAS onDelete cascade from Beneficiary
    // To be safe, delete all InterviewSessions linked to either profile
    // ────────────────────────────────────────────────────
    if (counselorId || beneficiaryId) {
      const interviewWhere: Record<string, unknown> = {}
      if (counselorId && beneficiaryId) {
        interviewWhere.OR = [{ counselorId }, { beneficiaryId }]
      } else if (counselorId) {
        interviewWhere.counselorId = counselorId
      } else if (beneficiaryId) {
        interviewWhere.beneficiaryId = beneficiaryId
      }

      const interviewResult = await tx.interviewSession.deleteMany({ where: interviewWhere })
      if (interviewResult.count > 0) {
        auditLog.push({ step: 'interviews', model: 'InterviewSession', count: interviewResult.count })
      }
    }

    // ────────────────────────────────────────────────────
    // PHASE 4: Delete user's PAA data
    // PaaProgram has no cascade from User, must delete manually
    // Children (PaaMilestone, PaaAtelierSession, SmartObjective) cascade from PaaProgram
    // SatisfactionFeedback has no cascade from User, must delete manually
    // ────────────────────────────────────────────────────
    const paaPrograms = await tx.paaProgram.findMany({
      where: { userId: targetUserId },
      select: { id: true },
    })
    const paaProgramIds = paaPrograms.map((p) => p.id)

    // Delete SatisfactionFeedback for user's programs + userId
    if (paaProgramIds.length > 0) {
      const satResult = await tx.satisfactionFeedback.deleteMany({
        where: {
          AND: [
            { programId: { in: paaProgramIds } },
            { userId: targetUserId },
          ],
        },
      })
      if (satResult.count > 0) {
        auditLog.push({ step: 'paa', model: 'SatisfactionFeedback', count: satResult.count })
      }
    }

    // Delete PaaPrograms (cascades to PaaMilestone, PaaAtelierSession, SmartObjective)
    const paaResult = await tx.paaProgram.deleteMany({
      where: { userId: targetUserId },
    })
    if (paaResult.count > 0) {
      auditLog.push({ step: 'paa', model: 'PaaProgram', count: paaResult.count })
    }

    // ────────────────────────────────────────────────────
    // PHASE 5: Delete leaf-level user-generated content
    // These have direct userId FK to User with onDelete: Cascade
    // But since we're NOT deleting User, we must delete them manually
    // ────────────────────────────────────────────────────

    // Files and uploads
    const userFileResult = await tx.userFile.deleteMany({ where: { userId: targetUserId } })
    if (userFileResult.count > 0) auditLog.push({ step: 'files', model: 'UserFile', count: userFileResult.count })

    const cvResult = await tx.cvUpload.deleteMany({ where: { userId: targetUserId } })
    if (cvResult.count > 0) auditLog.push({ step: 'files', model: 'CvUpload', count: cvResult.count })

    // Saved news and favorites
    const savedNewsResult = await tx.savedNews.deleteMany({ where: { userId: targetUserId } })
    if (savedNewsResult.count > 0) auditLog.push({ step: 'community', model: 'SavedNews', count: savedNewsResult.count })

    const favoriteResult = await tx.favorite.deleteMany({ where: { userId: targetUserId } })
    if (favoriteResult.count > 0) auditLog.push({ step: 'community', model: 'Favorite', count: favoriteResult.count })

    // Forum: discussions (author) and replies (author)
    const discResult = await tx.discussion.deleteMany({ where: { authorId: targetUserId } })
    if (discResult.count > 0) auditLog.push({ step: 'community', model: 'Discussion', count: discResult.count })

    const replyResult = await tx.reply.deleteMany({ where: { authorId: targetUserId } })
    if (replyResult.count > 0) auditLog.push({ step: 'community', model: 'Reply', count: replyResult.count })

    // Network, registrations, paths
    const networkResult = await tx.network.deleteMany({ where: { userId: targetUserId } })
    if (networkResult.count > 0) auditLog.push({ step: 'secondary', model: 'Network', count: networkResult.count })

    const regResult = await tx.registration.deleteMany({ where: { userId: targetUserId } })
    if (regResult.count > 0) auditLog.push({ step: 'secondary', model: 'Registration', count: regResult.count })

    const pathResult = await tx.personalizedPath.deleteMany({ where: { userId: targetUserId } })
    if (pathResult.count > 0) auditLog.push({ step: 'secondary', model: 'PersonalizedPath', count: pathResult.count })

    const accessResult = await tx.accessibilitySetting.deleteMany({ where: { userId: targetUserId } })
    if (accessResult.count > 0) auditLog.push({ step: 'secondary', model: 'AccessibilitySetting', count: accessResult.count })

    // ────────────────────────────────────────────────────
    // PHASE 6: Delete diagnostic and analysis data
    // ────────────────────────────────────────────────────
    const swipeResultResult = await tx.swipeGameResult.deleteMany({ where: { userId: targetUserId } })
    if (swipeResultResult.count > 0) auditLog.push({ step: 'diagnostics', model: 'SwipeGameResult', count: swipeResultResult.count })

    const swipeAnswerResult = await tx.swipeAnswer.deleteMany({ where: { userId: targetUserId } })
    if (swipeAnswerResult.count > 0) auditLog.push({ step: 'diagnostics', model: 'SwipeAnswer', count: swipeAnswerResult.count })

    const kiviatResult = await tx.kiviatResult.deleteMany({ where: { userId: targetUserId } })
    if (kiviatResult.count > 0) auditLog.push({ step: 'diagnostics', model: 'KiviatResult', count: kiviatResult.count })

    const riasecResult = await tx.riasecResult.deleteMany({ where: { userId: targetUserId } })
    if (riasecResult.count > 0) auditLog.push({ step: 'diagnostics', model: 'RiasecResult', count: riasecResult.count })

    const moduleResultResult = await tx.moduleResult.deleteMany({ where: { userId: targetUserId } })
    if (moduleResultResult.count > 0) auditLog.push({ step: 'diagnostics', model: 'ModuleResult', count: moduleResultResult.count })

    // Unique diagnostic records
    const motivationDel = await tx.motivationAssessment.deleteMany({ where: { userId: targetUserId } })
    if (motivationDel.count > 0) auditLog.push({ step: 'diagnostics', model: 'MotivationAssessment', count: motivationDel.count })

    // ────────────────────────────────────────────────────
    // PHASE 7: Delete analysis and document data
    // ────────────────────────────────────────────────────
    const journeyDel = await tx.creatorJourney.deleteMany({ where: { userId: targetUserId } })
    if (journeyDel.count > 0) auditLog.push({ step: 'documents', model: 'CreatorJourney', count: journeyDel.count })

    const forecastDel = await tx.financialForecast.deleteMany({ where: { userId: targetUserId } })
    if (forecastDel.count > 0) auditLog.push({ step: 'documents', model: 'FinancialForecast', count: forecastDel.count })

    const creasimDel = await tx.creaSimSimulation.deleteMany({ where: { userId: targetUserId } })
    if (creasimDel.count > 0) auditLog.push({ step: 'documents', model: 'CreaSimSimulation', count: creasimDel.count })

    const juridiqueDel = await tx.juridiqueAnalysis.deleteMany({ where: { userId: targetUserId } })
    if (juridiqueDel.count > 0) auditLog.push({ step: 'documents', model: 'JuridiqueAnalysis', count: juridiqueDel.count })

    const marketDel = await tx.marketAnalysis.deleteMany({ where: { userId: targetUserId } })
    if (marketDel.count > 0) auditLog.push({ step: 'documents', model: 'MarketAnalysis', count: marketDel.count })

    const tremplinDel = await tx.tremplin.deleteMany({ where: { userId: targetUserId } })
    if (tremplinDel.count > 0) auditLog.push({ step: 'documents', model: 'Tremplin', count: tremplinDel.count })

    const bmcDel = await tx.businessModelCanvas.deleteMany({ where: { userId: targetUserId } })
    if (bmcDel.count > 0) auditLog.push({ step: 'documents', model: 'BusinessModelCanvas', count: bmcDel.count })

    const zeroDraftDel = await tx.zeroDraft.deleteMany({ where: { userId: targetUserId } })
    if (zeroDraftDel.count > 0) auditLog.push({ step: 'documents', model: 'ZeroDraft', count: zeroDraftDel.count })

    const livrableDel = await tx.livrable.deleteMany({ where: { userId: targetUserId } })
    if (livrableDel.count > 0) auditLog.push({ step: 'documents', model: 'Livrable', count: livrableDel.count })

    // ────────────────────────────────────────────────────
    // PHASE 8: Delete mentorship data
    // ────────────────────────────────────────────────────
    const mentorshipDel = await tx.mentorship.deleteMany({ where: { menteeId: targetUserId } })
    if (mentorshipDel.count > 0) auditLog.push({ step: 'mentorship', model: 'Mentorship', count: mentorshipDel.count })

    const mentorRequestDel = await tx.mentorshipRequest.deleteMany({ where: { menteeId: targetUserId } })
    if (mentorRequestDel.count > 0) auditLog.push({ step: 'mentorship', model: 'MentorshipRequest', count: mentorRequestDel.count })

    const mentorDel = await tx.mentor.deleteMany({ where: { userId: targetUserId } })
    if (mentorDel.count > 0) auditLog.push({ step: 'mentorship', model: 'Mentor', count: mentorDel.count })

    // ────────────────────────────────────────────────────
    // PHASE 9: Delete notifications and consent logs
    // ────────────────────────────────────────────────────
    const notifResult = await tx.notification.deleteMany({ where: { userId: targetUserId } })
    if (notifResult.count > 0) auditLog.push({ step: 'infra', model: 'Notification', count: notifResult.count })

    const consentResult = await tx.consentLog.deleteMany({ where: { userId: targetUserId } })
    if (consentResult.count > 0) auditLog.push({ step: 'infra', model: 'ConsentLog', count: consentResult.count })

    // Nullify audit logs (onDelete: SetNull, so we just null the userId)
    const auditResult = await tx.auditLog.updateMany({
      where: { userId: targetUserId },
      data: { userId: null },
    })
    if (auditResult.count > 0) auditLog.push({ step: 'infra', model: 'AuditLog', count: auditResult.count })

    // ────────────────────────────────────────────────────
    // PHASE 10: Delete RGPD requests (DataExportRequest, DataDeletionRequest)
    // ────────────────────────────────────────────────────
    const exportReqDel = await tx.dataExportRequest.deleteMany({ where: { userId: targetUserId } })
    if (exportReqDel.count > 0) auditLog.push({ step: 'rgpd', model: 'DataExportRequest', count: exportReqDel.count })

    // Don't delete the current deletion request inside the transaction
    // It will be kept for audit purposes

    // ────────────────────────────────────────────────────
    // PHASE 11: Delete Counselor/Beneficiary profiles
    // This cascades to: CounselorAssignment, Appointment, CreascopeSession
    // ────────────────────────────────────────────────────
    if (beneficiaryId) {
      await tx.beneficiary.delete({ where: { id: beneficiaryId } })
      auditLog.push({ step: 'profiles', model: 'Beneficiary', count: 1 })
    }

    if (counselorId) {
      await tx.counselor.delete({ where: { id: counselorId } })
      auditLog.push({ step: 'profiles', model: 'Counselor', count: 1 })
    }

    // ────────────────────────────────────────────────────
    // PHASE 12: Delete auth sessions and accounts
    // ────────────────────────────────────────────────────
    const sessionResult = await tx.session.deleteMany({ where: { userId: targetUserId } })
    if (sessionResult.count > 0) auditLog.push({ step: 'auth', model: 'Session', count: sessionResult.count })

    const accountResult = await tx.account.deleteMany({ where: { userId: targetUserId } })
    if (accountResult.count > 0) auditLog.push({ step: 'auth', model: 'Account', count: accountResult.count })

    // ────────────────────────────────────────────────────
    // PHASE 13: Anonymize the User record
    // Keep the record for audit/fraud prevention, but remove all PII
    // ────────────────────────────────────────────────────
    const anonymizedEmail = `deleted-${targetUserId}@anonymized.local`
    const randomHash = await hashPassword(`deleted-${Date.now()}-${Math.random().toString(36)}`)

    await tx.user.update({
      where: { id: targetUserId },
      data: {
        email: anonymizedEmail,
        firstName: '[Supprimé]',
        lastName: '[Supprimé]',
        avatarUrl: null,
        passwordHash: randomHash,
        isActive: false,
        emailVerified: false,
        lastLoginAt: null,
      },
    })

    auditLog.push({ step: 'anonymize', model: 'User', count: 1 })
  })

  const anonymizedEmail = `deleted-${targetUserId}@anonymized.local`
  return { auditLog, anonymizedEmail }
}

// ─── POST: Créer une demande de suppression (utilisateur) ─────────

export async function POST(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('session')?.value
    const headerToken = getTokenFromHeader(request)
    const token = cookieToken || headerToken
    if (!token) return Errors.unauthorized('Token manquant')

    const payload = await verifyToken(token)
    const userId = payload.userId

    const body = await request.json().catch(() => ({}))
    const parsed = createDeletionSchema.safeParse(body)
    if (!parsed.success) return Errors.validation(parsed.error.issues)

    const { reason } = parsed.data

    // Vérifier qu'il n'y a pas déjà une demande en cours
    const existingPending = await db.dataDeletionRequest.findFirst({
      where: {
        userId,
        status: 'pending',
      },
    })

    if (existingPending) {
      return Errors.validation(
        { field: 'status', message: 'Une demande de suppression est déjà en cours' },
        'Une demande de suppression est déjà en attente',
      )
    }

    const deletionRequest = await db.dataDeletionRequest.create({
      data: {
        userId,
        reason: reason || null,
        status: 'pending',
      },
    })

    return success(
      {
        id: deletionRequest.id,
        status: deletionRequest.status,
        requestedAt: deletionRequest.requestedAt || deletionRequest.createdAt,
      },
      'Demande de suppression créée avec succès',
      201,
    )
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── PATCH: Approuver ou rejeter une demande (conseiller/admin) ───

export async function PATCH(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('session')?.value
    const headerToken = getTokenFromHeader(request)
    const token = cookieToken || headerToken
    if (!token) return Errors.unauthorized('Token manquant')

    const payload = await verifyToken(token)

    // Vérifier les droits : conseiller ou admin uniquement
    if (!hasMinRole(payload.role, 'COUNSELOR')) {
      return Errors.forbidden(
        'Seuls les conseillers et administrateurs peuvent examiner les demandes de suppression',
      )
    }

    const body = await request.json()
    const parsed = reviewDeletionSchema.safeParse(body)
    if (!parsed.success) return Errors.validation(parsed.error.issues)

    const { action, notes } = parsed.data
    const reviewerId = payload.userId

    // Trouver la demande à examiner
    const requestIdSchema = z.object({
      requestId: z.string().min(1, 'ID de demande requis'),
    })
    const requestIdParsed = requestIdSchema.safeParse(body)
    if (!requestIdParsed.success) {
      return Errors.validation(
        requestIdParsed.error.issues,
        'L\'identifiant de la demande (requestId) est requis',
      )
    }

    const requestId = requestIdParsed.data.requestId

    const deletionRequest = await db.dataDeletionRequest.findUnique({
      where: { id: requestId },
    })

    if (!deletionRequest) {
      return Errors.notFound('Demande de suppression')
    }

    if (deletionRequest.status !== 'pending') {
      return Errors.validation(
        { field: 'status', message: 'Cette demande n\'est plus en attente' },
        'La demande a déjà été traitée',
      )
    }

    if (action === 'reject') {
      // Simple rejection: just update status
      const updated = await db.dataDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          notes: notes || null,
        },
      })

      return success(
        {
          id: updated.id,
          userId: updated.userId,
          status: updated.status,
          reviewedAt: updated.reviewedAt,
          notes: updated.notes,
        },
        'Demande de suppression rejetée',
      )
    }

    // ─── APPROVE: Perform actual data deletion ───────────

    const targetUserId = deletionRequest.userId

    // Verify the target user exists
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, firstName: true, lastName: true, tenantId: true },
    })

    if (!targetUser) {
      return Errors.notFound('Utilisateur cible')
    }

    // Cross-tenant check: COUNSELOR can only process requests for users in their tenant
    if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
      if (targetUser.tenantId !== payload.tenantId) {
        return Errors.forbidden('Vous ne pouvez pas traiter une demande d\'un utilisateur d\'une autre organisation')
      }
    }

    // Update request status to 'approved' first
    await db.dataDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        notes: notes || null,
        processedAt: new Date(),
      },
    })

    // Perform the actual cascading data deletion
    try {
      const { auditLog, anonymizedEmail } = await performUserDataDeletion(targetUserId, reviewerId)

      // Log the deletion summary (no PII — userId only for traceability)
      log.info('Data deletion completed', { userId: targetUserId, requestId, auditLog })

      // Create an audit log entry (using raw query since AuditLog has optional userId)
      await db.auditLog.create({
        data: {
          action: 'USER_DELETE',
          entityType: 'User',
          entityId: targetUserId,
          details: {
            deletionRequestId: requestId,
            reviewerId,
            anonymizedEmail,
            auditLog,
            previousEmail: targetUser.email,
            previousName: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim(),
          },
        },
      })

      // Update the deletion request status to 'processed'
      const finalUpdate = await db.dataDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: 'processed',
          processedAt: new Date(),
        },
      })

      return success(
        {
          id: finalUpdate.id,
          userId: finalUpdate.userId,
          status: finalUpdate.status,
          reviewedAt: finalUpdate.reviewedAt,
          processedAt: finalUpdate.processedAt,
          notes: finalUpdate.notes,
          anonymizedEmail,
          deletionSummary: auditLog,
        },
        'Données utilisateur supprimées et anonymisées avec succès',
      )
    } catch (deletionErr) {
      const errMsg = deletionErr instanceof Error ? deletionErr.message : 'Erreur inconnue lors de la suppression'

      // Roll back the status to 'approved' with error note
      await db.dataDeletionRequest.update({
        where: { id: requestId },
        data: {
          notes: `[ERREUR SUPPRESSION] ${errMsg}\n${notes || ''}`,
        },
      })

      console.error(`[RGPD] CRITICAL: Data deletion FAILED for user ${targetUserId}`, deletionErr)

      return Errors.internal(
        'La suppression des données a échoué. La demande reste approuvée mais les données n\'ont pas été supprimées. Contactez l\'administrateur.',
      )
    }
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── GET: Lister les demandes de suppression (utilisateur ou admin) ─

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('session')?.value
    const headerToken = getTokenFromHeader(request)
    const token = cookieToken || headerToken
    if (!token) return Errors.unauthorized('Token manquant')

    const payload = await verifyToken(token)
    const userId = payload.userId

    // Les conseillers et admins voient toutes les demandes (filtered by tenant for COUNSELOR)
    if (hasMinRole(payload.role, 'COUNSELOR')) {
      const whereClause = (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN')
        ? {}
        : { user: { tenantId: payload.tenantId } }

      const allRequests = await db.dataDeletionRequest.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      })

      return success(allRequests, 'Toutes les demandes de suppression récupérées')
    }

    // Un utilisateur ne voit que ses propres demandes
    const userRequests = await db.dataDeletionRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        reason: true,
        reviewedAt: true,
        processedAt: true,
        notes: true,
        createdAt: true,
      },
    })

    return success(userRequests, 'Demandes de suppression récupérées avec succès')
  } catch (err) {
    return handleApiError(err)
  }
}
