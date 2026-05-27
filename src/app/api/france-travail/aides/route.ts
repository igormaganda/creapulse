// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Aides
// Proxy GET : recherche d'aides financières
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'
import { withFTAuth, validateFTPagination, ftSchemas } from '@/lib/ft-guard'
import type { FTAuthContext } from '@/lib/ft-guard'
import { z } from 'zod'

const aidesQuerySchema = z.object({
  motsCles: z.string().max(200).optional(),
  codePostal: z.string().regex(/^\d{5}$/).optional(),
  departement: z.string().regex(/^\d{2,3}$/).optional(),
  region: z.string().regex(/^\d{2}$/).optional(),
  typeAide: z.string().max(50).optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
})

async function handleGET(request: NextRequest, _ctx: FTAuthContext) {
  const { searchParams } = new URL(request.url)

  const parsed = aidesQuerySchema.safeParse({
    motsCles: searchParams.get('motsCles') || undefined,
    codePostal: searchParams.get('codePostal') || undefined,
    departement: searchParams.get('departement') || undefined,
    region: searchParams.get('region') || undefined,
    typeAide: searchParams.get('typeAide') || undefined,
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
    typeAide: parsed.data.typeAide,
    page: String(pagination.page),
    per_page: String(pagination.per_page ?? 20),
  }

  const qs = buildQueryString(filters)
  const url = `${FT_API.AIDES}${qs}`

  const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.AIDES)

  return success(data, 'Aides financières récupérées avec succès')
}

export const GET = withFTAuth(handleGET, 'GET')
