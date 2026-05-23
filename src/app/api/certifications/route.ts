// ============================================
// CreaPulse V2 — Certifications API
// GET /api/certifications — Retrieve certifications data
// ============================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, Errors, handleApiError, getTokenFromHeader } from '@/lib/api-response'
import { verifyToken, AuthError } from '@/lib/auth'

// ─── Certification definitions ─────────────

interface CertRequirement {
  moduleCode: string
  moduleLabel: string
}

interface CertDefinition {
  id: string
  name: string
  description: string
  icon: string
  requirements: CertRequirement[]
  level: 'basic' | 'intermediate' | 'advanced' | 'expert'
}

const CERTIFICATIONS: CertDefinition[] = [
  {
    id: 'createur-certifie',
    name: 'Créateur Certifié',
    description: 'Attestation de complétude de tous les modules du parcours entrepreneur',
    icon: 'Award',
    requirements: [
      { moduleCode: 'profil', moduleLabel: 'Profil Créateur' },
      { moduleCode: 'riasec', moduleLabel: 'Test RIASEC' },
      { moduleCode: 'kiviat', moduleLabel: 'Test Kiviat' },
      { moduleCode: 'mon-projet', moduleLabel: 'Mon Projet' },
    ],
    level: 'basic',
  },
  {
    id: 'business-planner',
    name: 'Business Planner',
    description: 'Certification pour la maîtrise complète de la rédaction du Business Plan',
    icon: 'FileText',
    requirements: [
      { moduleCode: 'business-plan', moduleLabel: 'Business Plan (complet)' },
    ],
    level: 'intermediate',
  },
  {
    id: 'analyste-marche',
    name: 'Analyste de Marché',
    description: 'Certification en analyse de marché et positionnement concurrentiel',
    icon: 'BarChart3',
    requirements: [
      { moduleCode: 'marche', moduleLabel: 'Analyse de Marché' },
    ],
    level: 'intermediate',
  },
  {
    id: 'expert-financier',
    name: 'Expert Financier',
    description: 'Certification avancée en planification et simulation financière',
    icon: 'Calculator',
    requirements: [
      { moduleCode: 'financier', moduleLabel: 'Plan Financier' },
      { moduleCode: 'creasim', moduleLabel: 'CreaSim (simulateur)' },
    ],
    level: 'advanced',
  },
  {
    id: 'entrepreneur-gidef',
    name: 'Entrepreneur GIDEF',
    description: 'Certification complète du parcours entrepreneurial GIDEF Ile-de-France',
    icon: 'Trophy',
    requirements: [
      { moduleCode: 'tremplin', moduleLabel: 'Tremplin (évaluation GO)' },
      { moduleCode: 'mon-projet', moduleLabel: 'Mon Projet' },
      { moduleCode: 'business-plan', moduleLabel: 'Business Plan' },
    ],
    level: 'expert',
  },
]

// ─── GET: Retrieve certifications ──────────

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      throw new AuthError('Authentication required', 'UNAUTHORIZED', 401)
    }

    const payload = await verifyToken(token)

    // Fetch all module results for this user
    const moduleResults = await db.moduleResult.findMany({
      where: { userId: payload.userId },
    })

    const completedModules = new Set(moduleResults.map((r) => r.moduleCode))

    // Build certification statuses
    const certificationsData = CERTIFICATIONS.map((cert) => {
      const requirementsMet = cert.requirements.filter((req) => completedModules.has(req.moduleCode))
      const progress = cert.requirements.length > 0
        ? Math.round((requirementsMet.length / cert.requirements.length) * 100)
        : 0
      const isEarned = requirementsMet.length === cert.requirements.length

      // Generate credential ID if earned
      let credentialId: string | null = null
      if (isEarned) {
        credentialId = `GIDEF-${cert.id.toUpperCase()}-${payload.userId.slice(0, 8).toUpperCase()}`
      }

      return {
        ...cert,
        requirements: cert.requirements.map((req) => ({
          ...req,
          completed: completedModules.has(req.moduleCode),
        })),
        progress,
        isEarned,
        credentialId,
        earnedDate: isEarned
          ? moduleResults
              .filter((r) => cert.requirements.some((req) => req.moduleCode === r.moduleCode))
              .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0]?.completedAt ?? null
          : null,
      }
    })

    const earnedCount = certificationsData.filter((c) => c.isEarned).length

    return success({
      certifications: certificationsData,
      totalCertifications: CERTIFICATIONS.length,
      earnedCount,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return Errors.unauthorized(err.message)
    }
    return handleApiError(err)
  }
}
