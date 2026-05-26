// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Entreprises (InfoNet)
// Proxy GET : informations sur les entreprises
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const siret = searchParams.get('siret')
    const siren = searchParams.get('siren')
    const nom = searchParams.get('nom')
    const codePostal = searchParams.get('codePostal')
    const departement = searchParams.get('departement')
    const page = searchParams.get('page')
    const per_page = searchParams.get('per_page') || '20'

    // If a specific SIRET is provided, fetch by SIRET
    if (siret) {
      const url = `${FT_API.ENTREPRISES}/${encodeURIComponent(siret)}`
      const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.ENTREPRISES)
      return success(data, 'Fiche entreprise récupérée')
    }

    // If a specific SIREN is provided, fetch by SIREN
    if (siren) {
      const url = `${FT_API.ENTREPRISES}/siren/${encodeURIComponent(siren)}`
      const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.ENTREPRISES)
      return success(data, 'Fiche entreprise récupérée')
    }

    // Otherwise search by name or location
    const filters = {
      nom: nom || undefined,
      codePostal: codePostal || undefined,
      departement: departement || undefined,
      page: page || undefined,
      per_page,
    }

    const qs = buildQueryString(filters)
    const url = `${FT_API.ENTREPRISES}${qs}`

    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.ENTREPRISES)

    return success(data, 'Entreprises récupérées avec succès')
  } catch (err) {
    console.error('[FT Entreprises]', err instanceof Error ? err.message : err)
    return Errors.internal('Erreur lors de la recherche d\'entreprises')
  }
}
