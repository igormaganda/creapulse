// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Statistiques
// Proxy GET : statistiques régionales du marché du travail
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      codeRegion: searchParams.get('codeRegion') || undefined,
      codeDepartement: searchParams.get('codeDepartement') || undefined,
      codeCommune: searchParams.get('codeCommune') || undefined,
      codeRome: searchParams.get('codeRome') || undefined,
      type: searchParams.get('type') || undefined,
      date: searchParams.get('date') || undefined,
    }

    const qs = buildQueryString(filters)
    const url = `${FT_API.STATISTIQUES}${qs}`

    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.STATISTIQUES)

    return success(data, 'Statistiques récupérées avec succès')
  } catch (err) {
    console.error('[FT Statistiques]', err instanceof Error ? err.message : err)
    return Errors.internal('Erreur lors de la récupération des statistiques')
  }
}
