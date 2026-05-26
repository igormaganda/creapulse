// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Communautés
// Proxy GET : communautés de bénévoles
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'
import { withFTAuth, validateFTPagination } from '@/lib/ft-guard'
import type { FTAuthContext } from '@/lib/ft-guard'
import { z } from 'zod'

const communautesQuerySchema = z.object({
  codePostal: z.string().regex(/^\d{5}$/).optional(),
  departement: z.string().regex(/^\d{2,3}$/).optional(),
  region: z.string().regex(/^\d{2}$/).optional(),
  type: z.string().max(50).optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
})

async function handleGET(request: NextRequest, _ctx: FTAuthContext) {
  const { searchParams } = new URL(request.url)

  const parsed = communautesQuerySchema.safeParse({
    codePostal: searchParams.get('codePostal') || undefined,
    departement: searchParams.get('departement') || undefined,
    region: searchParams.get('region') || undefined,
    type: searchParams.get('type') || undefined,
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
    codePostal: parsed.data.codePostal,
    departement: parsed.data.departement,
    region: parsed.data.region,
    type: parsed.data.type,
    page: String(pagination.page),
    per_page: String(pagination.per_page ?? 20),
  }

  const qs = buildQueryString(filters)
  const url = `${FT_API.COMMUNAUTES}${qs}`

  const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.COMMUNAUTES)

  return success(data, 'Communautés récupérées avec succès')
}

export const GET = withFTAuth(handleGET, 'GET')
