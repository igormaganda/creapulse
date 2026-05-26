// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Offres d'emploi
// Proxy POST : recherche d'offres avec filtres avancés
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI } from '@/lib/france-travail'

interface OffreFilters {
  motsCles?: string
  codePostal?: string
  departement?: string
  region?: string
  typeContrat?: string
  experienceExige?: string
  tempsPlein?: boolean
  range?: string
  page?: number
  per_page?: number
  sort?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OffreFilters

    const {
      motsCles,
      codePostal,
      departement,
      region,
      typeContrat,
      experienceExige,
      tempsPlein,
      range,
      page = 1,
      per_page = 15,
      sort = 1,
    } = body

    // Build query parameters
    const params = new URLSearchParams()

    if (motsCles) params.append('motsCles', motsCles)
    if (codePostal) params.append('codePostal', codePostal)
    if (departement) params.append('departement', departement)
    if (region) params.append('region', region)
    if (typeContrat) params.append('typeContrat', typeContrat)
    if (experienceExige) params.append('experienceExige', experienceExige)
    if (tempsPlein !== undefined) params.append('tempsPlein', String(tempsPlein))
    if (range) params.append('range', range)

    params.append('page', String(page))
    params.append('per_page', String(per_page))
    params.append('sort', String(sort))

    const url = `${FT_API.OFFRES}?${params.toString()}`

    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.OFFRES)

    return success(data, 'Offres d\'emploi récupérées avec succès')
  } catch (err) {
    console.error('[FT Offres]', err instanceof Error ? err.message : err)
    return Errors.internal('Erreur lors de la recherche d\'offres d\'emploi')
  }
}
