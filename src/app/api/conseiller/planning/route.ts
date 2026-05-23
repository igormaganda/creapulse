import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api-response'

// Mock appointments data
const appointments = [
  { id: 'p1', date: '2025-02-03', startTime: '09:00', endTime: '10:00', beneficiaryId: 'b1', beneficiaryName: 'Amadou Diallo', beneficiaryInitials: 'AD', type: 'suivi', mode: 'physique', location: 'GIDEF Paris - Salle A', notes: 'Suivi business plan Afrika Fusion.' },
  { id: 'p2', date: '2025-02-03', startTime: '14:00', endTime: '15:30', beneficiaryId: 'b2', beneficiaryName: 'Lea Fontaine', beneficiaryInitials: 'LF', type: 'bilan', mode: 'video', notes: 'Bilan trimestriel EcoTech Solutions.' },
  { id: 'p3', date: '2025-02-04', startTime: '09:30', endTime: '11:00', beneficiaryId: 'b3', beneficiaryName: 'Marc Renaud', beneficiaryInitials: 'MR', type: 'atelier', mode: 'physique', location: 'GIDEF Paris - Salle B', notes: 'Atelier Business Model Canvas.' },
  { id: 'p4', date: '2025-02-04', startTime: '15:00', endTime: '16:00', beneficiaryId: 'b4', beneficiaryName: 'Clara Dubois', beneficiaryInitials: 'CD', type: 'suivi', mode: 'telephone', notes: 'Suivi BoxFit Paris, analyse ventes.' },
  { id: 'p5', date: '2025-02-05', startTime: '10:00', endTime: '11:00', beneficiaryId: 'b5', beneficiaryName: 'Karim Benali', beneficiaryInitials: 'KB', type: 'suivi', mode: 'video', notes: 'Suivi SnapClean.' },
  { id: 'p6', date: '2025-02-05', startTime: '14:00', endTime: '16:00', beneficiaryId: 'b6', beneficiaryName: 'Julie Moreau', beneficiaryInitials: 'JM', type: 'atelier', mode: 'physique', location: 'GIDEF Paris - Salle A', notes: 'Atelier financement. Groupe de 5.' },
  { id: 'p7', date: '2025-02-06', startTime: '09:00', endTime: '10:00', beneficiaryId: 'b7', beneficiaryName: 'Thomas Leroy', beneficiaryInitials: 'TL', type: 'bilan', mode: 'physique', location: 'GIDEF Paris - Salle C', notes: 'Bilan mi-parcours UrbanFarm.' },
  { id: 'p8', date: '2025-02-06', startTime: '11:00', endTime: '12:00', beneficiaryId: 'b8', beneficiaryName: 'Fatima Hassani', beneficiaryInitials: 'FH', type: 'suivi', mode: 'video', notes: 'Suivi CraftID, strategie digitale.' },
  { id: 'p9', date: '2025-02-06', startTime: '16:00', endTime: '17:00', beneficiaryId: 'b9', beneficiaryName: 'Hugo Petit', beneficiaryInitials: 'HP', type: 'suivi', mode: 'telephone', notes: 'Point rapide TechLab93.' },
  { id: 'p10', date: '2025-02-07', startTime: '10:00', endTime: '11:30', beneficiaryId: 'b10', beneficiaryName: 'Nadia Bouzid', beneficiaryInitials: 'NB', type: 'bilan', mode: 'physique', location: 'GIDEF Paris - Salle A', notes: 'Bilan complet MedConnect.' },
  { id: 'p11', date: '2025-02-07', startTime: '14:00', endTime: '15:00', beneficiaryId: 'b1', beneficiaryName: 'Amadou Diallo', beneficiaryInitials: 'AD', type: 'atelier', mode: 'physique', location: 'GIDEF Paris - Salle B', notes: 'Atelier marketing digital.' },
  { id: 'p12', date: '2025-02-08', startTime: '10:00', endTime: '11:00', beneficiaryId: 'b2', beneficiaryName: 'Lea Fontaine', beneficiaryInitials: 'LF', type: 'suivi', mode: 'video', notes: 'Suivi post-presentation investisseurs.' },
  { id: 'p13', date: '2025-02-04', startTime: '11:00', endTime: '12:00', beneficiaryId: 'b10', beneficiaryName: 'Nadia Bouzid', beneficiaryInitials: 'NB', type: 'bilan', mode: 'telephone', notes: 'Bilan express MedConnect.' },
  { id: 'p14', date: '2025-02-03', startTime: '16:00', endTime: '17:00', beneficiaryId: 'b6', beneficiaryName: 'Julie Moreau', beneficiaryInitials: 'JM', type: 'suivi', mode: 'video', notes: 'Suivi Papillon Events.' },
  { id: 'p15', date: '2025-02-07', startTime: '09:00', endTime: '10:00', beneficiaryId: 'b5', beneficiaryName: 'Karim Benali', beneficiaryInitials: 'KB', type: 'bilan', mode: 'physique', location: 'GIDEF Paris - Salle C', notes: 'Bilan SnapClean.' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const type = searchParams.get('type')

  let filtered = [...appointments]

  if (startDate) {
    filtered = filtered.filter((a) => a.date >= startDate)
  }

  if (endDate) {
    filtered = filtered.filter((a) => a.date <= endDate)
  }

  if (type) {
    filtered = filtered.filter((a) => a.type === type)
  }

  return success(filtered, 'Liste des rendez-vous')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { beneficiaryId, beneficiaryName, date, startTime, endTime, type, mode, notes } = body

    if (!beneficiaryId || !beneficiaryName || !date || !startTime || !type || !mode) {
      return error('MISSING_FIELDS', 'Les champs obligatoires sont manquants', 422, {
        required: ['beneficiaryId', 'beneficiaryName', 'date', 'startTime', 'type', 'mode'],
      })
    }

    const validTypes = ['bilan', 'suivi', 'atelier']
    if (!validTypes.includes(type)) {
      return error('INVALID_INPUT', `Type invalide. Valeurs acceptees : ${validTypes.join(', ')}`, 422)
    }

    const validModes = ['physique', 'video', 'telephone']
    if (!validModes.includes(mode)) {
      return error('INVALID_INPUT', `Mode invalide. Valeurs acceptees : ${validModes.join(', ')}`, 422)
    }

    const initials = `${beneficiaryName.split(' ')[0][0]}${beneficiaryName.split(' ').slice(-1)[0][0]}`.toUpperCase()

    const newAppointment = {
      id: `p${appointments.length + 1}`,
      date,
      startTime,
      endTime: endTime || `${String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0')}:00`,
      beneficiaryId,
      beneficiaryName,
      beneficiaryInitials: initials,
      type,
      mode,
      notes: notes || undefined,
    }

    appointments.push(newAppointment)

    return success(newAppointment, 'Rendez-vous cree avec succes', 201)
  } catch {
    return error('INTERNAL_ERROR', 'Erreur lors de la creation du rendez-vous', 500)
  }
}
