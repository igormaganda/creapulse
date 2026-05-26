// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / La Bonne Boîte (LBB)
// Proxy GET : entreprises recommandées par LBB
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
      rome: searchParams.get('rome') || undefined,
      page: searchParams.get('page') || undefined,
      per_page: searchParams.get('per_page') || '20',
    }

    const qs = buildQueryString(filters)
    const url = `${FT_API.LBB}${qs}`

    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.LBB)

    return success(data, 'Entreprises LBB récupérées avec succès')
  } catch (err) {
    console.error('[FT LBB]', err instanceof Error ? err.message : err)
    return Errors.internal('Erreur lors de la recherche d\'entreprises La Bonne Boîte')
  }
}
