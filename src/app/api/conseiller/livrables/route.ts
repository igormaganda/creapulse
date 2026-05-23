import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api-response'

// Mock livrables data
const livrables = [
  {
    id: 'l1', beneficiaryId: 'b1', beneficiaryName: 'Amadou Diallo', beneficiaryInitials: 'AD',
    type: 'business_plan', title: 'Business Plan - Restaurant Afrika Fusion', status: 'READY',
    createdAt: '2025-01-28', notes: '', content: 'Business plan complet avec etude de marche, projections financieres sur 3 ans et plan operationnel.',
  },
  {
    id: 'l2', beneficiaryId: 'b2', beneficiaryName: 'Lea Fontaine', beneficiaryInitials: 'LF',
    type: 'pitch_deck', title: 'Pitch Deck - EcoTech Solutions', status: 'READY',
    createdAt: '2025-01-30', notes: '', content: 'Presentation investisseur de 15 slides.',
  },
  {
    id: 'l3', beneficiaryId: 'b3', beneficiaryName: 'Marc Renaud', beneficiaryInitials: 'MR',
    type: 'executive_summary', title: 'Resume Executif - Atelier Numerique', status: 'VALIDATED',
    createdAt: '2025-01-15', notes: 'Tres bon resume.', content: 'Resume de 2 pages.',
  },
  {
    id: 'l4', beneficiaryId: 'b4', beneficiaryName: 'Clara Dubois', beneficiaryInitials: 'CD',
    type: 'financial_forecast', title: 'Previsions Financieres - BoxFit Paris', status: 'READY',
    createdAt: '2025-02-01', notes: '', content: 'Tableau financier detaille.',
  },
  {
    id: 'l5', beneficiaryId: 'b5', beneficiaryName: 'Karim Benali', beneficiaryInitials: 'KB',
    type: 'passport', title: 'Passport Creation - SnapClean', status: 'VALIDATED',
    createdAt: '2025-01-20', notes: 'Document complet.', content: 'Fiche passport.',
  },
  {
    id: 'l6', beneficiaryId: 'b6', beneficiaryName: 'Julie Moreau', beneficiaryInitials: 'JM',
    type: 'business_plan', title: 'Business Plan - Papillon Events', status: 'DRAFT',
    createdAt: '2025-02-02', notes: '', content: 'En cours de redaction.',
  },
  {
    id: 'l7', beneficiaryId: 'b7', beneficiaryName: 'Thomas Leroy', beneficiaryInitials: 'TL',
    type: 'market_study', title: 'Etude de Marche - UrbanFarm IDf', status: 'DRAFT',
    createdAt: '2025-02-03', notes: '', content: 'Enquete clients en cours.',
  },
  {
    id: 'l8', beneficiaryId: 'b8', beneficiaryName: 'Fatima Hassani', beneficiaryInitials: 'FH',
    type: 'canvas', title: 'Business Model Canvas - CraftID', status: 'VALIDATED',
    createdAt: '2025-01-25', notes: 'Canvas bien rempli.', content: 'Canvas complet.',
  },
  {
    id: 'l9', beneficiaryId: 'b1', beneficiaryName: 'Amadou Diallo', beneficiaryInitials: 'AD',
    type: 'financial_forecast', title: 'Previsions Financieres - Afrika Fusion', status: 'EXPORTED',
    createdAt: '2025-01-10', notes: 'Exporte pour pret bancaire.', content: 'Previsions exportees.',
  },
  {
    id: 'l10', beneficiaryId: 'b9', beneficiaryName: 'Hugo Petit', beneficiaryInitials: 'HP',
    type: 'executive_summary', title: 'Resume Executif - TechLab93', status: 'DRAFT',
    createdAt: '2025-02-04', notes: '', content: 'Premier jet.',
  },
  {
    id: 'l11', beneficiaryId: 'b10', beneficiaryName: 'Nadia Bouzid', beneficiaryInitials: 'NB',
    type: 'pitch_deck', title: 'Pitch Deck - MedConnect', status: 'VALIDATED',
    createdAt: '2025-01-22', notes: 'Design professionnel.', content: 'Pitch deck 12 slides.',
  },
  {
    id: 'l12', beneficiaryId: 'b4', beneficiaryName: 'Clara Dubois', beneficiaryInitials: 'CD',
    type: 'passport', title: 'Passport Creation - BoxFit Paris', status: 'READY',
    createdAt: '2025-02-05', notes: '', content: 'Passport mis a jour.',
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const search = searchParams.get('search')

  let filtered = [...livrables]

  if (status) {
    filtered = filtered.filter((l) => l.status === status)
  }

  if (type) {
    filtered = filtered.filter((l) => l.type === type)
  }

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (l) =>
        l.beneficiaryName.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q)
    )
  }

  return success(filtered, 'Liste des livrables')
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes } = body

    if (!id || !status) {
      return error('MISSING_FIELDS', 'Les champs id et status sont requis', 422)
    }

    const validStatuses = ['DRAFT', 'READY', 'VALIDATED', 'EXPORTED']
    if (!validStatuses.includes(status)) {
      return error('INVALID_INPUT', `Statut invalide. Valeurs acceptees : ${validStatuses.join(', ')}`, 422)
    }

    const index = livrables.findIndex((l) => l.id === id)
    if (index === -1) {
      return error('NOT_FOUND', 'Livrable non trouve', 404)
    }

    livrables[index] = {
      ...livrables[index],
      status,
      ...(notes !== undefined && { notes }),
    }

    return success(livrables[index], 'Livrable mis a jour avec succes')
  } catch {
    return error('INTERNAL_ERROR', 'Erreur lors de la mise a jour du livrable', 500)
  }
}
