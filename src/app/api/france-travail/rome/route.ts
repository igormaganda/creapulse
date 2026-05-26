// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / ROME
// Proxy GET : annuaire des métiers ROME
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const code = searchParams.get('code')
    const motsCles = searchParams.get('motsCles')
    const page = searchParams.get('page')
    const per_page = searchParams.get('per_page') || '20'

    // If a specific code is provided, fetch by code
    if (code) {
      const url = `${FT_API.ROME}/${encodeURIComponent(code)}`
      const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.ROME)
      return success(data, 'Fiche métier ROME récupérée')
    }

    // Otherwise search by keywords
    const filters = {
      motsCles: motsCles || undefined,
      page: page || undefined,
      per_page,
    }

    const qs = buildQueryString(filters)
    const url = `${FT_API.ROME}${qs}`

    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.ROME)

    return success(data, 'Métiers ROME récupérés avec succès')
  } catch (err) {
    console.error('[FT ROME]', err instanceof Error ? err.message : err)
    return Errors.internal('Erreur lors de la recherche dans le répertoire ROME')
  }
}
