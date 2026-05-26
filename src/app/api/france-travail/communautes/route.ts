// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Communautés
// Proxy GET : communautés de bénévoles
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
      region: searchParams.get('region') || undefined,
      type: searchParams.get('type') || undefined,
      page: searchParams.get('page') || undefined,
      per_page: searchParams.get('per_page') || '20',
    }

    const qs = buildQueryString(filters)
    const url = `${FT_API.COMMUNAUTES}${qs}`

    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.COMMUNAUTES)

    return success(data, 'Communautés récupérées avec succès')
  } catch (err) {
    console.error('[FT Communautés]', err instanceof Error ? err.message : err)
    return Errors.internal('Erreur lors de la recherche de communautés')
  }
}
