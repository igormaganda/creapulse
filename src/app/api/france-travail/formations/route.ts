// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Formations
// Proxy GET : recherche de formations
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'
import { withFTAuth, validateFTPagination, ftSchemas } from '@/lib/ft-guard'
import type { FTAuthContext } from '@/lib/ft-guard'
import { z } from 'zod'

const formationsQuerySchema = z.object({
  motsCles: z.string().max(200).optional(),
  codePostal: z.string().regex(/^\d{5}$/).optional(),
  departement: z.string().regex(/^\d{2,3}$/).optional(),
  region: z.string().regex(/^\d{2}$/).optional(),
  domaine: z.string().max(100).optional(),
  niveau: z.string().max(50).optional(),
  certification: z.string().max(50).optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
})

async function handleGET(request: NextRequest, _ctx: FTAuthContext) {
  const { searchParams } = new URL(request.url)

  const parsed = formationsQuerySchema.safeParse({
    motsCles: searchParams.get('motsCles') || undefined,
    codePostal: searchParams.get('codePostal') || undefined,
    departement: searchParams.get('departement') || undefined,
    region: searchParams.get('region') || undefined,
    domaine: searchParams.get('domaine') || undefined,
    niveau: searchParams.get('niveau') || undefined,
    certification: searchParams.get('certification') || undefined,
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

  const filters = {
    motsCles: parsed.data.motsCles,
    codePostal: parsed.data.codePostal,
    departement: parsed.data.departement,
    region: parsed.data.region,
    domaine: parsed.data.domaine,
    niveau: parsed.data.niveau,
    certification: parsed.data.certification,
    page: String(pagination.page),
    per_page: String(pagination.per_page ?? 20),
  }

  const qs = buildQueryString(filters)
  const url = `${FT_API.FORMATIONS}${qs}`

  const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.FORMATIONS)

  return success(data, 'Formations récupérées avec succès')
}

export const GET = withFTAuth(handleGET, 'GET')
