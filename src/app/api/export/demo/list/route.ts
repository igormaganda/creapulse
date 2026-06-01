// ============================================
// CreaPulse V2 — Demo Export List API
// GET /api/export/demo/list
// Returns a JSON list of available demo PDF exports
// No authentication required
// ============================================

import { NextResponse } from 'next/server'

// ─── Available demo exports ──────────────────

interface DemoExportItem {
  type: string
  name: string
  description: string
  category: string
  downloadUrl: string
  pages: string
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || ''

const DEMO_EXPORTS: DemoExportItem[] = [
  {
    type: 'suivi-parcours',
    name: 'Suivi de Parcours Complet',
    description:
      'Bilan global du parcours créateur : profil, compétences Kiviat, RIASEC, avancement des modules, Tremplin, CreaSim, BMC, et recommandations personnalisées.',
    category: 'Parcours',
    downloadUrl: `${BASE_URL}/api/export/demo/suivi-parcours`,
    pages: '5+ pages',
  },
  {
    type: 'suivi-kiviat',
    name: 'Suivi — Compétences Kiviat',
    description:
      'Analyse radar des compétences entrepreneuriales : scores par dimension, moyennes, points forts, axes d\'amélioration et recommandations.',
    category: 'Compétences',
    downloadUrl: `${BASE_URL}/api/export/demo/suivi-kiviat`,
    pages: '3 pages',
  },
  {
    type: 'suivi-tremplin',
    name: 'Suivi — Évaluation Tremplin',
    description:
      'Bilan de préparation au lancement : décision GO/NO GO, score global, détail des 8 étapes, recommandations.',
    category: 'Évaluation',
    downloadUrl: `${BASE_URL}/api/export/demo/suivi-tremplin`,
    pages: '3 pages',
  },
  {
    type: 'suivi-creasim',
    name: 'Suivi — Simulation Financière',
    description:
      'Prévisionnel financier CreaSim : CA mensuel, charges, marges, projection sur 3 ans, seuil de rentabilité, synthèse IA.',
    category: 'Financier',
    downloadUrl: `${BASE_URL}/api/export/demo/suivi-creasim`,
    pages: '4 pages',
  },
  {
    type: 'bmc',
    name: 'Business Model Canvas',
    description:
      'Modèle économique du projet : 9 blocs du BMC (partenaires, activités, ressources, valeur, clients, canaux, coûts, revenus) avec taux de complétion.',
    category: 'Stratégie',
    downloadUrl: `${BASE_URL}/api/export/demo/bmc`,
    pages: '3 pages',
  },
  {
    type: 'business-plan',
    name: 'Business Plan Complet',
    description:
      'Plan d\'affaires complet : 22 chapitres couvrant résumé opérationnel, présentation du porteur, concept, étude de marché, stratégie marketing, prévisions financières, statut juridique, plan opérationnel et analyse des risques.',
    category: 'Stratégie',
    downloadUrl: `${BASE_URL}/api/export/demo/business-plan`,
    pages: '15+ pages',
  },
]

// ─── Route Handler ───────────────────────────

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: {
        beneficiary: 'beneficiaire-demo-001',
        exports: DEMO_EXPORTS,
        total: DEMO_EXPORTS.length,
      },
      message: 'List of available demo PDF exports. No authentication required.',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    },
  )
}
