// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Formations
// Proxy GET : recherche de formations
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      motsCles: searchParams.get('motsCles') || undefined,
      codePostal: searchParams.get('codePostal') || undefined,
      departement: searchParams.get('departement') || undefined,
      region: searchParams.get('region') || undefined,
      domaine: searchParams.get('domaine') || undefined,
      niveau: searchParams.get('niveau') || undefined,
      certification: searchParams.get('certification') || undefined,
      page: searchParams.get('page') || undefined,
      per_page: searchParams.get('per_page') || '20',
    }

    const qs = buildQueryString(filters)
    const url = `${FT_API.FORMATIONS}${qs}`

    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.FORMATIONS)

    return success(data, 'Formations récupérées avec succès')
  } catch (err) {
    console.error('[FT Formations]', err instanceof Error ? err.message : err)
    return Errors.internal('Erreur lors de la recherche de formations')
  }
}
