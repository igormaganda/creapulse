import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'

// ─── Zod Schemas ──────────────────────────────

const createExportSchema = z.object({
  format: z.enum(['json', 'pdf']).default('json'),
})

// ─── GET: Lister les demandes d'export de l'utilisateur ────────────

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) return Errors.unauthorized('Token manquant')

    const payload = await verifyToken(token)
    const userId = payload.userId

    const exports = await db.dataExportRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      select: {
        id: true,
        status: true,
        format: true,
        requestedAt: true,
        completedAt: true,
        expiresAt: true,
        error: true,
      },
    })

    return success(exports, 'Demandes d\'export récupérées avec succès')
  } catch (err) {
    return handleApiError(err)
  }
}

// ─── POST: Créer une demande d'export et exporter les données ─────

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) return Errors.unauthorized('Token manquant')

    const payload = await verifyToken(token)
    const userId = payload.userId

    const body = await request.json().catch(() => ({}))
    const parsed = createExportSchema.safeParse(body)
    const format = parsed.success ? parsed.data.format : 'json'

    // Vérifier l'utilisateur
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return Errors.notFound('Utilisateur')
    }

    // Créer la demande d'export (statut "processing")
    const exportRequest = await db.dataExportRequest.create({
      data: {
        userId,
        format,
        status: 'processing',
      },
    })

    try {
      // Récupérer toutes les données de l'utilisateur en parallèle
      const [
        beneficiary,
        counselor,
        journey,
        kiviatResults,
        riasecResults,
        motivations,
        moduleResults,
        swipeResults,
        swipeAnswers,
        financialForecast,
        creasimSimulation,
        juridiqueAnalysis,
        marketAnalysis,
        tremplin,
        bmc,
        zeroDraft,
        consents,
        networks,
        personalPaths,
        registrations,
        messages,
        notifications,
        livrables,
        cvUploads,
        userFiles,
        // PAA data
        paaProgramsWithDetails,
        satisfactionFeedbacks,
      ] = await Promise.all([
        db.beneficiary.findUnique({
          where: { userId },
          select: {
            employmentStatus: true,
            educationLevel: true,
            lastDiploma: true,
            skills: true,
            hasDisability: true,
            disabilityRate: true,
            progressScore: true,
          },
        }),
        db.counselor.findUnique({
          where: { userId },
          select: {
            name: true,
            specialities: true,
            certifications: true,
            isAvailable: true,
          },
        }),
        db.creatorJourney.findUnique({
          where: { userId },
        }),
        db.kiviatResult.findMany({
          where: { userId },
        }),
        db.riasecResult.findMany({
          where: { userId },
        }),
        db.motivationAssessment.findUnique({
          where: { userId },
        }),
        db.moduleResult.findMany({
          where: { userId },
        }),
        db.swipeGameResult.findMany({
          where: { userId },
        }),
        db.swipeAnswer.findMany({
          where: { userId },
        }),
        db.financialForecast.findUnique({
          where: { userId },
        }),
        db.creaSimSimulation.findUnique({
          where: { userId },
        }),
        db.juridiqueAnalysis.findUnique({
          where: { userId },
        }),
        db.marketAnalysis.findUnique({
          where: { userId },
        }),
        db.tremplin.findUnique({
          where: { userId },
        }),
        db.businessModelCanvas.findUnique({
          where: { userId },
        }),
        db.zeroDraft.findUnique({
          where: { userId },
        }),
        db.consentLog.findMany({
          where: { userId },
          select: {
            consentType: true,
            status: true,
            grantedAt: true,
            withdrawnAt: true,
          },
        }),
        db.network.findMany({
          where: { userId },
        }),
        db.personalizedPath.findMany({
          where: { userId },
        }),
        db.registration.findMany({
          where: { userId },
        }),
        db.message.findMany({
          where: { senderId: userId },
          select: {
            id: true,
            content: true,
            isRead: true,
            createdAt: true,
            conversationId: true,
          },
        }),
        db.notification.findMany({
          where: { userId },
          select: {
            id: true,
            title: true,
            content: true,
            type: true,
            isRead: true,
            createdAt: true,
          },
        }),
        db.livrable.findMany({
          where: { userId },
          select: {
            id: true,
            type: true,
            title: true,
            status: true,
            generatedAt: true,
            createdAt: true,
          },
        }),
        db.cvUpload.findMany({
          where: { userId },
          select: {
            id: true,
            fileName: true,
            createdAt: true,
          },
        }),
        db.userFile.findMany({
          where: { userId },
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            category: true,
            createdAt: true,
          },
        }),
        // PAA program data with nested relations
        db.paaProgram.findMany({
          where: { userId },
          include: {
            milestones: {
              select: {
                id: true,
                type: true,
                label: true,
                plannedDate: true,
                completedAt: true,
                status: true,
                notes: true,
              },
            },
            ateliers: {
              select: {
                id: true,
                atelierCode: true,
                atelierName: true,
                completedAt: true,
                status: true,
                feedback: true,
              },
            },
            objectives: {
              select: {
                id: true,
                title: true,
                description: true,
                specific: true,
                measurable: true,
                achievable: true,
                relevant: true,
                timeBound: true,
                progress: true,
                status: true,
                completedAt: true,
              },
            },
          },
        }),
        db.satisfactionFeedback.findMany({
          where: { userId },
          select: {
            id: true,
            type: true,
            rating: true,
            comment: true,
            nps: true,
            createdAt: true,
          },
        }),
      ])

      // Récupérer les sessions CréaScope liées au profil
      const creascopeSessions = await db.creascopeSession.findMany({
        where: {
          OR: [
            { beneficiaryId: user.id },
            { counselorId: user.id },
          ],
        },
        select: {
          id: true,
          status: true,
          currentStep: true,
          scheduledAt: true,
          startedAt: true,
          completedAt: true,
          globalScore: true,
          createdAt: true,
        },
      }).catch(() => [])

      // Récupérer les entretiens liés au profil
      const interviewSessions = await db.interviewSession.findMany({
        where: {
          OR: [
            { beneficiaryId: user.id },
            { counselorId: user.id },
          ],
        },
        select: {
          id: true,
          type: true,
          status: true,
          scheduledAt: true,
          completedAt: true,
          synthesis: true,
          createdAt: true,
        },
      }).catch(() => [])

      // Construire l'export complet
      const exportData = {
        exportInfo: {
          demandedAt: new Date().toISOString(),
          userId: user.id,
          format,
          version: '2.0',
          generator: 'CreaPulse V2 RGPD Export',
        },
        profil: {
          prenom: user.firstName,
          nom: user.lastName,
          email: user.email,
          role: user.role,
          inscriptionLe: user.createdAt,
          beneficiaire: beneficiary || null,
          conseiller: counselor || null,
        },
        parcoursCreateur: journey || null,
        diagnostics: {
          kiviat: kiviatResults,
          riasec: riasecResults,
          motivations,
          moduleResults,
        },
        jeuPepites: {
          swipeResults,
          swipeAnswers,
        },
        creascopeSessions,
        entretiens: interviewSessions,
        analyses: {
          financier: financialForecast,
          creasim: creasimSimulation,
          juridique: juridiqueAnalysis,
          marche: marketAnalysis,
        },
        documents: {
          tremplin,
          businessModelCanvas: bmc,
          zeroDraft,
          livrables,
          cvUploads,
          fichiers: userFiles.map((f) => ({
            ...f,
            // Exclude fileData (base64 content) from export for size reasons
            // User can request file data separately if needed
          })),
        },
        programmeAccompagnementAmorcage: {
          programmes: paaProgramsWithDetails,
          retoursSatisfaction: satisfactionFeedbacks,
        },
        consentements: consents,
        reseau: networks,
        parcoursPersonnalises: personalPaths,
        inscriptions: registrations,
        messages,
        notifications,
      }

      // Mettre à jour la demande avec le résultat
      const completedExport = await db.dataExportRequest.update({
        where: { id: exportRequest.id },
        data: {
          status: 'ready',
          completedAt: new Date(),
          // Expiration dans 30 jours
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      return success(
        {
          id: completedExport.id,
          status: completedExport.status,
          format: completedExport.format,
          completedAt: completedExport.completedAt,
          expiresAt: completedExport.expiresAt,
          data: exportData,
        },
        'Export de données généré avec succès',
        201,
      )
    } catch (exportErr) {
      // En cas d'erreur pendant l'export, mettre à jour le statut
      const errorMessage =
        exportErr instanceof Error ? exportErr.message : 'Erreur inconnue lors de l\'export'

      await db.dataExportRequest.update({
        where: { id: exportRequest.id },
        data: {
          status: 'expired',
          error: errorMessage,
        },
      })

      return Errors.internal('Erreur lors de la génération de l\'export')
    }
  } catch (err) {
    return handleApiError(err)
  }
}
