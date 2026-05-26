// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Événements
// Proxy POST : recherche d'événements (ateliers, forums, etc.)
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'

interface EvenementFilters {
  motsCles?: string
  codePostal?: string
  departement?: string
  region?: string
  typeEvenement?: string
  dateDebut?: string
  dateFin?: string
  page?: number
  per_page?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EvenementFilters

    const {
      motsCles,
      codePostal,
      departement,
      region,
      typeEvenement,
      dateDebut,
      dateFin,
      page = 1,
      per_page = 20,
    } = body

    const filters = {
      motsCles,
      codePostal,
      departement,
      region,
      typeEvenement,
      dateDebut,
      dateFin,
      page: String(page),
      per_page: String(per_page),
    }

    const qs = buildQueryString(filters)
    const url = `${FT_API.EVENEMENTS}${qs}`

    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.EVENEMENTS)

    return success(data, 'Événements récupérés avec succès')
  } catch (err) {
    console.error('[FT Événements]', err instanceof Error ? err.message : err)
    return Errors.internal('Erreur lors de la recherche d\'événements')
  }
}
