// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Entreprises (InfoNet)
// Proxy GET : informations sur les entreprises
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'
import { withFTAuth, validateFTPagination } from '@/lib/ft-guard'
import type { FTAuthContext } from '@/lib/ft-guard'
import { z } from 'zod'

const entreprisesQuerySchema = z.object({
  siret: z.string().regex(/^\d{14}$/).optional(),
  siren: z.string().regex(/^\d{9}$/).optional(),
  nom: z.string().max(200).optional(),
  codePostal: z.string().regex(/^\d{5}$/).optional(),
  departement: z.string().regex(/^\d{2,3}$/).optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
})

async function handleGET(request: NextRequest, _ctx: FTAuthContext) {
  const { searchParams } = new URL(request.url)

  const parsed = entreprisesQuerySchema.safeParse({
    siret: searchParams.get('siret') || undefined,
    siren: searchParams.get('siren') || undefined,
    nom: searchParams.get('nom') || undefined,
    codePostal: searchParams.get('codePostal') || undefined,
    departement: searchParams.get('departement') || undefined,
    page: searchParams.get('page') || undefined,
    per_page: searchParams.get('per_page') || undefined,
  })

  if (!parsed.success) {
    return Errors.validation(
      parsed.error.issues.map((i) => ({ champ: i.path.join('.'), message: i.message })),
      'Paramètres de recherche invalides.',
    )
  }

  const pagination = validateFTPagination({
    page: parsed.data.page,
    per_page: parsed.data.per_page,
  })

  // If a specific SIRET is provided, fetch by SIRET
  if (parsed.data.siret) {
    const url = `${FT_API.ENTREPRISES}/${encodeURIComponent(parsed.data.siret)}`
    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.ENTREPRISES)
    return success(data, 'Fiche entreprise récupérée')
  }

  // If a specific SIREN is provided, fetch by SIREN
  if (parsed.data.siren) {
    const url = `${FT_API.ENTREPRISES}/siren/${encodeURIComponent(parsed.data.siren)}`
    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.ENTREPRISES)
    return success(data, 'Fiche entreprise récupérée')
  }

  // Otherwise search by name or location
  const filters = {
    nom: parsed.data.nom,
    codePostal: parsed.data.codePostal,
    departement: parsed.data.departement,
    page: String(pagination.page),
    per_page: String(pagination.per_page ?? 20),
  }

  const qs = buildQueryString(filters)
  const url = `${FT_API.ENTREPRISES}${qs}`

  const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.ENTREPRISES)

  return success(data, 'Entreprises récupérées avec succès')
}

export const GET = withFTAuth(handleGET, 'GET')
