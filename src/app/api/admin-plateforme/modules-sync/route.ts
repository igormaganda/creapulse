import { NextRequest } from 'next/server'
import { success, Errors, getTokenFromHeader, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { AuditAction, ModuleCategory, JourneyPhase } from '@prisma/client'

/**
 * ═══════════════════════════════════════════════
 * POST /api/admin-plateforme/modules-sync
 *
 * Syncs MODULE_REGISTRY definitions to the database.
 * Called once by admin to seed/refresh module definitions.
 * Creates missing modules, updates existing ones (name, description, category, sortOrder).
 * Does NOT delete modules that exist in DB but not in registry.
 * Preserves isActive toggle state for existing modules.
 * ═══════════════════════════════════════════════
 */

// Admin guard
async function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request)
  if (!token) throw new Error('Unauthorized')
  const payload = await verifyToken(token)
  if (payload.role !== 'ADMIN') throw new Error('Forbidden')
  return { userId: payload.userId, tenantId: payload.tenantId }
}

// Zod schema for bulk toggle
const bulkToggleSchema = z.object({
  modules: z.array(
    z.object({
      code: z.string().min(1),
      isActive: z.boolean(),
    })
  ),
})

// Module definitions from registry — must match src/lib/module-registry.ts
const REGISTRY_MODULES = [
  // Parcours
  { code: 'profil-createur', name: 'Profil créateur', description: 'Définissez votre profil entrepreneurial', category: 'DIAGNOSTIC', phase: 'DISCOVERY', sortOrder: 1 },
  { code: 'mon-projet', name: 'Mon projet', description: "Décrivez votre projet de création d'entreprise", category: 'MODELING', phase: 'DISCOVERY', sortOrder: 2 },
  { code: 'vision', name: 'Vision', description: 'Structurez votre vision à long terme', category: 'MODELING', phase: 'DISCOVERY', sortOrder: 3 },
  { code: 'pepites', name: 'Pépites Game', description: 'Identifiez vos compétences entrepreneuriales', category: 'DIAGNOSTIC', phase: 'PROFILING', sortOrder: 4 },
  { code: 'riasec', name: 'RIASEC', description: 'Test de personnalité entrepreneurial', category: 'DIAGNOSTIC', phase: 'PROFILING', sortOrder: 5 },
  { code: 'kiviat', name: 'Kiviat', description: 'Évaluez vos compétences clés', category: 'DIAGNOSTIC', phase: 'PROFILING', sortOrder: 6 },
  { code: 'bilan-ia', name: 'Bilan IA', description: "Synthèse IA du parcours entrepreneurial", category: 'DIAGNOSTIC', phase: 'PROFILING', sortOrder: 7 },
  { code: 'creascope', name: 'CréaScope', description: 'Pipeline de session diagnostique', category: 'DIAGNOSTIC', phase: 'PROFILING', sortOrder: 8 },
  // Stratégie
  { code: 'marche', name: 'Marché', description: 'Analyse de marché cible et concurrents', category: 'STRATEGY', phase: 'STRATEGY', sortOrder: 10 },
  { code: 'juridique', name: 'Juridique', description: 'Choix du statut juridique', category: 'STRATEGY', phase: 'STRATEGY', sortOrder: 11 },
  { code: 'financier', name: 'Financier', description: 'Plan financier prévisionnel', category: 'STRATEGY', phase: 'STRATEGY', sortOrder: 12 },
  { code: 'creasim', name: 'CreaSim', description: 'Simulateur financier interactif', category: 'STRATEGY', phase: 'STRATEGY', sortOrder: 13 },
  { code: 'bmc', name: 'Business Model Canvas', description: "Canevas BMC interactif", category: 'STRATEGY', phase: 'STRATEGY', sortOrder: 14 },
  { code: 'business-plan', name: 'Business Plan', description: 'Rédaction assistée par IA', category: 'STRATEGY', phase: 'STRATEGY', sortOrder: 15 },
  { code: 'pitch-deck', name: 'Pitch Deck', description: 'Présentation investisseurs', category: 'STRATEGY', phase: 'STRATEGY', sortOrder: 16 },
  // Écosystème
  { code: 'annuaire', name: 'Annuaire', description: "Réseau GIDEF et écosystème", category: 'ECOSYSTEM', phase: 'ECOSYSTEM', sortOrder: 20 },
  { code: 'forum', name: 'Forum', description: 'Communauté entre créateurs', category: 'ECOSYSTEM', phase: 'ECOSYSTEM', sortOrder: 21 },
  { code: 'messages', name: 'Messages', description: 'Messagerie avec conseiller', category: 'ECOSYSTEM', phase: 'ECOSYSTEM', sortOrder: 22 },
  { code: 'mentorat', name: 'Mentorat', description: 'Accompagnement par un mentor', category: 'ECOSYSTEM', phase: 'ECOSYSTEM', sortOrder: 23 },
  // Pilotage
  { code: 'tremplin', name: 'Tremplin', description: "Dispositifs d'aide au lancement", category: 'PILOTAGE', phase: 'LAUNCH', sortOrder: 30 },
  { code: 'passeport', name: 'Passeport', description: 'Certification du parcours', category: 'PILOTAGE', phase: 'LAUNCH', sortOrder: 31 },
  { code: 'certifications', name: 'Certifications', description: 'Gestion des certifications', category: 'PILOTAGE', phase: 'LAUNCH', sortOrder: 32 },
  { code: 'telechargements', name: 'Téléchargements', description: 'Téléchargement de documents PDF', category: 'PILOTAGE', phase: 'LAUNCH', sortOrder: 33 },
  { code: 'vie-privee', name: 'Vie Privée', description: 'RGPD et gestion des données', category: 'PILOTAGE', phase: 'LAUNCH', sortOrder: 34 },
]

/**
 * POST — Sync registry modules to database for a tenant
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const targetTenantId = searchParams.get('tenantId') || admin.tenantId

    let created = 0
    let updated = 0
    let skipped = 0

    for (const mod of REGISTRY_MODULES) {
      const existing = await db.appModule.findUnique({
        where: { tenantId_code: { tenantId: targetTenantId, code: mod.code } },
      })

      if (existing) {
        // Update metadata but preserve isActive and config
        await db.appModule.update({
          where: { id: existing.id },
          data: {
            name: mod.name,
            description: mod.description,
            category: mod.category as ModuleCategory,
            phase: mod.phase as JourneyPhase,
            sortOrder: mod.sortOrder,
          },
        })
        updated++
      } else {
        // Create new module (active by default)
        await db.appModule.create({
          data: {
            tenantId: targetTenantId,
            code: mod.code,
            name: mod.name,
            description: mod.description,
            category: mod.category as ModuleCategory,
            phase: mod.phase as JourneyPhase,
            sortOrder: mod.sortOrder,
            isActive: true,
          },
        })
        created++
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: targetTenantId,
        userId: admin.userId,
        action: AuditAction.MODULE_TOGGLE,
        entityType: 'AppModule',
        details: {
          action: 'SYNC',
          created,
          updated,
          skipped,
          totalModules: REGISTRY_MODULES.length,
        },
      },
    })

    return success(
      {
        created,
        updated,
        skipped,
        totalModules: REGISTRY_MODULES.length,
        tenantId: targetTenantId,
      },
      'Modules synchronisés avec succès',
    )
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return err.message === 'Unauthorized'
        ? Errors.unauthorized('Authentification requise')
        : Errors.forbidden('Accès réservé aux administrateurs')
    }
    return handleApiError(err)
  }
}

/**
 * PUT — Bulk toggle module active/inactive
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const data = bulkToggleSchema.parse(body)

    const { searchParams } = new URL(request.url)
    const targetTenantId = searchParams.get('tenantId') || admin.tenantId

    let toggled = 0
    for (const mod of data.modules) {
      const existing = await db.appModule.findUnique({
        where: { tenantId_code: { tenantId: targetTenantId, code: mod.code } },
      })
      if (existing) {
        await db.appModule.update({
          where: { id: existing.id },
          data: { isActive: mod.isActive },
        })
        toggled++
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: targetTenantId,
        userId: admin.userId,
        action: AuditAction.MODULE_TOGGLE,
        entityType: 'AppModule',
        details: {
          action: 'BULK_TOGGLE',
          modules: data.modules,
          toggled,
        },
      },
    })

    return success(
      { toggled, total: data.modules.length },
      `${toggled} module(s) mis à jour`,
    )
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return err.message === 'Unauthorized'
        ? Errors.unauthorized('Authentification requise')
        : Errors.forbidden('Accès réservé aux administrateurs')
    }
    return handleApiError(err)
  }
}
