// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Aides
// Proxy GET : recherche d'aides financières
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
      typeAide: searchParams.get('typeAide') || undefined,
      page: searchParams.get('page') || undefined,
      per_page: searchParams.get('per_page') || '20',
    }

    const qs = buildQueryString(filters)
    const url = `${FT_API.AIDES}${qs}`

    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.AIDES)

    return success(data, 'Aides financières récupérées avec succès')
  } catch (err) {
    console.error('[FT Aides]', err instanceof Error ? err.message : err)
    return Errors.internal('Erreur lors de la recherche d\'aides financières')
  }
}
