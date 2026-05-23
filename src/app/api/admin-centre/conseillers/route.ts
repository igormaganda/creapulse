import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'

/* ─── Mock conseillers data ─── */
const mockConseillers = [
  { id: 'c1', name: 'Sophie Martin', email: 'sophie.martin@gidef.fr', specialities: ['Creation', 'Financement', 'Business Plan'], beneficiairesCount: 28, maxCapacity: 30, status: 'active', avgProgress: 72, city: 'Creteil' },
  { id: 'c2', name: 'Pierre Dubois', email: 'pierre.dubois@gidef.fr', specialities: ['Juridique', 'Social', 'Marche'], beneficiairesCount: 25, maxCapacity: 30, status: 'active', avgProgress: 68, city: 'Creteil' },
  { id: 'c3', name: 'Claire Lefevre', email: 'claire.lefevre@gidef.fr', specialities: ['Marketing', 'Digital', 'Reseau'], beneficiairesCount: 22, maxCapacity: 30, status: 'active', avgProgress: 65, city: 'Creteil' },
  { id: 'c4', name: 'Marc Petit', email: 'marc.petit@gidef.fr', specialities: ['Comptabilite', 'Fiscalite', 'CreaSim'], beneficiairesCount: 20, maxCapacity: 30, status: 'active', avgProgress: 61, city: 'Creteil' },
  { id: 'c5', name: 'Julie Moreau', email: 'julie.moreau@gidef.fr', specialities: ['Creation', 'Formation', 'Passeport'], beneficiairesCount: 18, maxCapacity: 30, status: 'active', avgProgress: 58, city: 'Villeneuve-Saint-Georges' },
  { id: 'c6', name: 'Antoine Roux', email: 'antoine.roux@gidef.fr', specialities: ['Immigration', 'International', 'Marche'], beneficiairesCount: 14, maxCapacity: 30, status: 'active', avgProgress: 55, city: 'Creteil' },
  { id: 'c7', name: 'Isabelle Fontaine', email: 'isabelle.fontaine@gidef.fr', specialities: ['Social', 'Insertion', 'Coaching'], beneficiairesCount: 3, maxCapacity: 30, status: 'inactive', avgProgress: 0, city: 'Creteil' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  let result = [...mockConseillers]

  if (search) {
    const s = search.toLowerCase()
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.specialities.some((spec) => spec.toLowerCase().includes(s))
    )
  }

  if (status) {
    result = result.filter((c) => c.status === status)
  }

  return success(result, `${result.length} conseillers trouves`)
}
