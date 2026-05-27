// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — Geo API / Communes
// Proxy GET : recherche de communes (API ouverte, pas d'auth)
// Source : https://geo.api.gouv.fr/communes
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'

const GEO_API_BASE = 'https://geo.api.gouv.fr/communes'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const nom = searchParams.get('nom')
    const codePostal = searchParams.get('codePostal')
    const code = searchParams.get('code')
    const departement = searchParams.get('departement')
    const region = searchParams.get('region')
    const boost = searchParams.get('boost')
    const limit = searchParams.get('limit') || '20'
    const fields = searchParams.get('fields')

    const params = new URLSearchParams()

    if (nom) params.append('nom', nom)
    if (codePostal) params.append('codePostal', codePostal)
    if (code) params.append('code', code)
    if (departement) params.append('departement', departement)
    if (region) params.append('region', region)
    if (boost) params.append('boost', boost)
    if (limit) params.append('limit', limit)
    if (fields) params.append('fields', fields)

    const qs = params.toString()
    const url = `${GEO_API_BASE}${qs ? `?${qs}` : ''}`

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      console.error(`[Geo Communes] Erreur ${response.status}`)
      return Errors.internal('Erreur lors de la recherche de communes')
    }

    const data = await response.json()

    return success(data, 'Communes récupérées avec succès')
  } catch (err) {
    console.error('[Geo Communes]', err instanceof Error ? err.message : err)
    return Errors.internal('Erreur lors de la recherche de communes')
  }
}
