// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / La Bonne Boîte (LBB)
// Proxy GET : entreprises recommandées par LBB
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'
import { withFTAuth, validateFTPagination } from '@/lib/ft-guard'
import type { FTAuthContext } from '@/lib/ft-guard'
import { z } from 'zod'

const lbbQuerySchema = z.object({
  codePostal: z.string().regex(/^\d{5}$/).optional(),
  departement: z.string().regex(/^\d{2,3}$/).optional(),
  commune: z.string().max(100).optional(),
  rome: z.string().max(10).optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
})

async function handleGET(request: NextRequest, _ctx: FTAuthContext) {
  const { searchParams } = new URL(request.url)

  const parsed = lbbQuerySchema.safeParse({
    codePostal: searchParams.get('codePostal') || undefined,
    departement: searchParams.get('departement') || undefined,
    commune: searchParams.get('commune') || undefined,
    rome: searchParams.get('rome') || undefined,
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
    commune: parsed.data.commune,
    rome: parsed.data.rome,
    page: String(pagination.page),
    per_page: String(pagination.per_page ?? 20),
  }

  const qs = buildQueryString(filters)
  const url = `${FT_API.LBB}${qs}`

  const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.LBB)

  return success(data, 'Entreprises LBB récupérées avec succès')
}

export const GET = withFTAuth(handleGET, 'GET')
