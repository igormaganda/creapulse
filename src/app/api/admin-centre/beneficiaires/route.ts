import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'

/* ─── Mock beneficiaires data ─── */
const mockBeneficiaires = [
  { id: 'b1', name: 'Alexandre Chen', email: 'a.chen@email.com', project: 'Restaurant Asiatique Fusion', conseiller: 'Sophie Martin', phase: 'Structuration', progress: 75, sector: 'Restauration', registrationDate: '2025-01-15', status: 'active' },
  { id: 'b2', name: 'Marie Dupont', email: 'm.dupont@email.com', project: 'Studio de Yoga Bien-etre', conseiller: 'Sophie Martin', phase: 'Financement', progress: 60, sector: 'Bien-etre', registrationDate: '2024-11-20', status: 'active' },
  { id: 'b3', name: 'Thomas Leroy', email: 't.leroy@email.com', project: 'Application mobile Sante', conseiller: 'Pierre Dubois', phase: 'Lancement', progress: 90, sector: 'Tech', registrationDate: '2024-09-10', status: 'active' },
  { id: 'b4', name: 'Fatima Benali', email: 'f.benali@email.com', project: 'Salon de coiffure moderne', conseiller: 'Claire Lefevre', phase: 'Ideation', progress: 30, sector: 'Beaute', registrationDate: '2025-03-05', status: 'active' },
  { id: 'b5', name: 'Lucas Martin', email: 'l.martin@email.com', project: 'E-commerce artisanal', conseiller: 'Pierre Dubois', phase: 'Structuration', progress: 55, sector: 'Commerce', registrationDate: '2025-02-12', status: 'active' },
  { id: 'b6', name: 'Sophie Morel', email: 's.morel@email.com', project: 'Cabinet de conseil RH', conseiller: 'Sophie Martin', phase: 'Developpement', progress: 95, sector: 'Services', registrationDate: '2024-06-18', status: 'active' },
  { id: 'b7', name: 'David Nguyen', email: 'd.nguyen@email.com', project: 'Boulangerie artisanale bio', conseiller: 'Marc Petit', phase: 'Lancement', progress: 85, sector: 'Alimentation', registrationDate: '2024-10-01', status: 'active' },
  { id: 'b8', name: 'Emma Bernard', email: 'e.bernard@email.com', project: 'Agence de communication digitale', conseiller: 'Claire Lefevre', phase: 'Structuration', progress: 45, sector: 'Marketing', registrationDate: '2025-01-28', status: 'active' },
  { id: 'b9', name: 'Karim Diallo', email: 'k.diallo@email.com', project: 'Transport de marchandises', conseiller: 'Pierre Dubois', phase: 'Financement', progress: 50, sector: 'Transport', registrationDate: '2024-12-14', status: 'active' },
  { id: 'b10', name: 'Laura Petit', email: 'l.petit@email.com', project: 'Creche municipale privee', conseiller: 'Julie Moreau', phase: 'Ideation', progress: 20, sector: 'Social', registrationDate: '2025-03-20', status: 'active' },
  { id: 'b11', name: 'Nicolas Faure', email: 'n.faure@email.com', project: 'Garage auto electrique', conseiller: 'Marc Petit', phase: 'Developpement', progress: 92, sector: 'Automobile', registrationDate: '2024-07-22', status: 'active' },
  { id: 'b12', name: 'Amina Toure', email: 'a.toure@email.com', project: 'Restaurant vegan gourmand', conseiller: 'Antoine Roux', phase: 'Structuration', progress: 40, sector: 'Restauration', registrationDate: '2025-02-28', status: 'inactive' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const conseiller = searchParams.get('conseiller') || ''
  const phase = searchParams.get('phase') || ''
  const status = searchParams.get('status') || ''

  let result = [...mockBeneficiaires]

  if (search) {
    const s = search.toLowerCase()
    result = result.filter(
      (b) =>
        b.name.toLowerCase().includes(s) ||
        b.email.toLowerCase().includes(s) ||
        b.project.toLowerCase().includes(s)
    )
  }

  if (conseiller) {
    result = result.filter((b) => b.conseiller === conseiller)
  }

  if (phase) {
    result = result.filter((b) => b.phase === phase)
  }

  if (status) {
    result = result.filter((b) => b.status === status)
  }

  return success({
    data: result,
    total: result.length,
    page: 1,
    limit: result.length,
  }, `${result.length} beneficiaires trouves`)
}
