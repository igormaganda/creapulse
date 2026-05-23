import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api-response'

// Mock entretiens data
const entretiens = [
  {
    id: 'e1',
    date: '2025-02-03',
    time: '10:00',
    beneficiaryId: 'b1',
    beneficiaryName: 'Amadou Diallo',
    type: 'suivi',
    status: 'confirme',
    conseiller: 'Sophie Martin',
    notes: 'Suivi du business plan. Verifier les hypotheses de prix.',
  },
  {
    id: 'e2',
    date: '2025-02-03',
    time: '14:00',
    beneficiaryId: 'b2',
    beneficiaryName: 'Lea Fontaine',
    type: 'bilan',
    status: 'planifie',
    conseiller: 'Sophie Martin',
    notes: 'Bilan trimestriel. Revision du plan financier.',
  },
  {
    id: 'e3',
    date: '2025-02-04',
    time: '09:30',
    beneficiaryId: 'b3',
    beneficiaryName: 'Marc Renaud',
    type: 'atelier',
    status: 'planifie',
    conseiller: 'Sophie Martin',
    notes: 'Atelier creation - model Canvas.',
  },
  {
    id: 'e4',
    date: '2025-02-05',
    time: '11:00',
    beneficiaryId: 'b4',
    beneficiaryName: 'Clara Dubois',
    type: 'suivi',
    status: 'confirme',
    conseiller: 'Sophie Martin',
    notes: 'Suivi post-lancement. Analyse des premieres ventes.',
  },
  {
    id: 'e5',
    date: '2025-02-06',
    time: '15:00',
    beneficiaryId: 'b7',
    beneficiaryName: 'Thomas Leroy',
    type: 'bilan',
    status: 'planifie',
    conseiller: 'Sophie Martin',
    notes: 'Bilan de mi-parcours. Point sur le choix du statut juridique.',
  },
  {
    id: 'e6',
    date: '2025-02-07',
    time: '10:30',
    beneficiaryId: 'b8',
    beneficiaryName: 'Fatima Hassani',
    type: 'suivi',
    status: 'planifie',
    conseiller: 'Sophie Martin',
    notes: 'Suivi sur la strategie de communication digitale.',
  },
  {
    id: 'e7',
    date: '2025-02-10',
    time: '09:00',
    beneficiaryId: 'b9',
    beneficiaryName: 'Hugo Petit',
    type: 'atelier',
    status: 'planifie',
    conseiller: 'Sophie Martin',
    notes: 'Atelier financement - presentation des aides GIDEF.',
  },
  {
    id: 'e8',
    date: '2025-01-27',
    time: '10:00',
    beneficiaryId: 'b1',
    beneficiaryName: 'Amadou Diallo',
    type: 'suivi',
    status: 'termine',
    conseiller: 'Sophie Martin',
    notes: 'Avancement du business plan. Points de vigilance sur la logistique.',
  },
]

export async function GET() {
  return success(entretiens, 'Liste des entretiens du conseiller')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { beneficiaryId, beneficiaryName, type, date, time, notes } = body

    // Basic validation
    if (!beneficiaryId || !beneficiaryName || !type || !date || !time) {
      return error('MISSING_FIELDS', 'Les champs obligatoires sont manquants', 422, {
        required: ['beneficiaryId', 'beneficiaryName', 'type', 'date', 'time'],
      })
    }

    // Validate type
    const validTypes = ['bilan', 'suivi', 'atelier']
    if (!validTypes.includes(type)) {
      return error('INVALID_INPUT', `Type invalide. Valeurs acceptees : ${validTypes.join(', ')}`, 422)
    }

    const newEntretien = {
      id: `e${entretiens.length + 1}`,
      date,
      time,
      beneficiaryId,
      beneficiaryName,
      type,
      status: 'planifie',
      conseiller: 'Sophie Martin',
      notes: notes || undefined,
    }

    entretiens.push(newEntretien)

    return success(newEntretien, 'Entretien cree avec succes', 201)
  } catch {
    return error('INTERNAL_ERROR', 'Erreur lors de la creation de l\'entretien', 500)
  }
}
