// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Offres d'emploi
// Proxy POST : recherche d'offres avec filtres avancés
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI } from '@/lib/france-travail'
import { withFTAuth, validateFTPagination, ftSchemas } from '@/lib/ft-guard'
import type { FTAuthContext } from '@/lib/ft-guard'
import { z } from 'zod'

const offreBodySchema = z.object({
  motsCles: ftSchemas.motsCles,
  codePostal: ftSchemas.codePostal,
  departement: ftSchemas.departement,
  region: ftSchemas.region,
  typeContrat: ftSchemas.typeContrat,
  experienceExige: ftSchemas.experienceExige,
  tempsPlein: z.boolean().optional(),
  range: ftSchemas.range,
  page: z.coerce.number().int().min(1).optional().default(1),
  per_page: z.coerce.number().int().min(1).optional().default(15),
  sort: ftSchemas.sort,
})

async function handlePOST(request: NextRequest, _ctx: FTAuthContext) {
  const raw = await request.json()
  const parsed = offreBodySchema.safeParse(raw)

  if (!parsed.success) {
    return Errors.validation(
      parsed.error.issues.map((i) => ({ champ: i.path.join('.'), message: i.message })),
      'Paramètres de recherche invalides.',
    )
  }

  const {
    motsCles,
    codePostal,
    departement,
    region,
    typeContrat,
    experienceExige,
    tempsPlein,
    range,
    page,
    per_page,
    sort,
  } = parsed.data

  const pagination = validateFTPagination({ page, per_page })

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

  params.append('page', String(pagination.page))
  params.append('per_page', String(pagination.per_page))
  params.append('sort', String(sort))

  const url = `${FT_API.OFFRES}?${params.toString()}`

  const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.OFFRES)

  return success(data, 'Offres d\'emploi récupérées avec succès')
}

export const POST = withFTAuth(handlePOST, 'POST')
