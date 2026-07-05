import { NextRequest } from 'next/server'
import { success, Errors, getTokenFromHeader, handleApiError } from '@/lib/api-response'
import { verifyToken } from '@/lib/auth'

// ─── Admin guard ────────────────────────────

async function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request)
  if (!token) throw new Error('Unauthorized')
  const payload = await verifyToken(token)
  if (payload.role !== 'ADMIN') throw new Error('Forbidden')
  return { userId: payload.userId, tenantId: payload.tenantId }
}

// ─── Server-side demo data ──────────────────

const PARTENAIRES = [
  {
    id: 'p-1',
    name: 'BPI France',
    website: 'bpifrance.fr',
    category: 'Financement',
    description:
      "Bpifrance est la banque publique d'investissement qui accompagne les entreprises de l'amorçage jusqu'à la cotation en bourse.",
  },
  {
    id: 'p-2',
    name: 'Région Île-de-France',
    website: 'iledefrance.fr',
    category: 'Institutionnel',
    description:
      "La Région Île-de-France soutient l'innovation et la création d'entreprise à travers de nombreux dispositifs d'aide.",
  },
  {
    id: 'p-3',
    name: 'CMA Île-de-France',
    website: 'cma-idf.fr',
    category: 'Institutionnel',
    description:
      "La Chambre de Métiers et de l'Artisanat d'Île-de-France accompagne les artisans dans leurs projets de création et de développement.",
  },
  {
    id: 'p-4',
    name: 'Station F',
    website: 'stationf.co',
    category: 'Incubateur',
    description:
      "Le plus grand campus de startups au monde, proposant des programmes d'incubation et d'accélération pour entrepreneurs.",
  },
  {
    id: 'p-5',
    name: 'CCI Paris Île-de-France',
    website: 'cci-paris-idf.fr',
    category: 'Institutionnel',
    description:
      "La CCI Paris Île-de-France propose des services d'accompagnement, de formation et de financement pour les créateurs.",
  },
  {
    id: 'p-6',
    name: "Réseau Entreprendre Île-de-France",
    website: 'reseau-entreprendre.org',
    category: 'Réseau',
    description:
      "Réseau de chefs d'entreprise bénévoles qui accompagnent les créateurs et repreneurs dans leur parcours entrepreneurial.",
  },
  {
    id: 'p-7',
    name: 'Initiative Île-de-France',
    website: 'initiative-idf.fr',
    category: 'Financement',
    description:
      "Réseau associatif qui accorde des prêts d'honneur et un accompagnement personnalisé aux créateurs d'entreprise.",
  },
  {
    id: 'p-8',
    name: 'French Tech',
    website: 'lafrenchtech.com',
    category: 'Écosystème',
    description:
      "Label gouvernemental qui fédère et promeut l'écosystème des startups françaises à l'international.",
  },
]

const AIDES = [
  {
    id: 'a-1',
    title: 'ACRE',
    description:
      "Exonération partielle de charges sociales pendant la première année d'activité pour les créateurs et repreneurs d'entreprise.",
    eligibility: 'Tous les créateurs/repreneurs (sous conditions de plafonds de revenus)',
    amount: "Jusqu'à 4 916 € d'économie sur 1 an",
    type: 'Exonération sociale',
    source: 'URSSAF',
  },
  {
    id: 'a-2',
    title: 'ARE',
    description:
      "Allocation Chômage versée aux demandeurs d'emploi inscrits à France Travail (ex-Pôle Emploi) qui créent ou reprennent une entreprise.",
    eligibility: 'Bénéficiaires de l\'ARE inscrits à France Travail',
    amount: 'Maintien partiel des allocations (selon droits restants)',
    type: 'Allocation',
    source: 'France Travail',
  },
  {
    id: 'a-3',
    title: 'ARCE',
    description:
      "Versement en deux fois de 45 % des droits ARE restants pour les créateurs d'entreprise, en alternative au maintien de l'ARE.",
    eligibility: 'Bénéficiaires de l\'ARE créant ou reprenant une entreprise',
    amount: "Jusqu'à 10 800 € (45 % × 2 des droits restants)",
    type: 'Capital de départ',
    source: 'France Travail',
  },
  {
    id: 'a-4',
    title: 'NACRE',
    description:
      "Nouvel Accompagnement pour la Création et la Reprise d'Entreprise : accompagnement personnalisé et prêt d'amorçage sans intérêt.",
    eligibility: 'Créateurs/repreneurs bénéficiant de l\'ARE, RSA ou ASS',
    amount: "Jusqu'à 8 000 € de prêt à taux zéro",
    type: 'Prêt + Accompagnement',
    source: 'France Initiative',
  },
  {
    id: 'a-5',
    title: "Bpifrance Prêt d'aménagement",
    description:
      "Prêt à taux zéro destiné à financer les investissements immatériels et matériels nécessaires au démarrage de l'activité.",
    eligibility: 'Entreprises en création ou de moins de 3 ans en IDF',
    amount: "Jusqu'à 50 000 € à taux zéro",
    type: 'Prêt',
    source: 'Bpifrance',
  },
  {
    id: 'a-6',
    title: "Activ'Créa",
    description:
      "Allocation spécifique de création d'entreprise versée aux bénéficiaires du RSA qui créent ou reprennent une entreprise.",
    eligibility: 'Bénéficiaires du RSA créant une activité professionnelle',
    amount: "Jusqu'à 4 548 € (montant forfaitaire RSA × 6 mois)",
    type: 'Allocation',
    source: 'CAF / MSA',
  },
  {
    id: 'a-7',
    title: "Prêt d'honneur",
    description:
      "Prêt sans intérêt ni garantie destiné à compléter un plan de financement pour la création ou la reprise d'entreprise.",
    eligibility: 'Porteurs de projet en création/reprise (sur dossier)',
    amount: "De 3 000 € à 50 000 € selon le réseau",
    type: 'Prêt',
    source: 'Initiative Île-de-France / Réseau Entreprendre',
  },
]

// ─── GET ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'partenaires') {
      return success({ partenaires: PARTENAIRES }, 'Liste des partenaires')
    }

    if (type === 'aides') {
      return success({ aides: AIDES }, 'Liste des aides et dispositifs')
    }

    return success(
      { message: 'Utilisez /api/articles pour les articles' },
      'Type non reconnu',
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

// ─── POST ───────────────────────────────────

export async function POST() {
  return success(
    { message: 'Fonctionnalité en développement' },
    'Fonctionnalité en développement',
  )
}