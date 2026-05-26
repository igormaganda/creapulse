// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Agences
// Proxy GET : recherche d'agences France Travail
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      codePostal: searchParams.get('codePostal') || undefined,
      departement: searchParams.get('departement') || undefined,
      commune: searchParams.get('commune') || undefined,
      region: searchParams.get('region') || undefined,
      type: searchParams.get('type') || undefined,
      horaires: searchParams.get('horaires') || undefined,
      page: searchParams.get('page') || undefined,
      per_page: searchParams.get('per_page') || '20',
    }

    const qs = buildQueryString(filters)
    const url = `${FT_API.AGENCES}${qs}`

    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.AGENCES)

    return success(data, 'Agences récupérées avec succès')
  } catch (err) {
    console.error('[FT Agences]', err instanceof Error ? err.message : err)
    return Errors.internal('Erreur lors de la recherche d\'agences France Travail')
  }
}
