// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Événements
// Proxy POST : recherche d'événements (ateliers, forums, etc.)
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'
import { withFTAuth, validateFTPagination, ftSchemas } from '@/lib/ft-guard'
import type { FTAuthContext } from '@/lib/ft-guard'
import { z } from 'zod'

const evenementBodySchema = z.object({
  motsCles: ftSchemas.motsCles,
  codePostal: ftSchemas.codePostal,
  departement: ftSchemas.departement,
  region: ftSchemas.region,
  typeEvenement: ftSchemas.typeEvenement,
  dateDebut: ftSchemas.dateDebut,
  dateFin: ftSchemas.dateFin,
  page: z.coerce.number().int().min(1).optional().default(1),
  per_page: z.coerce.number().int().min(1).optional().default(20),
})

async function handlePOST(request: NextRequest, _ctx: FTAuthContext) {
  const raw = await request.json()
  const parsed = evenementBodySchema.safeParse(raw)

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
    typeEvenement,
    dateDebut,
    dateFin,
    page,
    per_page,
  } = parsed.data

  const pagination = validateFTPagination({ page, per_page })

  const filters = {
    motsCles,
    codePostal,
    departement,
    region,
    typeEvenement,
    dateDebut,
    dateFin,
    page: String(pagination.page),
    per_page: String(pagination.per_page ?? 20),
  }

  const qs = buildQueryString(filters)
  const url = `${FT_API.EVENEMENTS}${qs}`

  const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.EVENEMENTS)

  return success(data, 'Événements récupérés avec succès')
}

export const POST = withFTAuth(handlePOST, 'POST')
